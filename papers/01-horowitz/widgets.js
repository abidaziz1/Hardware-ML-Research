/*
 * Widgets for Paper 1 (Horowitz, ISSCC 2014):
 *   energyLadder, powerBudget, dennard, bitwidth, overheadAmortize, energyBudget.
 * energyLadder shows the paper's table. The others are toy models that use the paper's numbers
 * in scenarios we made up, and the lesson labels them that way.
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
   * 1. energyLadder: the paper's energy table on a log scale. Click a row to make it the baseline.
   *    opts: { ids?: [row ids], base?: id }
   * ==================================================================== */
  MLS.widgets.energyLadder = function (host, opts) {
    var rows = hw.energyRows.filter(function (r) {
      return !opts.ids || opts.ids.indexOf(r.id) >= 0;
    });
    var base = opts.base || 'add32';
    var LO = -2;
    var HI = Math.log10(5000);
    var list = h('div.ladder', { role: 'group', 'aria-label': 'Energy per operation, click a row to compare against it' });
    var message = ui.msg('');
    var cells = {};
    var lastGroup = '';

    function baseRow() {
      return rows.filter(function (r) { return r.id === base; })[0] || rows[0];
    }
    function paint() {
      var b = baseRow();
      rows.forEach(function (r) {
        var c = cells[r.id];
        var ratio = r.pj / b.pj;
        c.ratio.textContent = r.id === b.id ? 'baseline' : ratio >= 10 ? hw.int(ratio) + 'x' : fmt(ratio, 2) + 'x';
        c.row.setAttribute('aria-pressed', r.id === b.id ? 'true' : 'false');
      });
      var dram = hw.energy.dram;
      var dramHi = hw.energy.dramhi;
      message.set(
        'Baseline: **' + b.label + '** (' + hw.pj(b.pj) + '). One off-chip DRAM read costs **' + hw.int(dram / b.pj) + ' to ' + hw.int(dramHi / b.pj) + ' times** as much.' +
          (b.id === 'dram' || b.id === 'dramhi' ? ' Everything else on this chart is tiny next to it.' : '')
      );
    }

    rows.forEach(function (r) {
      if (r.group !== lastGroup) {
        list.appendChild(h('div.lgroup', r.group));
        lastGroup = r.group;
      }
      var frac = MLS.clamp((Math.log10(r.pj) - LO) / (HI - LO), 0.02, 1);
      var kind = r.group.indexOf('Memory') === 0 ? 'mem' : 'cmp';
      var bar = h('i.lbar.' + kind, { style: { width: Math.round(frac * 100) + '%' } });
      var ratio = h('span.lratio');
      var row = h(
        'button.lrow',
        { type: 'button', 'aria-pressed': 'false' },
        h('span.lname', r.label + (r.check ? '' : ' †')),
        h('span.ltrack', bar),
        h('span.lval', hw.pj(r.pj)),
        ratio
      );
      row.addEventListener('click', function () {
        base = r.id;
        paint();
      });
      cells[r.id] = { row: row, ratio: ratio };
      list.appendChild(row);
    });

    host.appendChild(h('p', { html: MLS.rich('Energy for one operation in a 45 nm chip. The bars use a **log scale**: each step to the right is ten times more energy. Click any row to compare everything against it.') }));
    host.appendChild(list);
    host.appendChild(message.el);
    host.appendChild(note('† The paper\'s figure lists this value, but this course could not confirm it against a second source. Check it in the PDF before you quote it. Memory rows are per 64-bit read.'));
    paint();
  };

  /* ======================================================================
   * 2. powerBudget: the same watts buy very different amounts of work
   * ==================================================================== */
  MLS.widgets.powerBudget = function (host, opts) {
    var WATTS = [0.5, 1, 2, 5, 15, 65];
    var NET_MACS = opts.netMacs || 724e6;
    var mac = hw.energy.fmul32 + hw.energy.fadd32;
    var SOURCES = [
      { value: 'arith', label: 'Arithmetic only', pj: mac },
      { value: 'sram', label: 'Operands from 8 KB SRAM', pj: mac + 3 * hw.wordPj.sram8k },
      { value: 'dram', label: 'Operands from DRAM', pj: mac + 3 * hw.wordPj.dram }
    ];
    var cfg = { w: 2, src: 'arith' };
    var statPj = ui.stat('Energy per multiply-add', '');
    var statRate = ui.stat('Multiply-adds per second', '');
    var statFps = ui.stat('Network runs per second', '');
    var message = ui.msg('');

    function paint() {
      var s = SOURCES.filter(function (x) { return x.value === cfg.src; })[0];
      var rate = cfg.w / (s.pj * 1e-12);
      var fps = rate / NET_MACS;
      statPj.set(hw.pj(s.pj), cfg.src === 'dram' ? 'bad' : cfg.src === 'sram' ? 'warn' : 'good');
      statRate.set(hw.si(rate, 'MAC/s'));
      statFps.set(fps >= 10 ? hw.int(fps) : fmt(fps, 1), fps < 5 ? 'bad' : 'good');
      var base = cfg.w / (SOURCES[0].pj * 1e-12) / NET_MACS;
      var drm = cfg.w / (SOURCES[2].pj * 1e-12) / NET_MACS;
      message.set(
        'With **' + cfg.w + ' W** to spend, the arithmetic alone could run this network about **' + hw.int(base) + '** times per second. If every multiply-add must fetch its operands from DRAM, the same watts give about **' + fmt(drm, 1) + '** runs per second. Same chip, same power, ' + hw.int(base / drm) + ' times less work.',
        cfg.src === 'dram' ? 'warn' : ''
      );
    }

    var wSlider = ui.slider({ label: 'Power budget', min: 0, max: WATTS.length - 1, value: WATTS.indexOf(2), format: function (v) { return WATTS[v] + ' W'; }, onInput: function (v) { cfg.w = WATTS[v]; paint(); } });
    var srcSeg = ui.seg(SOURCES.map(function (x) { return { label: x.label, value: x.value }; }), cfg.src, function (v) { cfg.src = v; paint(); }, 'Where the operands come from');

    host.appendChild(h('p', { html: MLS.rich('Power is energy per operation times operations per second, so a fixed power budget buys **budget divided by energy per operation**. Pick where each multiply-add gets its three operands.') }));
    host.appendChild(h('div.controls', wSlider.el, srcSeg.el));
    host.appendChild(h('div.readout', statPj.el, statRate.el, statFps.el));
    host.appendChild(message.el);
    host.appendChild(note('Toy model. Energy per 32-bit float multiply (3.7 pJ) and add (0.9 pJ), the 5 pJ SRAM word and the 650 pJ DRAM word come from the 45 nm table. Three operands per multiply-add and a network of ' + hw.int(NET_MACS / 1e6) + ' million multiply-adds are our assumptions. Control logic and the chip\'s other power uses are ignored.'));
    paint();
  };

  /* ======================================================================
   * 3. dennard: textbook scaling rule, with and without voltage scaling
   * ==================================================================== */
  MLS.widgets.dennard = function (host) {
    var K = 0.7;
    var MODES = [
      { value: 'dennard', label: 'Voltage keeps scaling', vf: K * K, ff: 1 / K, text: 'Each generation: smaller capacitance, lower voltage, higher clock. Power per transistor falls 0.49x, exactly as fast as transistor count doubles, so chip power stays flat while the chip gets 1.4x faster.' },
      { value: 'vup', label: 'Voltage stuck, clock keeps rising', vf: 1, ff: 1 / K, text: 'Voltage no longer falls. Power per transistor stays the same, but there are 2x as many of them. Chip power doubles every generation. No cooling system can follow that for long.' },
      { value: 'vhold', label: 'Voltage stuck, clock held', vf: 1, ff: 1, text: 'Designers hold the clock to cap power. Power per transistor falls 0.7x, but transistors grow 2x, so chip power still grows 1.43x per generation, and speed per transistor no longer improves.' }
    ];
    var cfg = { gen: 4, mode: 'vup' };
    var DENS = 1 / (K * K);
    var statT = ui.stat('Transistors on the same area', '');
    var statF = ui.stat('Clock speed', '');
    var statP = ui.stat('Chip power if all switch', '');
    var statU = ui.stat('Share you can run in the original power', '');
    var message = ui.msg('');
    var tableHost = h('div.tablewrap');

    function metrics(mode, g) {
      var perT = K * mode.vf * mode.ff;
      var trans = Math.pow(DENS, g);
      var power = Math.pow(DENS * perT, g);
      return { trans: trans, freq: Math.pow(mode.ff, g), power: power, usable: Math.min(1, 1 / power) };
    }
    function paint() {
      var mode = MODES.filter(function (m) { return m.value === cfg.mode; })[0];
      var m = metrics(mode, cfg.gen);
      statT.set(fmt(m.trans, 1) + 'x');
      statF.set(fmt(m.freq, 1) + 'x');
      statP.set(fmt(m.power, 1) + 'x', m.power > 1.05 ? 'bad' : 'good');
      statU.set(fmt(m.usable * 100, m.usable < 0.1 ? 1 : 0) + '%', m.usable < 0.999 ? 'bad' : 'good');
      message.set(mode.text, cfg.mode === 'dennard' ? 'good' : 'warn');
      var rows = [];
      for (var g = 0; g <= 8; g++) {
        var x = metrics(mode, g);
        var tr = h('tr', { class: g === cfg.gen ? 'now' : null }, h('td', 'Generation ' + g), h('td', fmt(x.trans, 1) + 'x'), h('td', fmt(x.power, 1) + 'x'), h('td', fmt(x.usable * 100, x.usable < 0.1 ? 1 : 0) + '%'));
        rows.push(tr);
      }
      tableHost.innerHTML = '';
      tableHost.appendChild(h('table', h('thead', h('tr', h('th', 'Step'), h('th', 'Transistors'), h('th', 'Chip power'), h('th', 'Share usable'))), h('tbody', rows)));
    }

    var gSlider = ui.slider({ label: 'Generations of shrinking', min: 0, max: 8, value: cfg.gen, onInput: function (v) { cfg.gen = v; paint(); } });
    var mSeg = ui.seg(MODES.map(function (m) { return { label: m.label, value: m.value }; }), cfg.mode, function (v) { cfg.mode = v; paint(); }, 'Scaling regime');

    host.appendChild(h('p', { html: MLS.rich('Each generation shrinks every dimension to **0.7x**, so twice as many transistors fit on the same area. Chip power is transistors times power per transistor, and power per transistor is capacitance times voltage squared times clock. Try the three regimes.') }));
    host.appendChild(h('div.controls', gSlider.el, mSeg.el));
    host.appendChild(h('div.readout', statT.el, statF.el, statP.el, statU.el));
    host.appendChild(message.el);
    host.appendChild(tableHost);
    host.appendChild(note('Toy model of the textbook rule with a shrink factor of 0.7 per generation. It ignores leakage, wire energy and real design choices. Real chips did not follow it exactly. It shows why the end of voltage scaling matters.'));
    paint();
  };

  /* ======================================================================
   * 4. bitwidth: adders scale with bits, multipliers with bits squared
   * ==================================================================== */
  MLS.widgets.bitwidth = function (host) {
    var BITS = [4, 8, 12, 16, 20, 24, 28, 32];
    var cfg = { b: 8 };
    var statAdd = ui.stat('Add', '');
    var statMul = ui.stat('Multiply', '');
    var statRatio = ui.stat('Multiply cost in adds', '');
    var statMem = ui.stat('Bytes to move per value', '');
    var message = ui.msg('');
    var barAdd = ui.meterRow('Add');
    var barMul = ui.meterRow('Multiply');
    var barMem = ui.meterRow('Memory traffic');

    function paint() {
      var b = cfg.b;
      var add = hw.energy.add32 * (b / 32);
      var mul = hw.energy.mul32 * Math.pow(b / 32, 2);
      statAdd.set(hw.pj(add));
      statMul.set(hw.pj(mul));
      statRatio.set(fmt(mul / add, 0) + 'x');
      statMem.set(fmt(b / 8, 1) + ' B');
      barAdd.set(add / hw.energy.add32, fmt((add / hw.energy.add32) * 100, 0) + '%', 'var(--accent)');
      barMul.set(mul / hw.energy.mul32, fmt((mul / hw.energy.mul32) * 100, 0) + '%', 'var(--warn)');
      barMem.set(b / 32, fmt((b / 32) * 100, 0) + '%', 'var(--good)');
      var extra = '';
      if (b === 8) extra = ' The paper\'s figure lists 0.03 pJ for an 8-bit add and 0.2 pJ for an 8-bit multiply. The rule gives ' + hw.pj(add) + ' and ' + hw.pj(mul) + ', so the two agree.';
      message.set('At **' + b + ' bits**, the multiplier costs ' + fmt(mul / hw.energy.mul32 * 100, 0) + '% of the 32-bit one, the adder ' + fmt(add / hw.energy.add32 * 100, 0) + '%, and each value takes ' + fmt(b / 32 * 100, 0) + '% of the memory traffic.' + extra, 'good');
    }

    var bSlider = ui.slider({ label: 'Bits per number', min: 0, max: BITS.length - 1, value: BITS.indexOf(cfg.b), format: function (v) { return BITS[v] + ' bits'; }, onInput: function (v) { cfg.b = BITS[v]; paint(); } });
    host.appendChild(h('p', { html: MLS.rich('An adder has about one cell per bit. A multiplier adds up one shifted copy of the number per bit, about **bits squared** cells. Anchor both at the paper\'s 32-bit integer numbers and slide the width down.') }));
    host.appendChild(h('div.controls', bSlider.el));
    host.appendChild(h('div.readout', statAdd.el, statMul.el, statRatio.el, statMem.el));
    host.appendChild(h('div.meters', barAdd.el, barMul.el, barMem.el));
    host.appendChild(message.el);
    host.appendChild(note('Toy scaling rule: add energy proportional to bits, multiply energy proportional to bits squared, anchored at 0.1 pJ and 3.1 pJ for 32 bits. Real circuits vary with design.'));
    paint();
  };

  /* ======================================================================
   * 5. overheadAmortize: one instruction, many operations
   * ==================================================================== */
  MLS.widgets.overheadAmortize = function (host) {
    var WIDTHS = [1, 2, 4, 8, 16, 32, 64, 128, 256];
    var OPS = [
      { value: 'add', label: '32-bit add', pj: hw.energy.add32 },
      { value: 'imac', label: '32-bit int multiply-add', pj: hw.energy.mul32 + hw.energy.add32 },
      { value: 'fmac', label: '32-bit float multiply-add', pj: hw.energy.fmul32 + hw.energy.fadd32 }
    ];
    var cfg = { ovh: 60, w: 1, op: 'add' };
    var statPer = ui.stat('Energy per useful operation', '');
    var statUse = ui.stat('Share spent on arithmetic', '');
    var statNeed = ui.stat('Width for 50% useful', 'operations');
    var barArith = ui.meterRow('Arithmetic');
    var barOvh = ui.meterRow('Overhead');
    var message = ui.msg('');

    function paint() {
      var op = OPS.filter(function (o) { return o.value === cfg.op; })[0];
      var total = cfg.ovh + cfg.w * op.pj;
      var useful = (cfg.w * op.pj) / total;
      statPer.set(hw.pj(total / cfg.w), useful > 0.5 ? 'good' : 'bad');
      statUse.set(fmt(useful * 100, useful < 0.1 ? 1 : 0) + '%', useful > 0.5 ? 'good' : 'bad');
      var need = Math.ceil(cfg.ovh / op.pj);
      statNeed.set(hw.int(need));
      barArith.set(useful, fmt(useful * 100, 1) + '%', 'var(--good)');
      barOvh.set(1 - useful, fmt((1 - useful) * 100, 1) + '%', 'var(--warn)');
      var text;
      if (cfg.w === 1) text = 'One instruction does one ' + op.label.toLowerCase() + '. The arithmetic is ' + fmt(op.pj, 2) + ' pJ and the overhead around it is ' + cfg.ovh + ' pJ. Almost everything you pay for is overhead.';
      else text = 'One instruction now covers ' + cfg.w + ' operations, so the overhead is shared. Each operation costs ' + hw.pj(total / cfg.w) + ' instead of ' + hw.pj(cfg.ovh + op.pj) + '.';
      message.set(text, useful > 0.5 ? 'good' : '');
    }

    var ovhSlider = ui.slider({ label: 'Overhead per instruction (fetch, decode, registers, control)', min: 10, max: 200, step: 10, value: cfg.ovh, format: function (v) { return v + ' pJ'; }, onInput: function (v) { cfg.ovh = v; paint(); } });
    var wSlider = ui.slider({ label: 'Operations per instruction', min: 0, max: WIDTHS.length - 1, value: 0, format: function (v) { return WIDTHS[v]; }, onInput: function (v) { cfg.w = WIDTHS[v]; paint(); } });
    var opSeg = ui.seg(OPS.map(function (o) { return { label: o.label, value: o.value }; }), cfg.op, function (v) { cfg.op = v; paint(); }, 'Operation type');

    host.appendChild(h('p', { html: MLS.rich('A processor pays a fixed price to fetch, decode and schedule each instruction. If one instruction triggers many operations, that price is shared. Choose an operation and widen the instruction.') }));
    host.appendChild(h('div.controls', opSeg.el));
    host.appendChild(h('div.controls', ovhSlider.el, wSlider.el));
    host.appendChild(h('div.readout', statPer.el, statUse.el, statNeed.el));
    host.appendChild(h('div.meters', barArith.el, barOvh.el));
    host.appendChild(message.el);
    host.appendChild(note('Toy model. The arithmetic energies come from the paper\'s 45 nm table. The overhead per instruction is **our guess**, set to 60 pJ by default so the effect is easy to see. The paper reports a real breakdown for a processor. Find it in the reading task and replace our number with the paper\'s.'));
    paint();
  };

  /* ======================================================================
   * 6. energyBudget: where does the energy of a layer go?
   * ==================================================================== */
  MLS.widgets.energyBudget = function (host, opts) {
    var MACS = opts.macs || [1e6, 1e7, 1e8, 724e6, 1e9, 1e10];
    var MAC_LABEL = opts.macLabels || { 724e6: 'AlexNet-sized (724 M)' };
    var REUSE = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024];
    var PREC = {
      f32: { bits: 32, label: '32-bit float', pj: hw.energy.fmul32 + hw.energy.fadd32 },
      f16: { bits: 16, label: '16-bit float', pj: hw.energy.fmul16 + hw.energy.fadd16 },
      i8: { bits: 8, label: '8-bit integer', pj: hw.energy.mul8 + hw.energy.add8 }
    };
    var cfg = { m: 3, prec: 'f32', src: 'dram', r: 0 };
    var statComp = ui.stat('Arithmetic energy', '');
    var statMem = ui.stat('Data movement energy', '');
    var statTot = ui.stat('Total per run', '');
    var statShare = ui.stat('Share that is arithmetic', '');
    var statPow = ui.stat('Power at 30 runs per second', '');
    var barC = ui.meterRow('Arithmetic');
    var barM = ui.meterRow('Data movement');
    var message = ui.msg('');

    function fmtMacs(v) {
      return MAC_LABEL[v] || (v >= 1e9 ? v / 1e9 + ' G' : v / 1e6 + ' M') + ' multiply-adds';
    }
    function paint() {
      var macs = MACS[cfg.m];
      var p = PREC[cfg.prec];
      var R = REUSE[cfg.r];
      var wordPj = (cfg.src === 'dram' ? hw.wordPj.dram : hw.wordPj.sram8k) * (p.bits / 32);
      var comp = macs * p.pj;
      var mem = (macs * 3 * wordPj) / R;
      var tot = comp + mem;
      var share = comp / tot;
      statComp.set(hw.pj(comp));
      statMem.set(hw.pj(mem), mem > comp ? 'bad' : 'good');
      statTot.set(hw.pj(tot));
      statShare.set(fmt(share * 100, share < 0.1 ? 1 : 0) + '%', share > 0.5 ? 'good' : 'bad');
      statPow.set(hw.si((tot * 1e-12) * 30, 'W'), tot * 1e-12 * 30 > 2 ? 'bad' : 'good');
      barC.set(share, fmt(share * 100, 1) + '%', 'var(--accent)');
      barM.set(1 - share, fmt((1 - share) * 100, 1) + '%', 'var(--warn)');
      var text;
      if (share < 0.05) text = 'Almost all the energy moves data. Arithmetic is ' + fmt(share * 100, 1) + '% of the total. Making the multiplier cheaper would barely change anything. Reusing each fetched value more times would.';
      else if (share < 0.5) text = 'Data movement still costs more than the arithmetic. Raise the reuse or move the data closer to the arithmetic.';
      else text = 'Arithmetic now takes the larger share. From here, a cheaper multiplier (fewer bits) starts to matter.';
      message.set(text, share > 0.5 ? 'good' : 'warn');
    }

    var mSlider = ui.slider({ label: 'Size of the computation', min: 0, max: MACS.length - 1, value: cfg.m, format: function (v) { return fmtMacs(MACS[v]); }, onInput: function (v) { cfg.m = v; paint(); } });
    var rSlider = ui.slider({ label: 'Reuse: multiply-adds served by each fetched value', min: 0, max: REUSE.length - 1, value: cfg.r, format: function (v) { return REUSE[v]; }, onInput: function (v) { cfg.r = v; paint(); } });
    var pSeg = ui.seg(Object.keys(PREC).map(function (k) { return { label: PREC[k].label, value: k }; }), cfg.prec, function (v) { cfg.prec = v; paint(); }, 'Number format');
    var sSeg = ui.seg([{ label: 'Operands come from DRAM', value: 'dram' }, { label: 'Operands come from an 8 KB SRAM', value: 'sram' }], cfg.src, function (v) { cfg.src = v; paint(); }, 'Where operands come from');

    host.appendChild(h('p', { html: MLS.rich('Add up the energy for a whole computation: **arithmetic** (each multiply-add) plus **data movement** (each operand fetched). Reuse divides the data movement.') }));
    host.appendChild(h('div.controls', mSlider.el, rSlider.el));
    host.appendChild(h('div.controls', pSeg.el, sSeg.el));
    host.appendChild(h('div.readout', statComp.el, statMem.el, statTot.el, statShare.el, statPow.el));
    host.appendChild(h('div.meters', barC.el, barM.el));
    host.appendChild(message.el);
    host.appendChild(note('Toy model. The per-operation energies are the paper\'s 45 nm numbers (the 8-bit and 16-bit arithmetic values are marked † in the table and need checking). We assume three operands per multiply-add, a word cost of half the 64-bit memory figure at 32 bits (5 pJ SRAM, 650 pJ DRAM), and a word cost that shrinks in proportion to the bits. Weights, inputs and partial sums are treated alike. Real accelerators differ.'));
    paint();
  };
})();
