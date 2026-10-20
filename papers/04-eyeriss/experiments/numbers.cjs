/*
 * Recomputes every number in the Paper 4 lesson that comes from our own arithmetic: layer shapes
 * and reuse counts, the one-PE row-stationary primitive, folding and utilization, the chip
 * figures, and all numeric practice answers. Then it checks that the lesson's practice `check`
 * values (in lesson-3.js) match, in order.
 *
 *   node papers/04-eyeriss/experiments/numbers.cjs
 */
const fs = require('fs');
const path = require('path');
const out = (s) => console.log(s);

// AlexNet layer shapes as the Eyeriss paper lists them (H is the padded input size)
const L = {
  conv1: { c: 3, m: 96, h: 227, r: 11, u: 4 },
  conv2: { c: 48, m: 256, h: 31, r: 5, u: 1 },
  conv3: { c: 256, m: 384, h: 15, r: 3, u: 1 },
  conv4: { c: 192, m: 384, h: 15, r: 3, u: 1 },
  conv5: { c: 192, m: 256, h: 15, r: 3, u: 1 },
  fc6: { c: 256, m: 4096, h: 6, r: 6, u: 1 }
};
for (const [k, v] of Object.entries(L)) {
  v.e = Math.floor((v.h - v.r) / v.u) + 1;
  const macs = v.m * v.e * v.e * v.c * v.r * v.r;
  const win = Math.min((v.r * v.r) / (v.u * v.u), v.e * v.e);
  out(k.padEnd(6) + 'E ' + v.e + ', MACs ' + (macs / 1e6).toFixed(1) + ' M, weight reuse(N=1) ' + v.e * v.e + ', ifmap reuse ' + Math.round(v.m * win) + ', accumulations ' + v.c * v.r * v.r);
}
let total = 0;
for (const k of ['conv1', 'conv2', 'conv3', 'conv4', 'conv5']) total += L[k].m * L[k].e * L[k].e * L[k].c * L[k].r * L[k].r;
out('AlexNet CONV MACs total ' + (total / 1e6).toFixed(0) + ' M');

// Row stationary primitive in one PE
function primitive(R, W) {
  const F = W - R + 1;
  const macs = R * F;
  const buf = R + W + F;
  const rf = 4 * macs;
  const eRs = macs * 1 + rf * 1 + buf * 6;
  const eNlr = macs * (1 + 4 * 6);
  return { F, macs, buf, rf, eRs, eNlr, bufNlr: 4 * macs };
}
for (const [R, W] of [[3, 7], [5, 13]]) {
  const p = primitive(R, W);
  out('primitive R=' + R + ' W=' + W + ': F ' + p.F + ', MACs ' + p.macs + ', buffer ' + p.buf + ' (NLR ' + p.bufNlr + '), RF ' + p.rf + ', energy RS ' + p.eRs + ' vs NLR ' + p.eNlr + ' (' + (p.eNlr / p.eRs).toFixed(2) + 'x), per MAC ' + (p.eRs / p.macs).toFixed(2));
}

// Folding onto a 12 x 14 array
function fold(R, E, PR = 12, PC = 14) {
  const stack = Math.max(1, Math.floor(PR / R));
  const passes = Math.ceil(E / PC);
  return { stack, passes, util: (stack * R * E) / (PR * PC * passes) };
}
for (const [name, R, E] of [['conv1', 11, 55], ['conv2', 5, 27], ['conv3', 3, 13]]) {
  const f = fold(R, E);
  out('fold ' + name + ': stack ' + f.stack + ', passes ' + f.passes + ', utilization ' + (f.util * 100).toFixed(1) + '%');
}

// Chip figure from the JSSC follow-up: 0.0029 DRAM accesses per MAC (AlexNet CONV, batch 4)
out('chip: worst case 4 accesses per MAC / 0.0029 = ' + (4 / 0.0029).toFixed(0) + 'x fewer; DRAM energy per MAC ' + (0.0029 * 200).toFixed(2) + ' (units of one MAC) against ' + 4 * 200);

// Practice answers
const expected = [];
const answer = (name, v, detail) => {
  expected.push(v);
  out(name.padEnd(4) + Number(v.toPrecision(6)) + (detail ? '  ' + detail : ''));
};
answer('P1', 8 * 13 * 13);
answer('P2', 96 * 3 * 3);
answer('P3', 7 * 21);
const p4 = primitive(4, 10);
answer('P4', p4.bufNlr / p4.buf, 'NLR ' + p4.bufNlr + ' vs RS ' + p4.buf);
const f5 = fold(6, 40);
answer('P5', f5.util * 100, 'stack ' + f5.stack + ', passes ' + f5.passes);
answer('P6', 1 / (128 * 5 * 5));
answer('P7', 0.01 * 200);
const eMix = 1 + 0.0029 * 200 + 0.15 * 6 + 0.3 * 2 + 3.5 * 1;
answer('P8', ((0.0029 * 200) / eMix) * 100, 'total ' + eMix.toFixed(2));
const f9 = fold(9, 30);
answer('P9', f9.util * 100, 'stack ' + f9.stack + ', passes ' + f9.passes);
answer('P10', (256 * 3 * 3) / (1 * 3 * 3), 'standard ' + 256 * 9 + ' vs depthwise ' + 9);

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
