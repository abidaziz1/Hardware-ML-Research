/*
 * hw.js
 * Numbers and helpers shared by the lessons in this course.
 *
 * MLS.hw.energyRows holds the per-operation energies from Horowitz, "Computing's Energy Problem",
 * ISSCC 2014 (45 nm). `check: true` means a secondary source agreed with the value when this
 * course was written. `check: false` means it comes from memory of the paper's figure, so read it
 * in the PDF before you quote it. See papers/01-horowitz/VERIFY.md.
 */
(function () {
  'use strict';
  var MLS = window.MLS;
  var hw = (MLS.hw = MLS.hw || {});

  /* pJ per operation. "sram" and "dram" rows are per 64-bit access, as in the paper's figure. */
  hw.energyRows = [
    { id: 'add8', group: 'Integer add', label: '8-bit add', pj: 0.03, check: false },
    { id: 'add16', group: 'Integer add', label: '16-bit add', pj: 0.05, check: false },
    { id: 'add32', group: 'Integer add', label: '32-bit add', pj: 0.1, check: true },
    { id: 'mul8', group: 'Integer multiply', label: '8-bit multiply', pj: 0.2, check: false },
    { id: 'mul32', group: 'Integer multiply', label: '32-bit multiply', pj: 3.1, check: true },
    { id: 'fadd16', group: 'Floating point', label: '16-bit float add', pj: 0.4, check: true },
    { id: 'fadd32', group: 'Floating point', label: '32-bit float add', pj: 0.9, check: false },
    { id: 'fmul16', group: 'Floating point', label: '16-bit float multiply', pj: 1.1, check: false },
    { id: 'fmul32', group: 'Floating point', label: '32-bit float multiply', pj: 3.7, check: true },
    { id: 'sram8k', group: 'Memory read (64-bit)', label: '8 KB SRAM', pj: 10, check: true },
    { id: 'sram32k', group: 'Memory read (64-bit)', label: '32 KB SRAM', pj: 20, check: false },
    { id: 'sram1m', group: 'Memory read (64-bit)', label: '1 MB SRAM', pj: 100, check: true },
    { id: 'dram', group: 'Memory read (64-bit)', label: 'Off-chip DRAM (low end)', pj: 1300, check: true },
    { id: 'dramhi', group: 'Memory read (64-bit)', label: 'Off-chip DRAM (high end)', pj: 2600, check: true }
  ];

  hw.energy = {};
  hw.energyRows.forEach(function (r) {
    hw.energy[r.id] = r.pj;
  });

  /* Our assumption for the lessons: energy of a 32-bit word. Half of the 64-bit figure. */
  hw.wordPj = { sram8k: hw.energy.sram8k / 2, dram: hw.energy.dram / 2 };

  /* Large numbers with units, used by several widgets. */
  hw.si = function (v, unit) {
    var a = Math.abs(v);
    if (a >= 1e12) return MLS.fmt(v / 1e12, a >= 1e13 ? 0 : 1) + ' T' + unit;
    if (a >= 1e9) return MLS.fmt(v / 1e9, a >= 1e10 ? 0 : 1) + ' G' + unit;
    if (a >= 1e6) return MLS.fmt(v / 1e6, a >= 1e7 ? 0 : 1) + ' M' + unit;
    if (a >= 1e3) return MLS.fmt(v / 1e3, a >= 1e4 ? 0 : 1) + ' k' + unit;
    if (a >= 1) return MLS.fmt(v, a >= 10 ? 0 : 1) + ' ' + unit;
    if (a >= 1e-3) return MLS.fmt(v * 1e3, a >= 1e-2 ? 0 : 1) + ' m' + unit;
    if (a >= 1e-6) return MLS.fmt(v * 1e6, a >= 1e-5 ? 0 : 1) + ' u' + unit;
    return MLS.fmt(v * 1e9, 1) + ' n' + unit;
  };

  /* Energy given in pJ, shown in the most readable unit. */
  hw.pj = function (pj) {
    if (pj >= 1e12) return MLS.fmt(pj / 1e12, 2) + ' J';
    if (pj >= 1e9) return MLS.fmt(pj / 1e9, 2) + ' mJ';
    if (pj >= 1e6) return MLS.fmt(pj / 1e6, 1) + ' uJ';
    if (pj >= 1e3) return MLS.fmt(pj / 1e3, 1) + ' nJ';
    if (pj >= 100) return MLS.fmt(pj, 0) + ' pJ';
    if (pj >= 10) return MLS.fmt(pj, 1) + ' pJ';
    return MLS.fmt(pj, 2) + ' pJ';
  };

  /* A thousands separator for whole numbers. */
  hw.int = function (n) {
    return Math.round(n).toLocaleString('en-US');
  };
})();
