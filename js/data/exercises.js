/*
 * Annapurna — exercise database.
 *
 * `met` is the metabolic equivalent from the Compendium of Physical
 * Activities. Calories burned = MET × 3.5 × weight(kg) / 200 × minutes.
 *
 * opts.strength === true marks a resistance move logged by sets × reps ×
 * weight (the workout tracker derives its duration and burn from those via
 * Nutrition.strengthKcal). opts.muscle is the primary muscle group and
 * opts.aka are alternate names that help the camera/photo AI detector map a
 * recognised exercise onto this row.
 */
(function () {
  'use strict';
  var EXERCISES = [];
  function E(id, name, cat, met, opts) {
    opts = opts || {};
    EXERCISES.push({
      id: id, name: name, cat: cat, met: met,
      strength: !!opts.strength, muscle: opts.muscle || null, aka: opts.aka || []
    });
  }

  var WK = 'Walking & Running';
  E('walk-casual', 'Walking — casual (3–4 km/h)', WK, 2.8);
  E('walk-brisk', 'Walking — brisk (5–6 km/h)', WK, 4.3);
  E('walk-fast', 'Walking — very brisk (6.5+ km/h)', WK, 5.0);
  E('jog', 'Jogging (8 km/h)', WK, 8.3);
  E('run-10', 'Running (10 km/h)', WK, 9.8);
  E('run-12', 'Running (12 km/h)', WK, 11.5);
  E('stairs', 'Stair climbing', WK, 8.0);
  E('hiking', 'Hiking / trekking', WK, 6.0);

  var CY = 'Cycling';
  E('cycle-leisure', 'Cycling — leisure (<16 km/h)', CY, 4.0);
  E('cycle-moderate', 'Cycling — moderate (16–19 km/h)', CY, 6.8);
  E('cycle-fast', 'Cycling — vigorous (20+ km/h)', CY, 10.0);
  E('stationary-bike', 'Stationary bike — moderate', CY, 6.8);

  var GY = 'Gym & Strength';
  E('weights-moderate', 'Weight training — moderate', GY, 3.5);
  E('weights-vigorous', 'Weight training — vigorous', GY, 6.0);
  E('circuit', 'Circuit training', GY, 8.0);
  E('hiit', 'HIIT session', GY, 8.0);
  E('elliptical', 'Elliptical trainer', GY, 5.0);
  E('rowing', 'Rowing machine — moderate', GY, 7.0);
  E('treadmill-incline', 'Treadmill incline walk', GY, 6.0);

  /* Strength — logged by sets × reps × weight (see Nutrition.strengthKcal).
     MET follows the Compendium: compound barbell work ~6.0, machine/isolation
     ~3.5–5.0. aka names widen AI-detector matching. */
  var ST = 'Strength (sets & reps)';
  E('bench-press', 'Barbell bench press', ST, 6.0, { strength: true, muscle: 'Chest', aka: ['bench press', 'chest press', 'flat bench'] });
  E('incline-press', 'Incline dumbbell press', ST, 5.5, { strength: true, muscle: 'Chest', aka: ['incline press', 'incline bench'] });
  E('pushup', 'Push-ups', ST, 5.0, { strength: true, muscle: 'Chest', aka: ['pushup', 'push up', 'press up'] });
  E('dips', 'Dips (chest/triceps)', ST, 5.0, { strength: true, muscle: 'Chest & triceps', aka: ['parallel bar dip', 'tricep dip'] });
  E('squat', 'Barbell back squat', ST, 6.0, { strength: true, muscle: 'Legs', aka: ['squat', 'back squat', 'barbell squat'] });
  E('goblet-squat', 'Goblet squat', ST, 5.0, { strength: true, muscle: 'Legs', aka: ['dumbbell squat', 'kettlebell squat'] });
  E('leg-press', 'Leg press', ST, 5.0, { strength: true, muscle: 'Legs', aka: ['machine leg press'] });
  E('lunges', 'Walking lunges', ST, 5.0, { strength: true, muscle: 'Legs', aka: ['lunge', 'split squat'] });
  E('leg-extension', 'Leg extension', ST, 3.5, { strength: true, muscle: 'Quads', aka: ['quad extension'] });
  E('leg-curl', 'Leg curl', ST, 3.5, { strength: true, muscle: 'Hamstrings', aka: ['hamstring curl'] });
  E('calf-raise', 'Calf raise', ST, 3.5, { strength: true, muscle: 'Calves', aka: ['standing calf raise'] });
  E('deadlift', 'Deadlift', ST, 6.0, { strength: true, muscle: 'Back & legs', aka: ['conventional deadlift'] });
  E('romanian-deadlift', 'Romanian deadlift', ST, 6.0, { strength: true, muscle: 'Hamstrings', aka: ['rdl', 'stiff leg deadlift'] });
  E('hip-thrust', 'Hip thrust', ST, 5.0, { strength: true, muscle: 'Glutes', aka: ['glute bridge', 'barbell hip thrust'] });
  E('overhead-press', 'Overhead shoulder press', ST, 6.0, { strength: true, muscle: 'Shoulders', aka: ['ohp', 'military press', 'shoulder press'] });
  E('lateral-raise', 'Dumbbell lateral raise', ST, 3.5, { strength: true, muscle: 'Shoulders', aka: ['side raise', 'lateral raise'] });
  E('lat-pulldown', 'Lat pulldown', ST, 5.0, { strength: true, muscle: 'Back', aka: ['pulldown', 'lat pull down'] });
  E('pullup', 'Pull-ups / chin-ups', ST, 5.0, { strength: true, muscle: 'Back', aka: ['pullup', 'chin up', 'chinup'] });
  E('barbell-row', 'Barbell row', ST, 6.0, { strength: true, muscle: 'Back', aka: ['bent over row', 'bent-over row'] });
  E('dumbbell-row', 'Dumbbell row', ST, 5.0, { strength: true, muscle: 'Back', aka: ['db row', 'one arm row'] });
  E('bicep-curl', 'Bicep curl', ST, 3.5, { strength: true, muscle: 'Arms', aka: ['dumbbell curl', 'barbell curl', 'curl'] });
  E('tricep-pushdown', 'Tricep pushdown', ST, 3.5, { strength: true, muscle: 'Arms', aka: ['cable pushdown', 'tricep extension'] });
  E('plank', 'Plank (per set as reps=1)', ST, 3.3, { strength: true, muscle: 'Core', aka: ['front plank', 'elbow plank'] });
  E('situp', 'Sit-ups / crunches', ST, 3.8, { strength: true, muscle: 'Core', aka: ['crunch', 'sit up', 'abs'] });

  var HM = 'Home & Bodyweight';
  E('bodyweight', 'Bodyweight workout (squats, push-ups, lunges)', HM, 3.8);
  E('bodyweight-vigorous', 'Bodyweight workout — vigorous', HM, 8.0);
  E('skipping-slow', 'Skipping rope — slow', HM, 8.8);
  E('skipping-fast', 'Skipping rope — fast', HM, 11.0);
  E('core', 'Core / abs workout', HM, 3.8);

  var YG = 'Yoga & Mind-Body';
  E('yoga-hatha', 'Yoga — hatha (gentle)', YG, 2.5);
  E('yoga-power', 'Yoga — power / vinyasa', YG, 4.0);
  E('surya-namaskar', 'Surya namaskar (continuous rounds)', YG, 3.8);
  E('stretching', 'Stretching / mobility', YG, 2.3);
  E('pranayama', 'Pranayama / breathing', YG, 1.5);

  var SP = 'Sports';
  E('badminton', 'Badminton', SP, 5.5);
  E('cricket', 'Cricket (batting/bowling)', SP, 4.8);
  E('football', 'Football', SP, 7.0);
  E('basketball', 'Basketball', SP, 6.5);
  E('tennis', 'Tennis', SP, 7.3);
  E('table-tennis', 'Table tennis', SP, 4.0);
  E('volleyball', 'Volleyball', SP, 3.5);
  E('kabaddi', 'Kabaddi', SP, 8.0);
  E('squash', 'Squash', SP, 9.5);
  E('swimming-leisure', 'Swimming — leisure', SP, 6.0);
  E('swimming-laps', 'Swimming — laps, moderate', SP, 8.3);

  var DA = 'Dance & Aerobics';
  E('zumba', 'Zumba', DA, 6.5);
  E('aerobics', 'Aerobics', DA, 6.8);
  E('bhangra', 'Bhangra / high-energy dance', DA, 6.5);
  E('garba', 'Garba / dandiya', DA, 5.5);
  E('classical-dance', 'Classical dance practice', DA, 4.8);

  var HH = 'Household';
  E('mopping', 'Mopping / pocha', HH, 3.5);
  E('sweeping', 'Sweeping / jhadu', HH, 3.3);
  E('cooking', 'Cooking (standing)', HH, 2.0);
  E('gardening', 'Gardening', HH, 3.8);
  E('washing-clothes', 'Washing clothes by hand', HH, 3.3);

  window.EXERCISES = EXERCISES;
})();
