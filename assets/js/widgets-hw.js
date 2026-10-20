/*
 * widgets-hw.js
 * Widgets shared by several lessons in this course:
 *   convShape   calculator for the shape, size, MACs and reuse of one convolution layer
 *   convWindow  a filter sliding over a small image, with the reuse counts that follow
 *   hierEnergy  energy per MAC as a mix of accesses at four levels of the memory hierarchy
 *   rooflineBasic  the Roofline chart for one machine, with a kernel you can move
 * Also exports MLS.hw.drawRoofline(host, spec) for lessons that build their own roofline widgets.
 * Load after engine.js and hw.js. Each lesson tags these widgets itself (paper, original or toy).
 */
(function () {
  'use strict';
  var MLS = window.MLS;
  var h = MLS.h;
  var ui = MLS.ui;
  var fmt = MLS.fmt;
  var hw = MLS.hw;

  function note(text) {
    return h('p', { style: { fontSize: '0.84rem', color: 'var(--ink-3)' }, html: MLS.rich(text) });
  }

  /* Short form for counts: 105.4 M, 34,848, 2.3 G. */
  function count(n) {
    if (n >= 1e9) return fmt(n / 1e9, 2) + ' G';
    if (n >= 1e6) return fmt(n / 1e6, n >= 1e8 ? 0 : 1) + ' M';
    return hw.int(n);
  }
  hw.count = count;

  /* ======================================================================
   * convShape
   *   Output size E = floor((H + 2P - R) / U) + 1 (the same for width, F).
   *   MACs = N x M x E x F x C x R x S. Weights = M x C x R x S.
   *   opts: { presets?: [id], start?: id }
   * ==================================================================== */
  var PRESETS = {
    alex1: { label: 'AlexNet CONV1', n: 1, c: 3, m: 96, h: 227, r: 11, u: 4, p: 0 },
    alex3: { label: 'AlexNet CONV3', n: 1, c: 256, m: 384, h: 13, r: 3, u: 1, p: 1 },
    vgg1: { label: 'VGG-16 CONV1_1', n: 1, c: 3, m: 64, h: 224, r: 3, u: 1, p: 1 },
    one: { label: '1 x 1 layer', n: 1, c: 256, m: 64, h: 56, r: 1, u: 1, p: 0 }
  };
  hw.convPresets = PRESETS;

  MLS.widgets.convShape = function (host, opts) {
    var ids = opts.presets || ['alex1', 'alex3', 'vgg1', 'one'];
    var LISTS = {
      n: [1, 2, 4, 8, 16, 32, 64],
      c: [1, 3, 16, 32, 64, 128, 192, 256, 384, 512],
      m: [16, 32, 64, 96, 128, 192, 256, 384, 512],
      h: [7, 13, 14, 27, 28, 55, 56, 112, 224, 227],
      r: [1, 3, 5, 7, 11],
      u: [1, 2, 4],
      p: [0, 1, 2, 3]
    };
    var cfg = Object.assign({}, PRESETS[opts.start || ids[0]]);
    var sliders = {};
    var stats = {
      ef: ui.stat('Output size E x F', ''),
      macs: ui.stat('Multiply-accumulates', ''),
      weights: ui.stat('Weights', ''),
      ifmap: ui.stat('Input values', ''),
      ofmap: ui.stat('Output values', ''),
      wreuse: ui.stat('Uses of each weight', 'times'),
      ireuse: ui.stat('Uses of each input value (about)', 'times'),
      acc: ui.stat('Additions per output value', ''),
      best: ui.stat('MACs per value moved, best case', '')
    };
    var message = ui.msg('');
    var seg;

    function geometry() {
      var span = cfg.h + 2 * cfg.p - cfg.r;
      var e = span < 0 ? 0 : Math.floor(span / cfg.u) + 1;
      var macs = cfg.n * cfg.m * e * e * cfg.c * cfg.r * cfg.r;
      var weights = cfg.m * cfg.c * cfg.r * cfg.r;
      var ifmap = cfg.n * cfg.c * cfg.h * cfg.h;
      var ofmap = cfg.n * cfg.m * e * e;
      return { e: e, macs: macs, weights: weights, ifmap: ifmap, ofmap: ofmap };
    }
    function paint() {
      var g = geometry();
      stats.ef.set(g.e + ' x ' + g.e, g.e < 1 ? 'bad' : '');
      stats.macs.set(count(g.macs), 'warn');
      stats.weights.set(count(g.weights));
      stats.ifmap.set(count(g.ifmap));
      stats.ofmap.set(count(g.ofmap));
      stats.wreuse.set(hw.int(cfg.n * g.e * g.e));
      stats.ireuse.set(hw.int(Math.round((cfg.m * cfg.r * cfg.r) / (cfg.u * cfg.u))));
      stats.acc.set(hw.int(cfg.c * cfg.r * cfg.r));
      var moved = g.weights + g.ifmap + g.ofmap;
      stats.best.set(moved ? fmt(g.macs / moved, 0) : '-');
      if (g.e < 1) message.set('The filter is bigger than the padded input, so the layer has no output. Reduce R or add padding.', 'bad');
      else message.set('Output is **' + g.e + ' x ' + g.e + '** per channel, so each filter produces ' + hw.int(g.e * g.e) + ' values and the whole layer does **' + count(g.macs) + '** multiply-accumulates with only ' + count(g.weights) + ' weights. Every weight is reused ' + hw.int(cfg.n * g.e * g.e) + ' times.');
    }
    function syncSliders() {
      Object.keys(sliders).forEach(function (k) {
        sliders[k].set(LISTS[k].indexOf(cfg[k]) >= 0 ? LISTS[k].indexOf(cfg[k]) : 0);
      });
    }
    function make(key, label, fmtFn) {
      sliders[key] = ui.slider({
        label: label,
        min: 0,
        max: LISTS[key].length - 1,
        value: Math.max(0, LISTS[key].indexOf(cfg[key])),
        format: fmtFn || function (v) { return LISTS[key][v]; },
        onInput: function (v) {
          cfg[key] = LISTS[key][v];
          if (seg) seg.set('custom');
          paint();
        }
      });
    }
    make('n', 'Batch N');
    make('c', 'Input channels C');
    make('m', 'Filters M (output channels)');
    make('h', 'Input height and width H');
    make('r', 'Filter height and width R');
    make('u', 'Stride U');
    make('p', 'Zero padding P');

    seg = ui.seg(
      ids.map(function (id) { return { label: PRESETS[id].label, value: id }; }).concat([{ label: 'Your own', value: 'custom' }]),
      opts.start || ids[0],
      function (v) {
        if (v === 'custom') return;
        cfg = Object.assign({}, PRESETS[v]);
        syncSliders();
        paint();
      },
      'Layer presets'
    );

    host.appendChild(h('p', { html: MLS.rich('Pick a preset or move the sliders. The layer has **M** filters, each **C x R x S** weights, that slide over an **H x W** input with stride **U**. The output of each filter is **E x F**.') }));
    host.appendChild(h('div.controls', seg.el));
    host.appendChild(h('div.controls', sliders.n.el, sliders.c.el, sliders.m.el, sliders.h.el));
    host.appendChild(h('div.controls', sliders.r.el, sliders.u.el, sliders.p.el));
    host.appendChild(h('div.readout', stats.ef.el, stats.macs.el, stats.weights.el, stats.ifmap.el, stats.ofmap.el));
    host.appendChild(h('div.readout', stats.wreuse.el, stats.ireuse.el, stats.acc.el, stats.best.el));
    host.appendChild(message.el);
    host.appendChild(note('E = floor((H + 2P - R) / U) + 1, MACs = N x M x E x F x C x R x S, weights = M x C x R x S. "Uses of each input value" is the interior count M x R x S / U squared, so pixels near the border are used a little less. "Best case" counts each weight, input value and output value moved once and ignores partial sums moving more than once.'));
    paint();
  };

  /* ======================================================================
   * convWindow: one filter sliding over a small single-channel image
   *   opts: { n?: input size, r?: filter size, u?: stride }
   * ==================================================================== */
  MLS.widgets.convWindow = function (host, opts) {
    var cfg = { n: opts.n || 7, r: opts.r || 3, u: opts.u || 1, pos: 0, showCounts: false };
    var inHost = h('div.cwcol');
    var fHost = h('div.cwcol');
    var oHost = h('div.cwcol');
    var posSlider;
    var message = ui.msg('');
    var statOut = ui.stat('Output values', '');
    var statW = ui.stat('Uses of each weight', 'times');
    var statMax = ui.stat('Most-used input value', 'times');
    var statMin = ui.stat('Least-used input value', 'times');

    function outSize() {
      return Math.floor((cfg.n - cfg.r) / cfg.u) + 1;
    }
    function coverage() {
      var e = outSize();
      var cov = [];
      for (var y = 0; y < cfg.n; y++) {
        cov.push([]);
        for (var x = 0; x < cfg.n; x++) cov[y].push(0);
      }
      for (var oy = 0; oy < e; oy++) {
        for (var ox = 0; ox < e; ox++) {
          for (var i = 0; i < cfg.r; i++) {
            for (var j = 0; j < cfg.r; j++) cov[oy * cfg.u + i][ox * cfg.u + j]++;
          }
        }
      }
      return cov;
    }
    function grid(rows, cols, cellFn, label) {
      var g = h('div.cgrid', { role: 'img', 'aria-label': label, style: { gridTemplateColumns: 'repeat(' + cols + ', minmax(0, 1fr))' } });
      for (var y = 0; y < rows; y++) {
        for (var x = 0; x < cols; x++) {
          var info = cellFn(y, x);
          g.appendChild(h('div.cell' + (info.cls ? '.' + info.cls.split(' ').join('.') : ''), info.text === undefined ? '' : String(info.text)));
        }
      }
      return g;
    }
    function paint() {
      var e = outSize();
      var total = e * e;
      if (cfg.pos > total - 1) cfg.pos = total - 1;
      posSlider.setMax(total - 1);
      posSlider.set(cfg.pos);
      var oy = Math.floor(cfg.pos / e);
      var ox = cfg.pos % e;
      var cov = coverage();
      var min = 1e9;
      var max = 0;
      cov.forEach(function (row) { row.forEach(function (v) { min = Math.min(min, v); max = Math.max(max, v); }); });
      var done = cfg.pos + 1;

      inHost.innerHTML = '';
      inHost.appendChild(h('div.cwlab', 'Input ' + cfg.n + ' x ' + cfg.n));
      inHost.appendChild(
        grid(cfg.n, cfg.n, function (y, x) {
          var inWin = y >= oy * cfg.u && y < oy * cfg.u + cfg.r && x >= ox * cfg.u && x < ox * cfg.u + cfg.r;
          var text = cfg.showCounts ? cov[y][x] : '';
          return { cls: inWin ? 'win' : '', text: text };
        }, 'Input image with the current filter position marked')
      );
      fHost.innerHTML = '';
      fHost.appendChild(h('div.cwlab', 'Filter ' + cfg.r + ' x ' + cfg.r));
      fHost.appendChild(
        grid(cfg.r, cfg.r, function () {
          return { cls: 'win', text: cfg.showCounts ? total : '' };
        }, 'The filter, whose weights are used at every position')
      );
      oHost.innerHTML = '';
      oHost.appendChild(h('div.cwlab', 'Output ' + e + ' x ' + e));
      oHost.appendChild(
        grid(e, e, function (y, x) {
          var idx = y * e + x;
          return { cls: idx === cfg.pos ? 'cur' : idx < cfg.pos ? 'done' : '' };
        }, 'Output image, filled in as the filter slides')
      );
      statOut.set(e + ' x ' + e + ' = ' + total);
      statW.set(String(total));
      statMax.set(String(max));
      statMin.set(String(min), min === 1 ? 'warn' : '');
      message.set('Position ' + done + ' of ' + total + '. The filter covers ' + cfg.r * cfg.r + ' input values and makes **one** output value from ' + cfg.r * cfg.r + ' multiply-accumulates. Every filter weight is used at all ' + total + ' positions, and an input value in the middle is used by up to ' + max + ' windows.');
    }

    posSlider = ui.slider({ label: 'Filter position', min: 0, max: 24, value: 0, format: function (v) { return v + 1; }, onInput: function (v) { cfg.pos = v; paint(); } });
    var nSlider = ui.slider({ label: 'Input size', min: 5, max: 9, value: cfg.n, onInput: function (v) { cfg.n = v; cfg.pos = 0; paint(); } });
    var rSeg = ui.seg([{ label: '1 x 1', value: 1 }, { label: '2 x 2', value: 2 }, { label: '3 x 3', value: 3 }], cfg.r, function (v) { cfg.r = v; cfg.pos = 0; paint(); }, 'Filter size');
    var uSeg = ui.seg([{ label: 'Stride 1', value: 1 }, { label: 'Stride 2', value: 2 }], cfg.u, function (v) { cfg.u = v; cfg.pos = 0; paint(); }, 'Stride');
    var cSeg = ui.seg([{ label: 'Hide counts', value: false }, { label: 'Show use counts', value: true }], false, function (v) { cfg.showCounts = v; paint(); }, 'Show how often each value is used');

    host.appendChild(h('p', { html: MLS.rich('Slide the filter across the input one step at a time. Then switch on the use counts to see how many windows reuse each input value and each weight.') }));
    host.appendChild(h('div.controls', rSeg.el, uSeg.el, cSeg.el));
    host.appendChild(h('div.controls', nSlider.el, posSlider.el));
    host.appendChild(h('div.cwrow', inHost, fHost, oHost));
    host.appendChild(h('div.readout', statOut.el, statW.el, statMax.el, statMin.el));
    host.appendChild(message.el);
    host.appendChild(note('One channel, one filter, no padding, to keep the picture small. A real layer repeats this over C channels and M filters.'));
    paint();
  };

  /* ======================================================================
   * hierEnergy: energy per MAC from accesses at four memory levels
   *   Costs relative to one MAC: register file 1, neighbor PE 2, global buffer 6, DRAM 200.
   *   opts: { presets?: [{label, rf, pe, buf, dram}] }
   * ==================================================================== */
  hw.levelCost = { rf: 1, pe: 2, buf: 6, dram: 200 };

  MLS.widgets.hierEnergy = function (host, opts) {
    var COST = hw.levelCost;
    var LEVELS = [
      { k: 'dram', label: 'DRAM', cost: COST.dram, color: 'var(--bad)' },
      { k: 'buf', label: 'Global buffer', cost: COST.buf, color: 'var(--warn)' },
      { k: 'pe', label: 'Neighbor PE', cost: COST.pe, color: 'var(--accent)' },
      { k: 'rf', label: 'Register file', cost: COST.rf, color: 'var(--good)' }
    ];
    var PRESETS_H = opts.presets || [
      { label: 'No reuse: all 4 from DRAM', rf: 0, pe: 0, buf: 0, dram: 4 },
      { label: 'Buffer in the middle', rf: 0, pe: 0, buf: 4, dram: 0.1 },
      { label: 'Mostly local', rf: 3.4, pe: 0.3, buf: 0.12, dram: 0.01 }
    ];
    var cfg = Object.assign({}, PRESETS_H[0]);
    var sliders = {};
    var bars = {};
    var statTot = ui.stat('Energy per MAC', 'x one MAC');
    var statDram = ui.stat('Share from DRAM', '');
    var message = ui.msg('');
    var seg;

    function paint() {
      var parts = {};
      var total = 1;
      LEVELS.forEach(function (lv) {
        parts[lv.k] = cfg[lv.k] * lv.cost;
        total += parts[lv.k];
      });
      LEVELS.forEach(function (lv) {
        bars[lv.k].set(parts[lv.k] / total, fmt(parts[lv.k], 1), lv.color);
      });
      statTot.set(fmt(total, total < 20 ? 1 : 0), total > 100 ? 'bad' : total > 10 ? 'warn' : 'good');
      statDram.set(fmt((parts.dram / total) * 100, 0) + '%', parts.dram / total > 0.5 ? 'bad' : '');
      var top = LEVELS.slice().sort(function (a, b) { return parts[b.k] - parts[a.k]; })[0];
      message.set('The multiply-accumulate itself costs **1**. Data accesses add **' + fmt(total - 1, 1) + '**. The biggest part is **' + top.label.toLowerCase() + '**, at ' + fmt((parts[top.k] / total) * 100, 0) + '% of the total.', total > 100 ? 'warn' : '');
    }
    LEVELS.forEach(function (lv) {
      sliders[lv.k] = ui.slider({
        label: lv.label + ' accesses per MAC (cost ' + lv.cost + 'x)',
        min: 0,
        max: 4,
        step: 0.01,
        value: cfg[lv.k],
        format: function (v) { return fmt(v, 2); },
        onInput: function (v) {
          cfg[lv.k] = v;
          if (seg) seg.set('custom');
          paint();
        }
      });
      bars[lv.k] = ui.meterRow(lv.label);
    });
    seg = ui.seg(
      PRESETS_H.map(function (p, i) { return { label: p.label, value: String(i) }; }).concat([{ label: 'Your own', value: 'custom' }]),
      '0',
      function (v) {
        if (v === 'custom') return;
        var p = PRESETS_H[+v];
        LEVELS.forEach(function (lv) {
          cfg[lv.k] = p[lv.k];
          sliders[lv.k].set(p[lv.k]);
        });
        paint();
      },
      'Access mixes'
    );

    host.appendChild(h('p', { html: MLS.rich('Every MAC reads its operands and writes a result. Where those accesses happen decides the energy. Costs are relative to one MAC. Choose a mix, or set your own.') }));
    host.appendChild(h('div.controls', seg.el));
    host.appendChild(h('div.controls', LEVELS.map(function (lv) { return sliders[lv.k].el; })));
    host.appendChild(h('div.readout', statTot.el, statDram.el));
    host.appendChild(h('div.meters', LEVELS.map(function (lv) { return bars[lv.k].el; })));
    host.appendChild(message.el);
    host.appendChild(note(opts.footnote || 'Cost ratios: register file 1x, neighbor PE 2x, global buffer 6x, DRAM 200x, each relative to one MAC. The access mixes are ours and only illustrate the effect.'));
    paint();
  };

  /* ======================================================================
   * Roofline chart renderer
   *   spec: { xmin, xmax, ymin, ymax, xLabel?, yLabel?, ariaLabel?, minWidth?,
   *           machines: [{ label, peak, bw, ceilings?: [{ label, peak?, bw? }] }],
   *           points: [{ label, oi, machine? }] }
   *   Units: peak in G-ops per second, bw in GB per second, oi in operations per byte.
   *   Attainable performance = min(peak, bw x oi).
   * ==================================================================== */
  var rfId = 0;
  hw.attainable = function (machine, oi) {
    return Math.min(machine.peak, machine.bw * oi);
  };
  hw.drawRoofline = function (host, spec) {
    var s = MLS.s;
    var id = 'rf' + ++rfId;
    var W = spec.width || 640;
    var H = spec.height || 340;
    var m = { l: 82, r: 20, t: 14, b: 48 };
    var pw = W - m.l - m.r;
    var ph = H - m.t - m.b;
    var lx0 = Math.log10(spec.xmin);
    var lx1 = Math.log10(spec.xmax);
    var ly0 = Math.log10(spec.ymin);
    var ly1 = Math.log10(spec.ymax);
    function X(v) { return m.l + ((Math.log10(v) - lx0) / (lx1 - lx0)) * pw; }
    function Y(v) { return m.t + ph - ((Math.log10(v) - ly0) / (ly1 - ly0)) * ph; }
    function fmtTick(v) {
      if (v >= 1000) return hw.int(v);
      if (v >= 1) return String(v);
      return String(Number(v.toPrecision(2)));
    }
    var svg = s('svg', { class: 'rfchart', viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': spec.ariaLabel || 'Roofline chart', style: 'min-width:' + (spec.minWidth || 560) + 'px' });
    svg.appendChild(s('defs', s('clipPath', { id: id + '-clip' }, s('rect', { x: m.l, y: m.t, width: pw, height: ph }))));
    var k;
    for (k = Math.ceil(lx0); k <= Math.floor(lx1); k++) {
      var gx = X(Math.pow(10, k));
      svg.appendChild(s('line', { class: 'grid', x1: gx, y1: m.t, x2: gx, y2: m.t + ph }));
      svg.appendChild(s('text', { class: 'tick', x: gx, y: m.t + ph + 16, 'text-anchor': 'middle' }, fmtTick(Math.pow(10, k))));
    }
    for (k = Math.ceil(ly0); k <= Math.floor(ly1); k++) {
      var gy = Y(Math.pow(10, k));
      svg.appendChild(s('line', { class: 'grid', x1: m.l, y1: gy, x2: m.l + pw, y2: gy }));
      svg.appendChild(s('text', { class: 'tick', x: m.l - 6, y: gy + 4, 'text-anchor': 'end' }, fmtTick(Math.pow(10, k))));
    }
    svg.appendChild(s('rect', { class: 'frame', x: m.l, y: m.t, width: pw, height: ph }));
    svg.appendChild(s('text', { class: 'axis', x: m.l + pw / 2, y: H - 8, 'text-anchor': 'middle' }, spec.xLabel || 'Operational intensity (operations per DRAM byte)'));
    svg.appendChild(s('text', { class: 'axis', transform: 'translate(14 ' + (m.t + ph / 2) + ') rotate(-90)', 'text-anchor': 'middle' }, spec.yLabel || 'Attainable performance (G operations per second)'));

    var layer = s('g', { 'clip-path': 'url(#' + id + '-clip)' });
    function roofPath(peak, bw) {
      var ridge = peak / bw;
      var x0 = spec.xmin;
      var x1 = spec.xmax;
      var d = 'M' + X(x0) + ' ' + Y(Math.min(peak, bw * x0));
      if (ridge > x0 && ridge < x1) d += ' L' + X(ridge) + ' ' + Y(peak);
      d += ' L' + X(x1) + ' ' + Y(Math.min(peak, bw * x1));
      return d;
    }
    spec.machines.forEach(function (mc, i) {
      (mc.ceilings || []).forEach(function (c) {
        layer.appendChild(s('path', { class: 'ceil', d: roofPath(c.peak || mc.peak, c.bw || mc.bw) }));
      });
    });
    spec.machines.forEach(function (mc, i) {
      layer.appendChild(s('path', { class: 'roof r' + (i % 3), d: roofPath(mc.peak, mc.bw) }));
    });
    svg.appendChild(layer);

    spec.machines.forEach(function (mc, i) {
      (mc.ceilings || []).forEach(function (c) {
        if (!c.label) return;
        var cp = c.peak || mc.peak;
        var cb = c.bw || mc.bw;
        var xr = spec.xmax / 1.15;
        var xl = Math.min(xr, Math.max(spec.xmin * 1.2, (cp / cb) * 1.6));
        var onFlat = !!c.peak;
        var tx = onFlat ? spec.xmax / 1.1 : spec.xmin * 1.35;
        var ty = onFlat ? cp : cb * tx;
        svg.appendChild(s('text', { class: 'ceillab', x: onFlat ? X(tx) : X(tx) + 4, y: Y(ty) - (onFlat ? 4 : 8), 'text-anchor': onFlat ? 'end' : 'start' }, c.label));
      });
      var ridge = mc.peak / mc.bw;
      if (ridge > spec.xmin && ridge < spec.xmax) {
        svg.appendChild(s('line', { class: 'ridge', x1: X(ridge), y1: Y(mc.peak), x2: X(ridge), y2: m.t + ph }));
        svg.appendChild(s('text', { class: 'ridgelab', x: X(ridge) + 4, y: m.t + ph - 6 }, 'ridge ' + (ridge >= 10 ? hw.int(ridge) : fmt(ridge, 1))));
      }
      if (spec.machines.length > 1) svg.appendChild(s('text', { class: 'mlab r' + (i % 3), x: m.l + 8, y: m.t + 16 + i * 15 }, mc.label));
    });

    /* Labels go where they do not cover an earlier label: try several spots around each point. */
    var placed = [];
    (spec.points || []).forEach(function (pt) {
      var mc = spec.machines[pt.machine || 0];
      var px = X(pt.oi);
      var py = Y(hw.attainable(mc, pt.oi));
      placed.push({ x0: px - 9, x1: px + 9, y0: py - 9, y1: py + 9 });
    });
    function overlaps(r) {
      for (var j = 0; j < placed.length; j++) {
        var q = placed[j];
        if (r.x0 < q.x1 && r.x1 > q.x0 && r.y0 < q.y1 && r.y1 > q.y0) return true;
      }
      return false;
    }
    (spec.points || []).forEach(function (pt, i) {
      var mc = spec.machines[pt.machine || 0];
      var att = hw.attainable(mc, pt.oi);
      var bound = pt.oi < mc.peak / mc.bw ? 'mem' : 'cmp';
      var cx = X(pt.oi);
      var cy = Y(att);
      svg.appendChild(s('line', { class: 'drop', x1: cx, y1: cy, x2: cx, y2: m.t + ph }));
      svg.appendChild(s('circle', { class: 'pt ' + bound, cx: cx, cy: cy, r: 6 }));
      var w = pt.label.length * 6.4 + 4;
      var spots = [[1, -9], [-1, 17], [1, 17], [-1, -9], [1, -26], [-1, 34], [1, 36], [-1, -26], [1, -43], [-1, 51]];
      var chosen = null;
      for (var k = 0; k < spots.length && !chosen; k++) {
        var side = spots[k][0];
        var dy = spots[k][1];
        var x0 = side > 0 ? cx + 9 : cx - 9 - w;
        var rect = { x0: x0, x1: x0 + w, y0: cy + dy - 12, y1: cy + dy + 4 };
        if (rect.x0 < m.l + 2 || rect.x1 > m.l + pw - 2 || rect.y0 < m.t || rect.y1 > m.t + ph) continue;
        if (!overlaps(rect)) chosen = { side: side, dy: dy, rect: rect };
      }
      if (!chosen) chosen = { side: cx < m.l + pw / 2 ? 1 : -1, dy: -9, rect: { x0: cx, x1: cx + w, y0: cy - 21, y1: cy - 5 } };
      placed.push(chosen.rect);
      svg.appendChild(s('text', { class: 'ptlab', x: cx + (chosen.side > 0 ? 9 : -9), y: cy + chosen.dy, 'text-anchor': chosen.side > 0 ? 'start' : 'end' }, pt.label));
    });
    host.appendChild(h('div.rfwrap', svg));
    return svg;
  };

  /* ======================================================================
   * rooflineBasic: one machine, a few named kernels, and one kernel you can move
   *   opts: { kernels?: [{ label, oi }], peak?: G-ops/s, bw?: GB/s }
   * ==================================================================== */
  MLS.widgets.rooflineBasic = function (host, opts) {
    var PEAKS = [25, 50, 100, 200, 400, 800];
    var BWS = [5, 10, 25, 50, 100, 200];
    var OIS = [1 / 16, 1 / 8, 1 / 4, 1 / 2, 1, 2, 4, 8, 16, 32, 64, 128, 256];
    function oiLabel(v) { return v < 1 ? '1/' + Math.round(1 / v) : String(v); }
    var cfg = { p: PEAKS.indexOf(opts.peak || 100), b: BWS.indexOf(opts.bw || 25), o: 4 };
    var chartHost = h('div');
    var statRidge = ui.stat('Ridge point', 'ops per byte');
    var statAtt = ui.stat('Your kernel can reach', 'G ops/s');
    var statPct = ui.stat('Share of peak', '');
    var statBound = ui.stat('Limited by', '');
    var message = ui.msg('');
    var kernels = opts.kernels || [{ label: 'Vector add', oi: 1 / 12 }, { label: 'Tiled matrix multiply', oi: 32 }];

    function paint() {
      var peak = PEAKS[cfg.p];
      var bw = BWS[cfg.b];
      var oi = OIS[cfg.o];
      var mc = { label: 'Machine', peak: peak, bw: bw };
      var att = hw.attainable(mc, oi);
      var ridge = peak / bw;
      var memBound = oi < ridge;
      chartHost.innerHTML = '';
      var pts = kernels.map(function (k) { return { label: k.label, oi: k.oi }; });
      pts.push({ label: 'Your kernel', oi: oi });
      hw.drawRoofline(chartHost, {
        xmin: 1 / 32,
        xmax: 512,
        ymin: 1,
        ymax: 1000,
        machines: [mc],
        points: pts,
        ariaLabel: 'Roofline for a machine with peak ' + peak + ' G operations per second and bandwidth ' + bw + ' GB per second'
      });
      statRidge.set(fmt(ridge, ridge < 10 ? 1 : 0));
      statAtt.set(fmt(att, att < 10 ? 1 : 0), memBound ? 'warn' : 'good');
      statPct.set(fmt((att / peak) * 100, 0) + '%', att / peak < 0.5 ? 'bad' : 'good');
      statBound.set(memBound ? 'Memory' : 'Compute', memBound ? 'warn' : 'good');
      message.set(
        memBound
          ? 'Your kernel does **' + oiLabel(oi) + '** operations per DRAM byte, left of the ridge at **' + fmt(ridge, 1) + '**. The memory system can only feed it ' + fmt(att, 1) + ' G ops/s, which is ' + fmt((att / peak) * 100, 0) + '% of peak. More arithmetic units would not help. More reuse or more bandwidth would.'
          : 'Your kernel does **' + oiLabel(oi) + '** operations per DRAM byte, right of the ridge at **' + fmt(ridge, 1) + '**. Memory keeps up, so the arithmetic units set the limit: ' + fmt(att, 0) + ' G ops/s, full peak. More bandwidth would not help.',
        memBound ? 'warn' : 'good'
      );
    }
    var pSl = ui.slider({ label: 'Peak compute', min: 0, max: PEAKS.length - 1, value: cfg.p, format: function (v) { return PEAKS[v] + ' G ops/s'; }, onInput: function (v) { cfg.p = v; paint(); } });
    var bSl = ui.slider({ label: 'Memory bandwidth', min: 0, max: BWS.length - 1, value: cfg.b, format: function (v) { return BWS[v] + ' GB/s'; }, onInput: function (v) { cfg.b = v; paint(); } });
    var oSl = ui.slider({ label: 'Operational intensity of your kernel', min: 0, max: OIS.length - 1, value: cfg.o, format: function (v) { return oiLabel(OIS[v]) + ' ops/byte'; }, onInput: function (v) { cfg.o = v; paint(); } });
    host.appendChild(h('p', { html: MLS.rich('The slanted line is what memory can feed. The flat line is what the arithmetic units can do. A kernel can reach whichever is lower. Both axes are logarithmic, so each gridline is ten times the last.') }));
    host.appendChild(h('div.controls', pSl.el, bSl.el, oSl.el));
    host.appendChild(chartHost);
    host.appendChild(h('div.readout', statRidge.el, statAtt.el, statPct.el, statBound.el));
    host.appendChild(message.el);
    host.appendChild(note(opts.footnote || 'Toy machine for teaching. The two named kernels use our own operation and byte counts (vector add: 1 operation per 12 bytes of 32-bit values, tiled matrix multiply: an operational intensity of 32 is typical of a good tile). They are not measurements.'));
    paint();
  };
})();
