/*
 * Annapurna — rule-based dietician coach.
 *
 * Watches the day's entries, profile, targets and weight trend and produces
 * adaptive guidance cards. This engine is free, instant and offline — it is
 * tier 0 of the coaching stack; the optional AI dietician (js/ai.js) layers
 * conversational intelligence on top.
 */
(function () {
  'use strict';

  function N() { return window.Nutrition; }
  function S() { return window.Store; }
  function P() { return window.Planner; }

  /* fraction of the day's calories a typical eater has consumed by hour h */
  function expectedFraction(h) {
    if (h < 8) return 0.05;
    if (h < 11) return 0.2;
    if (h < 14) return 0.45;
    if (h < 17) return 0.55;
    if (h < 20) return 0.8;
    return 1.0;
  }

  function card(tone, icon, title, body) {
    return { tone: tone, icon: icon, title: title, body: body };
  }

  function dayComputed(date) {
    var d = S().day(date);
    var totals = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
    var items = [];
    Object.keys(d.meals).forEach(function (m) {
      d.meals[m].forEach(function (en) {
        var f = P().foodById(en.foodId);
        if (!f) return;
        var e = N().computeEntry(f, en.qty, en.style, en.extraOilTsp, en.oilId);
        totals.kcal += e.kcal; totals.protein += e.protein; totals.carbs += e.carbs;
        totals.fat += e.fat; totals.fiber += e.fiber;
        items.push({ food: f, entry: en, computed: e, meal: m });
      });
    });
    var burned = 0;
    d.exercises.forEach(function (x) { burned += x.kcal; });
    return { totals: totals, items: items, burned: burned, water: d.water };
  }

  function walkMinutesFor(kcal, weightKg) {
    // brisk walk MET 4.3
    return Math.ceil(kcal / (4.3 * 3.5 * weightKg / 200) / 5) * 5;
  }
  function skipMinutesFor(kcal, weightKg) {
    // skipping rope MET 11
    return Math.ceil(kcal / (11 * 3.5 * weightKg / 200) / 5) * 5;
  }

  function suggestFoods(pref, filterFn, count) {
    var list = window.FOODS.filter(function (f) {
      return N().dietAllows(pref, f) && filterFn(f);
    }).sort(function (a, b) { return (b.protein / b.kcal) - (a.protein / a.kcal); });
    return list.slice(0, count).map(function (f) {
      return f.name.split(' (')[0] + ' (' + f.kcal + ' kcal, ' + f.protein + ' g protein)';
    });
  }

  function generateAdvice(date, now) {
    var profile = S().profile();
    var cards = [];
    if (!profile) {
      cards.push(card('info', '👋', 'Set up your profile',
        'Tell me your goal and I can start coaching — calorie budget, protein target, and day-by-day guidance.'));
      return cards;
    }
    var t = N().macroTargets(profile);
    var goal = N().goalOf(profile);
    var dc = dayComputed(date);
    var hour = (now || new Date()).getHours();
    var frac = expectedFraction(hour);

    if (!dc.items.length) {
      cards.push(card('info', '📔', 'Nothing logged yet',
        'Log your meals as you eat — my guidance gets sharper with every entry. Your budget today is ' +
        t.kcal + ' kcal with ' + t.protein + ' g protein.'));
      return cards;
    }

    /* 1 — indulgence make-up: alcohol, sweets, deep-fried */
    var indulgent = dc.items.filter(function (it) {
      return it.food.tags.indexOf('noplan') >= 0 || it.food.role === 'sweet' || it.food.fried === 'deep';
    });
    if (indulgent.length) {
      var indulgeKcal = indulgent.reduce(function (s, it) { return s + it.computed.kcal; }, 0);
      var names = indulgent.slice(0, 3).map(function (it) { return it.food.name.split(' (')[0]; }).join(', ');
      var walk = walkMinutesFor(indulgeKcal, profile.weightKg);
      var skip = skipMinutesFor(indulgeKcal, profile.weightKg);
      cards.push(card('warn', '🍺', 'Make up for ' + names,
        'That added ~' + indulgeKcal + ' kcal of low-nutrition calories. To balance it out: a ' +
        walk + '-minute brisk walk or ' + skip + ' minutes of skipping burns it off; or keep dinner light — ' +
        'skip the rice/roti portion (~150–200 kcal) and add a salad. Also drink an extra glass of water' +
        (indulgent.some(function (it) { return it.food.tags.indexOf('noplan') >= 0; }) ? ' — alcohol dehydrates and drives late-night snacking.' : '.')));
    }

    /* 2 — budget pacing */
    var used = dc.totals.kcal - dc.burned;
    var expectedNow = t.kcal * frac;
    if (used > t.kcal * 1.02) {
      var over = Math.round(used - t.kcal);
      cards.push(card('warn', '📈', 'Over budget by ' + over + ' kcal',
        'Add movement to close the gap — a ' + walkMinutesFor(over, profile.weightKg) +
        '-minute brisk walk covers it. Tomorrow is a fresh start; one day doesn’t undo a week of consistency.'));
    } else if (frac < 1 && used > expectedNow + 250) {
      var remaining = Math.max(Math.round(t.kcal - used), 0);
      var lightMains = suggestFoods(profile.dietPref, function (f) {
        return (f.role === 'main' || f.role === 'sabzi') && f.kcal <= 180 && f.fried !== 'deep';
      }, 3);
      cards.push(card('info', '⚖️', 'Running ahead of budget',
        'You’ve used most of today’s calories early — you have ~' + remaining +
        ' kcal left. Go light for the rest of the day: ' + lightMains.join(' · ') + '.'));
    } else if (frac >= 0.8 && used < t.kcal * 0.55) {
      cards.push(card('info', '🍽️', 'Eating quite light today',
        'You’re well under budget (' + Math.round(used) + ' of ' + t.kcal +
        ' kcal). Under-eating slows progress too — make dinner a proper plate with a protein main.'));
    }

    /* 3 — protein gap, scaled to the time of day. The end-of-day trigger
       (0.6 of target) sits just below what a well-composed plant-based day
       realistically delivers, so the coach nudges a genuinely low day
       without flagging an already-good one. */
    var expectedProtein = t.protein * Math.max(frac, 0.3);
    if (dc.totals.protein < expectedProtein * 0.6) {
      var gap = Math.round(t.protein - dc.totals.protein);
      var boosters = suggestFoods(profile.dietPref, function (f) {
        return f.tags.indexOf('boost') >= 0;
      }, 3);
      cards.push(card('warn', '💪', 'Protein is falling behind',
        'You’re at ' + Math.round(dc.totals.protein) + ' g of your ' + t.protein +
        ' g target (' + gap + ' g to go). Work these into your next meal: ' + boosters.join(' · ') + '.' +
        (goal === 'recomp' || goal === 'gain' ? ' Protein is THE lever for your muscle goal — don’t end the day short.' : '')));
    } else if (dc.totals.protein >= t.protein) {
      cards.push(card('good', '🎯', 'Protein target hit',
        Math.round(dc.totals.protein) + ' g of ' + t.protein + ' g — exactly what your ' +
        (goal === 'recomp' ? 'recomposition' : goal) + ' goal needs. Keep this up.'));
    }

    /* 4 — fibre */
    if (frac >= 0.5 && dc.totals.fiber < t.fiber * frac * 0.5) {
      cards.push(card('info', '🥬', 'Low on fibre',
        'Only ' + Math.round(dc.totals.fiber) + ' g so far (target ' + t.fiber +
        ' g). Add a katori of dal, a kachumber salad, or fruit — fibre keeps you full and steadies blood sugar.'));
    }

    /* 5 — water */
    var waterGoal = N().waterTargetGlasses(profile);
    if (dc.water < Math.floor(waterGoal * frac) - 1) {
      cards.push(card('info', '💧', 'Behind on water',
        dc.water + ' of ' + waterGoal + ' glasses. Thirst often reads as hunger — have a glass before your next snack.'));
    }

    /* 6 — weight trend vs plan */
    var w = S().weights();
    if (w.length >= 4) {
      var last = w[w.length - 1], span = 0, first = null;
      for (var i = w.length - 1; i >= 0; i--) {
        var days = (new Date(last.date) - new Date(w[i].date)) / 86400000;
        if (days >= 7 && days <= 21) { first = w[i]; span = days; break; }
      }
      if (first) {
        var weeklyChange = (last.kg - first.kg) / span * 7;
        if (goal === 'lose' || goal === 'recomp') {
          if (weeklyChange <= -0.2) {
            cards.push(card('good', '📉', 'Weight trend on track',
              'Down ' + Math.abs(weeklyChange).toFixed(1) + ' kg/week over the last ' + Math.round(span) +
              ' days. The plan is working — change nothing.'));
          } else if (weeklyChange >= 0.1) {
            cards.push(card('warn', '🔁', 'Scale moving the wrong way',
              'Up ' + weeklyChange.toFixed(1) + ' kg/week recently. Tighten up: trim ~150 kcal/day ' +
              '(one roti or 2 tsp less oil) and add 15 minutes of walking. Check restaurant-style logging — hidden oil is the usual culprit.'));
          } else {
            cards.push(card('info', '⏸️', 'Weight has plateaued',
              'Roughly flat for ' + Math.round(span) + ' days. Plateaus are normal — hold steady one more week; ' +
              'if it persists, cut ~100–150 kcal/day or add one extra cardio session.'));
          }
        } else if (goal === 'gain' && weeklyChange < 0.1) {
          cards.push(card('info', '🍚', 'Not gaining yet',
            'Weight is flat while you’re trying to build. Add ~200 kcal/day — an extra katori of dal + a banana with peanut butter does it.'));
        }
      }
    }

    /* 7 — goal-specific nudge */
    if (goal === 'recomp' && !dc.burned) {
      cards.push(card('info', '🏋️', 'Recomposition needs the gym',
        'Muscle + fat-loss together only works with strength training 3–4× a week and ' +
        t.protein + ' g protein daily. Log today’s workout, or check the Workout tab for your plan.'));
    }

    if (!cards.length) {
      cards.push(card('good', '✅', 'All on track',
        'Calories, protein and water are all pacing well. Keep logging — consistency beats perfection.'));
    }
    return cards;
  }

  window.Coach = { generateAdvice: generateAdvice, dayComputed: dayComputed };
})();
