/* Paper 1 lesson, parts 0 to 2: start, why energy limits chips, the energy table. */
(function () {
  'use strict';
  var MLS = window.MLS;
  window.HOR = window.HOR || {};

  /* ---------- Figures ---------- */
  function kitchen(host) {
    MLS.graph(host, {
      width: 830,
      height: 150,
      ariaLabel: 'Five places data can live, from the arithmetic unit outward to off-chip DRAM, with the energy of one read',
      nodes: [
        { id: 'alu', label: 'Arithmetic', sub: 'the cook chops', cx: 70, cy: 75, w: 110, h: 56, kind: 'op' },
        { id: 'rf', label: 'Hands', sub: 'register file', cx: 220, cy: 75, w: 112, h: 56, kind: 'var' },
        { id: 's8', label: 'Counter', sub: '8 KB SRAM: 10 pJ', cx: 375, cy: 75, w: 132, h: 56, kind: 'var' },
        { id: 's1', label: 'Pantry', sub: '1 MB SRAM: 100 pJ', cx: 545, cy: 75, w: 140, h: 56, kind: 'var' },
        { id: 'dr', label: 'Store across town', sub: 'DRAM: 1,300 to 2,600 pJ', cx: 735, cy: 75, w: 176, h: 56, kind: 'io' }
      ],
      edges: [
        { from: 'alu', to: 'rf' },
        { from: 'rf', to: 's8' },
        { from: 's8', to: 's1' },
        { from: 's1', to: 'dr' }
      ]
    });
  }

  function instruction(host) {
    MLS.graph(host, {
      width: 830,
      height: 150,
      ariaLabel: 'The steps a processor takes for one add instruction. Only one box does the add.',
      nodes: [
        { id: 'f', label: 'Fetch', sub: 'instruction cache', cx: 70, cy: 75, w: 112, h: 56, kind: 'var' },
        { id: 'd', label: 'Decode', sub: 'control logic', cx: 215, cy: 75, w: 112, h: 56, kind: 'var' },
        { id: 'r', label: 'Read registers', sub: 'register file', cx: 375, cy: 75, w: 140, h: 56, kind: 'var' },
        { id: 'a', label: 'Add', sub: 'the useful work', cx: 535, cy: 75, w: 108, h: 56, kind: 'op' },
        { id: 'w', label: 'Write result', sub: 'register file', cx: 690, cy: 75, w: 132, h: 56, kind: 'var' }
      ],
      edges: [
        { from: 'f', to: 'd' },
        { from: 'd', to: 'r' },
        { from: 'r', to: 'a' },
        { from: 'a', to: 'w' }
      ]
    });
  }
  window.HOR.figKitchen = kitchen;
  window.HOR.figInstruction = instruction;

  window.HOR.p1 = [
    /* ------------------------------ Part 0 ------------------------------ */
    {
      id: 'start',
      title: 'Start here',
      summary: 'What the paper is, what you will learn, and how to use this lesson.',
      steps: [
        {
          id: 'welcome',
          title: 'Welcome to Paper 1',
          min: 3,
          blocks: [
            { t: 'p', lead: true, text: 'Every chip you use stops getting faster because of heat and battery long before it runs out of transistors. This 2014 keynote by Mark Horowitz explains why, puts a price in picojoules on each basic operation, and shows that moving data costs far more than computing on it. The rest of this course builds on that price list.' },
            {
              t: 'facts',
              rows: [
                ['Paper', 'Computing\'s Energy Problem (and what we can do about it)'],
                ['Author', 'Mark Horowitz (Stanford University)'],
                ['Venue', 'IEEE International Solid-State Circuits Conference (ISSCC) 2014, plenary session. It is a short keynote paper of a few pages.'],
                ['Read the original', 'Search for the title in IEEE Xplore, or ask your library. Open it next to this lesson. Part 7 gives a reading map.'],
                ['Time', 'About 2 hours for the lesson, plus 30 to 40 minutes for the practice problems at the end. Do one or two parts per sitting. Your place is saved in this browser.'],
                ['You should know', 'What a transistor is, and basic algebra. Nothing else.']
              ]
            },
            { t: 'h', text: 'By the end you can' },
            {
              t: 'list',
              ordered: true,
              items: [
                'Explain why power, not transistor count, limits modern chips, using {{dennard-scaling|Dennard scaling}}.',
                'Read the energy-per-operation table and compute ratios, such as how many adds cost as much as one {{dram|DRAM}} read.',
                'Estimate the energy of a computation by counting operations and data accesses.',
                'Explain why a general-purpose processor spends most of its energy on {{instruction-overhead|overhead}}, and how wide instructions and {{specialization}} cut it.',
                'Explain why fewer bits save energy, using the way an adder and a multiplier scale.',
                'Apply the accounting to a neural network layer and say which change to try first.'
              ]
            },
            {
              t: 'callout',
              kind: 'try',
              title: 'How this lesson works',
              body: [
                'Press **Next** or the right arrow key to move on. **Back** or the left arrow goes back. The **Parts** menu lets you jump anywhere.',
                'Words with a dotted underline open a short definition. The **Glossary** button lists them all.',
                'Every figure and widget is tagged. **From the paper** means the data is the authors\' own. **Toy model** means we built a small model to teach an idea, so do not quote its numbers as results.',
                'The last part holds **practice problems** at three levels. Each one hides its hint and solution until you open it.'
              ]
            }
          ]
        },
        {
          id: 'tldr',
          title: 'The paper in 60 seconds',
          min: 3,
          blocks: [
            { t: 'p', text: 'For decades, shrinking transistors made chips faster **and** kept power flat. In the mid-2000s the power part stopped working, so energy per operation became the limit on what a chip can do. The paper lists what basic operations cost in energy. An add costs a fraction of a picojoule. A multiply costs a few. Reading a small on-chip memory costs ten. Reading DRAM costs over a thousand. Moving data costs far more than computing on it.' },
            { t: 'p', text: 'A general-purpose processor also pays a large overhead around every instruction. The way forward is to use fewer bits, do more work per instruction, keep data close to the arithmetic, and build hardware specialized for the job, while finding ways to keep the design cost of that hardware low.' },
            { t: 'callout', kind: 'idea', body: 'Arithmetic is cheap. Moving data and decoding instructions is expensive. Good hardware design spends its effort on the second part.' },
            { t: 'h', text: 'The paper in four questions' },
            {
              t: 'flip',
              hint: 'Click to see the answer',
              cards: [
                { front: 'What problem does it solve?', back: 'It explains why computers hit an energy wall, and where the energy of a computation actually goes.' },
                { front: 'What is the core idea?', back: 'Price every operation in energy. The table shows that memory access and instruction overhead cost much more than arithmetic, so efficiency comes from reducing those.' },
                { front: 'How does the author support it?', back: 'With energy numbers for a 45 nm chip, a history of how scaling worked and stopped, and examples of specialized hardware beating general-purpose cores.' },
                { front: 'What should you question?', back: 'The numbers belong to one manufacturing process from around 2014. Check which ratios still hold today, and note that a keynote argues a view rather than running controlled experiments.' }
              ]
            },
            { t: 'h', text: 'The course map' },
            { t: 'p', text: 'Nine short parts, the last one with practice problems. Click any card to jump there.' },
            { t: 'partmap', skipFirst: true }
          ]
        }
      ]
    },

    /* ------------------------------ Part 1 ------------------------------ */
    {
      id: 'limit',
      title: 'Why energy is the limit',
      summary: 'Power, Moore\'s law, and why scaling stopped giving free speed.',
      steps: [
        {
          id: 'power-energy',
          title: 'Energy, power and what a chip can cool',
          min: 5,
          blocks: [
            { t: 'p', text: 'Play a game on your phone for twenty minutes and it gets warm, then the game slows down. The chip is not broken. It makes heat faster than the case can get rid of it, so the phone lowers the {{clock|clock speed}} to protect itself.' },
            {
              t: 'callout',
              kind: 'example',
              body: 'A phone case, a laptop fan and a data-center rack are all heat removers, and each has a ceiling in watts. A phone chip is designed for a few watts. A laptop processor is designed for tens of watts. A data-center GPU is designed for several hundred.'
            },
            { t: 'p', text: 'Two words matter here. {{energy|Energy}} is the amount of work you pay for, measured in {{joule|joules}}. {{power|Power}} is energy per second, measured in {{watt|watts}}. A battery limits your total energy. A cooler limits your power.' },
            { t: 'callout', kind: 'idea', body: '**Power = energy per operation x operations per second.** A chip that spends 1 {{pj|picojoule}} per operation and does a trillion operations per second uses exactly 1 watt.' },
            {
              t: 'table',
              head: ['Energy per operation', 'Power at 1 trillion operations per second'],
              rows: [['0.1 pJ', '0.1 W'], ['1 pJ', '1 W'], ['10 pJ', '10 W'], ['100 pJ', '100 W'], ['1,000 pJ (1 nJ)', '1,000 W']],
              source: 'original',
              caption: 'The multiplication from the box above. Keep this table in mind. You will use it all through the course.'
            },
            {
              t: 'quiz',
              id: 'hor-q1',
              kind: 'predict',
              q: 'A chip can be cooled at 10 W. Each operation costs 1 pJ. What is the most operations per second it can run?',
              options: ['10 billion', '100 billion', '10 trillion', '100 trillion'],
              answer: 2,
              whyNot: ['That would be 0.01 W at 1 pJ per operation. You are leaving most of the 10 W unused.', 'That would use 0.1 W, not 10 W.', null, 'That would need 100 W at 1 pJ per operation, ten times your limit.'],
              explain: '10 W divided by 1 pJ per operation is 10 / (1 x 10^-12) = 10^13 operations per second, which is 10 trillion.'
            },
            {
              t: 'quiz',
              id: 'hor-q2',
              q: 'You want the same chip to run 4 times more operations per second inside the same 10 W. What must happen to the energy per operation?',
              options: ['It can stay the same', 'It must drop to one quarter', 'It must drop to one half', 'It must double'],
              answer: 1,
              whyNot: ['Four times the operations at the same energy each would use four times the power, 40 W.', null, 'Half would give you only twice the operations in 10 W.', 'Doubling it would make the chip slower inside 10 W, not faster.'],
              explain: 'Power is fixed, so operations per second can only rise if energy per operation falls by the same factor. This is why the paper talks about energy per operation.'
            },
            { t: 'callout', kind: 'paper', body: 'The paper\'s starting point is the same: energy, not the number of transistors you can build, is what limits computing today. (Our paraphrase of the paper\'s theme. See the reading map in Part 7.)' }
          ]
        },
        {
          id: 'moore',
          title: 'Moore\'s law gave us transistors, not power',
          min: 4,
          blocks: [
            { t: 'p', text: 'The first microprocessor, the Intel 4004 in 1971, had about 2,300 {{transistor|transistors}}. A phone or laptop chip today has billions. This growth is {{moores-law|Moore\'s law}}: the number of transistors per chip doubles roughly every two years.' },
            { t: 'p', text: 'For about thirty years a second gift came with it. Smaller transistors also switched faster and used less energy each. So every new generation gave you more transistors, a faster clock and about the same power. The next step shows why that second gift ended.' },
            { t: 'callout', kind: 'watch', body: 'Moore\'s law counts transistors. It says nothing about how much energy each one uses. People often blur the two, and the paper depends on keeping them apart.' },
            {
              t: 'quiz',
              id: 'hor-q3',
              q: 'Which statement describes Moore\'s law?',
              options: ['Chips get twice as fast every two years', 'The number of transistors on a chip doubles roughly every two years', 'The power a chip uses halves every two years', 'Memory gets twice as cheap every two years'],
              answer: 1,
              whyNot: ['Speed is not part of the law. Clock speed stopped rising quickly in the mid-2000s while transistor counts kept growing.', null, 'Power is exactly what the law does not promise. That gap is the subject of the paper.', 'The law is about transistors on a chip, not about the price of memory.'],
              explain: 'Moore\'s law is about transistor count. Speed and power depend on how those transistors are scaled.'
            }
          ]
        },
        {
          id: 'dennard',
          title: 'Dennard scaling: the free lunch that ended',
          min: 7,
          blocks: [
            {
              t: 'callout',
              kind: 'example',
              body: 'A builder makes the houses on a street 30% smaller on each side, so twice as many fit on the same street. If each house also uses half the electricity, the street\'s power bill stays the same and you now have twice the homes. Now suppose houses stop getting cheaper to run. Doubling the homes doubles the bill, and the street\'s transformer overheats.'
            },
            { t: 'p', text: 'Chips behaved like the first street for decades. The power a transistor uses while switching is roughly **capacitance x voltage squared x clock frequency**. Shrink every dimension by 0.7 and three things happen at once: capacitance falls to 0.7, voltage falls to 0.7 (so voltage squared falls to 0.49), and the clock can rise by 1 / 0.7, about 1.43. Multiply them: power per transistor falls to 0.7 x 0.49 x 1.43 = 0.49. Area per transistor also falls to 0.49. The chip uses the same power per square millimeter, with twice the transistors and a faster clock. This is {{dennard-scaling|Dennard scaling}}, described by Robert Dennard and colleagues in 1974.' },
            { t: 'p', text: 'Then supply voltage stopped falling. Below roughly 1 volt, transistors {{leakage|leak}} too much current, so designers could no longer lower voltage each generation. The first street became the second. Try both in the widget.' },
            {
              t: 'widget',
              name: 'dennard',
              title: 'What happens when voltage stops scaling?',
              tag: 'Toy model, not from the paper'
            },
            {
              t: 'callout',
              kind: 'try',
              body: [
                '1. Choose **Voltage keeps scaling** and slide to 8 generations. Chip power stays at 1.0x while the transistor count grows about 300 times.',
                '2. Choose **Voltage stuck, clock keeps rising** and go to 4 generations. The chip would draw about 17 times its original power. Only about 6% of it could run in the original budget.',
                '3. Choose **Voltage stuck, clock held**. At 4 generations the power is about 4 times higher, and the clock has not improved at all. This is what chip makers actually did: they stopped raising the clock.'
              ]
            },
            {
              t: 'quiz',
              id: 'hor-q4',
              q: 'Voltage stops scaling, transistor counts keep doubling, and the cooling limit stays fixed. What are designers forced to do?',
              options: ['Run only part of the chip at once, or run it slower', 'Make the chip bigger', 'Raise the voltage', 'Nothing, the problem solves itself'],
              answer: 0,
              whyNot: [null, 'A bigger chip has even more transistors to power. It makes the power problem worse.', 'Raising voltage raises energy per switch with its square.', 'Without a change, power per chip doubles every generation until the chip cannot be cooled.'],
              explain: 'When power per transistor stops falling, you can switch only a fraction of the transistors at full speed. The field later gave this a name, {{dark-silicon|dark silicon}}.'
            },
            {
              t: 'callout',
              kind: 'paper',
              body: 'The paper tells this history. Scaling gave cheaper, faster and lower-power transistors until supply voltage stopped scaling, after which energy per operation improved much more slowly than transistor counts. (Our paraphrase.) **Reading task:** find the passage in the paper that says when voltage scaling slowed and note any voltage it gives.'
            }
          ]
        },
        {
          id: 'cv2',
          title: 'Why every switch costs energy',
          min: 5,
          blocks: [
            { t: 'p', text: 'Each time a wire or a transistor changes from 0 to 1, the power supply must fill it with electric charge. The energy of one {{switching-event|switching event}} is about **capacitance x voltage squared**. {{capacitance|Capacitance}} measures how much charge the wire holds. Long wires and large transistors hold more.' },
            { t: 'h', text: 'Two consequences you will use all course' },
            {
              t: 'list',
              ordered: true,
              items: [
                '**Voltage counts twice.** A 30% voltage drop (1.0 V to 0.7 V) cuts energy per switch to 0.49, about half.',
                '**Distance costs energy.** A signal that crosses the chip drives a longer wire, with more capacitance, than one that moves a few micrometers. A trace on the circuit board to a memory chip is longer still. So moving a value costs more than changing it. Part 2 puts numbers on this.'
              ]
            },
            {
              t: 'quiz',
              id: 'hor-q5',
              q: 'Voltage drops from 1.0 V to 0.7 V and the capacitance stays the same. By what factor does the energy of a switching event change?',
              options: ['0.7', '0.49', '0.3', 'It does not change'],
              answer: 1,
              whyNot: ['That treats energy as proportional to voltage. It is proportional to voltage **squared**.', null, 'That would be 0.7 cubed. Energy goes with the square, not the cube.', 'Energy depends directly on voltage squared, so it changes.'],
              explain: 'Energy is proportional to C x V squared. With C fixed, 0.7 squared is 0.49.'
            }
          ]
        }
      ]
    },

    /* ------------------------------ Part 2 ------------------------------ */
    {
      id: 'table',
      title: 'The energy table',
      summary: 'What an add, a multiply and a memory read cost, and what the ratios say.',
      steps: [
        {
          id: 'kitchen',
          title: 'The kitchen: why distance costs',
          min: 4,
          blocks: [
            {
              t: 'callout',
              kind: 'example',
              body: 'A cook chops an onion in three seconds when it is already in hand. If the onion sits on the counter, reaching for it adds a moment. If it is in the pantry, the cook walks over. If it is in a store across town, the cook drives twenty minutes. The chopping took the same time in all four cases. The trip is what changes the cost.'
            },
            { t: 'p', text: 'A chip has the same layers. The arithmetic unit is the cook. The values it works on can sit in a {{register-file|register file}} (hands), a small {{sram|SRAM}} (counter), a large SRAM (pantry), or off-chip {{dram|DRAM}} (the store). This is the {{memory-hierarchy|memory hierarchy}}.' },
            { t: 'figure', draw: kitchen, source: 'original', caption: 'The kitchen mapped to a chip. The energies are per 64-bit read from the paper\'s table (Step 2.2). The arrows run from the arithmetic unit outward, to places that hold more and cost more.', alt: 'Arithmetic unit, register file, 8 KB SRAM, 1 MB SRAM and DRAM in a row, with the energy of one read for the three memories.' },
            {
              t: 'table',
              head: ['Kitchen', 'Chip', 'Size', 'Cost to reach'],
              rows: [
                ['Hands', 'Register file', 'Hundreds of bytes', 'Lowest'],
                ['Counter', 'Small SRAM or cache', 'Kilobytes', 'Low'],
                ['Pantry', 'Large on-chip SRAM', 'Megabytes', 'Medium'],
                ['Store across town', 'Off-chip DRAM', 'Gigabytes', 'Highest']
              ],
              source: 'original',
              caption: 'The same four layers in both worlds. Bigger and farther always costs more.'
            },
            {
              t: 'quiz',
              id: 'hor-q6',
              q: 'In the kitchen picture, which place matches off-chip DRAM?',
              options: ['The cook\'s hands', 'The counter', 'The pantry', 'The store across town'],
              answer: 3,
              whyNot: ['Hands are the register file. They hold only what the cook is using right now.', 'The counter is a small on-chip SRAM, a few kilobytes.', 'The pantry is a large on-chip SRAM, a few megabytes. It is still on the chip.', null],
              explain: 'DRAM sits outside the processor chip, holds gigabytes, and is the most expensive place to read from, like a trip to the store.'
            }
          ]
        },
        {
          id: 'ladder',
          title: 'The energy table',
          min: 8,
          blocks: [
            {
              t: 'quiz',
              id: 'hor-q7',
              kind: 'predict',
              q: 'Make a guess before you look. One read of a 64-bit word from off-chip DRAM costs about as much energy as how many 32-bit integer adds?',
              options: ['About 10', 'About 100', 'About 1,000', 'More than 10,000'],
              answer: 3,
              whyNot: ['Far too few. Even a read from a small on-chip SRAM costs about 100 adds.', 'This is the cost of reading a small SRAM, not DRAM.', 'Closer, but DRAM is another factor of ten or more beyond that.', null],
              explain: 'The paper\'s table gives 1.3 to 2.6 nJ for the DRAM read and 0.1 pJ for the add. That is 13,000 to 26,000 adds. The read moves 64 bits and the add handles 32, but per bit the gap is still above 6,000.'
            },
            {
              t: 'widget',
              name: 'energyLadder',
              title: 'Energy per operation, 45 nm',
              tag: 'From the paper (check values marked with a dagger)',
              source: 'paper',
              opts: { base: 'add32' }
            },
            {
              t: 'callout',
              kind: 'try',
              body: [
                '1. Click **32-bit add**. How many times more does a 32-bit multiply cost? About 31 times.',
                '2. Click **8 KB SRAM**. Find the 32-bit float multiply row. It reads 0.37x, so a multiply costs only about a third of one small-memory read.',
                '3. Keep **8 KB SRAM** selected and read the ratio for the two DRAM rows. One DRAM read costs 130 to 260 small-memory reads.'
              ]
            },
            {
              t: 'callout',
              kind: 'paper',
              body: 'The paper gives energy numbers for integer and floating-point adds and multiplies at several widths, and for memory reads of different sizes, in a 45 nm manufacturing process. The message: arithmetic is cheap and memory access is not.'
            },
            {
              t: 'callout',
              kind: 'try',
              title: 'Reading task',
              body: 'Find the table in the paper. Check each value marked with a dagger in the widget, and write down the manufacturing process and supply voltage the paper states for the table.'
            }
          ]
        },
        {
          id: 'size',
          title: 'Bigger memories cost more per read',
          min: 5,
          blocks: [
            { t: 'p', text: 'Look at the three SRAM rows. An 8 KB memory costs 10 pJ per 64-bit read. A 32 KB memory costs about 20 pJ. A 1 MB memory costs 100 pJ. The memory grew 128 times (8 KB to 1 MB) while the energy grew 10 times. The square root of 128 is about 11, so the energy rises roughly with the **square root of the size**.' },
            { t: 'callout', kind: 'note', title: 'Our take', body: 'This is our reading, not a sentence from the paper. It fits the picture from Part 1: a memory of N cells is a square about the square root of N cells on a side, and a signal must cross a wire as long as that side. It predicts that a memory 4 times bigger costs about twice as much per read, which matches the 8 KB to 32 KB step.' },
            { t: 'p', text: 'The practical rule: **keep data in the smallest memory that holds it**, and reuse it there as many times as you can before it leaves. Almost every accelerator in this course is an application of that rule.' },
            {
              t: 'quiz',
              id: 'hor-q8',
              q: 'A 32-bit float multiply costs 3.7 pJ. Its two operands are 32-bit words read from an 8 KB SRAM at about 5 pJ each. What share of the energy is the multiply itself?',
              options: ['About 27%', 'About 90%', 'About 50%', 'About 5%'],
              answer: 0,
              whyNot: [null, 'That ignores the operand reads. They cost 10 pJ, more than twice the multiply.', 'That would need the reads to cost 3.7 pJ in total. They cost 10 pJ.', 'That would be true if the operands came from DRAM. From a small SRAM the multiply is a visible share.'],
              explain: 'Total = 3.7 + 5 + 5 = 13.7 pJ. The multiply is 3.7 / 13.7, about 27%. Even with the cheapest on-chip memory, fetching costs more than computing.'
            }
          ]
        },
        {
          id: 'bits',
          title: 'Bits matter: adds and multiplies scale differently',
          min: 6,
          blocks: [
            {
              t: 'callout',
              kind: 'example',
              body: 'Add two 8-digit numbers by hand and you do about 8 small additions. Multiply them and you form about 8 x 8 = 64 digit products and then add those up. Doubling the digits doubles the work of adding and quadruples the work of multiplying. Hardware works the same way, with bits in place of digits.'
            },
            { t: 'p', text: 'An adder has about one cell per bit, so its energy grows with the width. A multiplier forms one shifted copy of the number for each bit and adds them, so its energy grows with the width **squared**. Anchor both at the paper\'s 32-bit integer numbers (0.1 pJ and 3.1 pJ) and slide the width down.' },
            { t: 'widget', name: 'bitwidth', title: 'Energy against bit width', tag: 'Toy model, not from the paper' },
            {
              t: 'callout',
              kind: 'try',
              body: [
                '1. Slide to **8 bits**. The rule gives 0.025 pJ for the add and 0.19 pJ for the multiply. The paper\'s figure lists 0.03 and 0.2 pJ (marked with a dagger in the table), so the rule matches.',
                '2. Slide to **16 bits**. Multiply energy is 25% of the 32-bit value and memory traffic is 50%.',
                '3. Notice the third bar. Memory traffic falls only in proportion to the bits. Arithmetic energy falls faster, so lowering bits helps arithmetic more than it helps memory.'
              ]
            },
            {
              t: 'quiz',
              id: 'hor-q9',
              q: 'You change a network from 32-bit to 8-bit numbers. By the width rule, about how much less energy does each multiply use?',
              options: ['2 times less', '4 times less', '16 times less', 'No change'],
              answer: 2,
              whyNot: ['That is the saving for an add. A multiply grows with the square of the width.', 'Four times is the saving in memory traffic (32 bits down to 8 bits), not in the multiplier.', null, 'Narrower numbers need a smaller multiplier circuit, so the energy changes a lot.'],
              explain: 'The multiplier scales with bits squared: (32 / 8) squared is 16. The add scales with bits (4 times) and each stored value takes 4 times less memory traffic.'
            },
            {
              t: 'callout',
              kind: 'watch',
              body: 'Fewer bits can cost accuracy. A network trained with 32-bit numbers may need changes, or retraining, to work well at 8 bits. The energy saving is real. Whether the accuracy survives depends on the model. Paper 5 (the TPU) is a production example that uses 8-bit multiplies.'
            }
          ]
        }
      ]
    }
  ];
})();
