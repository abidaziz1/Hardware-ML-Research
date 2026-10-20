/* Paper 3 lesson, parts 5 to 7: reading critically, wrap-up, practice problems. */
(function () {
  'use strict';
  window.ROOF = window.ROOF || {};

  window.ROOF.p3 = [
    /* ------------------------------ Part 5 ------------------------------ */
    {
      id: 'critique',
      title: 'Reading it critically',
      summary: 'What the model leaves out, and five common misreadings.',
      steps: [
        {
          id: 'caveats',
          title: 'What the roofline does not say',
          min: 6,
          blocks: [
            { t: 'p', text: 'The roofline is popular because it is simple. Simple models leave things out. Keep these in mind when you use it or read a paper that does.' },
            {
              t: 'list',
              ordered: true,
              items: [
                '**It is an upper bound, not a prediction.** A kernel under the roof may be slow for reasons the chart cannot show: long dependency chains, branches, load imbalance, latency.',
                '**It assumes compute and memory overlap perfectly.** If the program alternates between computing and waiting for data, the real time is closer to the sum than to the larger of the two.',
                '**Operational intensity is not fixed.** It depends on the cache size, the tile size, the data layout and the problem size. You must measure it or model it for the implementation you run.',
                '**It looks at one memory level.** The basic chart counts DRAM traffic. Bandwidth limits inside the chip (between cache levels or into a scratchpad) are not on it.',
                '**Its inputs need care.** Use a measured bandwidth (a program like {{stream|STREAM}}) and a realistic peak, and do not rely on datasheet numbers alone. State which number format the peak is for.'
              ]
            },
            {
              t: 'table',
              head: ['Claim', 'What supports it', 'Our confidence (opinion)'],
              rows: [
                ['Performance is bounded by compute or by bandwidth times intensity', 'Arithmetic. It is true by construction for the resources counted.', 'High, as a bound.'],
                ['One chart helps both programmers and architects', 'The paper applies it to several machines and kernels', 'Medium to high. Check the examples in your copy.'],
                ['Ceilings tell you which optimizations to apply and in what order', 'Worked examples in the paper', 'Medium. Real optimization order depends on the code.'],
                ['Operational intensity predicts where a kernel sits', 'Counting operations and bytes', 'High when you measure the bytes, lower when you estimate them.']
              ],
              source: 'original',
              caption: 'Our judgment of each claim. This column is opinion. Form your own after reading the paper.'
            },
            {
              t: 'callout',
              kind: 'note',
              title: 'Later work',
              body: 'Later researchers extended the idea to cache levels and to energy (a roofline for energy per operation instead of time). That work is outside this paper. It is a natural place to follow up on Paper 1.'
            },
            {
              t: 'quiz',
              id: 'roof-q17',
              q: 'A kernel reaches only 40% of its roofline bound. Which conclusion is the safest?',
              options: ['Something other than the two resources in the chart, or a missing optimization, keeps it from the bound', 'The roofline is wrong', 'The machine is broken', 'The kernel must be compute-bound'],
              answer: 0,
              whyNot: [null, 'The roof is a bound, not a promise. Being under it is normal.', 'Nothing suggests that.', 'You cannot tell which side of the ridge it is on from the percentage alone.'],
              explain: 'The gap between a kernel and its bound is what the ceilings and further measurement are for.'
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
                { front: 'Misreading 1: "The roofline predicts my run time."', back: 'It gives an upper bound on performance. Your kernel may sit well below it for reasons the chart cannot show.' },
                { front: 'Misreading 2: "Memory-bound means I need faster memory."', back: 'Either that or a higher operational intensity. Tiling, fusion, lower precision and batching all raise intensity without new hardware.' },
                { front: 'Misreading 3: "Operational intensity is a property of the algorithm."', back: 'It depends on the implementation and the cache too. The same matrix multiply has intensity 0.25 or 171 depending on how the loops are ordered.' },
                { front: 'Misreading 4: "A higher peak always means faster."', back: 'Only for kernels right of the ridge. A memory-bound kernel gains nothing from extra arithmetic, as the upgrade lab showed.' },
                { front: 'Misreading 5: "Compute-bound is the good place to be."', back: 'It means the memory system is keeping up. You can still be far below the flat roof if you lack SIMD or parallelism. The ceilings show that.' }
              ]
            },
            {
              t: 'quiz',
              id: 'roof-q18',
              q: 'A team doubles the number of cores and the program does not speed up. Using the roofline, what is the most likely explanation?',
              options: ['The program is left of the ridge, so memory bandwidth, not arithmetic, was the limit', 'Cores do not do arithmetic', 'The program is right of the ridge', 'The roofline does not apply to multicore chips'],
              answer: 0,
              whyNot: [null, 'Cores do the arithmetic. More cores raise the flat roof.', 'Right of the ridge, more compute would help, up to the new roof.', 'The model was written for multicore chips.'],
              explain: 'More cores lift the flat roof. A memory-bound kernel lives on the slope and does not notice.'
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
                'Paper 4 (Eyeriss) is about moving a design to the right on the intensity axis, by choosing a dataflow that reuses data in small local memories.',
                'Paper 5 (the TPU) draws a roofline for six real neural networks on a data-center accelerator. You can now read it: its horizontal axis counts operations per weight byte.',
                'Papers 8 and 9 (Timeloop and MAESTRO) compute the DRAM traffic of a design automatically, which is the denominator of operational intensity.',
                'Paper 18 (FlashAttention) raises the operational intensity of attention by tiling it so that large intermediate matrices never reach DRAM.'
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
                { part: 'idea', q: 'A machine has 100 G ops/s of peak compute and 25 GB/s of bandwidth. A kernel has an operational intensity of 2. What is its attainable performance?', options: ['50 G ops/s', '100 G ops/s', '25 G ops/s', '200 G ops/s'], answer: 0, explain: 'min(100, 25 x 2) = 50 G ops/s.' },
                { part: 'idea', q: 'What does operational intensity count in its denominator?', options: ['Bytes of DRAM traffic', 'Bytes of all memory accesses including registers', 'Seconds', 'Number of cores'], answer: 0, explain: 'Operations per byte that actually travel to and from main memory, after the caches have absorbed what they can.' },
                { part: 'idea', q: 'A kernel computes y[i] = a[i] + b[i] on 32-bit floats. What is its operational intensity?', options: ['About 0.083', '0.25', '3', '12'], answer: 0, explain: '1 operation per 12 bytes.' },
                { part: 'reading', q: 'A machine has 320 G ops/s and 40 GB/s. What is its ridge point?', options: ['8 operations per byte', '360', '0.125', '12,800'], answer: 0, explain: 'Ridge = peak / bandwidth = 320 / 40 = 8.' },
                { part: 'reading', q: 'A kernel is left of the ridge. Which change helps most?', options: ['Raise its operational intensity or the memory bandwidth', 'Add more arithmetic units', 'Raise the clock speed', 'Add SIMD instructions'], answer: 0, explain: 'Left of the ridge the memory system is the limit, and the other options raise the flat roof.' },
                { part: 'reading', q: 'Your kernel sits under a sloped ceiling labeled "no prefetching". What is the next step?', options: ['Add prefetching', 'Add SIMD', 'Use fewer bits', 'Add cores'], answer: 0, explain: 'A sloped ceiling is a bandwidth limit, and its label names the missing optimization.' },
                { part: 'raise', q: 'A tiled matrix multiply with 32 x 32 tiles of 32-bit values has what operational intensity?', options: ['8', '32', '0.25', '171'], answer: 0, explain: 'Intensity = T / 4 = 8.' },
                { part: 'raise', q: 'Three tiles no longer fit in the cache. What happens?', options: ['Tiles evict each other and the reuse falls toward the naive 0.25 operations per byte', 'Intensity doubles', 'Nothing', 'The roof rises'], answer: 0, explain: 'The reuse comes from keeping tiles resident. If they do not fit, they are reloaded.' },
                { part: 'nn', q: 'A fully connected layer with 8-bit weights at batch size 1 has about what operational intensity (weights counted as DRAM traffic)?', options: ['2 operations per byte', '200', '0.2', '2,000'], answer: 0, explain: 'Each weight byte feeds one MAC, which is 2 operations.' },
                { part: 'nn', q: 'Why can an accelerator keep most convolution layers compute-bound even with a ridge in the thousands?', options: ['Activations stay in an on-chip buffer, so only the weights count as DRAM traffic, and each weight is used many times', 'Convolutions need no memory', 'The ridge is lower for convolutions', 'They use fewer bits'], answer: 0, explain: 'The traffic in the denominator shrinks to the weights, and a convolution reuses each weight at every position.' }
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
              id: 'tb3',
              prompt: 'In five sentences, explain to a friend how to tell whether a program needs faster arithmetic or faster memory.',
              checklist: [
                'Defined operational intensity as operations per byte of DRAM traffic.',
                'Said that the roof is the lower of peak compute and bandwidth times intensity.',
                'Said that the ridge point separates memory-bound programs (left) from compute-bound ones (right).',
                'Gave one way to raise intensity (for example tiling or lower precision).'
              ]
            },
            { t: 'h', text: '2. One line per part' },
            {
              t: 'table',
              head: ['Part', 'One-line summary'],
              rows: [
                ['1. Two ways to be slow', 'Attainable = min(peak, bandwidth x intensity). Intensity is operations per DRAM byte.'],
                ['2. Reading the roofline', 'The ridge is peak over bandwidth. Compute helps right of it, bandwidth helps left of it, ceilings are missing optimizations.'],
                ['3. Raising intensity', 'Tiling gives T / 4 for 32-bit matrix multiply, up to the cache size. Fusion, fewer bits, compression and batching also cut bytes.'],
                ['4. Neural networks', 'A fully connected layer at batch 1 has 2 operations per weight byte. Accelerator ridges sit in the thousands, so reuse must be huge.'],
                ['5. Reading critically', 'The roofline is an upper bound with several simplifying assumptions.']
              ]
            },
            { t: 'h', text: '3. How to read the real paper' },
            { t: 'p', text: 'The paper is short. Read it in this order. Section titles may differ from the ones below, so match by content.' },
            {
              t: 'readmap',
              rows: [
                { section: 'The introduction: why a visual model for multicores', how: 'Read closely', note: 'The problem and the audience (Start here).', part: 'start' },
                { section: 'The model: operational intensity and the roofline construction', how: 'Read closely with a pencil', note: 'Match its definition and figure to Parts 1 and 2.', part: 'idea' },
                { section: 'Ceilings and how to use them', how: 'Read closely', note: 'List each ceiling and its optimization (Part 2).', part: 'reading' },
                { section: 'The machines and the kernels', how: 'Skim, then do the reading tasks', note: 'Write down every machine, its peak, its bandwidth and its ridge, and every kernel with its intensity.', part: 'reading' },
                { section: 'Using the model to guide optimization', how: 'Read closely', note: 'Compare its techniques with the levers table (Part 3).', part: 'raise' },
                { section: 'Discussion and conclusions', how: 'Skim', note: 'Note the limitations the authors state yourself (Part 5).', part: 'critique' }
              ]
            },
            { t: 'h', text: '4. References and where to go next' },
            {
              t: 'list',
              items: [
                'Williams, Waterman, Patterson. **Roofline: An Insightful Visual Performance Model for Multicore Architectures.** Communications of the ACM, 2009.',
                'Wulf and McKee. **Hitting the Memory Wall: Implications of the Obvious.** ACM SIGARCH Computer Architecture News, 1995. The origin of the memory wall.',
                'Next: **Paper 4, Eyeriss,** which shows how an accelerator reuses data to raise its operational intensity, and **Paper 5, the TPU,** which draws a roofline for six real networks.'
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
              id: 'roof-practice',
              intro: 'Do each problem on paper first. Type a numeric answer and press **Check my answer**. It says only Correct or Not yet and never shows the answer. Open the hint if you are stuck, and open the solution when you are done. You can check your answers against the widgets in Parts 1 to 4 after you try them by hand.',
              problems: [
                {
                  level: 'simple',
                  q: 'A machine has a peak of 320 G ops/s and 40 GB/s of memory bandwidth. What is its ridge point, in operations per byte?',
                  check: { answer: 8, unit: 'ops per byte' },
                  hint: 'Ridge = peak divided by bandwidth.',
                  solution: [
                    '320 / 40 = **8** operations per byte.',
                    'A kernel needs at least 8 operations for every DRAM byte it moves to keep the arithmetic units busy. Below that it is memory-bound.'
                  ]
                },
                {
                  level: 'simple',
                  q: 'On the same machine (320 G ops/s, 40 GB/s), a kernel performs 120 operations for every 40 bytes it moves to or from DRAM. What is its attainable performance in G ops/s?',
                  check: { answer: 120, unit: 'G ops/s' },
                  hint: 'First compute the operational intensity, then take the smaller of the compute roof and bandwidth x intensity.',
                  solution: [
                    'Intensity = 120 / 40 = 3 operations per byte. Bandwidth x intensity = 40 x 3 = 120 G ops/s. Peak is 320.',
                    'Attainable = min(320, 120) = **120 G ops/s**. Intensity 3 is left of the ridge at 8, so the kernel is memory-bound and uses 37.5% of the peak.'
                  ]
                },
                {
                  level: 'simple',
                  q: 'A dot product of two vectors of 16-bit values does 2 operations (a multiply and an add) per pair of elements and reads 2 bytes from each vector. Nothing is written per element. What is its operational intensity?',
                  check: { answer: 0.5, unit: 'ops per byte' },
                  hint: 'Operations divided by bytes: 2 operations over how many bytes per pair?',
                  solution: [
                    'Bytes per pair: 2 + 2 = 4. Operations per pair: 2. Intensity = 2 / 4 = **0.5**.',
                    'The same dot product with 32-bit values has 0.25, and with 8-bit values it has 1. Halving the bytes doubles the intensity.'
                  ]
                },
                {
                  level: 'medium',
                  q: 'A tiled matrix multiply uses 12 x 12 tiles of 32-bit values (operational intensity = T / 4). On a machine with 100 G ops/s and 25 GB/s, what is its attainable performance in G ops/s?',
                  check: { answer: 75, unit: 'G ops/s' },
                  hint: 'Find the intensity from T, then apply min(peak, bandwidth x intensity).',
                  solution: [
                    'Intensity = 12 / 4 = 3. Bandwidth x intensity = 25 x 3 = 75. Peak = 100.',
                    'Attainable = **75 G ops/s**. A 16 x 16 tile would reach the ridge (intensity 4) and the full 100.'
                  ]
                },
                {
                  level: 'medium',
                  q: 'On a machine with 200 G ops/s and 25 GB/s, what is the smallest power-of-two tile size T that lets a tiled 32-bit matrix multiply reach peak? (Intensity = T / 4.)',
                  check: { answer: 32, unit: 'T' },
                  hint: 'The kernel reaches peak when its intensity is at least the ridge.',
                  solution: [
                    'Ridge = 200 / 25 = 8. Need T / 4 >= 8, so T >= 32.',
                    'The smallest power of two is **32** (intensity exactly 8). A tile of 16 gives 4, only half of peak. Now check that three 32 x 32 tiles (12 KB) fit in your cache. They fit in any normal cache.'
                  ]
                },
                {
                  level: 'medium',
                  q: 'Three T x T tiles of 32-bit values must fit in a 2 MB cache (2,097,152 bytes). What is the largest power-of-two T?',
                  check: { answer: 256, unit: 'T' },
                  hint: 'Footprint = 3 x T squared x 4 bytes. Find the largest power of two with a footprint at most 2,097,152.',
                  solution: [
                    '3 x T squared x 4 <= 2,097,152 gives T squared <= 174,762, so T <= 418.',
                    'The largest power of two is **256**. Check: 3 x 65,536 x 4 = 786,432 bytes, which fits. T = 512 needs 3,145,728 bytes, more than the cache.',
                    'In practice you would pick a tile somewhat smaller than the largest that fits, to leave room for other data and avoid conflicts.'
                  ]
                },
                {
                  level: 'hard',
                  q: 'A fully connected layer has 8-bit weights. Only weight bytes count as DRAM traffic, and each MAC is 2 operations. A chip has 120 T ops/s of peak compute and 60 GB/s of memory bandwidth. What is the smallest batch size at which the layer reaches peak?',
                  check: { answer: 1000, tol: 0.03, unit: 'inputs per batch' },
                  hint: 'At batch N the intensity is 2 x N. Compare it with the ridge point.',
                  solution: [
                    'Ridge = 120 x 10^12 / 60 x 10^9 = 2,000 operations per byte. Intensity at batch N = 2 x N.',
                    'Need 2 x N >= 2,000, so N >= **1,000**.',
                    'Think about what a batch of 1,000 means. The first request waits for 999 others. A service with a response-time limit cannot do that, so the chip would stay under the roof. Options: more bandwidth, lower precision on activations, or a model with more reuse per weight.'
                  ]
                },
                {
                  level: 'hard',
                  q: 'On a machine with 100 G ops/s and 25 GB/s, a program does the same number of operations in two kernels: kernel A at intensity 1 and kernel B at intensity 16. Total run time is the sum of the two kernels\' times. By what factor does the total time fall if you double the memory bandwidth to 50 GB/s?',
                  check: { answer: 1.667, unit: 'x' },
                  hint: 'Find each kernel\'s attainable performance before and after. Time per operation is the inverse of performance. Add the two times.',
                  solution: [
                    {
                      t: 'table',
                      head: ['', 'Kernel A (intensity 1)', 'Kernel B (intensity 16)', 'Time per G op, summed'],
                      rows: [
                        ['Now (25 GB/s)', '25 G ops/s, time 0.04', 'min(100, 400) = 100, time 0.01', '0.05'],
                        ['50 GB/s', '50 G ops/s, time 0.02', 'still 100, time 0.01', '0.03'],
                        ['Compute 2x instead', 'still 25, time 0.04', 'min(200, 400) = 200, time 0.005', '0.045']
                      ]
                    },
                    'Doubling bandwidth: 0.05 / 0.03 = **1.67**. Doubling compute instead gives 0.05 / 0.045 = 1.11.',
                    'The slow kernel dominates the total time, and it is memory-bound, so bandwidth is the better purchase for this program.'
                  ]
                },
                {
                  level: 'hard',
                  q: 'A chip has 64 T ops/s of peak compute and 25 GB/s of memory bandwidth. A redesign raises the bandwidth to 160 GB/s and keeps the same peak. What is the new ridge point, in operations per byte? Then explain what this does to a layer with an operational intensity of 800, and name two ways to get a similar benefit in software.',
                  check: { answer: 400, unit: 'ops per byte (the new ridge)' },
                  hint: 'Ridge = peak / bandwidth. Compute the old and new values, then place the layer at 800.',
                  solution: [
                    'Old ridge = 64 x 10^12 / 25 x 10^9 = 2,560. New ridge = 64 x 10^12 / 160 x 10^9 = **400**.',
                    'The layer at 800: before, it is left of the old ridge and reaches min(64,000, 25 x 800) = 20,000 G ops/s, 31% of peak. After, it is right of the new ridge of 400 and reaches the full 64,000 G ops/s.',
                    'Software options that raise intensity without new hardware: use lower precision (halving the bytes doubles the intensity, so 800 becomes 1,600); fuse the layer with its neighbors so intermediate results stay on chip; run a larger batch where latency allows; keep more data in the on-chip buffer.'
                  ]
                },
                {
                  level: 'hard',
                  q: 'A kernel performs 3,000 G operations and moves 600 GB through DRAM in 60 seconds on a machine with 100 G ops/s of peak and 25 GB/s of bandwidth. What percent of its roofline bound does it reach? Then say what the chart tells you to try next.',
                  check: { answer: 50, unit: '% of the roof' },
                  hint: 'Compute achieved performance (operations over time) and the intensity (operations over bytes). Read the roof at that intensity.',
                  solution: [
                    'Achieved: 3,000 / 60 = 50 G ops/s. Intensity: 3,000 / 600 = 5 operations per byte.',
                    'The ridge is 100 / 25 = 4, so intensity 5 is right of the ridge. The roof there is the flat 100 G ops/s. Share of the roof = 50 / 100 = **50%**.',
                    'The kernel is already in the compute-bound region, so more bandwidth or more reuse would not help. Look at the compute ceilings: SIMD instructions, instruction-level parallelism, and a balance of multiplies and adds. Half of the roof is probably missing because of one of them.'
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
