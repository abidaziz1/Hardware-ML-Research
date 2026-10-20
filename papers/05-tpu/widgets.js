/*
 * Widgets for Paper 5 (TPU): systolic, tileBalance, batchLatency, tpuRoofline.
 * systolic is an exact cycle-by-cycle simulation of a small weight-stationary array. The others are
 * our arithmetic or toy models. The lesson labels each one. They are not results from the paper.
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

  /* The first TPU's numbers, as used across this lesson. See VERIFY.md for what was confirmed. */
  var TPU = { macs: 65536, side: 256, clockHz: 700e6, bwBps: 34e9 };
  TPU.peakOps = TPU.macs * TPU.clockHz * 2;
  TPU.ridgeMacs = (TPU.macs * TPU.clockHz) / TPU.bwBps;
  hw.tpu = TPU;

  /* ======================================================================
   * 1. systolic: a weight-stationary array, simulated cycle by cycle
   *    PE (i, j) holds W[i][j]. Input vector t enters row i at cycle t + i, moves right one PE per
   *    cycle, and partial sums move down one PE per cycle. PE (i, j) works on vector t = c - i - j.
   * ==================================================================== */
  MLS.widgets.systolic = function (host) {
    var cfg = { n: 3, t: 3, c: 0 };
    function Wt(i, j) { return ((i * 2 + j * 3) % 4) + 1; }
    function X(t, i) { return ((t * 3 + i * 2) % 5) + 1; }

    /* Register-level simulation. Each PE passes its input right and adds a product to the sum from
       above. A value of null means no data is in that register this cycle. */
    function simulate(n, T) {
      var tot = T + 2 * n - 2;
      var xr = [];
      var pr = [];
      var i;
      var j;
      for (i = 0; i < n; i++) {
        xr.push([]);
        pr.push([]);
        for (j = 0; j < n; j++) {
          xr[i].push(null);
          pr[i].push(null);
        }
      }
      var snaps = [];
      var out = [];
      for (var t = 0; t < T; t++) {
        out.push([]);
        for (j = 0; j < n; j++) out[t].push(null);
      }
      for (var c = 0; c < tot; c++) {
        var nx = [];
        var np = [];
        var act = [];
        for (i = 0; i < n; i++) {
          nx.push([]);
          np.push([]);
          act.push([]);
          for (j = 0; j < n; j++) {
            var xin = j === 0 ? (c - i >= 0 && c - i < T ? X(c - i, i) : null) : xr[i][j - 1];
            var pin = i === 0 ? 0 : pr[i - 1][j];
            if (xin === null) {
              nx[i].push(null);
              np[i].push(null);
              act[i].push(null);
            } else {
              var pout = (pin === null ? 0 : pin) + Wt(i, j) * xin;
              nx[i].push(xin);
              np[i].push(pout);
              act[i].push({ x: xin, w: Wt(i, j), t: c - i - j, p: pout });
              if (i === n - 1) out[c - i - j][j] = pout;
            }
          }
        }
        xr = nx;
        pr = np;
        snaps.push({ act: act, out: out.map(function (r) { return r.slice(); }) });
      }
      var ok = true;
      for (var tt = 0; tt < T; tt++) {
        for (j = 0; j < n; j++) {
          var want = 0;
          for (var k = 0; k < n; k++) want += Wt(k, j) * X(tt, k);
          if (out[tt][j] !== want) ok = false;
        }
      }
      return { snaps: snaps, ok: ok, tot: tot };
    }

    var wHost = h('div.cwcol');
    var pHost = h('div.cwcol');
    var oHost = h('div.cwcol');
    var xHost = h('div.cwcol');
    var cSlider;
    var message = ui.msg('');
    var statC = ui.stat('Cycle', '');
    var statActive = ui.stat('PEs busy this cycle', '');
    var statDone = ui.stat('MACs done so far', '');
    var statUtil = ui.stat('Utilization so far', '');
    var statTotal = ui.stat('Cycles for the whole job', '');

    function paint() {
      var n = cfg.n;
      var T = cfg.t;
      var sim = simulate(n, T);
      var tot = sim.tot;
      if (cfg.c > tot - 1) cfg.c = tot - 1;
      cSlider.setMax(tot - 1);
      cSlider.set(cfg.c);
      var c = cfg.c;
      var busy = 0;
      var done = 0;
      for (var cc = 0; cc <= c; cc++) {
        for (var i = 0; i < n; i++) for (var j = 0; j < n; j++) {
          if (sim.snaps[cc].act[i][j]) {
            done++;
            if (cc === c) busy++;
          }
        }
      }
      var snap = sim.snaps[c];
      wHost.innerHTML = '';
      wHost.appendChild(h('div.cwlab', 'Weights, held in the PEs'));
      wHost.appendChild(gridEl(n, n, function (i, j) { return { text: Wt(i, j), cls: 'done' }; }, 'The weight each PE holds', 'wide'));
      xHost.innerHTML = '';
      xHost.appendChild(h('div.cwlab', 'Input vectors (row i enters i cycles late)'));
      xHost.appendChild(gridEl(T, n, function (t, i) {
        var entering = c - i === t;
        return { text: X(t, i), cls: entering ? 'cur' : c - i > t ? 'done' : '' };
      }, 'The input vectors, one per row. The marked value enters this cycle.', 'wide'));
      pHost.innerHTML = '';
      pHost.appendChild(h('div.cwlab', 'This cycle: input x weight in each PE'));
      pHost.appendChild(gridEl(n, n, function (i, j) {
        var a = snap.act[i][j];
        if (a) return { text: a.x + 'x' + a.w, cls: 'win' };
        return { text: '', cls: '' };
      }, 'The product each busy PE computes this cycle', 'wide'));
      oHost.innerHTML = '';
      oHost.appendChild(h('div.cwlab', 'Results leaving the bottom'));
      oHost.appendChild(gridEl(T, n, function (t, j) {
        var v = snap.out[t][j];
        var fresh = snap.act[n - 1][j] && snap.act[n - 1][j].t === t;
        return { text: v === null ? '' : v, cls: v === null ? '' : fresh ? 'cur' : 'done' };
      }, 'Finished output values', 'wide'));

      statC.set(c + 1 + ' of ' + tot);
      statActive.set(busy + ' of ' + n * n, busy === n * n ? 'good' : 'warn');
      statDone.set(String(done));
      statUtil.set(fmt((done / (n * n * (c + 1))) * 100, 0) + '%', done / (n * n * (c + 1)) > 0.7 ? 'good' : 'warn');
      statTotal.set(tot + ' (' + fmt((T / tot) * 100, 0) + '% busy)');
      var text;
      if (busy === 0) text = 'Cycle ' + (c + 1) + ': no PE has work yet. The first input value is still on its way.';
      else if (busy === n * n) text = 'Cycle ' + (c + 1) + ': **every** PE is busy. The array is full, and each cycle produces a new set of ' + n + ' results.';
      else text = 'Cycle ' + (c + 1) + ': **' + busy + '** of ' + n * n + ' PEs are busy. Inputs enter one cycle later for each row down, so the work starts as a diagonal wave and ends as one.';
      if (c === tot - 1) text += sim.ok ? ' All ' + T * n + ' outputs match the plain matrix product, which the simulation checked.' : ' The simulation found a mismatch with the plain matrix product.';
      message.set(text);
    }

    cSlider = ui.slider({ label: 'Cycle', min: 0, max: 6, value: 0, format: function (v) { return v + 1; }, onInput: function (v) { cfg.c = v; paint(); } });
    var nSeg = ui.seg([{ label: '2 x 2 array', value: 2 }, { label: '3 x 3', value: 3 }, { label: '4 x 4', value: 4 }], cfg.n, function (v) { cfg.n = v; cfg.c = 0; paint(); }, 'Array size');
    var tSl = ui.slider({ label: 'Input vectors', min: 1, max: 8, value: cfg.t, onInput: function (v) { cfg.t = v; cfg.c = 0; paint(); } });
    var back = ui.btn('Back', function () { cfg.c = Math.max(0, cfg.c - 1); paint(); });
    var next = ui.btn('Next cycle', function () { cfg.c = cfg.c + 1; paint(); }, 'primary');
    var last = ui.btn('Jump to the end', function () { cfg.c = 99; paint(); });

    host.appendChild(h('p', { html: MLS.rich('The weights sit in the PEs and never move. Each input vector enters from the left, one cycle later for each row down, and slides right. Each PE multiplies its weight by the value passing through and adds the result to the partial sum coming from above. Step through the cycles.') }));
    host.appendChild(h('div.controls', nSeg.el, tSl.el, cSlider.el));
    host.appendChild(h('div.btnrow', back, next, last));
    host.appendChild(h('div.cwrow', wHost, xHost));
    host.appendChild(h('div.cwrow', pHost, oHost));
    host.appendChild(h('div.readout', statC.el, statActive.el, statDone.el, statUtil.el, statTotal.el));
    host.appendChild(message.el);
    host.appendChild(note('Exact register-level simulation of an N x N weight-stationary array. A job of T vectors takes T + 2N - 2 cycles, and the array is full only in the middle. The simulation compares every output with the plain matrix product. The real TPU matrix unit is 256 x 256 and overlaps successive jobs, so this shows the principle and not its exact timing.'));
    paint();
  };

  /* ======================================================================
   * 2. tileBalance: loading a weight tile against using it
   * ==================================================================== */
  MLS.widgets.tileBalance = function (host) {
    var VECS = [1, 4, 16, 64, 200, 675, 1350, 3136, 10000];
    var cfg = { v: 4 };
    var statLoad = ui.stat('Time to load one weight tile', '');
    var statCompute = ui.stat('Time to use it', '');
    var statUtil = ui.stat('Matrix unit busy', '');
    var statTops = ui.stat('Achieved', 'TOPS');
    var message = ui.msg('');
    var bar = ui.meterRow('Matrix unit');
    var tileBytes = TPU.macs;
    var loadCycles = tileBytes / (TPU.bwBps / TPU.clockHz);

    function paint() {
      var v = VECS[cfg.v];
      var util = Math.min(1, v / loadCycles);
      var tops = (TPU.peakOps * util) / 1e12;
      statLoad.set(fmt((tileBytes / TPU.bwBps) * 1e6, 2) + ' us (' + hw.int(loadCycles) + ' cycles)');
      statCompute.set(fmt((v / TPU.clockHz) * 1e6, v < 100 ? 3 : 2) + ' us (' + hw.int(v) + ' cycles)');
      statUtil.set(fmt(util * 100, util < 0.01 ? 2 : util < 0.1 ? 1 : 0) + '%', util > 0.9 ? 'good' : util < 0.3 ? 'bad' : 'warn');
      statTops.set(fmt(tops, tops < 10 ? 1 : 0), util > 0.9 ? 'good' : 'warn');
      bar.set(util, fmt(util * 100, util < 0.01 ? 2 : util < 0.1 ? 1 : 0) + '%', util > 0.9 ? 'var(--good)' : 'var(--warn)');
      var text;
      if (util >= 1) text = 'Each weight tile is used for **' + hw.int(v) + '** vectors, longer than the ' + hw.int(loadCycles) + ' cycles it takes to fetch the next tile, so the fetch hides behind the computation and the matrix unit stays full.';
      else text = 'Each weight tile is used for only **' + hw.int(v) + '** vectors, but fetching the next tile takes **' + hw.int(loadCycles) + '** cycles. The matrix unit waits for weights and is busy **' + fmt(util * 100, util < 0.1 ? 1 : 0) + '%** of the time.';
      message.set(text, util >= 1 ? 'good' : 'warn');
    }
    var vSl = ui.slider({ label: 'Input vectors that use each weight tile', min: 0, max: VECS.length - 1, value: cfg.v, format: function (v) { return hw.int(VECS[v]); }, onInput: function (v) { cfg.v = v; paint(); } });
    var presets = ui.seg([{ label: 'FC layer, batch 1', value: 0 }, { label: 'FC layer, batch 200', value: 4 }, { label: 'FC layer, batch 1,350', value: 6 }, { label: 'CONV layer, 56 x 56 map, batch 1', value: 7 }], cfg.v, function (v) { cfg.v = v; vSl.set(v); paint(); }, 'Examples');

    host.appendChild(h('p', { html: MLS.rich('The matrix unit multiplies one 256 x 256 tile of 8-bit weights by input vectors, one vector per cycle. The next tile arrives from DRAM while it works. If the fetch takes longer than the computation, the unit waits. How many vectors share each tile decides which.') }));
    host.appendChild(h('div.controls', presets.el));
    host.appendChild(h('div.controls', vSl.el));
    host.appendChild(h('div.readout', statLoad.el, statCompute.el, statUtil.el, statTops.el));
    host.appendChild(h('div.meters', bar.el));
    host.appendChild(message.el);
    host.appendChild(note('Our arithmetic with the first TPU\'s figures as this lesson uses them: 65,536 weight bytes per tile, 34 GB/s of weight bandwidth, 700 MHz, 65,536 MACs per cycle. It assumes the next tile loads while the current one is used and ignores everything else. A fully connected layer uses each tile for as many vectors as the batch. A convolution uses it for every output position.'));
    paint();
  };

  /* ======================================================================
   * 3. batchLatency: throughput against a 99th-percentile limit
   * ==================================================================== */
  MLS.widgets.batchLatency = function (host) {
    var BATCHES = [1, 4, 16, 64, 128, 200, 300, 500, 800, 1000];
    var cfg = { b: 2, limit: 7 };
    var A = 2;
    var B = 0.01;
    var DEVICES = [
      { id: 'var', label: 'Variable-latency chip', tail: 1.75 },
      { id: 'det', label: 'Deterministic chip', tail: 1.0 }
    ];
    var cur = { id: 'det' };
    var statMean = ui.stat('Mean time for the batch', 'ms');
    var statTail = ui.stat('99th percentile', 'ms');
    var statTp = ui.stat('Throughput', 'per ms');
    var tableHost = h('div.tablewrap');
    var message = ui.msg('');

    function meanTime(b) { return A + B * b; }
    function paint() {
      var dev = DEVICES.filter(function (d) { return d.id === cur.id; })[0];
      var b = BATCHES[cfg.b];
      var mean = meanTime(b);
      var tail = mean * dev.tail;
      var ok = tail <= cfg.limit;
      statMean.set(fmt(mean, 2));
      statTail.set(fmt(tail, 2), ok ? 'good' : 'bad');
      statTp.set(fmt(b / mean, 1), ok ? 'good' : 'bad');
      var rows = DEVICES.map(function (d) {
        var maxMean = cfg.limit / d.tail;
        var maxB = Math.floor((maxMean - A) / B);
        if (maxB < 1) return h('tr', h('td', d.label), h('td', 'none'), h('td', '-'), h('td', '-'));
        var tp = maxB / meanTime(maxB);
        return h('tr', h('td', d.label + ' (tail = ' + d.tail + 'x mean)'), h('td', hw.int(maxB)), h('td', fmt(tp, 1)), h('td', fmt((tp / (1 / B)) * 100, 0) + '%'));
      });
      tableHost.innerHTML = '';
      tableHost.appendChild(h('table', h('thead', h('tr', h('th', 'Device'), h('th', 'Largest batch inside the limit'), h('th', 'Throughput per ms'), h('th', 'Of the unlimited maximum'))), h('tbody', rows)));
      message.set(
        'Batch **' + hw.int(b) + '** on the **' + dev.label.toLowerCase() + '**: mean ' + fmt(mean, 2) + ' ms, 99th percentile ' + fmt(tail, 2) + ' ms. ' + (ok ? 'It meets the ' + cfg.limit + ' ms limit.' : 'It **misses** the ' + cfg.limit + ' ms limit.') + ' Larger batches raise throughput toward ' + fmt(1 / B, 0) + ' per ms but also raise latency.',
        ok ? 'good' : 'warn'
      );
    }
    var bSl = ui.slider({ label: 'Batch size', min: 0, max: BATCHES.length - 1, value: cfg.b, format: function (v) { return BATCHES[v]; }, onInput: function (v) { cfg.b = v; paint(); } });
    var lSl = ui.slider({ label: '99th-percentile limit', min: 3, max: 20, value: cfg.limit, format: function (v) { return v + ' ms'; }, onInput: function (v) { cfg.limit = v; paint(); } });
    var dSeg = ui.seg(DEVICES.map(function (d) { return { label: d.label, value: d.id }; }), cur.id, function (v) { cur.id = v; paint(); }, 'Device');
    host.appendChild(h('p', { html: MLS.rich('A service promises that 99 of 100 requests finish within a limit. A bigger batch uses the hardware better but makes every request wait for the whole batch. A chip whose timing varies (caches, threads, prefetching) has a tail well above its mean, so it must run smaller batches to stay inside the limit.') }));
    host.appendChild(h('div.controls', dSeg.el));
    host.appendChild(h('div.controls', bSl.el, lSl.el));
    host.appendChild(h('div.readout', statMean.el, statTail.el, statTp.el));
    host.appendChild(tableHost);
    host.appendChild(message.el);
    host.appendChild(note('Toy model. Both chips take 2 ms plus 0.01 ms per input in the batch on average. We gave the variable chip a tail of 1.75 times its mean and the deterministic chip a tail equal to its mean. All of these numbers are invented. The paper reports measured batch sizes and throughputs under a 7 ms limit for one application. Look them up and compare (reading task).'));
    paint();
  };

  /* ======================================================================
   * 4. tpuRoofline: six workloads on the TPU's roofline
   *    The horizontal axis counts MACs per weight byte, as in the paper's own chart.
   *    The values per workload are from memory of the paper's workload table and are flagged.
   * ==================================================================== */
  MLS.widgets.tpuRoofline = function (host) {
    var APPS = [
      { id: 'MLP0', oi: 200 },
      { id: 'MLP1', oi: 168 },
      { id: 'LSTM0', oi: 64 },
      { id: 'LSTM1', oi: 96 },
      { id: 'CNN0', oi: 2888 },
      { id: 'CNN1', oi: 1750 }
    ];
    var MEM = {
      ddr3: { label: 'DDR3, 34 GB/s (first TPU)', bw: 34e9 },
      fast: { label: 'Faster memory, 180 GB/s (what-if)', bw: 180e9 }
    };
    var cfg = { mem: 'ddr3' };
    var chartHost = h('div');
    var tableHost = h('div.tablewrap');
    var message = ui.msg('');
    function paint() {
      var m = MEM[cfg.mem];
      /* units: G ops per second for peak; "G ops per (MAC per byte)" for bandwidth, so that the chart axis is MACs per byte */
      var mc = { label: m.label, peak: TPU.peakOps / 1e9, bw: (m.bw * 2) / 1e9 };
      var ridge = mc.peak / mc.bw;
      chartHost.innerHTML = '';
      hw.drawRoofline(chartHost, {
        xmin: 10,
        xmax: 10000,
        ymin: 100,
        ymax: 200000,
        machines: [mc],
        points: APPS.map(function (a) { return { label: a.id, oi: a.oi }; }),
        xLabel: 'MAC operations per weight byte',
        yLabel: 'Attainable (G operations per second)',
        minWidth: 600,
        ariaLabel: 'Roofline of the TPU with six workloads'
      });
      var rows = APPS.map(function (a) {
        var att = hw.attainable(mc, a.oi);
        var mem = a.oi < ridge;
        return h('tr', h('td', a.id), h('td', hw.int(a.oi)), h('td', fmt(att / 1000, att < 10000 ? 1 : 1) + ' TOPS'), h('td', fmt((att / mc.peak) * 100, 0) + '%'), h('td', h('span.chip.' + (mem ? 'warn' : 'good'), mem ? 'Memory' : 'Compute')));
      });
      tableHost.innerHTML = '';
      tableHost.appendChild(h('table', h('thead', h('tr', h('th', 'Workload'), h('th', 'MACs per weight byte'), h('th', 'Roofline bound'), h('th', 'Of peak'), h('th', 'Limit'))), h('tbody', rows)));
      message.set('Ridge point: **' + hw.int(ridge) + '** MACs per weight byte (' + fmt(TPU.peakOps / 1e12, 1) + ' TOPS peak, ' + m.label.toLowerCase() + '). Four of the six workloads sit left of it, so memory bandwidth, not the 65,536 MACs, bounds them. These are bounds from the roofline. Measured results are lower, and the paper lists them (reading task).', cfg.mem === 'ddr3' ? 'warn' : 'good');
    }
    var seg = ui.seg(Object.keys(MEM).map(function (k) { return { label: MEM[k].label, value: k }; }), cfg.mem, function (v) { cfg.mem = v; paint(); }, 'Memory system');
    host.appendChild(h('p', { html: MLS.rich('The roofline from Paper 3 on the first TPU. The horizontal axis counts **MACs per weight byte**, because only weights come from DRAM. Each workload gets an upper bound from where it sits.') }));
    host.appendChild(h('div.controls', seg.el));
    host.appendChild(chartHost);
    host.appendChild(tableHost);
    host.appendChild(message.el);
    host.appendChild(note('Our roofline arithmetic. Peak = 65,536 MACs x 700 MHz x 2 operations = 91.75 TOPS. The bound for a workload = min(peak, 34 GB/s x MACs per weight byte x 2 operations per MAC). The six values of MACs per weight byte come from memory of the paper\'s workload table and must be checked against it. The faster-memory case is a what-if, not a measurement.'));
    paint();
  };
})();
