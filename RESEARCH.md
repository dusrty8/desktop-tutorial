# Research: HealthifyMe & the Indian food-tracking landscape

This document summarizes the research behind **Annapurna**, the Indian-first
calorie tracker and fitness planner in this repository.

## 1. What HealthifyMe does (feature teardown)

HealthifyMe is India's largest health & fitness app. Its core loop and the
features Annapurna models:

| HealthifyMe feature | What it does | Annapurna equivalent |
|---|---|---|
| Indian food database | ~50,000 hand-curated Indian foods with detailed nutritive values | 262-item curated database of Indian dishes, IFCT 2017/INDB-grounded, expandable |
| Calorie budget | Daily kcal budget from profile + goal | Mifflin-St Jeor BMR × activity factor, goal-paced deficit/surplus with safety floors |
| Macro tracking | Protein, carbs, fat, fibre counts | Same four, with per-day targets and progress bars + donut |
| Food logging | Log by meal with servings | Meal-wise logging with katori/piece servings, half-serving steps |
| Weight tracking | Log & trend weight | Weight log with SVG trend chart, goal line, BMI (Asian-Indian cutoffs) |
| Water tracking | Glasses per day | 250 ml glasses, target = 35 ml/kg |
| Exercise tracking | ~1,500 exercises | 45+ activities (incl. Indian context: kabaddi, garba, jhadu-pocha) with MET-based burn |
| Diet plans (Ria/coach) | Personalised Indian meal plans | Deterministic 7-day plan generator: 4 meals, staple portions scaled to budget, protein rescue, diet-preference aware (veg/vegan/egg/non-veg/Jain) |
| Workout plans | Coach-built weekly routines | Weekly plan generator by goal/level/days/home-vs-gym with estimated burn |
| Snap photo logging | AI dish recognition | Out of scope for v1 (needs ML backend) |
| Coaches / premium | Human coaching | Out of scope |

## 2. Why generic trackers get Indian food wrong

Western apps (e.g. MyFitnessPal) misestimate Indian cooking because:

1. **The fat is in the tadka, not the ingredient list.** The same dal ranges
   from ~110 kcal (plain boiled) to ~250 kcal (dhaba-style with ghee tadka).
2. **Oil identity and quantity vary by region** — mustard (East/North),
   coconut (Kerala), groundnut (West), sesame (South), ghee everywhere.
3. **Cooking method dominates**: steamed (idli/dhokla) vs shallow-fried
   (paratha/tikki) vs deep-fried (puri/samosa) changes energy density 2–4×.
4. **Serving units are Indian** — katori, roti, piece — not cups/oz.

Annapurna's answer, applied at logging time on oil-sensitive dishes:

- **Cooking style multiplier** on the dish's fat grams:
  home-light ×0.7 · home-standard ×1.0 · restaurant/dhaba ×1.5
- **Added oil/ghee in teaspoons**, per fat type (ghee 45 kcal/tsp, butter 36,
  vegetable oils ~40)
- **Fried flags** (deep/shallow) baked into the base values

## 3. Data foundation

- **IFCT 2017** (ICMR–National Institute of Nutrition, Hyderabad): the
  authoritative Indian food composition tables — 528 key foods, 151
  nutrients, sampled from six regions. Covers *raw* foods only.
- **INDB (Indian Nutrient Databank)**: builds on IFCT with ~1,095 single
  foods and ~1,014 standardized recipes for cooked/composite dishes —
  the methodology Annapurna's cooked-dish values follow (standard home-style
  recipe, per-serving).
- **Compendium of Physical Activities**: MET values used for exercise burn
  (kcal = MET × 3.5 × kg / 200 × minutes).
- **BMR**: Mifflin-St Jeor. **BMI**: Asian-Indian cutoffs (normal < 23,
  overweight 23–24.9, obese ≥ 25) per ICMR consensus guidance.

## 4. Sources

- [HealthifyMe — official app page](https://www.healthifyme.com/app/)
- [HealthifyMe — Indian calorie counter](https://www.healthifyme.com/new)
- [HealthifyMe — Wikipedia](https://en.wikipedia.org/wiki/HealthifyMe)
- [HealthifyMe on Google Play](https://play.google.com/store/apps/details?id=com.healthifyme.basic&hl=en_IN&gl=US)
- [HealthifyMe vs MyFitnessPal for Indians (2026)](https://www.fittrackai.in/blog/healthifyme-vs-myfitnesspal-which-is-better-for-indians-2026)
- [Development of an Indian Food Composition Database (INDB) — PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC11277795/)
- [Indian Food Composition Tables 2017 — ICMR-NIN](https://www.nin.res.in/achievements.html)
- [IFCT 2017 dataset mirror (542 key foods)](https://github.com/ifct2017/ifct2017)
- [Indian Food Composition — ifct2017.github.io](https://ifct2017.github.io/)

## 5. Roadmap ideas (beyond v1)

- Grow the database toward full INDB coverage (~1,000 recipes) with regional
  variants; import pipeline from the open IFCT dataset.
- Barcode scanning for packaged foods (FSSAI label data).
- Photo-based dish recognition ("Snap"-style) via a vision model.
- Streaks, reminders, and weekly insight reports.
- Sync/accounts (v1 is deliberately local-first and private).
