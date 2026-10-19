/*
 * glossary-common.js
 * Terms that appear in many lessons. A lesson can add its own terms or override these.
 * Use {{key}} or {{key|shown text}} inside any lesson text to link a word to its entry.
 */
(function () {
  'use strict';
  window.MLS = window.MLS || {};
  window.MLS.commonGlossary = {
    /* ---------- chips and physics ---------- */
    transistor: {
      t: 'Transistor',
      d: 'The tiny electronic switch that every digital chip is built from. A modern processor has billions of them. Each one switching on or off costs a small amount of energy.'
    },
    'moores-law': {
      t: 'Moore\'s law',
      d: 'The observation that the number of transistors that fit on a chip doubles roughly every two years. It says nothing about how much power those transistors use.'
    },
    'dennard-scaling': {
      t: 'Dennard scaling',
      d: 'A rule from 1974: when you shrink every transistor dimension by a factor (say 0.7x) and also lower the supply voltage by the same factor, the chip does more work in the same area and uses about the same power. It worked for decades and then stopped, because voltage could no longer be lowered.'
    },
    voltage: {
      t: 'Supply voltage',
      d: 'The electrical "pressure" that powers a chip, measured in volts. The energy of one switching event grows with the square of the voltage, so a lower voltage saves a lot of energy.'
    },
    capacitance: {
      t: 'Capacitance',
      d: 'How much electric charge a wire or transistor must fill up each time it switches. Longer wires have more capacitance, which is why moving data over a long distance costs more energy than a short hop.'
    },
    leakage: {
      t: 'Leakage power',
      d: 'Power a transistor wastes even when it is not switching, because current seeps through it. Leakage got worse as transistors got smaller, and it is the reason voltage stopped going down.'
    },
    'process-node': {
      t: 'Process node',
      d: 'The manufacturing generation of a chip, named by a rough feature size such as 45 nm or 7 nm. Energy numbers in papers are tied to one node, so numbers from different nodes are not directly comparable.'
    },
    die: {
      t: 'Die',
      d: 'The piece of silicon that holds one chip. Die area (in mm squared) is a main driver of cost.'
    },
    clock: {
      t: 'Clock frequency',
      d: 'How many cycles per second a chip runs, for example 700 MHz is 700 million cycles per second. Each cycle, every unit can do one step of work.'
    },
    tdp: {
      t: 'TDP (thermal design power)',
      d: 'The most power a chip is designed to draw as heat that the cooling must remove, for example 75 W. It is a design limit, not the power the chip uses all the time.'
    },
    pj: {
      t: 'Picojoule (pJ)',
      d: 'One trillionth of a joule. Energy numbers for single operations are in picojoules. A nanojoule (nJ) is 1,000 pJ.'
    },
    'energy-per-op': {
      t: 'Energy per operation',
      d: 'How many picojoules one operation costs, such as one 32-bit add. Total energy is the sum, over every operation and every data access, of count times energy per event.'
    },

    /* ---------- memory and data movement ---------- */
    dram: {
      t: 'DRAM',
      d: 'Dynamic RAM: the large, cheap main memory outside the processor chip (the gigabytes on a memory stick, or the memory stacks next to a GPU). Reading it costs far more energy and time than reading anything on the chip.'
    },
    sram: {
      t: 'SRAM',
      d: 'Static RAM: the fast memory built on the processor chip itself. It holds kilobytes to a few megabytes and is used for caches, buffers and register files. Much cheaper to read than DRAM, but it takes lots of chip area.'
    },
    'register-file': {
      t: 'Register file (RF)',
      d: 'A very small, very fast memory right next to an arithmetic unit. It holds the few values the unit is working on right now. The cheapest place to keep data.'
    },
    cache: {
      t: 'Cache',
      d: 'A small SRAM that keeps copies of recently used data from DRAM so the next access is cheap. The hardware decides what to keep, which means the programmer does not control it directly.'
    },
    scratchpad: {
      t: 'Scratchpad (software-managed buffer)',
      d: 'An on-chip memory that the program or compiler fills and empties on purpose, with no hidden hardware guessing. Accelerators prefer it because data movement becomes predictable.'
    },
    'memory-hierarchy': {
      t: 'Memory hierarchy',
      d: 'The layers of storage from tiny and fast to huge and slow: registers, on-chip SRAM, DRAM, then disk. Each step down holds more data and costs more time and energy per access.'
    },
    'on-chip': {
      t: 'On-chip / off-chip',
      d: 'On-chip memory lives on the same piece of silicon as the arithmetic units. Off-chip memory (DRAM) is a separate chip reached through pins and wires, which costs much more energy per byte.'
    },
    hbm: {
      t: 'HBM',
      d: 'High-bandwidth memory: DRAM chips stacked in 3D and placed right next to the processor, giving far more bandwidth than ordinary DIMM memory.'
    },
    bandwidth: {
      t: 'Bandwidth',
      d: 'How much data a link or memory can move per second, for example 34 GB/s. It sets how fast data can feed the arithmetic units.'
    },
    latency: {
      t: 'Latency',
      d: 'How long one request takes from start to finish, for example 7 ms. Lower is better.'
    },
    throughput: {
      t: 'Throughput',
      d: 'How much work finishes per unit of time, for example 10,000 inferences per second. Higher is better. A system can have high throughput and poor latency at the same time.'
    },
    reuse: {
      t: 'Data reuse',
      d: 'Using a value fetched from far away more than once before throwing it away. Reuse is the main way to cut data movement, and most of computer architecture for AI is about getting more of it.'
    },
    locality: {
      t: 'Locality',
      d: 'The tendency of programs to reuse the same data soon (temporal locality) or touch nearby data (spatial locality). Caches and tiling both depend on it.'
    },
    tiling: {
      t: 'Tiling (blocking)',
      d: 'Splitting a big computation into small blocks that fit in fast memory, finishing everything you can with one block before loading the next. It raises reuse.'
    },
    pcie: {
      t: 'PCIe',
      d: 'The standard slot and link that connects add-in cards such as GPUs and TPUs to the host computer. It is much slower than on-card memory.'
    },

    /* ---------- compute ---------- */
    mac: {
      t: 'MAC (multiply-accumulate)',
      d: 'One multiply followed by an add into a running total: total = total + a x b. It is the basic step of convolutions and matrix multiplies. Counting MACs is the standard way to size a neural network layer.'
    },
    flop: {
      t: 'FLOP / op',
      d: 'One floating-point operation. A MAC is usually counted as 2 operations (one multiply, one add), but some papers count it as 1. Always check which convention a number uses.'
    },
    tops: {
      t: 'TOPS',
      d: 'Tera-operations per second: a trillion operations per second. Peak TOPS is the best case if every arithmetic unit is busy every cycle.'
    },
    'tops-per-watt': {
      t: 'TOPS/W',
      d: 'Operations per second per watt of power: a measure of energy efficiency. It is easy to inflate, which is why Paper 11 warns about quoting it alone.'
    },
    utilization: {
      t: 'Utilization',
      d: 'The fraction of the peak arithmetic capacity a program actually uses, for example 25 percent. Low utilization means the units are waiting, usually for data.'
    },
    'peak-performance': {
      t: 'Peak performance',
      d: 'The most operations per second the hardware could do if every unit were busy every cycle. Real programs reach only part of it.'
    },
    simd: {
      t: 'SIMD',
      d: 'Single instruction, multiple data: one instruction that does the same operation on several numbers at once, such as adding 8 pairs of numbers in one step.'
    },
    asic: {
      t: 'ASIC',
      d: 'Application-specific integrated circuit: a chip designed for one job. It can be far more efficient than a general chip for that job, and it costs a lot to design.'
    },
    fpga: {
      t: 'FPGA',
      d: 'A chip whose wiring you can reprogram after manufacturing. More flexible than an ASIC, usually less efficient.'
    },
    accelerator: {
      t: 'Accelerator',
      d: 'A chip or unit built to run one kind of work, such as neural networks, much faster or more efficiently than a general-purpose CPU.'
    },
    gpu: {
      t: 'GPU',
      d: 'Graphics Processing Unit. A chip with thousands of small arithmetic units that run many simple operations at once. Neural networks are mostly simple arithmetic repeated millions of times, so GPUs suit them well.'
    },
    cpu: {
      t: 'CPU',
      d: 'Central Processing Unit. The general-purpose chip in every computer. It has a few powerful cores and handles complicated control flow well, but does fewer operations at once than a GPU.'
    },
    'systolic-array': {
      t: 'Systolic array',
      d: 'A grid of small arithmetic units where data moves rhythmically from one unit to the next, each unit doing one multiply-accumulate and passing the result along. Data is fetched once and reused many times across the grid.'
    },
    pe: {
      t: 'PE (processing element)',
      d: 'One small compute unit in an accelerator, usually a MAC unit plus a little local memory. A chip has tens to thousands of them.'
    },
    dataflow: {
      t: 'Dataflow',
      d: 'The plan for which data stays in place and which data moves, and in what order, while an accelerator computes a layer. Different dataflows give very different amounts of data movement for the same math.'
    },

    /* ---------- neural network basics ---------- */
    'neural-network': {
      t: 'Neural network',
      d: 'A model built from layers of simple math operations. Each layer multiplies its input by learned numbers (weights), adds them up, and applies a simple function such as ReLU.'
    },
    cnn: {
      t: 'CNN',
      d: 'Convolutional neural network: a network whose main layers slide small filters across an image to detect patterns. Used for image tasks.'
    },
    convolution: {
      t: 'Convolution (CONV layer)',
      d: 'The main CNN layer. A small filter (for example 3 x 3 pixels, across all input channels) slides over the image. At each position it multiplies and adds, producing one output value.'
    },
    filter: {
      t: 'Filter (kernel)',
      d: 'A small block of learned weights that a convolution slides across its input. A layer has many filters, one per output channel.'
    },
    fmap: {
      t: 'Feature map',
      d: 'A grid of numbers produced by a layer. The input image is the first feature map. Each channel of a feature map is one grid.'
    },
    ifmap: {
      t: 'Input feature map (ifmap)',
      d: 'The grid of numbers (the activations) a layer reads. For the first layer it is the image.'
    },
    ofmap: {
      t: 'Output feature map (ofmap)',
      d: 'The grid of numbers a layer produces.'
    },
    channel: {
      t: 'Channel',
      d: 'One grid in a stack. A color image has 3 channels (red, green, blue). Layers in the middle of a network often have 64 to 512 channels.'
    },
    weight: {
      t: 'Weight (parameter)',
      d: 'A learned number inside the model. A small image model has millions. A large language model has billions.'
    },
    activation: {
      t: 'Activation',
      d: 'A number produced by a layer and passed to the next one. Do not confuse the values (activations) with the function that makes them (activation function).'
    },
    psum: {
      t: 'Partial sum (psum)',
      d: 'A running total of multiply results that is not finished yet. Output values are built up by adding many partial sums. Moving partial sums in and out of memory is expensive because each one is both read and written.'
    },
    relu: {
      t: 'ReLU',
      d: 'A simple function: output the input if it is positive, otherwise output zero. It creates many zeros in the activations, which hardware can skip.'
    },
    'fc-layer': {
      t: 'Fully connected (FC) layer',
      d: 'A layer where every output is a weighted sum of every input. It is a matrix-vector multiply. Each weight is used once per input, so there is little reuse unless you process a batch.'
    },
    mlp: {
      t: 'MLP',
      d: 'Multi-layer perceptron: a network made only of fully connected layers.'
    },
    lstm: {
      t: 'LSTM',
      d: 'A recurrent network layer for sequences such as text or speech. It reuses the same weights at every time step.'
    },
    gemm: {
      t: 'GEMM',
      d: 'General matrix-matrix multiply: C = A x B. Convolutions and fully connected layers are often turned into GEMMs because libraries and hardware do them very efficiently.'
    },
    batch: {
      t: 'Batch',
      d: 'A group of inputs processed together, for example 32 images. A bigger batch reuses each weight more times, which saves energy, but makes each answer wait longer.'
    },
    quantization: {
      t: 'Quantization',
      d: 'Storing and computing numbers with fewer bits (for example 8-bit integers instead of 32-bit floats). It shrinks memory use and energy, usually with a small loss of accuracy.'
    },
    sparsity: {
      t: 'Sparsity',
      d: 'The fraction of values that are zero. Zeros need no multiply, so hardware that skips them can save time and energy.'
    },
    pruning: {
      t: 'Pruning',
      d: 'Setting small weights to zero (and removing them) to make a model smaller and sparser.'
    },
    training: {
      t: 'Training',
      d: 'Adjusting a model\'s weights using many examples until it makes good predictions. It needs a lot more computation than a single prediction.'
    },
    inference: {
      t: 'Inference',
      d: 'Using an already trained model to make a prediction on new input. It is what runs when you use an app.'
    },
    'tail-latency': {
      t: 'Tail latency (99th percentile)',
      d: 'The response time that 99 percent of requests beat. If the 99th percentile is 7 ms, 1 request in 100 takes longer. Interactive services are judged on the tail, not the average.'
    },
    'compute-bound': {
      t: 'Compute-bound',
      d: 'A program whose speed is limited by how fast the arithmetic units can calculate. Making memory faster would not help it.'
    },
    'memory-bound': {
      t: 'Memory-bound',
      d: 'A program whose speed is limited by how fast data arrives from memory. The arithmetic units sit idle waiting. Faster memory, or more reuse, helps it.'
    }
  };
})();
