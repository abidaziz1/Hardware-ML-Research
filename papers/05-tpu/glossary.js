/* Glossary for Paper 5. Keys are used in lesson text as {{key}} or {{key|shown text}}. */
(function () {
  'use strict';
  window.TPU = window.TPU || {};
  window.TPU.glossary = {
    tpu: {
      t: 'TPU (Tensor Processing Unit)',
      d: 'Google\'s custom chip for neural network inference, deployed in its datacenters since 2015. This lesson is about the first generation.'
    },
    mxu: {
      t: 'Matrix multiply unit',
      d: 'The heart of the TPU: a 256 x 256 grid of 8-bit multiply-accumulate units (65,536 in all) that multiplies a vector of 256 values by a 256 x 256 tile of weights every cycle.'
    },
    'unified-buffer': {
      t: 'Unified Buffer',
      d: 'The TPU\'s large on-chip memory (24 MiB) for activations: the inputs to the matrix unit and the results that come back. It is managed by software, with no hidden cache.'
    },
    accumulators: {
      t: 'Accumulators',
      d: 'A 4 MiB memory at the bottom of the matrix unit that collects the 32-bit partial sums coming out of the array, one 256-value vector per cycle.'
    },
    'weight-fifo': {
      t: 'Weight FIFO',
      d: 'A first-in, first-out queue that carries weight tiles from off-chip weight memory to the matrix unit, so the next tile can load while the current one is in use.'
    },
    cisc: {
      t: 'CISC',
      d: 'Complex instruction set computer: an instruction set whose instructions each do a lot of work. A TPU instruction can keep the matrix unit busy for thousands of cycles.'
    },
    deterministic: {
      t: 'Deterministic execution',
      d: 'Running the same program takes the same number of cycles every time. It makes response times predictable, which is what a latency limit needs.'
    },
    mib: {
      t: 'MiB (mebibyte)',
      d: '2 to the power 20 bytes, which is 1,048,576 bytes. Slightly more than a megabyte (1,000,000 bytes). The TPU paper quotes sizes in MiB and GiB.'
    },
    ddr3: {
      t: 'DDR3',
      d: 'A common generation of DRAM. The first TPU used it for its weight memory, at about 34 GB/s.'
    },
    gddr5: {
      t: 'GDDR5',
      d: 'A faster DRAM generation used on GPUs, with several times the bandwidth of DDR3 per chip. The paper asks what it would do for the TPU.'
    },
    datacenter: {
      t: 'Datacenter',
      d: 'A building of thousands of servers that runs online services. Chips there are judged on cost, power and response time at very large scale.'
    }
  };
})();
