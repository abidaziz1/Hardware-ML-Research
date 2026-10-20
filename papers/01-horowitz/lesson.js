/* Paper 1 lesson: assembles the glossary and the parts, then starts the player. */
MLS.start({
  id: 'horowitz-isscc14',
  number: 1,
  short: 'Horowitz',
  title: 'Computing\'s Energy Problem (and What We Can Do About It)',
  home: '../../index.html',
  glossary: window.HOR.glossary,
  parts: [].concat(window.HOR.p1, window.HOR.p2, window.HOR.p3)
});
