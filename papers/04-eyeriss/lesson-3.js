/* Paper 4 lesson, parts 5 to 7: reading critically, wrap-up, practice problems. */
(function () {
  'use strict';
  window.EYE = window.EYE || {};

  window.EYE.p3 = [
    /* ------------------------------ Part 5 ------------------------------ */
    {
      id: 'critique',
      title: 'Reading it critically',
      summary: 'What the analysis supports, what it leaves out, and five common misreadings.',
      steps: [
        {
          id: 'caveats',
          title: 'What to question',
          min: 6,
          blocks: [
            { t: 'p', text: 'The paper is strong and influential. It is also a 2016 analysis of one family of networks. Use these checks when you read it or cite it.' },
            {
              t: 'list',
              ordered: true,
              items: [
                '**The comparison is a model.** The four dataflows are compared by an analytical framework. The fabricated chip demonstrates row stationary and checks the model. It does not put four dataflows in silicon. Ask how the model was validated.',
                '**The comparison depends on modeling choices.** The split of the storage area between register files and the global buffer, and how each dataflow is mapped, change the answer. Ask how those were chosen for each dataflow and how sensitive the result is.',
                '**AlexNet is the workload.** It has large filters and many channels, which give plenty of reuse. Compact networks with depthwise or 1 x 1 layers (Paper 2) offer less reuse of the kind row stationary exploits. Later accelerator work revisited the design for them.',
                '**The model counts data movement and MACs.** Control logic, clock distribution and leakage need separate treatment. Check what the paper includes.',
                '**The mapping is hard.** Folding, replication and interleaving are choices a designer or a mapper must make for every layer. Papers 8 and 9 build tools for exactly that.'
              ]
            },
            {
              t: 'table',
              head: ['Claim', 'What supports it', 'Our confidence (opinion)'],
              rows: [
                ['Data movement dominates CNN energy', 'The cost ratios and the access counts', 'High. Matches Papers 1 and 2.'],
                ['Row stationary beats WS, OS and NLR on AlexNet at equal area and PE count', 'The analysis framework and its figures', 'High for AlexNet within the model. Check the model\'s assumptions.'],
                ['Row stationary adapts to layer shape better than the others', 'Results across the AlexNet layers and batch sizes', 'Medium to high. Test on newer layer types before generalizing.'],
                ['The chip verifies the analysis', 'Measured numbers from the chip', 'Medium. Check what exactly was compared.']
              ],
              source: 'original',
              caption: 'Our judgment of each claim. This column is opinion. Form your own after reading the paper.'
            },
            {
              t: 'callout',
              kind: 'note',
              title: 'Later work',
              body: 'The authors later published a second-generation design for compact and sparse networks, with a more flexible on-chip network that adapts to layers with little reuse. That is outside this paper, but it shows which limits the authors saw in the first version.'
            },
            {
              t: 'quiz',
              id: 'eye-q18',
              q: 'Which statement about the four-dataflow comparison is the most accurate?',
              options: ['It comes from an analytical framework under equal area and PE count, with the chip demonstrating row stationary', 'All four dataflows were built as chips and measured', 'It compares dataflows with different numbers of PEs', 'It covers every kind of neural network'],
              answer: 0,
              whyNot: [null, 'The framework compares them. The chip demonstrates one dataflow.', 'Equal PE count is the point of the framework.', 'The workload is AlexNet, a CNN from 2012.'],
              explain: 'The framework gives a fair comparison. The chip adds evidence that the model is realistic for row stationary.'
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
                { front: 'Misreading 1: "Row stationary means rows never move."', back: 'Each PE keeps its own filter row and input row in its register file. Rows are still multicast to the PEs that share them, and partial sums pass between PEs.' },
                { front: 'Misreading 2: "Row stationary wins because it has more PEs."', back: 'The framework fixes the number of PEs and the storage area for every dataflow. The win comes from the dataflow.' },
                { front: 'Misreading 3: "The fewest DRAM accesses means the lowest energy."', back: 'Energy is the sum over all four levels. A design can have few DRAM accesses and still spend most of its energy in the buffer or register files.' },
                { front: 'Misreading 4: "The paper proves row stationary is best for every network."', back: 'It shows results for AlexNet within the model. Other layer shapes can change the best choice.' },
                { front: 'Misreading 5: "High PE utilization means high efficiency."', back: 'Utilization is the fraction of PEs doing useful work. Energy efficiency also depends on how often each value is moved.' }
              ]
            },
            {
              t: 'quiz',
              id: 'eye-q19',
              q: 'Design X makes 0.001 DRAM accesses per MAC and 4 buffer accesses per MAC. Design Y makes 0.01 DRAM accesses per MAC and 0.5 buffer accesses per MAC. With costs of 200 for DRAM and 6 for the buffer (ignoring everything else), which uses less memory energy per MAC?',
              options: ['Design Y: 5.0 against 24.2 for X', 'Design X: it has fewer DRAM accesses', 'They are equal', 'Design X: 0.2 against 5.0'],
              answer: 0,
              whyNot: [null, 'X has fewer DRAM accesses but 8 times the buffer accesses, and its buffer cost swamps the saving.', 'The two totals differ by almost a factor of five.', 'You may have used the access counts without the cost factors.'],
              explain: 'X: 0.001 x 200 + 4 x 6 = 0.2 + 24 = 24.2. Y: 0.01 x 200 + 0.5 x 6 = 2 + 3 = 5.0. Fewer DRAM accesses did not win.'
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
                'Paper 5 (the TPU) is a production accelerator built around a large grid of multiply-accumulate units. You can now ask which dataflow it uses, and what it keeps stationary.',
                'Papers 6 and 7 (EIE and SCNN) add zeros to the picture: compression and skipping change the dataflow.',
                'Papers 8 to 10 (Timeloop, MAESTRO and Accelergy) turn this paper\'s analysis into tools that evaluate mappings of any layer onto any array, which is how people now explore the choices (folding, replication, interleaving) that Part 3 described by hand.',
                'Paper 12 (TETRIS) changes the cost of the top level of the hierarchy with 3D memory, which shifts the best dataflow.'
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
                { part: 'problem', q: 'A layer has batch 2 and a 10 x 10 output per filter. How many times is each weight used (convolutional reuse and filter reuse together)?', options: ['200', '100', '20', '2'], answer: 0, explain: 'N x E x E = 2 x 100 = 200.' },
                { part: 'problem', q: 'Why is a partial sum more costly to move than a weight?', options: ['It is read and written for every update, which is two accesses per MAC', 'It is larger than a weight', 'It always lives in DRAM', 'It is never reused'], answer: 0, explain: 'A weight is read once per MAC. A partial sum is read, updated and written back.' },
                { part: 'problem', q: 'Why does the paper\'s framework hold the PE count and the storage area constant across dataflows?', options: ['So a dataflow cannot win just by being given more arithmetic or memory', 'To make the chips smaller', 'Because all dataflows use the same mapping', 'To avoid measuring energy'], answer: 0, explain: 'Fixing the hardware budget isolates the effect of the dataflow.' },
                { part: 'existing', q: 'Which dataflow keeps filter weights in the PE register files while inputs stream past?', options: ['Weight stationary', 'Output stationary', 'No local reuse', 'Row stationary'], answer: 0, explain: 'The weight is the stationary data.' },
                { part: 'existing', q: 'What is the main weak point of output stationary?', options: ['Weights and inputs must be delivered for almost every MAC', 'Partial sums travel to the buffer constantly', 'It has no register file', 'It cannot do convolutions'], answer: 0, explain: 'It keeps partial sums local and streams the other two data types.' },
                { part: 'rs', q: 'A filter has 5 rows. How many 1D convolutions are added up to make one output row (one channel, one filter)?', options: ['5', '1', '25', '10'], answer: 0, explain: 'One 1D convolution per filter row, each against a different input row.' },
                { part: 'rs', q: 'In a logical PE set with R = 3 and E = 5, which input row does the PE in row 2, column 3 use? (PE (r, e) uses input row r + e.)', options: ['Row 5', 'Row 3', 'Row 2', 'Row 6'], answer: 0, explain: 'r + e = 2 + 3 = 5.' },
                { part: 'rs', q: 'What is the difference between folding and replication?', options: ['Folding runs a too-wide PE set in passes. Replication stacks several sets when rows are left over.', 'They are the same', 'Folding compresses weights. Replication copies weights.', 'Folding adds PEs. Replication removes PEs.'], answer: 0, explain: 'Folding handles a set bigger than the array. Replication fills leftover space.' },
                { part: 'compare', q: 'Why does row stationary adapt better to different layer shapes?', options: ['It can raise weight reuse, input reuse and partial sum accumulation together, as the layer allows', 'It uses a faster clock', 'It ignores the layer shape', 'It needs no register file'], answer: 0, explain: 'The biggest kind of reuse changes from layer to layer, and row stationary does not commit to one.' },
                { part: 'compare', q: 'On AlexNet\'s convolution layers, how much less energy does row stationary use than the other dataflows, according to the abstract?', options: ['1.4 to 2.5 times less', '10 to 25 times less', '1.04 to 1.25 times less', '100 times less'], answer: 0, explain: 'The paper reports a 1.4 to 2.5 times improvement on the convolution layers.' }
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
              id: 'tb4',
              prompt: 'In five sentences, explain to a friend how row stationary keeps weights, inputs and partial sums close to the arithmetic at the same time.',
              checklist: [
                'Said that a 2D convolution is a sum of 1D convolutions, one per filter row.',
                'Said that each PE keeps one filter row and one input row in its register file.',
                'Said that filter rows are reused horizontally, input rows diagonally and partial sums accumulate vertically.',
                'Mentioned that folding and replication fit the layer onto the physical array.'
              ]
            },
            { t: 'h', text: '2. One line per part' },
            {
              t: 'table',
              head: ['Part', 'One-line summary'],
              rows: [
                ['1. The problem', 'Data movement dominates. Weights, inputs and partial sums each offer reuse, in different amounts per layer. Partial sums cost double.'],
                ['2. Existing dataflows', 'WS keeps weights, OS keeps partial sums, NLR keeps nothing. Each leaves the others expensive.'],
                ['3. Row stationary', '1D convolutions in PEs, shared by rows horizontally and diagonally, partial sums added vertically, folded and replicated onto the array.'],
                ['4. Comparing', 'Equal area and PE count. 1.4 to 2.5 times less energy on AlexNet convolution layers. A chip demonstrates the dataflow.'],
                ['5. Reading critically', 'An analytical comparison on AlexNet. Check the model, the mapping and the workload.']
              ]
            },
            { t: 'h', text: '3. How to read the real paper' },
            { t: 'p', text: 'Read it in this order. Section names below are descriptive, so match them by content.' },
            {
              t: 'readmap',
              rows: [
                { section: 'Abstract and introduction', how: 'Read closely', note: 'The problem and the claims (Start here).', part: 'start' },
                { section: 'The spatial architecture and the energy cost of data movement', how: 'Read closely', note: 'The four-level hierarchy and the cost ratios (Part 1).', part: 'problem' },
                { section: 'CNN background and data reuse', how: 'Skim if Paper 2 felt easy', note: 'Check the three reuse types and the layer shape letters (Part 1).', part: 'problem' },
                { section: 'Existing dataflows', how: 'Read closely', note: 'Write one line per dataflow in your own words (Part 2).', part: 'existing' },
                { section: 'The row stationary dataflow', how: 'Read closely with a pencil', note: 'Redraw the 1D primitive and the PE set. Check the directions of reuse (Part 3).', part: 'rs' },
                { section: 'The analysis framework', how: 'Read closely', note: 'List what is held constant and how mappings are chosen (Part 1).', part: 'problem' },
                { section: 'Results and discussion', how: 'Read closely with a pencil', note: 'Do the reading tasks: energy by level and by data type (Part 4).', part: 'compare' },
                { section: 'Related work and conclusion', how: 'Skim', note: 'Note the designs the paper lists under each dataflow (Part 2).', part: 'existing' }
              ]
            },
            { t: 'h', text: '4. References and where to go next' },
            {
              t: 'list',
              items: [
                'Chen, Emer, Sze. **Eyeriss: A Spatial Architecture for Energy-Efficient Dataflow for Convolutional Neural Networks.** ISCA 2016. [authors\' copy](https://people.csail.mit.edu/emer/media/papers/2016.06.isca.eyeriss_architecture.pdf)',
                'Chen, Krishna, Emer, Sze. **Eyeriss: An Energy-Efficient Reconfigurable Accelerator for Deep Convolutional Neural Networks.** ISSCC 2016 and IEEE Journal of Solid-State Circuits 2017. The chip papers.',
                'Sze, Chen, Yang, Emer. **Efficient Processing of Deep Neural Networks: A Tutorial and Survey.** Proceedings of the IEEE, 2017. Paper 2 in this course.',
                'Next: **Paper 5, the TPU,** a production inference chip. Ask which dataflow it uses.'
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
              id: 'eye-practice',
              intro: 'Do each problem on paper first. Type a numeric answer and press **Check my answer**. It says only Correct or Not yet and never shows the answer. Open the hint if you are stuck, and open the solution when you are done. The widgets in Parts 1 to 3 can check your arithmetic after you try it by hand.',
              problems: [
                {
                  level: 'simple',
                  q: 'A convolution layer has batch N = 8 and an output of 13 x 13 per filter. How many times is each weight used in total (convolutional reuse and filter reuse together)?',
                  check: { answer: 1352, unit: 'uses per weight' },
                  hint: 'Weight reuse = N x E x E.',
                  solution: [
                    '8 x 13 x 13 = 8 x 169 = **1,352** uses per weight.',
                    'A weight stationary design can keep the weight in a register file and reuse it that many times, but only if the register file holds the weight for the whole sweep over positions and batch.'
                  ]
                },
                {
                  level: 'simple',
                  q: 'A filter has 96 input channels and is 3 x 3. How many products does one output value sum, which is the number of partial sum updates per output?',
                  check: { answer: 864, unit: 'products' },
                  hint: 'Accumulations per output = C x R x R.',
                  solution: [
                    '96 x 3 x 3 = **864** products.',
                    'If every update went through the global buffer, that output would cost 2 x 864 = 1,728 buffer accesses. An output stationary or row stationary design keeps the partial sum in the register file and writes the buffer once.'
                  ]
                },
                {
                  level: 'simple',
                  q: 'A layer has a filter with 7 rows and an output with 21 rows. How many PEs does its logical row stationary PE set need (one per filter row and output row pair)?',
                  check: { answer: 147, unit: 'PEs' },
                  hint: 'The set has R rows and E columns.',
                  solution: [
                    '7 x 21 = **147** PEs.',
                    'On a 12 x 14 array (168 PEs), a set with 7 rows and 21 columns does not fit directly. It folds into 2 passes across the width, and only 1 set fits vertically.'
                  ]
                },
                {
                  level: 'medium',
                  q: 'A PE runs a 1D convolution of a filter row of 4 weights over an input row of 10 values (stride 1). Count buffer accesses as: each weight fetched once, each input value fetched once, each output written once. A design with no local storage makes 4 buffer accesses for every MAC. What is the ratio of the no-local-storage buffer accesses to the row stationary primitive\'s buffer accesses?',
                  check: { answer: 5.33, unit: 'x' },
                  hint: 'The output row has 10 - 4 + 1 values. MACs = filter row length x output row length.',
                  solution: [
                    {
                      t: 'table',
                      head: ['Quantity', 'Value'],
                      rows: [['Output values', '10 - 4 + 1 = 7'], ['MACs', '4 x 7 = 28'], ['Row stationary buffer accesses', '4 + 10 + 7 = 21'], ['No local storage buffer accesses', '4 x 28 = 112']]
                    },
                    'Ratio = 112 / 21 = **5.33**.',
                    'Longer rows give more reuse: each weight is used once per output and each input up to 4 times.'
                  ]
                },
                {
                  level: 'medium',
                  q: 'A logical PE set has 6 rows and 40 columns. It is mapped onto a 12 x 14 array. Copies of the set stack vertically when rows allow, and a set wider than 14 columns folds into passes. What is the average PE utilization over the passes, as a percentage?',
                  check: { answer: 95.2, unit: '%' },
                  hint: 'Copies = floor(12 / 6). Passes = ceil(40 / 14). Utilization = PEs used / (168 x passes).',
                  solution: [
                    'Copies stacked: floor(12 / 6) = 2. Passes: ceil(40 / 14) = 3.',
                    'PEs used over all passes: 2 x 6 x 40 = 480. PEs available: 168 x 3 = 504.',
                    'Utilization = 480 / 504 = **95.2%**. The last pass is only 12 columns wide, which is what keeps it under 100%.'
                  ]
                },
                {
                  level: 'medium',
                  q: 'Under output stationary, a layer has 128 channels and 5 x 5 filters. Each finished output is written to the global buffer once. How many buffer writes per MAC does this cause? Give the answer as a decimal fraction.',
                  check: { answer: 0.0003125, unit: 'writes per MAC' },
                  hint: 'One write per output, and each output sums C x R x R MACs.',
                  solution: [
                    'MACs per output: 128 x 5 x 5 = 3,200. One write per output gives 1 / 3,200 = **0.0003125** writes per MAC.',
                    'The partial sum cost is almost nothing, which is the strength of output stationary. Its price is paid on the other two data types.'
                  ]
                },
                {
                  level: 'medium',
                  q: 'A design makes 0.01 DRAM accesses per MAC. A DRAM access costs 200 times a MAC. How many MAC-energy units per MAC does the DRAM traffic alone add?',
                  check: { answer: 2, unit: 'units per MAC' },
                  hint: 'Accesses per MAC times cost per access.',
                  solution: [
                    '0.01 x 200 = **2** units per MAC.',
                    'Compare with the chip in Part 4, which makes 0.0029 accesses per MAC and adds only about 0.58. Every drop in DRAM accesses pays off 200 times over.'
                  ]
                },
                {
                  level: 'hard',
                  q: 'A chip makes, per MAC, 0.0029 DRAM accesses (cost 200), 0.15 global buffer accesses (cost 6), 0.3 neighbor PE accesses (cost 2) and 3.5 register file accesses (cost 1). The MAC itself costs 1. What percent of the energy per MAC comes from DRAM?',
                  check: { answer: 8.8, unit: '% from DRAM' },
                  hint: 'Add up all five contributions, then divide the DRAM part by the total.',
                  solution: [
                    {
                      t: 'table',
                      head: ['Part', 'Units per MAC'],
                      rows: [['MAC', '1'], ['DRAM: 0.0029 x 200', '0.58'], ['Buffer: 0.15 x 6', '0.90'], ['Neighbor PE: 0.3 x 2', '0.60'], ['Register file: 3.5 x 1', '3.50'], ['**Total**', '**6.58**']]
                    },
                    'DRAM share = 0.58 / 6.58 = **8.8%**.',
                    'The lesson of the number: once DRAM traffic is nearly gone, the register file (3.5 units, 53%) is the biggest cost. The easy savings are used up, and further gains come from cheaper arithmetic, fewer bits (Paper 1) or skipping zeros (Papers 6 and 7).'
                  ]
                },
                {
                  level: 'hard',
                  q: 'A logical PE set has 9 rows and 30 columns. It is mapped onto a 12 x 14 array. What is the average PE utilization over the passes, as a percentage? Then suggest one change that could raise it.',
                  check: { answer: 53.6, unit: '% (your answer to the first part)' },
                  hint: 'Copies = floor(12 / 9). Passes = ceil(30 / 14).',
                  solution: [
                    'Copies stacked: floor(12 / 9) = 1. Passes: ceil(30 / 14) = 3. PEs used: 9 x 30 = 270. PEs available: 168 x 3 = 504. Utilization = **53.6%**.',
                    'Why so low: only 9 of 12 rows are used in every pass (75%), and the last pass is only 2 columns wide (30 - 28), using a small fraction of the array.',
                    'Ideas: (1) pack the 2 leftover columns of the last pass together with leftover columns from other channels or filters, so that pass is not nearly empty; (2) use the 3 idle rows for a different small piece of work, for example a set from another channel that needs 3 rows or fewer; (3) change how the layer is split so the widths add up closer to 14 columns per pass. The point: the mapping is a search problem, which is why later papers build tools to automate it.'
                  ]
                },
                {
                  level: 'hard',
                  q: 'A standard layer has M = 256 filters, 3 x 3 filters and stride 1. Input reuse (each input value used by every filter and by overlapping windows) is about M x R x R / U squared. A depthwise 3 x 3 layer applies one filter per input channel. By what factor is its input reuse smaller than the standard layer\'s? Then explain what this does to a row stationary mapping that relies on interleaving filters.',
                  check: { answer: 256, unit: 'x (your answer to the first part)' },
                  hint: 'In a depthwise layer each input channel meets only one filter, so M = 1 for the reuse formula.',
                  solution: [
                    'Standard: 256 x 9 / 1 = 2,304 uses per input value. Depthwise: 1 x 9 = 9. The ratio is 2,304 / 9 = **256**.',
                    'Row stationary raises input reuse by interleaving several filter rows against one input row, and it raises partial sum accumulation by interleaving channels. A depthwise layer has **no** other filters to share the input row with and **no** channels to accumulate across (C = 1 per filter). Both techniques have nothing to work with. Only convolutional reuse inside one filter is left.',
                    'Consequences: much less reuse per fetched value, so a higher share of energy goes to data movement; PE utilization may drop as well because the array is mapped across fewer independent pieces of work. This is the limit Part 5 flagged for compact networks, and a reason later accelerator designs added more flexible networks on chip.'
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
