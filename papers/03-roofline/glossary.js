/* Glossary for Paper 3. Keys are used in lesson text as {{key}} or {{key|shown text}}. */
(function () {
  'use strict';
  window.ROOF = window.ROOF || {};
  window.ROOF.glossary = {
    roofline: {
      t: 'Roofline model',
      d: 'A chart of attainable performance against operational intensity. The slanted line is what memory bandwidth allows and the flat line is the peak compute. Together they look like a roof, and a program can sit under it but never above.'
    },
    'operational-intensity': {
      t: 'Operational intensity (OI)',
      d: 'Operations performed per byte of DRAM traffic, for example 4 operations per byte. High means the program reuses its data a lot. Low means it moves a lot of data for little arithmetic.'
    },
    'ridge-point': {
      t: 'Ridge point',
      d: 'The operational intensity where the slanted memory line meets the flat compute line. It equals peak operations per second divided by bytes per second. Programs left of it are memory-bound, programs right of it are compute-bound.'
    },
    ceiling: {
      t: 'Ceiling',
      d: 'A lower line under the roof that marks what you can reach without a particular optimization, such as vector instructions or prefetching. Applying the optimization lifts you through the ceiling.'
    },
    'machine-balance': {
      t: 'Machine balance',
      d: 'The ridge point seen as a property of the machine: how many operations it can perform for each byte it can fetch.'
    },
    stream: {
      t: 'STREAM benchmark',
      d: 'A simple program that measures sustained memory bandwidth by copying large arrays. Roofline charts use such a measured number rather than a datasheet figure.'
    },
    prefetch: {
      t: 'Prefetching',
      d: 'Asking for data before the program needs it, so memory is already busy while the processor works. Without it a core waits for each fetch and uses less of the available bandwidth.'
    },
    numa: {
      t: 'NUMA (memory affinity)',
      d: 'On a machine with several memory banks, a core reaches its own bank faster than a distant one. Placing data in the bank near the core that uses it raises usable bandwidth.'
    },
    ilp: {
      t: 'Instruction-level parallelism (ILP)',
      d: 'Running several independent instructions at the same time inside one core. Code with long chains of dependent instructions cannot use it.'
    },
    kernel: {
      t: 'Kernel',
      d: 'A small, heavily used piece of computation, such as a matrix multiply or a stencil. Performance models are often drawn per kernel.'
    },
    'log-scale': {
      t: 'Log-log chart',
      d: 'A chart whose axes advance by factors, not amounts: each gridline is ten times the last. A relationship such as bandwidth times intensity becomes a straight diagonal line.'
    },
    'cache-miss': {
      t: 'Cache miss',
      d: 'A request for data that is not in the cache, so it must come from DRAM. Misses are what create DRAM traffic.'
    },
    'memory-wall': {
      t: 'Memory wall',
      d: 'The long-term trend that processor arithmetic speed has grown much faster than memory bandwidth, so more and more programs wait for memory.'
    }
  };
})();
