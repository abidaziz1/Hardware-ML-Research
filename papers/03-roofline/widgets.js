/*
 * Widgets for Paper 3 (Roofline): oiCalc, upgradeLab, ceilingsLab, tileOI, layerRoofline.
 * They use the shared renderer MLS.hw.drawRoofline from assets/js/widgets-hw.js.
 * All of them are teaching models on our own arithmetic, not results from the paper.
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
  function oiText(v) {
    if (v < 0.1) return fmt(v, 3);
    if (v < 1) return fmt(v, 2);
    if (v < 10) return fmt(v, 1);
    return hw.int(v);
  }
  /* A share of peak as a percentage, with more digits when it is small. */
  function pctText(frac) {
    var pct = frac * 100;
    return fmt(pct, pct >= 10 ? 0 : pct >= 1 ? 1 : 2) + '%';
  }
  function perfText(v) {
    if (v >= 1000) return fmt(v / 1000, v >= 10000 ? 0 : 1) + ' T';
    return fmt(v, v < 10 ? 1 : 0) + ' G';
  }

  /* Three toy machines. Units: G operations per second and GB per second. */
  var MACHINES = {
    cpu: { label: 'CPU-like', peak: 100, bw: 25, x: [0.05, 1000], y: [1, 1000] },
    gpu: { label: 'GPU-like', peak: 100000, bw: 1000, x: [0.05, 10000], y: [10, 1000000] },
    acc: { label: 'Accelerator-like', peak: 92000, bw: 34, x: [0.05, 10000], y: [1, 1000000] }
  };
  hw.rooflineMachines = MACHINES;

  /* Layer geometry for the neural-network examples (batch 1 counts). */
  function convLayer(p) {
    var e = Math.floor((p.h + 2 * p.p - p.r) / p.u) + 1;
    return {
      macs: p.m * e * e * p.c * p.r * p.r,
      weights: p.m * p.c * p.r * p.r,
      ifmap: p.c * p.h * p.h,
      ofmap: p.m * e * e
    };
  }
  var LAYERS = (function () {
    var P = hw.convPresets;
    var fc = { macs: 9216 * 4096, weights: 9216 * 4096, ifmap: 9216, ofmap: 4096 };
    return [
      { id: 'conv1', label: 'AlexNet CONV1', g: convLayer(P.alex1) },
      { id: 'conv3', label: 'AlexNet CONV3', g: convLayer(P.alex3) },
      { id: 'vgg1', label: 'VGG CONV1_1', g: convLayer(P.vgg1) },
      { id: 'one', label: '1 x 1 layer', g: convLayer(P.one) },
      { id: 'fc6', label: 'AlexNet FC6', g: fc }
    ];
  })();
  function layerOI(g, batch, bytes, weightsOnly) {
    var ops = 2 * batch * g.macs;
    var traffic = bytes * (g.weights + (weightsOnly ? 0 : batch * (g.ifmap + g.ofmap)));
    return ops / traffic;
  }
  hw.layerOI = layerOI;
  hw.rooflineLayers = LAYERS;

  /* ======================================================================
   * 1. oiCalc: operational intensity of common kernels at different precisions
   * ==================================================================== */
  MLS.widgets.oiCalc = function (host) {
    var TYPES = [
      { value: 8, label: '64-bit float' },
      { value: 4, label: '32-bit float' },
      { value: 2, label: '16-bit' },
      { value: 1, label: '8-bit integer' }
    ];
    var cfg = { b: 4, m: 'cpu' };
    var tableHost = h('div.tablewrap');
    var message = ui.msg('');
    function kernels(b) {
      var N = 1024;
      var fc = LAYERS[4].g;
      var c3 = LAYERS[1].g;
      return [
        { label: 'Vector add, c = a + b', note: '1 operation per 3 values', oi: 1 / (3 * b) },
        { label: 'Dot product', note: '2 operations per 2 values', oi: 2 / (2 * b) },
        { label: 'Scaled vector add, y = a x + y', note: '2 operations per 3 values', oi: 2 / (3 * b) },
        { label: 'Matrix times vector', note: 'the matrix dominates the bytes', oi: 2 / b },
        { label: 'Matrix multiply 1024 x 1024, 32 x 32 tiles', note: 'operational intensity = tile / bytes', oi: 32 / b },
        { label: 'Matrix multiply 1024 x 1024, perfect reuse', note: '2 N cubed ops, 3 N squared values', oi: (2 * N) / (3 * b) },
        { label: 'AlexNet FC6, batch 1', note: 'weights used once', oi: layerOI(fc, 1, b, false) },
        { label: 'AlexNet CONV3, batch 1, each value moved once', note: 'best-case reuse', oi: layerOI(c3, 1, b, false) }
      ];
    }
    function paint() {
      var mc = MACHINES[cfg.m];
      var ridge = mc.peak / mc.bw;
      var rows = kernels(cfg.b).map(function (k) {
        var att = hw.attainable(mc, k.oi);
        var mem = k.oi < ridge;
        return h('tr', h('td', h('b', k.label), h('div', { style: { fontSize: '0.8rem', color: 'var(--ink-3)' } }, k.note)), h('td', oiText(k.oi)), h('td', perfText(att) + 'OPS'), h('td', pctText(att / mc.peak)), h('td', h('span.chip.' + (mem ? 'warn' : 'good'), mem ? 'Memory' : 'Compute')));
      });
      tableHost.innerHTML = '';
      tableHost.appendChild(h('table', h('thead', h('tr', h('th', 'Kernel'), h('th', 'Ops per byte'), h('th', 'Reachable'), h('th', 'Of peak'), h('th', 'Limit'))), h('tbody', rows)));
      message.set('Machine ridge: **' + fmt(ridge, ridge < 10 ? 1 : 0) + '** ops per byte (' + mc.label + ': ' + perfText(mc.peak) + 'OPS peak, ' + (mc.bw >= 1000 ? fmt(mc.bw / 1000, 0) + ' TB/s' : mc.bw + ' GB/s') + '). Anything left of it is memory-bound. Halving the bytes per value doubles every operational intensity.');
    }
    var tSeg = ui.seg(TYPES.map(function (t) { return { label: t.label, value: t.value }; }), cfg.b, function (v) { cfg.b = v; paint(); }, 'Bytes per value');
    var mSeg = ui.seg(Object.keys(MACHINES).map(function (k) { return { label: MACHINES[k].label, value: k }; }), cfg.m, function (v) { cfg.m = v; paint(); }, 'Machine');
    host.appendChild(h('p', { html: MLS.rich('Operational intensity is operations per byte of DRAM traffic. Count the operations, count the bytes, divide. Pick a data type and a machine and see which kernels can reach its peak.') }));
    host.appendChild(h('div.controls', tSeg.el, mSeg.el));
    host.appendChild(tableHost);
    host.appendChild(message.el);
    host.appendChild(note('Our operation and byte counts, assuming each value is moved through DRAM the stated number of times and nothing else is. Machines are toy examples: CPU-like 100 G ops/s and 25 GB/s, GPU-like 100 T ops/s and 1 TB/s, accelerator-like 92 T ops/s and 34 GB/s.'));
    paint();
  };

  /* ======================================================================
   * 2. upgradeLab: would more compute or more bandwidth help?
   * ==================================================================== */
  MLS.widgets.upgradeLab = function (host) {
    var OIS = [1 / 4, 1 / 2, 1, 2, 4, 8, 16, 32];
    function oiLabel(v) { return v < 1 ? '1/' + Math.round(1 / v) : String(v); }
    var cfg = { o: 2, cm: 1, bm: 1 };
    var chartHost = h('div');
    var statBefore = ui.stat('Before the upgrade', 'G ops/s');
    var statAfter = ui.stat('After the upgrade', 'G ops/s');
    var statGain = ui.stat('Speed-up', 'x');
    var message = ui.msg('');
    function paint() {
      var oi = OIS[cfg.o];
      var before = { label: 'Before', peak: 100, bw: 25 };
      var after = { label: 'After', peak: 100 * cfg.cm, bw: 25 * cfg.bm };
      var a = hw.attainable(before, oi);
      var b = hw.attainable(after, oi);
      chartHost.innerHTML = '';
      hw.drawRoofline(chartHost, {
        xmin: 1 / 8,
        xmax: 128,
        ymin: 1,
        ymax: 1000,
        machines: [before, after],
        points: [{ label: 'Your kernel', oi: oi, machine: 1 }],
        ariaLabel: 'Roofline before and after an upgrade'
      });
      statBefore.set(fmt(a, a < 10 ? 1 : 0));
      statAfter.set(fmt(b, b < 10 ? 1 : 0), b > a ? 'good' : '');
      statGain.set(fmt(b / a, 2), b > a ? 'good' : 'bad');
      var text;
      if (b === a && (cfg.cm > 1 || cfg.bm > 1)) {
        text = 'The upgrade changed nothing for this kernel. It sits where the other resource is the limit, so extra ' + (cfg.cm > 1 && cfg.bm === 1 ? 'compute' : 'bandwidth') + ' goes unused.';
      } else if (cfg.cm === 1 && cfg.bm === 1) {
        text = 'Baseline: ' + fmt(a, 1) + ' G ops/s. Choose an upgrade.';
      } else {
        text = 'The kernel goes from ' + fmt(a, 1) + ' to ' + fmt(b, 1) + ' G ops/s, a speed-up of **' + fmt(b / a, 2) + 'x**, for a machine that costs more.';
      }
      message.set(text, b === a ? 'warn' : 'good');
    }
    var oSl = ui.slider({ label: 'Operational intensity of your kernel', min: 0, max: OIS.length - 1, value: cfg.o, format: function (v) { return oiLabel(OIS[v]) + ' ops/byte'; }, onInput: function (v) { cfg.o = v; paint(); } });
    var cSeg = ui.seg([{ label: 'Compute 1x', value: 1 }, { label: 'Compute 2x', value: 2 }, { label: 'Compute 4x', value: 4 }], cfg.cm, function (v) { cfg.cm = v; paint(); }, 'Compute upgrade');
    var bSeg = ui.seg([{ label: 'Bandwidth 1x', value: 1 }, { label: 'Bandwidth 2x', value: 2 }, { label: 'Bandwidth 4x', value: 4 }], cfg.bm, function (v) { cfg.bm = v; paint(); }, 'Bandwidth upgrade');
    host.appendChild(h('p', { html: MLS.rich('The baseline machine does 100 G ops/s with 25 GB/s of memory bandwidth (ridge at 4). You can spend on more compute, more bandwidth, or both. Pick a kernel and see what each purchase buys.') }));
    host.appendChild(h('div.controls', oSl.el));
    host.appendChild(h('div.controls', cSeg.el, bSeg.el));
    host.appendChild(chartHost);
    host.appendChild(h('div.readout', statBefore.el, statAfter.el, statGain.el));
    host.appendChild(message.el);
    host.appendChild(note('Toy machine and toy upgrades. The point is the shape of the roof, not the numbers.'));
    paint();
  };

  /* ======================================================================
   * 3. ceilingsLab: optimizations lift the ceilings below the roof
   * ==================================================================== */
  MLS.widgets.ceilingsLab = function (host) {
    var OIS = [1 / 4, 1 / 2, 1, 2, 4, 8, 16, 32];
    function oiLabel(v) { return v < 1 ? '1/' + Math.round(1 / v) : String(v); }
    var cfg = { o: 4, simd: false, ilp: false, pre: false, numa: false };
    var chartHost = h('div');
    var statNow = ui.stat('Reachable now', 'G ops/s');
    var statMax = ui.stat('With everything on', 'G ops/s');
    var statLeft = ui.stat('Left on the table', '');
    var message = ui.msg('');
    function paint() {
      var oi = OIS[cfg.o];
      var peak = 100 * (cfg.simd ? 1 : 0.25) * (cfg.ilp ? 1 : 0.5);
      var bw = 25 * (cfg.pre ? 1 : 0.5) * (cfg.numa ? 1 : 0.5);
      var now = { label: 'Your machine now', peak: peak, bw: bw, ceilings: [{ peak: 100, bw: 25, label: 'Everything optimized' }] };
      var att = hw.attainable(now, oi);
      var best = hw.attainable({ peak: 100, bw: 25 }, oi);
      chartHost.innerHTML = '';
      hw.drawRoofline(chartHost, { xmin: 1 / 8, xmax: 128, ymin: 1, ymax: 1000, machines: [now], points: [{ label: 'Your kernel', oi: oi }], ariaLabel: 'Roofline with ceilings for missing optimizations' });
      statNow.set(fmt(att, att < 100 ? 1 : 0), att < best ? 'warn' : 'good');
      statMax.set(fmt(best, best < 100 ? 1 : 0));
      statLeft.set(fmt((1 - att / best) * 100, 0) + '%', att < best ? 'bad' : 'good');
      var memBound = oi < peak / bw;
      var todo = [];
      if (memBound) {
        if (!cfg.pre) todo.push('software prefetching');
        if (!cfg.numa) todo.push('memory affinity (keeping data near the core that uses it)');
        message.set(todo.length ? 'The kernel sits on the **sloped** part, so memory is the limit. The next gains come from **' + todo.join(' and ') + '**. SIMD or more instruction parallelism would not move it.' : 'The kernel is memory-bound and every memory optimization is on. The only way up is a higher operational intensity (more reuse).', todo.length ? 'warn' : '');
      } else {
        if (!cfg.simd) todo.push('SIMD');
        if (!cfg.ilp) todo.push('instruction-level parallelism');
        message.set(todo.length ? 'The kernel sits on the **flat** part, so compute is the limit. The next gains come from **' + todo.join(' and ') + '**. Prefetching would not move it.' : 'The kernel is compute-bound with every compute optimization on. It is at the peak.', todo.length ? 'warn' : 'good');
      }
    }
    var oSl = ui.slider({ label: 'Operational intensity of your kernel', min: 0, max: OIS.length - 1, value: cfg.o, format: function (v) { return oiLabel(OIS[v]) + ' ops/byte'; }, onInput: function (v) { cfg.o = v; paint(); } });
    function toggle(key, label) {
      var sg = ui.seg([{ label: 'Off', value: false }, { label: 'On', value: true }], cfg[key], function (v) { cfg[key] = v; paint(); }, label);
      return h('div.ctrl', h('label.lab', h('span', label)), sg.el);
    }
    host.appendChild(h('p', { html: MLS.rich('The roof assumes perfectly tuned code. Real code sits under lower **ceilings** until you apply each optimization. Turn them on one at a time and watch which ceiling your kernel is under.') }));
    host.appendChild(h('div.controls', oSl.el));
    host.appendChild(h('div.controls', toggle('simd', 'SIMD (4 times compute)'), toggle('ilp', 'Instruction parallelism (2 times)'), toggle('pre', 'Prefetching (2 times bandwidth)'), toggle('numa', 'Memory affinity (2 times bandwidth)')));
    host.appendChild(chartHost);
    host.appendChild(h('div.readout', statNow.el, statMax.el, statLeft.el));
    host.appendChild(message.el);
    host.appendChild(note('Toy model. The paper uses real ceilings measured per machine (for example for missing SIMD or missing prefetching). The factors 4, 2, 2 and 2 here are ours, chosen to show the effect.'));
    paint();
  };

  /* ======================================================================
   * 4. tileOI: blocking a matrix multiply raises operational intensity
   * ==================================================================== */
  MLS.widgets.tileOI = function (host) {
    var NS = [256, 512, 1024, 2048, 4096];
    var CACHES = [32 * 1024, 256 * 1024, 1024 * 1024, 8 * 1024 * 1024];
    var TILES = [2, 4, 8, 16, 32, 64, 128, 256, 512];
    var cfg = { n: 3, c: 2, t: 2 };
    var chartHost = h('div');
    var statFoot = ui.stat('Three tiles need', '');
    var statOI = ui.stat('Operational intensity', 'ops/byte');
    var statAtt = ui.stat('Reachable', 'G ops/s');
    var statPct = ui.stat('Of peak', '');
    var message = ui.msg('');
    function kb(v) { return v >= 1048576 ? fmt(v / 1048576, 1) + ' MB' : fmt(v / 1024, 0) + ' KB'; }
    function paint() {
      var n = NS[cfg.n];
      var cache = CACHES[cfg.c];
      var t = Math.min(TILES[cfg.t], n);
      var foot = 3 * t * t * 4;
      var fits = foot <= cache;
      var oi = fits ? Math.min(t / 4, n / 6) : 0.25;
      var mc = { label: 'Machine', peak: 100, bw: 25 };
      var att = hw.attainable(mc, oi);
      chartHost.innerHTML = '';
      hw.drawRoofline(chartHost, { xmin: 1 / 8, xmax: 512, ymin: 1, ymax: 1000, machines: [mc], points: [{ label: 'Tiled matrix multiply', oi: oi }], ariaLabel: 'Roofline point for a tiled matrix multiply' });
      statFoot.set(kb(foot), fits ? '' : 'bad');
      statOI.set(oiText(oi), oi < 4 ? 'warn' : 'good');
      statAtt.set(fmt(att, att < 10 ? 1 : 0), att < 100 ? 'warn' : 'good');
      statPct.set(fmt((att / 100) * 100, att < 10 ? 1 : 0) + '%', att < 100 ? 'bad' : 'good');
      var text;
      if (!fits) text = 'Three ' + t + ' x ' + t + ' tiles need ' + kb(foot) + ', more than the ' + kb(cache) + ' cache. The tiles evict each other and the kernel falls back to about 0.25 operations per byte, ' + fmt((att / 100) * 100, 1) + '% of peak. A tile bigger than the cache is worse than a tiny one.';
      else if (oi < 4) text = 'The tile fits. Each value fetched is reused about ' + t + ' times, giving ' + oiText(oi) + ' operations per byte, still left of the ridge at 4. Bigger tiles would help.';
      else text = 'The tile fits and the operational intensity of ' + oiText(oi) + ' is right of the ridge at 4, so memory no longer limits the kernel. The arithmetic does.';
      message.set(text, !fits ? 'bad' : oi < 4 ? 'warn' : 'good');
    }
    var nSl = ui.slider({ label: 'Matrix size N x N (32-bit values)', min: 0, max: NS.length - 1, value: cfg.n, format: function (v) { return NS[v]; }, onInput: function (v) { cfg.n = v; paint(); } });
    var cSl = ui.slider({ label: 'Cache size', min: 0, max: CACHES.length - 1, value: cfg.c, format: function (v) { return kb(CACHES[v]); }, onInput: function (v) { cfg.c = v; paint(); } });
    var tSl = ui.slider({ label: 'Tile size T x T', min: 0, max: TILES.length - 1, value: cfg.t, format: function (v) { return TILES[v]; }, onInput: function (v) { cfg.t = v; paint(); } });
    host.appendChild(h('p', { html: MLS.rich('Multiply two N x N matrices by working on **T x T tiles** that stay in the cache. Each fetched value is reused about T times, so the operational intensity is roughly **T divided by 4 bytes**. But three tiles must fit in the cache at once.') }));
    host.appendChild(h('div.controls', nSl.el, cSl.el, tSl.el));
    host.appendChild(chartHost);
    host.appendChild(h('div.readout', statFoot.el, statOI.el, statAtt.el, statPct.el));
    host.appendChild(message.el);
    host.appendChild(note('Toy model on the 100 G ops/s, 25 GB/s machine. Operational intensity is T / 4 for 32-bit values, capped at N / 6 (every value moved once). When three tiles do not fit, we assume the untiled value of 0.25. Real caches degrade more gradually.'));
    paint();
  };

  /* ======================================================================
   * 5. layerRoofline: neural-network layers on three machines
   * ==================================================================== */
  MLS.widgets.layerRoofline = function (host) {
    var BATCHES = [1, 2, 4, 8, 16, 32, 64, 128, 256];
    var cfg = { b: 1, bi: 0, m: 'acc', w: false };
    var chartHost = h('div');
    var tableHost = h('div.tablewrap');
    var message = ui.msg('');
    function paint() {
      var mc = MACHINES[cfg.m];
      var batch = BATCHES[cfg.bi];
      var rows = LAYERS.map(function (L) {
        var oi = layerOI(L.g, batch, cfg.b, cfg.w);
        var att = hw.attainable(mc, oi);
        return { label: L.label, oi: oi, att: att, pct: att / mc.peak, mem: oi < mc.peak / mc.bw };
      });
      chartHost.innerHTML = '';
      var pts = rows.slice().sort(function (a, b) { return a.oi - b.oi; }).map(function (r) { return { label: r.label, oi: r.oi }; });
      hw.drawRoofline(chartHost, { xmin: mc.x[0], xmax: mc.x[1], ymin: mc.y[0], ymax: mc.y[1], machines: [mc], points: pts, minWidth: 620, ariaLabel: 'Roofline with five neural network layers' });
      tableHost.innerHTML = '';
      tableHost.appendChild(
        h('table', h('thead', h('tr', h('th', 'Layer'), h('th', 'Ops per byte'), h('th', 'Reachable'), h('th', 'Of peak'), h('th', 'Limit'))), h('tbody', rows.map(function (r) {
          return h('tr', h('td', r.label), h('td', oiText(r.oi)), h('td', perfText(r.att) + 'OPS'), h('td', pctText(r.pct)), h('td', h('span.chip.' + (r.mem ? 'warn' : 'good'), r.mem ? 'Memory' : 'Compute')));
        })))
      );
      var fc = rows[4];
      message.set('Machine ridge **' + fmt(mc.peak / mc.bw, mc.peak / mc.bw < 10 ? 1 : 0) + '**. At batch **' + batch + '** the fully connected layer reaches **' + pctText(fc.pct) + '** of peak. ' + (cfg.w ? 'Only weights count as DRAM traffic here, as in a design that keeps activations in an on-chip buffer.' : 'Weights, inputs and outputs all count as DRAM traffic, each moved once.'));
    }
    var pSeg = ui.seg([{ label: '8-bit integer', value: 1 }, { label: '16-bit', value: 2 }, { label: '32-bit float', value: 4 }], cfg.b, function (v) { cfg.b = v; paint(); }, 'Bytes per value');
    var mSeg = ui.seg(Object.keys(MACHINES).map(function (k) { return { label: MACHINES[k].label, value: k }; }), cfg.m, function (v) { cfg.m = v; paint(); }, 'Machine');
    var wSeg = ui.seg([{ label: 'Weights + activations are DRAM traffic', value: false }, { label: 'Only weights are DRAM traffic', value: true }], cfg.w, function (v) { cfg.w = v; paint(); }, 'Which traffic counts');
    var bSl = ui.slider({ label: 'Batch size', min: 0, max: BATCHES.length - 1, value: 0, format: function (v) { return BATCHES[v]; }, onInput: function (v) { cfg.bi = v; paint(); } });
    host.appendChild(h('p', { html: MLS.rich('Put the layers from Paper 2 on a roofline. The operations are 2 per MAC. The bytes depend on the data width and on what counts as DRAM traffic. Change the machine, the precision and the batch.') }));
    host.appendChild(h('div.controls', mSeg.el, pSeg.el));
    host.appendChild(h('div.controls', wSeg.el, bSl.el));
    host.appendChild(chartHost);
    host.appendChild(tableHost);
    host.appendChild(message.el);
    host.appendChild(note('Operational intensity = 2 x batch x MACs / (bytes x (weights + batch x (input + output values))), each value moved once, which is the best case. Real traffic is higher when a layer does not fit on chip. Machines are toy examples (see the machine note in the earlier calculator).'));
    paint();
  };
})();
