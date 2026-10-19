/* Paper 2 lesson, parts 6 to 8: reading critically, wrap-up, practice problems. */
(function () {
  'use strict';
  window.SZE = window.SZE || {};

  window.SZE.p3 = [
    /* ------------------------------ Part 6 ------------------------------ */
    {
      id: 'critique',
      title: 'Reading it critically',
      summary: 'What the survey supports, where it is dated, and common misreadings.',
      steps: [
        {
          id: 'caveats',
          title: 'What to question',
          min: 6,
          blocks: [
            { t: 'p', text: 'A survey collects other people\'s results. It is a map, not a measurement. Read it with these checks.' },
            {
              t: 'list',
              ordered: true,
              items: [
                '**It is from 2017 and mostly about CNNs.** Transformers and large language models now dominate, with different reuse patterns: attention multiplies activations by activations, and decoding rereads huge weight sets for each token. Paper 18 (FlashAttention) picks that up.',
                '**Numbers from different papers do not line up.** Accelerators in the survey were built in different manufacturing processes, tested on different networks and batch sizes, and counted energy differently. Do not rank them by their quoted figures.',
                '**It is secondary.** When a number matters, find the original paper and check its conditions.',
                '**Energy ratios depend on the process and precision.** The 1x, 2x, 6x, 200x hierarchy is a good guide, not a constant of nature. Paper 1\'s 45 nm table gives about 140x for 32-bit DRAM against a MAC.',
                '**The four dataflows simplify real designs.** Real accelerators mix them, and later tools (Papers 8 and 9) describe designs more precisely.'
              ]
            },
            {
              t: 'table',
              head: ['Claim', 'What supports it', 'Our confidence (opinion)'],
              rows: [
                ['Data movement dominates the energy of DNN processing', 'The memory hierarchy cost ratios, and the four accesses per MAC', 'High. Matches Paper 1.'],
                ['Dataflow is the central design choice of an accelerator', 'The survey\'s treatment of reuse and the dataflow families, backed by Paper 4', 'High, with the caveat that real designs mix dataflows.'],
                ['MACs and weight counts are poor proxies for energy and latency', 'Argument and examples', 'Medium to high. Check the examples.'],
                ['Lower precision, sparsity and compact layers give large savings', 'Surveyed results from many papers', 'Depends on the network and on the accuracy you accept.'],
                ['TOPS alone is not enough to compare chips', 'The metrics discussion', 'High. Paper 11 expands it.']
              ],
              source: 'original',
              caption: 'Our judgment of each claim. This column is opinion. Form your own after reading the survey.'
            },
            {
              t: 'quiz',
              id: 'sze-q24',
              q: 'Why can you not rank two accelerators from the survey by comparing their quoted energy numbers directly?',
              options: ['They may use different processes, networks, batch sizes and ways of counting energy', 'Energy cannot be measured', 'All accelerators use the same energy', 'The survey does not list any numbers'],
              answer: 0,
              whyNot: [null, 'It can be measured. The problem is comparing different measurements.', 'They differ a lot, which is why the comparison matters.', 'It lists many. The problem is that they come from different setups.'],
              explain: 'Numbers are only comparable when the manufacturing process, network, batch size and scope of power measurement match.'
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
                { front: 'Misreading 1: "Fewer MACs always means faster."', back: 'Speed and energy depend on data movement and utilization. A network with fewer MACs and poor reuse can be slower and costlier.' },
                { front: 'Misreading 2: "A spatial architecture is always better."', back: 'It wins when the workload has regular reuse and you can map it well. A CPU or GPU is more flexible and has mature software.' },
                { front: 'Misreading 3: "Dataflow is only a hardware decision."', back: 'It depends on the layer shape and batch size, so the software that maps layers onto the array matters as much as the array. Papers 8 and 9 study this mapping.' },
                { front: 'Misreading 4: "Skipping zeros is free."', back: 'Finding non-zero values needs index storage and logic, and the work can become uneven across PEs. Compression can even make storage larger when few values are zero.' },
                { front: 'Misreading 5: "TOPS/W settles the comparison."', back: 'It leaves out the network, the batch size, accuracy and what the power number covers. Paper 11 is about this.' }
              ]
            },
            {
              t: 'quiz',
              id: 'sze-q25',
              q: 'A colleague says: "This 1 x 1 layer has 5 times fewer MACs than that 3 x 3 layer, so it will run 5 times faster." What is the best reply?',
              options: ['Maybe not: a 1 x 1 layer has less reuse per value, so it may be limited by data movement and run less than 5 times faster', 'Correct, time is proportional to MACs', 'MACs do not matter at all', 'The layer cannot run on any hardware'],
              answer: 0,
              whyNot: [null, 'Time is proportional to MACs only when the arithmetic is the bottleneck. Many layers are limited by memory.', 'MACs matter, but they are not the whole story.', 'It runs on any hardware.'],
              explain: 'A 1 x 1 layer has fewer weights reused over fewer overlapping windows, so it often has a lower ratio of MACs to data moved and is more memory-bound than a 3 x 3 layer.'
            }
          ]
        }
      ]
    },

    /* ------------------------------ Part 7 ------------------------------ */
    {
      id: 'wrap',
      title: 'Wrap-up',
      summary: 'What came next, a final quiz, a teach-back and a reading map.',
      steps: [
        {
          id: 'next',
          title: 'What came next (later work, not in the survey)',
          min: 3,
          blocks: [
            { t: 'callout', kind: 'note', title: 'Later context', body: 'Everything on this page is outside the survey or came after it. Later lessons will check each item against its own paper.' },
            {
              t: 'list',
              items: [
                'Paper 3 (Roofline) turns the comparison of arithmetic and memory into one chart you can draw for any chip.',
                'Paper 4 (Eyeriss) develops the row stationary dataflow and measures it against weight stationary, output stationary and no local reuse.',
                'Paper 5 (the TPU) is a large production spatial accelerator. You can now ask which dataflow it uses and how it handles a fully connected layer at batch size 1.',
                'Papers 6 and 7 (EIE, SCNN) build accelerators around zeros. Papers 8 to 10 provide models and tools for evaluating dataflows without building the chip.'
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
                { part: 'basics', q: 'A fully connected layer maps 1,000 inputs to 500 outputs. How many MACs does it do for one input?', options: ['500,000', '1,500', '500', '1,000'], answer: 0, explain: 'Every output uses every input: 1,000 x 500 = 500,000.' },
                { part: 'basics', q: 'A CONV layer has 64 filters over 32 input channels, 3 x 3 filters and a 28 x 28 output, batch 1. About how many MACs?', options: ['14.5 million', '1.6 million', '50 thousand', '460 million'], answer: 0, explain: '28 x 28 x 64 x 32 x 3 x 3 = 14,450,688.' },
                { part: 'basics', q: 'A 32 x 32 input meets a 5 x 5 filter, stride 1, no padding. What is the output height?', options: ['28', '27', '32', '30'], answer: 0, explain: '(32 - 5 + 1) / 1 = 28.' },
                { part: 'cpugpu', q: 'Why does turning a convolution into a matrix multiply cost extra memory?', options: ['Overlapping windows are copied into the matrix, so image values repeat', 'Matrix multiplies need more weights', 'It removes the padding', 'It doubles the precision'], answer: 0, explain: 'Each window becomes a row, so values that appear in several windows are copied several times.' },
                { part: 'movement', q: 'How many memory accesses does one MAC need if nothing is reused?', options: ['Four: three reads and one write', 'One', 'Two', 'Eight'], answer: 0, explain: 'Read the weight, the input and the partial sum, then write the partial sum.' },
                { part: 'movement', q: 'Which kind of reuse needs more than one input in a batch?', options: ['Filter reuse', 'Convolutional reuse', 'Input feature map reuse', 'None of them'], answer: 0, explain: 'Filter reuse means the same weights serve several inputs.' },
                { part: 'movement', q: 'A design keeps partial sums in each PE until the output is finished and streams weights and inputs past. Which dataflow is it?', options: ['Output stationary', 'Weight stationary', 'No local reuse', 'Row stationary'], answer: 0, explain: 'The partial sum is the stationary data.' },
                { part: 'codesign', q: 'With 8-bit weights and a 4-bit index per non-zero weight, below what fraction of zero weights does compressed storage become larger than dense storage?', options: ['About one third', 'About one half', '90%', '1%'], answer: 0, explain: 'Compressed size is (1 - z) x 12 / 8 of dense. It exceeds dense when 1 - z > 8/12, which is z < 1/3.' },
                { part: 'codesign', q: 'Network A has fewer MACs than Network B. When can A still use more energy?', options: ['When its energy per MAC is higher because its data comes from farther away', 'Never', 'Only when it has more layers', 'Only when the clock is slower'], answer: 0, explain: 'Total energy is MACs times energy per MAC.' },
                { part: 'metrics', q: 'Why report utilization with peak throughput?', options: ['Peak assumes every MAC unit is busy every cycle, which real networks rarely achieve', 'Utilization is a type of accuracy', 'Peak is always lower than achieved', 'Utilization sets the clock'], answer: 0, explain: 'Achieved throughput is peak times utilization.' }
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
              id: 'tb2',
              prompt: 'In five sentences, explain to a friend why the dataflow of an accelerator matters more than its raw arithmetic speed.',
              checklist: [
                'Said that each MAC needs several memory accesses and that DRAM costs about 200 times a MAC.',
                'Named reuse (of weights, inputs and partial sums) as the thing a dataflow tries to increase.',
                'Gave one dataflow (for example weight stationary) and what it keeps in place.',
                'Said that the best choice depends on the layer shape and batch size.'
              ]
            },
            { t: 'h', text: '2. One line per part' },
            {
              t: 'table',
              head: ['Part', 'One-line summary'],
              rows: [
                ['1. DNN math', 'A MAC is a multiply plus an add. CONV layers have shape letters N, M, C, H, W, R, S, E, F, U, and their MACs and weights come from those.'],
                ['2. CPUs and GPUs', 'They turn convolutions into matrix multiplies (copying data) and use tricks like Winograd. Their arithmetic units only talk through memory.'],
                ['3. Data movement', 'Each MAC needs four accesses. DRAM costs about 200 MACs. Three kinds of reuse and four dataflows decide how much of that you pay.'],
                ['4. Co-design', 'Fewer bits, zeros and compact layers cut cost, but MAC counts alone mislead.'],
                ['5. Metrics', 'Report accuracy, throughput, latency, energy, cost and flexibility. Peak is not achieved.'],
                ['6. Reading critically', 'Dated (CNNs, 2017) and secondary. Numbers from different papers do not compare.']
              ]
            },
            { t: 'h', text: '3. How to read the real paper' },
            { t: 'p', text: 'The survey is long. Read it in this order. Section names below are descriptive, so match them by content.' },
            {
              t: 'readmap',
              rows: [
                { section: 'Introduction', how: 'Read closely', note: 'The motivation and the list of what the survey covers (Start here).', part: 'start' },
                { section: 'Background on deep neural networks: layers and popular networks', how: 'Skim if Part 1 felt easy', note: 'Compare its network table with the three rows in Step 1.4 (Part 1).', part: 'basics' },
                { section: 'Kernel computation: matrix multiply, FFT, Winograd, Strassen', how: 'Read closely', note: 'The Toeplitz figure and the multiplication counts (Part 2).', part: 'cpugpu' },
                { section: 'DNN hardware architectures: temporal, spatial, dataflows', how: 'Read closely with a pencil', note: 'The memory hierarchy cost figure, the reuse types and the dataflow descriptions (Part 3).', part: 'movement' },
                { section: 'Co-design of networks and hardware: precision, sparsity, compact networks', how: 'Read closely', note: 'Note the examples it gives for each technique (Part 4).', part: 'codesign' },
                { section: 'Benchmarking metrics', how: 'Read closely', note: 'Make your own checklist from it (Part 5).', part: 'metrics' },
                { section: 'Summary', how: 'Skim', note: 'Compare it with your own one-line summaries.', part: 'critique' }
              ]
            },
            { t: 'h', text: '4. References and where to go next' },
            {
              t: 'list',
              items: [
                'Sze, Chen, Yang, Emer. **Efficient Processing of Deep Neural Networks: A Tutorial and Survey.** Proceedings of the IEEE, 2017. [arXiv 1703.09039](https://arxiv.org/abs/1703.09039)',
                'Chen, Emer, Sze. **Eyeriss: A Spatial Architecture for Energy-Efficient Dataflow for Convolutional Neural Networks.** ISCA 2016. The source of the dataflow taxonomy and the 1x, 2x, 6x, 200x costs. Paper 4 in this course.',
                'Horowitz. **Computing\'s Energy Problem (and what we can do about it).** ISSCC 2014. Paper 1.',
                'Next: **Paper 3, the Roofline model,** which turns the memory-against-arithmetic tradeoff into one chart.'
              ]
            }
          ]
        }
      ]
    },

    /* ------------------------------ Part 8 ------------------------------ */
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
              id: 'sze-practice',
              intro: 'Do each problem on paper first. Type a numeric answer and press **Check my answer**. It says only Correct or Not yet and never shows the answer. Open the hint if you are stuck, and open the solution when you are done. The shape calculator in Part 1 can check your layer arithmetic after you try it by hand.',
              problems: [
                {
                  level: 'simple',
                  q: 'An input is 227 x 227 and a filter is 11 x 11, with stride 4 and no padding. What is the output height E?',
                  check: { answer: 55, unit: 'rows' },
                  hint: 'E = (H - R + U) / U.',
                  solution: [
                    'E = (227 - 11 + 4) / 4 = 220 / 4 = **55**.',
                    'This is AlexNet\'s first layer. Common mistake: dividing (227 - 11) by 4 and forgetting the + 1 that comes from counting the first position. (227 - 11) / 4 = 54, and the first window adds one more.'
                  ]
                },
                {
                  level: 'simple',
                  q: 'A fully connected layer maps 4,096 inputs to 1,000 outputs. For one input (batch 1), how many MACs does it do, in millions?',
                  check: { answer: 4.096, unit: 'million MACs' },
                  hint: 'Every output uses every input.',
                  solution: [
                    '4,096 x 1,000 = 4,096,000 MACs, which is **4.096 million**.',
                    'The layer also has 4,096,000 weights, so at batch 1 each weight is used exactly once. That is why a fully connected layer is memory-bound at batch 1.'
                  ]
                },
                {
                  level: 'simple',
                  q: 'A chip has 4,096 MAC units running at 1 GHz. Counting 2 operations per MAC, what is its peak throughput in TOPS (trillions of operations per second)?',
                  check: { answer: 8.192, unit: 'TOPS' },
                  hint: 'Peak = units x clock x operations per MAC. 1 GHz is 10^9 cycles per second.',
                  solution: [
                    '4,096 x 10^9 x 2 = 8.192 x 10^12, which is **8.192 TOPS**.',
                    'If a vendor counts one operation per MAC, the same chip is 4.096 TOPS. When you compare two chips, check which convention each one uses.'
                  ]
                },
                {
                  level: 'medium',
                  q: 'A CONV layer has batch 1, 64 input channels, 128 filters of 3 x 3, a 56 x 56 input, stride 1 and padding 1. How many MACs does it do, in millions?',
                  check: { answer: 231.2, unit: 'million MACs' },
                  hint: 'First find E with padding: E = floor((H + 2P - R) / U) + 1. Then MACs = E x F x M x C x R x S.',
                  solution: [
                    'E = (56 + 2 - 3) / 1 + 1 = 56, so the output is 56 x 56.',
                    {
                      t: 'table',
                      head: ['Factor', 'Value'],
                      rows: [['Output positions E x F', '56 x 56 = 3,136'], ['Filters M', '128'], ['Channels C', '64'], ['Filter weights R x S', '9'], ['**MACs**', '3,136 x 128 x 64 x 9 = **231,211,008**']]
                    },
                    'The layer holds 128 x 64 x 9 = 73,728 weights, so each weight is used 3,136 times at batch 1.'
                  ]
                },
                {
                  level: 'medium',
                  q: 'The layer from the previous problem now runs with batch 8. How many times is each weight used (convolutional reuse and filter reuse together)?',
                  check: { answer: 25088, unit: 'times' },
                  hint: 'Each weight is used N x E x F times.',
                  solution: [
                    'N x E x F = 8 x 56 x 56 = **25,088** uses per weight.',
                    'Batch 1 gave 3,136 uses. The batch multiplies reuse by 8 but also makes each input wait for 7 others.'
                  ]
                },
                {
                  level: 'medium',
                  q: 'In the layer from the last two problems (batch 1, 231.2 million MACs), 60% of the weights are zero and 50% of the activations are zero. Assume zeros fall independently. How many million MACs have two non-zero inputs?',
                  check: { answer: 46.24, unit: 'million MACs' },
                  hint: 'A MAC needs both inputs non-zero. Multiply the non-zero fractions.',
                  solution: [
                    'Non-zero weights: 1 - 0.6 = 0.4. Non-zero activations: 1 - 0.5 = 0.5. Both non-zero: 0.4 x 0.5 = 0.2.',
                    '0.2 x 231.2 million = **46.2 million** MACs.',
                    'A skipping design could finish in about a fifth of the time. A gating design saves the energy of the multiplies but still spends the cycles. Real weights and activations are not independent, so measure before you trust the 0.2.'
                  ]
                },
                {
                  level: 'hard',
                  q: 'A layer has 128 input channels, 128 output channels, a 3 x 3 filter and a 28 x 28 output. Replace it with a depthwise 3 x 3 layer followed by a pointwise 1 x 1 layer. By what factor does the number of MACs fall?',
                  check: { answer: 8.41, unit: 'x' },
                  hint: 'Standard: 28 x 28 x 128 x 128 x 9. Depthwise: 28 x 28 x 128 x 9. Pointwise: 28 x 28 x 128 x 128.',
                  solution: [
                    'Standard: 784 x 128 x 128 x 9 = 115.6 million MACs.',
                    'Depthwise: 784 x 128 x 9 = 0.90 million. Pointwise: 784 x 128 x 128 = 12.85 million. Total: 13.75 million.',
                    'Ratio = 115.6 / 13.75 = **8.41**. The shortcut formula: the new layer needs 1/M + 1/(R x S) = 1/128 + 1/9 = 0.119 of the MACs, and 1 / 0.119 = 8.41.',
                    'The catch: the depthwise part reuses each weight over a single channel, so it has lower reuse and can leave a PE array underused. The real speed-up may be less than 8.41.'
                  ]
                },
                {
                  level: 'hard',
                  q: 'Costs per access relative to one MAC: register file 1, neighbor PE 2, global buffer 6, DRAM 200. The MAC itself costs 1. Design A makes, per MAC, 3.5 register file accesses, 0.4 neighbor accesses, 0.1 buffer accesses and 0.02 DRAM accesses. Design B makes 2.0 register file, 0 neighbor, 1.0 buffer and 0.05 DRAM. What is the energy per MAC of design B divided by that of design A?',
                  check: { answer: 1.92, unit: 'x' },
                  hint: 'Energy per MAC = 1 + sum of (accesses x cost). Compute A and B separately.',
                  solution: [
                    {
                      t: 'table',
                      head: ['Part', 'Design A', 'Design B'],
                      rows: [['MAC', '1', '1'], ['Register file x 1', '3.5', '2.0'], ['Neighbor PE x 2', '0.8', '0'], ['Buffer x 6', '0.6', '6.0'], ['DRAM x 200', '4.0', '10.0'], ['**Total**', '**9.9**', '**19.0**']]
                    },
                    'B / A = 19.0 / 9.9 = **1.92**.',
                    'Notice that B makes fewer cheap accesses but more expensive ones. DRAM is 40% of A and more than half of B. A small change in how often you reach the 200x level outweighs a large change at the 1x level.'
                  ]
                },
                {
                  level: 'hard',
                  q: 'A fully connected layer of 4,096 x 4,096 has all its weights in DRAM. Each weight is read once per batch, and the read costs 200 units (relative to one MAC). Each MAC costs 1 unit. Ignore all other accesses. By what factor does the energy per input fall when the batch goes from 1 to 16?',
                  check: { answer: 14.89, unit: 'x' },
                  hint: 'Per input, each weight read is shared by N inputs. Energy per MAC (per input) = 1 + 200 / N.',
                  solution: [
                    'Batch 1: 1 + 200 / 1 = 201 units per MAC. Batch 16: 1 + 200 / 16 = 13.5 units per MAC.',
                    'Factor = 201 / 13.5 = **14.9**.',
                    'The cost: a batch of 16 means the first input waits for the other 15 to arrive, so latency grows. This is the batch size tradeoff behind many serving systems, and Paper 5 shows why the TPU\'s latency limit made it hard to use big batches. The saving cannot go beyond 201 times even at infinite batch.'
                  ]
                },
                {
                  level: 'hard',
                  q: 'A startup claims its chip delivers 40 TOPS at 20 TOPS/W. First, how many watts does the claim imply? Then list five questions you would ask before believing it, and say what answer to each would raise or lower your trust.',
                  check: { answer: 2, unit: 'W (your answer to the first part)' },
                  hint: 'Watts = TOPS divided by TOPS per watt. For the questions, use Part 5: peak against achieved, operation counting, workload, power boundary and accuracy.',
                  solution: [
                    '40 TOPS / 20 TOPS per watt = **2 W**. That is a plausible power for an edge chip, so the arithmetic is consistent. Now question the claim.',
                    {
                      t: 'list',
                      ordered: true,
                      items: [
                        '**Is 40 TOPS peak or measured, and at what utilization?** Trust rises if it is measured end to end on a named network.',
                        '**Does one MAC count as one operation or two?** Trust falls if the number only reaches 40 by counting two operations per MAC while competitors count one.',
                        '**Which network and batch size produced the power number?** Trust rises with a standard network at a stated batch. A single easy layer is a warning sign.',
                        '**Does 2 W include DRAM and the host, or only the chip?** Trust falls if off-chip memory is excluded, since it can dominate.',
                        '**What accuracy does the network reach at this precision?** Trust falls if the speed comes from 4-bit or heavily pruned networks whose accuracy is not reported.'
                      ]
                    },
                    'A strong answer names at least these five and says how each answer would change your view. It also notes that Paper 11 turns the same checklist into a full critique of TOPS/W.'
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
