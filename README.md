# 🌿 Annapurna — Indian Calorie Tracker & Fitness Planner

A HealthifyMe-style tracker built **Indian-first**: the food database, the
serving sizes (katori, roti, piece), the oils, the tadka and the cooking
styles are all Indian — so calorie counts are accurate for the food we
actually eat.

No accounts, no backend, no build step. Everything runs in your browser and
your data stays on your device (localStorage).

**📱 Live app:** https://dusrty8.github.io/desktop-tutorial/ — open it on
your phone and add it to your home screen (see below).

## Run it

Open `index.html` in any modern browser — that's it.

Or serve it (nicer URLs, works around strict browser settings):

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Use it on your phone (Android & iOS)

Annapurna is a **PWA** — it installs to your home screen and works fully
offline (your data lives on the phone in localStorage).

1. **Host it once.** Merging this repo to `main` triggers the included
   GitHub Pages workflow (`.github/workflows/deploy-pages.yml`), which
   publishes the app at `https://<your-username>.github.io/<repo>/`.
   (Any static HTTPS host works.)
2. **Android (Chrome):** open the URL → menu **⋮** → **Add to Home screen**
   (or the automatic "Install app" prompt). It opens full-screen like a
   native app.
3. **iPhone/iPad (Safari):** open the URL → **Share** □↑ → **Add to Home
   Screen**. It launches standalone with the Annapurna icon.
4. After the first visit the app works **offline** — food database, logging,
   plans, weight tracking, everything.

> Data is per-device (browser storage). To move between phone and laptop,
> use **Profile → Export backup** on one device and **Import backup** on the
> other.

## What it does

- **Profile & intelligent goals** — enter age, sex, height, weight, goal
  weight, activity, pace and diet preference (veg / vegan / eggetarian /
  non-veg / Jain), and pick a goal mode: lose fat, build muscle, **build
  muscle + lose fat (recomposition)**, or maintain. The app computes your
  BMR (Mifflin-St Jeor), TDEE, a goal-appropriate calorie budget (a deficit
  goal is never allowed to become a surplus), protein/carb/fat/fibre
  targets, water target and BMI (Asian-Indian cutoffs).
- **Food logging** — search 290+ Indian foods (with Hindi/regional aliases:
  chaas, pulihora, garelu, kanda poha…), log by Indian serving **or by
  grams**, per meal. A live "today so far" panel shows every entry, running
  totals, macro bars and calories remaining as you log.
- **Regional dishes** — country chicken (nattu kozhi) curry as its own entry
  distinct from regular chicken curry, plus Andhra kodi vepudu, Kerala stew
  & beef fry, haleem, laal maas, litti chokha, dal baati churma, chingri
  malai, neer dosa, ragi mudde, undhiyu and more.
- **Oil & cooking-style accuracy** — for tadka/oil-heavy dishes choose
  *home-light / home-standard / restaurant-dhaba* and add extra
  ghee/oil by the teaspoon (per oil type). This is the biggest source of
  error in generic trackers for Indian food.
- **Coach (free, on-device)** — an adaptive dietician that reads every entry
  and gives guidance cards: indulgence make-up ("that beer + jalebi is ~335
  kcal — a 25-min skipping session covers it"), protein gaps, pacing,
  fibre, water, and weight-trend feedback.
- **AI Dietician (optional, bring-your-own key)** — connect your own
  Anthropic API key for a conversational dietician that reads your actual
  logs. Cost-routed so it stays cheap: daily check-ins run on **Claude
  Haiku**, weekly deep reviews on **Claude Sonnet** (never a frontier
  model). The key lives only in your browser and is sent only to
  api.anthropic.com — never to us. Without a key, the free on-device coach
  above still works.
- **Dashboard** — an energy-balance hero: a calorie ring (remaining in the
  centre), an **eaten − burned = net** readout against your budget, and an
  **AI/coach suggestions** strip surfaced right up top (with a one-tap
  ✨ AI insight). Below it: macro donut and progress bars, water glasses and
  the day's exercise log.
- **Weight tracking** — log daily weight, SVG trend chart with goal line,
  change stats.
- **Workout tracker** — log **strength** by sets × reps × weight (calories
  burned are computed for you — working sets at the move's MET, rest at
  near-resting) or **cardio** by minutes, both against your body weight.
  Don't know what to pick? Point your **camera** at yourself, or **upload a
  photo or short video**, and the app identifies the exercise for you (see
  below), then you fill in the numbers. 65+ activities and named lifts —
  bench, squat, deadlift, OHP, pulldown, curls, walking to kabaddi to
  jhadu-pocha.
- **Camera / photo / video exercise detection** — an optional AI vision
  step: a single downscaled frame (a live-camera capture, an uploaded photo,
  or a few frames pulled from an uploaded clip) is sent to **Claude Haiku
  vision** using *your own* Anthropic key to name the exercise. It's a
  best-guess helper — you can always correct the picker — and manual logging
  works with no key at all. Frames go only to api.anthropic.com; nothing is
  stored anywhere but your browser.
- **7-day diet plan generator** — coach-style plans: four meals, Indian
  staples scaled to your budget (±10%), protein-first for muscle goals,
  fully diet-preference aware. Regenerate for variety; log any day's plan
  to your diary with one click.
- **Weekly workout plan generator** — by goal (lose / maintain / gain /
  recomposition), level, days per week, home or gym, with estimated burn.
- **Backup** — export/import all data as JSON (validated on import).

## Data foundation

Nutrition values are compiled per serving from the ICMR-NIN **Indian Food
Composition Tables (IFCT 2017)** for raw foods and the **Indian Nutrient
Databank (INDB)** recipe methodology for cooked dishes. Exercise burn uses
the **Compendium of Physical Activities** MET values. See
[RESEARCH.md](RESEARCH.md) for the full research notes and sources.

> ⚠️ Nutrition values are estimates for typical preparations. This app is
> not medical advice — consult a professional for clinical diet planning.

## Project layout

```
index.html            app shell (8 views)
css/style.css         "Banana leaf & turmeric" theme (light/dark), validated chart palette
js/data/foods.js      290+ Indian foods — the database (easy to extend)
js/data/exercises.js  exercise MET database (incl. named strength lifts)
js/nutrition.js       BMR/TDEE/macros, goal modes, oil & cooking-style, strength burn
js/planner.js         7-day diet plan + weekly workout plan generators
js/store.js           localStorage persistence + import sanitization
js/coach.js           free, on-device rule-based dietician
js/ai.js              optional AI dietician + vision exercise detection (BYO key, Haiku/Sonnet)
js/charts.js          dependency-free SVG charts (line, donut, calorie ring)
js/app.js             UI wiring
```

## Coaching architecture (cost-aware)

Three tiers, cheapest first:

- **Tier 0 — `coach.js`** — a free, instant, offline rule engine. Always on.
- **Tier 1 — `ai.js` daily** — `claude-haiku-4-5` for quick check-ins and
  free-form questions (a few paise each).
- **Tier 2 — `ai.js` weekly** — `claude-sonnet-5` for the deeper weekly
  review that re-plans your week.

No tier ever calls a frontier model — a dietician nudge doesn't need one, and
this keeps a heavy user's cost to a few rupees a month. Only a small,
structured summary of your recent logs is sent (never your name), using your
own key, directly to `api.anthropic.com`.

**Vision exercise detection** rides the same cheapest tier: `claude-haiku-4-5`
identifies the move from one downscaled frame — a best-guess classification
doesn't need a bigger model. It's optional and opt-in (needs your key);
manual logging always works without it.

## Using the AI features — your key stays yours

The AI dietician and the camera/photo exercise detection run on **your own**
Anthropic API key, entered by you. There is **no shared key** and no server:

- The key is stored only in your browser and is sent only to
  `api.anthropic.com` — never to us, and **never to anyone else who opens the
  public app** (each person connects their own key; a visitor with no key just
  can't use the AI features).
- The key is **not** part of the data backup (Export), never logged, and never
  written into the page.
- On connect you can untick **"Remember my key on this device"** to keep it
  **session-only** (cleared when you close the tab) — recommended on a shared or
  public computer. Otherwise it persists until you tap **Disconnect key**.

Two same-browser cautions (not reachable by other visitors): on a shared
`*.github.io` account all your pages share one origin and could read the stored
key, and browser extensions can read it too. So:

- Use a **dedicated Anthropic key with a low spend limit** for this app.
- To remove the shared-origin risk entirely, host on a **dedicated origin** — a
  custom domain, or a GitHub account that hosts only this app.

## Adding foods

Append one line in `js/data/foods.js`:

```js
F('id', 'Display name', CATEGORY, 'veg|vegan|egg|nonveg', '1 katori (150 g)',
  150, kcal, protein, carbs, fat, fiber,
  { role: 'main', aka: ['Regional name'], tags: ['og'], oil: true });
```

`oil: true` enables the cooking-style/extra-oil adjustments at logging time.
