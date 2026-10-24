/* Paper 6 lesson, parts 4 to 6: the evidence, the wrap-up, and practice problems. */
(function () {
  'use strict';
  window.EIE = window.EIE || {};

  window.EIE.p3 = [
    /* ------------------------------ Part 4 ------------------------------ */
    {
      id: 'evidence',
      title: 'The evidence',
      summary: 'What the paper measured, and what to question.',
      steps: [
        {
          id: 'results',
          title: 'How well did it work?',
          min: 5,
          blocks: [
            { t: 'p', hook: true, text: 'Guess first. How much faster than a GPU is a chip that draws about 600 mW?' },
            {
              t: 'quiz',
              id: 'eie-gpu',
              kind: 'predict',
              q: "On the paper's nine benchmarks, about how much faster was EIE than a GPU running the same network without compression?",
              options: ['About the same speed', 'About 13 times faster', 'About 130 times faster', 'About 1,300 times faster'],
              answer: 1,
              whyNot: [
                'The paper reports a clear win, not a tie.',
                null,
                'That is closer to the CPU result, which was 189 times.',
                'Numbers that large show up for energy, not speed. Against the GPU, EIE used 3,400 times less energy.'
              ],
              explain: 'The abstract reports 13 times against the GPU and 189 times against the CPU.'
            },
            {
              t: 'figure',
              source: 'original',
              alt: 'Bar chart on a log axis: 189 times faster than a CPU, 13 times faster than a GPU, 24,000 times more energy efficient than a CPU, 3,400 times more than a GPU',
              caption: 'The four headline ratios from the abstract, on a log axis. Our chart of the paper\'s numbers. Both baselines run the same network without compression.',
              draw: function (host) {
                window.EIE.drawResults(host);
              }
            },
            {
              t: 'facts',
              rows: [
                ['The chip', '64 cooks (PEs) in 45 nm, 40.8 mm², about 600 mW'],
                ['AlexNet FC layers', 'about 18,800 frames per second'],
                ['Compared with', 'a CPU and a GPU running the same network without compression']
              ]
            },
            { t: 'takeaway', text: "EIE ran AlexNet's fully connected layers at about 18,800 frames per second on about 600 mW. It was 13 times faster and 3,400 times more energy efficient than a GPU." },
            {
              t: 'reveal',
              tone: 'check',
              label: 'Check this against the paper',
              body: [
                "These are the abstract's headline numbers. Find the per-benchmark results in the evaluation section.",
                'Note which batch size each bar uses, whether the CPU and GPU also ran the compressed network, and what power each number counts.'
              ]
            }
          ]
        },
        {
          id: 'question',
          title: 'What to question',
          min: 4,
          blocks: [
            { t: 'p', hook: true, text: 'A 189 times speedup is a big claim. Ask four questions before you repeat it.' },
            {
              t: 'flip',
              hint: 'Click to see what to check',
              cards: [
                { front: 'What was the baseline?', back: 'The abstract says the same network without compression, on a CPU and a GPU. Ask whether they also got the compressed network. Find out in the paper.' },
                { front: 'Which layers?', back: 'Fully connected layers. In image networks, convolution layers do most of the work, and EIE does not speed those up. Paper 7 (SCNN) goes after them.' },
                { front: 'What batch size?', back: 'GPUs gain a lot from batching. EIE works on one input at a time. Check the batch size behind each speedup.' },
                { front: 'What does the energy number count?', back: 'A chip is not a server. Check what was counted for the CPU, the GPU and EIE: only the chip, or memory and the rest too?' }
              ]
            },
            { t: 'callout', kind: 'note', title: 'Our take', body: "The lasting idea is to keep a small, sparse network on the chip. The 189 times matters less than how the paper shows where each saving comes from." },
            { t: 'takeaway', text: 'Ask what the baseline is, which layers, which batch size, and what the energy number counts.' }
          ]
        }
      ]
    },

    /* ------------------------------ Part 5 ------------------------------ */
    {
      id: 'wrapup',
      title: 'Wrap-up',
      summary: 'Recap, a quiz, and a plan for reading the paper.',
      steps: [
        {
          id: 'recap',
          title: 'Recap in five questions',
          min: 3,
          blocks: [
            { t: 'p', hook: true, text: 'Ask the questions in order. Try to answer each one yourself before you click.' },
            {
              t: 'chat',
              turns: [
                { q: 'What does one layer compute?', a: 'A matrix times a vector. The weights are the recipe book, the inputs are the orders, and each output is one ingredient total.' },
                { q: 'Why is it expensive?', a: 'Each weight is used once per input. At batch size 1 a DRAM read costs about 141 times the math, so reading the book is the cost.' },
                { q: 'How does the book shrink?', a: 'Prune the tiny weights, replace each survivor with a 4-bit code into a 16-value table, and store only the survivors with a 4-bit skip count. About 40 times smaller.' },
                { q: 'What does the chip skip?', a: 'Every zero order, which skips a whole column, and every pruned weight, which is never stored. Skipping zero inputs alone is worth about 3 times in energy.' },
                { q: 'How do the cooks stay busy?', a: 'Each cook owns every fourth row, and a short queue lets fast cooks run ahead of slow ones. The paper chose a queue depth of 8.' }
              ],
              after: [{ t: 'takeaway', text: 'EIE wins by moving a small, sparse network on chip and doing only the work that matters, with queues to keep every cook busy.' }]
            }
          ]
        },
        {
          id: 'final',
          title: 'Test yourself',
          min: 5,
          blocks: [
            {
              t: 'finalquiz',
              questions: [
                {
                  part: 'problem',
                  q: 'At batch size 1, what dominates the energy of a fully connected layer?',
                  options: ['The multiplications', 'Reading the weights from DRAM', 'Adding the results', 'Applying ReLU'],
                  answer: 1,
                  whyNot: ['A multiply costs 3.7 pJ. Reading one weight from DRAM costs about 650 pJ.', null, 'An add costs 0.9 pJ, far less than the read.', 'ReLU is a cheap comparison.'],
                  explain: 'Each weight is used once per input, so every weight is read for one multiply. The read costs 141 times the math.'
                },
                {
                  part: 'shrink',
                  q: 'Which step replaces each exact weight with a short code that points into a small table?',
                  options: ['Pruning', 'Weight sharing', 'Retraining', 'Broadcasting'],
                  answer: 1,
                  whyNot: ['Pruning sets small weights to zero.', null, 'Retraining adjusts the network after a change.', 'Broadcasting sends an order to every cook.'],
                  explain: 'Weight sharing keeps a table of about 16 values. Each weight stores a 4-bit code.'
                },
                {
                  part: 'shrink',
                  q: 'A column stores skip counts 1, 0, 2, in order. Rows are numbered from 0. Which rows hold the entries?',
                  options: ['1, 0, 2', '1, 2, 5', '1, 1, 3', '2, 3, 6'],
                  answer: 1,
                  whyNot: ['Those are the skip counts themselves.', null, 'That is a running total of the skips. Each entry also takes up one row.', 'That counts rows from 1. Here they start at 0.'],
                  explain: 'Start above the top at row -1. Add each skip and 1: -1 + 1 + 1 = 1, then 1 + 0 + 1 = 2, then 2 + 2 + 1 = 5.'
                },
                {
                  part: 'shrink',
                  q: 'Why is the book stored one column at a time?',
                  options: ['Columns are always shorter than rows', 'A zero input lets the chip skip a whole column', 'Pointers only work for columns', 'A cook can only read one column in total'],
                  answer: 1,
                  whyNot: ['In these layers they are not shorter.', null, 'Pointers work for rows too. The reason is the skipping.', 'A cook reads many columns. The reason for the layout is the skipping.'],
                  explain: 'The chip walks the orders one dish at a time. A zero order means its whole column is skipped.'
                },
                {
                  part: 'chip',
                  q: 'Four cooks split the rows by row number mod 4. Which cook owns row 10?',
                  options: ['Cook 0', 'Cook 1', 'Cook 2', 'Cook 3'],
                  answer: 2,
                  whyNot: ['Cook 0 owns rows 0, 4, 8, 12.', 'Cook 1 owns rows 1, 5, 9, 13.', null, 'Cook 3 owns rows 3, 7, 11, 15.'],
                  explain: '10 divided by 4 leaves a remainder of 2, so cook 2 owns it.'
                },
                {
                  part: 'chip',
                  q: 'What does the queue in front of each cook do?',
                  options: ['It stores the weights', 'It lets a fast cook start the next order while a slow cook is still busy', 'It applies ReLU', 'It finds the next non-zero order'],
                  answer: 1,
                  whyNot: ["Weights live in each cook's sparse matrix memory.", null, 'ReLU happens after the last order of a layer.', "That is the central unit's job."],
                  explain: 'Without a queue, the next order waits for the slowest cook. With one, the others run ahead.'
                },
                {
                  part: 'chip',
                  q: 'The abstract credits skipping zero inputs with about what energy saving?',
                  options: ['About 1.5 times', 'About 3 times', 'About 10 times', 'About 120 times'],
                  answer: 1,
                  whyNot: ['Too small. The abstract says about 3 times.', null, 'About 10 times is the saving from pruning.', 'About 120 times is the saving from keeping the book in SRAM instead of DRAM.'],
                  explain: 'The four savings in the abstract are 120 times (DRAM to SRAM), 10 times (sparsity), 8 times (weight sharing) and 3 times (skipping zero inputs).'
                },
                {
                  part: 'evidence',
                  q: "Which kind of layer does EIE speed up in the paper's results?",
                  options: ['Convolution layers', 'Fully connected layers', 'Pooling layers', 'Batch normalization layers'],
                  answer: 1,
                  whyNot: ['Convolution needs a different design. Paper 7 (SCNN) takes it on.', null, 'Pooling layers have no weights to prune or share.', 'Batch normalization has a few numbers per channel, so there is little to shrink.'],
                  explain: 'EIE targets fully connected layers, where the weight matrix is huge and each weight is used once per input.'
                }
              ]
            }
          ]
        },
        {
          id: 'explain',
          title: 'Explain it back, then read the paper',
          min: 6,
          blocks: [
            { t: 'p', hook: true, text: 'If you can explain it with the kitchen, you understand it.' },
            {
              t: 'teachback',
              id: 'eie-tb1',
              prompt: 'Explain EIE to a friend in five sentences. Use the kitchen.',
              checklist: [
                'You said a layer is a matrix times a vector: recipes times orders.',
                'You said reading weights from DRAM costs far more than the math.',
                'You named the shrinking steps: prune, share values, store compactly.',
                'You said why zero orders are skipped.',
                'You said why each cook needs a queue.'
              ]
            },
            {
              t: 'readmap',
              rows: [
                { section: 'Abstract and introduction', how: 'Read closely', note: 'The four savings and the headline results.', part: 'chip' },
                { section: 'The compressed format and the sparse matrix-vector computation', how: 'Read closely', note: 'Compare with your skip counts and pointers.', part: 'shrink' },
                { section: 'Hardware design', how: 'Read closely', note: 'Match each unit to the walkthrough.', part: 'chip' },
                { section: 'Experiments and results', how: 'Read with questions', note: 'Which baseline, which batch size, what the energy counts.', part: 'evidence' },
                { section: 'Discussion: balance, scaling and memory size', how: 'Skim, then read the queue part', note: 'Compare it with your race.', part: 'chip' }
              ]
            },
            {
              t: 'reveal',
              tone: 'check',
              label: 'About these section names',
              body: ['The names above describe what each part covers. The paper\'s exact headings could not be confirmed while writing this lesson, so match them to the PDF yourself.']
            }
          ]
        }
      ]
    },

    /* ------------------------------ Part 6 ------------------------------ */
    {
      id: 'practice',
      title: 'Practice',
      summary: 'Simple, medium and hard problems with hidden hints and solutions.',
      steps: [
        {
          id: 'problems',
          title: 'Practice problems',
          min: 30,
          blocks: [
            {
              t: 'practice',
              id: 'eie-practice',
              intro: 'Try each problem on paper first. Check a numeric answer, open the hint if you are stuck, and open the solution only when you are done.',
              problems: [
                {
                  level: 'simple',
                  q: 'Dish A needs 120 g of flour and 40 g of cheese per serving. Dish B needs 80 g of flour and 100 g of cheese per serving. Tonight you get 5 orders of A and 3 of B. How many grams of cheese do you need?',
                  check: { answer: 500, tol: 0.01, unit: 'g' },
                  hint: 'Multiply each dish\'s cheese by its orders, then add.',
                  solution: ['Cheese: 40 × 5 + 100 × 3 = 200 + 300 = **500 g**.', 'Common mistake: adding the flour as well, or using the order counts as grams.']
                },
                {
                  level: 'simple',
                  q: 'A fully connected layer has 2,048 inputs and 1,000 outputs. At 4 bytes per weight, how many MB of weights does it hold? Use 1 MB = 1,000,000 bytes.',
                  check: { answer: 8.192, tol: 0.02, unit: 'MB' },
                  hint: 'Every input connects to every output.',
                  solution: ['Weights = 2,048 × 1,000 = 2,048,000. At 4 bytes each that is 8,192,000 bytes, or **8.192 MB**.', 'Common mistake: forgetting the 4 bytes, or counting bits instead of bytes.']
                },
                {
                  level: 'simple',
                  q: 'In one column, the stored skip counts are 2, 0, 3, in order. Rows are numbered from 0 at the top. Which row holds the last entry?',
                  check: { answer: 7, tol: 0, abs: 0.1 },
                  hint: 'Start above the top, at row -1. For each entry, add its skip count and 1.',
                  solution: ['-1 + 2 + 1 = 2, then 2 + 0 + 1 = 3, then 3 + 3 + 1 = **7**. The entries sit in rows 2, 3 and 7.', 'Common mistake: forgetting the +1 for the entry itself. That gives rows 1, 1 and 4.']
                },
                {
                  level: 'simple',
                  q: 'A list of column pointers is 0, 3, 3, 7, 12. Columns are numbered from 0. How many entries does column 3 hold?',
                  check: { answer: 5, tol: 0, abs: 0.1 },
                  hint: 'Column j holds the entries from pointer j up to, but not including, pointer j + 1.',
                  solution: ['Column 3 starts at pointer 7 and the next pointer is 12, so it holds 12 - 7 = **5** entries.', 'Column 1 starts at 3 and the next pointer is also 3, so column 1 is empty.']
                },
                {
                  level: 'medium',
                  q: 'A layer has 4,096 inputs and 4,096 outputs. You keep 8% of the weights and store each kept weight as a 4-bit code plus a 4-bit skip count. How many MB does the stored layer take? Ignore pointers. Use 1 MB = 1,000,000 bytes.',
                  check: { answer: 1.342, tol: 0.02, unit: 'MB' },
                  hint: 'Count the kept entries first. Then convert 8 bits to bytes.',
                  solution: [
                    'Weights = 4,096 × 4,096 = 16,777,216. Keeping 8% leaves about 1,342,177 entries. Each entry is 4 + 4 = 8 bits = 1 byte, so the layer takes **1.342 MB**.',
                    'The dense layer at 32 bits is 67.1 MB, so the stored layer is about 50 times smaller.',
                    'Common mistake: storing 32 bits per kept weight. That gives 5.4 MB.'
                  ]
                },
                {
                  level: 'medium',
                  q: 'The same layer gets an input vector in which 30% of the 4,096 inputs are not zero. Each column stores about 8% of its 4,096 rows. How many multiply-adds does one input vector need if you skip zero inputs and zero weights?',
                  check: { answer: 402653, tol: 0.02 },
                  hint: 'Count the columns you read. Then count the entries in each column.',
                  solution: [
                    'Columns read: 4,096 × 30% = 1,228.8. Entries per column: 4,096 × 8% = 327.68. Multiply-adds = 1,228.8 × 327.68 = **402,653**.',
                    'The dense layer needs 16,777,216, so you do about 42 times less work.',
                    'Common mistake: reading every column. That gives 1.34 million.'
                  ]
                },
                {
                  level: 'medium',
                  q: [
                    'For the layer above, compare the energy of reading the weights for one input.',
                    {
                      t: 'list',
                      items: [
                        'Dense: all 16,777,216 weights are read from DRAM as 32-bit words, at 650 pJ each.',
                        'Compressed: only the 402,653 multiply-adds from the last problem read an entry. Each entry is 8 bits and comes from on-chip SRAM. A 32-bit SRAM read costs 5 pJ, and the energy is proportional to the bits read.'
                      ]
                    },
                    'How many times less energy does the compressed layer use?'
                  ],
                  check: { answer: 21667, tol: 0.02, unit: 'times' },
                  hint: 'An 8-bit read costs 5 pJ × 8 / 32. Then divide the two totals.',
                  solution: [
                    'Dense: 16,777,216 × 650 pJ = 10,905,190,400 pJ, about 10.9 mJ.',
                    'Compressed: an 8-bit read costs 5 × 8 / 32 = 1.25 pJ. So 402,653 × 1.25 pJ = 503,316 pJ, about 0.50 µJ.',
                    'Ratio = 10,905,190,400 / 503,316 ≈ **21,667 times**. The paper reports 24,000 times against a CPU. That is a different comparison, but the same order of magnitude.',
                    'Common mistake: charging every weight in the compressed layer, even though most are never read.'
                  ]
                },
                {
                  level: 'hard',
                  q: [
                    'Estimate how many AlexNet fully connected passes per second an EIE-style chip can run. Use these numbers.',
                    {
                      t: 'list',
                      items: [
                        '64 PEs at 800 MHz, each doing one multiply-add per cycle when it has work (from the paper).',
                        'FC6: 9,216 inputs, 4,096 outputs, 9% of weights stored. FC7: 4,096 inputs, 4,096 outputs, 9% stored. FC8: 4,096 inputs, 1,000 outputs, 25% stored.',
                        'In every layer, 30% of the inputs are not zero (an assumption).',
                        'The PEs are busy 70% of the time (an assumption).'
                      ]
                    },
                    'Give the answer in passes per second. The paper reports about 18,800 frames per second for these layers.'
                  ],
                  check: { answer: 20141, tol: 0.03, unit: 'per second' },
                  hint: 'Count multiply-adds per layer as (inputs × 30%) × (outputs × density). Add the three layers. Divide by 64 for cycles, then by 70%.',
                  solution: [
                    'FC6: 9,216 × 0.3 = 2,764.8 columns, each with 4,096 × 0.09 = 368.64 entries: 1,019,216 multiply-adds. FC7: 1,228.8 columns × 368.64 = 452,985. FC8: 1,228.8 columns × 250 = 307,200. Total: 1,779,401.',
                    '64 PEs do 64 per cycle, so 27,803 cycles. At 800 MHz that is 34.75 µs. At 70% busy it takes 49.65 µs, which is **about 20,100 passes per second**.',
                    'The paper reports 18,800 frames per second. Our estimate is within 7%, which is good for a back-of-the-envelope model built on two assumptions. Real runs also lose time to pointer reads and stalls that the estimate ignores.'
                  ]
                },
                {
                  level: 'hard',
                  q: [
                    'The chip in the last problem does 64 PEs × 800 MHz × 2 operations (a multiply and an add) per cycle. That is 102.4 billion operations per second on stored entries.',
                    'A dense chip must do every multiply, including those with a zero weight or a zero input. If 10% of the weights are stored and 33% of the inputs are not zero, how many TOPS would a dense chip need to match the work this chip does?'
                  ],
                  check: { answer: 3.103, tol: 0.02, unit: 'TOPS' },
                  hint: 'Each stored multiply-add stands in for 1 / (0.10 × 0.33) dense multiply-adds.',
                  solution: [
                    'Each stored multiply-add replaces 1 / (0.10 × 0.33) ≈ 30.3 dense ones. So 102.4 GOPS × 30.3 ≈ 3,103 GOPS, or **3.1 TOPS**.',
                    'This matches the abstract, which says 102 GOPS on the compressed network corresponds to 3 TOPS on the uncompressed one.',
                    'Careful: this is an equivalent rate, not extra hardware. A dense chip would also need to read all the weights.'
                  ]
                },
                {
                  level: 'hard',
                  q: [
                    'The number of stored entries a PE owns in one column varies at random. Model it as the count of stored entries among n rows, each stored with probability 0.1. The relative spread (standard deviation divided by the mean) is sqrt(0.9 / (0.1 × n)).',
                    'Compare a layer with 4,096 rows on 64 PEs (64 rows per PE) with a layer with 600 rows on 64 PEs (about 9.4 rows per PE). How many times larger is the relative spread for the 600-row layer? Then explain in two sentences why that hurts.'
                  ],
                  check: { answer: 2.613, tol: 0.02, unit: 'times' },
                  hint: 'Compute the spread for n = 64, then for n = 600 / 64, and divide.',
                  solution: [
                    'For n = 64: sqrt(0.9 / 6.4) = 0.375. For n = 9.375: sqrt(0.9 / 0.9375) = 0.980. The ratio is 0.980 / 0.375 = **2.61 times**.',
                    'Model answer: with few rows per PE, each PE draws only a handful of entries per column, so the counts differ a lot between PEs (some get 0, some get 3). The next order waits for the slowest PE, so the PEs sit idle more often, and a queue can smooth the ups and downs only partly. This is why a small layer balances worse on a wide chip.',
                    'A search summary of the paper says one of its benchmarks, with only about 600 rows, balanced worse than the rest. Look for it when you read the discussion of load balance.'
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
