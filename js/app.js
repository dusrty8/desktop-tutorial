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
    var label = { vegan: 'VEGAN', veg: 'VEG', egg: 'EGG', nonveg: 'NON-VEG' }[diet] || diet;
    return '<span class="chip ' + esc(diet) + '">' + label + '</span>';
  }

  /* ---------------- tabs ---------------- */
  var currentDate = todayStr();
  function switchView(name) {
    document.querySelectorAll('.view').forEach(function (v) { v.classList.remove('active'); });
    document.querySelectorAll('#tabs button').forEach(function (b) {
      b.classList.toggle('active', b.dataset.view === name);
    });
    $('view-' + name).classList.add('active');
    if (name === 'dashboard') renderDashboard();
    if (name === 'weight') renderWeight();
    if (name === 'database') renderDatabase();
    if (name === 'dietplan') renderDietTargets();
    if (name === 'log') renderFoodSearch();
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
      pace: $('pf-pace').value,
      dietPref: $('pf-diet').value
    };
  }

  function renderProfileSummary(p) {
    var t = N.macroTargets(p);
    var goal = N.goalOf(p);
    var goalText = goal === 'lose' ? 'Lose ' + (Math.round((p.weightKg - p.goalWeightKg) * 10) / 10) + ' kg'
      : goal === 'gain' ? 'Gain ' + (Math.round((p.goalWeightKg - p.weightKg) * 10) / 10) + ' kg'
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

  function renderDashboard() {
    $('dash-date').value = currentDate;
    var p = S.profile();
    var dn = dayNutrition(currentDate);
    var t = p ? N.macroTargets(p) : null;
    var budget = t ? t.kcal : 2000;
    var remaining = Math.round(budget - dn.totals.kcal + dn.burned);

    $('dash-stats').innerHTML =
      '<div class="stat"><div class="value">' + budget + '</div><div class="label">Budget (kcal)' + (p ? '' : ' — set up your profile') + '</div></div>' +
      '<div class="stat"><div class="value">' + Math.round(dn.totals.kcal) + '</div><div class="label">Eaten (kcal)</div></div>' +
      '<div class="stat"><div class="value">' + dn.burned + '</div><div class="label">Burned — exercise (kcal)</div></div>' +
      '<div class="stat"><div class="value' + (remaining < 0 ? ' over' : '') + '">' + remaining + '</div><div class="label">' + (remaining < 0 ? 'Over budget (kcal)' : 'Remaining (kcal)') + '</div></div>';

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
     ['Fibre', 'protein', dn.totals.fiber, t ? t.fiber : 0]].forEach(function (row) {
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
        var ex = P.exById(x.exId);
        return '<div class="entry-row"><span class="entry-name">' + esc(ex ? ex.name : x.exId) +
          ' <span class="entry-detail">' + x.minutes + ' min</span></span>' +
          '<span class="entry-kcal">−' + x.kcal + ' kcal</span>' +
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
          mealsHtml += '<div class="entry-row"><span class="entry-name">' + esc(it.food.name) +
            ' <span class="entry-detail">× ' + it.entry.qty + (extra.length ? ' · ' + esc(extra.join(', ')) : '') + '</span></span>' +
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

  function openFoodModal(foodId) {
    modalFood = P.foodById(foodId);
    if (!modalFood) return;
    $('fm-name').innerHTML = esc(modalFood.name) + dietChip(modalFood.diet);
    $('fm-serving').textContent = 'Serving: ' + modalFood.unit + ' (' + modalFood.grams + ' g) · ' +
      modalFood.kcal + ' kcal standard';
    $('fm-qty').value = 1;
    $('fm-style').value = 'standard';
    $('fm-oil-tsp').value = 0;
    $('fm-oil-section').classList.toggle('hidden', !modalFood.oil && modalFood.role !== 'ingredient');
    // suggest the meal by time of day
    var h = new Date().getHours();
    $('fm-meal').value = h < 11 ? 'breakfast' : h < 15 ? 'lunch' : h < 19 ? 'snacks' : 'dinner';
    updateModalKcal();
    $('food-modal-backdrop').classList.remove('hidden');
  }

  function updateModalKcal() {
    if (!modalFood) return;
    var qty = parseFloat($('fm-qty').value) || 1;
    var e = N.computeEntry(modalFood, qty, $('fm-style').value,
      parseFloat($('fm-oil-tsp').value) || 0, $('fm-oil-type').value);
    $('fm-kcal').textContent = e.kcal + ' kcal';
    $('fm-macros').textContent = 'P ' + e.protein + ' g · C ' + e.carbs + ' g · F ' + e.fat + ' g · fibre ' + e.fiber + ' g · ' + e.grams + ' g';
  }
  ['fm-qty', 'fm-style', 'fm-oil-tsp', 'fm-oil-type'].forEach(function (id) {
    $(id).addEventListener('input', updateModalKcal);
    $(id).addEventListener('change', updateModalKcal);
  });
  $('fm-cancel').addEventListener('click', function () { $('food-modal-backdrop').classList.add('hidden'); });
  $('food-modal-backdrop').addEventListener('click', function (e) {
    if (e.target === this) this.classList.add('hidden');
  });
  $('fm-add').addEventListener('click', function () {
    if (!modalFood) return;
    var entry = {
      foodId: modalFood.id,
      qty: parseFloat($('fm-qty').value) || 1,
      style: $('fm-style').value,
      extraOilTsp: parseFloat($('fm-oil-tsp').value) || 0,
      oilId: $('fm-oil-type').value
    };
    S.addFood(currentDate, $('fm-meal').value, entry);
    $('food-modal-backdrop').classList.add('hidden');
    toast('Added ' + modalFood.name + ' to ' + MEAL_NAMES[$('fm-meal').value]);
    renderDashboard();
  });

  /* ---------------- diet plan ---------------- */
  var dietSeed = 1;
  var lastPlan = null;

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
    var day = lastPlan.days[parseInt(b.dataset.logDay, 10)];
    Object.keys(day.meals).forEach(function (m) {
      day.meals[m].forEach(function (it) {
        S.addFood(todayStr(), m, { foodId: it.foodId, qty: it.qty, style: 'standard', extraOilTsp: 0, oilId: null });
      });
    });
    toast('Plan logged to today’s diary');
  });

  /* ---------------- workout ---------------- */
  $('wo-generate').addEventListener('click', function () {
    var p = S.profile();
    if (!p) { toast('Set up your profile first'); switchView('profile'); return; }
    var plan = P.generateWorkoutPlan(p, {
      level: $('wo-level').value,
      days: parseInt($('wo-days').value, 10),
      place: $('wo-place').value
    });
    var goalText = { lose: 'fat loss', gain: 'muscle gain', maintain: 'general fitness' }[plan.goal];
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
      rows += '<tr><td>' + esc(w[i].date) + '</td><td class="num">' + w[i].kg + '</td>' +
        '<td><button class="icon-btn" data-wt-del="' + esc(w[i].date) + '" aria-label="Delete">✕</button></td></tr>';
    }
    $('wt-table').innerHTML = rows;
  }
  $('wt-add').addEventListener('click', function () {
    var date = $('wt-date').value || todayStr();
    var kg = parseFloat($('wt-kg').value);
    if (isNaN(kg) || kg < 20 || kg > 300) { toast('Enter a valid weight'); return; }
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
})();
