/*
 * Annapurna — exercise database.
 *
 * `met` is the metabolic equivalent from the Compendium of Physical
 * Activities. Calories burned = MET × 3.5 × weight(kg) / 200 × minutes.
 */
(function () {
  'use strict';
  var EXERCISES = [];
  function E(id, name, cat, met) {
    EXERCISES.push({ id: id, name: name, cat: cat, met: met });
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
