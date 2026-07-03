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
    if (!state.days) state.days = {};
    if (!state.weights) state.weights = [];
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
  function setWater(date, n) { day(date).water = Math.max(0, n); save(); }
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
  function importJSON(text) {
    var parsed = JSON.parse(text); // throws on bad input
    if (!parsed || typeof parsed !== 'object') throw new Error('Invalid backup');
    state = parsed;
    if (!state.days) state.days = {};
    if (!state.weights) state.weights = [];
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
