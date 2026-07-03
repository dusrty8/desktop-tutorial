/*
 * Annapurna — AI dietician (optional, bring-your-own Anthropic API key).
 *
 * Architecture & cost routing:
 *   Tier 0 (free, always on)  — js/coach.js rule engine, runs locally.
 *   Tier 1 (cheap, frequent)  — claude-haiku-4-5 ($1/$5 per MTok) for the
 *                               daily check-in and quick questions.
 *   Tier 2 (weekly, deeper)   — claude-sonnet-5 ($3/$15 per MTok) for the
 *                               weekly review that re-plans your approach.
 *   No tier ever uses Opus or Fable — a personal dietician nudge does not
 *   need frontier-model reasoning, and this keeps a heavy user's cost to a
 *   few rupees a month.
 *
 * Raw fetch (not the SDK) is deliberate: this is a zero-build static app.
 * Browser calls require the `anthropic-dangerous-direct-browser-access`
 * header, which is safe here ONLY because the key is the user's own,
 * entered by them, stored only in their browser's localStorage, and sent
 * nowhere except api.anthropic.com. Never ship a shared key in this file.
 */
(function () {
  'use strict';
  var KEY_STORAGE = 'annapurna.ai.key';

  var MODELS = {
    quick: 'claude-haiku-4-5',
    deep: 'claude-sonnet-5'
  };

  var SYSTEM_PROMPT =
    'You are the dietician coach inside Annapurna, an Indian-first calorie tracking app. ' +
    'You know Indian food, cooking styles (tadka, ghee, deep-frying), regional cuisines and vegetarian protein realities. ' +
    'You receive the user’s profile, targets and recent logs as JSON. ' +
    'Give specific, actionable guidance grounded in that data — name actual foods (prefer Indian options), exact quantities and minutes of exercise. ' +
    'Be warm but direct; no lectures. Keep answers under 200 words unless doing a weekly review (then up to 400, structured with short headings). ' +
    'Never give medical advice; suggest a doctor for medical issues. Reply in plain text, no markdown tables.';

  function getKey() {
    try { return localStorage.getItem(KEY_STORAGE) || ''; } catch (e) { return ''; }
  }
  function setKey(k) {
    try {
      if (k) localStorage.setItem(KEY_STORAGE, k);
      else localStorage.removeItem(KEY_STORAGE);
    } catch (e) { /* storage blocked */ }
  }

  function todayStr(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  /* Compact context: profile + targets + last N days of logs + weights.
     Kept small on purpose — a check-in costs ~1–2k input tokens. */
  function buildContext(daysBack) {
    var S = window.Store, N = window.Nutrition, C = window.Coach;
    var profile = S.profile();
    if (!profile) return null;
    var t = N.macroTargets(profile);
    var days = [];
    var now = new Date();
    for (var i = daysBack - 1; i >= 0; i--) {
      var d = new Date(now);
      d.setDate(d.getDate() - i);
      var ds = todayStr(d);
      var dc = C.dayComputed(ds);
      if (!dc.items.length && !dc.burned && !dc.water) continue;
      days.push({
        date: ds,
        eatenKcal: Math.round(dc.totals.kcal),
        protein: Math.round(dc.totals.protein),
        carbs: Math.round(dc.totals.carbs),
        fat: Math.round(dc.totals.fat),
        fiber: Math.round(dc.totals.fiber),
        burnedKcal: dc.burned,
        waterGlasses: dc.water,
        foods: dc.items.map(function (it) {
          var s = it.food.name.split(' (')[0];
          if (it.entry.qty !== 1) s += ' x' + it.entry.qty;
          if (it.entry.style === 'rich') s += ' (restaurant-style)';
          return s;
        })
      });
    }
    return {
      profile: {
        sex: profile.sex, age: profile.age, heightCm: profile.heightCm,
        weightKg: profile.weightKg, goalWeightKg: profile.goalWeightKg,
        goal: N.goalOf(profile), dietPreference: profile.dietPref,
        activity: profile.activity
      },
      dailyTargets: t,
      recentDays: days,
      weights: S.weights().slice(-14)
    };
  }

  /*
   * Ask the dietician. tier: 'quick' (haiku) | 'deep' (sonnet).
   * Returns a Promise<string>.
   */
  function ask(question, tier) {
    var key = getKey();
    if (!key) return Promise.reject(new Error('no-key'));
    var deep = tier === 'deep';
    var context = buildContext(deep ? 14 : 3);
    if (!context) return Promise.reject(new Error('no-profile'));

    var body = {
      model: deep ? MODELS.deep : MODELS.quick,
      max_tokens: deep ? 1200 : 500,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: 'MY DATA:\n' + JSON.stringify(context) + '\n\nREQUEST:\n' + question
      }]
    };

    return fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify(body)
    }).then(function (resp) {
      return resp.json().then(function (data) {
        if (!resp.ok) {
          var msg = (data && data.error && data.error.message) || ('HTTP ' + resp.status);
          if (resp.status === 401) msg = 'Invalid API key — check it in the settings below.';
          if (resp.status === 429) msg = 'Rate limited — try again in a minute.';
          throw new Error(msg);
        }
        if (data.stop_reason === 'refusal') {
          throw new Error('The model declined this request. Try rephrasing.');
        }
        var text = '';
        (data.content || []).forEach(function (block) {
          if (block.type === 'text') text += block.text;
        });
        return text || 'No response text returned.';
      });
    });
  }

  var PROMPTS = {
    checkin: 'Do my daily check-in for today (the last entry in recentDays, if any). ' +
      'How am I pacing on calories and protein? What should my next meal look like? ' +
      'If I logged anything indulgent, how do I make up for it today?',
    weekly: 'Do my weekly deep review. Look across recentDays and weights: ' +
      '1) Am I progressing toward my goal? 2) Patterns in what I eat (good and bad). ' +
      '3) Three specific changes for next week, with exact Indian food swaps and portions. ' +
      '4) Should my calorie or protein targets change? Be honest about what the data shows.'
  };

  window.AI = {
    MODELS: MODELS,
    PROMPTS: PROMPTS,
    getKey: getKey,
    setKey: setKey,
    hasKey: function () { return !!getKey(); },
    buildContext: buildContext,
    ask: ask
  };
})();
