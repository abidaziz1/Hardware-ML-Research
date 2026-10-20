/* Paper 5 lesson, parts 3 and 4: the evidence, and why the TPU is efficient. */
(function () {
  'use strict';
  window.TPU = window.TPU || {};

  window.TPU.p2 = [
    /* ------------------------------ Part 3 ------------------------------ */
    {
      id: 'perf',
      title: 'The evidence',
      summary: 'The baselines, the roofline of six workloads, and the headline results.',
      steps: [
        {
          id: 'baselines',
          title: 'What the TPU is compared against',
          min: 5,
          blocks: [
            {
              t: 'callout',
              kind: 'example',
              body: 'A race between a new delivery van and an old truck proves little unless both carry the same load over the same route in the same traffic. The paper makes a point of running the same applications on the same kind of servers, but you should check each condition yourself.'
            },
            { t: 'p', text: 'The paper compares the TPU with two chips deployed in the same datacenters in the same period: a server-class **Intel Haswell CPU** and an **Nvidia K80 GPU**. The workloads are the six production networks, written in TensorFlow. That is a strong setup, since the baselines are the real alternatives Google had in its fleet.' },
            {
              t: 'table',
              head: ['Question to ask', 'Why it matters', 'Where to look in the paper'],
              rows: [
                ['Which number format does each chip use?', 'The TPU uses 8-bit integers. A baseline running 32-bit floats does more work per operation, and the accuracy may differ.', 'The platform table and the discussion of quantization'],
                ['How old is each baseline?', 'The comparison is with hardware of the 2015 era, not with later chips.', 'The platform table'],
                ['Was power measured for the chip alone or for the whole server?', 'A host server draws a lot of power on top of the accelerator.', 'The power and performance per watt sections'],
                ['What batch size does each chip run?', 'Batch size changes throughput and latency (Part 1).', 'The latency table'],
                ['Who ran the measurements?', 'The authors ran Google\'s own workloads. Independent checks are rare.', 'The methodology section']
              ],
              source: 'original',
              caption: 'Our checklist for reading the evidence. The right-hand column points to the kind of section where each answer lives. Check section names in your copy.'
            },
            {
              t: 'callout',
              kind: 'try',
              title: 'Reading task',
              body: 'Find the table that lists the three chips (the Haswell CPU, the K80 GPU and the TPU). For each record: the number of cores or MAC units, the clock, the peak TOPS, the memory bandwidth, the power (TDP) and the die size. Compute each chip\'s ridge point (peak operations over bandwidth) and compare them with the TPU\'s 1,349 MACs per byte.'
            },
            {
              t: 'quiz',
              id: 'tpu-q8',
              q: 'Why does it matter that the TPU uses 8-bit integers while a baseline may use 32-bit floating point?',
              options: ['The 8-bit multiplier costs far less energy and moves a quarter of the bytes, so part of the TPU\'s advantage comes from the number format, and accuracy must be checked', 'Number format has no effect on speed or energy', 'It only matters for training', 'Integers are always less accurate'],
              answer: 0,
              whyNot: [null, 'Paper 1 showed multiplier energy scales with bits squared and memory traffic with bits.', 'The paper is about inference, where low precision is common.', 'Many inference networks keep their accuracy at 8 bits, but it has to be checked for each network.'],
              explain: 'A fair comparison states the formats. Lower precision is one of the sources of the gain, together with the architecture.'
            }
          ]
        },
        {
          id: 'roofline',
          title: 'The TPU roofline: six workloads',
          min: 9,
          blocks: [
            { t: 'p', text: 'Paper 3 gave you the tool. The TPU\'s roofline has a peak of 91.75 TOPS and a bandwidth of 34 GB/s of weights, so its ridge is at about 1,349 MACs per weight byte. Put each workload where its MACs per weight byte say, and read its upper bound off the roof.' },
            { t: 'widget', name: 'tpuRoofline', title: 'The six workloads on the first TPU\'s roofline', tag: 'Our roofline arithmetic, workload values from memory', source: 'original' },
            {
              t: 'callout',
              kind: 'try',
              body: [
                '1. With **DDR3**, the four networks left of the ridge have these bounds: MLP0 **13.6** TOPS, MLP1 **11.4**, LSTM0 **4.4**, LSTM1 **6.5**. The two CNNs sit right of the ridge and can reach the full 92 TOPS.',
                '2. Look at the bounds as a share of peak: the MLPs and LSTMs can use only between 5% and 15% of the matrix unit. The 65,536 multipliers are not the limit. The weight memory is.',
                '3. Switch to **Faster memory (180 GB/s)**. The ridge falls to about 255 MACs per byte. MLP0 rises to **72** TOPS (5.3 times), MLP1 to about 60, LSTM1 to about 35 and LSTM0 to about 23. All four memory-bound networks gain a lot.',
                '4. Notice that CNN0 and CNN1 do not change. They were already at the flat roof.'
              ]
            },
            {
              t: 'callout',
              kind: 'paper',
              body: 'The paper plots the roofline of the TPU with the six applications on it, and notes that four of the six are limited by memory bandwidth, so a faster weight memory would help most. These are upper bounds. Measured values are lower, and the paper explains the gaps. (Our paraphrase. **Reading task:** find the roofline figure and the table of achieved TOPS. Write down each application\'s measured TOPS next to the bound you computed here, and find the paper\'s explanation for the application that is far below its bound.)'
            },
            {
              t: 'quiz',
              id: 'tpu-q9',
              q: 'MLP1 does 168 MACs per weight byte. Using 34 GB/s of weight bandwidth and 2 operations per MAC, what is its roofline bound?',
              options: ['About 11.4 TOPS', 'About 92 TOPS', 'About 5.7 TOPS', 'About 168 TOPS'],
              answer: 0,
              whyNot: [null, 'That is the peak, which only workloads right of the ridge (above 1,349) can reach.', 'That forgets the factor of 2 operations per MAC.', 'That is the MACs per byte, not a throughput.'],
              explain: '34 x 10^9 bytes per second x 168 MACs per byte x 2 operations = 11.4 x 10^12 operations per second.'
            }
          ]
        },
        {
          id: 'results',
          title: 'The headline results, and what to question',
          min: 7,
          blocks: [
            {
              t: 'table',
              head: ['Claim', 'Source', 'Status'],
              rows: [
                ['On average about 15 to 30 times faster than the contemporary GPU or CPU, despite low utilization on some applications', 'Abstract', 'Confirmed'],
                ['TOPS per watt about 30 to 80 times higher', 'Abstract', 'Confirmed'],
                ['Using the GPU\'s GDDR5 memory in the TPU would triple the achieved TOPS', 'Abstract', 'Confirmed'],
                ['That change would raise TOPS per watt to nearly 70 times the GPU and 200 times the CPU', 'Abstract', 'Confirmed']
              ],
              source: 'paper',
              caption: 'The paper\'s headline claims as stated in its abstract.'
            },
            { t: 'p', text: 'Read the numbers with care. They are averages over six applications, so some applications gain much more and some less. The performance per watt depends on whether the power of the whole server is counted. And the what-if on faster memory is an estimate for a chip that was not built.' },
            {
              t: 'list',
              ordered: true,
              items: [
                '**The baselines are 2015-era chips** running Google\'s workloads. A newer GPU or a tuned 8-bit implementation would narrow the gap.',
                '**The authors measured their own workloads.** The six networks are real, but they are Google\'s.',
                '**Quantization has a cost.** The TPU runs the networks at 8 bits. Check what the paper says about accuracy.',
                '**An average hides the spread.** The speedup varies by application. Find the per-application numbers.',
                '**Memory dominates.** The paper itself says faster memory would help most, which is a strong statement about the first design.'
              ]
            },
            {
              t: 'quiz',
              id: 'tpu-q10',
              q: 'Two chips deliver the same number of operations per second. Chip A\'s TOPS per watt is 30 times chip B\'s. How do their powers compare?',
              options: ['A uses one thirtieth of the power of B', 'A uses 30 times the power of B', 'They use the same power', 'It depends on the clock only'],
              answer: 0,
              whyNot: [null, 'Higher TOPS per watt means less power for the same TOPS, not more.', 'If the TOPS are equal and the TOPS per watt differ, the powers must differ.', 'The clock does not set the ratio. TOPS per watt is operations per second divided by watts.'],
              explain: 'Power = TOPS divided by TOPS per watt. With equal TOPS, 30 times the TOPS per watt means one thirtieth of the power.'
            },
            {
              t: 'quiz',
              id: 'tpu-q11',
              q: 'The paper says using GDDR5 memory would roughly triple the TPU\'s achieved TOPS. What does that tell you about the workloads?',
              options: ['Many are limited by memory bandwidth, not by the matrix unit', 'The matrix unit is too slow', 'The clock is too low', 'The workloads are too small'],
              answer: 0,
              whyNot: [null, 'If the matrix unit were the limit, faster memory would change nothing.', 'A higher clock would help compute-bound workloads, not memory-bound ones.', 'Size is not the issue. The ratio of arithmetic to weight bytes is.'],
              explain: 'A big gain from memory alone means the workloads sit on the sloped part of the roofline.'
            }
          ]
        }
      ]
    },

    /* ------------------------------ Part 4 ------------------------------ */
    {
      id: 'better',
      title: 'Why the TPU is efficient',
      summary: 'Paper 1\'s energy table, determinism, and Paper 4\'s dataflow vocabulary.',
      steps: [
        {
          id: 'energy',
          title: 'Paper 1 meets Paper 5: the energy of an 8-bit MAC',
          min: 8,
          blocks: [
            { t: 'p', text: 'Use Paper 1\'s 45 nm table to size the effect of 8-bit arithmetic. An 8-bit multiply costs about 0.2 pJ and an 8-bit add about 0.03 pJ (both marked as needing a check in Paper 1). A 32-bit float multiply and add cost 3.7 and 0.9 pJ.' },
            {
              t: 'table',
              head: ['Operation', 'Energy', 'Ratio'],
              rows: [
                ['8-bit integer MAC (0.2 + 0.03)', '0.23 pJ', '1'],
                ['32-bit float MAC (3.7 + 0.9)', '4.6 pJ', 'about 20 times more']
              ],
              source: 'toy',
              caption: 'Paper 1\'s 45 nm numbers. The TPU is built in a different process, so use the ratio, not the absolute values.'
            },
            { t: 'p', text: 'The arithmetic is cheap. Data movement then decides. For the weights, which come from DRAM, every weight byte costs about 162.5 pJ (a quarter of Paper 1\'s 650 pJ per 32-bit word). It is read once per weight tile and used for V input vectors. So the weight traffic costs 162.5 / V pJ per MAC.' },
            {
              t: 'table',
              head: ['Vectors per weight tile, V', 'Weight DRAM energy per MAC', 'Compared with the 0.23 pJ MAC'],
              rows: [
                ['1 (a fully connected layer at batch 1)', '162.5 pJ', '700 times more'],
                ['200 (MLP0\'s batch)', '0.81 pJ', 'About 3.5 times more'],
                ['1,350 (the ridge)', '0.12 pJ', 'About half'],
                ['3,136 (a 56 x 56 convolution)', '0.05 pJ', 'About a fifth']
              ],
              source: 'toy',
              caption: 'Our arithmetic with Paper 1\'s numbers (162.5 / V). A rough model that counts only weight reads from DRAM.'
            },
            { t: 'callout', kind: 'note', title: 'Our take', body: 'This is Paper 1 in action. A cheap multiplier makes the arithmetic nearly free, so energy is dominated by how often each weight is reused. That is why the TPU spends its silicon on a huge buffer for activations and on a pipeline that keeps the array fed.' },
            {
              t: 'quiz',
              id: 'tpu-q12',
              q: 'Using 162.5 pJ per weight byte and 0.23 pJ per MAC, at about how many vectors per weight tile does the weight DRAM energy per MAC equal the arithmetic energy?',
              options: ['About 700', 'About 20', 'About 70,000', 'About 7'],
              answer: 0,
              whyNot: [null, 'At 20 vectors the DRAM share would be 8 pJ per MAC, far above 0.23 pJ.', 'At 70,000 vectors DRAM would cost only 0.002 pJ per MAC, far below the arithmetic.', 'At 7 vectors the DRAM share would be about 23 pJ per MAC, around 100 times the arithmetic.'],
              explain: '162.5 / V = 0.23 gives V = 706.'
            }
          ]
        },
        {
          id: 'determinism',
          title: 'Determinism: why no caches or out-of-order logic',
          min: 6,
          blocks: [
            {
              t: 'callout',
              kind: 'example',
              body: 'A train that runs on a fixed timetable arrives when it says. A taxi that picks the fastest route each time is quicker on average but sometimes gets stuck. If you must tell a hundred thousand people exactly when they will arrive, you want the train.'
            },
            { t: 'p', text: 'A CPU or GPU speeds up the average case with features whose effect depends on what happened before. The TPU leaves most of them out.' },
            {
              t: 'table',
              head: ['Feature', 'Helps', 'Costs for a latency limit', 'TPU'],
              rows: [
                ['Caches', 'Average memory time', 'A miss is much slower than a hit, so time varies', 'None. A software-managed buffer instead.'],
                ['Out-of-order execution', 'Average instruction throughput', 'Timing depends on what else is in flight', 'None'],
                ['Multithreading', 'Hides stalls on average', 'Threads compete, so time varies', 'None'],
                ['Prefetching', 'Average memory time', 'A wrong guess wastes bandwidth', 'None']
              ],
              source: 'original',
              caption: 'Our summary of the trade-off. The paper argues that these features help average throughput more than guaranteed latency.'
            },
            { t: 'p', text: 'There is a second benefit. Leaving out these features frees chip area for more MACs and memory, and cuts power. The abstract says this helps explain why the TPU, with its many MACs and big memory, is relatively small and low power.' },
            {
              t: 'callout',
              kind: 'paper',
              body: 'The abstract argues that the TPU\'s deterministic execution model matches the 99th-percentile response-time requirement better than time-varying optimizations such as caches, out-of-order execution, multithreading, multiprocessing and prefetching. It also says the lack of these features helps explain why the TPU is relatively small and low power.'
            },
            {
              t: 'quiz',
              id: 'tpu-q13',
              q: 'Why is a cache a problem for a strict 99th-percentile latency limit?',
              options: ['A miss takes much longer than a hit, so run time varies from request to request', 'Caches use no power', 'Caches cannot hold weights', 'A cache makes the average slower'],
              answer: 0,
              whyNot: [null, 'Caches use area and power.', 'Caches can hold any data. The issue is timing variation.', 'A cache usually makes the average faster, which is why it is common.'],
              explain: 'The tail is set by the slow cases. A cache widens the gap between fast and slow cases.'
            }
          ]
        },
        {
          id: 'dataflow',
          title: 'Which dataflow is the TPU?',
          min: 8,
          blocks: [
            { t: 'p', text: 'Use Paper 4\'s vocabulary. In the TPU\'s matrix unit, **weights stay in the PEs**, input vectors flow through them, and partial sums pass from PE to PE and are collected at the edge. The weight is the stationary data, so this is a {{weight-stationary|weight stationary}} dataflow, built as a systolic array.' },
            {
              t: 'table',
              head: ['', 'TPU matrix unit', 'Eyeriss (Paper 4)'],
              rows: [
                ['Array', '256 x 256 = 65,536 MAC units', '12 x 14 = 168 PEs'],
                ['Number format', '8-bit integers', '16-bit fixed point'],
                ['Stationary data', 'Weights (one per PE)', 'Rows of weights and inputs, with partial sums kept local'],
                ['Local storage per PE', 'A weight and a few registers', 'About half a kilobyte of register file'],
                ['Big on-chip memory', '24 MiB Unified Buffer', 'About 108 KB global buffer'],
                ['What it needs to stay busy', 'Thousands of vectors per weight tile', 'Enough rows to fill the PE set'],
                ['Target', 'Datacenter inference with a latency limit', 'Low-power CNN inference']
              ],
              source: 'original',
              caption: 'Our comparison. The TPU column draws on this lesson. The Eyeriss column draws on Paper 4. Both lessons mark the figures that need checking.'
            },
            { t: 'p', text: 'Weight stationary is the right match when the workload gives each weight many uses and when you can afford a huge array with simple PEs. Paper 4 warned that weight stationary leaves partial sums and inputs expensive to move. The TPU answers with a design in which partial sums only travel between neighbors (cheap) and accumulate in a dedicated memory, and inputs are read once and flow across (reused by every column).' },
            {
              t: 'quiz',
              id: 'tpu-q14',
              q: 'In the TPU\'s matrix unit, which data stays in the PEs while the other data flows past?',
              options: ['The weights', 'The partial sums', 'The input vectors', 'Nothing'],
              answer: 0,
              whyNot: [null, 'Partial sums pass from PE to PE and are collected at the bottom.', 'Input vectors flow in and across the array.', 'The weights are loaded and held, which is the point of the design.'],
              explain: 'Weight stationary: each PE holds one weight, and inputs and partial sums move.'
            },
            {
              t: 'quiz',
              id: 'tpu-q15',
              q: 'A fully connected layer at batch 1 on a weight-stationary systolic array is a poor fit. Why?',
              options: ['Each loaded weight tile serves only one input vector, so the array waits for weights almost all the time', 'The array cannot multiply', 'Fully connected layers have no weights', 'The partial sums overflow'],
              answer: 0,
              whyNot: [null, 'It can multiply. It just cannot be kept busy.', 'Fully connected layers are mostly weights.', 'Overflow is not the issue. The issue is the ratio of weight loads to MACs.'],
              explain: 'The whole weight tile is fetched for one vector. The load takes about 1,349 cycles for 1 cycle of useful work.'
            }
          ]
        }
      ]
    }
  ];
})();
