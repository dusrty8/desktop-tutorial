/*
 * Annapurna — persistent state (localStorage).
 *
 * Shape:
 * {
 *   profile: { name, sex, age, heightCm, weightKg, goalWeightKg,
 *              activity, pace, dietPref } | null,
 *   days: {
 *     'YYYY-MM-DD': {
 *       meals: { breakfast: [entry], lunch: [], snacks: [], dinner: [] },
 *       water: 0,
 *       exercises: [ { exId, minutes, kcal } ]
 *     }
 *   },
 *   weights: [ { date, kg } ]  // sorted by date
 * }
 * entry = { foodId, qty, style, extraOilTsp, oilId }
 */
(function () {
  'use strict';
  var KEY = 'annapurna.v1';
  var state = null;

  function blankDay() {
    return { meals: { breakfast: [], lunch: [], snacks: [], dinner: [] }, water: 0, exercises: [] };
  }

  function load() {
    if (state) return state;
    try {
      var raw = localStorage.getItem(KEY);
      state = raw ? JSON.parse(raw) : null;
    } catch (e) { state = null; }
    if (!state || typeof state !== 'object') state = { profile: null, days: {}, weights: [] };
    // Guard against a truthy-but-wrong-typed value (legacy or hand-tampered
    // localStorage) — a string 'days' would otherwise crash day()/render.
    if (!state.days || typeof state.days !== 'object' || Array.isArray(state.days)) state.days = {};
    if (!Array.isArray(state.weights)) state.weights = [];
    return state;
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage full/blocked */ }
  }

  function day(date) {
    var s = load();
    if (!s.days[date]) s.days[date] = blankDay();
    // tolerate older shapes
    var d = s.days[date];
    if (!d.meals) d.meals = blankDay().meals;
    ['breakfast', 'lunch', 'snacks', 'dinner'].forEach(function (m) { if (!d.meals[m]) d.meals[m] = []; });
    if (!d.exercises) d.exercises = [];
    if (typeof d.water !== 'number') d.water = 0;
    return d;
  }

  function addFood(date, meal, entry) { day(date).meals[meal].push(entry); save(); }
  function removeFood(date, meal, index) { day(date).meals[meal].splice(index, 1); save(); }
  function setWater(date, n) { day(date).water = Math.min(Math.max(0, n), 30); save(); }
  function addExercise(date, ex) { day(date).exercises.push(ex); save(); }
  function removeExercise(date, index) { day(date).exercises.splice(index, 1); save(); }

  function setProfile(p) { load().profile = p; save(); }
  function profile() { return load().profile; }

  function addWeight(date, kg) {
    var w = load().weights;
    var existing = null;
    for (var i = 0; i < w.length; i++) if (w[i].date === date) existing = w[i];
    if (existing) existing.kg = kg;
    else w.push({ date: date, kg: kg });
    w.sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    // keep profile's current weight in sync with the latest entry
    var p = load().profile;
    if (p && w.length && w[w.length - 1].date === date) p.weightKg = kg;
    save();
  }
  function removeWeight(date) {
    var w = load().weights;
    for (var i = w.length - 1; i >= 0; i--) if (w[i].date === date) w.splice(i, 1);
    save();
  }
  function weights() { return load().weights; }

  function exportJSON() { return JSON.stringify(load(), null, 2); }

  /* ---- import sanitization ----
     An imported backup is UNTRUSTED input (users are told to share these
     files between devices). We never assign the parsed object to state
     directly: every field is rebuilt with a coerced type, so a crafted
     file cannot smuggle an HTML string into a field the UI renders. Numeric
     fields become real numbers; date keys must match YYYY-MM-DD, which also
     guarantees the only string fields the UI interpolates are injection-safe. */
  var DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  function num(v, fallback, lo, hi) {
    var n = Number(v);
    if (!isFinite(n)) return fallback;
    if (lo != null) n = Math.max(n, lo);
    if (hi != null) n = Math.min(n, hi);
    return n;
  }
  function str(v) { return typeof v === 'string' ? v : (v == null ? '' : String(v)); }

  function sanitizeEntry(e) {
    if (!e || typeof e !== 'object') return null;
    return {
      foodId: str(e.foodId),
      qty: num(e.qty, 1, 0, 100),
      inputGrams: e.inputGrams == null ? null : num(e.inputGrams, null, 0, 100000),
      style: str(e.style) || 'standard',
      extraOilTsp: num(e.extraOilTsp, 0, 0, 50),
      oilId: e.oilId == null ? null : str(e.oilId)
    };
  }
  function sanitizeExercise(x) {
    if (!x || typeof x !== 'object') return null;
    var out = { exId: str(x.exId), minutes: num(x.minutes, 0, 0, 100000), kcal: num(x.kcal, 0, 0, 100000) };
    // optional strength / detection metadata (newer entries)
    if (x.name != null) out.name = str(x.name).slice(0, 80);
    if (x.sets != null) out.sets = num(x.sets, 0, 0, 100);
    if (x.reps != null) out.reps = num(x.reps, 0, 0, 1000);
    if (x.weightKg != null) out.weightKg = num(x.weightKg, 0, 0, 1000);
    if (x.source != null) out.source = str(x.source).slice(0, 20);
    return out;
  }
  function sanitizeDay(d) {
    var out = blankDay();
    if (!d || typeof d !== 'object') return out;
    if (d.meals && typeof d.meals === 'object') {
      ['breakfast', 'lunch', 'snacks', 'dinner'].forEach(function (m) {
        if (Array.isArray(d.meals[m])) out.meals[m] = d.meals[m].map(sanitizeEntry).filter(Boolean);
      });
    }
    out.water = num(d.water, 0, 0, 100000);
    if (Array.isArray(d.exercises)) out.exercises = d.exercises.map(sanitizeExercise).filter(Boolean);
    return out;
  }
  function sanitizeProfile(p) {
    if (!p || typeof p !== 'object') return null;
    return {
      name: str(p.name).slice(0, 100),
      sex: p.sex === 'male' ? 'male' : 'female',
      age: num(p.age, 30, 1, 120),
      heightCm: num(p.heightCm, 165, 50, 300),
      weightKg: num(p.weightKg, 70, 10, 500),
      goalWeightKg: num(p.goalWeightKg, 65, 10, 500),
      activity: str(p.activity) || 'sedentary',
      goalMode: str(p.goalMode) || 'auto',
      pace: str(p.pace) || 'steady',
      dietPref: str(p.dietPref) || 'veg'
    };
  }
  function sanitizeState(parsed) {
    var out = { profile: null, days: {}, weights: [] };
    out.profile = sanitizeProfile(parsed.profile);
    if (parsed.days && typeof parsed.days === 'object' && !Array.isArray(parsed.days)) {
      Object.keys(parsed.days).forEach(function (date) {
        if (DATE_RE.test(date)) out.days[date] = sanitizeDay(parsed.days[date]);
      });
    }
    if (Array.isArray(parsed.weights)) {
      out.weights = parsed.weights.map(function (w) {
        if (!w || typeof w !== 'object' || !DATE_RE.test(w.date)) return null;
        var kg = num(w.kg, null, 0, 1000);
        return kg == null ? null : { date: w.date, kg: kg };
      }).filter(Boolean).sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    }
    return out;
  }

  function importJSON(text) {
    var parsed = JSON.parse(text); // throws on bad input
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid backup');
    state = sanitizeState(parsed);
    save();
  }
  function reset() { state = { profile: null, days: {}, weights: [] }; save(); }

  window.Store = {
    load: load, save: save, day: day,
    addFood: addFood, removeFood: removeFood,
    setWater: setWater, addExercise: addExercise, removeExercise: removeExercise,
    setProfile: setProfile, profile: profile,
    addWeight: addWeight, removeWeight: removeWeight, weights: weights,
    exportJSON: exportJSON, importJSON: importJSON, reset: reset
  };
})();
