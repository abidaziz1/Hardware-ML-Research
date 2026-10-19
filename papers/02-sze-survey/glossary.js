/* Glossary for Paper 2. Keys are used in lesson text as {{key}} or {{key|shown text}}. */
(function () {
  'use strict';
  window.SZE = window.SZE || {};
  window.SZE.glossary = {
    stride: {
      t: 'Stride (U)',
      d: 'How many positions the filter moves between two outputs. Stride 1 moves one pixel at a time. Stride 2 skips every other position and gives an output about half as wide.'
    },
    padding: {
      t: 'Padding (P)',
      d: 'Extra zeros added around the edge of the input so the filter can be centered on border pixels and the output keeps its size.'
    },
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
    'temporal-architecture': {
      t: 'Temporal architecture',
      d: 'A design, such as a CPU or GPU, where a central control unit drives many arithmetic units that read and write a shared memory hierarchy and do not pass data directly to each other.'
    },
    'spatial-architecture': {
      t: 'Spatial architecture',
      d: 'A design where a grid of processing elements, each with a little local memory, passes data directly to its neighbors. It supports dataflow processing and cuts trips to big memories.'
    },
    'global-buffer': {
      t: 'Global buffer',
      d: 'A large on-chip SRAM (tens to hundreds of kilobytes) shared by all processing elements. It sits between DRAM and the PE array.'
    },
    'weight-stationary': {
      t: 'Weight stationary (WS)',
      d: 'A dataflow that keeps each weight in the PE\'s register file and streams the other data past it, to reuse the weight as often as possible.'
    },
    'output-stationary': {
      t: 'Output stationary (OS)',
      d: 'A dataflow that keeps each partial sum in the PE until the output value is finished, so partial sums never travel to a bigger memory.'
    },
    'no-local-reuse': {
      t: 'No local reuse (NLR)',
      d: 'A dataflow with no register file in the PEs. All data goes through the global buffer, which is spent on reuse instead.'
    },
    'row-stationary': {
      t: 'Row stationary (RS)',
      d: 'The dataflow proposed in Paper 4 (Eyeriss). Each PE handles one row of a filter against one row of the input, which keeps all three kinds of data local at once.'
    },
    'convolutional-reuse': {
      t: 'Convolutional reuse',
      d: 'Data reuse inside one convolution: each weight is applied at many positions, and each input value is seen by many overlapping windows.'
    },
    'filter-reuse': {
      t: 'Filter reuse',
      d: 'Reusing the same filter weights for several inputs in a batch.'
    },
    'fmap-reuse': {
      t: 'Input feature map reuse',
      d: 'Reusing the same input values for several different filters in the same layer.'
    },
    gating: {
      t: 'Zero gating',
      d: 'Switching off a multiplier when an input is zero, which saves its energy but not the time of the cycle.'
    },
    skipping: {
      t: 'Zero skipping',
      d: 'Not issuing the multiply for a zero at all, which saves both energy and time. It needs extra logic to find the non-zero values.'
    },
    depthwise: {
      t: 'Depthwise convolution',
      d: 'A convolution that applies one R x S filter to each input channel separately, with no mixing across channels.'
    },
    pointwise: {
      t: 'Pointwise (1 x 1) convolution',
      d: 'A convolution with a 1 x 1 filter. It mixes channels at each position and does no spatial filtering.'
    },
    'peak-ops': {
      t: 'Peak operations per second',
      d: 'Number of MAC units times clock rate times operations counted per MAC. A ceiling that real workloads rarely reach.'
    }
  };
})();
