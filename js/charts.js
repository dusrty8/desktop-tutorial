/*
 * Annapurna — SVG charts (no dependencies).
 * Colors come from CSS custom properties (see style.css) so the charts
 * adapt to light/dark mode; series colors follow the fixed categorical
 * order (slot 1 blue, slot 2 aqua, slot 3 yellow).
 */
(function () {
  'use strict';

  // Local HTML-escaper — charts.js is a standalone module and must not depend
  // on app.js's private esc(). Values reaching the tooltip are already
  // numeric/date-validated, so this is defense-in-depth.
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function svgEl(tag, attrs) {
    var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (var k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }

  /*
   * Weight-trend line chart with crosshair hover tooltip.
   * points: [{date:'YYYY-MM-DD', kg:Number}] sorted ascending.
   * goal (optional): goal weight, drawn as a dashed reference line.
   */
  function lineChart(container, points, goal) {
    container.innerHTML = '';
    if (!points.length) {
      container.innerHTML = '<p class="chart-empty">Log your weight to see the trend here.</p>';
      return;
    }
    var W = Math.max(container.clientWidth || 560, 320), H = 220;
    var pad = { l: 44, r: 14, t: 14, b: 26 };
    var kgs = points.map(function (p) { return p.kg; });
    var lo = Math.min.apply(null, kgs), hi = Math.max.apply(null, kgs);
    if (goal) { lo = Math.min(lo, goal); hi = Math.max(hi, goal); }
    var span = Math.max(hi - lo, 1);
    lo -= span * 0.1; hi += span * 0.1;

    function x(i) {
      return points.length === 1 ? (pad.l + (W - pad.l - pad.r) / 2)
        : pad.l + (W - pad.l - pad.r) * i / (points.length - 1);
    }
    function y(v) { return pad.t + (H - pad.t - pad.b) * (1 - (v - lo) / (hi - lo)); }

    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H, width: '100%', height: H, role: 'img', 'aria-label': 'Weight trend chart' });

    // horizontal gridlines + y labels
    for (var g = 0; g <= 3; g++) {
      var v = lo + (hi - lo) * g / 3;
      var gy = y(v);
      svg.appendChild(svgEl('line', { x1: pad.l, x2: W - pad.r, y1: gy, y2: gy, 'class': 'chart-grid' }));
      var lbl = svgEl('text', { x: pad.l - 8, y: gy + 4, 'text-anchor': 'end', 'class': 'chart-label' });
      lbl.textContent = (Math.round(v * 10) / 10).toFixed(1);
      svg.appendChild(lbl);
    }
    // x labels: first and last date
    var l0 = svgEl('text', { x: pad.l, y: H - 8, 'text-anchor': 'start', 'class': 'chart-label' });
    l0.textContent = points[0].date;
    svg.appendChild(l0);
    if (points.length > 1) {
      var l1 = svgEl('text', { x: W - pad.r, y: H - 8, 'text-anchor': 'end', 'class': 'chart-label' });
      l1.textContent = points[points.length - 1].date;
      svg.appendChild(l1);
    }

    if (goal) {
      var gy2 = y(goal);
      svg.appendChild(svgEl('line', { x1: pad.l, x2: W - pad.r, y1: gy2, y2: gy2, 'class': 'chart-goal', 'stroke-dasharray': '5 4' }));
      var gl = svgEl('text', { x: W - pad.r, y: gy2 - 5, 'text-anchor': 'end', 'class': 'chart-label' });
      gl.textContent = 'goal ' + goal + ' kg';
      svg.appendChild(gl);
    }

    var d = points.map(function (p, i) { return (i ? 'L' : 'M') + x(i) + ' ' + y(p.kg); }).join(' ');
    svg.appendChild(svgEl('path', { d: d, 'class': 'chart-line', fill: 'none' }));
    points.forEach(function (p, i) {
      svg.appendChild(svgEl('circle', { cx: x(i), cy: y(p.kg), r: points.length > 40 ? 2 : 3.5, 'class': 'chart-dot' }));
    });

    // hover layer: crosshair + tooltip
    var cross = svgEl('line', { x1: 0, x2: 0, y1: pad.t, y2: H - pad.b, 'class': 'chart-cross', visibility: 'hidden' });
    svg.appendChild(cross);
    var tip = document.createElement('div');
    tip.className = 'chart-tip';
    tip.style.display = 'none';
    container.style.position = 'relative';
    container.appendChild(svg);
    container.appendChild(tip);

    svg.addEventListener('mousemove', function (ev) {
      var rect = svg.getBoundingClientRect();
      var mx = (ev.clientX - rect.left) * W / rect.width;
      var best = 0, bd = Infinity;
      for (var i = 0; i < points.length; i++) {
        var dd = Math.abs(x(i) - mx);
        if (dd < bd) { bd = dd; best = i; }
      }
      cross.setAttribute('x1', x(best)); cross.setAttribute('x2', x(best));
      cross.setAttribute('visibility', 'visible');
      tip.style.display = 'block';
      tip.innerHTML = '<strong>' + esc(points[best].kg) + ' kg</strong><br>' + esc(points[best].date);
      var px = x(best) * rect.width / W;
      tip.style.left = Math.min(Math.max(px - 40, 0), rect.width - 96) + 'px';
      tip.style.top = (y(points[best].kg) * rect.height / H - 52) + 'px';
    });
    svg.addEventListener('mouseleave', function () {
      cross.setAttribute('visibility', 'hidden');
      tip.style.display = 'none';
    });
  }

  /*
   * Macro donut: protein / carbs / fat share of calories eaten.
   * segments: [{label, grams, kcal, cssVar}]
   * centerTop/centerBottom: text in the middle.
   */
  function donut(container, segments, centerTop, centerBottom) {
    container.innerHTML = '';
    var W = 180, H = 180, cx = W / 2, cy = H / 2, r = 66, stroke = 20;
    var total = 0;
    segments.forEach(function (s) { total += s.kcal; });
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, role: 'img', 'aria-label': 'Macronutrient split' });
    var circ = 2 * Math.PI * r;
    if (total <= 0) {
      svg.appendChild(svgEl('circle', { cx: cx, cy: cy, r: r, fill: 'none', 'class': 'donut-empty', 'stroke-width': stroke }));
    } else {
      var offset = 0;
      segments.forEach(function (s) {
        if (s.kcal <= 0) return;
        var frac = s.kcal / total;
        // 2px surface gap between segments
        var gap = 2 / circ;
        var seg = svgEl('circle', {
          cx: cx, cy: cy, r: r, fill: 'none',
          stroke: 'var(' + s.cssVar + ')', 'stroke-width': stroke,
          'stroke-dasharray': Math.max(circ * (frac - gap), 0.5) + ' ' + circ,
          'stroke-dashoffset': -circ * offset,
          transform: 'rotate(-90 ' + cx + ' ' + cy + ')'
        });
        var title = svgEl('title', {});
        title.textContent = s.label + ': ' + s.grams + ' g (' + Math.round(s.kcal / total * 100) + '% of calories)';
        seg.appendChild(title);
        svg.appendChild(seg);
        offset += frac;
      });
    }
    var t1 = svgEl('text', { x: cx, y: cy - 2, 'text-anchor': 'middle', 'class': 'donut-center-top' });
    t1.textContent = centerTop;
    var t2 = svgEl('text', { x: cx, y: cy + 18, 'text-anchor': 'middle', 'class': 'donut-center-bottom' });
    t2.textContent = centerBottom;
    svg.appendChild(t1); svg.appendChild(t2);
    container.appendChild(svg);
  }

  /*
   * Calorie ring gauge — a thick circular progress ring for the dashboard
   * hero. `fraction` is eaten ÷ budget; values > 1 (over budget) draw the
   * base ring full plus a red overflow arc. centerTop/centerBottom are the
   * big number and its caption. `over` flips the ring to the critical color.
   */
  function ring(container, fraction, centerTop, centerBottom, over) {
    container.innerHTML = '';
    var W = 190, H = 190, cx = W / 2, cy = H / 2, r = 78, stroke = 16;
    var circ = 2 * Math.PI * r;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H, width: '100%', role: 'img', 'aria-label': 'Calories used against budget' });
    // track
    svg.appendChild(svgEl('circle', { cx: cx, cy: cy, r: r, fill: 'none', 'class': 'ring-track', 'stroke-width': stroke }));
    var f = Math.max(fraction, 0);
    var base = Math.min(f, 1);
    var rot = 'rotate(-90 ' + cx + ' ' + cy + ')';
    if (base > 0) {
      svg.appendChild(svgEl('circle', {
        cx: cx, cy: cy, r: r, fill: 'none',
        'class': over ? 'ring-fill over' : 'ring-fill',
        'stroke-width': stroke, 'stroke-linecap': 'round',
        'stroke-dasharray': (circ * base) + ' ' + circ, transform: rot
      }));
    }
    if (f > 1) {
      // overflow arc (over budget) sits on top, in the critical color
      var overFrac = Math.min(f - 1, 1);
      svg.appendChild(svgEl('circle', {
        cx: cx, cy: cy, r: r, fill: 'none',
        'class': 'ring-over', 'stroke-width': stroke, 'stroke-linecap': 'round',
        'stroke-dasharray': (circ * overFrac) + ' ' + circ, transform: rot
      }));
    }
    var t1 = svgEl('text', { x: cx, y: cy - 4, 'text-anchor': 'middle', 'class': over ? 'ring-top over' : 'ring-top' });
    t1.textContent = centerTop;
    var t2 = svgEl('text', { x: cx, y: cy + 20, 'text-anchor': 'middle', 'class': 'ring-bottom' });
    t2.textContent = centerBottom;
    svg.appendChild(t1); svg.appendChild(t2);
    container.appendChild(svg);
  }

  window.Charts = { lineChart: lineChart, donut: donut, ring: ring };
})();
