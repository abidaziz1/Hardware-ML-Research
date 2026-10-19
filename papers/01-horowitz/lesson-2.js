/* Paper 1 lesson, parts 3 to 5: counting energy, what to do about it, neural networks. */
(function () {
  'use strict';
  window.HOR = window.HOR || {};

  window.HOR.p2 = [
    /* ------------------------------ Part 3 ------------------------------ */
    {
      id: 'count',
      title: 'Counting the energy',
      summary: 'Add up operations and data accesses, see reuse divide the cost, and see instruction overhead.',
      steps: [
        {
          id: 'equation',
          title: 'The energy equation',
          min: 7,
          blocks: [
            { t: 'p', text: 'You now have a price list. To find the energy of a computation, list every kind of event, multiply the count of each by its price, and add them up.' },
            { t: 'callout', kind: 'idea', body: '**Energy = (adds x energy per add) + (multiplies x energy per multiply) + (memory reads x energy per read) + ...** The method works for one instruction, one layer or a whole program.' },
            {
              t: 'callout',
              kind: 'example',
              body: 'The cook from Part 2 chops one onion for 3 seconds of effort, but each onion comes from the store across town. A day of cooking is almost entirely driving. If you want to cook more per day, the chopping speed hardly matters. The number of trips does.'
            },
            { t: 'h', text: 'One multiply-add, worked by hand' },
            {
              t: 'table',
              head: ['Event', 'Count', 'Energy each', 'Total'],
              rows: [
                ['32-bit float multiply', '1', '3.7 pJ', '3.7 pJ'],
                ['32-bit float add', '1', '0.9 pJ', '0.9 pJ'],
                ['Read 3 operands (weight, input, running total) from DRAM, 32 bits each', '3', '650 pJ', '1,950 pJ'],
                ['**Total**', '', '', '**1,954.6 pJ**']
              ],
              source: 'toy',
              caption: 'Arithmetic is 4.6 pJ, which is 0.24% of the total. The 650 pJ per 32-bit word is our assumption: half of the paper\'s 1.3 nJ for a 64-bit DRAM read.'
            },
            { t: 'p', text: 'The next widget turns that into a budget. A chip can spend a fixed number of watts. How much useful work does it get, depending on where the data comes from?' },
            { t: 'widget', name: 'powerBudget', title: 'The same watts, three data sources', tag: 'Toy model using the paper\'s numbers', opts: {} },
            {
              t: 'callout',
              kind: 'try',
              body: [
                '1. Keep **2 W** and **Arithmetic only**. The chip could run the network about 600 times per second.',
                '2. Choose **Operands from 8 KB SRAM**. The rate drops to about 140 runs per second.',
                '3. Choose **Operands from DRAM**. It drops to about 1.4 runs per second. Same chip, same 2 W, over 400 times less work.'
              ]
            },
            {
              t: 'quiz',
              id: 'hor-q10',
              q: 'A designer makes the multiplier twice as efficient. The chip still reads every operand from DRAM. What happens to the energy of one multiply-add?',
              options: ['It halves', 'It falls by about 0.1%', 'It falls by about 25%', 'It stays exactly the same'],
              answer: 1,
              whyNot: ['That would be true only if the multiplier were most of the energy. Here it is under 0.2%.', null, 'A 25% drop would need the arithmetic to be a quarter of the total.', 'It does change, but by a tiny amount. The multiply-add is still dominated by the three DRAM reads.'],
              explain: 'The multiply is 3.7 pJ of 1,954.6 pJ. Halving it saves 1.85 pJ, about 0.1%. When data movement dominates, optimizing arithmetic does almost nothing.'
            }
          ]
        },
        {
          id: 'reuse',
          title: 'Reuse: the way to beat the table',
          min: 8,
          blocks: [
            {
              t: 'callout',
              kind: 'example',
              body: 'Drive to the store and buy 20 onions instead of 1. The drive takes the same energy, but each onion now carries one twentieth of it. **Reuse** is the number of times you use something you fetched before you go back for more.'
            },
            { t: 'p', text: 'If each value you fetch from DRAM is used by R multiply-adds before it is discarded, the data movement energy per multiply-add falls by a factor of R. This is the whole idea behind caches, tiling, and every accelerator in the course. The widget below adds up the energy of a whole computation. Change the reuse and the number format.' },
            { t: 'widget', name: 'energyBudget', title: 'Where does the energy of a run go?', tag: 'Toy model using the paper\'s numbers', opts: {} },
            {
              t: 'callout',
              kind: 'try',
              body: [
                '1. Start with **AlexNet-sized**, **32-bit float**, **DRAM**, reuse **1**. Arithmetic is only 0.2% of the energy, and the power at 30 runs per second would be about 42 W.',
                '2. Raise reuse to **256**. Arithmetic jumps to about 38% of the energy. Data movement fell by 256 times.',
                '3. Now switch to **8-bit integer**. The arithmetic gets 20 times cheaper, but its share drops to about 11%. Once arithmetic is cheap, data movement dominates again.',
                '4. Switch the source to **8 KB SRAM**. Arithmetic is about 94% of the energy, and the whole run costs under 0.2 millijoules, about 5 mW at 30 runs per second.'
              ]
            },
            {
              t: 'quiz',
              id: 'hor-q11',
              q: 'In the widget, reuse is 256, 32-bit float, from DRAM. You switch to 8-bit integer and the **share** of arithmetic falls from 38% to 11%. Why did a cheaper multiplier lower the arithmetic share?',
              options: ['Arithmetic energy fell about 20 times, but data movement fell only 4 times because words got 4 times narrower', 'The multiplier now costs more', 'Reuse silently dropped', 'The chip now uses more power overall'],
              answer: 0,
              whyNot: [null, 'It costs less. The number format change cut arithmetic energy by about 20 times.', 'The reuse slider did not move. Reuse is still 256.', 'The total fell a lot. Only the split between arithmetic and data movement changed.'],
              explain: 'Both parts shrank, but arithmetic (3.7 + 0.9 pJ down to 0.23 pJ) shrank far more than data movement (words are 4 times narrower). The share of the part that shrank less grows. The total energy is much lower than before.'
            },
            {
              t: 'callout',
              kind: 'watch',
              body: 'This model treats weights, inputs and partial sums alike. In a real convolution, different data types have different reuse, which is why dataflow design (Paper 4, Eyeriss) is a whole field.'
            }
          ]
        },
        {
          id: 'overhead',
          title: 'Instruction overhead',
          min: 8,
          blocks: [
            {
              t: 'callout',
              kind: 'example',
              body: 'A kitchen manager reads the recipe step aloud, checks the ingredient list, finds the knife, and only then lets the cook chop one carrot. Then repeats it for the next carrot. The chopping is a tiny part of the cost. Now the manager reads one step ("chop all 64 carrots") and the cook does the whole tray. The manager\'s work is the same, but it is shared by 64 carrots.'
            },
            { t: 'p', text: 'A general-purpose processor works like the first kitchen. For each instruction it fetches the instruction from memory, decodes it, reads the {{register-file|register file}}, schedules the work, then does the arithmetic and writes the result. The arithmetic is one box in the picture.' },
            { t: 'figure', draw: window.HOR.figInstruction, source: 'original', caption: 'The steps for one add instruction. Only the Add box is the useful work. The sizes are not drawn to scale for energy.', alt: 'Fetch, decode, read registers, add, write result in a row. Only the add box is useful arithmetic.' },
            { t: 'p', text: 'The paper\'s claim is that this {{instruction-overhead|overhead}} can be many times the energy of the arithmetic. Two ways around it: **do more work per instruction** (wide vector instructions, a fused multiply-add, or hardware that performs a whole filter in one go) or **remove the instructions** by wiring a fixed datapath. Either way you {{amortize}} the overhead. The widget uses a guessed overhead number, so do not quote it.' },
            { t: 'widget', name: 'overheadAmortize', title: 'One instruction, many operations', tag: 'Toy model, overhead number is our guess' },
            {
              t: 'callout',
              kind: 'try',
              body: [
                '1. Keep the **32-bit add**, 60 pJ overhead and width 1. Arithmetic is about 0.2% of the energy.',
                '2. Slide the width to **256**. Even then only about 30% is arithmetic. A plain add is too cheap to hide a big overhead. You would need a width of 600.',
                '3. Switch to the **32-bit int multiply-add**. A width of just **19** makes half the energy useful arithmetic, because each operation is much bigger.'
              ]
            },
            {
              t: 'callout',
              kind: 'paper',
              body: 'The paper describes where the energy of an instruction goes in a general-purpose processor and concludes the arithmetic is a small part, with most of the energy spent on fetching, decoding and moving data around. (Our paraphrase.) **Reading task:** find that breakdown, write down the numbers, and compare them with our 60 pJ guess.'
            },
            {
              t: 'quiz',
              id: 'hor-q12',
              q: 'Why do multiply-heavy workloads such as neural networks suit wide instructions or custom datapaths better than workloads made of single adds?',
              options: ['Each multiply-add is expensive enough that sharing the overhead makes arithmetic a large share of the energy', 'Multiplies need no memory', 'Adds cannot be done in parallel', 'Neural networks have no overhead'],
              answer: 0,
              whyNot: [null, 'Multiplies need operands like anything else.', 'Adds can be done in parallel. The point is how much overhead each operation carries.', 'Every instruction has overhead. Neural network hardware amortizes it.'],
              explain: 'A multiply-add costs 3.2 to 4.6 pJ against 0.1 pJ for an add. Spread overhead over many multiply-adds and arithmetic becomes the main cost.'
            }
          ]
        }
      ]
    },

    /* ------------------------------ Part 4 ------------------------------ */
    {
      id: 'remedies',
      title: 'What can we do about it?',
      summary: 'Three levers, specialization, and why design cost matters.',
      steps: [
        {
          id: 'levers',
          title: 'Three levers',
          min: 5,
          blocks: [
            { t: 'p', text: 'The accounting points at three levers. Each one attacks a different line of the energy equation.' },
            {
              t: 'table',
              head: ['Lever', 'What it changes', 'What you pay', 'Where it returns in this course'],
              rows: [
                ['Fewer bits', 'Smaller multipliers and fewer bytes moved', 'Accuracy risk, possible retraining', 'Paper 5 (TPU, 8-bit multiplies), Paper 13 (HAQ)'],
                ['More work per instruction, or no instructions', 'Spreads or removes instruction overhead', 'Less flexibility', 'Paper 5 (TPU), Paper 2 (survey)'],
                ['Data close to the arithmetic, reused', 'Fewer expensive memory reads', 'On-chip memory area and a plan for what to keep', 'Paper 3 (Roofline), Paper 4 (Eyeriss)']
              ],
              source: 'original',
              caption: 'Our summary of the paper\'s directions. The paper discusses these themes. The mapping to later papers is ours.'
            },
            {
              t: 'callout',
              kind: 'example',
              body: 'Back in the kitchen: a food processor chops 64 onions per press (more work per instruction). A paring knife is enough for small jobs, so you do not wield a cleaver for everything (fewer bits). Shopping once a week instead of daily (reuse, data close by).'
            },
            {
              t: 'quiz',
              id: 'hor-q13',
              q: 'A design keeps each weight in a small register next to the multiplier and uses it 100 times before replacing it. Which lever is this?',
              options: ['Fewer bits', 'More work per instruction', 'Data close to the arithmetic, reused', 'None of them'],
              answer: 2,
              whyNot: ['The number of bits did not change. Only where the data lives changed.', 'No instruction changed. The data placement changed.', null, 'It is the third lever, applied to weights.'],
              explain: 'Keeping a value in a nearby register and reusing it 100 times divides its fetch cost by 100. That is the locality lever.'
            }
          ]
        },
        {
          id: 'special',
          title: 'Specialization: efficiency against flexibility',
          min: 6,
          blocks: [
            { t: 'p', text: 'A general-purpose core can run any program, so it pays for fetching, decoding and scheduling every instruction. A circuit built for one job skips most of that. The paper argues that specialized hardware can reach much lower energy per operation than a general-purpose core, at the cost of flexibility.' },
            {
              t: 'table',
              head: ['Kind of chip', 'Energy per operation (rough)', 'Flexibility', 'Design effort'],
              rows: [
                ['CPU core', 'Highest', 'Runs anything', 'Low for you, huge for the chip maker'],
                ['GPU', 'Lower for parallel work', 'Many parallel programs', 'Moderate, you write kernels'],
                ['FPGA', 'Lower again', 'Reprogrammable wiring', 'High, you design the circuit'],
                ['Custom chip (ASIC)', 'Lowest', 'One job', 'Highest, see the next step']
              ],
              source: 'original',
              caption: 'A rough ordering from our own reading. These are qualitative, not measurements, and real chips overlap.'
            },
            { t: 'callout', kind: 'paper', body: 'The paper discusses examples where specialized hardware uses far less energy than general-purpose processors. (Check which examples and which factors it gives in your copy.) **Reading task:** write down every example and its energy ratio. You will see the TPU (Paper 5) as a later example.' },
            {
              t: 'quiz',
              id: 'hor-q14',
              q: 'Which statement best states the tradeoff of specialization?',
              options: ['Much better energy per operation on one kind of work, at the cost of flexibility and design effort', 'Better energy on every kind of work', 'Lower design cost and lower energy', 'More flexibility and lower energy'],
              answer: 0,
              whyNot: [null, 'A chip built for one job is usually poor at other jobs.', 'Specialized chips usually cost more to design.', 'Flexibility is exactly what specialization gives up.'],
              explain: 'You trade flexibility and up-front effort for efficiency on the target workload.'
            }
          ]
        },
        {
          id: 'design-cost',
          title: 'The catch: design cost',
          min: 5,
          blocks: [
            { t: 'p', text: 'Designing a custom chip has a large fixed price, called {{nre|NRE}}. Each chip you ship saves some money, in electricity and in fewer servers. Break-even volume is the fixed price divided by the saving per chip.' },
            {
              t: 'callout',
              kind: 'example',
              body: 'A bakery builds a custom oven for one kind of loaf. It costs a lot, and every loaf is cheaper to bake. If you bake ten loaves a day, you never recover the cost. If you bake ten thousand, you do within months.'
            },
            {
              t: 'quiz',
              id: 'hor-q15',
              q: 'A custom chip costs $30 million to design. Each chip you deploy saves $12 in electricity and server costs. How many chips must you deploy to break even?',
              options: ['2.5 million', '360 million', '25 million', '250,000'],
              answer: 0,
              whyNot: [null, 'That multiplies $30 million by $12. You need to divide the fixed cost by the saving per chip.', 'That would be a saving of $1.20 per chip.', 'That would be a saving of $120 per chip.'],
              explain: '$30,000,000 / $12 per chip = 2,500,000 chips.'
            },
            {
              t: 'callout',
              kind: 'paper',
              body: 'The paper treats design cost as a core obstacle and argues that better design methods are needed so specialized chips are affordable for more uses. (Our paraphrase from memory. **Reading task:** find the closing discussion and note the specific methods it suggests.)'
            },
            { t: 'callout', kind: 'note', title: 'Our take', body: 'This is why the first AI accelerators appeared where volume was huge: a data-center service answering billions of requests, a phone sold in hundreds of millions of units. Paper 5, the TPU, is a data-center example.' }
          ]
        }
      ]
    },

    /* ------------------------------ Part 5 ------------------------------ */
    {
      id: 'nets',
      title: 'Apply it to neural networks',
      summary: 'Why networks suit specialization, and how the price list maps onto later papers.',
      steps: [
        {
          id: 'nn-fit',
          title: 'Why neural networks fit this story',
          min: 6,
          blocks: [
            { t: 'p', text: 'The paper covers computing in general. Neural networks fit its three levers unusually well:' },
            {
              t: 'list',
              ordered: true,
              items: [
                '**Huge numbers of identical multiply-adds.** AlexNet, an image network from 2012, needs about 724 million {{mac|MACs}} for one image (the number comes from the survey in Paper 2). That is the right shape for wide operations.',
                '**Lots of available reuse.** Each weight is used at many image positions, and each input value is used by many filters. Paper 4 explores this fully.',
                '**Tolerance for fewer bits.** Many networks keep their accuracy at 8 bits, which cuts multiplier energy by an order of magnitude.'
              ]
            },
            { t: 'h', text: 'What one pass over the weights costs' },
            { t: 'p', text: 'AlexNet has about 61 million {{weight|weights}} (also from Paper 2). If the weights live in DRAM and each is read once per image, you already pay for that reading, whatever else you do. Use 650 pJ per 32-bit word:' },
            {
              t: 'table',
              head: ['Format', 'Weight storage', 'DRAM energy to read each weight once', 'Power at 30 images per second'],
              rows: [
                ['32-bit float', '244 MB', '39.7 mJ', '1.2 W'],
                ['8-bit integer', '61 MB', '9.9 mJ', '0.3 W']
              ],
              source: 'toy',
              caption: 'Our estimate: 61 million weights x 650 pJ (x 1/4 for 8-bit words). It counts only one read of each weight and nothing else.'
            },
            { t: 'p', text: 'Even at 8 bits, 61 MB is far more than a typical on-chip SRAM of a few megabytes, so the weights must stream from DRAM. This is why later papers compress weights (Paper 6, EIE), keep them on-chip when possible, and stack memory closer to the processor (Paper 12, TETRIS).' },
            {
              t: 'quiz',
              id: 'hor-q16',
              q: 'A phone camera chip has a 2 W budget for running AlexNet 30 times per second, using the 650 pJ per 32-bit DRAM word from this lesson. The weights alone, read once per image at 32 bits, take about 1.2 W. What does that tell you?',
              options: ['More than half the budget goes to merely reading the weights, so reducing bits or reusing weights across images matters', 'DRAM is cheap enough to ignore', 'The chip needs a faster clock', 'The arithmetic must be the main cost'],
              answer: 0,
              whyNot: [null, '1.2 W out of 2 W is not ignorable.', 'Clock speed does not change the energy of reading each weight.', 'The weight reads alone use 1.2 W, before any arithmetic or activation traffic.'],
              explain: 'Energy per image is fixed by what you read. Fewer bits per weight, or reading each weight once and using it on several images (a batch), are the levers.'
            }
          ]
        },
        {
          id: 'course-map',
          title: 'Where each later paper attacks the table',
          min: 4,
          blocks: [
            { t: 'p', text: 'Read the rest of the course with this table in mind. Every paper picks a line of the energy equation and reduces it.' },
            {
              t: 'table',
              head: ['Later paper', 'What it reduces'],
              rows: [
                ['2. Sze et al. survey', 'Lays out the whole design space and the metrics, with data movement at the center.'],
                ['3. Roofline', 'Shows when a program is limited by memory and when by arithmetic.'],
                ['4. Eyeriss', 'Cuts DRAM and buffer reads by choosing a dataflow that reuses data in small local memories.'],
                ['5. TPU', 'Uses 8-bit multiplies and a large grid of multipliers, so one instruction does many operations.'],
                ['6. EIE and 7. SCNN', 'Skip zeros and compress weights so fewer bytes move.'],
                ['8 to 10. Timeloop, MAESTRO, Accelergy', 'Tools that run this energy accounting for a design before you build it.'],
                ['12. TETRIS and 18. FlashAttention', 'Cut the cost or the count of DRAM reads, in hardware and in software.']
              ],
              source: 'original',
              caption: 'Our map. Later lessons will check each row against its paper.'
            },
            { t: 'callout', kind: 'idea', body: 'When you read any architecture paper, ask three questions. Which line of the energy equation does it reduce? By how much? What does it give up?' }
          ]
        }
      ]
    }
  ];
})();
