/*
 * Annapurna — diet-plan and workout-plan generators.
 *
 * The diet planner composes Indian meals the way a nutritionist plate is
 * built: breakfast main + beverage (+fruit), lunch/dinner as staple
 * (roti/rice) + dal or protein main + sabzi + side, and an evening snack.
 * Portions of the staple are scaled to hit each meal's calorie budget, and
 * a protein booster is added if the day falls short of the protein target.
 *
 * Deterministic seeded RNG so "Regenerate" gives a fresh but reproducible
 * plan.
 */
(function () {
  'use strict';
  var N = null; // window.Nutrition, resolved lazily

  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function foodById(id) {
    for (var i = 0; i < window.FOODS.length; i++) if (window.FOODS[i].id === id) return window.FOODS[i];
    return null;
  }

  function pick(pool, rnd, avoid) {
    if (!pool.length) return null;
    var fresh = avoid ? pool.filter(function (f) { return !avoid[f.id]; }) : pool;
    var from = fresh.length ? fresh : pool;
    return from[Math.floor(rnd() * from.length)];
  }

  /* Like pick(), but biased toward protein-dense choices so lunch/dinner
     mains pull the day toward the protein target while staying varied. */
  function pickProtein(pool, rnd, avoid) {
    if (!pool.length) return null;
    var fresh = avoid ? pool.filter(function (f) { return !avoid[f.id]; }) : pool;
    var from = (fresh.length ? fresh : pool).slice().sort(function (a, b) {
      return b.protein - a.protein;
    });
    return from[Math.floor(Math.pow(rnd(), 1.7) * from.length)];
  }

  function entryKcal(food, qty) { return food.kcal * qty; }

  function pools(pref) {
    var all = window.FOODS.filter(function (f) { return N.dietAllows(pref, f); });
    function by(fn) { return all.filter(fn); }
    return {
      breakfast: by(function (f) { return f.role === 'breakfast'; }),
      staples: by(function (f) { return f.role === 'staple' && f.fried !== 'deep'; }),
      mains: by(function (f) { return f.role === 'main' && f.fried !== 'deep'; }),
      sabzis: by(function (f) { return f.role === 'sabzi'; }),
      sides: by(function (f) { return f.role === 'side' && f.kcal <= 110; }),
      beverages: by(function (f) { return f.role === 'beverage' && f.kcal <= 160 && f.tags.indexOf('noplan') < 0; }),
      fruits: by(function (f) { return f.role === 'fruit'; }),
      snacks: by(function (f) { return f.role === 'snack' && f.fried !== 'deep' && f.kcal <= 260; }),
      boosters: by(function (f) { return f.tags.indexOf('boost') >= 0; })
    };
  }

  function addItem(list, food, qty) {
    list.push({ foodId: food.id, qty: Math.round(qty * 2) / 2 });
  }

  function mealTotals(items) {
    var t = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
    items.forEach(function (it) {
      var f = foodById(it.foodId);
      if (!f) return;
      var e = N.computeEntry(f, it.qty, 'standard', 0, null);
      t.kcal += e.kcal; t.protein += e.protein; t.carbs += e.carbs; t.fat += e.fat; t.fiber += e.fiber;
    });
    t.kcal = Math.round(t.kcal);
    ['protein', 'carbs', 'fat', 'fiber'].forEach(function (k) { t[k] = Math.round(t[k] * 10) / 10; });
    return t;
  }

  /* Scale the staple to fill what's left of the meal budget. Small staples
     (idli-sized) get more units; rice katoris move in halves. */
  function stapleQty(staple, remaining) {
    if (remaining <= 0) return 1;
    var q = Math.round((remaining / staple.kcal) * 2) / 2;
    var max = staple.kcal < 130 ? 4 : 3;
    return Math.min(Math.max(q, 1), max);
  }

  function buildMainMeal(P, rnd, budget, avoid) {
    var items = [];
    var main = pickProtein(P.mains, rnd, avoid);
    var used = 0;
    if (main) { addItem(items, main, 1); used += main.kcal; avoid[main.id] = true; }

    // one-plate meals (biryani, khichdi, pav bhaji…) only get a light side
    if (main && main.tags.indexOf('meal') >= 0) {
      var raita = pick(P.sides, rnd, null);
      if (raita && budget - used > raita.kcal) addItem(items, raita, 1);
      return items;
    }

    // sabzi only when there is room for it plus a small staple
    var sabzi = pick(P.sabzis, rnd, avoid);
    if (sabzi && budget - used > sabzi.kcal + 120) {
      addItem(items, sabzi, 1); used += sabzi.kcal; avoid[sabzi.id] = true;
    }
    // staple sized to the remaining budget — never a 300 kcal naan into a
    // 100 kcal gap
    var remaining = budget - used;
    var fitting = P.staples.filter(function (f) { return f.kcal <= Math.max(remaining, 130); });
    var staple = pick(fitting, rnd, avoid);
    if (staple) {
      var q = stapleQty(staple, remaining);
      addItem(items, staple, q);
      used += staple.kcal * q;
      avoid[staple.id] = true;
    }
    var side = pick(P.sides, rnd, avoid);
    if (side && budget - used > side.kcal - 20) { addItem(items, side, 1); used += side.kcal; }
    // big-surplus (gain) budgets: a second katori of the main
    if (main && budget - used > main.kcal * 0.6) { items[0].qty += 1; }
    return items;
  }

  function buildBreakfast(P, rnd, budget, avoid, proteinFirst) {
    var items = [];
    // muscle goals bias breakfast toward protein (moong/besan chilla,
    // paneer bhurji, eggs) instead of a random poha/upma
    var main = (proteinFirst ? pickProtein : pick)(P.breakfast, rnd, avoid);
    var used = 0;
    if (main) {
      var q = Math.min(Math.max(Math.round(budget * 0.7 / main.kcal), 1), main.kcal < 120 ? 4 : 2);
      addItem(items, main, q);
      used += main.kcal * q;
      avoid[main.id] = true;
      // idli/dosa get their chutney-sambar partners
      if (main.cat === 'South Indian') {
        var sambar = foodById('sambar'), chutney = foodById('coconut-chutney');
        if (sambar && N.dietAllows(P.pref, sambar) && budget - used > 160) { addItem(items, sambar, 1); used += sambar.kcal; }
        if (chutney && budget - used > 60) { addItem(items, chutney, 1); used += chutney.kcal; }
      }
    }
    var bev = pick(P.beverages, rnd, null);
    if (bev && budget - used > bev.kcal - 30) { addItem(items, bev, 1); used += bev.kcal; }
    var fruit = pick(P.fruits, rnd, avoid);
    if (fruit && budget - used > 60) { addItem(items, fruit, 1); avoid[fruit.id] = true; }
    return items;
  }

  function buildSnack(P, rnd, budget, avoid) {
    var items = [];
    var snack = pick(P.snacks, rnd, avoid);
    if (snack) { addItem(items, snack, 1); avoid[snack.id] = true; }
    var chai = foodById('masala-chai');
    if (chai && N.dietAllows(P.pref, chai) && budget - (snack ? snack.kcal : 0) > 60) {
      addItem(items, chai, 1);
    }
    return items;
  }

  function generateDietDay(profile, targets, seed) {
    N = window.Nutrition;
    var rnd = mulberry32(seed);
    var P = pools(profile.dietPref);
    P.pref = profile.dietPref;
    var avoid = {};
    var budget = targets.kcal;
    var proteinFirst = N.goalOf(profile) === 'recomp' || N.goalOf(profile) === 'gain';
    // meal split sums to ~92% — the rest is headroom for the protein
    // booster, so protein-rescued days still land on budget
    var meals = {
      breakfast: buildBreakfast(P, rnd, budget * 0.23, avoid, proteinFirst),
      lunch: buildMainMeal(P, rnd, budget * 0.32, avoid),
      snacks: buildSnack(P, rnd, budget * 0.09, avoid),
      dinner: buildMainMeal(P, rnd, budget * 0.28, avoid)
    };
    // trim overshoot: shave staple portions half a unit at a time until the
    // day sits within ~5% of budget
    var totalsPre = dayTotals(meals);
    var guard = 6;
    while (totalsPre.kcal > targets.kcal * 1.05 && guard-- > 0) {
      var trimmed = ['dinner', 'lunch'].some(function (m) {
        var items = meals[m];
        for (var ti = 0; ti < items.length; ti++) {
          var tf = foodById(items[ti].foodId);
          if (tf && tf.role === 'staple' && items[ti].qty > 1) { items[ti].qty -= 0.5; return true; }
        }
        return false;
      });
      if (!trimmed) break;
      totalsPre = dayTotals(meals);
    }

    // protein rescue: top up with substantial boosters (by absolute protein,
    // not density — one egg white never rescued anyone's macros). Two passes
    // so a dense booster (paneer, soya, tofu) can be added more than once,
    // aiming for 92% of target within a 10% calorie allowance.
    var totals = dayTotals(meals);
    var ranked = P.boosters.slice().sort(function (a, b) { return b.protein - a.protein; });
    for (var pass = 0; pass < 2 && totals.protein < targets.protein * 0.92; pass++) {
      for (var bi = 0; bi < ranked.length; bi++) {
        if (totals.protein >= targets.protein * 0.92) break;
        if (totals.kcal + ranked[bi].kcal > targets.kcal * 1.10) continue;
        meals.snacks.push({ foodId: ranked[bi].id, qty: 1 });
        totals = dayTotals(meals);
      }
    }
    // calorie top-up for surplus (gain) targets: energy-dense extras — nuts,
    // peanut butter, fruit — until the day reaches ~92% of budget
    var dense = window.FOODS.filter(function (f) {
      return N.dietAllows(profile.dietPref, f) && f.tags.indexOf('noplan') < 0 &&
        (f.role === 'snack' || f.role === 'fruit' || f.id === 'peanut-butter' || f.id === 'milk-toned') &&
        f.kcal >= 65 && f.fried !== 'deep';
    }).sort(function (a, b) { return b.kcal - a.kcal; });
    for (var ci = 0, added = 0; ci < dense.length && added < 4; ci++) {
      if (totals.kcal >= targets.kcal * 0.92) break;
      if (avoid[dense[ci].id]) continue;
      var slot = added % 2 === 0 ? 'snacks' : 'breakfast';
      meals[slot].push({ foodId: dense[ci].id, qty: 1 });
      avoid[dense[ci].id] = true;
      added++;
      totals = dayTotals(meals);
    }
    return { meals: meals, totals: totals };
  }

  function dayTotals(meals) {
    var t = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
    Object.keys(meals).forEach(function (m) {
      var mt = mealTotals(meals[m]);
      t.kcal += mt.kcal; t.protein += mt.protein; t.carbs += mt.carbs; t.fat += mt.fat; t.fiber += mt.fiber;
    });
    ['protein', 'carbs', 'fat', 'fiber'].forEach(function (k) { t[k] = Math.round(t[k] * 10) / 10; });
    return t;
  }

  function generateDietPlan(profile, seed) {
    N = window.Nutrition;
    var targets = N.macroTargets(profile);
    var days = [];
    for (var d = 0; d < 7; d++) {
      days.push(generateDietDay(profile, targets, seed * 7919 + d * 104729 + 17));
    }
    return { targets: targets, days: days };
  }

  /* ---------------- Workout planner ---------------- */

  function exById(id) {
    for (var i = 0; i < window.EXERCISES.length; i++) if (window.EXERCISES[i].id === id) return window.EXERCISES[i];
    return null;
  }

  function session(title, exId, minutes, items) {
    return { title: title, exId: exId, minutes: minutes, items: items };
  }

  var SESSIONS = {
    homeStrength: function (level) {
      var sets = level === 'beginner' ? '2 sets' : level === 'advanced' ? '4 sets' : '3 sets';
      return session('Full-body strength (bodyweight)', level === 'beginner' ? 'bodyweight' : 'bodyweight-vigorous',
        level === 'beginner' ? 30 : 40, [
          { name: 'Bodyweight squats', detail: sets + ' × 15' },
          { name: 'Push-ups (knees if needed)', detail: sets + ' × 10–12' },
          { name: 'Walking lunges', detail: sets + ' × 10 per leg' },
          { name: 'Glute bridge', detail: sets + ' × 15' },
          { name: 'Plank', detail: sets + ' × 30–45 sec' }
        ]);
    },
    gymUpper: function (level) {
      var s = level === 'beginner' ? '3 × 10' : '4 × 8–10';
      return session('Upper body strength (gym)', level === 'beginner' ? 'weights-moderate' : 'weights-vigorous', 45, [
        { name: 'Bench press / machine chest press', detail: s },
        { name: 'Lat pulldown or assisted pull-up', detail: s },
        { name: 'Seated row', detail: s },
        { name: 'Shoulder press', detail: s },
        { name: 'Biceps curl + triceps pushdown', detail: '3 × 12 each' }
      ]);
    },
    gymLower: function (level) {
      var s = level === 'beginner' ? '3 × 10' : '4 × 8–10';
      return session('Lower body strength (gym)', level === 'beginner' ? 'weights-moderate' : 'weights-vigorous', 45, [
        { name: 'Barbell / goblet squat', detail: s },
        { name: 'Romanian deadlift', detail: s },
        { name: 'Leg press', detail: s },
        { name: 'Walking lunges', detail: '3 × 10 per leg' },
        { name: 'Standing calf raise', detail: '3 × 15' }
      ]);
    },
    cardio: function (level) {
      if (level === 'beginner') return session('Steady cardio', 'walk-brisk', 35, [
        { name: 'Brisk walk', detail: '35 min at a pace where talking is possible but singing is not' }
      ]);
      if (level === 'advanced') return session('Steady cardio', 'run-10', 30, [
        { name: 'Run 10 km/h', detail: '30 min, or 8 km/h × 40 min' }
      ]);
      return session('Steady cardio', 'jog', 30, [
        { name: 'Jog 8 km/h', detail: '30 min (mix walk-jog intervals if needed)' }
      ]);
    },
    hiit: function (level) {
      return session('HIIT + core', 'hiit', level === 'beginner' ? 20 : 25, [
        { name: 'Skipping rope or high knees', detail: '8 rounds — 40 sec on / 20 sec rest' },
        { name: 'Mountain climbers', detail: '4 × 30 sec' },
        { name: 'Plank + side plank', detail: '3 rounds' }
      ]);
    },
    yoga: function () {
      return session('Yoga & mobility', 'surya-namaskar', 35, [
        { name: 'Surya namaskar', detail: '6–12 slow rounds' },
        { name: 'Standing & seated asanas', detail: '15 min (trikonasana, bhujangasana, pashchimottanasana)' },
        { name: 'Pranayama + shavasana', detail: '10 min' }
      ]);
    },
    recovery: function () {
      return session('Active recovery', 'walk-casual', 30, [
        { name: 'Easy walk', detail: '30 min, relaxed pace' },
        { name: 'Full-body stretching', detail: '10 min' }
      ]);
    }
  };

  function weeklyPattern(goal, days, place) {
    var strength = place === 'gym' ? ['gymUpper', 'gymLower'] : ['homeStrength', 'homeStrength'];
    var seq;
    if (goal === 'lose') {
      seq = [strength[0], 'cardio', strength[1], 'hiit', 'cardio', 'yoga'];
    } else if (goal === 'gain') {
      seq = [strength[0], strength[1], 'recovery', strength[0], strength[1], 'cardio'];
    } else if (goal === 'recomp') {
      // strength-first (muscle stimulus) with enough cardio for the deficit
      seq = [strength[0], strength[1], 'cardio', strength[0], 'hiit', 'yoga'];
    } else {
      seq = [strength[0], 'cardio', 'yoga', strength[1], 'hiit', 'recovery'];
    }
    return seq.slice(0, days);
  }

  var DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  function generateWorkoutPlan(profile, opts) {
    N = window.Nutrition;
    var goal = N.goalOf(profile);
    var days = Math.min(Math.max(opts.days || 4, 3), 6);
    var keys = weeklyPattern(goal, days, opts.place || 'home');
    var plan = [];
    var di = 0;
    for (var i = 0; i < 7; i++) {
      // spread sessions across the week; force one when the remaining
      // sessions need every remaining day
      if (di < keys.length && (i % Math.ceil(7 / days) === 0 || keys.length - di >= 7 - i)) {
        var s = SESSIONS[keys[di]](opts.level || 'beginner');
        var ex = exById(s.exId);
        plan.push({
          day: DAY_NAMES[i], title: s.title, items: s.items, minutes: s.minutes,
          kcal: ex ? N.exerciseKcal(ex.met, profile.weightKg, s.minutes) : 0
        });
        di++;
      } else {
        plan.push({ day: DAY_NAMES[i], title: 'Rest', items: [], minutes: 0, kcal: 0 });
      }
    }
    var weekly = 0;
    plan.forEach(function (p) { weekly += p.kcal; });
    return { goal: goal, days: plan, weeklyKcal: weekly };
  }

  window.Planner = {
    generateDietPlan: generateDietPlan,
    generateWorkoutPlan: generateWorkoutPlan,
    foodById: foodById,
    exById: exById,
    mealTotals: mealTotals
  };
})();
