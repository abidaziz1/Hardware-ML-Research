/* Paper 5 lesson, parts 5 to 7: reading critically, wrap-up, practice problems. */
(function () {
  'use strict';
  window.TPU = window.TPU || {};

  window.TPU.p3 = [
    /* ------------------------------ Part 5 ------------------------------ */
    {
      id: 'critique',
      title: 'Reading it critically',
      summary: 'What the evidence supports, what to question, and five common misreadings.',
      steps: [
        {
          id: 'caveats',
          title: 'What to question',
          min: 6,
          blocks: [
            { t: 'p', text: 'This is a rare paper: a company reports on a production chip, with real workloads and a frank analysis. It is also written by the builders of the chip. Read it with these checks.' },
            {
              t: 'list',
              ordered: true,
              items: [
                '**Google\'s workloads, Google\'s measurements.** The six networks are real production services. They may not look like yours, and few outsiders could repeat the runs.',
                '**The baselines are older chips.** The CPU and GPU are contemporaries of the first TPU, not of today. Ask how a tuned 8-bit implementation on a newer chip would compare.',
                '**Inference only.** Training has different needs (higher precision, much more data movement). The first TPU does not address it.',
                '**8-bit arithmetic needs accuracy checks.** Many networks keep their accuracy when quantized, but each one must be tested.',
                '**Power accounting.** Performance per watt can be computed for the chip alone or for the chip plus its host server. Check which the paper uses for each claim.',
                '**The memory what-if is an estimate.** The faster-memory TPU was not built. Treat its numbers as a projection.'
              ]
            },
            {
              t: 'table',
              head: ['Claim', 'What supports it', 'Our confidence (opinion)'],
              rows: [
                ['The TPU is much faster and more energy efficient than a contemporary CPU or GPU on these workloads', 'Measurements on six production networks', 'High for these workloads and baselines. Check the per-application numbers.'],
                ['Most of the workloads are limited by weight memory bandwidth', 'The roofline analysis (and our own bound arithmetic in Part 3)', 'High. The bounds follow from the arithmetic.'],
                ['Deterministic execution suits a 99th-percentile latency limit', 'The argument and the latency comparison', 'Medium to high. Plausible and supported by the batch-size example.'],
                ['Domain-specific hardware is the main route to big gains', 'The TPU\'s results', 'An argument supported by one case. Later papers in this course test it.']
              ],
              source: 'original',
              caption: 'Our judgment of each claim. This column is opinion. Form your own after reading the paper.'
            },
            {
              t: 'quiz',
              id: 'tpu-q16',
              q: 'Which question is most important to ask about a performance per watt claim?',
              options: ['Does the power number cover only the chip or also the host server, and at what utilization?', 'What color is the chip?', 'Who wrote the paper?', 'Is the clock speed above 500 MHz?'],
              answer: 0,
              whyNot: [null, 'The color says nothing about the measurement.', 'Authorship matters for trust, but the measurement conditions matter more.', 'Clock speed alone does not set efficiency.'],
              explain: 'Performance per watt changes by large factors depending on what power is counted and how busy the chip is.'
            }
          ]
        },
        {
          id: 'misreadings',
          title: 'Five common misreadings',
          min: 5,
          blocks: [
            { t: 'p', text: 'Click each card to see the mistake and the correction.' },
            {
              t: 'flip',
              hint: 'Click to see the correction',
              cards: [
                { front: 'Misreading 1: "The TPU delivers 92 TOPS."', back: 'That is the peak. The roofline shows four of the six workloads are limited far below it by weight bandwidth, between about 5% and 15% of peak.' },
                { front: 'Misreading 2: "The TPU is fast because it is a big, hot chip."', back: 'The abstract says the opposite: the lack of caches and similar features helps explain why the TPU is relatively small and low power.' },
                { front: 'Misreading 3: "The TPU has no cache because the designers could not build one."', back: 'It was a deliberate choice for deterministic timing and for chip area, argued in the paper.' },
                { front: 'Misreading 4: "A systolic array is always busy."', back: 'It fills and drains. A job of T vectors on an N x N array is busy a fraction T / (T + 2N - 2) of the time, so it needs many vectors per weight tile.' },
                { front: 'Misreading 5: "TOPS per watt settles which chip is better."', back: 'It depends on the workload, the precision, the batch size and what power is counted. Paper 11 is about this.' }
              ]
            },
            {
              t: 'quiz',
              id: 'tpu-q17',
              q: 'A colleague says: "MLP0 runs slowly on the TPU because the matrix unit is too small." What does the roofline say?',
              options: ['MLP0 is limited by weight memory bandwidth, about 13.6 TOPS at best, so a bigger matrix unit would not help', 'The colleague is right, a bigger matrix unit would double the speed', 'MLP0 is compute-bound', 'The roofline does not apply to MLPs'],
              answer: 0,
              whyNot: [null, 'The bound comes from 34 GB/s times 200 MACs per byte, not from the number of multipliers.', 'At 200 MACs per weight byte it sits left of the ridge at about 1,349, so it is memory-bound.', 'The roofline applies to any workload with a known operations-per-byte ratio.'],
              explain: 'Bound = 34 GB/s x 200 MACs per byte x 2 operations = 13.6 TOPS, a small share of the 92 TOPS peak.'
            }
          ]
        }
      ]
    },

    /* ------------------------------ Part 6 ------------------------------ */
    {
      id: 'wrap',
      title: 'Wrap-up',
      summary: 'What came next, a final quiz, a teach-back and a reading map.',
      steps: [
        {
          id: 'next',
          title: 'What came next (later work, not in the paper)',
          min: 3,
          blocks: [
            { t: 'callout', kind: 'note', title: 'Later context', body: 'Everything on this page is outside the paper or came after it. Later lessons will check each item against its own paper.' },
            {
              t: 'list',
              items: [
                'Later TPU generations extended the idea to training, with floating-point formats and many chips linked together. Paper 21 (TPU v4) covers a large system built from them.',
                'Papers 6 and 7 (EIE and SCNN) go in a different direction: skipping zeros and compressing weights so that fewer bytes cross the narrow weight memory.',
                'Paper 11 argues that headline metrics such as TOPS per watt need context. You have now seen why.',
                'Paper 18 (FlashAttention) applies the weight-tile logic to attention: keep intermediate results on chip, and do not move them through DRAM.'
              ]
            }
          ]
        },
        {
          id: 'final',
          title: 'Final quiz',
          min: 8,
          blocks: [
            { t: 'p', text: 'Ten questions, one at a time. Your score counts only first tries. At the end you get a list of parts to revisit.' },
            {
              t: 'finalquiz',
              questions: [
                { part: 'why', q: 'What does a 99th-percentile response time of 7 ms mean?', options: ['99 of 100 requests finish within 7 ms', 'The average request takes 7 ms', 'Every request takes exactly 7 ms', 'The slowest request takes 7 ms'], answer: 0, explain: 'The 99th percentile is the time that 99 percent of requests beat.' },
                { part: 'why', q: 'Why does a latency limit cap the batch size?', options: ['Every request in a batch waits for the whole batch', 'Batches use less memory', 'Batches slow the clock', 'Batches break the matrix unit'], answer: 0, explain: 'A bigger batch raises throughput but also the time each request waits.' },
                { part: 'arch', q: 'How many multiply-accumulate units does the TPU\'s matrix unit have?', options: ['65,536 (256 x 256)', '256', '4,096', '28'], answer: 0, explain: 'A 256 x 256 array, as the abstract states.' },
                { part: 'arch', q: 'A weight-stationary systolic array of 4 x 4 PEs processes 5 input vectors. How many cycles does the job take?', options: ['11', '5', '20', '16'], answer: 0, explain: 'T + 2N - 2 = 5 + 8 - 2.' },
                { part: 'arch', q: 'Which memory holds the weights, and where is it?', options: ['Weight memory, off-chip DDR3', 'The Unified Buffer, on chip', 'The accumulators', 'The host\'s disk'], answer: 0, explain: 'Weights come from off-chip memory through the weight FIFO. Activations stay in the Unified Buffer.' },
                { part: 'arch', q: 'The TPU has 65,536 MACs at 700 MHz and counts 2 operations per MAC. What is its peak?', options: ['About 92 TOPS', 'About 46 GOPS', 'About 460 TOPS', 'About 9 TOPS'], answer: 0, explain: '65,536 x 700 x 10^6 x 2 = 9.175 x 10^13.' },
                { part: 'perf', q: 'A workload does 200 MACs per weight byte and the ridge is about 1,349. Where does it sit?', options: ['Left of the ridge, memory-bound', 'Right of the ridge, compute-bound', 'On the ridge', 'The roofline does not apply'], answer: 0, explain: '200 is far below 1,349, so weight bandwidth limits it.' },
                { part: 'perf', q: 'What does the abstract say using GDDR5 memory would do for the TPU?', options: ['Triple the achieved TOPS', 'Halve the power', 'Make it 10 times smaller', 'Nothing'], answer: 0, explain: 'It would triple the achieved TOPS and raise TOPS per watt to nearly 70 times the GPU and 200 times the CPU.' },
                { part: 'better', q: 'Why does the TPU leave out caches and out-of-order execution?', options: ['They make timing variable, which hurts a 99th-percentile limit, and they take chip area', 'It could not build them', 'They use no power', 'They make the matrix unit slower'], answer: 0, explain: 'Deterministic timing matches the latency requirement, and the saved area goes to MACs and memory.' },
                { part: 'better', q: 'Which dataflow does the TPU\'s matrix unit use, in Paper 4\'s vocabulary?', options: ['Weight stationary', 'Output stationary', 'No local reuse', 'Row stationary'], answer: 0, explain: 'Each PE holds a weight while inputs flow through and partial sums pass along.' }
              ]
            }
          ]
        },
        {
          id: 'take-away',
          title: 'Take it with you',
          min: 8,
          blocks: [
            { t: 'h', text: '1. Teach it back' },
            {
              t: 'teachback',
              id: 'tb5',
              prompt: 'In five sentences, explain to a friend why the TPU can be small and low power yet much faster than a CPU or GPU on neural network inference.',
              checklist: [
                'Said that it uses 8-bit multiplies, which cost far less energy than 32-bit floating point.',
                'Said that a big on-chip buffer keeps activations out of DRAM, so only weights cross the memory interface.',
                'Said that the systolic array reuses each value as it flows, and that the instruction overhead is shared over millions of MACs.',
                'Said that it leaves out caches and out-of-order logic for predictable latency, which also saves area and power.'
              ]
            },
            { t: 'h', text: '2. One line per part' },
            {
              t: 'table',
              head: ['Part', 'One-line summary'],
              rows: [
                ['1. Why Google built a chip', 'Inference is judged at the 99th percentile, which caps batching. Most demand is memory-bound MLPs and LSTMs.'],
                ['2. Inside the TPU', 'A 256 x 256 weight-stationary systolic array of 8-bit MACs, a 24 MiB Unified Buffer, 4 MiB accumulators, DDR3 weights, and a tiny instruction set.'],
                ['3. The evidence', 'The roofline puts four of six workloads under the memory slope. The paper reports 15 to 30 times faster and 30 to 80 times better TOPS per watt.'],
                ['4. Why it is efficient', 'Cheap 8-bit arithmetic, activations on chip, a weight-stationary flow, amortized instructions, and no variable-latency features.'],
                ['5. Reading critically', 'Google\'s workloads and measurements, older baselines, inference only, power accounting, and a what-if that was not built.']
              ]
            },
            { t: 'h', text: '3. How to read the real paper' },
            { t: 'p', text: 'Read it in this order. Section names below are descriptive, so match them by content.' },
            {
              t: 'readmap',
              rows: [
                { section: 'Abstract and introduction', how: 'Read closely', note: 'The claims and the motivation (Start here).', part: 'start' },
                { section: 'The six applications and their characteristics', how: 'Read closely with a pencil', note: 'Do the reading task: layers, weights, MACs per weight byte, batch, share (Part 1).', part: 'why' },
                { section: 'The TPU architecture: block diagram, systolic array, instruction set', how: 'Read closely', note: 'Match the diagram to the figure in Step 2.1 and the data flow to the widget (Part 2).', part: 'arch' },
                { section: 'Platforms and methodology', how: 'Read closely', note: 'Fill in the platform table in the reading task (Part 3).', part: 'perf' },
                { section: 'The roofline and the performance results', how: 'Read closely with a pencil', note: 'Compare measured TOPS with your computed bounds (Part 3).', part: 'perf' },
                { section: 'Latency, batching and the 7 ms limit', how: 'Read closely', note: 'Find the batch sizes and throughput shares (Part 1).', part: 'why' },
                { section: 'Energy and performance per watt', how: 'Read closely', note: 'Check what power is counted (Parts 3 and 5).', part: 'perf' },
                { section: 'Discussion, fallacies and pitfalls, and the faster-memory variant', how: 'Read closely', note: 'Compare with the questions in Part 5.', part: 'critique' }
              ]
            },
            { t: 'h', text: '4. References and where to go next' },
            {
              t: 'list',
              items: [
                'Jouppi et al. **In-Datacenter Performance Analysis of a Tensor Processing Unit.** ISCA 2017. [arXiv 1704.04760](https://arxiv.org/abs/1704.04760)',
                'Kung. **Why Systolic Architectures?** IEEE Computer, 1982. The classic description of systolic arrays.',
                'Williams, Waterman, Patterson. **Roofline.** Paper 3 in this course.',
                'Next: **Paper 6, EIE,** which compresses and prunes weights so that fewer bytes cross the weight memory. Papers 1 to 5 are now your base. The ML systems repository continues with its own papers.'
              ]
            }
          ]
        }
      ]
    },

    /* ------------------------------ Part 7 ------------------------------ */
    {
      id: 'practice',
      title: 'Practice',
      summary: 'Simple, medium and hard problems with hidden hints and solutions.',
      steps: [
        {
          id: 'problems',
          title: 'Practice problems',
          min: 40,
          blocks: [
            {
              t: 'practice',
              id: 'tpu-practice',
              intro: 'Do each problem on paper first. Type a numeric answer and press **Check my answer**. It says only Correct or Not yet and never shows the answer. Open the hint if you are stuck, and open the solution when you are done. Every problem gives the numbers it needs.',
              problems: [
                {
                  level: 'simple',
                  q: 'A matrix unit is a 128 x 128 array of MAC units running at 1 GHz. Counting 2 operations per MAC, what is its peak in TOPS (trillions of operations per second)?',
                  check: { answer: 32.77, unit: 'TOPS' },
                  hint: 'Peak = number of MACs x clock x operations per MAC.',
                  solution: [
                    '128 x 128 = 16,384 MACs. 16,384 x 10^9 x 2 = 3.277 x 10^13, which is **32.77 TOPS**.',
                    'With 1 operation per MAC the same unit would be 16.4 TOPS. Check the counting convention whenever you compare two chips.'
                  ]
                },
                {
                  level: 'simple',
                  q: 'A 128-wide matrix unit has 2,048 accumulator entries. Each entry holds 128 values of 32 bits (4 bytes). How big are the accumulators, in KiB (1 KiB = 1,024 bytes)?',
                  check: { answer: 1024, unit: 'KiB' },
                  hint: 'Entries x values per entry x bytes per value.',
                  solution: [
                    '2,048 x 128 x 4 = 1,048,576 bytes. Divide by 1,024: **1,024 KiB**, which is exactly 1 MiB.',
                    'The real TPU\'s accumulators follow the same arithmetic with 4,096 entries of 256 values: 4,096 x 256 x 4 bytes = 4 MiB.'
                  ]
                },
                {
                  level: 'simple',
                  q: 'A 128 x 128 tile of 8-bit weights is loaded from memory at 34 GB/s. How long does the load take, in microseconds?',
                  check: { answer: 0.482, unit: 'microseconds' },
                  hint: 'Bytes in the tile divided by bytes per second, then convert to microseconds.',
                  solution: [
                    'Tile size: 128 x 128 x 1 byte = 16,384 bytes. Time = 16,384 / (34 x 10^9) = 4.82 x 10^-7 seconds, which is **0.482 microseconds**.',
                    'Common mistake: using 8 bits as 8 bytes, which makes the answer 8 times too long.'
                  ]
                },
                {
                  level: 'medium',
                  q: 'A chip has 16,384 MAC units at 1 GHz and 50 GB/s of weight bandwidth. What is its ridge point in MACs per weight byte?',
                  check: { answer: 327.7, unit: 'MACs per weight byte' },
                  hint: 'Ridge = MACs per second divided by weight bytes per second.',
                  solution: [
                    'MACs per second: 16,384 x 10^9 = 1.6384 x 10^13. Weight bytes per second: 50 x 10^9.',
                    'Ridge = 1.6384 x 10^13 / 5 x 10^10 = **327.7** MACs per weight byte.',
                    'A workload below 328 MACs per weight byte (for example a fully connected layer at batch 200) is memory-bound on this chip.'
                  ]
                },
                {
                  level: 'medium',
                  q: 'A fully connected layer with 8-bit weights runs at batch 100 on a chip with 34 GB/s of weight bandwidth, where only weights come from DRAM. Counting 2 operations per MAC, what is the roofline bound in TOPS?',
                  check: { answer: 6.8, unit: 'TOPS' },
                  hint: 'At batch 100 each weight byte feeds 100 MACs. Bound = bandwidth x MACs per byte x operations per MAC.',
                  solution: [
                    '34 x 10^9 bytes per second x 100 MACs per byte x 2 operations per MAC = 6.8 x 10^12 operations per second, which is **6.8 TOPS**.',
                    'On a 92 TOPS chip that is 7.4% of peak. Doubling the batch to 200 would double the bound, until the ridge at about 1,349 is reached.'
                  ]
                },
                {
                  level: 'medium',
                  q: 'A weight tile takes 1,349 cycles to load. Each input vector uses the tile for one cycle, and the next tile loads while the current one is in use. What is the smallest number of vectors per tile that keeps the matrix unit at least 50% busy? Give the exact value of 50% of the load time.',
                  check: { answer: 674.5, unit: 'vectors' },
                  hint: 'Utilization = vectors divided by the larger of the vectors and the load cycles.',
                  solution: [
                    'With V vectors per tile and V below 1,349, the unit is busy V / 1,349 of the time. Set V / 1,349 = 0.5.',
                    'V = **674.5**, so about 675 vectors per tile.',
                    'Compare with Paper 3: that is half of the ridge point, as the roofline says.'
                  ]
                },
                {
                  level: 'hard',
                  q: 'A 128 x 128 weight-stationary systolic array processes a single weight tile with T = 4 input vectors. A job takes T + 2N - 2 cycles for an N x N array. What percent of the time is the array busy (T divided by the number of cycles)?',
                  check: { answer: 1.55, unit: '% busy' },
                  hint: 'First find the number of cycles for N = 128 and T = 4.',
                  solution: [
                    'Cycles = 4 + 2 x 128 - 2 = 258. Busy fraction = 4 / 258 = 0.0155, which is **1.55%**.',
                    'Most of the time the array is filling or draining. The remedy is more vectors per tile: with 1,000 vectors the fraction is 1,000 / 1,254 = 80%. In the real TPU, successive jobs overlap, so the fill and drain are partly hidden, but the principle holds.'
                  ]
                },
                {
                  level: 'hard',
                  q: 'Using Paper 1\'s 8-bit numbers (0.2 pJ per multiply and 0.03 pJ per add), what is the power of the arithmetic alone, in watts, if all 65,536 MACs fire every cycle at 700 MHz? Then say why the measured chip power is higher.',
                  check: { answer: 10.55, unit: 'W (your answer to the first part)' },
                  hint: 'Energy per MAC times MACs per second.',
                  solution: [
                    'Energy per MAC: 0.2 + 0.03 = 0.23 pJ. MACs per second: 65,536 x 700 x 10^6 = 4.588 x 10^13.',
                    'Power = 0.23 x 10^-12 J x 4.588 x 10^13 per second = **10.55 W**.',
                    'The chip needs more power than this because the arithmetic is not all of it: the Unified Buffer reads and writes, the movement of values between neighbors, the accumulators, the clock network, leakage, and the weight DRAM traffic. Also, Paper 1\'s numbers are for 45 nm and the TPU is built in a different process. Treat 10.55 W as an order-of-magnitude lower bound, and compare it with the paper\'s measured power (reading task).'
                  ]
                },
                {
                  level: 'hard',
                  q: 'A redesign keeps the matrix unit (65,536 MACs at 700 MHz) and replaces the memory with one that delivers 180 GB/s. What is the new ridge point, in MACs per weight byte?',
                  check: { answer: 254.9, unit: 'MACs per weight byte' },
                  hint: 'Ridge = MACs per second divided by weight bytes per second.',
                  solution: [
                    'MACs per second: 65,536 x 700 x 10^6 = 4.588 x 10^13. New ridge = 4.588 x 10^13 / 1.8 x 10^11 = **254.9**.',
                    'Effect on the six workloads (MACs per weight byte 64 to 200 for the four memory-bound ones): all still sit left of 255, but their bounds rise by 180 / 34 = 5.3 times (MLP0 from 13.6 to 72 TOPS). CNN0 and CNN1 were already at the flat roof and gain nothing from the roofline. The paper\'s abstract estimates about a tripling of achieved TOPS on average, less than 5.3 times, because not every workload is memory-bound and other limits apply too.',
                    'The lesson: the cheapest big win for a memory-bound design is to move the memory wall, not to add multipliers.'
                  ]
                },
                {
                  level: 'hard',
                  q: 'Two devices have a mean batch time of 1 ms plus 0.02 ms per input in the batch. Device D is deterministic (99th percentile equals the mean). Device V varies (99th percentile is 1.5 times the mean). The limit is 9 ms at the 99th percentile. What is the ratio of the largest batch D can run to the largest batch V can run?',
                  check: { answer: 1.6, unit: 'x' },
                  hint: 'For each device, find the largest mean time that keeps its 99th percentile at or below 9 ms, then solve 1 + 0.02 x batch = that mean.',
                  solution: [
                    'D: mean <= 9 ms, so 1 + 0.02 x B <= 9 gives B <= 400.',
                    'V: mean <= 9 / 1.5 = 6 ms, so 1 + 0.02 x B <= 6 gives B <= 250.',
                    'Ratio = 400 / 250 = **1.6**. The deterministic device can run a 60% bigger batch inside the same limit, so it reuses each weight tile 60% more.',
                    'Think about the lesson: if the limit were 3 ms, D could still run B <= 100 while V (mean <= 2 ms) could run B <= 50. A tighter limit widens the gap in relative terms.'
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ];
})();
