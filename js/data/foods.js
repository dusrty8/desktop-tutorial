/*
 * Annapurna — Indian food database.
 *
 * Nutrient values are per the stated serving, compiled from the ICMR-NIN
 * Indian Food Composition Tables (IFCT 2017) for raw foods and the Indian
 * Nutrient Databank (INDB) recipe methodology for cooked/composite dishes.
 * Values for cooked dishes assume a "standard home-style" preparation;
 * the logger applies cooking-style and added-oil adjustments on top.
 *
 * Fields: id, name, cat(egory), diet, unit, grams, kcal, protein, carbs,
 * fat, fiber (grams), plus options:
 *   role  — slot used by the diet-plan generator
 *           staple | main | sabzi | side | breakfast | snack | beverage |
 *           fruit | sweet | ingredient | supplement
 *           ('supplement' foods are fully loggable/searchable but are never
 *            auto-inserted into generated diet plans or coach suggestions —
 *            supplements are opt-in, not pushed)
 *   aka   — alternate/regional names (searchable)
 *   tags  — dairy | og (onion-garlic) | root | gf (gluten-free) |
 *           boost (protein booster) | meal (complete one-plate meal, the
 *           planner adds no staple/sabzi) | noplan (loggable, never planned)
 *   oil   — true if the dish is oil-sensitive (tadka/frying dominates fat)
 *   fried — 'deep' | 'shallow' when frying defines the dish
 *
 * diet: 'vegan' ⊂ 'veg' ⊂ 'egg' ⊂ 'nonveg' (strictest class that fits).
 */
(function () {
  'use strict';
  var FOODS = [];
  function F(id, name, cat, diet, unit, grams, kcal, p, c, f, fb, o) {
    o = o || {};
    FOODS.push({
      id: id, name: name, cat: cat, diet: diet, unit: unit, grams: grams,
      kcal: kcal, protein: p, carbs: c, fat: f, fiber: fb,
      role: o.role || 'main', aka: o.aka || [], tags: o.tags || [],
      oil: !!o.oil, fried: o.fried || null
    });
  }

  /* ---------------- Rotis & Breads ---------------- */
  var BR = 'Rotis & Breads';
  F('roti', 'Roti / Phulka (whole wheat, no ghee)', BR, 'vegan', '1 medium roti', 40, 104, 3.1, 20.6, 1.2, 2.3, { role: 'staple', aka: ['Chapati', 'Phulka'] });
  F('roti-ghee', 'Roti with ghee (1 tsp)', BR, 'veg', '1 medium roti', 45, 149, 3.1, 20.6, 6.2, 2.3, { role: 'staple', tags: ['dairy'], aka: ['Chapati with ghee'] });
  F('tandoori-roti', 'Tandoori roti', BR, 'vegan', '1 roti', 55, 155, 4.6, 30.0, 1.6, 3.0, { role: 'staple' });
  F('naan', 'Naan (plain)', BR, 'veg', '1 naan', 90, 260, 7.5, 45.0, 5.5, 2.0, { role: 'staple', tags: ['dairy'] });
  F('butter-naan', 'Butter naan', BR, 'veg', '1 naan', 100, 310, 7.5, 45.0, 11.0, 2.0, { role: 'staple', tags: ['dairy'] });
  F('garlic-naan', 'Garlic naan', BR, 'veg', '1 naan', 100, 300, 8.0, 46.0, 9.0, 2.2, { role: 'staple', tags: ['dairy', 'og'] });
  F('plain-paratha', 'Plain paratha', BR, 'veg', '1 paratha', 80, 240, 4.5, 30.0, 11.0, 3.0, { role: 'staple', oil: true, tags: ['dairy'] });
  F('aloo-paratha', 'Aloo paratha', BR, 'veg', '1 paratha', 120, 290, 6.0, 42.0, 11.0, 4.0, { role: 'breakfast', oil: true, tags: ['root', 'og'] });
  F('gobi-paratha', 'Gobi paratha', BR, 'veg', '1 paratha', 120, 270, 7.0, 38.0, 10.0, 4.5, { role: 'breakfast', oil: true, tags: ['og'] });
  F('paneer-paratha', 'Paneer paratha', BR, 'veg', '1 paratha', 130, 330, 11.0, 36.0, 16.0, 3.5, { role: 'breakfast', oil: true, tags: ['dairy'] });
  F('methi-thepla', 'Methi thepla', BR, 'vegan', '1 thepla', 50, 130, 3.5, 18.0, 5.0, 2.5, { role: 'breakfast', oil: true, aka: ['Thepla'] });
  F('puri', 'Puri (fried)', BR, 'vegan', '1 puri', 25, 105, 1.5, 12.0, 5.7, 1.0, { role: 'staple', fried: 'deep' });
  F('bhatura', 'Bhatura', BR, 'veg', '1 bhatura', 100, 330, 7.0, 48.0, 12.0, 2.0, { role: 'staple', fried: 'deep', tags: ['dairy'] });
  F('missi-roti', 'Missi roti', BR, 'vegan', '1 roti', 60, 165, 6.0, 26.0, 4.0, 3.5, { role: 'staple', tags: ['og'] });
  F('makki-roti', 'Makki di roti', BR, 'vegan', '1 roti', 65, 180, 4.0, 30.0, 5.0, 3.0, { role: 'staple', tags: ['gf'] });
  F('jowar-roti', 'Jowar roti / bhakri', BR, 'vegan', '1 roti', 50, 138, 3.3, 27.0, 1.3, 3.5, { role: 'staple', tags: ['gf'], aka: ['Jwarichi bhakri', 'Sorghum roti'] });
  F('bajra-roti', 'Bajra roti / bhakri', BR, 'vegan', '1 roti', 60, 190, 5.5, 33.0, 3.5, 4.0, { role: 'staple', tags: ['gf'], aka: ['Pearl millet roti'] });
  F('ragi-roti', 'Ragi roti', BR, 'vegan', '1 roti', 60, 170, 4.0, 33.0, 2.5, 4.5, { role: 'staple', tags: ['gf'], aka: ['Nachni roti', 'Finger millet roti'] });
  F('kulcha', 'Kulcha (plain)', BR, 'veg', '1 kulcha', 80, 235, 6.5, 40.0, 5.5, 1.8, { role: 'staple', tags: ['dairy'] });
  F('rumali-roti', 'Rumali roti', BR, 'vegan', '1 roti', 45, 120, 3.5, 24.0, 1.5, 1.2, { role: 'staple' });
  F('bread-white', 'Bread slice (white)', BR, 'vegan', '1 slice', 25, 67, 2.0, 13.0, 0.8, 0.6, { role: 'breakfast' });
  F('bread-brown', 'Bread slice (brown/whole wheat)', BR, 'vegan', '1 slice', 25, 65, 2.5, 12.0, 0.9, 1.4, { role: 'breakfast' });
  F('pav', 'Pav / ladi pav', BR, 'veg', '1 pav', 40, 110, 3.5, 21.0, 1.5, 0.8, { role: 'staple', tags: ['dairy'] });

  /* ---------------- Rice, Khichdi & Biryani ---------------- */
  var RC = 'Rice, Khichdi & Biryani';
  F('rice-white', 'Steamed white rice', RC, 'vegan', '1 katori (150 g cooked)', 150, 180, 3.5, 40.0, 0.4, 0.9, { role: 'staple', tags: ['gf'], aka: ['Chawal', 'Plain rice'] });
  F('rice-brown', 'Brown rice (cooked)', RC, 'vegan', '1 katori (150 g)', 150, 165, 3.9, 34.0, 1.3, 2.7, { role: 'staple', tags: ['gf'] });
  F('jeera-rice', 'Jeera rice', RC, 'vegan', '1 katori (150 g)', 150, 235, 4.0, 40.0, 7.0, 1.2, { role: 'staple', oil: true, tags: ['gf'] });
  F('veg-pulao', 'Vegetable pulao', RC, 'vegan', '1 plate (200 g)', 200, 290, 6.0, 45.0, 9.0, 3.5, { role: 'staple', oil: true, tags: ['og'] });
  F('veg-biryani', 'Vegetable biryani', RC, 'veg', '1 plate (250 g)', 250, 400, 8.0, 58.0, 14.0, 4.0, { role: 'main', oil: true, tags: ['og', 'dairy', 'meal'] });
  F('chicken-biryani', 'Chicken biryani', RC, 'nonveg', '1 plate (250 g)', 250, 450, 22.0, 52.0, 16.0, 2.5, { role: 'main', oil: true, tags: ['og', 'dairy', 'meal'] });
  F('mutton-biryani', 'Mutton biryani', RC, 'nonveg', '1 plate (250 g)', 250, 500, 24.0, 50.0, 22.0, 2.5, { role: 'main', oil: true, tags: ['og', 'dairy', 'meal'] });
  F('egg-biryani', 'Egg biryani', RC, 'egg', '1 plate (250 g)', 250, 420, 16.0, 52.0, 15.0, 2.5, { role: 'main', oil: true, tags: ['og', 'meal'] });
  F('curd-rice', 'Curd rice', RC, 'veg', '1 bowl (200 g)', 200, 250, 6.5, 38.0, 7.5, 1.0, { role: 'main', tags: ['dairy', 'gf', 'meal'], aka: ['Thayir sadam', 'Daddojanam'] });
  F('lemon-rice', 'Lemon rice', RC, 'vegan', '1 plate (180 g)', 180, 265, 4.5, 42.0, 8.5, 1.5, { role: 'staple', oil: true, tags: ['gf'], aka: ['Chitranna'] });
  F('tamarind-rice', 'Tamarind rice', RC, 'vegan', '1 plate (180 g)', 180, 280, 5.0, 45.0, 9.0, 2.0, { role: 'staple', oil: true, tags: ['gf'], aka: ['Puliyodarai', 'Pulihora'] });
  F('moong-khichdi', 'Moong dal khichdi', RC, 'vegan', '1 bowl (250 g)', 250, 285, 10.0, 45.0, 7.0, 4.0, { role: 'main', oil: true, tags: ['gf', 'meal'], aka: ['Khichdi'] });
  F('veg-fried-rice', 'Veg fried rice', RC, 'vegan', '1 plate (200 g)', 200, 330, 6.0, 48.0, 12.0, 2.5, { role: 'main', oil: true, tags: ['og', 'meal'] });
  F('daliya', 'Daliya (broken-wheat porridge, savoury)', RC, 'vegan', '1 bowl (200 g)', 200, 220, 6.5, 38.0, 5.0, 4.5, { role: 'breakfast', aka: ['Dalia', 'Broken wheat upma'] });

  /* ---------------- Dal & Legumes ---------------- */
  var DL = 'Dal & Legumes';
  F('dal-tadka', 'Dal tadka (toor/arhar)', DL, 'vegan', '1 katori (150 g)', 150, 165, 8.0, 20.0, 5.5, 4.0, { role: 'main', oil: true, tags: ['og', 'gf'], aka: ['Toor dal', 'Arhar dal'] });
  F('dal-fry', 'Dal fry', DL, 'veg', '1 katori (150 g)', 150, 180, 8.0, 20.0, 7.0, 4.0, { role: 'main', oil: true, tags: ['og', 'gf'] });
  F('dal-makhani', 'Dal makhani', DL, 'veg', '1 katori (150 g)', 150, 250, 9.0, 20.0, 15.0, 4.5, { role: 'main', oil: true, tags: ['dairy', 'og', 'gf'] });
  F('moong-dal-plain', 'Moong dal (yellow, lightly tempered)', DL, 'vegan', '1 katori (150 g)', 150, 130, 8.5, 18.0, 2.5, 3.5, { role: 'main', oil: true, tags: ['gf'] });
  F('masoor-dal', 'Masoor dal', DL, 'vegan', '1 katori (150 g)', 150, 140, 8.5, 19.0, 3.0, 3.8, { role: 'main', oil: true, tags: ['og', 'gf'] });
  F('chole', 'Chole / chana masala', DL, 'vegan', '1 katori (150 g)', 150, 240, 9.5, 30.0, 9.0, 7.0, { role: 'main', oil: true, tags: ['og', 'gf'], aka: ['Chana masala', 'Chhole'] });
  F('rajma', 'Rajma masala', DL, 'vegan', '1 katori (150 g)', 150, 215, 9.0, 28.0, 7.5, 7.5, { role: 'main', oil: true, tags: ['og', 'gf'], aka: ['Kidney bean curry'] });
  F('kadhi-pakora', 'Kadhi pakora', DL, 'veg', '1 katori (150 g)', 150, 185, 6.0, 14.0, 11.5, 2.0, { role: 'main', oil: true, fried: 'deep', tags: ['dairy', 'gf'] });
  F('sambar', 'Sambar', DL, 'vegan', '1 katori (150 g)', 150, 130, 5.0, 18.0, 4.0, 3.5, { role: 'main', oil: true, tags: ['og', 'root', 'gf'] });
  F('lobia-curry', 'Lobia curry (black-eyed peas)', DL, 'vegan', '1 katori (150 g)', 150, 190, 9.0, 26.0, 5.5, 5.5, { role: 'main', oil: true, tags: ['og', 'gf'], aka: ['Chawli', 'Karamani'] });
  F('sprouts-salad', 'Moong sprouts salad', DL, 'vegan', '1 bowl (100 g)', 100, 100, 7.0, 15.0, 1.0, 4.0, { role: 'snack', tags: ['gf', 'boost'], aka: ['Sprouts'] });
  F('matki-usal', 'Matki usal (moth beans)', DL, 'vegan', '1 katori (150 g)', 150, 195, 9.0, 24.0, 6.5, 5.0, { role: 'main', oil: true, tags: ['og', 'gf'], aka: ['Usal'] });
  F('dal-palak', 'Dal palak', DL, 'vegan', '1 katori (150 g)', 150, 150, 8.0, 17.0, 5.0, 4.2, { role: 'main', oil: true, tags: ['og', 'gf'] });
  F('sundal', 'Sundal (chana, coconut)', DL, 'vegan', '1 bowl (100 g)', 100, 160, 7.0, 22.0, 5.0, 5.5, { role: 'snack', tags: ['gf'] });
  F('soya-chunk-curry', 'Soya chunks curry', DL, 'vegan', '1 katori (150 g)', 150, 210, 16.0, 14.0, 10.0, 4.5, { role: 'main', oil: true, tags: ['og', 'boost'], aka: ['Meal maker curry', 'Nutrela'] });

  /* ---------------- Veg Sabzi & Curries ---------------- */
  var VS = 'Veg Sabzi & Curries';
  F('aloo-gobi', 'Aloo gobi', VS, 'vegan', '1 katori (150 g)', 150, 160, 3.5, 20.0, 8.0, 4.0, { role: 'sabzi', oil: true, tags: ['root', 'og', 'gf'] });
  F('bhindi-masala', 'Bhindi masala', VS, 'vegan', '1 katori (150 g)', 150, 145, 3.0, 13.0, 9.0, 4.5, { role: 'sabzi', oil: true, tags: ['og', 'gf'], aka: ['Okra fry', 'Vendakkai'] });
  F('jeera-aloo', 'Jeera aloo', VS, 'vegan', '1 katori (150 g)', 150, 180, 3.0, 26.0, 7.5, 3.0, { role: 'sabzi', oil: true, tags: ['root', 'gf'] });
  F('baingan-bharta', 'Baingan bharta', VS, 'vegan', '1 katori (150 g)', 150, 155, 3.5, 13.0, 10.0, 4.8, { role: 'sabzi', oil: true, tags: ['og', 'gf'], aka: ['Vangyache bharit'] });
  F('palak-paneer', 'Palak paneer', VS, 'veg', '1 katori (150 g)', 150, 265, 11.0, 9.0, 21.0, 3.5, { role: 'main', oil: true, tags: ['dairy', 'og', 'gf'] });
  F('paneer-butter-masala', 'Paneer butter masala', VS, 'veg', '1 katori (150 g)', 150, 335, 11.5, 13.0, 26.0, 2.5, { role: 'main', oil: true, tags: ['dairy', 'og', 'gf'], aka: ['Paneer makhani'] });
  F('kadai-paneer', 'Kadai paneer', VS, 'veg', '1 katori (150 g)', 150, 290, 11.0, 12.0, 22.0, 3.0, { role: 'main', oil: true, tags: ['dairy', 'og', 'gf'] });
  F('shahi-paneer', 'Shahi paneer', VS, 'veg', '1 katori (150 g)', 150, 320, 11.0, 14.0, 24.0, 2.5, { role: 'main', oil: true, tags: ['dairy', 'og', 'gf'] });
  F('matar-paneer', 'Matar paneer', VS, 'veg', '1 katori (150 g)', 150, 240, 10.0, 15.0, 16.0, 4.0, { role: 'main', oil: true, tags: ['dairy', 'og', 'gf'] });
  F('malai-kofta', 'Malai kofta', VS, 'veg', '1 katori (150 g)', 150, 330, 8.0, 22.0, 24.0, 3.0, { role: 'main', oil: true, fried: 'deep', tags: ['dairy', 'og', 'root', 'gf'] });
  F('mix-veg', 'Mixed vegetable curry', VS, 'vegan', '1 katori (150 g)', 150, 150, 4.0, 15.0, 8.5, 4.5, { role: 'sabzi', oil: true, tags: ['og', 'root', 'gf'] });
  F('aloo-matar', 'Aloo matar', VS, 'vegan', '1 katori (150 g)', 150, 165, 4.5, 22.0, 7.0, 4.0, { role: 'sabzi', oil: true, tags: ['root', 'og', 'gf'] });
  F('dum-aloo', 'Dum aloo', VS, 'veg', '1 katori (150 g)', 150, 210, 3.5, 25.0, 11.0, 3.0, { role: 'sabzi', oil: true, fried: 'shallow', tags: ['root', 'og', 'dairy', 'gf'] });
  F('gobi-masala', 'Gobi masala', VS, 'vegan', '1 katori (150 g)', 150, 140, 4.0, 12.0, 9.0, 4.0, { role: 'sabzi', oil: true, tags: ['og', 'gf'] });
  F('lauki-sabzi', 'Lauki (bottle gourd) sabzi', VS, 'vegan', '1 katori (150 g)', 150, 90, 2.0, 10.0, 5.0, 2.5, { role: 'sabzi', oil: true, tags: ['gf'], aka: ['Ghiya', 'Doodhi', 'Sorakaya'] });
  F('parwal-sabzi', 'Parwal sabzi (pointed gourd)', VS, 'vegan', '1 katori (150 g)', 150, 105, 2.0, 10.0, 6.5, 3.0, { role: 'sabzi', oil: true, tags: ['gf'], aka: ['Potol'] });
  F('karela-sabzi', 'Karela sabzi (bitter gourd)', VS, 'vegan', '1 katori (100 g)', 100, 110, 2.5, 11.0, 6.5, 3.5, { role: 'sabzi', oil: true, tags: ['og', 'gf'], aka: ['Pavakkai', 'Bitter melon fry'] });
  F('cabbage-sabzi', 'Cabbage sabzi (patta gobi)', VS, 'vegan', '1 katori (150 g)', 150, 110, 2.5, 11.0, 6.5, 3.5, { role: 'sabzi', oil: true, tags: ['gf'], aka: ['Muttaikose poriyal'] });
  F('beans-poriyal', 'Beans poriyal (with coconut)', VS, 'vegan', '1 katori (100 g)', 100, 95, 3.0, 10.0, 5.0, 4.0, { role: 'sabzi', oil: true, tags: ['gf'], aka: ['Beans thoran'] });
  F('avial', 'Avial', VS, 'veg', '1 katori (150 g)', 150, 160, 3.5, 13.0, 11.0, 4.5, { role: 'sabzi', oil: true, tags: ['dairy', 'root', 'gf'] });
  F('veg-kootu', 'Veg kootu (lentil-vegetable)', VS, 'vegan', '1 katori (150 g)', 150, 140, 5.0, 15.0, 7.0, 4.0, { role: 'sabzi', oil: true, tags: ['gf'] });
  F('methi-malai-matar', 'Methi malai matar', VS, 'veg', '1 katori (150 g)', 150, 220, 6.0, 14.0, 16.0, 4.0, { role: 'main', oil: true, tags: ['dairy', 'og', 'gf'] });
  F('sarson-saag', 'Sarson ka saag', VS, 'veg', '1 katori (150 g)', 150, 165, 5.0, 10.0, 12.0, 4.5, { role: 'sabzi', oil: true, tags: ['og', 'dairy', 'gf'] });
  F('mushroom-masala', 'Mushroom masala', VS, 'vegan', '1 katori (150 g)', 150, 155, 4.5, 11.0, 10.5, 2.5, { role: 'sabzi', oil: true, tags: ['og', 'gf'] });
  F('veg-kolhapuri', 'Veg Kolhapuri', VS, 'vegan', '1 katori (150 g)', 150, 190, 5.0, 16.0, 12.0, 4.0, { role: 'main', oil: true, tags: ['og', 'root', 'gf'] });
  F('aloo-palak', 'Aloo palak', VS, 'vegan', '1 katori (150 g)', 150, 150, 3.5, 17.0, 8.0, 3.5, { role: 'sabzi', oil: true, tags: ['root', 'og', 'gf'] });
  F('paneer-bhurji', 'Paneer bhurji', VS, 'veg', '1 katori (100 g)', 100, 210, 10.5, 6.0, 16.5, 1.5, { role: 'breakfast', oil: true, tags: ['dairy', 'og', 'gf', 'boost'] });
  F('tofu-stir-fry', 'Tofu stir fry', VS, 'vegan', '1 katori (100 g)', 100, 130, 9.5, 5.0, 8.5, 1.5, { role: 'main', oil: true, tags: ['gf', 'boost'] });

  /* ---------------- Non-veg Curries & Grills ---------------- */
  var NV = 'Non-veg Curries & Grills';
  F('butter-chicken', 'Butter chicken', NV, 'nonveg', '1 katori (150 g)', 150, 320, 20.0, 8.0, 23.0, 1.5, { role: 'main', oil: true, tags: ['dairy', 'og', 'gf'], aka: ['Murgh makhani'] });
  F('chicken-tikka-masala', 'Chicken tikka masala', NV, 'nonveg', '1 katori (150 g)', 150, 290, 21.0, 9.0, 19.0, 1.5, { role: 'main', oil: true, tags: ['dairy', 'og', 'gf'] });
  F('chicken-curry', 'Chicken curry (home style)', NV, 'nonveg', '1 katori (150 g)', 150, 220, 20.0, 7.0, 13.0, 1.5, { role: 'main', oil: true, tags: ['og', 'gf'] });
  F('chicken-tikka', 'Chicken tikka (grilled)', NV, 'nonveg', '6 pieces (100 g)', 100, 180, 24.0, 3.0, 8.0, 0.5, { role: 'main', tags: ['dairy', 'og', 'gf', 'boost'] });
  F('tandoori-chicken', 'Tandoori chicken', NV, 'nonveg', '1 leg quarter (150 g)', 150, 260, 32.0, 4.0, 13.0, 0.5, { role: 'main', tags: ['dairy', 'og', 'gf', 'boost'] });
  F('chicken-65', 'Chicken 65', NV, 'nonveg', '1 plate (100 g)', 100, 290, 18.0, 11.0, 19.0, 1.0, { role: 'snack', oil: true, fried: 'deep', tags: ['og', 'gf'] });
  F('chicken-chettinad', 'Chicken Chettinad', NV, 'nonveg', '1 katori (150 g)', 150, 270, 21.0, 8.0, 17.0, 2.0, { role: 'main', oil: true, tags: ['og', 'gf'] });
  F('kadai-chicken', 'Kadai chicken', NV, 'nonveg', '1 katori (150 g)', 150, 265, 21.0, 8.0, 17.0, 2.0, { role: 'main', oil: true, tags: ['og', 'gf'] });
  F('mutton-curry', 'Mutton curry (home style)', NV, 'nonveg', '1 katori (150 g)', 150, 310, 22.0, 6.0, 22.0, 1.5, { role: 'main', oil: true, tags: ['og', 'gf'] });
  F('rogan-josh', 'Mutton rogan josh', NV, 'nonveg', '1 katori (150 g)', 150, 330, 22.0, 6.0, 24.0, 1.5, { role: 'main', oil: true, tags: ['og', 'dairy', 'gf'] });
  F('keema-matar', 'Keema matar', NV, 'nonveg', '1 katori (150 g)', 150, 300, 20.0, 9.0, 20.0, 2.5, { role: 'main', oil: true, tags: ['og', 'gf'] });
  F('fish-curry', 'Fish curry (rohu, home style)', NV, 'nonveg', '1 katori (150 g)', 150, 210, 19.0, 6.0, 12.0, 1.5, { role: 'main', oil: true, tags: ['og', 'gf'], aka: ['Macher jhol'] });
  F('fish-fry', 'Fish fry', NV, 'nonveg', '1 piece (100 g)', 100, 230, 18.0, 8.0, 14.0, 0.8, { role: 'main', oil: true, fried: 'shallow', tags: ['og', 'gf'] });
  F('goan-fish-curry', 'Goan fish curry (coconut)', NV, 'nonveg', '1 katori (150 g)', 150, 240, 18.0, 8.0, 15.0, 2.0, { role: 'main', oil: true, tags: ['og', 'gf'] });
  F('prawn-masala', 'Prawn masala', NV, 'nonveg', '1 katori (150 g)', 150, 200, 20.0, 7.0, 10.0, 1.5, { role: 'main', oil: true, tags: ['og', 'gf'], aka: ['Jhinga masala'] });
  F('grilled-chicken-breast', 'Grilled chicken breast', NV, 'nonveg', '100 g', 100, 165, 31.0, 0.0, 3.6, 0.0, { role: 'main', tags: ['gf', 'boost'] });
  F('grilled-fish', 'Grilled fish', NV, 'nonveg', '100 g', 100, 140, 22.0, 1.0, 5.0, 0.0, { role: 'main', tags: ['gf', 'boost'] });

  /* ---------------- Eggs ---------------- */
  var EG = 'Eggs';
  F('boiled-egg', 'Boiled egg', EG, 'egg', '1 egg', 50, 78, 6.5, 0.6, 5.5, 0.0, { role: 'breakfast', tags: ['gf', 'boost'], aka: ['Anda'] });
  F('egg-white', 'Egg white (boiled)', EG, 'egg', '1 egg white', 33, 17, 3.6, 0.2, 0.1, 0.0, { role: 'breakfast', tags: ['gf', 'boost'] });
  F('omelette', 'Masala omelette (2 eggs)', EG, 'egg', '1 omelette', 120, 220, 13.0, 3.0, 17.0, 0.5, { role: 'breakfast', oil: true, tags: ['og', 'gf'] });
  F('egg-bhurji', 'Egg bhurji (2 eggs)', EG, 'egg', '1 katori (120 g)', 120, 220, 13.0, 4.0, 17.0, 0.8, { role: 'breakfast', oil: true, tags: ['og', 'gf'], aka: ['Anda bhurji'] });
  F('egg-curry', 'Egg curry (2 eggs)', EG, 'egg', '1 katori (200 g)', 200, 280, 14.0, 8.0, 21.0, 2.0, { role: 'main', oil: true, tags: ['og', 'gf'], aka: ['Anda curry'] });

  /* ---------------- South Indian ---------------- */
  var SI = 'South Indian';
  F('idli', 'Idli', SI, 'vegan', '1 idli (50 g)', 50, 58, 2.0, 12.0, 0.2, 0.7, { role: 'breakfast', tags: ['gf'] });
  F('plain-dosa', 'Plain dosa', SI, 'vegan', '1 dosa', 90, 165, 3.5, 28.0, 4.0, 1.2, { role: 'breakfast', oil: true, tags: ['gf'] });
  F('masala-dosa', 'Masala dosa', SI, 'vegan', '1 dosa', 180, 300, 6.0, 42.0, 12.0, 3.0, { role: 'breakfast', oil: true, tags: ['root', 'og', 'gf'] });
  F('rava-dosa', 'Rava dosa', SI, 'vegan', '1 dosa', 100, 220, 4.0, 30.0, 9.0, 1.5, { role: 'breakfast', oil: true });
  F('set-dosa', 'Set dosa', SI, 'vegan', '1 dosa', 70, 135, 3.0, 22.0, 3.5, 1.0, { role: 'breakfast', oil: true, tags: ['gf'] });
  F('uttapam', 'Onion uttapam', SI, 'vegan', '1 uttapam', 130, 210, 5.5, 34.0, 6.0, 2.0, { role: 'breakfast', oil: true, tags: ['og', 'gf'] });
  F('medu-vada', 'Medu vada', SI, 'vegan', '1 vada', 55, 145, 4.5, 15.0, 8.0, 2.0, { role: 'snack', fried: 'deep', tags: ['og', 'gf'], aka: ['Urad vada', 'Garelu'] });
  F('sambar-vada', 'Sambar vada', SI, 'vegan', '1 vada with sambar (180 g)', 180, 250, 8.0, 28.0, 12.0, 4.0, { role: 'snack', fried: 'deep', tags: ['og', 'root', 'gf'] });
  F('upma', 'Rava upma', SI, 'vegan', '1 bowl (150 g)', 150, 250, 5.5, 36.0, 9.0, 2.5, { role: 'breakfast', oil: true, aka: ['Uppittu'] });
  F('ven-pongal', 'Ven pongal', SI, 'veg', '1 bowl (200 g)', 200, 300, 9.0, 42.0, 11.0, 3.0, { role: 'breakfast', oil: true, tags: ['dairy', 'gf'], aka: ['Khara pongal'] });
  F('appam', 'Appam', SI, 'vegan', '1 appam', 60, 120, 2.0, 24.0, 1.5, 0.8, { role: 'breakfast', tags: ['gf'] });
  F('puttu', 'Puttu (rice, with coconut)', SI, 'vegan', '1 serving (150 g)', 150, 240, 4.0, 50.0, 2.5, 3.0, { role: 'breakfast', tags: ['gf'] });
  F('idiyappam', 'Idiyappam (string hoppers)', SI, 'vegan', '2 pieces (120 g)', 120, 200, 4.0, 44.0, 0.5, 1.5, { role: 'breakfast', tags: ['gf'], aka: ['Sevai', 'Noolputtu'] });
  F('rasam', 'Rasam', SI, 'vegan', '1 katori (150 ml)', 150, 60, 1.5, 9.0, 2.0, 1.0, { role: 'side', oil: true, tags: ['og', 'gf'] });
  F('coconut-chutney', 'Coconut chutney', SI, 'vegan', '2 tbsp (30 g)', 30, 60, 1.0, 3.0, 5.0, 1.5, { role: 'side', tags: ['gf'] });
  F('tomato-chutney', 'Tomato-onion chutney', SI, 'vegan', '2 tbsp (30 g)', 30, 40, 0.8, 4.5, 2.2, 0.8, { role: 'side', oil: true, tags: ['og', 'gf'] });
  F('podi-oil', 'Idli podi with oil', SI, 'vegan', '1 tbsp (15 g)', 15, 60, 1.5, 4.0, 4.2, 1.0, { role: 'side', tags: ['og', 'gf'], aka: ['Gunpowder', 'Milagai podi'] });
  F('bisi-bele-bath', 'Bisi bele bath', SI, 'vegan', '1 plate (250 g)', 250, 350, 9.0, 50.0, 13.0, 5.0, { role: 'main', oil: true, tags: ['og', 'root', 'gf', 'meal'] });

  /* ---------------- Breakfast & Tiffin ---------------- */
  var BF = 'Breakfast & Tiffin';
  F('poha', 'Poha (with peanuts)', BF, 'vegan', '1 plate (150 g)', 150, 270, 5.5, 40.0, 10.0, 2.5, { role: 'breakfast', oil: true, tags: ['og', 'root', 'gf'], aka: ['Kanda poha', 'Aval upma', 'Chivda'] });
  F('sabudana-khichdi', 'Sabudana khichdi', BF, 'vegan', '1 plate (150 g)', 150, 335, 3.5, 50.0, 13.5, 1.5, { role: 'breakfast', oil: true, tags: ['root', 'gf'] });
  F('besan-chilla', 'Besan chilla', BF, 'vegan', '2 chillas (120 g)', 120, 220, 9.0, 24.0, 9.0, 4.0, { role: 'breakfast', oil: true, tags: ['og', 'gf', 'boost'], aka: ['Besan cheela', 'Pudla'] });
  F('moong-chilla', 'Moong dal chilla', BF, 'vegan', '2 chillas (120 g)', 120, 200, 12.0, 24.0, 6.0, 3.5, { role: 'breakfast', oil: true, tags: ['gf', 'boost'], aka: ['Pesarattu'] });
  F('oats-porridge', 'Oats porridge (milk)', BF, 'veg', '1 bowl (200 g)', 200, 220, 8.0, 32.0, 6.5, 3.5, { role: 'breakfast', tags: ['dairy'] });
  F('masala-oats', 'Masala oats (savoury, veg)', BF, 'vegan', '1 bowl (200 g)', 200, 180, 6.0, 28.0, 5.0, 4.0, { role: 'breakfast', oil: true, tags: ['og'] });
  F('cornflakes-milk', 'Cornflakes with milk', BF, 'veg', '1 bowl (200 g)', 200, 210, 6.0, 36.0, 4.5, 1.0, { role: 'breakfast', tags: ['dairy'] });
  F('muesli-milk', 'Muesli with milk', BF, 'veg', '1 bowl (200 g)', 200, 260, 8.5, 40.0, 7.0, 4.0, { role: 'breakfast', tags: ['dairy'] });
  F('vermicelli-upma', 'Vermicelli upma (semiya)', BF, 'vegan', '1 bowl (150 g)', 150, 230, 5.0, 36.0, 7.5, 2.0, { role: 'breakfast', oil: true, tags: ['og'], aka: ['Semiya upma', 'Shavige bath'] });
  F('misal-pav', 'Misal pav', BF, 'veg', '1 plate (300 g)', 300, 400, 13.0, 50.0, 16.0, 7.0, { role: 'breakfast', oil: true, tags: ['og', 'dairy'] });
  F('thalipeeth', 'Thalipeeth', BF, 'vegan', '1 piece (80 g)', 80, 190, 5.5, 27.0, 7.0, 3.5, { role: 'breakfast', oil: true, tags: ['og'] });
  F('sattu-drink', 'Sattu drink (savoury)', BF, 'vegan', '1 glass (250 ml)', 250, 150, 8.0, 24.0, 2.5, 4.0, { role: 'beverage', tags: ['gf', 'boost'], aka: ['Sattu sharbat'] });
  F('veg-sandwich', 'Veg sandwich (chutney, no cheese)', BF, 'veg', '1 sandwich (130 g)', 130, 200, 5.5, 32.0, 6.0, 3.0, { role: 'snack', tags: ['dairy'] });
  F('grilled-cheese-sandwich', 'Grilled cheese sandwich', BF, 'veg', '1 sandwich (140 g)', 140, 330, 11.0, 34.0, 17.0, 2.0, { role: 'snack', tags: ['dairy'] });

  /* ---------------- Snacks & Street Food ---------------- */
  var SN = 'Snacks & Street Food';
  F('samosa', 'Samosa', SN, 'vegan', '1 samosa (80 g)', 80, 260, 4.5, 28.0, 15.0, 2.5, { role: 'snack', fried: 'deep', tags: ['root', 'og'] });
  F('kachori', 'Kachori', SN, 'vegan', '1 kachori (60 g)', 60, 210, 4.0, 22.0, 12.0, 2.0, { role: 'snack', fried: 'deep', tags: ['og'] });
  F('onion-pakora', 'Onion pakora / bhajiya', SN, 'vegan', '5 pieces (80 g)', 80, 250, 5.0, 22.0, 16.0, 3.0, { role: 'snack', fried: 'deep', tags: ['og', 'gf'], aka: ['Kanda bhaji', 'Bhajji'] });
  F('vada-pav', 'Vada pav', SN, 'veg', '1 vada pav (130 g)', 130, 300, 6.0, 40.0, 13.0, 3.0, { role: 'snack', fried: 'deep', tags: ['root', 'og', 'dairy'] });
  F('pav-bhaji', 'Pav bhaji (2 pav)', SN, 'veg', '1 plate (350 g)', 350, 450, 10.0, 56.0, 20.0, 6.0, { role: 'main', oil: true, tags: ['root', 'og', 'dairy', 'meal'] });
  F('bhel-puri', 'Bhel puri', SN, 'vegan', '1 plate (150 g)', 150, 220, 5.0, 35.0, 7.0, 3.5, { role: 'snack', tags: ['og', 'root'] });
  F('sev-puri', 'Sev puri', SN, 'vegan', '6 pieces (100 g)', 100, 220, 4.5, 28.0, 10.0, 2.5, { role: 'snack', fried: 'deep', tags: ['og', 'root'] });
  F('pani-puri', 'Pani puri / golgappa', SN, 'vegan', '6 pieces (90 g)', 90, 180, 3.0, 30.0, 5.0, 2.0, { role: 'snack', fried: 'deep', tags: ['root'], aka: ['Golgappa', 'Puchka'] });
  F('dahi-puri', 'Dahi puri', SN, 'veg', '6 pieces (120 g)', 120, 230, 5.0, 30.0, 9.5, 2.0, { role: 'snack', fried: 'deep', tags: ['dairy', 'root'] });
  F('aloo-tikki', 'Aloo tikki', SN, 'vegan', '1 tikki (75 g)', 75, 160, 2.5, 20.0, 8.0, 2.0, { role: 'snack', fried: 'shallow', tags: ['root', 'og'] });
  F('papdi-chaat', 'Papdi chaat', SN, 'veg', '1 plate (150 g)', 150, 290, 6.0, 35.0, 14.0, 2.5, { role: 'snack', fried: 'deep', tags: ['dairy', 'root'] });
  F('dhokla', 'Khaman dhokla (steamed)', SN, 'vegan', '2 pieces (100 g)', 100, 160, 5.5, 24.0, 4.5, 2.0, { role: 'snack', tags: ['gf'] });
  F('khandvi', 'Khandvi', SN, 'veg', '5 rolls (100 g)', 100, 150, 6.0, 15.0, 7.5, 1.5, { role: 'snack', tags: ['dairy', 'gf'] });
  F('chivda', 'Poha chivda (namkeen)', SN, 'vegan', '1 small bowl (30 g)', 30, 150, 3.0, 16.0, 8.0, 1.5, { role: 'snack', fried: 'deep', tags: ['gf'] });
  F('murukku', 'Murukku / chakli', SN, 'vegan', '2 pieces (30 g)', 30, 150, 2.5, 16.0, 8.5, 1.0, { role: 'snack', fried: 'deep', tags: ['gf'], aka: ['Chakli'] });
  F('mathri', 'Mathri', SN, 'vegan', '2 pieces (30 g)', 30, 160, 2.5, 15.0, 10.0, 0.8, { role: 'snack', fried: 'deep' });
  F('masala-peanuts', 'Masala peanuts (fried)', SN, 'vegan', '1 small bowl (30 g)', 30, 170, 7.0, 10.0, 12.0, 2.5, { role: 'snack', fried: 'deep', tags: ['gf'] });
  F('roasted-chana', 'Roasted chana', SN, 'vegan', '1 small bowl (30 g)', 30, 110, 6.0, 17.0, 1.5, 4.5, { role: 'snack', tags: ['gf', 'boost'], aka: ['Bhuna chana', 'Chutney dal'] });
  F('makhana-roasted', 'Makhana (roasted in ghee)', SN, 'veg', '1 bowl (25 g)', 25, 120, 3.0, 17.0, 4.5, 2.5, { role: 'snack', tags: ['dairy', 'gf'], aka: ['Fox nuts', 'Lotus seeds'] });
  F('bread-pakora', 'Bread pakora (stuffed)', SN, 'vegan', '1 piece (100 g)', 100, 260, 5.5, 30.0, 13.0, 2.0, { role: 'snack', fried: 'deep', tags: ['root', 'og'] });
  F('veg-spring-roll', 'Veg spring roll', SN, 'vegan', '1 roll (80 g)', 80, 180, 3.5, 22.0, 9.0, 1.5, { role: 'snack', fried: 'deep', tags: ['og'] });
  F('veg-momos', 'Veg momos (steamed)', SN, 'vegan', '6 momos (180 g)', 180, 240, 7.0, 40.0, 5.5, 2.5, { role: 'snack', tags: ['og'] });
  F('chicken-momos', 'Chicken momos (steamed)', SN, 'nonveg', '6 momos (180 g)', 180, 280, 14.0, 38.0, 7.5, 1.5, { role: 'snack', tags: ['og'] });
  F('maggi', 'Maggi masala noodles (1 pack, cooked)', SN, 'vegan', '1 bowl (300 g)', 300, 360, 8.0, 50.0, 14.0, 2.5, { role: 'snack', tags: ['og'] });
  F('veg-frankie', 'Veg frankie / kathi roll', SN, 'veg', '1 roll (180 g)', 180, 320, 7.0, 45.0, 12.0, 3.5, { role: 'snack', oil: true, tags: ['og', 'root', 'dairy'] });
  F('chicken-kathi-roll', 'Chicken kathi roll', SN, 'nonveg', '1 roll (200 g)', 200, 380, 20.0, 42.0, 14.0, 2.5, { role: 'snack', oil: true, tags: ['og'] });
  F('corn-chaat', 'Sweet corn chaat', SN, 'vegan', '1 cup (120 g)', 120, 140, 4.0, 25.0, 3.0, 3.0, { role: 'snack', tags: ['gf'] });
  F('boiled-corn', 'Sweet corn (boiled)', SN, 'vegan', '1 cup (100 g)', 100, 96, 3.4, 21.0, 1.5, 2.4, { role: 'snack', tags: ['gf'] });

  /* ---------------- Sweets & Desserts ---------------- */
  var SW = 'Sweets & Desserts';
  F('gulab-jamun', 'Gulab jamun', SW, 'veg', '1 piece (40 g)', 40, 150, 1.8, 20.0, 7.0, 0.3, { role: 'sweet', fried: 'deep', tags: ['dairy'] });
  F('rasgulla', 'Rasgulla', SW, 'veg', '1 piece (50 g)', 50, 105, 2.5, 22.0, 1.0, 0.0, { role: 'sweet', tags: ['dairy', 'gf'], aka: ['Rosogolla'] });
  F('jalebi', 'Jalebi', SW, 'vegan', '2 medium (50 g)', 50, 190, 1.5, 28.0, 8.5, 0.3, { role: 'sweet', fried: 'deep' });
  F('kaju-katli', 'Kaju katli', SW, 'veg', '1 piece (20 g)', 20, 90, 1.7, 9.0, 5.5, 0.4, { role: 'sweet', tags: ['gf'], aka: ['Kaju barfi'] });
  F('besan-ladoo', 'Besan ladoo', SW, 'veg', '1 ladoo (40 g)', 40, 185, 4.0, 20.0, 10.5, 1.5, { role: 'sweet', tags: ['dairy', 'gf'] });
  F('motichoor-ladoo', 'Motichoor ladoo', SW, 'veg', '1 ladoo (40 g)', 40, 165, 2.5, 24.0, 7.0, 0.8, { role: 'sweet', fried: 'deep', tags: ['dairy', 'gf'] });
  F('gajar-halwa', 'Gajar ka halwa', SW, 'veg', '1 katori (100 g)', 100, 250, 4.0, 30.0, 13.0, 2.0, { role: 'sweet', tags: ['dairy', 'root', 'gf'], aka: ['Carrot halwa'] });
  F('sooji-halwa', 'Sooji halwa', SW, 'veg', '1 katori (100 g)', 100, 300, 4.0, 38.0, 15.0, 1.0, { role: 'sweet', tags: ['dairy'], aka: ['Rava kesari', 'Sheera'] });
  F('rice-kheer', 'Rice kheer', SW, 'veg', '1 katori (150 g)', 150, 210, 5.5, 32.0, 7.0, 0.5, { role: 'sweet', tags: ['dairy', 'gf'], aka: ['Payasam', 'Payesh'] });
  F('semiya-payasam', 'Semiya payasam', SW, 'veg', '1 katori (150 g)', 150, 220, 5.0, 34.0, 7.5, 0.5, { role: 'sweet', tags: ['dairy'], aka: ['Vermicelli kheer'] });
  F('mysore-pak', 'Mysore pak', SW, 'veg', '1 piece (35 g)', 35, 185, 2.0, 18.0, 12.0, 0.8, { role: 'sweet', tags: ['dairy', 'gf'] });
  F('soan-papdi', 'Soan papdi', SW, 'veg', '1 piece (30 g)', 30, 150, 2.0, 17.0, 8.5, 0.5, { role: 'sweet', tags: ['dairy'] });
  F('khoya-barfi', 'Plain barfi (khoya)', SW, 'veg', '1 piece (30 g)', 30, 120, 2.5, 14.0, 6.0, 0.0, { role: 'sweet', tags: ['dairy', 'gf'] });
  F('rasmalai', 'Rasmalai', SW, 'veg', '1 piece with milk (100 g)', 100, 190, 5.5, 20.0, 10.0, 0.0, { role: 'sweet', tags: ['dairy', 'gf'] });
  F('sandesh', 'Sandesh', SW, 'veg', '1 piece (35 g)', 35, 90, 3.0, 12.0, 3.0, 0.0, { role: 'sweet', tags: ['dairy', 'gf'], aka: ['Shondesh'] });
  F('modak', 'Modak (steamed, ukdiche)', SW, 'vegan', '1 modak (45 g)', 45, 110, 1.5, 20.0, 3.0, 1.0, { role: 'sweet', tags: ['gf'] });
  F('puran-poli', 'Puran poli', SW, 'veg', '1 poli (100 g)', 100, 320, 7.0, 55.0, 8.0, 3.0, { role: 'sweet', tags: ['dairy'], aka: ['Holige', 'Obbattu'] });
  F('shrikhand', 'Shrikhand', SW, 'veg', '1 katori (100 g)', 100, 260, 5.0, 32.0, 12.5, 0.0, { role: 'sweet', tags: ['dairy', 'gf'] });
  F('phirni', 'Phirni', SW, 'veg', '1 katori (100 g)', 100, 160, 4.0, 24.0, 5.5, 0.2, { role: 'sweet', tags: ['dairy', 'gf'] });
  F('ice-cream', 'Ice cream (vanilla)', SW, 'veg', '1 scoop (65 g)', 65, 135, 2.5, 16.0, 7.0, 0.0, { role: 'sweet', tags: ['dairy', 'gf'] });
  F('milk-chocolate', 'Milk chocolate', SW, 'veg', '1 small bar (25 g)', 25, 135, 1.8, 15.0, 7.5, 0.5, { role: 'sweet', tags: ['dairy', 'gf'] });

  /* ---------------- Beverages ---------------- */
  var BV = 'Beverages';
  F('masala-chai', 'Masala chai (milk + sugar)', BV, 'veg', '1 cup (150 ml)', 150, 75, 2.0, 10.0, 3.0, 0.0, { role: 'beverage', tags: ['dairy', 'gf'], aka: ['Chai', 'Tea'] });
  F('chai-no-sugar', 'Chai without sugar', BV, 'veg', '1 cup (150 ml)', 150, 45, 2.0, 4.0, 2.5, 0.0, { role: 'beverage', tags: ['dairy', 'gf'] });
  F('black-tea', 'Black / green tea (no milk, no sugar)', BV, 'vegan', '1 cup (150 ml)', 150, 2, 0.0, 0.5, 0.0, 0.0, { role: 'beverage', tags: ['gf'] });
  F('filter-coffee', 'Filter coffee (milk + sugar)', BV, 'veg', '1 cup (150 ml)', 150, 75, 2.2, 10.0, 3.0, 0.0, { role: 'beverage', tags: ['dairy', 'gf'], aka: ['Kaapi'] });
  F('black-coffee', 'Black coffee (no sugar)', BV, 'vegan', '1 cup (150 ml)', 150, 5, 0.3, 0.8, 0.0, 0.0, { role: 'beverage', tags: ['gf'] });
  F('milk-toned', 'Milk (toned)', BV, 'veg', '1 glass (250 ml)', 250, 150, 8.0, 12.0, 7.5, 0.0, { role: 'beverage', tags: ['dairy', 'gf'], aka: ['Doodh'] });
  F('milk-skim', 'Milk (skimmed/double toned)', BV, 'veg', '1 glass (250 ml)', 250, 85, 8.5, 12.5, 0.5, 0.0, { role: 'beverage', tags: ['dairy', 'gf', 'boost'] });
  F('chaas', 'Buttermilk / chaas (thin)', BV, 'veg', '1 glass (250 ml)', 250, 40, 2.0, 3.0, 1.5, 0.0, { role: 'beverage', tags: ['dairy', 'gf'], aka: ['Mattha', 'Majjiga', 'Moru'] });
  F('sweet-lassi', 'Sweet lassi', BV, 'veg', '1 glass (250 ml)', 250, 220, 6.0, 35.0, 6.5, 0.0, { role: 'beverage', tags: ['dairy', 'gf'] });
  F('mango-lassi', 'Mango lassi', BV, 'veg', '1 glass (250 ml)', 250, 240, 5.5, 40.0, 6.5, 0.5, { role: 'beverage', tags: ['dairy', 'gf'] });
  F('nimbu-pani', 'Nimbu pani (sweet)', BV, 'vegan', '1 glass (250 ml)', 250, 60, 0.2, 15.0, 0.0, 0.0, { role: 'beverage', tags: ['gf'], aka: ['Shikanji', 'Lemonade'] });
  F('coconut-water', 'Coconut water (tender)', BV, 'vegan', '1 glass (250 ml)', 250, 45, 1.0, 10.0, 0.3, 0.5, { role: 'beverage', tags: ['gf'], aka: ['Nariyal pani', 'Elaneer'] });
  F('sugarcane-juice', 'Sugarcane juice', BV, 'vegan', '1 glass (250 ml)', 250, 180, 0.3, 45.0, 0.0, 0.0, { role: 'beverage', tags: ['gf'], aka: ['Ganne ka ras'] });
  F('orange-juice', 'Fresh orange juice (no sugar)', BV, 'vegan', '1 glass (250 ml)', 250, 110, 1.8, 25.0, 0.5, 0.8, { role: 'beverage', tags: ['gf'], aka: ['Mosambi juice'] });
  F('mango-shake', 'Mango milkshake', BV, 'veg', '1 glass (300 ml)', 300, 280, 6.5, 48.0, 7.5, 1.0, { role: 'beverage', tags: ['dairy', 'gf'] });
  F('badam-milk', 'Badam milk', BV, 'veg', '1 glass (250 ml)', 250, 210, 7.5, 26.0, 9.0, 0.8, { role: 'beverage', tags: ['dairy', 'gf'] });
  F('cold-coffee', 'Cold coffee (with sugar)', BV, 'veg', '1 glass (300 ml)', 300, 240, 6.5, 36.0, 8.0, 0.0, { role: 'beverage', tags: ['dairy', 'gf'] });
  F('soft-drink', 'Soft drink (cola)', BV, 'vegan', '1 can (330 ml)', 330, 140, 0.0, 35.0, 0.0, 0.0, { role: 'beverage', tags: ['gf', 'noplan'] });
  F('beer', 'Beer', BV, 'vegan', '1 bottle (330 ml)', 330, 145, 1.5, 11.0, 0.0, 0.0, { role: 'beverage', tags: ['gf', 'noplan'] });
  F('whisky', 'Whisky / spirits', BV, 'vegan', '1 peg (30 ml)', 30, 65, 0.0, 0.0, 0.0, 0.0, { role: 'beverage', tags: ['gf', 'noplan'] });

  /* ---------------- Dairy, Sides & Chutneys ---------------- */
  var DS = 'Dairy, Sides & Chutneys';
  F('curd', 'Curd / dahi (whole milk)', DS, 'veg', '1 katori (100 g)', 100, 60, 3.1, 4.7, 3.3, 0.0, { role: 'side', tags: ['dairy', 'gf'], aka: ['Dahi', 'Yogurt', 'Thayir'] });
  F('curd-lowfat', 'Curd (low fat)', DS, 'veg', '1 katori (100 g)', 100, 45, 3.5, 5.0, 1.2, 0.0, { role: 'side', tags: ['dairy', 'gf'] });
  F('greek-yogurt', 'Greek yogurt (plain)', DS, 'veg', '1 katori (100 g)', 100, 90, 10.0, 4.0, 4.0, 0.0, { role: 'side', tags: ['dairy', 'gf', 'boost'], aka: ['Hung curd'] });
  F('paneer-raw', 'Paneer (raw)', DS, 'veg', '50 g', 50, 130, 9.0, 2.0, 10.0, 0.0, { role: 'side', tags: ['dairy', 'gf', 'boost'], aka: ['Cottage cheese'] });
  F('cheese-slice', 'Cheese slice', DS, 'veg', '1 slice (20 g)', 20, 62, 4.0, 0.5, 5.0, 0.0, { role: 'side', tags: ['dairy', 'gf'] });
  F('boondi-raita', 'Boondi raita', DS, 'veg', '1 katori (100 g)', 100, 95, 3.0, 8.0, 5.5, 0.5, { role: 'side', fried: 'deep', tags: ['dairy', 'gf'] });
  F('cucumber-raita', 'Cucumber raita', DS, 'veg', '1 katori (100 g)', 100, 55, 2.8, 4.5, 2.8, 0.5, { role: 'side', tags: ['dairy', 'gf'], aka: ['Kheera raita', 'Pachadi'] });
  F('green-chutney', 'Green chutney (mint-coriander)', DS, 'vegan', '1 tbsp (20 g)', 20, 12, 0.5, 1.8, 0.3, 0.6, { role: 'side', tags: ['og', 'gf'], aka: ['Pudina chutney'] });
  F('tamarind-chutney', 'Tamarind-date chutney', DS, 'vegan', '1 tbsp (20 g)', 20, 45, 0.2, 11.0, 0.1, 0.4, { role: 'side', tags: ['gf'], aka: ['Imli chutney', 'Saunth'] });
  F('mango-pickle', 'Mango pickle (aam ka achar)', DS, 'vegan', '1 tsp (15 g)', 15, 35, 0.3, 1.5, 3.0, 0.5, { role: 'side', tags: ['gf'], aka: ['Achar'] });
  F('papad-roasted', 'Papad (roasted)', DS, 'vegan', '1 papad (13 g)', 13, 50, 2.5, 8.0, 0.5, 1.0, { role: 'side', tags: ['gf'], aka: ['Appalam'] });
  F('papad-fried', 'Papad (fried)', DS, 'vegan', '1 papad (16 g)', 16, 80, 2.5, 8.0, 4.5, 1.0, { role: 'side', fried: 'deep', tags: ['gf'] });
  F('kachumber-salad', 'Kachumber salad (onion-tomato-cucumber)', DS, 'vegan', '1 bowl (100 g)', 100, 35, 1.2, 6.5, 0.5, 1.8, { role: 'side', tags: ['og', 'gf'], aka: ['Salad'] });
  F('garden-salad', 'Garden salad (no onion)', DS, 'vegan', '1 bowl (100 g)', 100, 30, 1.2, 5.5, 0.4, 1.8, { role: 'side', tags: ['gf'] });

  /* ---------------- Fruits ---------------- */
  var FR = 'Fruits';
  F('apple', 'Apple', FR, 'vegan', '1 medium (130 g)', 130, 68, 0.3, 17.0, 0.4, 3.1, { role: 'fruit', tags: ['gf'], aka: ['Seb'] });
  F('banana', 'Banana', FR, 'vegan', '1 medium (90 g)', 90, 80, 1.0, 20.0, 0.3, 2.0, { role: 'fruit', tags: ['gf'], aka: ['Kela'] });
  F('mango', 'Mango', FR, 'vegan', '1 cup sliced (150 g)', 150, 90, 1.2, 21.0, 0.6, 2.4, { role: 'fruit', tags: ['gf'], aka: ['Aam'] });
  F('orange', 'Orange / santra', FR, 'vegan', '1 medium (130 g)', 130, 60, 1.2, 14.0, 0.2, 3.1, { role: 'fruit', tags: ['gf'] });
  F('papaya', 'Papaya', FR, 'vegan', '1 cup cubed (150 g)', 150, 48, 0.7, 11.0, 0.4, 2.5, { role: 'fruit', tags: ['gf'], aka: ['Papita'] });
  F('guava', 'Guava', FR, 'vegan', '1 medium (100 g)', 100, 68, 2.6, 14.0, 1.0, 5.4, { role: 'fruit', tags: ['gf'], aka: ['Amrood', 'Peru'] });
  F('pomegranate', 'Pomegranate arils', FR, 'vegan', '1 katori (100 g)', 100, 83, 1.7, 19.0, 1.2, 4.0, { role: 'fruit', tags: ['gf'], aka: ['Anar'] });
  F('grapes', 'Grapes', FR, 'vegan', '1 katori (100 g)', 100, 70, 0.7, 18.0, 0.2, 0.9, { role: 'fruit', tags: ['gf'], aka: ['Angoor'] });
  F('watermelon', 'Watermelon', FR, 'vegan', '1 cup cubed (150 g)', 150, 45, 0.9, 11.0, 0.2, 0.6, { role: 'fruit', tags: ['gf'], aka: ['Tarbooz'] });
  F('muskmelon', 'Muskmelon', FR, 'vegan', '1 cup cubed (150 g)', 150, 50, 1.2, 12.0, 0.3, 1.4, { role: 'fruit', tags: ['gf'], aka: ['Kharbuja'] });
  F('chikoo', 'Chikoo / sapota', FR, 'vegan', '1 medium (100 g)', 100, 94, 0.7, 22.0, 1.1, 5.3, { role: 'fruit', tags: ['gf'], aka: ['Sapota'] });
  F('pineapple', 'Pineapple', FR, 'vegan', '1 cup cubed (100 g)', 100, 50, 0.5, 13.0, 0.1, 1.4, { role: 'fruit', tags: ['gf'], aka: ['Ananas'] });
  F('sweet-lime', 'Sweet lime / mosambi', FR, 'vegan', '1 medium (130 g)', 130, 55, 1.0, 13.0, 0.3, 2.6, { role: 'fruit', tags: ['gf'], aka: ['Mosambi'] });
  F('litchi', 'Litchi', FR, 'vegan', '5 pieces (75 g)', 75, 50, 0.6, 12.5, 0.3, 1.0, { role: 'fruit', tags: ['gf'], aka: ['Lychee'] });
  F('custard-apple', 'Custard apple / sitaphal', FR, 'vegan', '1 medium (100 g)', 100, 100, 1.6, 24.0, 0.4, 3.7, { role: 'fruit', tags: ['gf'], aka: ['Sitaphal', 'Sharifa'] });
  F('dates', 'Dates', FR, 'vegan', '3 dates (25 g)', 25, 70, 0.6, 18.0, 0.1, 2.0, { role: 'fruit', tags: ['gf'], aka: ['Khajoor'] });
  F('fresh-coconut', 'Fresh coconut (sliced)', FR, 'vegan', '1 small piece (30 g)', 30, 105, 1.0, 4.5, 10.0, 2.7, { role: 'fruit', tags: ['gf'], aka: ['Nariyal'] });

  /* ---------------- Nuts, Seeds & Dry Fruits ---------------- */
  var NT = 'Nuts, Seeds & Dry Fruits';
  F('almonds', 'Almonds', NT, 'vegan', '10 nuts (12 g)', 12, 70, 2.5, 2.5, 6.0, 1.5, { role: 'snack', tags: ['gf'], aka: ['Badam'] });
  F('cashews', 'Cashews', NT, 'vegan', '10 nuts (15 g)', 15, 85, 2.8, 4.5, 6.5, 0.5, { role: 'snack', tags: ['gf'], aka: ['Kaju'] });
  F('walnuts', 'Walnuts', NT, 'vegan', '4 halves (15 g)', 15, 100, 2.3, 2.0, 9.8, 1.0, { role: 'snack', tags: ['gf'], aka: ['Akhrot'] });
  F('peanuts-roasted', 'Peanuts (dry roasted)', NT, 'vegan', '1 small bowl (30 g)', 30, 170, 7.5, 6.0, 14.0, 2.5, { role: 'snack', tags: ['gf'], aka: ['Moongphali', 'Shengdana'] });
  F('raisins', 'Raisins', NT, 'vegan', '1 tbsp (15 g)', 15, 45, 0.5, 11.0, 0.1, 0.6, { role: 'snack', tags: ['gf'], aka: ['Kishmish'] });
  F('pistachios', 'Pistachios', NT, 'vegan', '15 nuts (15 g)', 15, 85, 3.0, 4.0, 6.8, 1.5, { role: 'snack', tags: ['gf'], aka: ['Pista'] });
  F('mixed-seeds', 'Mixed seeds (pumpkin, sunflower, flax)', NT, 'vegan', '1 tbsp (15 g)', 15, 85, 3.5, 2.5, 7.0, 1.8, { role: 'snack', tags: ['gf'] });
  F('peanut-butter', 'Peanut butter', NT, 'vegan', '1 tbsp (16 g)', 16, 95, 4.0, 3.5, 8.0, 1.0, { role: 'side', tags: ['gf', 'boost'] });

  /* ---------------- Regional Specialities ---------------- */
  var RG = 'Regional Specialities';
  F('nattu-kozhi-curry', 'Country chicken curry (nattu kozhi)', RG, 'nonveg', '1 katori (150 g)', 150, 190, 22.0, 6.0, 9.0, 1.5, { role: 'main', oil: true, tags: ['og', 'gf', 'boost'], aka: ['Desi murgh curry', 'Naati koli saaru', 'Country chicken'] });
  F('kodi-vepudu', 'Andhra chicken fry (kodi vepudu)', RG, 'nonveg', '1 plate (100 g)', 100, 250, 20.0, 6.0, 16.0, 1.0, { role: 'main', oil: true, fried: 'shallow', tags: ['og', 'gf'], aka: ['Chicken vepudu'] });
  F('chicken-ghee-roast', 'Chicken ghee roast (Mangalorean)', RG, 'nonveg', '1 katori (150 g)', 150, 300, 21.0, 7.0, 21.0, 1.5, { role: 'main', oil: true, tags: ['dairy', 'og', 'gf'] });
  F('gongura-mutton', 'Gongura mutton', RG, 'nonveg', '1 katori (150 g)', 150, 320, 21.0, 7.0, 23.0, 2.0, { role: 'main', oil: true, tags: ['og', 'gf'] });
  F('kerala-beef-fry', 'Beef fry (Kerala)', RG, 'nonveg', '1 plate (100 g)', 100, 260, 19.0, 5.0, 18.0, 1.5, { role: 'main', oil: true, fried: 'shallow', tags: ['og', 'gf'], aka: ['Beef ularthiyathu'] });
  F('pork-vindaloo', 'Pork vindaloo (Goan)', RG, 'nonveg', '1 katori (150 g)', 150, 310, 20.0, 9.0, 21.0, 1.5, { role: 'main', oil: true, tags: ['og', 'gf'] });
  F('kerala-chicken-stew', 'Chicken stew (Kerala ishtu)', RG, 'nonveg', '1 katori (150 g)', 150, 230, 16.0, 9.0, 14.0, 1.5, { role: 'main', oil: true, tags: ['og', 'root', 'gf'], aka: ['Chicken ishtu'] });
  F('kerala-veg-stew', 'Vegetable stew (Kerala)', RG, 'vegan', '1 katori (150 g)', 150, 140, 2.5, 12.0, 9.0, 2.5, { role: 'main', oil: true, tags: ['root', 'gf'], aka: ['Veg ishtu'] });
  F('haleem', 'Haleem (Hyderabadi)', RG, 'nonveg', '1 bowl (150 g)', 150, 280, 16.0, 20.0, 15.0, 3.0, { role: 'main', oil: true, tags: ['og', 'meal'] });
  F('nihari', 'Nihari', RG, 'nonveg', '1 katori (150 g)', 150, 320, 21.0, 8.0, 22.0, 1.0, { role: 'main', oil: true, tags: ['og'] });
  F('laal-maas', 'Laal maas (Rajasthani)', RG, 'nonveg', '1 katori (150 g)', 150, 330, 22.0, 6.0, 24.0, 1.5, { role: 'main', oil: true, tags: ['og', 'dairy', 'gf'] });
  F('amritsari-fish', 'Amritsari fish (fried)', RG, 'nonveg', '1 plate (100 g)', 100, 240, 17.0, 10.0, 14.0, 0.8, { role: 'snack', fried: 'deep', tags: ['og', 'gf'] });
  F('kerala-egg-roast', 'Egg roast (Kerala)', RG, 'egg', '2 eggs + masala (200 g)', 200, 290, 14.0, 10.0, 21.0, 2.0, { role: 'main', oil: true, tags: ['og', 'gf'], aka: ['Mutta roast'] });
  F('chingri-malai', 'Chingri malai curry (Bengali)', RG, 'nonveg', '1 katori (150 g)', 150, 240, 17.0, 8.0, 16.0, 1.5, { role: 'main', oil: true, tags: ['og', 'gf'], aka: ['Prawn malai curry'] });
  F('mutton-dhansak', 'Mutton dhansak (Parsi)', RG, 'nonveg', '1 katori (150 g)', 150, 280, 18.0, 15.0, 16.0, 3.5, { role: 'main', oil: true, tags: ['og', 'meal'] });
  F('litti-chokha', 'Litti chokha (Bihari)', RG, 'veg', '2 litti + chokha (250 g)', 250, 380, 10.0, 55.0, 13.0, 6.0, { role: 'main', tags: ['og', 'root', 'dairy', 'meal'] });
  F('dal-baati-churma', 'Dal baati churma (Rajasthani)', RG, 'veg', '1 plate (250 g)', 250, 550, 12.0, 70.0, 24.0, 6.0, { role: 'main', tags: ['dairy', 'og', 'meal'] });
  F('aloo-posto', 'Aloo posto (Bengali)', RG, 'vegan', '1 katori (150 g)', 150, 190, 4.0, 20.0, 11.0, 2.5, { role: 'sabzi', oil: true, tags: ['root', 'gf'] });
  F('shukto', 'Shukto (Bengali)', RG, 'veg', '1 katori (150 g)', 150, 130, 4.0, 14.0, 7.0, 3.5, { role: 'sabzi', oil: true, tags: ['root', 'dairy', 'gf'] });
  F('undhiyu', 'Undhiyu (Gujarati)', RG, 'vegan', '1 katori (150 g)', 150, 220, 5.0, 22.0, 13.0, 5.0, { role: 'main', oil: true, tags: ['og', 'root', 'gf'] });
  F('baingan-salan', 'Baghare baingan / salan (Hyderabadi)', RG, 'vegan', '1 katori (150 g)', 150, 210, 4.5, 12.0, 16.0, 3.5, { role: 'sabzi', oil: true, tags: ['og', 'gf'], aka: ['Mirchi ka salan'] });
  F('kadala-curry', 'Kadala curry (Kerala black chana)', RG, 'vegan', '1 katori (150 g)', 150, 210, 9.0, 25.0, 8.0, 6.5, { role: 'main', oil: true, tags: ['og', 'gf'] });
  F('veg-kurma', 'Vegetable kurma', RG, 'veg', '1 katori (150 g)', 150, 190, 4.5, 16.0, 12.0, 3.5, { role: 'main', oil: true, tags: ['og', 'root', 'dairy', 'gf'], aka: ['Veg korma'] });
  F('parotta', 'Malabar parotta', RG, 'veg', '1 parotta (90 g)', 90, 300, 5.5, 40.0, 13.0, 1.5, { role: 'staple', oil: true, tags: ['dairy'], aka: ['Kerala parotta', 'Barotta'] });
  F('kothu-parotta', 'Kothu parotta (egg)', RG, 'egg', '1 plate (250 g)', 250, 450, 14.0, 55.0, 19.0, 3.0, { role: 'main', oil: true, tags: ['og', 'meal'] });
  F('neer-dosa', 'Neer dosa', RG, 'vegan', '2 dosas (80 g)', 80, 120, 2.0, 24.0, 1.5, 1.0, { role: 'breakfast', tags: ['gf'] });
  F('ragi-mudde', 'Ragi mudde (Karnataka)', RG, 'vegan', '1 ball (150 g)', 150, 190, 4.0, 40.0, 1.0, 5.0, { role: 'staple', tags: ['gf'], aka: ['Ragi ball', 'Ragi sangati'] });
  F('akki-roti', 'Akki roti (Karnataka)', RG, 'vegan', '1 roti (80 g)', 80, 180, 4.0, 30.0, 5.0, 2.0, { role: 'breakfast', oil: true, tags: ['og', 'gf'] });
  F('handvo', 'Handvo (Gujarati)', RG, 'veg', '1 slice (100 g)', 100, 190, 6.0, 22.0, 9.0, 3.0, { role: 'snack', oil: true, tags: ['dairy', 'gf'] });
  F('muthiya', 'Muthiya (steamed, Gujarati)', RG, 'vegan', '5 pieces (100 g)', 100, 150, 5.0, 22.0, 5.0, 3.0, { role: 'snack', oil: true, tags: ['og'] });
  F('sabudana-vada', 'Sabudana vada', RG, 'vegan', '2 vadas (80 g)', 80, 260, 4.0, 30.0, 14.0, 1.5, { role: 'snack', fried: 'deep', tags: ['root', 'gf'] });
  F('paneer-tikka', 'Paneer tikka (grilled)', RG, 'veg', '6 pieces (100 g)', 100, 220, 14.0, 6.0, 16.0, 1.0, { role: 'snack', tags: ['dairy', 'og', 'gf', 'boost'] });
  F('misti-doi', 'Mishti doi (Bengali)', RG, 'veg', '1 katori (100 g)', 100, 180, 4.0, 25.0, 7.0, 0.0, { role: 'sweet', tags: ['dairy', 'gf'], aka: ['Misti doi', 'Sweet curd'] });

  /* ---------------- Basics & Ingredients ---------------- */
  var IN = 'Basics & Ingredients';
  F('ghee', 'Ghee', IN, 'veg', '1 tsp (5 g)', 5, 45, 0.0, 0.0, 5.0, 0.0, { role: 'ingredient', tags: ['dairy', 'gf'], aka: ['Clarified butter'] });
  F('butter', 'Butter', IN, 'veg', '1 tsp (5 g)', 5, 36, 0.0, 0.0, 4.1, 0.0, { role: 'ingredient', tags: ['dairy', 'gf'], aka: ['Makkhan'] });
  F('mustard-oil', 'Mustard oil', IN, 'vegan', '1 tsp (4.5 g)', 4.5, 40, 0.0, 0.0, 4.5, 0.0, { role: 'ingredient', tags: ['gf'], aka: ['Sarson ka tel'] });
  F('sunflower-oil', 'Sunflower / refined oil', IN, 'vegan', '1 tsp (4.5 g)', 4.5, 40, 0.0, 0.0, 4.5, 0.0, { role: 'ingredient', tags: ['gf'] });
  F('groundnut-oil', 'Groundnut oil', IN, 'vegan', '1 tsp (4.5 g)', 4.5, 40, 0.0, 0.0, 4.5, 0.0, { role: 'ingredient', tags: ['gf'], aka: ['Peanut oil'] });
  F('coconut-oil', 'Coconut oil', IN, 'vegan', '1 tsp (4.5 g)', 4.5, 40, 0.0, 0.0, 4.5, 0.0, { role: 'ingredient', tags: ['gf'], aka: ['Nariyal tel'] });
  F('olive-oil', 'Olive oil', IN, 'vegan', '1 tsp (4.5 g)', 4.5, 40, 0.0, 0.0, 4.5, 0.0, { role: 'ingredient', tags: ['gf'] });
  F('sugar', 'Sugar', IN, 'vegan', '1 tsp (5 g)', 5, 19, 0.0, 5.0, 0.0, 0.0, { role: 'ingredient', tags: ['gf'], aka: ['Cheeni', 'Shakkar'] });
  F('jaggery', 'Jaggery', IN, 'vegan', '1 small piece (10 g)', 10, 38, 0.0, 9.7, 0.0, 0.0, { role: 'ingredient', tags: ['gf'], aka: ['Gud', 'Gur', 'Vellam'] });
  F('honey', 'Honey', IN, 'veg', '1 tsp (7 g)', 7, 22, 0.0, 5.8, 0.0, 0.0, { role: 'ingredient', tags: ['gf'], aka: ['Shahad'] });
  F('atta', 'Whole wheat atta (raw)', IN, 'vegan', '100 g', 100, 341, 12.1, 69.4, 1.7, 11.2, { role: 'ingredient' });
  F('rice-raw', 'Rice, raw milled (uncooked)', IN, 'vegan', '100 g', 100, 356, 7.9, 78.2, 0.5, 2.8, { role: 'ingredient', tags: ['gf'] });
  F('toor-dal-raw', 'Toor dal (raw)', IN, 'vegan', '100 g', 100, 330, 21.7, 55.2, 1.7, 9.0, { role: 'ingredient', tags: ['gf'] });
  F('moong-raw', 'Moong dal (raw)', IN, 'vegan', '100 g', 100, 334, 23.9, 53.3, 1.2, 8.2, { role: 'ingredient', tags: ['gf'] });
  F('besan', 'Besan / gram flour (raw)', IN, 'vegan', '100 g', 100, 363, 22.4, 51.2, 6.7, 10.2, { role: 'ingredient', tags: ['gf'] });
  F('paneer-100', 'Paneer (100 g)', IN, 'veg', '100 g', 100, 265, 18.3, 3.4, 20.8, 0.0, { role: 'ingredient', tags: ['dairy', 'gf', 'boost'] });
  F('tofu', 'Tofu (100 g)', IN, 'vegan', '100 g', 100, 76, 8.5, 2.0, 4.5, 0.5, { role: 'ingredient', tags: ['gf', 'boost'], aka: ['Soya paneer'] });
  F('soya-chunks-dry', 'Soya chunks (dry)', IN, 'vegan', '30 g', 30, 100, 15.8, 9.0, 0.2, 4.0, { role: 'ingredient', tags: ['gf', 'boost'], aka: ['Meal maker'] });
  F('oats-raw', 'Oats (raw)', IN, 'vegan', '40 g', 40, 152, 5.4, 25.0, 3.2, 4.0, { role: 'ingredient' });
  F('milk-100', 'Milk, toned (100 ml)', IN, 'veg', '100 ml', 100, 60, 3.2, 4.8, 3.0, 0.0, { role: 'ingredient', tags: ['dairy', 'gf'] });

  /* ---------------- Protein Supplements ----------------
     Values are REPRESENTATIVE label figures per scoop/serving for the
     India market. Flavor barely changes macros (±a few kcal), so flavors
     are searchable aliases here rather than duplicate rows — search
     "kesar pista", "cookies and cream", etc. and adjust to your tub's label
     if it differs. Whey/casein/gainers are 'veg' (milk-derived); pea/soy
     are 'vegan'. Role 'supplement' keeps them out of auto diet plans. */
  var PS = 'Protein Supplements';
  var FLAV = ['Chocolate', 'Rich Chocolate', 'Vanilla', 'Strawberry', 'Kesar Pista', 'Mango', 'Cafe Mocha', 'Cookies and Cream', 'Banana'];
  F('whey-concentrate-generic', 'Whey protein — generic (1 scoop)', PS, 'veg', '1 scoop (33 g)', 33, 130, 24.0, 4.0, 2.0, 0.0, { role: 'supplement', tags: ['dairy', 'gf'], aka: ['whey concentrate', 'protein powder', 'whey shake', 'protein shake'].concat(FLAV) });
  F('whey-isolate-generic', 'Whey isolate — generic (1 scoop)', PS, 'veg', '1 scoop (30 g)', 30, 110, 27.0, 1.0, 0.5, 0.0, { role: 'supplement', tags: ['dairy', 'gf'], aka: ['whey isolate', 'iso protein', 'isolate'].concat(FLAV) });
  F('plant-protein-generic', 'Plant protein — generic (1 scoop)', PS, 'vegan', '1 scoop (30 g)', 30, 120, 24.0, 3.0, 2.0, 1.0, { role: 'supplement', tags: ['gf'], aka: ['pea protein', 'vegan protein', 'plant based protein'].concat(FLAV) });
  F('casein-generic', 'Casein protein — generic (1 scoop)', PS, 'veg', '1 scoop (34 g)', 34, 120, 24.0, 3.0, 1.0, 0.0, { role: 'supplement', tags: ['dairy', 'gf'], aka: ['slow protein', 'night protein', 'micellar casein'].concat(FLAV) });
  F('soy-protein-generic', 'Soy protein isolate — generic (1 scoop)', PS, 'vegan', '1 scoop (30 g)', 30, 110, 27.0, 1.0, 0.5, 0.0, { role: 'supplement', tags: ['gf'], aka: ['soya protein', 'soy isolate'] });
  F('mass-gainer-generic', 'Mass gainer — generic (per 100 g)', PS, 'veg', '100 g', 100, 380, 15.0, 75.0, 2.5, 1.0, { role: 'supplement', tags: ['dairy'], aka: ['weight gainer', 'gainer'].concat(FLAV) });
  F('egg-protein-generic', 'Egg white protein (1 scoop)', PS, 'egg', '1 scoop (30 g)', 30, 110, 24.0, 2.0, 0.5, 0.0, { role: 'supplement', tags: ['gf'], aka: ['egg albumin protein'] });
  // Whey — branded (concentrate/blend)
  F('mb-biozyme', 'MuscleBlaze Biozyme Performance Whey (1 scoop)', PS, 'veg', '1 scoop (33 g)', 33, 132, 25.0, 3.6, 1.9, 0.0, { role: 'supplement', tags: ['dairy', 'gf'], aka: ['MuscleBlaze', 'Biozyme', 'Rich Chocolate', 'Kesar Pista', 'Magical Mango', 'Chocolate Hazelnut'] });
  F('on-gold-whey', 'ON Gold Standard 100% Whey (1 scoop)', PS, 'veg', '1 scoop (31 g)', 31, 120, 24.0, 3.0, 1.0, 0.0, { role: 'supplement', tags: ['dairy', 'gf'], aka: ['Optimum Nutrition', 'Gold Standard', 'Double Rich Chocolate', 'Vanilla Ice Cream', 'Cookies and Cream', 'Extreme Milk Chocolate'] });
  F('avvatar-whey', 'Avvatar Whey Protein (1 scoop)', PS, 'veg', '1 scoop (33 g)', 33, 120, 25.6, 1.9, 1.4, 0.0, { role: 'supplement', tags: ['dairy', 'gf'], aka: ['Avvatar', 'Belgian Chocolate', 'Rich Milk Chocolate', 'Mango'] });
  F('gnc-whey', 'GNC Pro Performance 100% Whey (1 scoop)', PS, 'veg', '1 scoop (34 g)', 34, 130, 24.0, 4.0, 1.5, 0.0, { role: 'supplement', tags: ['dairy', 'gf'], aka: ['GNC', 'Chocolate Fudge', 'Double Rich Chocolate', 'Vanilla'] });
  F('un-prostar-whey', 'Ultimate Nutrition Prostar Whey (1 scoop)', PS, 'veg', '1 scoop (30 g)', 30, 120, 25.0, 2.5, 1.5, 0.0, { role: 'supplement', tags: ['dairy', 'gf'], aka: ['Ultimate Nutrition', 'Prostar'] });
  F('myprotein-impact', 'MyProtein Impact Whey (1 scoop)', PS, 'veg', '1 scoop (25 g)', 25, 103, 21.0, 1.0, 1.9, 0.0, { role: 'supplement', tags: ['dairy', 'gf'], aka: ['MyProtein', 'Impact Whey', 'Chocolate Smooth', 'Salted Caramel'] });
  F('bigmuscles-gold', 'Bigmuscles Premium Gold Whey (1 scoop)', PS, 'veg', '1 scoop (33 g)', 33, 120, 24.0, 3.0, 1.5, 0.0, { role: 'supplement', tags: ['dairy', 'gf'], aka: ['Bigmuscles', 'Premium Gold'] });
  F('asitis-whey', 'AS-IT-IS Whey Protein — unflavored (1 scoop)', PS, 'veg', '1 scoop (30 g)', 30, 120, 24.0, 1.0, 1.0, 0.0, { role: 'supplement', tags: ['dairy', 'gf'], aka: ['AS-IT-IS', 'raw whey', 'unflavored whey'] });
  F('fuelone-whey', 'Fuel One Whey (1 scoop)', PS, 'veg', '1 scoop (33 g)', 33, 120, 24.0, 3.0, 1.5, 0.0, { role: 'supplement', tags: ['dairy', 'gf'], aka: ['Fuel One'] });
  F('nakpro-whey', 'Nakpro Whey Protein (1 scoop)', PS, 'veg', '1 scoop (33 g)', 33, 122, 24.0, 3.0, 1.6, 0.0, { role: 'supplement', tags: ['dairy', 'gf'], aka: ['Nakpro'] });
  F('hkvitals-whey', 'HK Vitals Whey Protein (1 scoop)', PS, 'veg', '1 scoop (30 g)', 30, 120, 24.0, 2.5, 1.5, 0.0, { role: 'supplement', tags: ['dairy', 'gf'], aka: ['HK Vitals', 'HealthKart'] });
  // Whey isolate — branded
  F('dymatize-iso100', 'Dymatize ISO100 Hydrolyzed (1 scoop)', PS, 'veg', '1 scoop (32 g)', 32, 110, 25.0, 1.0, 0.0, 0.0, { role: 'supplement', tags: ['dairy', 'gf'], aka: ['Dymatize', 'ISO100', 'Gourmet Chocolate', 'Fudge Brownie', 'Birthday Cake'] });
  F('isopure-zerocarb', 'Isopure Zero Carb (1 scoop)', PS, 'veg', '1 scoop (31 g)', 31, 100, 25.0, 0.0, 0.5, 0.0, { role: 'supplement', tags: ['dairy', 'gf'], aka: ['Isopure', 'Zero Carb', 'Dutch Chocolate', 'Creamy Vanilla'] });
  F('on-isolate', 'ON Gold Standard 100% Isolate (1 scoop)', PS, 'veg', '1 scoop (32 g)', 32, 110, 25.0, 1.0, 0.5, 0.0, { role: 'supplement', tags: ['dairy', 'gf'], aka: ['Optimum Nutrition Isolate', 'Gold Standard Isolate'] });
  // Casein / gainers / plant — branded
  F('on-casein', 'ON Gold Standard 100% Casein (1 scoop)', PS, 'veg', '1 scoop (34 g)', 34, 120, 24.0, 3.0, 1.0, 0.0, { role: 'supplement', tags: ['dairy', 'gf'], aka: ['Optimum Nutrition Casein', 'Creamy Vanilla', 'Chocolate Supreme'] });
  F('on-serious-mass', 'ON Serious Mass (2 scoops)', PS, 'veg', '2 scoops (334 g)', 334, 1250, 50.0, 252.0, 4.5, 3.0, { role: 'supplement', tags: ['dairy'], aka: ['Optimum Nutrition', 'Serious Mass', 'weight gainer'] });
  F('mb-mass-gainer', 'MuscleBlaze Mass Gainer XXL (1 serving)', PS, 'veg', '1 serving (75 g)', 75, 340, 15.0, 65.0, 2.5, 1.0, { role: 'supplement', tags: ['dairy'], aka: ['MuscleBlaze Mass Gainer', 'weight gainer', 'XXL'] });
  F('oziva-plant', 'OZiva Protein & Herbs — plant (1 scoop)', PS, 'vegan', '1 scoop (33 g)', 33, 120, 20.0, 4.0, 2.0, 1.0, { role: 'supplement', tags: ['gf'], aka: ['OZiva', 'plant protein', 'Chocolate', 'Coffee'] });
  F('plix-plant', 'Plix Plant Protein (1 scoop)', PS, 'vegan', '1 scoop (30 g)', 30, 120, 24.0, 3.0, 2.0, 1.0, { role: 'supplement', tags: ['gf'], aka: ['Plix', 'Rich Chocolate', 'Coffee'] });
  F('mb-vegan', 'MuscleBlaze Vegan Protein (1 scoop)', PS, 'vegan', '1 scoop (33 g)', 33, 120, 24.0, 3.0, 2.0, 1.0, { role: 'supplement', tags: ['gf'], aka: ['MuscleBlaze Vegan', 'pea protein'] });

  /* ---------------- Pre-Workout & Aminos ----------------
     Pre-workouts and amino/creatine powders are near-zero calorie
     (caffeine, beta-alanine, citrulline, amino acids). Flavors are aliases. */
  var PW = 'Pre-Workout & Aminos';
  F('preworkout-generic', 'Pre-workout — generic (1 scoop)', PW, 'vegan', '1 scoop (10 g)', 10, 15, 0.0, 3.0, 0.0, 0.0, { role: 'supplement', tags: ['gf'], aka: ['pre workout', 'preworkout', 'caffeine scoop', 'Fruit Punch', 'Blue Razz'] });
  F('c4-original', 'Cellucor C4 Original (1 scoop)', PW, 'vegan', '1 scoop (6 g)', 6, 5, 0.0, 1.0, 0.0, 0.0, { role: 'supplement', tags: ['gf'], aka: ['C4', 'Cellucor', 'Fruit Punch', 'Icy Blue Razz'] });
  F('mb-preworkout', 'MuscleBlaze Pre Workout (1 scoop)', PW, 'vegan', '1 scoop (10 g)', 10, 12, 0.0, 2.0, 0.0, 0.0, { role: 'supplement', tags: ['gf'], aka: ['MuscleBlaze PreWO', 'Pre Workout 300xt'] });
  F('ghost-legend', 'GHOST Legend Pre-Workout (1 scoop)', PW, 'vegan', '1 scoop (12 g)', 12, 10, 0.0, 2.0, 0.0, 0.0, { role: 'supplement', tags: ['gf'], aka: ['GHOST', 'Legend'] });
  F('gnc-amp-preworkout', 'GNC AMP Pre-Workout (1 scoop)', PW, 'vegan', '1 scoop (13 g)', 13, 15, 0.0, 3.0, 0.0, 0.0, { role: 'supplement', tags: ['gf'], aka: ['GNC AMP', 'Gaspari'] });
  F('bcaa-generic', 'BCAA (1 serving)', PW, 'vegan', '1 serving (7 g)', 7, 5, 0.0, 0.0, 0.0, 0.0, { role: 'supplement', tags: ['gf'], aka: ['branched chain amino acids', 'intra workout'] });
  F('eaa-generic', 'EAA (1 serving)', PW, 'vegan', '1 serving (10 g)', 10, 8, 0.0, 1.0, 0.0, 0.0, { role: 'supplement', tags: ['gf'], aka: ['essential amino acids'] });
  F('creatine-mono', 'Creatine monohydrate (1 scoop, 5 g)', PW, 'vegan', '1 scoop (5 g)', 5, 0, 0.0, 0.0, 0.0, 0.0, { role: 'supplement', tags: ['gf'], aka: ['creatine', 'MB Creatine', 'Creapure'] });
  F('glutamine', 'L-Glutamine (1 scoop, 5 g)', PW, 'vegan', '1 scoop (5 g)', 5, 0, 0.0, 0.0, 0.0, 0.0, { role: 'supplement', tags: ['gf'], aka: ['glutamine'] });

  /* ---------------- Fibre Supplements ---------------- */
  var FS = 'Fibre Supplements';
  F('isabgol', 'Isabgol / psyllium husk (1 tbsp)', FS, 'vegan', '1 tbsp (5 g)', 5, 15, 0.5, 4.0, 0.1, 4.0, { role: 'supplement', tags: ['gf'], aka: ['psyllium husk', 'Sat Isabgol', 'Telephone isabgol', 'ispaghula', 'ishabgul'] });
  F('actifibre', 'Actifibre (1 sachet, PHGG)', FS, 'vegan', '1 sachet (5 g)', 5, 18, 0.0, 4.5, 0.0, 4.5, { role: 'supplement', tags: ['gf'], aka: ['Sanofi Actifibre', 'partially hydrolyzed guar gum', 'PHGG', 'Sunfiber'] });
  F('metamucil', 'Metamucil — sugar-free (1 rounded tsp)', FS, 'vegan', '1 tsp (6 g)', 6, 20, 0.0, 5.0, 0.0, 3.0, { role: 'supplement', tags: ['gf'], aka: ['psyllium fibre', 'Metamucil'] });
  F('daily-fibre', 'Daily Fibre supplement (1 serving)', FS, 'vegan', '1 serving (6 g)', 6, 20, 0.0, 5.0, 0.0, 5.0, { role: 'supplement', tags: ['gf'], aka: ['Wellbeing Daily Fibre', 'fibre supplement', 'HK Vitals Fibre'] });
  F('inulin-fibre', 'Inulin / chicory fibre (1 scoop)', FS, 'vegan', '1 scoop (6 g)', 6, 12, 0.0, 5.0, 0.0, 5.0, { role: 'supplement', tags: ['gf'], aka: ['chicory root fibre', 'prebiotic fibre', 'inulin'] });
  F('wheat-bran', 'Wheat bran (2 tbsp)', FS, 'vegan', '2 tbsp (15 g)', 15, 32, 2.3, 9.6, 0.7, 6.4, { role: 'supplement', aka: ['choker', 'bran', 'gehun ka choker'] });
  F('oat-bran', 'Oat bran (2 tbsp)', FS, 'vegan', '2 tbsp (15 g)', 15, 37, 2.6, 9.9, 1.0, 2.4, { role: 'supplement', tags: ['gf'], aka: ['oat fibre'] });

  window.FOODS = FOODS;

  /* Oil/fat types selectable in the logger — kcal per teaspoon. Calorie
     density is nearly identical across oils (~9 kcal/g); ghee and butter
     differ because a tsp weighs more/less and includes milk solids/water. */
  window.OIL_TYPES = [
    { id: 'ghee', name: 'Ghee', kcalPerTsp: 45, fatPerTsp: 5.0 },
    { id: 'butter', name: 'Butter', kcalPerTsp: 36, fatPerTsp: 4.1 },
    { id: 'mustard', name: 'Mustard oil', kcalPerTsp: 40, fatPerTsp: 4.5 },
    { id: 'sunflower', name: 'Sunflower/refined oil', kcalPerTsp: 40, fatPerTsp: 4.5 },
    { id: 'groundnut', name: 'Groundnut oil', kcalPerTsp: 40, fatPerTsp: 4.5 },
    { id: 'coconut', name: 'Coconut oil', kcalPerTsp: 40, fatPerTsp: 4.5 },
    { id: 'olive', name: 'Olive oil', kcalPerTsp: 40, fatPerTsp: 4.5 }
  ];

  /* Cooking-style fat multipliers, applied to the dish's fat grams for
     oil-sensitive dishes. Restaurant/dhaba cooking uses substantially more
     fat than a light home tadka — this is the main reason generic trackers
     misestimate Indian food. */
  window.COOK_STYLES = [
    { id: 'light', name: 'Home style — light oil', fatMult: 0.7 },
    { id: 'standard', name: 'Home style — standard', fatMult: 1.0 },
    { id: 'rich', name: 'Restaurant / dhaba — rich', fatMult: 1.5 }
  ];
})();
