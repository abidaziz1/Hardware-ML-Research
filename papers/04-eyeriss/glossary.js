/* Glossary for Paper 4. Keys are used in lesson text as {{key}} or {{key|shown text}}. */
(function () {
  'use strict';
  window.EYE = window.EYE || {};
  window.EYE.glossary = {
    'pe-set': {
      t: 'Logical PE set',
      d: 'In row stationary, the group of R x E processing elements that together do one 2D convolution: one PE for every pair of a filter row and an output row.'
    },
    folding: {
      t: 'Folding',
      d: 'Cutting a logical PE set that is too big for the physical array into several passes that run one after another on the same PEs.'
    },
    replication: {
      t: 'Replication',
      d: 'Placing several copies of a small logical PE set side by side on the physical array, each working on different channels, filters or inputs, so that fewer PEs sit idle.'
    },
    interleaving: {
      t: 'Interleaving',
      d: 'Letting one PE alternate between several pieces of work (for example different channels) so it can reuse data or keep partial sums locally. It costs register file space.'
    },
    multicast: {
      t: 'Multicast',
      d: 'Sending one value to several processing elements in one transfer, so the global buffer is read once instead of once per receiver.'
    },
    noc: {
      t: 'Network on chip (NoC)',
      d: 'The wires and routers that carry data between the global buffer and the processing elements and between neighbors.'
    },
    'normalized-energy': {
      t: 'Normalized energy',
      d: 'Energy expressed in units of one MAC (or another reference operation), so results do not depend on the manufacturing process. The Eyeriss analysis reports energy this way.'
    },
    rlc: {
      t: 'Run-length compression',
      d: 'Storing a long run of zeros as a count instead of writing every zero. The Eyeriss chip uses it for feature maps, which contain many zeros after ReLU.'
    }
  };
})();
