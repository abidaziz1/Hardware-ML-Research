/* Paper 6 lesson, parts 2 and 3: shrink the book, then the chip that reads it. */
(function () {
  'use strict';
  window.EIE = window.EIE || {};

  window.EIE.p2 = [
    /* ------------------------------ Part 2 ------------------------------ */
    {
      id: 'shrink',
      title: 'Shrink the book',
      summary: 'Prune, share, store: from 151 MB toward a few MB.',
      steps: [
        {
          id: 'prune',
          title: 'Cross out the pinches',
          min: 4,
          blocks: [
            { t: 'p', hook: true, text: 'Does a recipe really need 0.3 g of chili? Most amounts in the book are tiny.' },
            'Network weights are the same. Most sit close to zero. Set the smallest ones to zero and the layer changes only a little. This is {{pruning}}.',
            'There is a catch. Prune too much and the output drifts, so the network is {{retraining|retrained}} afterward. The widget does not retrain, so it shows the damage you would have to repair.',
            { t: 'widget', name: 'eiePrune', title: 'Cross out the smallest weights', tag: 'Toy model, not from the paper', source: 'toy' },
            { t: 'callout', kind: 'try', body: ['1. Cross out 50%. How much does the output change?', '2. Cross out 90%. How many weights are left?'] },
            { t: 'takeaway', text: 'Most weights are tiny. Cross them out, retrain, and the book is mostly empty.' },
            {
              t: 'reveal',
              tone: 'more',
              label: 'More detail: how far can real networks go?',
              body: ['Deep Compression reports 9 to 13 times fewer connections in AlexNet and VGG-16 after pruning and retraining. Your toy used random numbers, so its curve is only a picture of the idea.']
            }
          ]
        },
        {
          id: 'share',
          title: 'Round to a few measuring cups',
          min: 4,
          blocks: [
            { t: 'p', hook: true, text: 'Your recipes say 1.02 cups, 0.98 cups and 1.01 cups. Do you own a thousand different measuring cups?' },
            'No. You own a set of 16 and use the nearest one. The book stores which cup, not the exact amount.',
            'Networks do the same. All weights share a table of 16 values, and each weight stores a 4-bit code that points into it. That is {{weight-sharing|weight sharing}}.',
            { t: 'widget', name: 'eieCodebook', title: 'Round weights to a table', tag: 'Toy model, not from the paper', source: 'toy' },
            { t: 'callout', kind: 'try', body: ['1. Choose 4 bits. How large is the average error?', '2. Choose 1 bit. What happens? What is the smallest number of bits that keeps the error under 20%?'] },
            { t: 'takeaway', text: 'Store a 4-bit code instead of a 32-bit number, and each weight gets 8 times smaller.' },
            {
              t: 'reveal',
              tone: 'more',
              label: 'More detail: how is the table chosen?',
              body: ["A method called {{kmeans|k-means}} groups similar weights and uses each group's average as a table entry. The widget uses it too."]
            }
          ]
        },
        {
          id: 'store',
          title: 'Write down only what is left',
          min: 5,
          blocks: [
            { t: 'p', hook: true, text: 'A recipe book that is 90% blank is still thick if it keeps a blank line for every blank.' },
            'So write down only what is left. For each dish, list its ingredients, and beside each one note how many empty rows you skipped to reach it.',
            'Keep one list per dish, so a dish with no orders can be skipped whole.',
            'The note is a {{relative-index|skip count}}. The layout is called {{csc|compressed sparse column}} (CSC).',
            { t: 'widget', name: 'eieCSC', title: 'A sparse book, stored by column', tag: 'Our example, not from the paper', source: 'original' },
            { t: 'callout', kind: 'try', body: ['1. Click column 2. Which rows do its four entries land on?', '2. Click column 1. What do the pointers tell you?'] },
            {
              t: 'quiz',
              id: 'eie-decode',
              q: 'A different column stores skip counts 3, 0, 1, in order. Rows start at 0. Which rows hold its entries?',
              options: ['3, 0, 1', '3, 4, 6', '3, 3, 4', '4, 5, 7'],
              answer: 1,
              whyNot: ['Those are the skip counts themselves.', null, 'That is a running total of the skips. Each entry also takes up a row.', 'That counts rows from 1. Here they start at 0.'],
              explain: 'Start above the top at row -1. Add each skip and 1: -1 + 3 + 1 = 3, then 3 + 0 + 1 = 4, then 4 + 1 + 1 = 6.'
            },
            { t: 'takeaway', text: 'Each stored weight is a 4-bit code plus a 4-bit skip count, and one pointer per column says where its list starts.' },
            {
              t: 'reveal',
              tone: 'more',
              label: 'More detail: what if more than 15 rows are skipped?',
              body: ['Four bits can only count 0 to 15. A longer gap needs a trick, such as a filler entry that holds zero. The paper handles this case, so look for how when you read it.']
            }
          ]
        },
        {
          id: 'total',
          title: 'How small does the book get?',
          min: 4,
          blocks: [
            { t: 'p', hook: true, text: 'Multiply the savings: fewer entries, and fewer bits per entry.' },
            "AlexNet's three big layers hold 58.6 million weights. At 32 bits that is 235 MB. Keep 10% and store 8 bits per entry, and it shrinks to 5.9 MB.",
            'EIE has 64 cooks, and each holds about 131,000 entries. Together they hold 8.4 MB.',
            { t: 'widget', name: 'eieCompress', title: 'Does the book fit on the chip?', tag: 'Our arithmetic, chip size from the paper', source: 'original' },
            { t: 'callout', kind: 'try', body: ["1. What is the highest percent of AlexNet's weights you can keep and still fit?", '2. Switch to VGG-16. What must the percent be now?'] },
            {
              t: 'quiz',
              id: 'eie-size',
              q: 'A layer has 10 million weights. You keep 10% and store 8 bits per entry. About how big is the stored layer?',
              options: ['1 MB', '4 MB', '10 MB', '40 MB'],
              answer: 0,
              whyNot: [null, 'That counts 32 bits for each stored entry. EIE stores 8.', 'That keeps every weight at 8 bits and forgets the pruning.', 'That is the dense layer at 32 bits.'],
              explain: '10 million times 10% is 1 million entries. At 8 bits, which is 1 byte, each, that is 1 MB.'
            },
            { t: 'takeaway', text: 'Keep 10% of the weights at 8 bits each and a layer gets about 40 times smaller. That is small enough for on-chip memory.' },
            {
              t: 'reveal',
              tone: 'check',
              label: 'Check this against the paper',
              body: [
                "The paper's own results: AlexNet 240 MB to 6.9 MB (35 times) and VGG-16 552 MB to 11.3 MB (49 times). Those cover the whole network and include Huffman coding.",
                'Find the memory size of one PE in the paper, and how many weights it holds. Compare it with the 131,000 entries used here.'
              ]
            }
          ]
        }
      ]
    },

    /* ------------------------------ Part 3 ------------------------------ */
    {
      id: 'chip',
      title: 'The chip',
      summary: 'Skip empty orders, split the work among cooks, keep every cook busy.',
      steps: [
        {
          id: 'zeros',
          title: 'Skip the dishes nobody ordered',
          min: 4,
          blocks: [
            { t: 'p', hook: true, text: 'Nobody ordered the soup. Do you still read the soup recipe?' },
            'Of course not. In a network, many inputs are exactly zero. A step called {{relu|ReLU}} turns every negative number into 0, so after it many orders are 0.',
            "A zero order times any recipe amount is zero. You can skip that dish's whole column of the book.",
            { t: 'widget', name: 'eieZero', title: 'Skip the zero columns', tag: 'Toy model, not from the paper', source: 'toy' },
            { t: 'callout', kind: 'try', body: ['1. Press **Apply ReLU**. How many columns do you still read?', '2. Click numbers until every one is positive. What happens to the savings?'] },
            { t: 'takeaway', text: 'A zero input makes its whole column irrelevant, so the chip skips it. The paper counts this as a 3 times energy saving.' }
          ]
        },
        {
          id: 'split',
          title: 'Split the book among four cooks',
          min: 4,
          blocks: [
            { t: 'p', hook: true, text: 'One cook reading every column is slow. Hire four cooks and split the ingredient rows between them.' },
            'Cook 0 owns rows 0, 4, 8 and so on. Cook 1 owns rows 1, 5, 9. Every cook hears every order, but each updates only its own totals.',
            'The chip calls each cook a {{pe|processing element}} (PE). Dealing rows out like cards spreads the work around.',
            { t: 'widget', name: 'eiePeMap', title: 'Who owns which row?', tag: 'Our example, not from the paper', source: 'original' },
            { t: 'callout', kind: 'try', body: ['1. Click column 3. Which cook has the most entries?', '2. Click column 7. Is it the same cook?'] },
            { t: 'takeaway', text: 'Row i goes to cook i mod 4. Each cook keeps its own slice of every column.' }
          ]
        },
        {
          id: 'walk',
          title: 'Follow one order through the chip',
          min: 4,
          blocks: [
            { t: 'p', hook: true, text: 'Dish 3 just arrived with 5 orders. Follow it through one cook.' },
            {
              t: 'walk',
              alt: 'Six steps of one order moving through the central unit and one processing element',
              graph: {
                width: 800,
                height: 310,
                ariaLabel: 'Flow diagram: input vector, central unit, queue, pointer lookup, entry read, decode and multiply-add, totals, and back to the next layer',
                nodes: [
                  { id: 'inp', label: 'Input vector', sub: 'orders, many zero', cx: 90, cy: 55, w: 150, h: 54, kind: 'input' },
                  { id: 'ctl', label: 'Central unit', sub: 'finds the next non-zero order', cx: 330, cy: 55, w: 210, h: 54, kind: 'op' },
                  { id: 'q', label: 'Queue', sub: 'waiting orders', cx: 600, cy: 55, w: 150, h: 54, kind: 'queue' },
                  { id: 'ptr', label: 'Find the column', sub: 'start and end pointers', cx: 600, cy: 150, w: 180, h: 54, kind: 'op' },
                  { id: 'mat', label: 'Read the entries', sub: '4-bit code + skip count', cx: 600, cy: 245, w: 180, h: 54, kind: 'var' },
                  { id: 'alu', label: 'Decode, multiply, add', sub: 'uses the 16-value table', cx: 330, cy: 245, w: 210, h: 54, kind: 'op' },
                  { id: 'acc', label: 'Totals', sub: "this cook's rows", cx: 90, cy: 245, w: 150, h: 54, kind: 'var' }
                ],
                edges: [
                  { from: 'inp', to: 'ctl', path: 'M165,55 L225,55', label: 'scan', labelAt: [195, 41] },
                  { from: 'ctl', to: 'q', path: 'M435,55 L525,55', label: 'broadcast', labelAt: [480, 41] },
                  { from: 'q', to: 'ptr', path: 'M600,82 L600,123', label: 'dish 3', labelAt: [638, 104] },
                  { from: 'ptr', to: 'mat', path: 'M600,177 L600,218', label: 'range', labelAt: [638, 199] },
                  { from: 'mat', to: 'alu', path: 'M510,245 L435,245', label: 'entries', labelAt: [472, 231] },
                  { from: 'alu', to: 'acc', path: 'M225,245 L165,245', label: 'sums', labelAt: [195, 231] },
                  { from: 'acc', to: 'inp', path: 'M90,218 L90,82', label: 'ReLU, then next layer', labelAt: [170, 150] }
                ]
              },
              frames: [
                { caption: 'The central unit scans the input vector and skips the zeros. It stops at the first non-zero order: dish 3, quantity 5.', active: ['inp', 'ctl'], edges: { 'inp>ctl': 'active' } },
                { caption: 'It sends dish 3 and its quantity to every cook. Each cook keeps a short queue of waiting orders.', active: ['ctl', 'q'], done: ['inp'], edges: { 'inp>ctl': 'done', 'ctl>q': 'active' } },
                { caption: 'A cook takes the order from its queue and looks up where dish 3 starts and ends in its own slice of the book.', active: ['q', 'ptr'], done: ['inp', 'ctl'], edges: { 'inp>ctl': 'done', 'ctl>q': 'done', 'q>ptr': 'active' } },
                { caption: 'It reads those entries. Each one is a 4-bit code and a 4-bit skip count.', active: ['mat'], done: ['inp', 'ctl', 'q', 'ptr'], edges: { 'inp>ctl': 'done', 'ctl>q': 'done', 'q>ptr': 'done', 'ptr>mat': 'active' } },
                { caption: 'It looks the code up in the 16-value table, multiplies by 5, and adds the result to the total for the row the skip counts point to.', active: ['alu', 'acc'], done: ['inp', 'ctl', 'q', 'ptr', 'mat'], edges: { 'inp>ctl': 'done', 'ctl>q': 'done', 'q>ptr': 'done', 'ptr>mat': 'done', 'mat>alu': 'active', 'alu>acc': 'active' } },
                { caption: "After the last order, each total goes through ReLU. The results become the next layer's orders.", active: ['acc', 'inp'], done: ['ctl', 'q', 'ptr', 'mat', 'alu'], edges: { 'mat>alu': 'done', 'alu>acc': 'done', 'acc>inp': 'active' } }
              ]
            },
            { t: 'takeaway', text: 'Each cook does the same four things for every order: take it from the queue, find the column, read the entries, multiply and add.' },
            {
              t: 'reveal',
              tone: 'check',
              label: 'Check this against the paper',
              body: [
                'The paper names these units for each PE: an activation queue, a pointer read unit, a sparse matrix read unit, an arithmetic unit, and an activation read and write unit. A leading non-zero detector finds the next order to send.',
                'Compare our simplified diagram with the architecture section and note what we left out.'
              ]
            }
          ]
        },
        {
          id: 'race',
          title: 'Race the cooks',
          min: 6,
          blocks: [
            { t: 'p', hook: true, text: 'Dinner is ready when the slowest cook finishes. How do you keep the others from waiting?' },
            'Each dish gives each cook a different amount of work. Without a queue, the next order waits for the slowest cook. With a {{queue}}, fast cooks run ahead.',
            {
              t: 'quiz',
              id: 'eie-race',
              kind: 'predict',
              q: 'Four cooks share the work. Split perfectly, the race would take 51 cycles. With no queue, each order waits for the slowest cook. About how long will the race take?',
              options: ['51 cycles', 'About 60 cycles', 'About 75 cycles', 'About 100 cycles'],
              answer: 2,
              whyNot: ['That needs a perfect split. Each dish gives some cooks more work than others.', 'Too optimistic. Over 31 orders, waiting for the slowest cook adds up.', null, 'Too pessimistic. The cooks are busy about two thirds of the time here, not half.'],
              explain: 'The widget below takes 76 cycles at depth 1. The cooks are busy 67% of the time.'
            },
            { t: 'widget', name: 'eieSim', title: 'Race the cooks', tag: 'Toy model, not the paper\'s simulator', source: 'toy' },
            {
              t: 'callout',
              kind: 'try',
              body: ['1. With 4 cooks and depth 1, press **Run to the end**. Note the cycles.', '2. Reset, choose depth 8, and run again. How many cycles did the queue save?', '3. Try 8 cooks at depth 1. Are the cooks busier or less busy?']
            },
            { t: 'takeaway', text: 'The slowest cook sets the pace. A queue lets the others run ahead.' }
          ]
        },
        {
          id: 'queue-why',
          title: 'Questions about the queue',
          min: 3,
          blocks: [
            { t: 'p', hook: true, text: 'Your race showed that a queue helps. Here are the questions you are probably asking.' },
            {
              t: 'chat',
              turns: [
                {
                  q: 'Why not give every cook a huge queue?',
                  a: 'The gains flatten out. In your race, depth 4 saved 14 of the 18 cycles that depth 8 saved. The paper reports the same shape: depth 1 left about half the cycles idle, and it chose depth 8. A deeper queue costs chip area for little return.'
                },
                {
                  q: 'Does a queue fix everything?',
                  a: 'No. A queue smooths out the ups and downs, but if one cook simply has more total work, no queue can fix that. In your race the busiest cook had 57 entries to cook while the average was 51. Add one cycle for the first order to arrive, and nothing could finish before cycle 58.'
                },
                {
                  q: 'Why did 8 cooks do worse at depth 1?',
                  a: 'More cooks means more chances that one of them draws a heavy dish, and the next order waits for the slowest. The real chip has 64 cooks, so this matters even more there.'
                }
              ],
              after: [
                { t: 'takeaway', text: 'Queues recover most of the idle time. Beyond a few entries they add little, and they cannot fix a cook who has too much total work.' },
                {
                  t: 'reveal',
                  tone: 'check',
                  label: 'Check this against the paper',
                  body: [
                    "The depth-1 and depth-8 figures come from a search summary of the paper's design discussion. Find the queue-depth experiment and note what it measured, how many PEs it used, and which benchmark balanced worst.",
                    'Our toy shows the same direction, with smaller numbers because it has 4 cooks and a small book. We did not tune it to match.'
                  ]
                }
              ]
            }
          ]
        },
        {
          id: 'energy',
          title: 'Where the savings come from',
          min: 5,
          blocks: [
            { t: 'p', hook: true, text: "The abstract lists four savings: 120, 10, 8 and 3 times. Can you rebuild them from Paper 1's numbers?" },
            'Start with a dense book in DRAM. Each row below removes one kind of waste. The dashed line marks the energy of the math itself.',
            { t: 'widget', name: 'eieEnergy', title: 'Rebuild the four savings', tag: 'Toy model from Paper 1 numbers', source: 'toy' },
            {
              t: 'callout',
              kind: 'try',
              body: ["1. Compare the second bar with the paper's 120 times.", '2. Set the skip-count bits to 0. The sharing step now gives 8 times, as in the abstract. What do the skip counts cost you?', '3. At the end, is reading a weight cheaper than the math on it?']
            },
            { t: 'takeaway', text: 'Each trick removes one kind of waste, and together they multiply. After all four, reading a weight costs less than the math on it.' },
            {
              t: 'reveal',
              tone: 'check',
              label: 'Check this against the paper',
              body: [
                "The widget uses 5 pJ for an on-chip read. EIE's memory blocks are bigger than the 8 KB one in Paper 1, and bigger blocks cost more per read, so the real saving is smaller than 130 times.",
                "The abstract's four numbers multiply to 28,800. The paper does not claim that total. Its measured results are 24,000 times and 3,400 times against a CPU and a GPU. Read how those were measured before you compare them with a product of four factors.",
                'Find how the paper counts the 4-bit skip counts. A 4-bit code alone gives the abstract\'s 8 times. Code plus skip is 8 bits, which gives 4 times.'
              ]
            }
          ]
        }
      ]
    }
  ];
})();
