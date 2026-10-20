/*
 * Recomputes every number in the Paper 3 lesson that comes from our own arithmetic: operational
 * intensities of kernels, ridge points, tiling, neural network layers, and all numeric practice
 * answers. Then it checks that the lesson's practice `check` values (in lesson-3.js) match.
 *
 *   node papers/03-roofline/experiments/numbers.cjs
 */
const fs = require('fs');
const path = require('path');
const out = (s) => console.log(s);
const att = (m, oi) => Math.min(m.peak, m.bw * oi);

const cpu = { peak: 100, bw: 25 };
const gpu = { peak: 100000, bw: 1000 };
const acc = { peak: 92000, bw: 34 };
out('ridge: cpu ' + cpu.peak / cpu.bw + ', gpu ' + gpu.peak / gpu.bw + ', acc ' + (acc.peak / acc.bw).toFixed(1));

// Bakery
out('bakery: ' + Math.min(100, 25 * (1 / 0.5)) + ' loaves per hour at 2 loaves per kg');

// Kernels, 32-bit values
const b = 4;
out('vector add ' + (1 / (3 * b)).toFixed(4) + ' -> reachable on cpu ' + att(cpu, 1 / (3 * b)).toFixed(2) + ' (' + ((att(cpu, 1 / (3 * b)) / cpu.peak) * 100).toFixed(1) + '% of peak)');
out('dot product ' + 1 / b + ', saxpy ' + (2 / (3 * b)).toFixed(3) + ', matvec ' + 2 / b + ', tile32 ' + 32 / b + ', perfect 1024 ' + ((2 * 1024) / (3 * b)).toFixed(1));

// Matmul by hand
out('naive matmul: 2 ops per 8 bytes = ' + 2 / 8);
for (const T of [2, 4, 8, 16, 32, 64, 128, 256, 512]) {
  const foot = 3 * T * T * 4;
  out('tile ' + String(T).padStart(3) + ' footprint ' + foot + ' B, fits 32K ' + (foot <= 32768) + ', 256K ' + (foot <= 262144) + ', 1M ' + (foot <= 1048576) + ', OI ' + T / 4);
}
out('N=2048, 1 MB: T=8 -> ' + att(cpu, 8 / 4) + ', T=16 -> ' + att(cpu, 16 / 4) + ', T=512 does not fit -> ' + att(cpu, 0.25));

// Layers
const conv = ({ n = 1, c, m, h, r, u, p }) => {
  const e = Math.floor((h + 2 * p - r) / u) + 1;
  return { macs: n * m * e * e * c * r * r, weights: m * c * r * r, ifmap: c * h * h, ofmap: m * e * e };
};
const L = {
  conv1: conv({ c: 3, m: 96, h: 227, r: 11, u: 4, p: 0 }),
  conv3: conv({ c: 256, m: 384, h: 13, r: 3, u: 1, p: 1 }),
  vgg1: conv({ c: 3, m: 64, h: 224, r: 3, u: 1, p: 1 }),
  one: conv({ c: 256, m: 64, h: 56, r: 1, u: 1, p: 0 }),
  fc6: { macs: 9216 * 4096, weights: 9216 * 4096, ifmap: 9216, ofmap: 4096 }
};
const oi = (g, N, bytes, wOnly) => (2 * N * g.macs) / (bytes * (g.weights + (wOnly ? 0 : N * (g.ifmap + g.ofmap))));
for (const [name, g] of Object.entries(L)) {
  out(name.padEnd(6) + ' int8 b1: ' + oi(g, 1, 1, false).toFixed(1) + ', weights only: ' + oi(g, 1, 1, true).toFixed(1) + ', fp32 b1: ' + oi(g, 1, 4, false).toFixed(1) + ', int8 b256: ' + oi(g, 256, 1, false).toFixed(1));
}
const pct = (m, v) => ((att(m, v) / m.peak) * 100).toFixed(3);
out('acc FC6 int8 batch 1: ' + oi(L.fc6, 1, 1, false).toFixed(3) + ' ops/B -> ' + pct(acc, oi(L.fc6, 1, 1, false)) + '% of peak');
out('acc FC6 int8 batch 256: ' + oi(L.fc6, 256, 1, false).toFixed(1) + ' ops/B -> ' + pct(acc, oi(L.fc6, 256, 1, false)) + '% of peak');
out('acc CONV1 int8 batch 1 (all traffic): ' + oi(L.conv1, 1, 1, false).toFixed(1) + ' -> ' + pct(acc, oi(L.conv1, 1, 1, false)) + '%; weights only: ' + oi(L.conv1, 1, 1, true).toFixed(0));

// Practice answers
const expected = [];
const answer = (name, v, detail) => {
  expected.push(v);
  out(name.padEnd(4) + Number(v.toPrecision(6)) + (detail ? '  ' + detail : ''));
};
// P1-P2: machine 320 G ops/s, 40 GB/s
const m1 = { peak: 320, bw: 40 };
answer('P1', m1.peak / m1.bw);
// P2: 120 operations per 40 bytes -> intensity 3
answer('P2', att(m1, 120 / 40), 'intensity ' + 120 / 40);
// P3: dot product of 16-bit values, 2 operations per two 2-byte values
answer('P3', 2 / (2 * 2));
// P4: tile 12, 32-bit values, machine 100 / 25
answer('P4', att(cpu, 12 / 4), 'intensity ' + 12 / 4);
// P5: smallest power-of-two tile reaching peak on 200 G ops/s, 25 GB/s (ridge 8)
let T = 1;
while (T / 4 < 200 / 25) T *= 2;
answer('P5', T);
// P6: largest power-of-two tile in a 2 MB cache, three tiles of 32-bit values
let big = 1;
while (3 * (big * 2) * (big * 2) * 4 <= 2 * 1024 * 1024) big *= 2;
answer('P6', big, 'footprint ' + 3 * big * big * 4 + ' B; next ' + 3 * 4 * big * big * 4 + ' B');
// P7: FC layer 8-bit, weights only, peak 120 T ops/s, 60 GB/s: smallest batch to reach peak
const r7 = 120000 / 60;
answer('P7', Math.ceil(r7 / 2), 'ridge ' + r7);
// P8: equal operations at intensity 1 and 16 on 100 / 25; speed-up from doubling bandwidth
const t0 = 1 / att(cpu, 1) + 1 / att(cpu, 16);
const t1 = 1 / att({ peak: 100, bw: 50 }, 1) + 1 / att({ peak: 100, bw: 50 }, 16);
const t2 = 1 / att({ peak: 200, bw: 25 }, 1) + 1 / att({ peak: 200, bw: 25 }, 16);
answer('P8', t0 / t1, 'double compute: ' + (t0 / t2).toFixed(3));
// P9: peak 64 T ops/s, bandwidth 25 -> 160 GB/s: new ridge
answer('P9', 64000 / 160, 'old ridge ' + 64000 / 25);
// P10: 3,000 G ops in 60 s, 600 GB moved, machine 100 / 25: share of the roof
const achieved = 3000 / 60;
const oi10 = 3000 / 600;
answer('P10', (achieved / att(cpu, oi10)) * 100, 'achieved ' + achieved + ', OI ' + oi10 + ', roof ' + att(cpu, oi10));

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
