/* Paper 1 lesson, parts 6 to 8: reading critically, wrap-up, practice problems. */
(function () {
  'use strict';
  window.HOR = window.HOR || {};

  window.HOR.p3 = [
    /* ------------------------------ Part 6 ------------------------------ */
    {
      id: 'critique',
      title: 'Reading it critically',
      summary: 'What the evidence supports, what it does not, and common misreadings.',
      steps: [
        {
          id: 'caveats',
          title: 'What to question',
          min: 6,
          blocks: [
            { t: 'p', text: 'This paper is a keynote. It argues a view and backs it with numbers. It does not run a controlled experiment. Read it as a very well-informed summary, and keep these checks in mind.' },
            {
              t: 'list',
              ordered: true,
              items: [
                '**One manufacturing process, one year.** The table is for a 45 nm process around 2014. The ratios have stayed useful. The absolute values differ for newer processes and for newer memories such as stacked HBM.',
                '**Per-operation energy is not whole-system energy.** Clock distribution, long wires, control logic and leakage add to the total.',
                '**Memory energy depends on the access pattern.** A table gives one typical number per memory size. Real DRAM energy varies with how the accesses are arranged.',
                '**Words are not all the same width.** The memory rows are per 64-bit read. The adds are 32-bit or narrower. Compare them carefully.',
                '**Energy is one metric.** Latency, chip area, cost and flexibility matter too. A design can win on energy and lose on all four.'
              ]
            },
            {
              t: 'table',
              head: ['Claim', 'What supports it', 'Our confidence (opinion)'],
              rows: [
                ['Energy limits what computers can do', 'The history of scaling and the power limit', 'High. Widely accepted.'],
                ['Memory access costs far more than arithmetic', 'The energy table', 'High for the 45 nm numbers. Check newer processes.'],
                ['General-purpose processors waste most energy on overhead', 'The processor energy breakdown in the paper', 'Medium. Read the breakdown and judge it yourself.'],
                ['Specialization gives large gains', 'Examples in the paper', 'Medium. A few examples, read them closely.'],
                ['Design cost is the main obstacle to specialization', 'Argument', 'An argument, not a measurement.']
              ],
              source: 'original',
              caption: 'Our judgment of each claim. This column is opinion. Form your own after reading the paper.'
            },
            {
              t: 'quiz',
              id: 'hor-q17',
              q: 'Which statements does the energy table support? Pick all that apply.',
              options: ['Reading a small SRAM costs far more energy than a 32-bit add', 'A 32-bit multiply costs about the same as a 32-bit add', 'DRAM reads cost more than SRAM reads', 'GPUs use less energy than CPUs'],
              answer: [0, 2],
              whyNot: [null, 'The table lists 3.1 pJ for the multiply and 0.1 pJ for the add, about 31 times apart.', null, 'The table prices single operations. It says nothing about complete chips, so it cannot compare a GPU with a CPU.'],
              explain: 'The table compares prices of individual events. Claims about whole chips need whole-chip evidence.'
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
                { front: 'Misreading 1: "Everything is memory-bound."', back: 'The table says a memory read costs far more than an operation. Whether a program is limited by memory depends on how much reuse it has. Paper 3 (Roofline) makes this precise.' },
                { front: 'Misreading 2: "Use the 45 nm numbers for any chip today."', back: 'Use the ratios as a guide and check the manufacturing process. New processes shrink arithmetic energy, and off-chip memory energy has moved less.' },
                { front: 'Misreading 3: "A multiplier costs about as much as an adder."', back: 'At 32 bits the table gives 3.1 pJ against 0.1 pJ. That is about 31 times.' },
                { front: 'Misreading 4: "Half the bits saves half the energy."', back: 'Multiplier energy falls with bits squared, adder energy with bits, and memory traffic with bits. A whole system gets a blend, and accuracy may suffer.' },
                { front: 'Misreading 5: "Specialization is free."', back: 'It gives up flexibility and carries a large one-time design cost, which only pays off at high volume.' }
              ]
            },
            {
              t: 'quiz',
              id: 'hor-q18',
              q: 'A colleague says: "The paper proves we should always put everything in on-chip SRAM." What is the best reply?',
              options: ['The table shows SRAM reads cost much less than DRAM reads, but a bigger SRAM costs more per read and takes chip area, so the answer is to keep each piece of data in the smallest memory that holds it', 'The paper says DRAM is free', 'Nothing can be said without a simulator', 'The paper says SRAM is more expensive than DRAM'],
              answer: 0,
              whyNot: [null, 'The table shows the opposite. DRAM is the most expensive row.', 'The table already supports a useful rule of thumb without a simulator.', 'Per read, SRAM is far cheaper than DRAM in the table.'],
              explain: 'Both facts matter: SRAM is cheaper than DRAM per read, and bigger SRAMs cost more per read and more area.'
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
          title: 'What came next (later work, not in the paper)',
          min: 3,
          blocks: [
            { t: 'callout', kind: 'note', title: 'Later context', body: 'Everything on this page happened after the paper or is outside it. Later lessons will check each item against its own paper.' },
            {
              t: 'list',
              items: [
                'Accelerator designers took the energy accounting seriously and built chips around reuse in small memories. Paper 4 (Eyeriss) and Paper 5 (the TPU) are the first two examples you will read.',
                'Tools appeared that automate the accounting, so a designer can test a design before building it. Papers 8, 9 and 10 (Timeloop, MAESTRO, Accelergy) are about those tools.',
                'The same data movement thinking moved into software. Paper 18 (FlashAttention) changes how attention is computed so that fewer values travel to and from DRAM.'
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
                { part: 'limit', q: 'Which change ended the free speedups from shrinking transistors?', options: ['Supply voltage stopped scaling down, so power per transistor stopped falling', 'Transistors stopped getting smaller', 'Memory got slower', 'Clock speeds became illegal'], answer: 0, explain: 'Transistors kept shrinking, but without voltage scaling the power per transistor stayed flat while transistor counts doubled.' },
                { part: 'limit', q: 'A chip is limited to 20 W and each operation costs 2 pJ. What is the most operations per second it can sustain?', options: ['10 trillion', '10 billion', '40 trillion', '1 trillion'], answer: 0, explain: '20 W divided by 2 x 10^-12 J is 10^13 operations per second.' },
                { part: 'table', q: 'About how many 32-bit integer adds cost as much energy as one 64-bit off-chip DRAM read, using the paper\'s table?', options: ['More than 10,000', 'About 100', 'About 1,000', 'About 10'], answer: 0, explain: '1.3 to 2.6 nJ divided by 0.1 pJ is 13,000 to 26,000.' },
                { part: 'table', q: 'Why does a bigger SRAM cost more per read?', options: ['The signal has to travel along longer wires, which have more capacitance', 'Bigger memories use older transistors', 'The paper says so without a reason', 'They always run at higher voltage'], answer: 0, explain: 'Energy per switch is proportional to capacitance, and a bigger memory has longer wires.' },
                { part: 'table', q: 'You move a multiplier from 32 bits to 8 bits. By the width rule, about how much less energy does the multiply use?', options: ['16 times less', '4 times less', '2 times less', 'No change'], answer: 0, explain: 'A multiplier scales with bits squared, and (32 / 8) squared is 16.' },
                { part: 'count', q: 'A float multiply-add reads three 32-bit operands from DRAM with no reuse. About what share of its energy is arithmetic?', options: ['Under 1%', 'About 25%', 'About 50%', 'About 90%'], answer: 0, explain: '4.6 pJ of arithmetic against about 1,950 pJ of DRAM reads is about 0.24%.' },
                { part: 'count', q: 'Each fetched value is reused by 100 multiply-adds. What happens to the data movement energy per multiply-add?', options: ['It falls by a factor of 100', 'It rises 100 times', 'It stays the same', 'It falls by 10 times'], answer: 0, explain: 'The fetch cost is shared by 100 operations.' },
                { part: 'count', q: 'What does it mean to amortize instruction overhead?', options: ['Spread the fixed fetch and decode cost over many operations', 'Remove arithmetic', 'Add more instructions', 'Slow the clock'], answer: 0, explain: 'One instruction that triggers many operations shares its overhead among them.' },
                { part: 'remedies', q: 'Why do custom accelerator chips first appear where volume is huge?', options: ['Their large one-time design cost must be spread over many chips', 'They only work at high volume', 'Small companies are not allowed to build chips', 'They cannot be tested'], answer: 0, explain: 'Break-even volume is design cost divided by the saving per chip.' },
                { part: 'nets', q: 'Why must AlexNet-sized weights usually stream from DRAM on an accelerator?', options: ['About 61 MB at 8 bits is far more than a few megabytes of on-chip SRAM', 'DRAM is faster than SRAM', 'Weights cannot be stored in SRAM', 'The weights are zero'], answer: 0, explain: 'The weights are much bigger than the on-chip SRAM, so they must be read from off-chip memory on every pass.' }
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
              id: 'tb1',
              prompt: 'In five sentences, explain to a friend why moving data costs more than computing on it, and what a chip designer can do about it.',
              checklist: [
                'Said that an operation costs picojoules and a DRAM read costs thousands of times more.',
                'Said that longer wires and bigger memories cost more energy per access.',
                'Named reuse (keeping data close and using it many times) as the main remedy.',
                'Mentioned at least one more lever: fewer bits, or more work per instruction.'
              ]
            },
            { t: 'h', text: '2. One line per part' },
            {
              t: 'table',
              head: ['Part', 'One-line summary'],
              rows: [
                ['1. Why energy is the limit', 'Power equals energy per operation times rate. Voltage stopped scaling, so power per transistor stopped falling.'],
                ['2. The energy table', 'An add costs a fraction of a picojoule, a multiply a few, a small SRAM read ten, a DRAM read over a thousand. Multiplies scale with bits squared.'],
                ['3. Counting the energy', 'Energy is the sum of count times price. Reuse divides data movement. Wide instructions amortize overhead.'],
                ['4. What can we do', 'Three levers: fewer bits, more work per instruction, data close to arithmetic. Specialization costs flexibility and design effort.'],
                ['5. Neural networks', 'Many identical multiply-adds, lots of reuse and tolerance for few bits make them suit specialization. Weights stream from DRAM.'],
                ['6. Reading critically', 'One process and one year. Whole-system energy needs more than a table.']
              ]
            },
            { t: 'h', text: '3. How to read the real paper' },
            { t: 'p', text: 'The paper is short. Read it in this order. Section titles may differ from the ones below, so match by content.' },
            {
              t: 'readmap',
              rows: [
                { section: 'The opening discussion of scaling and power', how: 'Read closely', note: 'Find when voltage scaling slowed and which numbers it gives (Part 1).', part: 'limit' },
                { section: 'The energy table figure', how: 'Read closely with a pencil', note: 'Check every dagger value. Note the process and supply voltage (Part 2).', part: 'table' },
                { section: 'The discussion of memory and cache energy', how: 'Read closely', note: 'Compare with the square-root rule in Step 2.3 (Part 2).', part: 'table' },
                { section: 'The breakdown of energy in a processor instruction', how: 'Read closely', note: 'Replace the 60 pJ guess in the overhead widget with the paper\'s numbers (Part 3).', part: 'count' },
                { section: 'The specialization examples', how: 'Read closely', note: 'Write down every example and its energy ratio (Part 4).', part: 'remedies' },
                { section: 'The closing discussion on design cost and methods', how: 'Skim, then reread', note: 'Note the specific methods it suggests (Part 4).', part: 'remedies' }
              ]
            },
            { t: 'h', text: '4. References and where to go next' },
            {
              t: 'list',
              items: [
                'Horowitz. **Computing\'s Energy Problem (and what we can do about it).** ISSCC 2014 (plenary).',
                'Dennard et al. **Design of ion-implanted MOSFET\'s with very small physical dimensions.** IEEE Journal of Solid-State Circuits, 1974. The source of Dennard scaling.',
                'Moore. **Cramming more components onto integrated circuits.** Electronics, 1965. The source of Moore\'s law.',
                'Next: **Paper 2, Sze et al.,** a survey that applies this energy view to deep neural networks. Then **Paper 3, the Roofline model,** which turns the memory-versus-arithmetic tradeoff into a simple chart.'
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
              id: 'hor-practice',
              intro: 'Do each problem on paper first. Type a numeric answer and press **Check my answer**. It says only Correct or Not yet and never shows the answer. Open the hint if you are stuck, and open the solution when you are done. Every problem gives the numbers it needs.',
              problems: [
                {
                  level: 'simple',
                  q: 'A chip does 2 trillion 32-bit integer multiplies per second. Each multiply costs 3.1 pJ (from the paper\'s table). How many watts do the multipliers use? Ignore everything else on the chip.',
                  check: { answer: 6.2, unit: 'W' },
                  hint: 'Power = energy per operation x operations per second. Convert picojoules to joules first: 1 pJ = 10^-12 J.',
                  solution: [
                    'Energy per multiply: 3.1 pJ = 3.1 x 10^-12 J. Rate: 2 x 10^12 per second.',
                    'Power = (3.1 x 10^-12 J) x (2 x 10^12 per s) = **6.2 W**.',
                    'Common mistake: forgetting the 10^-12 conversion and getting a power in the trillions. A shortcut for this course: 1 pJ per operation at 1 trillion operations per second is 1 W, so 3.1 pJ at 2 trillion per second is 3.1 x 2 = 6.2 W.'
                  ]
                },
                {
                  level: 'simple',
                  q: 'One 64-bit read from off-chip DRAM costs 1.3 nJ (the low end of the paper\'s range). One 32-bit integer add costs 0.1 pJ. How many adds cost the same energy as one DRAM read?',
                  check: { answer: 13000, unit: 'adds' },
                  hint: '1 nJ = 1,000 pJ. Put both numbers in picojoules, then divide.',
                  solution: [
                    '1.3 nJ = 1,300 pJ. Divide: 1,300 / 0.1 = **13,000 adds**.',
                    'Common mistake: skipping the nJ to pJ conversion, which gives 13. Remember the read moves 64 bits while the add handles 32, so per bit the gap is about half as big, and still above 6,000.'
                  ]
                },
                {
                  level: 'simple',
                  q: 'In one shrink step, capacitance falls to 0.7 of its old value, voltage to 0.7, and clock frequency rises to 1.43 times (that is 1 / 0.7). Power per transistor is proportional to capacitance x voltage squared x frequency. By what factor does the power of one transistor change in one step?',
                  check: { answer: 0.49, unit: 'x' },
                  hint: 'Square the voltage factor first: 0.7 squared.',
                  solution: [
                    'Factor = 0.7 (capacitance) x 0.49 (voltage squared) x 1.43 (frequency) = **0.49**.',
                    'Each transistor needs half the power, and area per transistor also falls to 0.49, so twice as many fit and chip power stays flat. If the voltage stays fixed, the factor becomes 0.7 x 1 x 1.43 = 1.0. Per-transistor power stops falling, and chip power doubles every step. That is the end of Dennard scaling.'
                  ]
                },
                {
                  level: 'medium',
                  q: 'A layer does 50 million 32-bit float multiply-adds. Arithmetic costs 3.7 pJ per multiply and 0.9 pJ per add. Each multiply-add reads 3 operands (32 bits each) from an 8 KB SRAM at 5 pJ per 32-bit word. What is the total energy of the layer, in microjoules? (1 uJ = 10^6 pJ.)',
                  check: { answer: 980, unit: 'uJ' },
                  hint: 'Find the energy of one multiply-add (arithmetic plus three reads), then multiply by 50 million.',
                  solution: [
                    {
                      t: 'table',
                      head: ['Part', 'Per multiply-add'],
                      rows: [['Multiply', '3.7 pJ'], ['Add', '0.9 pJ'], ['3 reads x 5 pJ', '15 pJ'], ['**Total**', '**19.6 pJ**']]
                    },
                    '19.6 pJ x 50,000,000 = 980,000,000 pJ = **980 uJ**.',
                    'Common mistake: using 10 pJ per read. That figure is for a 64-bit read in the paper\'s table. A 32-bit word costs about half. Using 10 pJ would give 1,330 uJ.'
                  ]
                },
                {
                  level: 'medium',
                  q: 'Same layer as the previous problem, but now the 3 operands of each multiply-add come from DRAM at 650 pJ per 32-bit word, with no reuse. What percentage of the layer\'s energy is arithmetic? Give two significant digits.',
                  check: { answer: 0.2353, tol: 0.05, unit: '%' },
                  hint: 'Arithmetic per multiply-add is 4.6 pJ. Data movement per multiply-add is 3 x 650 pJ.',
                  solution: [
                    'Data movement: 3 x 650 = 1,950 pJ per multiply-add. Arithmetic: 4.6 pJ. Total: 1,954.6 pJ.',
                    'Share = 4.6 / 1,954.6 = 0.00235, which is **0.24%** (0.235% to three digits).',
                    'The layer now uses 50 million x 1,954.6 pJ = 97.7 mJ, about 100 times the 980 uJ it used with an 8 KB SRAM. Same arithmetic, different data source.'
                  ]
                },
                {
                  level: 'medium',
                  q: 'Keep the DRAM setup of the previous problem, but each fetched word is now reused by 64 multiply-adds before it is discarded. By what factor does the energy per multiply-add fall compared with no reuse?',
                  check: { answer: 55.7, unit: 'x' },
                  hint: 'Reuse divides the data movement part only. The arithmetic part stays at 4.6 pJ.',
                  solution: [
                    'With reuse of 64: data movement per multiply-add = 1,950 / 64 = 30.47 pJ. Total = 4.6 + 30.47 = 35.07 pJ.',
                    'Without reuse the total was 1,954.6 pJ. Factor = 1,954.6 / 35.07 = **55.7**.',
                    'It is not 64 because the arithmetic does not shrink. Reuse can only remove the part of the energy that it divides.'
                  ]
                },
                {
                  level: 'medium',
                  q: 'Voltage is stuck at its old value and the clock is held. Each generation scales capacitance to 0.7 of its old value and fits 1 / 0.49 = 2.04 times as many transistors in the same area. Power per transistor is proportional to capacitance x voltage squared x frequency. After 3 generations, what share of the transistors can you switch at full rate without exceeding the original chip power? Give a percentage.',
                  check: { answer: 34.3, unit: '%' },
                  hint: 'Chip power per generation = (transistor growth) x (power per transistor factor). Then raise it to the power of 3.',
                  solution: [
                    'Power per transistor falls to 0.7 x 1 x 1 = 0.7 per generation. Transistors grow 2.04 times. Chip power grows by 0.7 x 2.04 = 1.43 per generation.',
                    'After 3 generations: 1.43 cubed = 2.92 times the original power if every transistor switched.',
                    'Share you can run in the original budget: 1 / 2.92 = **34.3%**. The rest must stay idle or run slowly. The lesson widget shows the same table.'
                  ]
                },
                {
                  level: 'hard',
                  q: 'A phone gives a camera network 2 W. The network needs 724 million multiply-adds per image, at 30 images per second. Each multiply-add costs 4.6 pJ of arithmetic plus 3 operand fetches from DRAM at 650 pJ each, and every fetched word is shared by R multiply-adds. What is the smallest R that keeps the total inside 2 W? Ignore every other use of power.',
                  check: { answer: 22.3, tol: 0.03, unit: 'multiply-adds per fetched word' },
                  hint: 'Work out the energy you can spend per multiply-add first: watts divided by multiply-adds per second. Then subtract the arithmetic and solve for R.',
                  solution: [
                    'Multiply-adds per second: 724 x 10^6 x 30 = 21.72 x 10^9. Energy allowed per multiply-add: 2 W / 21.72 x 10^9 per s = 92.08 pJ.',
                    'Arithmetic takes 4.6 pJ, leaving 87.48 pJ for data movement. Data movement is 3 x 650 / R = 1,950 / R.',
                    'Set 1,950 / R = 87.48 and solve: R = **22.3**. Any reuse of 23 or more fits the budget.',
                    'What it means: each word fetched from DRAM must be used by about 23 multiply-adds before it is dropped. That needs an on-chip buffer big enough to hold the data being reused, and a schedule that uses it. This is the job that Paper 4 (Eyeriss) takes on.'
                  ]
                },
                {
                  level: 'hard',
                  q: 'A processor spends 45 pJ of overhead on every instruction. One instruction can perform W 32-bit float multiply-adds at 4.6 pJ each. What is the smallest whole number W that makes at least 70% of an instruction\'s energy arithmetic?',
                  check: { answer: 23, unit: 'multiply-adds per instruction' },
                  hint: 'Write the share as (4.6 x W) / (45 + 4.6 x W) and set it greater than or equal to 0.7.',
                  solution: [
                    '4.6 W >= 0.7 x (45 + 4.6 W). Expand: 4.6 W >= 31.5 + 3.22 W. Collect terms: 1.38 W >= 31.5.',
                    'W >= 22.83, so the smallest whole number is **23**.',
                    'Check: W = 22 gives 101.2 / 146.2 = 69.2% (too low). W = 23 gives 105.8 / 150.8 = 70.2%. The tradeoff to notice: a very wide instruction is only useful if the program has that much parallel work to fill it, and neural network layers usually do.'
                  ]
                },
                {
                  level: 'hard',
                  q: 'Your team wants to move a camera chip from 32-bit float to 8-bit integer arithmetic. Use 0.2 pJ (multiply) plus 0.03 pJ (add) for 8-bit arithmetic and 4.6 pJ for 32-bit float. Words are four times narrower, so a DRAM word costs 162.5 pJ instead of 650 pJ. Each multiply-add reads 3 operands from DRAM, with no reuse. By what factor does the total energy per multiply-add fall? (a) Then explain why it falls much less than the arithmetic does, (b) say what you would change to get more from the 8-bit design, and (c) name two risks.',
                  check: { answer: 4.0, tol: 0.03, unit: 'x, total energy per multiply-add' },
                  hint: 'Compute both totals: arithmetic plus 3 DRAM words. Then compare the ratio of the arithmetic alone with the ratio of the totals.',
                  solution: [
                    'Float: 4.6 + 3 x 650 = 1,954.6 pJ. Integer: 0.23 + 3 x 162.5 = 487.73 pJ. Ratio = 1,954.6 / 487.73 = **4.0**.',
                    '(a) Arithmetic alone falls 20 times (4.6 / 0.23), but data movement falls only 4 times (words are 4 times narrower), and data movement is almost the entire energy. The total can only follow the part that dominates, so it falls about 4 times.',
                    '(b) Raise reuse. With reuse of 256 the float design uses 4.6 + 1,950 / 256 = 12.2 pJ and the integer design uses 0.23 + 487.5 / 256 = 2.13 pJ, a ratio of 5.7. More of the energy is arithmetic, so the 20 times arithmetic saving counts more. Reading operands from a small on-chip SRAM has a similar effect.',
                    '(c) Risks: accuracy may drop, so you may need calibration or retraining. Running totals (partial sums) usually need wider accumulators than 8 bits, so some arithmetic and storage stays wide. Some layers or functions in the network may not tolerate 8 bits at all.'
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
