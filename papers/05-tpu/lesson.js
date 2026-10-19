/* Paper 5 lesson: assembles the glossary and the parts, then starts the player. */
MLS.start({
  id: 'tpu-isca17',
  number: 5,
  short: 'TPU',
  title: 'In-Datacenter Performance Analysis of a Tensor Processing Unit',
  home: '../../index.html',
  glossary: window.TPU.glossary,
  parts: [].concat(window.TPU.p1, window.TPU.p2, window.TPU.p3)
});
