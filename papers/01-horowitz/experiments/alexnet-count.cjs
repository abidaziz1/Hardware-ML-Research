/*
 * Counts the multiply-accumulates and weights of AlexNet from its standard layer shapes
 * (the two-group version from the original 2012 network), to check the "724 million MACs" and
 * "61 million weights" quoted in the lesson. Weights exclude biases.
 *
 *   node papers/01-horowitz/experiments/alexnet-count.cjs
 */
// [name, outH, outW, outChannels, kernelH, kernelW, inChannelsPerGroup]
const conv = [
  ['CONV1', 55, 55, 96, 11, 11, 3],
  ['CONV2', 27, 27, 256, 5, 5, 48],
  ['CONV3', 13, 13, 384, 3, 3, 256],
  ['CONV4', 13, 13, 384, 3, 3, 192],
  ['CONV5', 13, 13, 256, 3, 3, 192]
];
const fc = [
  ['FC6', 9216, 4096],
  ['FC7', 4096, 4096],
  ['FC8', 4096, 1000]
];
let macs = 0;
let weights = 0;
let convMacs = 0;
for (const [n, h, w, m, r, s, c] of conv) {
  const mm = h * w * m * r * s * c;
  const ww = m * r * s * c;
  console.log(n.padEnd(6), 'MACs', (mm / 1e6).toFixed(1) + ' M', ' weights', (ww / 1e6).toFixed(2) + ' M');
  macs += mm;
  convMacs += mm;
  weights += ww;
}
for (const [n, i, o] of fc) {
  console.log(n.padEnd(6), 'MACs', (i * o / 1e6).toFixed(1) + ' M', ' weights', (i * o / 1e6).toFixed(2) + ' M');
  macs += i * o;
  weights += i * o;
}
console.log('CONV MACs', (convMacs / 1e6).toFixed(0) + ' M; total MACs', (macs / 1e6).toFixed(0) + ' M; total weights', (weights / 1e6).toFixed(1) + ' M');
