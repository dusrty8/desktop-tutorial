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

  /*
   * Vision exercise detector — identify a workout from one or more image
   * frames (a live-camera capture, an uploaded photo, or frames pulled from an
   * uploaded video). Runs on Haiku (vision-capable, cheapest tier) — a
   * best-guess classification does not need a frontier model. Frames are
   * downscaled by the caller to keep tokens (and cost) tiny.
   *
   * `frames` is an array of data-URL strings (image/jpeg or image/png).
   * Resolves to { exercise, category, intensity, isStrength, reps, confidence }
   * with coerced, whitelisted values — the raw model text is never trusted.
   */
  var DETECT_SYSTEM =
    'You identify the single strength or cardio exercise a person is performing in the given image(s). ' +
    'The images may be consecutive frames of one movement. ' +
    'Reply with ONE line of strict minified JSON and nothing else: ' +
    '{"exercise":"<common name, e.g. Barbell squat>","category":"strength|cardio|bodyweight|yoga|sport",' +
    '"intensity":"light|moderate|vigorous","isStrength":true|false,"reps":<integer or null>,"confidence":<0..1>}. ' +
    'If no exercise is recognisable, use exercise:"Unknown" and confidence below 0.3. Do not add commentary or markdown.';

  var CATEGORIES = { strength: 1, cardio: 1, bodyweight: 1, yoga: 1, sport: 1 };
  var INTENSITIES = { light: 1, moderate: 1, vigorous: 1 };

  function coerceDetection(text) {
    var obj = null;
    try {
      var a = text.indexOf('{'), b = text.lastIndexOf('}');
      if (a >= 0 && b > a) obj = JSON.parse(text.slice(a, b + 1));
    } catch (e) { obj = null; }
    if (!obj || typeof obj !== 'object') throw new Error('Could not read the exercise from the image. Try a clearer photo or log it manually.');
    var name = typeof obj.exercise === 'string' ? obj.exercise.trim().slice(0, 60) : '';
    if (!name) name = 'Unknown';
    var cat = CATEGORIES[obj.category] ? obj.category : 'strength';
    var intensity = INTENSITIES[obj.intensity] ? obj.intensity : 'moderate';
    var reps = Number(obj.reps);
    reps = isFinite(reps) && reps > 0 ? Math.min(Math.round(reps), 100) : null;
    var conf = Number(obj.confidence);
    conf = isFinite(conf) ? Math.min(Math.max(conf, 0), 1) : 0;
    return {
      exercise: name, category: cat, intensity: intensity,
      isStrength: obj.isStrength === true || cat === 'strength' || cat === 'bodyweight',
      reps: reps, confidence: conf
    };
  }

  function detectExercise(frames) {
    var key = getKey();
    if (!key) return Promise.reject(new Error('no-key'));
    if (!frames || !frames.length) return Promise.reject(new Error('no-image'));
    var content = [];
    frames.slice(0, 4).forEach(function (d) {
      var m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(d || '');
      if (m) content.push({ type: 'image', source: { type: 'base64', media_type: m[1], data: m[2] } });
    });
    if (!content.length) return Promise.reject(new Error('no-image'));
    content.push({ type: 'text', text: 'Identify the exercise in these frames.' });

    var body = {
      model: MODELS.quick,
      max_tokens: 150,
      system: DETECT_SYSTEM,
      messages: [{ role: 'user', content: content }]
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
          if (resp.status === 401) msg = 'Invalid API key — check it in the Coach tab.';
          if (resp.status === 429) msg = 'Rate limited — try again in a minute.';
          throw new Error(msg);
        }
        var text = '';
        (data.content || []).forEach(function (block) { if (block.type === 'text') text += block.text; });
        return coerceDetection(text);
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
    ask: ask,
    detectExercise: detectExercise
  };
})();
