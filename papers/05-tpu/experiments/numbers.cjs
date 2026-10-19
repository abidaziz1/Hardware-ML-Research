/*
 * Recomputes every number in the Paper 5 lesson that comes from our own arithmetic: peak and ridge,
 * the weight tile balance, systolic array timing, the roofline bounds, the batch and latency model,
 * the energy estimates, and all numeric practice answers. Then it checks that the lesson's practice
 * `check` values (in lesson-3.js) match, in order.
 *
 *   node papers/05-tpu/experiments/numbers.cjs
 */
const fs = require('fs');
const path = require('path');
const out = (s) => console.log(s);

const macs = 65536;
const clk = 700e6;
const bw = 34e9;
const peak = macs * clk * 2;
out('peak ' + (peak / 1e12).toFixed(2) + ' TOPS, ridge ' + ((macs * clk) / bw).toFixed(1) + ' MACs per weight byte (' + ((peak / bw)).toFixed(0) + ' ops per byte)');
out('tile 65,536 B load: ' + ((65536 / bw) * 1e6).toFixed(3) + ' us = ' + (65536 / (bw / clk)).toFixed(1) + ' cycles');
out('Unified Buffer 24 MiB = ' + 24 * 1048576 + ' bytes; accumulators 4096 x 256 x 4 B = ' + (4096 * 256 * 4) / 1048576 + ' MiB');
out('buffer accesses per MAC: ' + (256 + 256) / macs);
out('one multiply instruction on 256 vectors: ' + 256 * macs + ' MACs; 1 nJ overhead = ' + (1000 / (256 * macs)).toExponential(2) + ' pJ per MAC');
for (const [n, T] of [[3, 1], [3, 6], [2, 8], [4, 5], [256, 1]]) out('systolic ' + n + 'x' + n + ', T=' + T + ': ' + (T + 2 * n - 2) + ' cycles, busy ' + ((T / (T + 2 * n - 2)) * 100).toFixed(1) + '%');

// Roofline bounds for the six workloads (MACs per weight byte from memory of the paper)
const apps = { MLP0: 200, MLP1: 168, LSTM0: 64, LSTM1: 96, CNN0: 2888, CNN1: 1750 };
for (const [k, v] of Object.entries(apps)) {
  const b1 = Math.min(peak, bw * v * 2) / 1e12;
  const b2 = Math.min(peak, 180e9 * v * 2) / 1e12;
  out(k.padEnd(6) + 'bound ' + b1.toFixed(1) + ' TOPS (' + ((b1 * 1e12 / peak) * 100).toFixed(0) + '%), with 180 GB/s ' + b2.toFixed(1) + ' TOPS');
}
out('faster memory ridge ' + ((macs * clk) / 180e9).toFixed(1) + ' MACs per byte');

// Batch and latency toy model: mean = 2 ms + 0.01 ms x B
for (const [name, tail] of [['variable', 1.75], ['deterministic', 1]]) {
  for (const L of [7, 20, 3]) {
    const maxB = Math.floor((L / tail - 2) / 0.01);
    out(name + ' limit ' + L + ': batch ' + maxB + (maxB > 0 ? ', throughput ' + (maxB / (2 + 0.01 * maxB)).toFixed(1) + ' per ms' : ''));
  }
}

// Energy per weight byte with Paper 1's numbers
for (const V of [1, 200, 1350, 3136]) out('V=' + V + ': weight DRAM ' + (162.5 / V).toFixed(3) + ' pJ per MAC vs 0.23 pJ MAC (' + (162.5 / V / 0.23).toFixed(2) + 'x)');
out('break-even V ' + (162.5 / 0.23).toFixed(0));

// Practice answers
const expected = [];
const answer = (name, v, detail) => {
  expected.push(v);
  out(name.padEnd(4) + Number(v.toPrecision(6)) + (detail ? '  ' + detail : ''));
};
answer('P1', (128 * 128 * 1e9 * 2) / 1e12);
answer('P2', (2048 * 128 * 4) / 1024);
answer('P3', ((128 * 128) / bw) * 1e6);
answer('P4', (16384 * 1e9) / 50e9);
answer('P5', (bw * 100 * 2) / 1e12);
answer('P6', 1349 / 2);
answer('P7', (4 / (4 + 2 * 128 - 2)) * 100, 'cycles ' + (4 + 2 * 128 - 2));
answer('P8', (macs * clk * 0.23e-12));
answer('P9', (macs * clk) / 180e9);
answer('P10', ((9 - 1) / 0.02) / ((9 / 1.5 - 1) / 0.02));

const file = path.join(__dirname, '..', 'lesson-3.js');
if (fs.existsSync(file)) {
  const src = fs.readFileSync(file, 'utf8');
  const found = [...src.matchAll(/check:\s*\{\s*answer:\s*([0-9.eE+-]+)/g)].map((m) => parseFloat(m[1]));
  let ok = found.length === expected.length;
  if (!ok) console.error(`lesson has ${found.length} numeric answers, script computes ${expected.length}`);
  found.forEach((f, i) => {
    if (Math.abs(f - expected[i]) / Math.abs(expected[i]) > 0.03) {
      ok = false;
      console.error(`answer ${i + 1}: lesson says ${f}, script computes ${expected[i]}`);
    }
  });
  out(ok ? 'OK: lesson answers match the script (within 3%).' : 'MISMATCH');
  process.exit(ok ? 0 : 1);
} else out('(lesson-3.js not found yet, skipped the comparison)');
