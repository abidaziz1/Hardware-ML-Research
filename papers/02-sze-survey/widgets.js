/*
 * Widgets for Paper 2 (Sze et al. survey): im2col, sparsitySim, compactConv, peakTops.
 * All of them are teaching models built on our own arithmetic, not results from the paper.
 * The shared convShape, convWindow and hierEnergy widgets live in assets/js/widgets-hw.js.
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

  /* ======================================================================
   * 1. im2col: a convolution rewritten as a matrix multiply, and the data it copies
   * ==================================================================== */
  MLS.widgets.im2col = function (host) {
    var cfg = { n: 4, r: 2, pick: 0 };
    var inHost = h('div.cwcol');
    var mHost = h('div.cwcol');
    var fHost = h('div.cwcol');
    var pickSlider;
    var statIn = ui.stat('Values in the image', '');
    var statMat = ui.stat('Values in the matrix', '');
    var statDup = ui.stat('Copies per value', 'x on average');
    var message = ui.msg('');

    function e() {
      return cfg.n - cfg.r + 1;
    }
    function gridEl(rows, cols, cellFn, label) {
      var g = h('div.cgrid', { role: 'img', 'aria-label': label, style: { gridTemplateColumns: 'repeat(' + cols + ', minmax(0, 1fr))' } });
      for (var y = 0; y < rows; y++) {
        for (var x = 0; x < cols; x++) {
          var info = cellFn(y, x);
          g.appendChild(h('div.cell' + (info.cls ? '.' + info.cls : ''), String(info.text)));
        }
      }
      return g;
    }
    function paint() {
      var E = e();
      var rows = E * E;
      var cols = cfg.r * cfg.r;
      if (cfg.pick > rows - 1) cfg.pick = rows - 1;
      pickSlider.setMax(rows - 1);
      pickSlider.set(cfg.pick);
      var py = Math.floor(cfg.pick / E);
      var px = cfg.pick % E;

      inHost.innerHTML = '';
      inHost.appendChild(h('div.cwlab', 'Image ' + cfg.n + ' x ' + cfg.n));
      inHost.appendChild(
        gridEl(cfg.n, cfg.n, function (y, x) {
          var inWin = y >= py && y < py + cfg.r && x >= px && x < px + cfg.r;
          return { text: y * cfg.n + x + 1, cls: inWin ? 'win' : '' };
        }, 'The image, with the window of the chosen row marked')
      );
      mHost.innerHTML = '';
      mHost.appendChild(h('div.cwlab', 'Matrix ' + rows + ' x ' + cols + ' (one row per window)'));
      mHost.appendChild(
        gridEl(rows, cols, function (row, col) {
          var oy = Math.floor(row / E);
          var ox = row % E;
          var i = Math.floor(col / cfg.r);
          var j = col % cfg.r;
          return { text: (oy + i) * cfg.n + (ox + j) + 1, cls: row === cfg.pick ? 'win' : '' };
        }, 'The matrix whose rows are the flattened windows')
      );
      fHost.innerHTML = '';
      fHost.appendChild(h('div.cwlab', 'Filter ' + cols + ' x 1'));
      fHost.appendChild(
        gridEl(cols, 1, function (row) {
          return { text: 'w' + (row + 1), cls: 'cur' };
        }, 'The filter flattened into a column')
      );
      var total = rows * cols;
      statIn.set(String(cfg.n * cfg.n));
      statMat.set(String(total), 'warn');
      statDup.set(fmt(total / (cfg.n * cfg.n), 2), total / (cfg.n * cfg.n) > 2 ? 'bad' : '');
      message.set('The convolution is now **matrix x column**: ' + rows + ' x ' + cols + ' times ' + cols + ' x 1. The price is copying. Image value 7 (say) appears in every row whose window covers it. The matrix holds **' + total + '** numbers for an image of **' + cfg.n * cfg.n + '**.');
    }

    pickSlider = ui.slider({ label: 'Chosen window (matrix row)', min: 0, max: 8, value: 0, format: function (v) { return v + 1; }, onInput: function (v) { cfg.pick = v; paint(); } });
    var nSlider = ui.slider({ label: 'Image size', min: 3, max: 5, value: cfg.n, onInput: function (v) { cfg.n = v; cfg.pick = 0; paint(); } });
    var rSeg = ui.seg([{ label: '2 x 2 filter', value: 2 }, { label: '3 x 3 filter', value: 3 }], cfg.r, function (v) { cfg.r = v; cfg.pick = 0; paint(); }, 'Filter size');

    host.appendChild(h('p', { html: MLS.rich('To use a fast matrix-multiply routine, lay each filter window out as one row. The numbers in the cells are the image values, so you can see which ones get copied.') }));
    host.appendChild(h('div.controls', rSeg.el, nSlider.el, pickSlider.el));
    host.appendChild(h('div.cwrow', inHost, mHost, fHost));
    host.appendChild(h('div.readout', statIn.el, statMat.el, statDup.el));
    host.appendChild(message.el);
    host.appendChild(note('One channel and one filter, stride 1, no padding. With a 3 x 3 filter on a large image each value is copied close to 9 times.'));
    paint();
  };

  /* ======================================================================
   * 2. sparsitySim: zeros in weights and activations
   * ==================================================================== */
  MLS.widgets.sparsitySim = function (host) {
    var cfg = { sw: 50, sa: 40, bits: 8, idx: 4 };
    var statMacs = ui.stat('MACs with two non-zero inputs', '');
    var statSpeed = ui.stat('Speed-up if you skip the rest', 'x');
    var statGate = ui.stat('Energy of the multiplies if you only gate', '');
    var statStore = ui.stat('Weight storage vs dense', '');
    var message = ui.msg('');
    function paint() {
      var keep = (1 - cfg.sw / 100) * (1 - cfg.sa / 100);
      statMacs.set(fmt(keep * 100, 1) + '%', keep < 0.5 ? 'good' : '');
      statSpeed.set(fmt(1 / keep, 1) + 'x', 'good');
      statGate.set(fmt(keep * 100, 1) + '%');
      var store = (1 - cfg.sw / 100) * ((cfg.bits + cfg.idx) / cfg.bits);
      statStore.set(fmt(store * 100, 0) + '%', store > 1 ? 'bad' : 'good');
      var breakEven = (1 - cfg.bits / (cfg.bits + cfg.idx)) * 100;
      var text = 'With **' + cfg.sw + '%** zero weights and **' + cfg.sa + '%** zero activations, only about **' + fmt(keep * 100, 1) + '%** of the MACs have two non-zero inputs (assuming zeros fall independently). A design that **skips** zeros could finish in ' + fmt(keep * 100, 1) + '% of the time. A design that only **gates** (the multiplier does nothing for a zero) saves that share of multiply energy but not time.';
      text += ' Storing non-zero weights with a ' + cfg.idx + '-bit index costs ' + fmt(store * 100, 0) + '% of the dense storage. Below **' + fmt(breakEven, 0) + '%** zero weights the compressed format is bigger.';
      message.set(text, store > 1 ? 'warn' : '');
    }
    var sw = ui.slider({ label: 'Weights that are zero', min: 0, max: 95, step: 5, value: cfg.sw, format: function (v) { return v + '%'; }, onInput: function (v) { cfg.sw = v; paint(); } });
    var sa = ui.slider({ label: 'Activations that are zero', min: 0, max: 95, step: 5, value: cfg.sa, format: function (v) { return v + '%'; }, onInput: function (v) { cfg.sa = v; paint(); } });
    var bits = ui.seg([{ label: '8-bit weights', value: 8 }, { label: '16-bit weights', value: 16 }], cfg.bits, function (v) { cfg.bits = v; paint(); }, 'Weight width');
    var idx = ui.seg([{ label: '4-bit index', value: 4 }, { label: '8-bit index', value: 8 }], cfg.idx, function (v) { cfg.idx = v; paint(); }, 'Index width');
    host.appendChild(h('p', { html: MLS.rich('A multiply by zero is wasted work. Move the sliders to see how much work and storage you could save, and what the bookkeeping costs.') }));
    host.appendChild(h('div.controls', sw.el, sa.el));
    host.appendChild(h('div.controls', bits.el, idx.el));
    host.appendChild(h('div.readout', statMacs.el, statSpeed.el, statGate.el, statStore.el));
    host.appendChild(message.el);
    host.appendChild(note('Toy model. It assumes zero weights and zero activations are independent, which real networks may not satisfy, and it ignores the energy of the index logic. The sparsity levels are the sliders you set, not measurements of any network.'));
    paint();
  };

  /* ======================================================================
   * 3. compactConv: standard convolution against depthwise plus pointwise
   * ==================================================================== */
  MLS.widgets.compactConv = function (host) {
    var LISTS = { c: [16, 32, 64, 128, 256, 512], m: [16, 32, 64, 128, 256, 512], r: [3, 5, 7], h: [14, 28, 56, 112] };
    var cfg = { c: 128, m: 128, r: 3, h: 28 };
    var statStd = ui.stat('Standard layer MACs', '');
    var statDw = ui.stat('Depthwise + pointwise MACs', '');
    var statRed = ui.stat('Fewer MACs', 'x');
    var statW = ui.stat('Fewer weights', 'x');
    var message = ui.msg('');
    function paint() {
      var area = cfg.h * cfg.h;
      var std = area * cfg.c * cfg.m * cfg.r * cfg.r;
      var dw = area * cfg.c * cfg.r * cfg.r;
      var pw = area * cfg.c * cfg.m;
      var wStd = cfg.c * cfg.m * cfg.r * cfg.r;
      var wDw = cfg.c * cfg.r * cfg.r + cfg.c * cfg.m;
      statStd.set(hw.count(std));
      statDw.set(hw.count(dw + pw), 'good');
      statRed.set(fmt(std / (dw + pw), 1), 'good');
      statW.set(fmt(wStd / wDw, 1), 'good');
      message.set('The standard layer mixes channels and space in one step: **' + hw.count(std) + '** MACs. Splitting it into a per-channel spatial filter (depthwise, ' + hw.count(dw) + ' MACs) and a 1 x 1 channel mixer (pointwise, ' + hw.count(pw) + ' MACs) needs the fraction **1/M + 1/(R x R) = ' + fmt(1 / cfg.m + 1 / (cfg.r * cfg.r), 3) + '** of the MACs.');
    }
    function slider(key, label) {
      return ui.slider({ label: label, min: 0, max: LISTS[key].length - 1, value: LISTS[key].indexOf(cfg[key]), format: function (v) { return LISTS[key][v]; }, onInput: function (v) { cfg[key] = LISTS[key][v]; paint(); } });
    }
    host.appendChild(h('p', { html: MLS.rich('A standard convolution combines every input channel for every output channel at every position. A **depthwise separable** layer does the spatial part per channel, then mixes channels with 1 x 1 filters. Compare the cost.') }));
    host.appendChild(h('div.controls', slider('c', 'Input channels C').el, slider('m', 'Output channels M').el, slider('r', 'Filter size R x R').el, slider('h', 'Feature map size H x H').el));
    host.appendChild(h('div.readout', statStd.el, statDw.el, statRed.el, statW.el));
    host.appendChild(message.el);
    host.appendChild(note('Our arithmetic with stride 1 and "same" padding. It counts MACs and weights only. It says nothing about accuracy, and depthwise layers can use hardware less efficiently because they reuse each weight over fewer channels.'));
    paint();
  };

  /* ======================================================================
   * 4. peakTops: what the peak number means, and how conventions change it
   * ==================================================================== */
  MLS.widgets.peakTops = function (host) {
    var PES = [64, 168, 256, 1024, 4096, 16384, 65536];
    var CLK = [100, 200, 500, 700, 1000, 1500];
    var cfg = { pe: 4, clk: 3, ops: 2, util: 100 };
    var statPeak = ui.stat('Peak', '');
    var statAch = ui.stat('Achieved at this utilization', '');
    var message = ui.msg('');
    function paint() {
      var pes = PES[cfg.pe];
      var clk = CLK[cfg.clk] * 1e6;
      var peak = pes * clk * cfg.ops;
      var ach = peak * (cfg.util / 100);
      statPeak.set(hw.si(peak, 'OPS'), 'warn');
      statAch.set(hw.si(ach, 'OPS'), cfg.util < 50 ? 'bad' : 'good');
      message.set(
        'Peak = number of MAC units x clock x operations per MAC = ' + hw.int(pes) + ' x ' + CLK[cfg.clk] + ' MHz x ' + cfg.ops + ' = **' + hw.si(peak, 'OPS') + '**. At **' + cfg.util + '%** utilization the chip delivers **' + hw.si(ach, 'OPS') + '**. Switching the convention between 1 and 2 operations per MAC doubles or halves the headline without changing the chip.'
      );
    }
    var pe = ui.slider({ label: 'MAC units (PEs)', min: 0, max: PES.length - 1, value: cfg.pe, format: function (v) { return hw.int(PES[v]); }, onInput: function (v) { cfg.pe = v; paint(); } });
    var clk = ui.slider({ label: 'Clock', min: 0, max: CLK.length - 1, value: cfg.clk, format: function (v) { return CLK[v] + ' MHz'; }, onInput: function (v) { cfg.clk = v; paint(); } });
    var util = ui.slider({ label: 'Utilization', min: 5, max: 100, step: 5, value: cfg.util, format: function (v) { return v + '%'; }, onInput: function (v) { cfg.util = v; paint(); } });
    var ops = ui.seg([{ label: '1 operation per MAC', value: 1 }, { label: '2 operations per MAC', value: 2 }], cfg.ops, function (v) { cfg.ops = v; paint(); }, 'Counting convention');
    host.appendChild(h('p', { html: MLS.rich('Peak throughput is arithmetic: units times clock times operations per unit per cycle. Try 65,536 units at 700 MHz.') }));
    host.appendChild(h('div.controls', pe.el, clk.el, util.el));
    host.appendChild(h('div.controls', ops.el));
    host.appendChild(h('div.readout', statPeak.el, statAch.el));
    host.appendChild(message.el);
    host.appendChild(note('Toy calculator. Chip sizes and clocks here are examples, not a specific product. The 65,536-unit, 700 MHz setting matches the figures Paper 5 reports for the first TPU.'));
    paint();
  };
})();
