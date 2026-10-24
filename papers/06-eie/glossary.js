/* Glossary for Paper 6. Keys are used in lesson text as {{key}} or {{key|shown text}}. */
(function () {
  'use strict';
  window.EIE = window.EIE || {};
  window.EIE.glossary = {
    'weight-sharing': {
      t: 'Weight sharing (codebook)',
      d: 'Instead of storing each weight as a 32-bit number, the layer keeps one small table of shared values, for example 16. Each weight stores a short code, 4 bits for 16 values, that points into the table. The table is called a codebook.'
    },
    retraining: {
      t: 'Retraining (fine-tuning)',
      d: 'Training a network a little more after you change it, for example after pruning, so the remaining weights make up for what was removed.'
    },
    kmeans: {
      t: 'k-means clustering',
      d: 'A standard method that groups nearby numbers into k groups and uses each group\'s average as its representative. Weight sharing uses it to choose the table values.'
    },
    'relative-index': {
      t: 'Skip count (relative index)',
      d: 'For a stored weight, the number of empty (zero) rows between it and the previous stored weight in the same column. EIE stores it in 4 bits instead of storing the full row number.'
    },
    csc: {
      t: 'Compressed sparse column (CSC)',
      d: 'A way to store a mostly empty matrix one column at a time: a short list of the stored entries, each with a skip count, plus one pointer per column that says where that column\'s list starts.'
    },
    'deep-compression': {
      t: 'Deep Compression',
      d: 'A companion paper by Han, Mao and Dally that shrinks a trained network by pruning, weight sharing and Huffman coding. EIE is the chip built to run a network shrunk this way.'
    },
    queue: {
      t: 'Queue (FIFO)',
      d: 'A line of waiting items that are served in the order they arrived. In EIE each processing element has a short queue of orders, so a fast one can run ahead of a slow one.'
    },
    'load-balance': {
      t: 'Load balancing',
      d: 'Spreading work so that every worker finishes at about the same time. If one worker has much more to do, everyone else waits for it.'
    },
    cycle: {
      t: 'Clock cycle',
      d: 'One tick of the chip\'s clock. In the race widget each cook does one multiply-add per cycle.'
    },
    dense: {
      t: 'Dense and sparse',
      d: 'A dense matrix stores every entry, including the zeros. A sparse matrix stores only the entries that are not zero, plus enough information to know where they belong.'
    },
    huffman: {
      t: 'Huffman coding',
      d: 'A way to store common values with fewer bits and rare values with more. Deep Compression uses it to shrink storage further. The widgets in this lesson leave it out.'
    }
  };
})();
