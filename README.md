# 🌿 Annapurna — Indian Calorie Tracker & Fitness Planner

A HealthifyMe-style tracker built **Indian-first**: the food database, the
serving sizes (katori, roti, piece), the oils, the tadka and the cooking
styles are all Indian — so calorie counts are accurate for the food we
actually eat.

No accounts, no backend, no build step. Everything runs in your browser and
your data stays on your device (localStorage).

## Run it

Open `index.html` in any modern browser — that's it.

Or serve it (nicer URLs, works around strict browser settings):

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## What it does

- **Profile & goals** — enter age, sex, height, weight, goal weight,
  activity level, pace and diet preference (veg / vegan / eggetarian /
  non-veg / Jain). The app computes your BMR (Mifflin-St Jeor), TDEE,
  daily calorie budget, protein/carb/fat/fibre targets, water target and
  BMI (Asian-Indian cutoffs).
- **Food logging** — search 260+ Indian foods (with Hindi/regional aliases:
  chaas, pulihora, garelu, kanda poha…), log by meal in Indian servings.
- **Oil & cooking-style accuracy** — for tadka/oil-heavy dishes choose
  *home-light / home-standard / restaurant-dhaba* and add extra
  ghee/oil by the teaspoon (per oil type). This is the biggest source of
  error in generic trackers for Indian food.
- **Dashboard** — calorie budget vs eaten vs burned, macro donut and
  progress bars, water glasses, exercise log.
- **Weight tracking** — log daily weight, SVG trend chart with goal line,
  change stats.
- **Exercise** — 45+ activities with MET-based burn (walking to kabaddi to
  jhadu-pocha), logged against your body weight.
- **7-day diet plan generator** — HealthifyMe-coach-style plans: four meals,
  Indian staples scaled to your budget (±10%), protein topped up when
  short, fully diet-preference aware. Regenerate for variety; log any
  day's plan to your diary with one click.
- **Weekly workout plan generator** — by goal (lose/maintain/gain), level,
  days per week, home or gym, with estimated calorie burn.
- **Backup** — export/import all data as JSON.

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
index.html            app shell (7 views)
css/style.css         theme (light/dark), validated chart palette
js/data/foods.js      262 Indian foods — the database (easy to extend)
js/data/exercises.js  exercise MET database
js/nutrition.js       BMR/TDEE/macros, oil & cooking-style math
js/planner.js         7-day diet plan + weekly workout plan generators
js/store.js           localStorage persistence
js/charts.js          dependency-free SVG charts
js/app.js             UI wiring
```

## Adding foods

Append one line in `js/data/foods.js`:

```js
F('id', 'Display name', CATEGORY, 'veg|vegan|egg|nonveg', '1 katori (150 g)',
  150, kcal, protein, carbs, fat, fiber,
  { role: 'main', aka: ['Regional name'], tags: ['og'], oil: true });
```

`oil: true` enables the cooking-style/extra-oil adjustments at logging time.
