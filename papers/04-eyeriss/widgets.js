/*
 * Widgets for Paper 4 (Eyeriss): rsPrimitive, rsPESet, foldingLab, reuseProfile.
 * Each one does exact counting on a small, fully specified example. None of them is a copy of the
 * paper's energy model. The lesson labels each as an original diagram or calculator.
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
  function gridEl(rows, cols, cellFn, label, extra) {
    var g = h('div.cgrid' + (extra ? '.' + extra : ''), { role: 'img', 'aria-label': label, style: { gridTemplateColumns: 'repeat(' + cols + ', minmax(0, 1fr))' } });
    for (var y = 0; y < rows; y++) {
      for (var x = 0; x < cols; x++) {
        var info = cellFn(y, x);
        g.appendChild(h('div.cell' + (info.cls ? '.' + info.cls : ''), info.text === undefined ? '' : String(info.text)));
      }
    }
    return g;
  }

  /* The five AlexNet convolution layers and the first fully connected layer, with the shapes the
     Eyeriss paper uses (H is the padded input size). Verified in experiments/numbers.cjs. */
  var LAYERS = {
    conv1: { label: 'CONV1', n: 1, c: 3, m: 96, h: 227, r: 11, u: 4, e: 55 },
    conv2: { label: 'CONV2', n: 1, c: 48, m: 256, h: 31, r: 5, u: 1, e: 27 },
    conv3: { label: 'CONV3', n: 1, c: 256, m: 384, h: 15, r: 3, u: 1, e: 13 },
    conv4: { label: 'CONV4', n: 1, c: 192, m: 384, h: 15, r: 3, u: 1, e: 13 },
    conv5: { label: 'CONV5', n: 1, c: 192, m: 256, h: 15, r: 3, u: 1, e: 13 },
    fc6: { label: 'FC6', n: 1, c: 256, m: 4096, h: 6, r: 6, u: 1, e: 1 }
  };
  hw.eyerissLayers = LAYERS;
  function reuse(L, batch) {
    var win = Math.min((L.r * L.r) / (L.u * L.u), L.e * L.e);
    return { weight: batch * L.e * L.e, ifmap: L.m * win, psum: L.c * L.r * L.r };
  }
  hw.eyerissReuse = reuse;

  /* ======================================================================
   * 1. rsPrimitive: a 1D convolution inside one PE
   * ==================================================================== */
  MLS.widgets.rsPrimitive = function (host) {
    var cfg = { r: 3, w: 7, t: 0 };
    var COST = hw.levelCost;
    var rowsHost = h('div.cwrow');
    var tSlider;
    var message = ui.msg('');
    var statMac = ui.stat('MACs done', '');
    var statBuf = ui.stat('Buffer accesses', '');
    var statRf = ui.stat('Register file accesses', '');
    var statE = ui.stat('Energy, row stationary PE', 'x one MAC');
    var statN = ui.stat('Energy, no local storage', 'x one MAC');
    var statRatio = ui.stat('Saving so far', '');

    function events() {
      var F = cfg.w - cfg.r + 1;
      var list = [];
      for (var j = 0; j < F; j++) for (var i = 0; i < cfg.r; i++) list.push({ j: j, i: i, k: j + i });
      return list;
    }
    function paint() {
      var F = cfg.w - cfg.r + 1;
      var ev = events();
      var total = ev.length;
      if (cfg.t > total) cfg.t = total;
      tSlider.setMax(total);
      tSlider.set(cfg.t);
      var t = cfg.t;
      var done = ev.slice(0, t);
      var cur = t > 0 ? ev[t - 1] : null;
      var fetchedX = t === 0 ? 0 : cur.k + 1;
      var fetchedW = t === 0 ? 0 : cfg.r;
      var finished = Math.floor(t / cfg.r);
      var bufReads = fetchedW + fetchedX;
      var bufAcc = bufReads + finished;
      var rfAcc = 4 * t;
      var eRs = t * 1 + rfAcc * COST.rf + bufAcc * COST.buf;
      var eNlr = t * (1 + 4 * COST.buf);

      rowsHost.innerHTML = '';
      var wCol = h('div.cwcol', h('div.cwlab', 'Filter row (' + cfg.r + ' weights)'));
      wCol.appendChild(gridEl(1, cfg.r, function (y, x) {
        return { text: 'w' + x, cls: t === 0 ? '' : cur && cur.i === x ? 'cur' : 'done' };
      }, 'The filter row held in the register file'));
      var xCol = h('div.cwcol', h('div.cwlab', 'Input row (' + cfg.w + ' values)'));
      xCol.appendChild(gridEl(1, cfg.w, function (y, x) {
        var inWin = cur && x >= cur.j && x < cur.j + cfg.r;
        var cls = '';
        if (x < fetchedX) cls = 'done';
        if (inWin) cls = 'win';
        if (cur && cur.k === x) cls = 'cur';
        return { text: 'x' + x, cls: cls };
      }, 'The input row. Green values have been fetched into the register file.'));
      var pCol = h('div.cwcol', h('div.cwlab', 'Output row (' + F + ' values)'));
      pCol.appendChild(gridEl(1, F, function (y, x) {
        var cls = '';
        if (x < finished) cls = 'done';
        else if (cur && cur.j === x) cls = 'cur';
        return { text: 'o' + x, cls: cls };
      }, 'The output row. Green values are finished and written to the buffer.'));
      rowsHost.appendChild(wCol);
      rowsHost.appendChild(xCol);
      rowsHost.appendChild(pCol);

      statMac.set(t + ' of ' + total);
      statBuf.set(String(bufAcc), 'good');
      statRf.set(String(rfAcc));
      statE.set(fmt(eRs, 0), 'good');
      statN.set(fmt(eNlr, 0), 'bad');
      statRatio.set(t > 0 ? fmt(eNlr / eRs, 1) + 'x' : '-', 'good');
      if (t === 0) message.set('Press **Next MAC** or drag the slider. The PE works out ' + F + ' outputs. Each one is ' + cfg.r + ' multiply-accumulates over a window of the input row.');
      else {
        var prevFetched = 0;
        for (var q = 0; q < t - 1; q++) prevFetched = Math.max(prevFetched, ev[q].k + 1);
        var arrived = fetchedX > prevFetched;
        var src = arrived ? 'The input value x' + cur.k + ' was just fetched from the buffer. ' : 'The input value x' + cur.k + ' was already in the register file. ';
        if (t === 1) src = 'The whole filter row and the input value x0 were fetched from the buffer. ';
        message.set('MAC ' + t + ': output o' + cur.j + ' += w' + cur.i + ' x x' + cur.k + '. ' + src + 'Every other operand and the running total come from the register file.');
      }
    }

    tSlider = ui.slider({ label: 'MAC number', min: 0, max: 15, value: 0, format: function (v) { return v; }, onInput: function (v) { cfg.t = v; paint(); } });
    var rSeg = ui.seg([{ label: 'Filter row of 2', value: 2 }, { label: '3', value: 3 }, { label: '4', value: 4 }, { label: '5', value: 5 }], cfg.r, function (v) { cfg.r = v; if (cfg.w < v + 1) cfg.w = v + 1; wSlider.set(cfg.w); wSlider.input.min = v + 1; cfg.t = 0; paint(); }, 'Filter row length');
    var wSlider = ui.slider({ label: 'Input row length', min: 4, max: 13, value: cfg.w, onInput: function (v) { cfg.w = Math.max(v, cfg.r + 1); cfg.t = 0; paint(); } });
    var back = ui.btn('Back', function () { cfg.t = Math.max(0, cfg.t - 1); paint(); });
    var next = ui.btn('Next MAC', function () { cfg.t = cfg.t + 1; paint(); }, 'primary');
    var all = ui.btn('Finish the row', function () { cfg.t = 999; paint(); });

    host.appendChild(h('p', { html: MLS.rich('One PE holds a **row of the filter** and a **row of the input** in its register file and slides one across the other. Step through it and watch how rarely it needs the global buffer.') }));
    host.appendChild(h('div.controls', rSeg.el, wSlider.el));
    host.appendChild(h('div.btnrow', back, next, all));
    host.appendChild(rowsHost);
    host.appendChild(h('div.readout', statMac.el, statBuf.el, statRf.el, statE.el, statN.el, statRatio.el));
    host.appendChild(message.el);
    host.appendChild(note('Exact counting for one PE. Each MAC does 3 register file reads and 1 write. Costs relative to one MAC: register file 1, global buffer 6. "No local storage" sends all 4 accesses of every MAC to the buffer. The count ignores DRAM and the movement of data between PEs, so it shows the effect inside one PE and not the paper\'s whole-array energy.'));
    paint();
  };

  /* ======================================================================
   * 2. rsPESet: which PEs share which row
   *    Logical PE set: R rows (one per filter row) by E columns (one per output row).
   * ==================================================================== */
  MLS.widgets.rsPESet = function (host) {
    var cfg = { r: 3, e: 5, mode: 'filter', pick: 0 };
    var gridHost = h('div.cwcol');
    var pSlider;
    var statSet = ui.stat('PEs in the set (R x E)', '');
    var statShare = ui.stat('PEs sharing the chosen row', '');
    var statRows = ui.stat('Input rows needed (E + R - 1)', '');
    var message = ui.msg('');

    function rowOf(mode, r, e) {
      if (mode === 'filter') return r;
      if (mode === 'ifmap') return r + e;
      return e;
    }
    function maxRow(mode) {
      if (mode === 'filter') return cfg.r - 1;
      if (mode === 'ifmap') return cfg.e + cfg.r - 2;
      return cfg.e - 1;
    }
    function paint() {
      var mx = maxRow(cfg.mode);
      if (cfg.pick > mx) cfg.pick = mx;
      pSlider.setMax(mx);
      pSlider.set(cfg.pick);
      var share = 0;
      for (var r = 0; r < cfg.r; r++) for (var e = 0; e < cfg.e; e++) if (rowOf(cfg.mode, r, e) === cfg.pick) share++;
      gridHost.innerHTML = '';
      var prefix = cfg.mode === 'filter' ? 'f' : cfg.mode === 'ifmap' ? 'i' : 'p';
      gridHost.appendChild(h('div.cwlab', 'PE set: ' + cfg.r + ' rows x ' + cfg.e + ' columns'));
      gridHost.appendChild(gridEl(cfg.r, cfg.e, function (r, e) {
        var row = rowOf(cfg.mode, r, e);
        return { text: prefix + row, cls: row === cfg.pick ? 'win' : '' };
      }, 'The logical PE set. Each cell shows the row of ' + (cfg.mode === 'filter' ? 'filter weights' : cfg.mode === 'ifmap' ? 'input values' : 'partial sums') + ' that the PE handles.'));
      statSet.set(String(cfg.r * cfg.e));
      statShare.set(String(share), share > 1 ? 'good' : '');
      statRows.set(String(cfg.e + cfg.r - 1));
      var text;
      if (cfg.mode === 'filter') text = 'Filter row **' + cfg.pick + '** sits in **' + share + '** PEs, all in one row of the set. The same weights are reused **horizontally**: each PE applies them to a different input row.';
      else if (cfg.mode === 'ifmap') text = 'Input row **' + cfg.pick + '** is used by **' + share + '** PEs along a **diagonal**. The same input values are reused by different filter rows at different output rows.';
      else text = 'Output row **' + cfg.pick + '** is built by **' + share + '** PEs in one **column**. Each adds the result of its own filter row, and the partial sums pass **vertically** to the PE below, so they never visit the buffer between additions.';
      message.set(text, 'good');
    }
    pSlider = ui.slider({ label: 'Choose a row', min: 0, max: 7, value: 0, format: function (v) { return v; }, onInput: function (v) { cfg.pick = v; paint(); } });
    var mSeg = ui.seg([{ label: 'Filter rows', value: 'filter' }, { label: 'Input rows', value: 'ifmap' }, { label: 'Partial sum rows', value: 'psum' }], cfg.mode, function (v) { cfg.mode = v; cfg.pick = 0; paint(); }, 'Which data to show');
    var rSl = ui.slider({ label: 'Filter height R', min: 2, max: 5, value: cfg.r, onInput: function (v) { cfg.r = v; paint(); } });
    var eSl = ui.slider({ label: 'Output rows E', min: 3, max: 8, value: cfg.e, onInput: function (v) { cfg.e = v; paint(); } });

    host.appendChild(h('p', { html: MLS.rich('Row stationary gives each PE one row of the filter and one row of the input. PE (r, e) uses **filter row r** and **input row r + e** and produces a piece of **output row e**. Pick a row and see which PEs share it.') }));
    host.appendChild(h('div.controls', mSeg.el));
    host.appendChild(h('div.controls', rSl.el, eSl.el, pSlider.el));
    host.appendChild(h('div.cwrow', gridHost));
    host.appendChild(h('div.readout', statSet.el, statShare.el, statRows.el));
    host.appendChild(message.el);
    host.appendChild(note('Stride 1. This is the logical PE set for one input channel and one filter. A cell labeled f1 uses filter row 1, i3 uses input row 3, and p2 contributes to output row 2.'));
    paint();
  };

  /* ======================================================================
   * 3. foldingLab: fitting a logical PE set onto a physical array
   * ==================================================================== */
  MLS.widgets.foldingLab = function (host) {
    var PR = 12;
    var PC = 14;
    var cfg = { r: 11, e: 55, preset: 'conv1' };
    var PRE = { conv1: [11, 55], conv2: [5, 27], conv3: [3, 13] };
    var gridHost = h('div.cwcol');
    var rSl;
    var eSl;
    var statSet = ui.stat('Logical set (R x E)', 'PEs');
    var statStack = ui.stat('Sets stacked at once', '');
    var statPass = ui.stat('Passes across the width', '');
    var statUtil = ui.stat('Average PE utilization', '');
    var message = ui.msg('');
    var seg;

    function paint() {
      var stack = Math.max(1, Math.floor(PR / cfg.r));
      var rowsUsed = Math.min(PR, stack * cfg.r);
      var passes = Math.ceil(cfg.e / PC);
      var firstCols = Math.min(PC, cfg.e);
      var util = (stack * Math.min(cfg.r, PR) * cfg.e) / (PR * PC * passes);
      gridHost.innerHTML = '';
      gridHost.appendChild(h('div.cwlab', 'Physical array: ' + PR + ' x ' + PC + ' = ' + PR * PC + ' PEs (first pass)'));
      gridHost.appendChild(gridEl(PR, PC, function (y, x) {
        var used = y < rowsUsed && x < firstCols;
        var set = Math.floor(y / cfg.r);
        return { cls: used ? (set % 2 === 0 ? 'win' : 'done') : '' };
      }, 'The physical PE array. Colored cells hold a logical set in the first pass.', 'small'));
      statSet.set(cfg.r * cfg.e + '');
      statStack.set(String(stack), stack > 1 ? 'good' : '');
      statPass.set(String(passes), passes > 1 ? 'warn' : 'good');
      statUtil.set(fmt(util * 100, 1) + '%', util > 0.85 ? 'good' : 'warn');
      var parts = [];
      if (cfg.r > PR) parts.push('The filter has ' + cfg.r + ' rows but the array has only ' + PR + ', so the set would also need to fold vertically. This lab does not model that.');
      else {
        if (passes > 1) parts.push('The set is ' + cfg.e + ' columns wide and the array has ' + PC + ', so it **folds** into **' + passes + '** passes. The last pass uses ' + (cfg.e - PC * (passes - 1)) + ' columns.');
        else parts.push('The set fits across the width in one pass.');
        if (stack > 1) parts.push('Rows are left over, so **' + stack + '** copies of the set sit on top of each other and work on different channels or filters at the same time. That is **replication**.');
        else parts.push('Only one copy fits vertically.');
        var idle = PR - rowsUsed;
        if (idle > 0) parts.push(idle + ' row' + (idle > 1 ? 's' : '') + ' of the array stay idle.');
      }
      message.set(parts.join(' ') + ' Average utilization is **' + fmt(util * 100, 1) + '%**.');
    }

    rSl = ui.slider({ label: 'Filter height R (rows of the set)', min: 1, max: 12, value: cfg.r, onInput: function (v) { cfg.r = v; if (seg) seg.set('custom'); paint(); } });
    eSl = ui.slider({ label: 'Output height E (columns of the set)', min: 1, max: 60, value: cfg.e, onInput: function (v) { cfg.e = v; if (seg) seg.set('custom'); paint(); } });
    seg = ui.seg([{ label: 'AlexNet CONV1 (R=11, E=55)', value: 'conv1' }, { label: 'CONV2 (R=5, E=27)', value: 'conv2' }, { label: 'CONV3 to 5 (R=3, E=13)', value: 'conv3' }, { label: 'Your own', value: 'custom' }], cfg.preset, function (v) {
      if (v === 'custom') return;
      cfg.r = PRE[v][0];
      cfg.e = PRE[v][1];
      rSl.set(cfg.r);
      eSl.set(cfg.e);
      paint();
    }, 'Layer presets');

    host.appendChild(h('p', { html: MLS.rich('A layer\'s logical PE set (R rows by E columns) rarely matches the physical array (12 rows by 14 columns in the Eyeriss chip). **Folding** cuts a set that is too wide into passes. **Replication** stacks several sets when rows are left over.') }));
    host.appendChild(h('div.controls', seg.el));
    host.appendChild(h('div.controls', rSl.el, eSl.el));
    host.appendChild(h('div.cwrow', gridHost));
    host.appendChild(h('div.readout', statSet.el, statStack.el, statPass.el, statUtil.el));
    host.appendChild(message.el);
    host.appendChild(note('Our geometry for a 12 x 14 array. Utilization = PEs used divided by PEs available, averaged over the passes. It ignores the extra mappings the real chip uses for the channels, filters and batch. Compare the numbers with the utilization the Eyeriss papers report (reading task).'));
    paint();
  };

  /* ======================================================================
   * 4. reuseProfile: which kind of reuse a layer offers most
   * ==================================================================== */
  MLS.widgets.reuseProfile = function (host) {
    var BATCHES = [1, 4, 16, 64];
    var cfg = { layer: 'conv1', bi: 0 };
    var bars = {
      weight: ui.meterRow('Weight reuse'),
      ifmap: ui.meterRow('Input reuse'),
      psum: ui.meterRow('Accumulations')
    };
    var message = ui.msg('');
    var LO = 0;
    var HI = Math.log10(2000000);
    function frac(v) { return MLS.clamp((Math.log10(Math.max(1, v)) - LO) / (HI - LO), 0.01, 1); }
    function paint() {
      var L = LAYERS[cfg.layer];
      var batch = BATCHES[cfg.bi];
      var r = reuse(L, batch);
      bars.weight.set(frac(r.weight), hw.int(r.weight), 'var(--accent)');
      bars.ifmap.set(frac(r.ifmap), hw.int(r.ifmap), 'var(--grad)');
      bars.psum.set(frac(r.psum), hw.int(r.psum), 'var(--purple)');
      var items = [['weight reuse', r.weight], ['input reuse', r.ifmap], ['partial sum accumulation', r.psum]];
      items.sort(function (a, b) { return b[1] - a[1]; });
      var low = items[2];
      message.set('For **' + L.label + '** at batch **' + batch + '** the biggest opportunity is **' + items[0][0] + '** (' + hw.int(items[0][1]) + ') and the smallest is **' + low[0] + '** (' + hw.int(low[1]) + '). A dataflow that exploits only one kind of reuse leaves the other two to the expensive memories. A different layer reverses the order, so the best fixed choice changes with the layer.');
    }
    var seg = ui.seg(Object.keys(LAYERS).map(function (k) { return { label: LAYERS[k].label, value: k }; }), cfg.layer, function (v) { cfg.layer = v; paint(); }, 'Layer');
    var bSl = ui.slider({ label: 'Batch N', min: 0, max: BATCHES.length - 1, value: 0, format: function (v) { return BATCHES[v]; }, onInput: function (v) { cfg.bi = v; paint(); } });
    host.appendChild(h('p', { html: MLS.rich('Every layer offers three kinds of reuse in different amounts. The bars are on a log scale. Pick a layer and a batch size.') }));
    host.appendChild(h('div.controls', seg.el));
    host.appendChild(h('div.controls', bSl.el));
    host.appendChild(h('div.meters', bars.weight.el, bars.ifmap.el, bars.psum.el));
    host.appendChild(message.el);
    host.appendChild(note('Weight reuse = N x E x E. Input reuse = M x min(R x R / U squared, E x E). Accumulations per output = C x R x R. Layer shapes are AlexNet\'s as the Eyeriss paper lists them (H is the padded input size). FC6 is treated as a convolution with a 6 x 6 filter on a 6 x 6 input.'));
    paint();
  };
})();
