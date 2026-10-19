/*
 * Recomputes every number in the Paper 2 lesson that comes from our own arithmetic:
 * layer shapes, MAC and weight counts, memory accesses, reuse, Winograd, depthwise cost, peak
 * throughput and all numeric practice answers. Then it checks that the lesson's practice
 * `check` values (in lesson-3.js) match, in order.
 *
 *   node papers/02-sze-survey/experiments/numbers.cjs
 */
const fs = require('fs');
const path = require('path');
const M = 1e6;
const out = (s) => console.log(s);

// ---- Popular networks, from layer shapes ------------------------------------------------------
// conv: [outH, outC, k, inCperGroup]; fc: [in, out]
function net(convs, fcs) {
  let macs = 0;
  let weights = 0;
  for (const [e, m, k, c] of convs) {
    macs += e * e * m * k * k * c;
    weights += m * k * k * c;
  }
  for (const [i, o] of fcs) {
    macs += i * o;
    weights += i * o;
  }
  return { macs, weights };
}
const lenet = net([[24, 20, 5, 1], [8, 50, 5, 20]], [[800, 500], [500, 10]]); // Caffe LeNet, 28 x 28 input
const alex = net([[55, 96, 11, 3], [27, 256, 5, 48], [13, 384, 3, 256], [13, 384, 3, 192], [13, 256, 3, 192]], [[9216, 4096], [4096, 4096], [4096, 1000]]);
const vggConvs = [];
[[224, 64, 3], [224, 64, 64], [112, 128, 64], [112, 128, 128], [56, 256, 128], [56, 256, 256], [56, 256, 256], [28, 512, 256], [28, 512, 512], [28, 512, 512], [14, 512, 512], [14, 512, 512], [14, 512, 512]].forEach(([e, m, c]) => vggConvs.push([e, m, 3, c]));
const vgg = net(vggConvs, [[25088, 4096], [4096, 4096], [4096, 1000]]);
out('LeNet (Caffe)  MACs ' + (lenet.macs / M).toFixed(2) + ' M, weights ' + (lenet.weights / 1e3).toFixed(0) + ' k');
out('AlexNet        MACs ' + (alex.macs / M).toFixed(0) + ' M, weights ' + (alex.weights / M).toFixed(1) + ' M');
out('VGG-16         MACs ' + (vgg.macs / 1e9).toFixed(2) + ' G, weights ' + (vgg.weights / M).toFixed(0) + ' M, MACs per weight ' + (vgg.macs / vgg.weights).toFixed(0));
out('LeNet to VGG-16 MAC growth ' + Math.round(vgg.macs / lenet.macs) + 'x');

// ---- Memory accesses --------------------------------------------------------------------------
out('AlexNet worst-case memory accesses (3 reads + 1 write per MAC): ' + ((alex.macs * 4) / M).toFixed(0) + ' M');
out('Energy per MAC, all four accesses at DRAM: ' + (1 + 4 * 200) + 'x one MAC');

// ---- CONV1 and CONV3 presets ------------------------------------------------------------------
function layer({ n, c, m, h, r, u, p }) {
  const e = Math.floor((h + 2 * p - r) / u) + 1;
  const macs = n * m * e * e * c * r * r;
  const weights = m * c * r * r;
  const ifmap = n * c * h * h;
  const ofmap = n * m * e * e;
  return { e, macs, weights, ifmap, ofmap, wreuse: n * e * e, ireuse: (m * r * r) / (u * u), best: macs / (weights + ifmap + ofmap) };
}
const c1 = layer({ n: 1, c: 3, m: 96, h: 227, r: 11, u: 4, p: 0 });
const c3 = layer({ n: 1, c: 256, m: 384, h: 13, r: 3, u: 1, p: 1 });
const v1 = layer({ n: 1, c: 3, m: 64, h: 224, r: 3, u: 1, p: 1 });
const one = layer({ n: 1, c: 256, m: 64, h: 56, r: 1, u: 1, p: 0 });
for (const [name, l] of [['AlexNet CONV1', c1], ['AlexNet CONV3', c3], ['VGG CONV1_1', v1], ['1x1 layer', one]]) {
  out(name.padEnd(14) + ' E ' + l.e + ', MACs ' + (l.macs / M).toFixed(1) + ' M, weights ' + l.weights + ', ifmap ' + l.ifmap + ', ofmap ' + l.ofmap + ', weight uses ' + l.wreuse + ', input uses ~' + Math.round(l.ireuse) + ', best MACs per value ' + l.best.toFixed(0));
}

// ---- Winograd and Strassen --------------------------------------------------------------------
out('Winograd F(2x2,3x3): direct ' + 4 * 9 + ' multiplies, Winograd ' + 4 * 4 + ', ratio ' + ((4 * 9) / (4 * 4)).toFixed(2));
out('Strassen: 8 multiplies -> 7, ratio ' + (8 / 7).toFixed(3));

// ---- im2col duplication -----------------------------------------------------------------------
const dup = (n, r) => ((n - r + 1) ** 2 * r * r) / (n * n);
out('im2col copies: 4x4 image, 2x2 filter ' + dup(4, 2).toFixed(2) + '; 5x5, 3x3 ' + dup(5, 3).toFixed(2) + '; large image, 3x3 -> ' + 9);

// ---- Practice answers (same order as lesson-3.js) --------------------------------------------
const expected = [];
const answer = (name, value, detail) => {
  expected.push(value);
  out(name.padEnd(4) + (typeof value === 'number' ? Number(value.toPrecision(6)) : value) + (detail ? '  ' + detail : ''));
};
// S1: output size, H=227, R=11, U=4, no padding
answer('P1', Math.floor((227 - 11) / 4) + 1);
// S2: FC 4096 -> 1000, batch 1, MACs in millions
answer('P2', (4096 * 1000) / M);
// S3: peak TOPS, 4096 MACs, 1 GHz, 2 ops per MAC
answer('P3', (4096 * 1e9 * 2) / 1e12);
// M4: MACs of a 56 x 56 layer, M=128, C=64, 3 x 3, pad 1, in millions
const l4 = layer({ n: 1, c: 64, m: 128, h: 56, r: 3, u: 1, p: 1 });
answer('P4', l4.macs / M, 'E ' + l4.e);
// M5: uses of each weight, batch 8
const l5 = layer({ n: 8, c: 64, m: 128, h: 56, r: 3, u: 1, p: 1 });
answer('P5', l5.wreuse);
// M6: MACs left (millions) with 60 % zero weights and 50 % zero activations
answer('P6', (l4.macs / M) * (1 - 0.6) * (1 - 0.5));
// H7: depthwise separable, C = M = 128, 3 x 3, 28 x 28
const std = 28 * 28 * 128 * 128 * 9;
const sep = 28 * 28 * 128 * 9 + 28 * 28 * 128 * 128;
answer('P7', std / sep, 'standard ' + (std / M).toFixed(1) + ' M, separable ' + (sep / M).toFixed(2) + ' M');
// H8: energy per MAC, design B over design A, costs RF 1, PE 2, buffer 6, DRAM 200
const A = 1 + 3.5 * 1 + 0.4 * 2 + 0.1 * 6 + 0.02 * 200;
const B = 1 + 2.0 * 1 + 0 * 2 + 1.0 * 6 + 0.05 * 200;
answer('P8', B / A, 'A ' + A.toFixed(1) + ', B ' + B.toFixed(1));
// H9: FC 4096 x 4096 weights from DRAM once per batch; energy per input, batch 1 over batch 16
const per = (n) => 1 + 200 / n;
answer('P9', per(1) / per(16), 'batch 1 ' + per(1).toFixed(1) + ', batch 16 ' + per(16).toFixed(2) + ' (units of 16.78 M MACs)');

// H10: power of a chip claiming 40 TOPS at 20 TOPS/W
answer('P10', 40 / 20);

// ---- Compare with the lesson text ------------------------------------------------------------
const file = path.join(__dirname, '..', 'lesson-3.js');
if (fs.existsSync(file)) {
  const src = fs.readFileSync(file, 'utf8');
  const found = [...src.matchAll(/check:\s*\{\s*answer:\s*([0-9.eE+-]+)/g)].map((m) => parseFloat(m[1]));
  let ok = found.length === expected.length;
  if (!ok) console.error(`lesson has ${found.length} numeric answers, script computes ${expected.length}`);
  found.forEach((f, i) => {
    const e = expected[i];
    if (Math.abs(f - e) / Math.abs(e) > 0.03) {
      ok = false;
      console.error(`answer ${i + 1}: lesson says ${f}, script computes ${e}`);
    }
  });
  out(ok ? 'OK: lesson answers match the script (within 3%).' : 'MISMATCH');
  process.exit(ok ? 0 : 1);
} else {
  out('(lesson-3.js not found yet, skipped the comparison)');
}
