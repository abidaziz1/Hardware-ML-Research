/* Glossary for Paper 2. Keys are used in lesson text as {{key}} or {{key|shown text}}. */
(function () {
  'use strict';
  window.SZE = window.SZE || {};
  window.SZE.glossary = {
    pooling: {
      t: 'Pooling',
      d: 'A layer that shrinks a feature map by replacing each small block (for example 2 x 2) with its maximum or its average.'
    },
    'batch-norm': {
      t: 'Batch normalization',
      d: 'A layer that rescales each channel so its values have a stable average and spread. It needs few operations compared with a convolution.'
    },
    toeplitz: {
      t: 'Toeplitz matrix (im2col)',
      d: 'The matrix you get by writing each filter window of the image as one row. Multiplying it by the flattened filter performs the convolution as a matrix multiply, at the cost of copying overlapping image values.'
    },
    winograd: {
      t: 'Winograd transform',
      d: 'A way to compute small convolutions with fewer multiplications by transforming the input and filter, multiplying, and transforming back. A 2 x 2 output from a 3 x 3 filter needs 16 multiplies instead of 36.'
    },
    fft: {
      t: 'FFT convolution',
      d: 'Uses the fast Fourier transform to turn a convolution into an element-wise multiplication. It pays off for large filters and costs extra memory and transforms.'
    },
    strassen: {
      t: 'Strassen\'s algorithm',
      d: 'A matrix multiplication method that uses 7 block multiplications instead of 8, at the price of more additions.'
    },
    gating: {
      t: 'Zero gating',
      d: 'Switching off a multiplier when an input is zero, which saves its energy but not the time of the cycle.'
    },
    skipping: {
      t: 'Zero skipping',
      d: 'Not issuing the multiply for a zero at all, which saves both energy and time. It needs extra logic to find the non-zero values.'
    },
    'peak-ops': {
      t: 'Peak operations per second',
      d: 'Number of MAC units times clock rate times operations counted per MAC. A ceiling that real workloads rarely reach.'
    }
  };
})();
