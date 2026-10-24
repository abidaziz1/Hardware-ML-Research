/* Paper 6 lesson, parts 0 and 1: start, and the problem (a kitchen, a recipe book, a cost). */
(function () {
  'use strict';
  window.EIE = window.EIE || {};

  window.EIE.p1 = [
    /* ------------------------------ Part 0 ------------------------------ */
    {
      id: 'start',
      title: 'Start here',
      summary: 'What this paper does, in one minute.',
      steps: [
        {
          id: 'welcome',
          title: 'Paper 6 in one minute',
          min: 2,
          blocks: [
            { t: 'p', hook: true, text: 'What if a chip could skip every number that does not matter?' },
            'That is EIE, a 2016 chip design from Song Han and co-authors, including Mark Horowitz, whose energy numbers you met in Paper 1.',
            'You will cook for a restaurant, shrink its recipe book, and race four cooks. Then you will see why the chip is fast and uses so little energy.',
            { t: 'takeaway', text: 'EIE keeps a shrunken, mostly empty network on the chip and touches only the numbers that matter.' },
            {
              t: 'reveal',
              tone: 'more',
              label: 'Paper details',
              body: [
                {
                  t: 'facts',
                  rows: [
                    ['Paper', 'EIE: Efficient Inference Engine on Compressed Deep Neural Network'],
                    ['Authors', 'Song Han, Xingyu Liu, Huizi Mao, Jing Pu, Ardavan Pedram, Mark A. Horowitz, William J. Dally'],
                    ['Venue', 'ISCA 2016'],
                    ['Read the original', '[arXiv 1602.01528](https://arxiv.org/abs/1602.01528)'],
                    ['Time', 'About 85 minutes for the lesson, plus 30 minutes for the practice problems.'],
                    ['Before you start', 'Papers 1 and 3 help. You need one number from Paper 1, and the lesson repeats it.']
                  ]
                }
              ]
            },
            {
              t: 'reveal',
              tone: 'more',
              label: 'How this lesson works',
              body: [
                'Press **Next** or the right arrow key. **Back** or the left arrow goes back. Words with a dotted underline open a short definition.',
                'A box labeled **Try it** tells you what to do in the widget above it. Collapsed boxes hold extra detail and notes on what to check in the paper. Practice problems with hidden solutions come last. Your place is saved in this browser.',
                'Study in sessions of about 20 minutes, which is 4 or 5 steps. When a question asks you to guess, say your answer out loud before you click. At the end of a session, say each takeaway without looking.'
              ]
            },
            { t: 'reveal', tone: 'more', label: 'Jump to a part', body: [{ t: 'partmap', skipFirst: true }] }
          ]
        }
      ]
    },

    /* ------------------------------ Part 1 ------------------------------ */
    {
      id: 'problem',
      title: 'The problem',
      summary: 'A kitchen, a recipe book, and a cost nobody counts.',
      steps: [
        {
          id: 'kitchen',
          title: "Cook for tonight's orders",
          min: 4,
          blocks: [
            { t: 'p', hook: true, text: 'Tonight guests ordered 3 pizzas, 2 pastas, no soup and 4 salads. How much flour, cheese and tomato do you pull out?' },
            'Each recipe lists grams per serving. For each ingredient, multiply the grams by the orders and add them up.',
            { t: 'widget', name: 'eieKitchen', title: 'The kitchen', tag: 'Our example, not from the paper', source: 'original' },
            { t: 'callout', kind: 'try', body: ['1. Click **Tomato** and read the sum.', '2. Set the soup orders to 2. Which total changes, and by how much?'] },
            { t: 'takeaway', text: 'Multiply each recipe amount by its order count and add. A table times a list like this is called a matrix times a vector.' }
          ]
        },
        {
          id: 'layer',
          title: 'A neural network layer is this kitchen',
          min: 4,
          blocks: [
            { t: 'p', hook: true, text: 'Rename the pieces and the kitchen becomes one layer of a neural network.' },
            {
              t: 'facts',
              rows: [
                ['Recipe book', 'the weights: numbers the network learned'],
                ['Orders', 'the inputs, also called activations'],
                ['Ingredient totals', 'the outputs']
              ]
            },
            'A layer where every input feeds every output is {{fc-layer|fully connected}}. Real ones are huge. Pick one from AlexNet or VGG-16, two well-known networks that recognize images.',
            { t: 'widget', name: 'eieLayers', title: 'Recipe books of real networks', tag: 'Standard layer shapes, our arithmetic', source: 'original' },
            { t: 'callout', kind: 'try', body: ['1. Choose AlexNet FC6. How many weights does its book hold?', '2. Choose VGG-16 FC6. How many times bigger is that book?'] },
            { t: 'takeaway', text: 'A fully connected layer is a huge recipe book, and one input uses every entry once.' }
          ]
        },
        {
          id: 'cost',
          title: 'Reading the book costs more than cooking',
          min: 5,
          blocks: [
            { t: 'p', hook: true, text: 'Looking up an amount costs more than using it.' },
            'Your book is too big for the counter, so it sits in a warehouse across town. Paper 1 measured the chip version of that trip.',
            {
              t: 'quiz',
              id: 'eie-cost',
              kind: 'predict',
              q: 'Reading one 32-bit weight from {{dram|DRAM}}, the big memory outside the chip, costs about 650 picojoules (pJ). Multiplying it costs 3.7 pJ and adding costs 0.9 pJ. About how many times more does the read cost than the math?',
              options: ['About the same', 'About 10 times', 'About 100 times', 'About 1,000 times'],
              answer: 2,
              whyNot: ['The read is far more expensive. DRAM sits outside the chip, and signals travel a long way.', 'Too small. 650 pJ against 4.6 pJ is a much bigger gap than that.', null, 'Too big. 650 divided by 4.6 is about 141.'],
              explain: '650 divided by 4.6 is about 141. The EIE abstract calls this gap two orders of magnitude.'
            },
            'Batching means running many inputs together so they share each read. A phone camera or a car cannot wait for 100 pictures, though. The widget also shows a read from {{sram|SRAM}}, the small, fast memory on the chip.',
            { t: 'widget', name: 'eieCost', title: 'Energy of one multiply-add', tag: 'Toy model from Paper 1 numbers', source: 'toy' },
            { t: 'callout', kind: 'try', body: ['1. At batch size 1, what does one multiply-add cost with the weights in DRAM, and with the weights in SRAM?', '2. Raise the batch size. At which size does the math cost more than the DRAM read?'] },
            { t: 'takeaway', text: 'At batch size 1 the read costs 141 times the math. To save energy, stop reading from DRAM.' },
            {
              t: 'reveal',
              tone: 'check',
              label: 'Check these numbers',
              body: [
                "650 pJ is half of Paper 1's 1.3 nJ for a 64-bit DRAM read, the low end of its range, because a 32-bit word is half as wide. 5 pJ is half of 10 pJ for a 64-bit read from an 8 KB SRAM. The 0.9 pJ add comes from memory of Paper 1's figure.",
                'The EIE abstract says a DRAM read costs about two orders of magnitude more than an ALU operation. Our 141 times agrees with that.',
                'The paper targets one input at a time. Find the batch size behind each number in its evaluation section.'
              ]
            }
          ]
        },
        {
          id: 'plan',
          title: 'The plan: shrink the book, skip the zeros',
          min: 4,
          blocks: [
            { t: 'p', hook: true, text: 'If reading the book is the cost, make the book small enough to keep on the counter.' },
            'Two ideas do that. First, shrink the book until it fits in on-chip memory. Second, while cooking, skip anything that is zero. Click through the plan.',
            {
              t: 'walk',
              alt: 'A five-step plan: the dense book, pruning, sharing values, compact storage, and running on the EIE chip while skipping zero orders',
              graph: {
                width: 800,
                height: 290,
                ariaLabel: 'Flow diagram of the plan: dense book to pruned book to shared values to compact book to the chip, with a separate path for zero orders',
                nodes: [
                  { id: 'dense', label: 'Dense book', sub: '151 MB in DRAM', cx: 100, cy: 70, w: 160, h: 56, kind: 'var' },
                  { id: 'pruned', label: 'Pruned', sub: 'tiny amounts crossed out', cx: 300, cy: 70, w: 160, h: 56, kind: 'op' },
                  { id: 'shared', label: 'Shared values', sub: '4-bit codes', cx: 500, cy: 70, w: 160, h: 56, kind: 'op' },
                  { id: 'compact', label: 'Compact book', sub: 'fits on the chip', cx: 700, cy: 70, w: 160, h: 56, kind: 'queue' },
                  { id: 'orders', label: 'Orders', sub: 'many are zero', cx: 300, cy: 220, w: 160, h: 56, kind: 'input' },
                  { id: 'skip', label: 'Skip zeros', sub: 'at run time', cx: 500, cy: 220, w: 160, h: 56, kind: 'op' },
                  { id: 'chip', label: 'EIE chip', sub: 'reads only what it needs', cx: 700, cy: 220, w: 160, h: 56, kind: 'device' }
                ],
                edges: [
                  { from: 'dense', to: 'pruned', path: 'M180,70 L220,70', label: 'prune', labelAt: [200, 56] },
                  { from: 'pruned', to: 'shared', path: 'M380,70 L420,70', label: 'share', labelAt: [400, 56] },
                  { from: 'shared', to: 'compact', path: 'M580,70 L620,70', label: 'store', labelAt: [600, 56] },
                  { from: 'compact', to: 'chip', path: 'M700,98 L700,192' },
                  { from: 'orders', to: 'skip', path: 'M380,220 L420,220' },
                  { from: 'skip', to: 'chip', path: 'M580,220 L620,220' }
                ]
              },
              frames: [
                { caption: 'You start with the full recipe book. All 151 MB sit in DRAM, so every entry costs a trip.', active: ['dense'] },
                { caption: '**Prune.** Cross out the tiny amounts. The Deep Compression paper reports 9 to 13 times fewer entries in AlexNet and VGG-16.', active: ['pruned'], done: ['dense'], edges: { 'dense>pruned': 'done' } },
                { caption: '**Share.** Replace each exact amount with a 4-bit code that points into a table of 16 values.', active: ['shared'], done: ['dense', 'pruned'], edges: { 'dense>pruned': 'done', 'pruned>shared': 'done' } },
                { caption: '**Store.** Keep only the entries that are left, in a compact list. Now the book fits in on-chip memory.', active: ['compact'], done: ['dense', 'pruned', 'shared'], edges: { 'dense>pruned': 'done', 'pruned>shared': 'done', 'shared>compact': 'done' } },
                { caption: '**Run.** Orders arrive. The chip skips every zero order and reads only the entries it needs. This is EIE.', active: ['orders', 'skip', 'chip'], done: ['dense', 'pruned', 'shared', 'compact'], edges: { 'dense>pruned': 'done', 'pruned>shared': 'done', 'shared>compact': 'done', 'compact>chip': 'active', 'orders>skip': 'active', 'skip>chip': 'active' } }
              ]
            },
            { t: 'takeaway', text: 'Shrink the weights until they fit on the chip, then skip every zero while running.' },
            {
              t: 'reveal',
              tone: 'more',
              label: 'More detail: who did what, and what about accuracy',
              body: [
                'The shrinking comes from a companion paper, {{deep-compression|Deep Compression}}, by Han, Mao and Dally. EIE is the chip built to run a network shrunk that way.',
                "Does shrinking hurt accuracy? It would if you stopped there. The network is {{retraining|retrained}} after pruning to win the accuracy back. How well that works is the Deep Compression paper's story."
              ]
            }
          ]
        }
      ]
    }
  ];
})();
