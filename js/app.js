/*
 * Annapurna — application UI.
 * Views: Dashboard, Log Food, Diet Plan, Workout, Weight, Food Database,
 * Profile. All state persists via Store (localStorage).
 */
(function () {
  'use strict';
  var N = window.Nutrition, S = window.Store, P = window.Planner, C = window.Charts;

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function shiftDate(dateStr, days) {
    var p = dateStr.split('-');
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    d.setDate(d.getDate() + days);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  var toastTimer = null;
  function toast(msg) {
    var t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2200);
  }
  function dietChip(diet) {
    var label = { vegan: 'VEGAN', veg: 'VEG', egg: 'EGG', nonveg: 'NON-VEG' }[diet] || esc(diet);
    return '<span class="chip ' + esc(diet) + '">' + label + '</span>';
  }
  function clampInt(v, lo, hi, def) { var n = parseInt(v, 10); if (!isFinite(n)) n = def; return Math.min(Math.max(n, lo), hi); }
  function clampNum(v, lo, hi, def) { var n = parseFloat(v); if (!isFinite(n)) n = def; return Math.min(Math.max(n, lo), hi); }

  // Coach-card markup, shared by the Coach tab and the dashboard strip.
  // c.icon is an app-authored emoji (trusted); text fields are escaped.
  function coachCardHtml(c) {
    return '<div class="coach-card ' + esc(c.tone) + '"><div class="cc-icon">' + c.icon + '</div>' +
      '<div class="cc-text"><div class="cc-title">' + esc(c.title) + '</div>' +
      '<div class="cc-body">' + esc(c.body) + '</div></div></div>';
  }

  // An exercise entry's display name and detail, used by the dashboard list
  // and the workout tracker. AI-detected custom moves have no exId, so fall
  // back to the stored (sanitized) name.
  function exName(x) {
    var ex = P.exById(x.exId);
    return ex ? ex.name : (x.name || x.exId || 'Exercise');
  }
  function exDetailText(x) {
    if (x.sets && x.reps) {
      var s = x.sets + ' × ' + x.reps;
      if (x.weightKg) s += ' @ ' + x.weightKg + ' kg';
      else s += ' (bodyweight)';
      return s + ' · ' + (x.minutes || 0) + ' min';
    }
    return (x.minutes || 0) + ' min';
  }

  /* ---------------- tabs ---------------- */
  var currentDate = todayStr();
  function switchView(name) {
    document.querySelectorAll('.view').forEach(function (v) { v.classList.remove('active'); });
    document.querySelectorAll('#tabs button').forEach(function (b) {
      b.classList.toggle('active', b.dataset.view === name);
    });
    $('view-' + name).classList.add('active');
    if (name !== 'workout') stopCamera();
    if (name === 'dashboard') renderDashboard();
    if (name === 'weight') renderWeight();
    if (name === 'database') renderDatabase();
    if (name === 'dietplan') renderDietTargets();
    if (name === 'log') { renderFoodSearch(); renderLogPanel(); }
    if (name === 'coach') renderCoach();
    if (name === 'workout') renderWorkoutView();
  }
  $('tabs').addEventListener('click', function (e) {
    if (e.target.dataset && e.target.dataset.view) switchView(e.target.dataset.view);
  });

  /* ---------------- profile ---------------- */
  function fillSelect(sel, list, valueKey, nameKey) {
    sel.innerHTML = list.map(function (o) {
      return '<option value="' + esc(o[valueKey]) + '">' + esc(o[nameKey]) + '</option>';
    }).join('');
  }

  function initProfileForm() {
    fillSelect($('pf-activity'), N.ACTIVITY, 'id', 'name');
    fillSelect($('pf-goalmode'), N.GOAL_MODES, 'id', 'name');
    fillSelect($('pf-pace'), N.PACES, 'id', 'name');
    fillSelect($('pf-diet'), N.DIET_PREFS, 'id', 'name');
    var p = S.profile();
    if (p) {
      $('pf-name').value = p.name || '';
      $('pf-sex').value = p.sex;
      $('pf-age').value = p.age;
      $('pf-height').value = p.heightCm;
      $('pf-weight').value = p.weightKg;
      $('pf-goal').value = p.goalWeightKg;
      $('pf-activity').value = p.activity;
      $('pf-goalmode').value = p.goalMode || 'auto';
      $('pf-pace').value = p.pace;
      $('pf-diet').value = p.dietPref;
      renderProfileSummary(p);
    }
  }

  function readProfileForm() {
    var num = function (id, lo, hi) {
      var v = parseFloat($(id).value);
      if (isNaN(v)) return null;
      return Math.min(Math.max(v, lo), hi);
    };
    var age = num('pf-age', 13, 100), h = num('pf-height', 120, 230),
      w = num('pf-weight', 30, 250), g = num('pf-goal', 30, 250);
    if (age == null || h == null || w == null || g == null) return null;
    return {
      name: $('pf-name').value.trim(),
      sex: $('pf-sex').value,
      age: age, heightCm: h, weightKg: w, goalWeightKg: g,
      activity: $('pf-activity').value,
      goalMode: $('pf-goalmode').value,
      pace: $('pf-pace').value,
      dietPref: $('pf-diet').value
    };
  }

  function renderProfileSummary(p) {
    var t = N.macroTargets(p);
    var goal = N.goalOf(p);
    var goalText = goal === 'lose' ? 'Lose ' + (Math.round((p.weightKg - p.goalWeightKg) * 10) / 10) + ' kg'
      : goal === 'gain' ? 'Gain ' + (Math.round((p.goalWeightKg - p.weightKg) * 10) / 10) + ' kg'
        : goal === 'recomp' ? 'Recomposition — build muscle & lose fat (mild deficit, high protein)'
          : 'Maintain weight';
    var b = N.bmi(p);
    $('pf-summary').innerHTML =
      '<div class="stat-row">' +
      '<div class="stat"><div class="value">' + N.bmr(p) + '</div><div class="label">BMR (kcal)</div></div>' +
      '<div class="stat"><div class="value">' + N.tdee(p) + '</div><div class="label">TDEE (kcal)</div></div>' +
      '<div class="stat"><div class="value">' + t.kcal + '</div><div class="label">Daily budget (kcal)</div></div>' +
      '<div class="stat"><div class="value">' + b + '</div><div class="label">BMI — ' + esc(N.bmiClass(b)) + ' (Asian-Indian cutoffs)</div></div>' +
      '</div>' +
      '<p class="hint" style="margin-top:10px">Goal: <strong>' + esc(goalText) + '</strong> · ' +
      'Macros: <strong>' + t.protein + ' g protein · ' + t.carbs + ' g carbs · ' + t.fat + ' g fat · ' + t.fiber + ' g fibre</strong> · ' +
      'Water: <strong>' + N.waterTargetGlasses(p) + ' glasses (250 ml)</strong></p>';
  }

  $('pf-save').addEventListener('click', function () {
    var p = readProfileForm();
    if (!p) { toast('Please fill age, height and weights with valid numbers'); return; }
    S.setProfile(p);
    if (!S.weights().length) S.addWeight(todayStr(), p.weightKg);
    renderProfileSummary(p);
    toast('Profile saved — your daily budget is ready');
    renderDashboard();
  });

  /* ---------------- dashboard ---------------- */
  var MEAL_NAMES = { breakfast: 'Breakfast', lunch: 'Lunch', snacks: 'Snacks', dinner: 'Dinner' };

  function dayNutrition(date) {
    var d = S.day(date);
    var totals = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
    var perMeal = {};
    Object.keys(d.meals).forEach(function (m) {
      perMeal[m] = { kcal: 0, items: [] };
      d.meals[m].forEach(function (en, idx) {
        var f = P.foodById(en.foodId);
        if (!f) return;
        var e = N.computeEntry(f, en.qty, en.style, en.extraOilTsp, en.oilId);
        totals.kcal += e.kcal; totals.protein += e.protein; totals.carbs += e.carbs;
        totals.fat += e.fat; totals.fiber += e.fiber;
        perMeal[m].kcal += e.kcal;
        perMeal[m].items.push({ entry: en, food: f, computed: e, index: idx });
      });
    });
    var burned = 0;
    d.exercises.forEach(function (x) { burned += x.kcal; });
    return { totals: totals, perMeal: perMeal, burned: burned, water: d.water, exercises: d.exercises };
  }

  // Energy-balance hero: calorie ring (remaining in center) + in/out numbers
  // + a budget scale bar. Uses net = eaten − exercise burned against budget.
  function renderEnergyHero(p, budget, eaten, burned, net, remaining) {
    $('he-eaten').textContent = Math.round(eaten);
    $('he-burned').textContent = Math.round(burned);
    $('he-net').textContent = Math.round(net);
    var over = net > budget;
    var frac = budget > 0 ? net / budget : 0;
    C.ring($('dash-ring'), Math.max(frac, 0),
      over ? String(Math.round(net - budget)) : String(Math.max(remaining, 0)),
      over ? 'over budget' : 'kcal left', over);
    var fill = $('he-scale-fill');
    fill.style.width = Math.min(Math.max(frac, 0) * 100, 100) + '%';
    fill.classList.toggle('over', over);
    var cap;
    if (!p) {
      cap = 'Set up your <strong>profile</strong> to get a calorie budget tailored to your goal.';
    } else if (over) {
      cap = 'Over by <strong>' + Math.round(net - budget) + ' kcal</strong> — a brisk walk or a lighter dinner rebalances it.';
    } else {
      cap = 'You have <strong>' + Math.max(remaining, 0) + ' kcal</strong> left of your <strong>' + budget + '</strong> budget today.';
    }
    if (p && burned > 0) cap += ' Exercise bought back <strong>' + Math.round(burned) + ' kcal</strong>.';
    $('he-scale-cap').innerHTML = cap; // numbers only — safe
  }

  function renderDashboardCoach() {
    var cards = window.Coach.generateAdvice(currentDate).slice(0, 3);
    $('dash-coach-cards').innerHTML = cards.map(coachCardHtml).join('');
  }

  $('dash-ai-insight').addEventListener('click', function () {
    var out = $('dash-ai-out');
    var btn = this;
    if (!window.AI.hasKey()) {
      toast('Connect your Anthropic key in the Coach tab for AI insights');
      switchView('coach');
      return;
    }
    out.classList.remove('hidden');
    out.textContent = 'Thinking through your day (Claude Haiku)…';
    btn.disabled = true;
    window.AI.ask(window.AI.PROMPTS.checkin, 'quick').then(function (text) {
      out.textContent = text; btn.disabled = false;
    }, function (err) {
      out.textContent = err && err.message === 'no-profile'
        ? 'Set up your profile first — the dietician needs your goals and logs.'
        : 'Could not reach the AI dietician: ' + (err && err.message ? err.message : 'unknown error');
      btn.disabled = false;
    });
  });

  function renderDashboard() {
    $('dash-date').value = currentDate;
    var p = S.profile();
    var dn = dayNutrition(currentDate);
    var t = p ? N.macroTargets(p) : null;
    var budget = t ? t.kcal : 2000;
    var eaten = dn.totals.kcal;
    var burned = dn.burned;
    var net = eaten - burned;
    var remaining = Math.round(budget - net);
    renderEnergyHero(p, budget, eaten, burned, net, remaining);
    renderDashboardCoach();

    // macro donut + bars
    var segs = [
      { label: 'Protein', grams: Math.round(dn.totals.protein), kcal: dn.totals.protein * 4, cssVar: '--series-1' },
      { label: 'Carbs', grams: Math.round(dn.totals.carbs), kcal: dn.totals.carbs * 4, cssVar: '--series-2' },
      { label: 'Fat', grams: Math.round(dn.totals.fat), kcal: dn.totals.fat * 9, cssVar: '--series-3' }
    ];
    C.donut($('dash-donut'), segs, String(Math.round(dn.totals.kcal)), 'kcal eaten');
    $('dash-legend').innerHTML = segs.map(function (s) {
      return '<span><span class="sw" style="background:var(' + s.cssVar + ')"></span>' + s.label + ' ' + s.grams + ' g</span>';
    }).join('');

    var bars = '';
    [['Protein', 'protein', dn.totals.protein, t ? t.protein : 0],
     ['Carbs', 'carbs', dn.totals.carbs, t ? t.carbs : 0],
     ['Fat', 'fat', dn.totals.fat, t ? t.fat : 0],
     ['Fibre', 'fiber', dn.totals.fiber, t ? t.fiber : 0]].forEach(function (row) {
      var pct = row[3] ? Math.min(row[2] / row[3] * 100, 100) : 0;
      var over = row[3] && row[2] > row[3] * 1.15;
      bars += '<div class="bar-row">' + row[0] +
        '<span class="bar-nums">' + Math.round(row[2]) + (row[3] ? ' / ' + row[3] : '') + ' g</span>' +
        '<div class="bar ' + row[1] + (over ? ' over' : '') + '"><span style="width:' + pct + '%"></span></div></div>';
    });
    $('dash-macro-bars').innerHTML = bars;

    // water
    var goalGlasses = p ? N.waterTargetGlasses(p) : 8;
    var wg = '';
    for (var i = 0; i < Math.max(goalGlasses, dn.water); i++) {
      wg += '<div class="glass' + (i < dn.water ? ' full' : '') + '"></div>';
    }
    $('water-glasses').innerHTML = wg;
    $('water-hint').textContent = dn.water + ' of ' + goalGlasses + ' glasses (250 ml each)';

    // exercises
    $('dash-exercises').innerHTML = dn.exercises.length
      ? dn.exercises.map(function (x, i) {
        return '<div class="entry-row"><span class="entry-name">' + esc(exName(x)) +
          ' <span class="entry-detail">' + esc(exDetailText(x)) + '</span></span>' +
          '<span class="entry-kcal">−' + esc(x.kcal) + ' kcal</span>' +
          '<button class="icon-btn" data-ex-del="' + i + '" aria-label="Delete exercise">✕</button></div>';
      }).join('')
      : '<p class="hint">Nothing logged yet.</p>';

    // meals
    var mealsHtml = '';
    Object.keys(MEAL_NAMES).forEach(function (m) {
      var pm = dn.perMeal[m];
      mealsHtml += '<div class="meal-block"><div class="meal-head"><h3>' + MEAL_NAMES[m] + '</h3>' +
        '<span class="kcal">' + Math.round(pm.kcal) + ' kcal</span></div>';
      if (!pm.items.length) {
        mealsHtml += '<p class="hint">Empty — add from Log Food.</p>';
      } else {
        pm.items.forEach(function (it) {
          var extra = [];
          if (it.entry.style && it.entry.style !== 'standard' && it.food.oil) {
            extra.push(it.entry.style === 'light' ? 'light oil' : 'restaurant-style');
          }
          if (it.entry.extraOilTsp) extra.push('+' + it.entry.extraOilTsp + ' tsp oil');
          var qtyText = it.entry.inputGrams ? esc(it.entry.inputGrams) + ' g' : '× ' + esc(it.entry.qty);
          mealsHtml += '<div class="entry-row"><span class="entry-name">' + esc(it.food.name) +
            ' <span class="entry-detail">' + qtyText + (extra.length ? ' · ' + esc(extra.join(', ')) : '') + '</span></span>' +
            '<span class="entry-kcal">' + it.computed.kcal + ' kcal</span>' +
            '<button class="icon-btn" data-meal="' + m + '" data-del="' + it.index + '" aria-label="Delete entry">✕</button></div>';
        });
      }
      mealsHtml += '</div>';
    });
    $('dash-meals').innerHTML = mealsHtml;
  }

  $('dash-date').addEventListener('change', function () { currentDate = this.value || todayStr(); renderDashboard(); });
  $('dash-prev').addEventListener('click', function () { currentDate = shiftDate(currentDate, -1); renderDashboard(); });
  $('dash-next').addEventListener('click', function () { currentDate = shiftDate(currentDate, 1); renderDashboard(); });
  $('dash-today').addEventListener('click', function () { currentDate = todayStr(); renderDashboard(); });

  $('dash-meals').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-del]');
    if (!b) return;
    S.removeFood(currentDate, b.dataset.meal, parseInt(b.dataset.del, 10));
    renderDashboard();
  });
  $('dash-exercises').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-ex-del]');
    if (!b) return;
    S.removeExercise(currentDate, parseInt(b.dataset.exDel, 10));
    renderDashboard();
  });

  $('water-plus').addEventListener('click', function () {
    S.setWater(currentDate, S.day(currentDate).water + 1); renderDashboard();
  });
  $('water-minus').addEventListener('click', function () {
    S.setWater(currentDate, S.day(currentDate).water - 1); renderDashboard();
  });

  // exercise logging
  function initExerciseSelect() {
    var groups = {};
    window.EXERCISES.forEach(function (x) {
      if (x.strength) return; // strength is logged by sets/reps in the Workout tab
      (groups[x.cat] = groups[x.cat] || []).push(x);
    });
    $('ex-select').innerHTML = Object.keys(groups).map(function (cat) {
      return '<optgroup label="' + esc(cat) + '">' + groups[cat].map(function (x) {
        return '<option value="' + esc(x.id) + '">' + esc(x.name) + '</option>';
      }).join('') + '</optgroup>';
    }).join('');
  }
  $('ex-add').addEventListener('click', function () {
    var p = S.profile();
    if (!p) { toast('Set up your profile first (for weight-based burn)'); switchView('profile'); return; }
    var ex = P.exById($('ex-select').value);
    var minutes = Math.min(Math.max(parseInt($('ex-minutes').value, 10) || 30, 5), 300);
    var kcal = N.exerciseKcal(ex.met, p.weightKg, minutes);
    S.addExercise(currentDate, { exId: ex.id, minutes: minutes, kcal: kcal });
    toast('Logged: ' + ex.name + ' — ' + kcal + ' kcal');
    renderDashboard();
  });

  /* ---------------- food search & log modal ---------------- */
  var modalFood = null;

  function foodMatches(f, q) {
    if (!q) return true;
    q = q.toLowerCase();
    if (f.name.toLowerCase().indexOf(q) >= 0) return true;
    for (var i = 0; i < f.aka.length; i++) if (f.aka[i].toLowerCase().indexOf(q) >= 0) return true;
    return f.cat.toLowerCase().indexOf(q) >= 0;
  }

  function categories() {
    var seen = {}, cats = [];
    window.FOODS.forEach(function (f) { if (!seen[f.cat]) { seen[f.cat] = 1; cats.push(f.cat); } });
    return cats;
  }

  function initFoodFilters() {
    var opts = '<option value="all">All categories</option>' + categories().map(function (c) {
      return '<option value="' + esc(c) + '">' + esc(c) + '</option>';
    }).join('');
    $('log-cat').innerHTML = opts;
    $('db-cat').innerHTML = opts;
  }

  function renderFoodSearch() {
    var q = $('log-search').value.trim();
    var cat = $('log-cat').value;
    var pref = $('log-diet-filter').value;
    var list = window.FOODS.filter(function (f) {
      if (cat && cat !== 'all' && f.cat !== cat) return false;
      if (pref !== 'all' && !N.dietAllows(pref, f)) return false;
      return foodMatches(f, q);
    });
    $('log-count').textContent = list.length + ' foods';
    $('log-results').innerHTML = list.slice(0, 80).map(function (f) {
      return '<div class="food-item" data-food="' + esc(f.id) + '">' +
        '<div><div class="fi-name">' + esc(f.name) + dietChip(f.diet) + '</div>' +
        '<div class="fi-meta">' + esc(f.unit) + ' · ' + esc(f.cat) +
        (f.oil ? ' · oil-adjustable' : '') + (f.fried === 'deep' ? ' · deep-fried' : '') + '</div></div>' +
        '<div class="fi-kcal">' + f.kcal + ' kcal · P ' + f.protein + '</div></div>';
    }).join('') || '<p class="hint" style="padding:12px 0">No foods match — try a different spelling or an alternate name (e.g. “chole” vs “chana”).</p>';
  }
  // 'input' for the text box, 'change' for selects — registering both on the
  // text box makes the pending 'change' fire mid-click and re-render the list
  // under the pointer, swallowing the tap.
  $('log-search').addEventListener('input', renderFoodSearch);
  $('log-cat').addEventListener('change', renderFoodSearch);
  $('log-diet-filter').addEventListener('change', renderFoodSearch);
  $('log-results').addEventListener('click', function (e) {
    var row = e.target.closest('.food-item');
    if (row) openFoodModal(row.dataset.food);
  });

  function initModalSelects() {
    fillSelect($('fm-style'), window.COOK_STYLES, 'id', 'name');
    $('fm-style').value = 'standard';
    fillSelect($('fm-oil-type'), window.OIL_TYPES, 'id', 'name');
    $('fm-oil-type').value = 'sunflower';
  }

  // Clamp helpers — the modal inputs declare min/max in HTML but the browser
  // doesn't enforce them on typed values, so a user can type -5 or 99999.
  // A negative servings/oil value would log negative calories and corrupt
  // every downstream total, so clamp to sane positive ranges here.
  function clampGrams(g) { return Math.min(Math.max(g, 1), 5000); }
  function clampServings(q) {
    if (!isFinite(q) || q <= 0) return 1;
    return Math.min(q, 50);
  }
  function currentModalQty() {
    if ($('fm-mode').value === 'grams') {
      var g = clampGrams(parseFloat($('fm-grams').value) || modalFood.grams);
      return Math.max(Math.round(g / modalFood.grams * 100) / 100, 0.01);
    }
    return clampServings(parseFloat($('fm-qty').value));
  }

  function syncModalMode() {
    var grams = $('fm-mode').value === 'grams';
    $('fm-qty-field').classList.toggle('hidden', grams);
    $('fm-grams-field').classList.toggle('hidden', !grams);
  }

  function openFoodModal(foodId) {
    modalFood = P.foodById(foodId);
    if (!modalFood) return;
    $('fm-name').innerHTML = esc(modalFood.name) + dietChip(modalFood.diet);
    $('fm-serving').textContent = 'Serving: ' + modalFood.unit + ' (' + modalFood.grams + ' g) · ' +
      modalFood.kcal + ' kcal standard';
    $('fm-qty').value = 1;
    $('fm-mode').value = 'servings';
    $('fm-grams').value = modalFood.grams;
    syncModalMode();
    $('fm-style').value = 'standard';
    $('fm-oil-tsp').value = 0;
    $('fm-oil-section').classList.toggle('hidden', !modalFood.oil && modalFood.role !== 'ingredient');
    // Cooking-style multiplier only affects oil-sensitive cooked dishes; hide
    // it for raw ingredients (where it's a dead control) but keep the
    // extra-oil field, which does apply.
    var styleField = $('fm-style').closest('.field');
    if (styleField) styleField.classList.toggle('hidden', !modalFood.oil);
    // suggest the meal by time of day
    var h = new Date().getHours();
    $('fm-meal').value = h < 11 ? 'breakfast' : h < 15 ? 'lunch' : h < 19 ? 'snacks' : 'dinner';
    updateModalKcal();
    $('food-modal-backdrop').classList.remove('hidden');
  }

  function updateModalKcal() {
    if (!modalFood) return;
    var e = N.computeEntry(modalFood, currentModalQty(), $('fm-style').value,
      parseFloat($('fm-oil-tsp').value) || 0, $('fm-oil-type').value);
    $('fm-kcal').textContent = e.kcal + ' kcal';
    $('fm-macros').textContent = 'P ' + e.protein + ' g · C ' + e.carbs + ' g · F ' + e.fat + ' g · fibre ' + e.fiber + ' g · ' + e.grams + ' g';
  }
  ['fm-qty', 'fm-grams', 'fm-style', 'fm-oil-tsp', 'fm-oil-type'].forEach(function (id) {
    $(id).addEventListener('input', updateModalKcal);
    $(id).addEventListener('change', updateModalKcal);
  });
  $('fm-mode').addEventListener('change', function () { syncModalMode(); updateModalKcal(); });
  $('fm-cancel').addEventListener('click', function () { $('food-modal-backdrop').classList.add('hidden'); });
  $('food-modal-backdrop').addEventListener('click', function (e) {
    if (e.target === this) this.classList.add('hidden');
  });
  $('fm-add').addEventListener('click', function () {
    if (!modalFood) return;
    var gramsMode = $('fm-mode').value === 'grams';
    var oilTsp = parseFloat($('fm-oil-tsp').value);
    var entry = {
      foodId: modalFood.id,
      qty: currentModalQty(),
      inputGrams: gramsMode ? clampGrams(parseFloat($('fm-grams').value) || modalFood.grams) : null,
      style: $('fm-style').value,
      extraOilTsp: Math.min(Math.max(isFinite(oilTsp) ? oilTsp : 0, 0), 6),
      oilId: $('fm-oil-type').value
    };
    S.addFood(currentDate, $('fm-meal').value, entry);
    $('food-modal-backdrop').classList.add('hidden');
    toast('Added ' + modalFood.name + ' to ' + MEAL_NAMES[$('fm-meal').value]);
    renderDashboard();
    renderLogPanel();
  });

  /* ---------------- log panel (today so far) ---------------- */
  function renderLogPanel() {
    var p = S.profile();
    var dn = dayNutrition(currentDate);
    var t = p ? N.macroTargets(p) : null;
    $('log-panel-title').textContent = currentDate === todayStr() ? 'Today so far' : currentDate + ' so far';

    var remaining = t ? Math.round(t.kcal - dn.totals.kcal + dn.burned) : null;
    var summary = '<div class="lp-kcal"><strong>' + Math.round(dn.totals.kcal) + '</strong> kcal eaten';
    if (t) {
      summary += remaining < 0
        ? ' · <span class="lp-over">' + Math.abs(remaining) + ' over budget</span>'
        : ' · <span class="lp-left">' + remaining + ' left</span>';
    }
    summary += '</div>';
    if (t) {
      [['Protein', 'protein', dn.totals.protein, t.protein],
       ['Carbs', 'carbs', dn.totals.carbs, t.carbs],
       ['Fat', 'fat', dn.totals.fat, t.fat]].forEach(function (row) {
        var pct = Math.min(row[2] / row[3] * 100, 100);
        summary += '<div class="bar-row">' + row[0] +
          '<span class="bar-nums">' + Math.round(row[2]) + ' / ' + row[3] + ' g</span>' +
          '<div class="bar ' + row[1] + '"><span style="width:' + pct + '%"></span></div></div>';
      });
    }
    $('log-panel-summary').innerHTML = summary;

    var html = '';
    Object.keys(MEAL_NAMES).forEach(function (m) {
      var pm = dn.perMeal[m];
      if (!pm.items.length) return;
      html += '<div class="lp-meal"><div class="pm-title">' + MEAL_NAMES[m] +
        ' <span class="bar-nums">' + Math.round(pm.kcal) + ' kcal</span></div>';
      pm.items.forEach(function (it) {
        var qtyText = it.entry.inputGrams ? esc(it.entry.inputGrams) + ' g' : '× ' + esc(it.entry.qty);
        html += '<div class="entry-row"><span class="entry-name">' + esc(it.food.name.split(' (')[0]) +
          ' <span class="entry-detail">' + qtyText + '</span></span>' +
          '<span class="entry-kcal">' + it.computed.kcal + '</span>' +
          '<button class="icon-btn" data-meal="' + m + '" data-del="' + it.index + '" aria-label="Remove">✕</button></div>';
      });
      html += '</div>';
    });
    $('log-panel-meals').innerHTML = html || '<p class="hint">Nothing logged yet — everything you add shows up here instantly.</p>';
  }
  $('log-panel-meals').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-del]');
    if (!b) return;
    S.removeFood(currentDate, b.dataset.meal, parseInt(b.dataset.del, 10));
    renderLogPanel();
    renderDashboard();
  });

  /* ---------------- coach & AI dietician ---------------- */
  function renderCoach() {
    var cards = window.Coach.generateAdvice(currentDate);
    $('coach-cards').innerHTML = cards.map(coachCardHtml).join('');
    var has = window.AI.hasKey();
    $('ai-locked').classList.toggle('hidden', has);
    $('ai-unlocked').classList.toggle('hidden', !has);
  }

  function aiButtonsDisabled(state) {
    ['ai-checkin', 'ai-weekly', 'ai-ask'].forEach(function (id) { $(id).disabled = state; });
  }

  function aiRun(promptText, tier) {
    var out = $('ai-output');
    out.classList.remove('hidden');
    out.textContent = tier === 'deep'
      ? 'Reviewing your last two weeks (Claude Sonnet)…'
      : 'Checking your day (Claude Haiku)…';
    aiButtonsDisabled(true);
    window.AI.ask(promptText, tier).then(function (text) {
      out.textContent = text; // textContent keeps any model output inert
      aiButtonsDisabled(false);
    }, function (err) {
      out.textContent = err && err.message === 'no-profile'
        ? 'Set up your profile first — the dietician needs your goals and logs.'
        : 'Could not reach the AI dietician: ' + (err && err.message ? err.message : 'unknown error');
      aiButtonsDisabled(false);
    });
  }

  $('ai-key-save').addEventListener('click', function () {
    var k = $('ai-key-input').value.trim();
    if (!k) { toast('Paste your Anthropic API key first'); return; }
    var remember = $('ai-key-remember').checked;
    window.AI.setKey(k, remember);
    $('ai-key-input').value = '';
    toast(remember ? 'AI dietician connected' : 'Connected for this session only');
    renderCoach();
  });
  $('ai-key-clear').addEventListener('click', function () {
    window.AI.setKey('');
    $('ai-output').classList.add('hidden');
    toast('Key removed from this browser');
    renderCoach();
  });
  $('ai-checkin').addEventListener('click', function () { aiRun(window.AI.PROMPTS.checkin, 'quick'); });
  $('ai-weekly').addEventListener('click', function () { aiRun(window.AI.PROMPTS.weekly, 'deep'); });
  $('ai-ask').addEventListener('click', function () {
    var q = $('ai-question').value.trim();
    if (!q) { toast('Type a question first'); return; }
    aiRun(q, $('ai-deep').checked ? 'deep' : 'quick');
  });

  /* ---------------- diet plan ---------------- */
  var dietSeed = 1;
  var lastPlan = null;
  var loggedDays = {}; // guards against double-logging a plan day to the diary

  function renderDietTargets() {
    var p = S.profile();
    if (!p) {
      $('diet-targets').innerHTML = 'Set up your <a href="#" id="diet-goto-profile">profile</a> first — the plan is built from your calorie budget.';
      var a = $('diet-goto-profile');
      if (a) a.addEventListener('click', function (e) { e.preventDefault(); switchView('profile'); });
      return;
    }
    var t = N.macroTargets(p);
    $('diet-targets').innerHTML = 'Daily targets — <strong>' + t.kcal + ' kcal · ' +
      t.protein + ' g protein · ' + t.carbs + ' g carbs · ' + t.fat + ' g fat · ' + t.fiber + ' g fibre</strong>' +
      ' · Diet: <strong>' + esc(p.dietPref) + '</strong>';
  }

  function renderDietPlan() {
    var p = S.profile();
    if (!p) { toast('Set up your profile first'); switchView('profile'); return; }
    lastPlan = P.generateDietPlan(p, dietSeed);
    loggedDays = {};
    var html = '';
    var DAY_LABEL = ['Day 1 — Monday', 'Day 2 — Tuesday', 'Day 3 — Wednesday', 'Day 4 — Thursday', 'Day 5 — Friday', 'Day 6 — Saturday', 'Day 7 — Sunday'];
    lastPlan.days.forEach(function (day, di) {
      html += '<div class="plan-day"><h3>' + DAY_LABEL[di] +
        '<span class="kcal">' + day.totals.kcal + ' kcal · P ' + day.totals.protein + ' · C ' + day.totals.carbs + ' · F ' + day.totals.fat + '</span></h3>';
      Object.keys(MEAL_NAMES).forEach(function (m) {
        var items = day.meals[m];
        if (!items.length) return;
        html += '<div class="plan-meal"><div class="pm-title">' + MEAL_NAMES[m] + '</div><ul>';
        items.forEach(function (it) {
          var f = P.foodById(it.foodId);
          if (!f) return;
          var e = N.computeEntry(f, it.qty, 'standard', 0, null);
          html += '<li><span>' + esc(f.name) + (it.qty !== 1 ? ' × ' + it.qty : '') + '</span>' +
            '<span class="li-kcal">' + e.kcal + ' kcal</span></li>';
        });
        html += '</ul></div>';
      });
      html += '<div class="plan-actions"><button class="btn secondary small" data-log-day="' + di + '">Log this day to today’s diary</button></div></div>';
    });
    $('diet-plan-days').innerHTML = html;
  }

  $('diet-generate').addEventListener('click', function () { dietSeed = 1; renderDietPlan(); });
  $('diet-regenerate').addEventListener('click', function () { dietSeed += 1; renderDietPlan(); });
  $('diet-plan-days').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-log-day]');
    if (!b || !lastPlan) return;
    var di = parseInt(b.dataset.logDay, 10);
    if (loggedDays[di] && !confirm('You already added this day to today’s diary. Add it again?')) return;
    var day = lastPlan.days[di];
    Object.keys(day.meals).forEach(function (m) {
      day.meals[m].forEach(function (it) {
        S.addFood(todayStr(), m, { foodId: it.foodId, qty: it.qty, style: 'standard', extraOilTsp: 0, oilId: null });
      });
    });
    loggedDays[di] = true;
    b.textContent = 'Added ✓ — tap to add again';
    if (currentDate === todayStr()) { renderDashboard(); renderLogPanel(); }
    toast('Plan logged to today’s diary');
  });

  /* ---------------- workout tracker (manual / camera / photo-video) ---------------- */
  var woMode = 'manual';       // manual | camera | upload
  var woStream = null;         // active MediaStream when the camera is on
  var woFile = null;           // selected upload file
  var woDetected = null;       // { name, met, isStrength } for an AI-detected custom move

  // MET fallback when a detected exercise isn't in our library, by
  // category × intensity (Compendium-style values).
  var MET_TABLE = {
    strength: { light: 3.5, moderate: 5.0, vigorous: 6.0 },
    bodyweight: { light: 3.8, moderate: 5.0, vigorous: 8.0 },
    cardio: { light: 4.0, moderate: 7.0, vigorous: 10.0 },
    yoga: { light: 2.5, moderate: 3.5, vigorous: 4.0 },
    sport: { light: 4.5, moderate: 6.5, vigorous: 8.0 }
  };
  function metFor(cat, intensity) {
    var row = MET_TABLE[cat] || MET_TABLE.strength;
    return row[intensity] || row.moderate;
  }

  function initWorkoutSelect() {
    var groups = {};
    window.EXERCISES.forEach(function (x) { (groups[x.cat] = groups[x.cat] || []).push(x); });
    // strength groups first so sets/reps logging is the front door
    var cats = Object.keys(groups).sort(function (a, b) {
      return (a.indexOf('Strength') >= 0 ? 0 : 1) - (b.indexOf('Strength') >= 0 ? 0 : 1);
    });
    $('wo-ex').innerHTML = cats.map(function (cat) {
      return '<optgroup label="' + esc(cat) + '">' + groups[cat].map(function (x) {
        return '<option value="' + esc(x.id) + '">' + esc(x.name) + '</option>';
      }).join('') + '</optgroup>';
    }).join('');
    var firstStrength = window.EXERCISES.filter(function (x) { return x.strength; })[0];
    if (firstStrength) $('wo-ex').value = firstStrength.id;
  }

  function setDetectedOption(name) {
    var sel = $('wo-ex');
    var opt = sel.querySelector('option[value="__detected"]');
    if (!opt) { opt = document.createElement('option'); opt.value = '__detected'; sel.insertBefore(opt, sel.firstChild); }
    opt.textContent = '🔎 Detected: ' + name; // textContent — inert
  }

  function selectedWorkoutEx() {
    var v = $('wo-ex').value;
    if (v === '__detected' && woDetected) {
      return { id: '', name: woDetected.name, met: woDetected.met, strength: woDetected.isStrength, muscle: null };
    }
    return P.exById(v);
  }
  function isStrengthSelected() {
    var ex = selectedWorkoutEx();
    return ex ? !!ex.strength : false;
  }

  function updateWorkoutPreview() {
    var p = S.profile();
    var ex = selectedWorkoutEx();
    if (!ex) { $('wo-kcal').textContent = ''; $('wo-kcal-detail').textContent = ''; return; }
    var bodyKg = p ? p.weightKg : 70;
    if (isStrengthSelected()) {
      var r = N.strengthKcal(ex.met, bodyKg,
        clampInt($('wo-sets').value, 1, 20, 3), clampInt($('wo-reps').value, 1, 100, 10),
        clampNum($('wo-weight').value, 0, 500, 0));
      $('wo-kcal').textContent = '≈ ' + r.kcal + ' kcal';
      $('wo-kcal-detail').textContent = (ex.muscle ? ex.muscle + ' · ' : '') + '~' + r.minutes + ' min (work + rest)' +
        (p ? '' : ' · set your profile for weight-based burn');
    } else {
      var minutes = clampInt($('wo-minutes').value, 1, 300, 30);
      $('wo-kcal').textContent = '≈ ' + N.exerciseKcal(ex.met, bodyKg, minutes) + ' kcal';
      $('wo-kcal-detail').textContent = minutes + ' min' + (p ? ' at ' + p.weightKg + ' kg' : ' · set your profile for weight-based burn');
    }
  }

  function syncWorkoutFields() {
    var strength = isStrengthSelected();
    $('wo-strength').classList.toggle('hidden', !strength);
    $('wo-cardio').classList.toggle('hidden', strength);
    updateWorkoutPreview();
  }

  function renderWorkoutToday() {
    $('wo-today-title').textContent = currentDate === todayStr() ? 'Today’s workout' : currentDate + ' — workout';
    var list = S.day(currentDate).exercises || [];
    if (!list.length) {
      $('wo-today').innerHTML = '<p class="hint">No workout logged yet. Log one above — manually, or point your camera / upload a clip and let the AI name the exercise.</p>';
      return;
    }
    var total = 0, html = '';
    list.forEach(function (x, i) {
      total += x.kcal || 0;
      var strength = x.sets && x.reps;
      var src = x.source && x.source !== 'manual'
        ? ' · ' + (x.source === 'camera' ? '📷 camera' : '🖼️ photo/video')
        : '';
      html += '<div class="wo-entry"><div class="we-icon">' + (strength ? '🏋️' : '🏃') + '</div>' +
        '<div class="we-main"><div class="we-name">' + esc(exName(x)) + '</div>' +
        '<div class="we-detail">' + esc(exDetailText(x)) + src + '</div></div>' +
        '<span class="we-kcal">−' + (x.kcal || 0) + ' kcal</span>' +
        '<button class="icon-btn" data-wo-del="' + i + '" aria-label="Delete">✕</button></div>';
    });
    html += '<div class="wo-total"><span>Total burned today</span><span class="wt-val">' + Math.round(total) + ' kcal</span></div>';
    $('wo-today').innerHTML = html;
  }

  function renderWorkoutView() {
    if (!$('wo-ex').options.length) initWorkoutSelect();
    setWorkoutMode(woMode);
    syncWorkoutFields();
    renderWorkoutToday();
  }

  $('wo-ex').addEventListener('change', syncWorkoutFields);
  ['wo-sets', 'wo-reps', 'wo-weight', 'wo-minutes'].forEach(function (id) {
    $(id).addEventListener('input', updateWorkoutPreview);
  });

  $('wo-log').addEventListener('click', function () {
    var p = S.profile();
    if (!p) { toast('Set up your profile first (for weight-based burn)'); switchView('profile'); return; }
    var ex = selectedWorkoutEx();
    if (!ex) { toast('Pick an exercise'); return; }
    var entry;
    if (isStrengthSelected()) {
      var sets = clampInt($('wo-sets').value, 1, 20, 3);
      var reps = clampInt($('wo-reps').value, 1, 100, 10);
      var weight = clampNum($('wo-weight').value, 0, 500, 0);
      var r = N.strengthKcal(ex.met, p.weightKg, sets, reps, weight);
      entry = { exId: ex.id || '', name: ex.name, minutes: r.minutes, kcal: r.kcal, sets: sets, reps: reps, weightKg: weight, source: woMode };
    } else {
      var minutes = clampInt($('wo-minutes').value, 1, 300, 30);
      entry = { exId: ex.id || '', name: ex.name, minutes: minutes, kcal: N.exerciseKcal(ex.met, p.weightKg, minutes), source: woMode };
    }
    S.addExercise(currentDate, entry);
    toast('Logged: ' + ex.name + ' — ' + entry.kcal + ' kcal');
    renderWorkoutToday();
    renderDashboard();
  });

  $('wo-today').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-wo-del]');
    if (!b) return;
    S.removeExercise(currentDate, parseInt(b.dataset.woDel, 10));
    renderWorkoutToday();
    renderDashboard();
  });

  /* ---- mode switching ---- */
  function setWorkoutMode(mode) {
    woMode = mode;
    document.querySelectorAll('#wo-mode button').forEach(function (x) { x.classList.toggle('active', x.dataset.mode === mode); });
    $('wo-detect').classList.toggle('hidden', mode === 'manual');
    $('wo-camera-panel').classList.toggle('hidden', mode !== 'camera');
    $('wo-upload-panel').classList.toggle('hidden', mode !== 'upload');
    if (mode !== 'camera') stopCamera();
  }
  $('wo-mode').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-mode]');
    if (b) setWorkoutMode(b.dataset.mode);
  });
  var gotoCoach = $('wo-goto-coach');
  if (gotoCoach) gotoCoach.addEventListener('click', function (e) { e.preventDefault(); switchView('coach'); });

  /* ---- frame capture helpers ---- */
  // Downscale any image/video source to <=640px and return a JPEG data URL,
  // keeping the payload (and Haiku vision cost) small.
  function frameDataURL(source, w, h) {
    var canvas = $('wo-canvas');
    var scale = Math.min(1, 640 / Math.max(w || 1, h || 1));
    canvas.width = Math.max(Math.round((w || 1) * scale), 1);
    canvas.height = Math.max(Math.round((h || 1) * scale), 1);
    canvas.getContext('2d').drawImage(source, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.82);
  }
  function imageFileToFrame(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        try { var f = frameDataURL(img, img.naturalWidth, img.naturalHeight); URL.revokeObjectURL(url); resolve(f); }
        catch (e) { URL.revokeObjectURL(url); reject(e); }
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Could not read that image.')); };
      img.src = url;
    });
  }
  function videoFileToFrames(file, count) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var v = document.createElement('video');
      v.muted = true; v.playsInline = true; v.preload = 'auto'; v.src = url;
      var frames = [], times = [], idx = 0, done = false;
      function finish(err) {
        if (done) return; done = true;
        URL.revokeObjectURL(url);
        if (err) reject(err); else resolve(frames);
      }
      var guard = setTimeout(function () { finish(frames.length ? null : new Error('Reading the video timed out — try a shorter clip or a photo.')); }, 15000);
      function seekNext() {
        if (idx >= times.length) { clearTimeout(guard); finish(null); return; }
        try { v.currentTime = times[idx]; } catch (e) { clearTimeout(guard); finish(null); }
      }
      v.addEventListener('loadeddata', function () {
        var d = v.duration && isFinite(v.duration) ? v.duration : 0;
        if (d > 0) { for (var i = 0; i < count; i++) times.push(d * (i + 1) / (count + 1)); }
        else times.push(0);
        seekNext();
      });
      v.addEventListener('seeked', function () {
        try { frames.push(frameDataURL(v, v.videoWidth, v.videoHeight)); } catch (e) { /* skip bad frame */ }
        idx++; seekNext();
      });
      v.addEventListener('error', function () { clearTimeout(guard); finish(new Error('Could not read that video.')); });
    });
  }

  /* ---- camera ---- */
  function startCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { toast('Camera not available on this device/browser'); return; }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false }).then(function (stream) {
      woStream = stream;
      var v = $('wo-video');
      v.srcObject = stream;
      var play = v.play(); if (play && play.catch) play.catch(function () {});
      $('wo-cam-capture').disabled = false;
      $('wo-cam-stop').disabled = false;
      $('wo-cam-start').disabled = true;
    }, function (err) {
      toast('Could not access camera: ' + (err && err.name ? err.name : 'permission denied'));
    });
  }
  function stopCamera() {
    if (woStream) { woStream.getTracks().forEach(function (t) { t.stop(); }); woStream = null; }
    var v = document.getElementById('wo-video');
    if (v) v.srcObject = null;
    var cap = document.getElementById('wo-cam-capture'), stp = document.getElementById('wo-cam-stop'), st = document.getElementById('wo-cam-start');
    if (cap) cap.disabled = true;
    if (stp) stp.disabled = true;
    if (st) st.disabled = false;
  }
  $('wo-cam-start').addEventListener('click', startCamera);
  $('wo-cam-stop').addEventListener('click', stopCamera);
  $('wo-cam-capture').addEventListener('click', function () {
    var v = $('wo-video');
    if (!v.videoWidth) { toast('Camera still warming up — try again in a second'); return; }
    runDetection([frameDataURL(v, v.videoWidth, v.videoHeight)]);
  });

  /* ---- upload ---- */
  $('wo-file').addEventListener('change', function () {
    woFile = this.files[0] || null;
    $('wo-file-detect').disabled = !woFile;
  });
  $('wo-file-detect').addEventListener('click', function () {
    if (!woFile) return;
    if (/^video\//.test(woFile.type)) {
      showDetectStatus('thinking');
      videoFileToFrames(woFile, 3).then(function (frames) {
        if (!frames.length) throw new Error('Could not read frames from that video.');
        runDetection(frames);
      }).catch(function (err) { showDetectStatus('err', err.message || 'Could not read that video.'); });
    } else if (/^image\//.test(woFile.type)) {
      showDetectStatus('thinking');
      imageFileToFrame(woFile).then(function (frame) { runDetection([frame]); })
        .catch(function (err) { showDetectStatus('err', err.message || 'Could not read that image.'); });
    } else {
      toast('Please choose an image or video file');
    }
  });

  /* ---- detection flow ---- */
  function showDetectStatus(kind, payload, match) {
    var el = $('wo-detect-status');
    el.classList.remove('hidden', 'thinking', 'ok', 'err');
    if (kind === 'thinking') { el.classList.add('thinking'); el.textContent = 'Identifying the exercise (Claude Haiku vision)…'; return; }
    if (kind === 'err') { el.classList.add('err'); el.textContent = payload; return; }
    // kind === 'ok', payload is the detection object
    el.classList.add('ok');
    var conf = Math.round((payload.confidence || 0) * 100);
    var shownName = match ? match.name : payload.exercise;
    el.innerHTML = '<span class="det-name">' + esc(shownName) + '</span>' +
      '<span class="det-conf">' + conf + '% sure</span>' +
      '<div class="hint" style="margin-top:6px">' +
      (match ? 'Matched to your exercise library. ' : 'Logged as a custom exercise. ') +
      'Enter your sets, reps and weight below, then tap Log workout.' +
      (payload.confidence < 0.45 ? ' Low confidence — double-check the exercise picker.' : '') +
      '</div>';
  }

  function normalizeName(s) {
    return String(s).toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function matchExerciseToDb(name) {
    var n = normalizeName(name);
    if (!n || n === 'unknown') return null;
    var words = n.split(' ').filter(function (w) { return w.length > 2; });
    var best = null, bestScore = 0;
    window.EXERCISES.forEach(function (x) {
      var hay = normalizeName(x.name + ' ' + (x.aka || []).join(' '));
      var score = 0;
      if (hay.indexOf(n) >= 0 || n.indexOf(normalizeName(x.name)) >= 0) score += 5;
      words.forEach(function (w) { if (hay.indexOf(w) >= 0) score += 1; });
      if (score > bestScore) { bestScore = score; best = x; }
    });
    return bestScore >= 2 ? best : null;
  }

  function applyDetection(det) {
    var match = matchExerciseToDb(det.exercise);
    woDetected = null;
    if (match) {
      var stray = $('wo-ex').querySelector('option[value="__detected"]');
      if (stray) stray.parentNode.removeChild(stray);
      $('wo-ex').value = match.id;
    } else {
      woDetected = { name: det.exercise, met: metFor(det.category, det.intensity), isStrength: det.isStrength };
      setDetectedOption(det.exercise);
      $('wo-ex').value = '__detected';
    }
    var strength = match ? match.strength : det.isStrength;
    if (strength && det.reps) $('wo-reps').value = det.reps;
    syncWorkoutFields();
    showDetectStatus('ok', det, match);
  }

  function runDetection(frames) {
    if (!window.AI.hasKey()) {
      showDetectStatus('err', 'Connect your Anthropic API key in the Coach tab to identify exercises from a photo. You can always log manually below.');
      return;
    }
    showDetectStatus('thinking');
    window.AI.detectExercise(frames).then(function (det) {
      if (!det || det.exercise === 'Unknown' || det.confidence < 0.2) {
        showDetectStatus('err', 'Couldn’t confidently identify the exercise. Try a clearer angle, better light, or pick it manually below.');
        return;
      }
      applyDetection(det);
    }, function (err) {
      showDetectStatus('err', 'Detection failed: ' + (err && err.message ? err.message : 'unknown error'));
    });
  }

  /* ---------------- weekly workout plan ---------------- */
  $('wo-generate').addEventListener('click', function () {
    var p = S.profile();
    if (!p) { toast('Set up your profile first'); switchView('profile'); return; }
    var plan = P.generateWorkoutPlan(p, {
      level: $('wo-level').value,
      days: parseInt($('wo-days').value, 10),
      place: $('wo-place').value
    });
    var goalText = { lose: 'fat loss', gain: 'muscle gain', recomp: 'recomposition (muscle + fat loss)', maintain: 'general fitness' }[plan.goal];
    var html = '<p class="hint" style="margin-bottom:10px">Built for <strong>' + goalText +
      '</strong> · estimated burn <strong>~' + plan.weeklyKcal + ' kcal/week</strong> at your current weight. ' +
      'Warm up 5 min before and stretch 5 min after every session.</p>';
    plan.days.forEach(function (d) {
      html += '<div class="plan-day"><h3>' + esc(d.day) +
        (d.minutes ? '<span class="kcal">' + d.minutes + ' min · ~' + d.kcal + ' kcal</span>' : '') + '</h3>';
      if (!d.items.length) {
        html += '<p class="rest-day">Rest — sleep well, hit your protein and water targets.</p>';
      } else {
        html += '<p style="font-size:0.9rem; font-weight:600; margin-bottom:4px">' + esc(d.title) + '</p>';
        d.items.forEach(function (it) {
          html += '<div class="workout-item"><span>' + esc(it.name) + '</span><span class="wi-detail">' + esc(it.detail) + '</span></div>';
        });
      }
      html += '</div>';
    });
    $('wo-plan').innerHTML = html;
  });

  /* ---------------- weight ---------------- */
  function renderWeight() {
    var p = S.profile();
    var w = S.weights();
    C.lineChart($('weight-chart'), w, p ? p.goalWeightKg : null);
    if (w.length) {
      var start = w[0].kg, cur = w[w.length - 1].kg;
      var change = Math.round((cur - start) * 10) / 10;
      var stats = '<div class="stat"><div class="value">' + cur + '</div><div class="label">Current (kg)</div></div>' +
        '<div class="stat"><div class="value">' + (change > 0 ? '+' : '') + change + '</div><div class="label">Change since start (kg)</div></div>';
      if (p) {
        var togo = Math.round((cur - p.goalWeightKg) * 10) / 10;
        stats += '<div class="stat"><div class="value">' + p.goalWeightKg + '</div><div class="label">Goal (kg)</div></div>' +
          '<div class="stat"><div class="value">' + Math.abs(togo) + '</div><div class="label">' + (togo >= 0 ? 'To lose (kg)' : 'To gain (kg)') + '</div></div>';
      }
      $('weight-stats').innerHTML = stats;
    } else {
      $('weight-stats').innerHTML = '';
    }
    var rows = '<tr><th>Date</th><th class="num">Weight (kg)</th><th></th></tr>';
    for (var i = w.length - 1; i >= 0; i--) {
      rows += '<tr><td>' + esc(w[i].date) + '</td><td class="num">' + esc(w[i].kg) + '</td>' +
        '<td><button class="icon-btn" data-wt-del="' + esc(w[i].date) + '" aria-label="Delete">✕</button></td></tr>';
    }
    $('wt-table').innerHTML = rows;
  }
  $('wt-add').addEventListener('click', function () {
    var date = $('wt-date').value || todayStr();
    var kg = parseFloat($('wt-kg').value);
    if (isNaN(kg) || kg < 20 || kg > 300) { toast('Enter a valid weight'); return; }
    // A future-dated entry would sort as the newest weight and silently
    // overwrite the profile's current weight (and every calorie calc).
    if (date > todayStr()) { toast('Can’t log a weight for a future date'); return; }
    S.addWeight(date, Math.round(kg * 10) / 10);
    toast('Weight saved');
    renderWeight();
  });
  $('wt-table').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-wt-del]');
    if (!b) return;
    S.removeWeight(b.dataset.wtDel);
    renderWeight();
  });

  /* ---------------- database ---------------- */
  function renderDatabase() {
    var q = $('db-search').value.trim();
    var cat = $('db-cat').value;
    var list = window.FOODS.filter(function (f) {
      if (cat && cat !== 'all' && f.cat !== cat) return false;
      return foodMatches(f, q);
    });
    $('db-count').textContent = list.length + ' of ' + window.FOODS.length + ' foods';
    var rows = '<tr><th>Food</th><th>Serving</th><th class="num">kcal</th><th class="num">Protein</th>' +
      '<th class="num">Carbs</th><th class="num">Fat</th><th class="num">Fibre</th><th class="num">kcal/100g</th></tr>';
    list.forEach(function (f) {
      rows += '<tr><td>' + esc(f.name) + dietChip(f.diet) + '</td><td>' + esc(f.unit) + '</td>' +
        '<td class="num">' + f.kcal + '</td><td class="num">' + f.protein + '</td>' +
        '<td class="num">' + f.carbs + '</td><td class="num">' + f.fat + '</td>' +
        '<td class="num">' + f.fiber + '</td>' +
        '<td class="num">' + Math.round(f.kcal / f.grams * 100) + '</td></tr>';
    });
    $('db-table').innerHTML = rows;
  }
  $('db-search').addEventListener('input', renderDatabase);
  $('db-cat').addEventListener('change', renderDatabase);

  /* ---------------- data management ---------------- */
  $('data-export').addEventListener('click', function () {
    var blob = new Blob([S.exportJSON()], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'annapurna-backup.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });
  $('data-import').addEventListener('click', function () { $('data-import-file').click(); });
  $('data-import-file').addEventListener('change', function () {
    var file = this.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        S.importJSON(reader.result);
        toast('Backup imported');
        initProfileForm(); renderDashboard(); renderWeight();
      } catch (e) { toast('Could not import: not a valid backup file'); }
    };
    reader.readAsText(file);
  });
  $('data-reset').addEventListener('click', function () {
    if (confirm('Delete ALL Annapurna data (profile, logs, weights)? This cannot be undone.')) {
      S.reset();
      location.reload();
    }
  });

  /* ---------------- boot ---------------- */
  initProfileForm();
  initExerciseSelect();
  initFoodFilters();
  initModalSelects();
  $('wt-date').value = todayStr();
  renderFoodSearch();
  renderDashboard();

  if (!S.profile()) {
    $('onboard-backdrop').classList.remove('hidden');
    $('onboard-go').addEventListener('click', function () {
      $('onboard-backdrop').classList.add('hidden');
      switchView('profile');
    });
  }

  // PWA: offline cache + installability (Android "Install app", iOS Safari
  // "Add to Home Screen"). Skipped on file:// where SWs aren't allowed.
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    navigator.serviceWorker.register('sw.js').catch(function () { /* offline mode unavailable */ });
  }
})();
