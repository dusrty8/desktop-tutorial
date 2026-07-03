/*
 * Annapurna — nutrition & energy math.
 * BMR via Mifflin-St Jeor; activity factors per WHO/ACSM convention;
 * exercise burn via MET formula.
 */
(function () {
  'use strict';

  var ACTIVITY = [
    { id: 'sedentary', name: 'Sedentary (desk job, little exercise)', factor: 1.2 },
    { id: 'light', name: 'Lightly active (walks, 1–3 workouts/week)', factor: 1.375 },
    { id: 'moderate', name: 'Moderately active (3–5 workouts/week)', factor: 1.55 },
    { id: 'very', name: 'Very active (6–7 workouts/week)', factor: 1.725 },
    { id: 'athlete', name: 'Extremely active (physical job + training)', factor: 1.9 }
  ];

  var PACES = [
    { id: 'relaxed', name: 'Relaxed — 0.25 kg/week', kgPerWeek: 0.25 },
    { id: 'steady', name: 'Steady — 0.5 kg/week', kgPerWeek: 0.5 },
    { id: 'aggressive', name: 'Aggressive — 0.75 kg/week', kgPerWeek: 0.75 }
  ];

  var DIET_PREFS = [
    { id: 'veg', name: 'Vegetarian' },
    { id: 'vegan', name: 'Vegan' },
    { id: 'egg', name: 'Eggetarian (veg + eggs)' },
    { id: 'nonveg', name: 'Non-vegetarian' },
    { id: 'jain', name: 'Jain (no onion, garlic, roots)' }
  ];

  function round(x) { return Math.round(x); }
  function round1(x) { return Math.round(x * 10) / 10; }

  function bmr(profile) {
    var base = 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age;
    return round(profile.sex === 'male' ? base + 5 : base - 161);
  }

  function activityFactor(id) {
    for (var i = 0; i < ACTIVITY.length; i++) if (ACTIVITY[i].id === id) return ACTIVITY[i].factor;
    return 1.2;
  }

  function tdee(profile) {
    return round(bmr(profile) * activityFactor(profile.activity));
  }

  function goalOf(profile) {
    var diff = profile.goalWeightKg - profile.weightKg;
    if (diff < -0.5) return 'lose';
    if (diff > 0.5) return 'gain';
    return 'maintain';
  }

  function paceKg(profile) {
    for (var i = 0; i < PACES.length; i++) if (PACES[i].id === profile.pace) return PACES[i].kgPerWeek;
    return 0.5;
  }

  /* Daily calorie target. 1 kg body fat ≈ 7700 kcal. Deficit capped at 25%
     of TDEE and floored at safe minimums (ICMR-style guidance). */
  function calorieTarget(profile) {
    var t = tdee(profile);
    var goal = goalOf(profile);
    var delta = paceKg(profile) * 7700 / 7;
    if (goal === 'lose') {
      delta = Math.min(delta, t * 0.25);
      var floor = profile.sex === 'male' ? 1500 : 1200;
      return round(Math.max(t - delta, floor));
    }
    if (goal === 'gain') return round(t + Math.min(delta, 500));
    return t;
  }

  /* Macro targets: protein by g/kg (higher when cutting to preserve lean
     mass), fat 27% of calories, carbs the remainder, fiber 14 g/1000 kcal. */
  function macroTargets(profile) {
    var kcal = calorieTarget(profile);
    var goal = goalOf(profile);
    // plant-based targets are set slightly lower — achievable with dals,
    // paneer/tofu, soya and dairy rather than aspirational
    var plant = profile.dietPref === 'veg' || profile.dietPref === 'vegan' || profile.dietPref === 'jain';
    var proteinPerKg = goal === 'lose' ? (plant ? 1.4 : 1.6)
      : goal === 'gain' ? (plant ? 1.6 : 1.8)
        : (plant ? 1.1 : 1.2);
    var refWeight = goal === 'lose' ? profile.goalWeightKg : profile.weightKg;
    var protein = Math.min(refWeight * proteinPerKg, kcal * 0.35 / 4);
    var fat = kcal * 0.27 / 9;
    var carbs = Math.max((kcal - protein * 4 - fat * 9) / 4, 0);
    return {
      kcal: kcal,
      protein: round(protein),
      carbs: round(carbs),
      fat: round(fat),
      fiber: round(kcal / 1000 * 14)
    };
  }

  function waterTargetGlasses(profile) {
    // ~35 ml/kg, in 250 ml glasses
    return Math.max(6, Math.round(profile.weightKg * 35 / 250));
  }

  function bmi(profile) {
    var h = profile.heightCm / 100;
    return round1(profile.weightKg / (h * h));
  }

  function bmiClass(v) {
    // Asian-Indian BMI cutoffs (lower than WHO global)
    if (v < 18.5) return 'Underweight';
    if (v < 23) return 'Normal';
    if (v < 25) return 'Overweight';
    return 'Obese';
  }

  function findOil(id) {
    var list = window.OIL_TYPES;
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return list[3]; // sunflower default
  }

  function findStyle(id) {
    var list = window.COOK_STYLES;
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return list[1]; // standard
  }

  /*
   * Compute the macros of one logged entry.
   *   food        — item from window.FOODS
   *   qty         — number of servings (0.5, 1, 2 …)
   *   styleId     — cooking style (only applied when food.oil)
   *   extraOilTsp — teaspoons of oil/ghee added beyond the standard recipe
   *   oilId       — which fat was used for the extra oil
   */
  function computeEntry(food, qty, styleId, extraOilTsp, oilId) {
    var fat = food.fat;
    var kcal = food.kcal;
    if (food.oil && styleId && styleId !== 'standard') {
      var mult = findStyle(styleId).fatMult;
      var fatDelta = food.fat * (mult - 1);
      fat = food.fat + fatDelta;
      kcal = food.kcal + fatDelta * 9;
    }
    var oilKcal = 0, oilFat = 0;
    if (extraOilTsp) {
      var oil = findOil(oilId);
      oilKcal = oil.kcalPerTsp * extraOilTsp;
      oilFat = oil.fatPerTsp * extraOilTsp;
    }
    return {
      kcal: round((kcal + oilKcal) * qty),
      protein: round1(food.protein * qty),
      carbs: round1(food.carbs * qty),
      fat: round1((fat + oilFat) * qty),
      fiber: round1(food.fiber * qty),
      grams: round(food.grams * qty)
    };
  }

  function exerciseKcal(met, weightKg, minutes) {
    return round(met * 3.5 * weightKg / 200 * minutes);
  }

  /* Diet-preference filter. 'jain' additionally excludes onion/garlic and
     root vegetables via tags. */
  function dietAllows(pref, food) {
    var d = food.diet;
    if (pref === 'vegan') { if (d !== 'vegan') return false; }
    else if (pref === 'veg') { if (d !== 'vegan' && d !== 'veg') return false; }
    else if (pref === 'egg') { if (d === 'nonveg') return false; }
    else if (pref === 'jain') {
      if (d !== 'vegan' && d !== 'veg') return false;
      if (food.tags.indexOf('og') >= 0 || food.tags.indexOf('root') >= 0) return false;
    }
    return true;
  }

  window.Nutrition = {
    ACTIVITY: ACTIVITY,
    PACES: PACES,
    DIET_PREFS: DIET_PREFS,
    bmr: bmr,
    tdee: tdee,
    goalOf: goalOf,
    calorieTarget: calorieTarget,
    macroTargets: macroTargets,
    waterTargetGlasses: waterTargetGlasses,
    bmi: bmi,
    bmiClass: bmiClass,
    computeEntry: computeEntry,
    exerciseKcal: exerciseKcal,
    dietAllows: dietAllows
  };
})();
