/*
 * Recomputes every number in the Paper 6 lesson that comes from our own arithmetic or from the toy
 * models: layer sizes, energy ratios, the pruning and weight-sharing widgets, the sparse format,
 * the storage calculator, the race, the energy waterfall, and all numeric practice answers.
 * It fails (exit code 1) when a number quoted in the lesson no longer matches.
 *
 *   node papers/06-eie/experiments/numbers.cjs
 */
const fs = require('fs');
const path = require('path');
require('../sim.js');
const E = globalThis.EIE;

let failures = 0;
const out = (s) => console.log(s);
function expect(name, actual, wanted, tol) {
  const t = tol === undefined ? 0.005 : tol;
  const ok = Math.abs(actual - wanted) <= Math.abs(wanted) * t + 1e-12;
  if (!ok) failures++;
  out((ok ? '  ok   ' : '  FAIL ') + name + ': ' + Number(actual.toPrecision(6)) + (ok ? '' : ' (lesson says ' + wanted + ')'));
}
function section(title) {
  out('\n' + title);
}

/* Paper 1 energies, as in assets/js/hw.js */
const DRAM = 650; // pJ per 32-bit word: half of 1.3 nJ per 64-bit
const SRAM = 5; // pJ per 32-bit word: half of 10 pJ per 64-bit, 8 KB
const MUL = 3.7;
const ADD = 0.9;

section('Layer sizes (Part 1)');
const byId = Object.fromEntries(E.layers.map((l) => [l.id, l]));
expect('AlexNet FC6 weights', E.layerWeights(byId.a6), 37748736, 0);
expect('AlexNet FC6 MB at 32 bits', (E.layerWeights(byId.a6) * 4) / 1e6, 151.0, 0.001);
expect('VGG-16 FC6 / AlexNet FC6', E.layerWeights(byId.v6) / E.layerWeights(byId.a6), 2.72, 0.01);
const alexFc = E.sumWeights(['a6', 'a7', 'a8']);
const vggFc = E.sumWeights(['v6', 'v7', 'v8']);
expect('AlexNet FC6+FC7+FC8 weights (million)', alexFc / 1e6, 58.6, 0.001);
expect('AlexNet FC6+FC7+FC8 MB at 32 bits', (alexFc * 4) / 1e6, 234.5, 0.001);
expect('VGG-16 FC weights (million)', vggFc / 1e6, 123.6, 0.001);
expect('songs for FC6 at 4 MB', Math.round((E.layerWeights(byId.a6) * 4) / 1e6 / 4), 38, 0);

section('Cost of reading (Part 1)');
expect('DRAM read over multiply plus add', DRAM / (MUL + ADD), 141, 0.005);
expect('batch 1, weights in DRAM, pJ per multiply-add', DRAM + MUL + ADD, 654.6, 0.001);
expect('batch 1, weights in SRAM, pJ per multiply-add', SRAM + MUL + ADD, 9.6, 0.001);
expect('DRAM share of energy at batch 1 (%)', (DRAM / (DRAM + MUL + ADD)) * 100, 99.3, 0.001);
const sizes = [1, 2, 4, 8, 16, 32, 64, 128, 256];
const firstMathWins = sizes.filter((b) => DRAM / b < MUL + ADD)[0];
expect('first slider batch size where math costs more than the DRAM read', firstMathWins, 256, 0);
expect('read cost at batch 128 is still above the math', DRAM / 128 > MUL + ADD ? 1 : 0, 1, 0);
expect('break-even batch size (exact)', DRAM / (MUL + ADD), 141, 0.005);

section('Pruning widget (Part 2)');
const w = E.laplace(E.pruneToy ? E.pruneToy.n * E.pruneToy.n : 256, 7);
expect('50% pruned: output change (%)', E.prune(w, 50).change * 100, 18.6, 0.01);
expect('90% pruned: weights left', E.prune(w, 90).kept, 26, 0);
expect('25% pruned: output change (%)', E.prune(w, 25).change * 100, 5.4, 0.02);

section('Weight sharing widget (Part 2)');
const vals = E.laplace(80, 11);
const errs = [1, 2, 3, 4].map((b) => E.kmeans1d(vals, 1 << b).error * 100);
expect('1 bit error (%)', errs[0], 66.3, 0.01);
expect('2 bits error (%)', errs[1], 43.4, 0.01);
expect('3 bits error (%)', errs[2], 17.3, 0.01);
expect('4 bits error (%)', errs[3], 9.4, 0.01);
expect('smallest bits with error under 20%', [1, 2, 3, 4].filter((b, i) => errs[i] < 20)[0], 3, 0);
expect('8 times smaller at 4 bits', 32 / 4, 8, 0);

section('Sparse column format (Part 2)');
const cols = E.cscToy ? E.cscToy.cols : null;
if (!cols) {
  // sim.js does not define the CSC toy (it lives in widgets-2.js); rebuild it from the widget source
  const src = fs.readFileSync(path.join(__dirname, '..', 'widgets-2.js'), 'utf8');
  const m = /EIE\.cscToy = \{\s*cols: (\[[\s\S]*?\n    \]),\s*rows: 8/.exec(src);
  global.__cols = eval(m[1]);
}
const toyCols = cols || global.__cols;
const enc = E.cscEncode(toyCols);
expect('stored entries', enc.entries.length, 17, 0);
expect('pointer list', enc.ptr.join(',') === '0,2,2,6,7,9,12,14,17' ? 1 : 0, 1, 0);
let roundTrip = true;
toyCols.forEach((col, j) => {
  const back = E.cscDecode(enc, j);
  if (JSON.stringify(back) !== JSON.stringify(col)) roundTrip = false;
});
expect('decode(encode(book)) equals the book, every column', roundTrip ? 1 : 0, 1, 0);
expect('column 2 rows', E.cscDecode(enc, 2).map((e) => e[0]).join(',') === '0,2,3,7' ? 1 : 0, 1, 0);
expect('column 1 is empty', E.cscDecode(enc, 1).length, 0, 0);
expect('dense bits over stored bits', (8 * 8 * 32) / (17 * 8), 15, 0.01);

section('Storage calculator (Part 2)');
const cap = E.chip.capacityBytes;
expect('chip memory, MB (64 PEs x 131,072 bytes)', cap / 1e6, 8.4, 0.005);
const a10 = E.compress(alexFc, 10, 4, 4);
expect('AlexNet FC at 10%, 8 bits: MB (lesson rounds to 5.9)', a10.bytes / 1e6, 5.9, 0.01);
expect('AlexNet FC at 10%, 8 bits: times smaller', a10.ratio, 40, 0.001);
expect('highest whole percent that fits AlexNet FC', [...Array(100).keys()].map((i) => i + 1).filter((d) => E.compress(alexFc, d, 4, 4).fits).pop(), 14, 0);
expect('highest whole percent that fits VGG-16 FC', [...Array(100).keys()].map((i) => i + 1).filter((d) => E.compress(vggFc, d, 4, 4).fits).pop(), 6, 0);
expect('quiz: 10 million weights, 10% kept, 8 bits: MB', E.compress(10e6, 10, 4, 4).bytes / 1e6, 1, 0);

section('Zero skipping widget (Part 3)');
const zero = { inputs: [2.4, -1.8, -0.4, 0.7, -3.1, -0.9, 1.6, -2.2, 3.2, -0.5, -1.1, -0.9], entries: [10, 7, 12, 9, 6, 11, 8, 10, 7, 12, 9, 8] };
const live = zero.inputs.map((v, j) => (v > 0 ? j : -1)).filter((j) => j >= 0);
expect('columns read after ReLU', live.length, 4, 0);
expect('entries read after ReLU', live.reduce((a, j) => a + zero.entries[j], 0), 34, 0);
expect('entries in the whole book', zero.entries.reduce((a, b) => a + b, 0), 109, 0);
expect('share of entries read (%)', (34 / 109) * 100, 31, 0.02);

section('Rows dealt out to cooks (Part 3)');
const pm = E.makeBook(16, 8, 0.3, 16);
const split = pm.map((c) => E.split(c, 4));
expect('toy book entries', pm.reduce((a, c) => a + c.length, 0), 37, 0);
expect('column 3 has 8 entries', pm[3].length, 8, 0);
expect('column 3: busiest cook', split[3].indexOf(Math.max(...split[3])), 1, 0);
expect('column 3: busiest cook has', Math.max(...split[3]), 3, 0);
expect('column 7: busiest cook', split[7].indexOf(Math.max(...split[7])), 3, 0);

section('The race (Part 3)');
const SEEDS = { 2: 3, 4: 103, 8: 60 };
function race(n, seed, D) {
  return E.race(E.makeBook(16 * n, 64, 0.1, seed), E.makeOrders(64, 0.5, 1000 + seed), n, D);
}
for (const n of [2, 4, 8]) {
  const mean = {};
  for (const D of [1, 2, 4, 8]) {
    let t = 0;
    for (let s = 1; s <= 200; s++) t += race(n, s, D).t;
    mean[D] = t / 200;
  }
  let best = null;
  for (let s = 1; s <= 200; s++) {
    const d = [1, 2, 4, 8].reduce((a, D) => a + Math.abs(race(n, s, D).t - mean[D]), 0);
    if (!best || d < best.d) best = { s, d };
  }
  expect(n + ' cooks: widget seed is the book closest to the 200-book average', SEEDS[n], best.s, 0);
  out('       mean cycles over 200 books at depth 1, 2, 4, 8: ' + [1, 2, 4, 8].map((D) => mean[D].toFixed(1)).join(', '));
}
const r1 = race(4, 103, 1);
const r2 = race(4, 103, 2);
const r4 = race(4, 103, 4);
const r8 = race(4, 103, 8);
expect('4 cooks, depth 1: cycles', r1.t, 76, 0);
expect('4 cooks, depth 2: cycles', r2.t, 66, 0);
expect('4 cooks, depth 4: cycles', r4.t, 62, 0);
expect('4 cooks, depth 8: cycles', r8.t, 58, 0);
expect('4 cooks: cycles if shared perfectly', r1.ideal, 51, 0);
expect('4 cooks, depth 1: cooks busy (%)', r1.utilization() * 100, 67, 0.01);
expect('4 cooks, depth 8: cooks busy (%)', r8.utilization() * 100, 88, 0.01);
expect('cycles saved by depth 8', r1.t - r8.t, 18, 0);
expect('cycles saved by depth 4', r1.t - r4.t, 14, 0);
const book4 = E.makeBook(64, 64, 0.1, 103);
const ord4 = E.makeOrders(64, 0.5, 1103);
const totals = [0, 0, 0, 0];
r1.active.forEach((j) => E.split(book4[j], 4).forEach((c, p) => (totals[p] += c)));
expect('busiest cook entries', Math.max(...totals), 57, 0);
expect('average entries per cook', totals.reduce((a, b) => a + b, 0) / 4, 51, 0.005);
expect('unlimited queue (depth 64) takes the same as depth 8', race(4, 103, 64).t, 58, 0);
expect('8 cooks at depth 1: cooks busy (%)', race(8, 60, 1).utilization() * 100, 62, 0.01);
expect('8 cooks are less busy than 4 at depth 1', race(8, 60, 1).utilization() < r1.utilization() ? 1 : 0, 1, 0);
expect('non-zero orders in the default race', r1.active.length, 31, 0);

section('Quiz checks');
const rowsFrom = (skips) => {
  let row = -1;
  return skips.map((k) => (row = row + k + 1));
};
expect('store quiz: skips 3, 0, 1 give rows 3, 4, 6', rowsFrom([3, 0, 1]).join(',') === '3,4,6' ? 1 : 0, 1, 0);
expect('final quiz: skips 1, 0, 2 give rows 1, 2, 5', rowsFrom([1, 0, 2]).join(',') === '1,2,5' ? 1 : 0, 1, 0);
expect('practice: skips 2, 0, 3 give rows 2, 3, 7', rowsFrom([2, 0, 3]).join(',') === '2,3,7' ? 1 : 0, 1, 0);
expect('final quiz: row 10 belongs to cook 10 mod 4', 10 % 4, 2, 0);
expect('final quiz option: running total of skips 1, 0, 2 is 1, 1, 3', [1, 1 + 0, 1 + 0 + 2].join(',') === '1,1,3' ? 1 : 0, 1, 0);

section('Energy waterfall (Part 3)');
const st = E.energyStages({ dramPj: DRAM, sramPj: SRAM, density: 0.1, codeBits: 4, indexBits: 4, inputShare: 0.33 });
expect('stage 2 factor (DRAM to SRAM)', st[0] / st[1], 130, 0);
expect('stage 3 factor (pruning)', st[1] / st[2], 10, 0.001);
expect('stage 4 factor (shared codes plus skip counts)', st[2] / st[3], 4, 0.001);
expect('stage 5 factor (zero inputs, 33% non-zero)', st[3] / st[4], 3.03, 0.001);
expect('all four together', st[0] / st[4], 15758, 0.001);
const noIdx = E.energyStages({ dramPj: DRAM, sramPj: SRAM, density: 0.1, codeBits: 4, indexBits: 0, inputShare: 0.33 });
expect('sharing step with 0 skip bits', noIdx[2] / noIdx[3], 8, 0.001);
expect('math per original weight (pJ)', (MUL + ADD) * 0.1 * 0.33, 0.152, 0.01);
expect('final read energy (pJ)', st[4], 0.041, 0.01);
expect('final read is cheaper than the math', st[4] < (MUL + ADD) * 0.1 * 0.33 ? 1 : 0, 1, 0);
expect('abstract factors multiplied', 120 * 10 * 8 * 3, 28800, 0);

section('Consistency of numbers quoted from the paper');
expect('64 PEs x 0.638 mm2', 64 * 0.638, 40.8, 0.005);
expect('64 PEs x 9.16 mW', 64 * 9.16, 586, 0.01);
expect('64 PEs x 800 MHz x 2 ops (GOPS)', (64 * 0.8 * 2), 102.4, 0.001);
expect('102.4 GOPS over (10% x 33%) in TOPS', 102.4 / (0.1 * 0.33) / 1000, 3.1, 0.01);
expect('1.88e4 frames per second, microseconds each', 1e6 / 1.88e4, 53.2, 0.005);

section('Practice answers (in the order they appear in lesson-3.js)');
const expected = [];
const answer = (name, v, detail) => {
  expected.push(v);
  out('  ' + name.padEnd(4) + Number(v.toPrecision(7)) + (detail ? '   ' + detail : ''));
};
answer('S1', 40 * 5 + 100 * 3);
answer('S2', (2048 * 1000 * 4) / 1e6);
answer('S3', (() => { let row = -1; for (const skip of [2, 0, 3]) row = row + skip + 1; return row; })(), 'rows 2, 3, 7');
answer('S4', 12 - 7, 'column 1 is empty: 3 - 3 = 0');
const w4096 = 4096 * 4096;
answer('M1', (w4096 * 0.08 * 8) / 8 / 1e6, 'dense MB ' + (w4096 * 4) / 1e6 + ', ratio ' + ((w4096 * 4) / ((w4096 * 0.08 * 8) / 8)).toFixed(1) + ', at 32 bits ' + ((w4096 * 0.08 * 4) / 1e6).toFixed(2) + ' MB');
const m2 = 4096 * 0.3 * (4096 * 0.08);
answer('M2', m2, 'dense ' + w4096 + ', ratio ' + (w4096 / m2).toFixed(1) + ', every column ' + Math.round(4096 * 4096 * 0.08));
answer('M3', (w4096 * DRAM) / (m2 * SRAM * (8 / 32)), 'dense ' + (w4096 * DRAM) / 1e9 + ' mJ, compressed ' + (m2 * SRAM * (8 / 32)) / 1e6 + ' uJ');
const h1layers = [
  { ins: 9216, outs: 4096, d: 0.09 },
  { ins: 4096, outs: 4096, d: 0.09 },
  { ins: 4096, outs: 1000, d: 0.25 }
];
const macs = h1layers.map((l) => l.ins * 0.3 * (l.outs * l.d));
const totalMacs = macs.reduce((a, b) => a + b, 0);
const cycles = totalMacs / 64;
const idealUs = (cycles / 800e6) * 1e6;
answer('H1', 1 / (idealUs / 0.7 / 1e6), 'macs ' + macs.map((m) => Math.round(m)).join(' + ') + ' = ' + Math.round(totalMacs) + ', cycles ' + Math.round(cycles) + ', ideal ' + idealUs.toFixed(2) + ' us, at 70% ' + (idealUs / 0.7).toFixed(2) + ' us; versus the paper 18,800: ' + (((1 / (idealUs / 0.7 / 1e6)) / 18800 - 1) * 100).toFixed(1) + '%');
answer('H2', 102.4 / (0.1 * 0.33) / 1000);
const cv = (n) => Math.sqrt(0.9 / (0.1 * n));
answer('H3', cv(600 / 64) / cv(64), 'cv(64 rows) ' + cv(64).toFixed(3) + ', cv(9.375 rows) ' + cv(600 / 64).toFixed(3));

const file = path.join(__dirname, '..', 'lesson-3.js');
const src = fs.readFileSync(file, 'utf8');
const found = [...src.matchAll(/check:\s*\{\s*answer:\s*([0-9.eE+-]+)/g)].map((m) => parseFloat(m[1]));
if (found.length !== expected.length) {
  failures++;
  out('  FAIL lesson has ' + found.length + ' numeric answers, script computes ' + expected.length);
}
found.forEach((f, i) => {
  if (Math.abs(f - expected[i]) / Math.abs(expected[i]) > 0.01) {
    failures++;
    out('  FAIL answer ' + (i + 1) + ': lesson says ' + f + ', script computes ' + expected[i]);
  }
});

out(failures ? '\nMISMATCH: ' + failures + ' check(s) failed.' : '\nOK: every number in the lesson matches the script.');
process.exit(failures ? 1 : 0);
