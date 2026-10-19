/*
 * Recomputes every numeric practice answer in lesson-3.js from the numbers stated in each problem,
 * then checks that the lesson's `check: { answer: ... }` values match, in order.
 *
 *   node papers/01-horowitz/experiments/practice-answers.cjs
 */
const fs = require('fs');
const path = require('path');

const mac32 = 3.7 + 0.9; // pJ, 32-bit float multiply-add (arithmetic only)
const dramWord = 650; // pJ per 32-bit DRAM word (half of 1.3 nJ per 64-bit read)
const sramWord = 5; // pJ per 32-bit word from an 8 KB SRAM (half of 10 pJ)

const expected = [];
const note = (name, value, shown) => {
  expected.push(value);
  console.log(name.padEnd(4), String(shown === undefined ? value : shown));
};

// S1: 2e12 multiplies per second at 3.1 pJ
note('S1', 3.1e-12 * 2e12);
// S2: 1.3 nJ / 0.1 pJ
note('S2', (1.3e3) / 0.1);
// S3: 0.7 * 0.7^2 * 1.43
note('S3', 0.7 * 0.7 ** 2 * 1.43, (0.7 * 0.7 ** 2 * 1.43).toFixed(4));
// M4: 50e6 MACs, arithmetic plus 3 SRAM words, in uJ
note('M4', (50e6 * (mac32 + 3 * sramWord)) / 1e6);
// M5: arithmetic share of the DRAM case, percent
note('M5', (mac32 / (mac32 + 3 * dramWord)) * 100, ((mac32 / (mac32 + 3 * dramWord)) * 100).toFixed(4));
// M6: reuse of 64, DRAM case
note('M6', (mac32 + 3 * dramWord) / (mac32 + (3 * dramWord) / 64), ((mac32 + 3 * dramWord) / (mac32 + (3 * dramWord) / 64)).toFixed(3));
// M7: voltage stuck, clock held, 3 generations
const perGen = 0.7 * (1 / 0.49);
note('M7', (1 / perGen ** 3) * 100, ((1 / perGen ** 3) * 100).toFixed(2));
// H8: smallest reuse for 2 W, 724 M MACs at 30 per second
const budget = 2 / (724e6 * 30) / 1e-12;
const R = (3 * dramWord) / (budget - mac32);
note('H8', R, R.toFixed(3) + ' (budget per MAC ' + budget.toFixed(2) + ' pJ)');
// H9: smallest whole W with 70% arithmetic, 45 pJ overhead
let W = 1;
while ((mac32 * W) / (45 + mac32 * W) < 0.7) W++;
note('H9', W, W + ' (share at W-1: ' + (((mac32 * (W - 1)) / (45 + mac32 * (W - 1))) * 100).toFixed(1) + '%, at W: ' + (((mac32 * W) / (45 + mac32 * W)) * 100).toFixed(1) + '%)');
// H10: int8 versus float, DRAM, no reuse
const int8 = 0.2 + 0.03;
const ratio = (mac32 + 3 * dramWord) / (int8 + 3 * (dramWord / 4));
note('H10', ratio, ratio.toFixed(3));
console.log('     reuse 256 ratio', ((mac32 + (3 * dramWord) / 256) / (int8 + (3 * dramWord) / 4 / 256)).toFixed(2));

// Compare with the lesson text.
const src = fs.readFileSync(path.join(__dirname, '..', 'lesson-3.js'), 'utf8');
const found = [...src.matchAll(/check:\s*\{\s*answer:\s*([0-9.eE+-]+)/g)].map((m) => parseFloat(m[1]));
let ok = found.length === expected.length;
if (!ok) console.error(`lesson has ${found.length} numeric answers, script computes ${expected.length}`);
found.forEach((f, i) => {
  const e = expected[i];
  const rel = Math.abs(f - e) / Math.abs(e);
  if (rel > 0.03) {
    ok = false;
    console.error(`answer ${i + 1}: lesson says ${f}, script computes ${e}`);
  }
});
console.log(ok ? 'OK: lesson answers match the script (within 3%).' : 'MISMATCH');
process.exit(ok ? 0 : 1);
