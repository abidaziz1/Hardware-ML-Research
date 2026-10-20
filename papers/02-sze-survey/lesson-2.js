/* Paper 2 lesson, parts 3 to 5: data movement and dataflows, co-design, metrics. */
(function () {
  'use strict';
  var MLS = window.MLS;
  window.SZE = window.SZE || {};

  /* ---------- Figures ---------- */
  function temporal(host) {
    MLS.graph(host, {
      width: 780,
      height: 250,
      ariaLabel: 'A temporal architecture: one control unit, several arithmetic units, and a shared memory hierarchy. The arithmetic units do not connect to each other.',
      nodes: [
        { id: 'ctl', label: 'Central control', sub: 'one instruction stream', cx: 390, cy: 40, w: 200, h: 52, kind: 'queue' },
        { id: 'a1', label: 'ALU', cx: 150, cy: 130, w: 110, h: 46, kind: 'op' },
        { id: 'a2', label: 'ALU', cx: 390, cy: 130, w: 110, h: 46, kind: 'op' },
        { id: 'a3', label: 'ALU', cx: 630, cy: 130, w: 110, h: 46, kind: 'op' },
        { id: 'mem', label: 'Memory hierarchy', sub: 'registers, caches, DRAM', cx: 390, cy: 215, w: 240, h: 52, kind: 'io' }
      ],
      edges: [
        { from: 'ctl', to: 'a1' },
        { from: 'ctl', to: 'a2' },
        { from: 'ctl', to: 'a3' },
        { from: 'a1', to: 'mem' },
        { from: 'a2', to: 'mem' },
        { from: 'a3', to: 'mem' }
      ]
    });
  }

  function spatial(host) {
    MLS.graph(host, {
      width: 780,
      height: 320,
      ariaLabel: 'A spatial architecture. DRAM feeds a global buffer, which feeds an array of processing elements. Neighboring elements pass data directly. Each access is labeled with its relative energy.',
      nodes: [
        { id: 'dram', label: 'DRAM', sub: 'off chip', cx: 390, cy: 40, w: 150, h: 50, kind: 'io' },
        { id: 'gb', label: 'Global buffer', sub: 'on-chip SRAM', cx: 390, cy: 130, w: 190, h: 50, kind: 'var' },
        { id: 'p1', label: 'PE', sub: 'MAC + register file', cx: 150, cy: 255, w: 160, h: 56, kind: 'op' },
        { id: 'p2', label: 'PE', sub: 'MAC + register file', cx: 390, cy: 255, w: 160, h: 56, kind: 'op' },
        { id: 'p3', label: 'PE', sub: 'MAC + register file', cx: 630, cy: 255, w: 160, h: 56, kind: 'op' }
      ],
      edges: [
        { from: 'dram', to: 'gb', label: '200x per access', labelAt: [500, 85] },
        { from: 'gb', to: 'p1' },
        { from: 'gb', to: 'p2', label: '6x per access', labelAt: [450, 195] },
        { from: 'gb', to: 'p3' },
        { from: 'p1', to: 'p2', label: '2x', labelAt: [270, 240] },
        { from: 'p2', to: 'p3', label: '2x', labelAt: [510, 240] }
      ]
    });
  }
  window.SZE.figTemporal = temporal;
  window.SZE.figSpatial = spatial;

  window.SZE.p2 = [
    /* ------------------------------ Part 3 ------------------------------ */
    {
      id: 'movement',
      title: 'Data movement is the cost',
      summary: 'Four accesses per MAC, three kinds of reuse, spatial architectures, and the four dataflows.',
      steps: [
        {
          id: 'four-accesses',
          title: 'Four memory accesses per MAC',
          min: 7,
          blocks: [
            {
              t: 'callout',
              kind: 'example',
              body: 'Each chop of the cook\'s knife needs three things fetched: the onion to cut, the recipe step to follow, and the bowl holding the running total. After the chop, the bowl goes back with a bit more in it. That is three fetches and one put-back for every single chop.'
            },
            { t: 'p', text: 'A MAC reads a {{weight}}, reads an input value, reads the current {{psum|partial sum}}, and writes the updated partial sum. That is **three reads and one write, four accesses per MAC**. If every access went to {{dram|DRAM}} (the worst case), AlexNet\'s 724 million MACs would make about 4 x 724 = **2,896 million** DRAM accesses.' },
            { t: 'p', text: 'How much is an access worth? The survey, using the cost ratios from the Eyeriss analysis (Paper 4), prices each access relative to one MAC. Try the mixes below.' },
            {
              t: 'widget',
              name: 'hierEnergy',
              title: 'Energy per MAC across the memory hierarchy',
              tag: 'Paper\'s cost ratios, our access mixes',
              source: 'original',
              opts: {}
            },
            {
              t: 'callout',
              kind: 'try',
              body: [
                '1. **No reuse: all 4 from DRAM.** The energy per MAC is 801 times the MAC itself (1 + 4 x 200). Nearly all of it is DRAM.',
                '2. **Buffer in the middle.** Four accesses at the 6x global buffer plus a tenth of an access at DRAM gives 45. An 18-fold cut, without touching the arithmetic.',
                '3. **Mostly local.** Most accesses hit the cheap register file, and the total falls to about 7.7. The multiplier now matters again.'
              ]
            },
            {
              t: 'callout',
              kind: 'paper',
              body: 'The survey shows the energy of data movement at each level of the hierarchy relative to a MAC: roughly 1x for a register file, 2x for a neighboring processing element, 6x for the global buffer and 200x for DRAM (figures from the Eyeriss analysis, Paper 4). **Reading task:** find the figure, note which manufacturing process and data width it assumes, and compare the 200x with the ratio you get from Paper 1\'s table (about 650 pJ against 4.6 pJ, roughly 140x for 32-bit values in 45 nm). Ratios in the same range, different processes.'
            },
            {
              t: 'quiz',
              id: 'sze-q10',
              q: 'Counting 3 reads and 1 write for every MAC, how many memory accesses does AlexNet make in the worst case, using 724 million MACs?',
              options: ['About 724 million', 'About 2.9 billion', 'About 61 million', 'About 15.5 billion'],
              answer: 1,
              whyNot: ['That counts one access per MAC. Each MAC needs four.', null, 'That is the number of weights. Each weight is used many times.', 'That is VGG-16\'s MAC count, a different network.'],
              explain: '4 accesses x 724 million MACs = 2,896 million, about 2.9 billion, when nothing is reused.'
            },
            {
              t: 'quiz',
              id: 'sze-q11',
              q: 'In the widget, the mix "No reuse" costs 801 and "Buffer in the middle" costs 45. Which change of the data caused most of the saving?',
              options: ['Moving accesses from DRAM (200x) to the global buffer (6x)', 'Making the MAC cheaper', 'Using fewer bits', 'Adding more PEs'],
              answer: 0,
              whyNot: [null, 'The MAC stays at 1 in both mixes. Only the access mix changed.', 'The widget does not change bit width.', 'The widget has no PE count. Only where accesses happen changed.'],
              explain: 'Moving four accesses from a 200x level to a 6x level cut about 800 units to about 24 units.'
            }
          ]
        },
        {
          id: 'reuse',
          title: 'Three kinds of reuse',
          min: 8,
          blocks: [
            {
              t: 'callout',
              kind: 'example',
              body: 'A printed recipe card is used for every dish in a batch (the card is a **weight** reused across the batch). A pile of chopped onions goes into several different dishes (an **input value** reused across filters). And one stew pot may hold overlapping portions, so the same carrot appears in two neighboring portions (an input reused across **overlapping windows**).'
            },
            { t: 'p', text: 'The survey names the reuse available in a CNN. The first is {{convolutional-reuse|convolutional reuse}}: inside one convolution, each weight is applied at every window position, and each input value is seen by every window that overlaps it. The second is {{fmap-reuse|input feature map reuse}}: the same input values feed all **M** filters. The third is {{filter-reuse|filter reuse}}: the same weights serve every input in a **batch**.' },
            {
              t: 'table',
              head: ['Kind of reuse', 'What is reused', 'How many times'],
              rows: [
                ['Convolutional (weights)', 'Each weight, at every window of one image', 'E x F'],
                ['Convolutional and feature map (inputs)', 'Each input value, by overlapping windows and by every filter', 'About M x R x S / U squared'],
                ['Filter (weights)', 'Each weight, across a batch', 'N'],
                ['Not reuse: accumulation', 'Each output is the sum of this many products', 'C x R x S']
              ],
              source: 'original',
              caption: 'The survey names the reuse types. The counts are our arithmetic from the loop nest in Step 1.2. Combined, a weight is used N x E x F times.'
            },
            { t: 'p', text: 'The calculator from Part 1 shows these counts in its second row. Read them for two layers.' },
            { t: 'widget', name: 'convShape', title: 'Reuse counts for a layer', tag: 'Original calculator, real layer shapes', source: 'original', opts: { start: 'alex1' } },
            {
              t: 'callout',
              kind: 'try',
              body: [
                '1. **AlexNet CONV1** (the starting preset): every weight is used **3,025** times (55 x 55 positions), and an input value is used about **726** times (96 filters x 121 weights / 16). Each output is a sum of 363 products (3 x 11 x 11).',
                '2. The last box says each value moved once would give **220 MACs per value** moved. That is the most reuse the layer could possibly give.',
                '3. Switch to **AlexNet CONV3**. Weights are now used only 169 times, but each input value about 3,456 times. Different layers have different reuse, so no single plan wins everywhere.',
                '4. Set the batch **N to 16** on CONV3. Each weight now serves 2,704 uses. Filter reuse appears.'
              ]
            },
            {
              t: 'quiz',
              id: 'sze-q12',
              q: 'Which kind of reuse exists only when the batch size is greater than one?',
              options: ['Filter reuse', 'Convolutional reuse', 'Input feature map reuse', 'All three'],
              answer: 0,
              whyNot: [null, 'Convolutional reuse happens inside one image, so it exists at batch 1.', 'The same input values feed all M filters, even for one image.', 'Only filter reuse needs more than one input.'],
              explain: 'Filter reuse means the same weights serve several inputs, so it needs a batch. The other two exist for a single image.'
            },
            {
              t: 'quiz',
              id: 'sze-q13',
              q: 'A CONV layer has an output of 13 x 13 per filter. With batch 8, how many times is each weight used?',
              options: ['169', '1,352', '8', '13'],
              answer: 1,
              whyNot: ['That is for batch 1 (13 x 13). Multiply by the batch.', null, 'That is only the filter reuse across the batch. Add the reuse inside each image.', 'That is just the output width.'],
              explain: 'N x E x F = 8 x 13 x 13 = 1,352 uses per weight.'
            }
          ]
        },
        {
          id: 'spatial',
          title: 'Spatial architectures',
          min: 6,
          blocks: [
            {
              t: 'callout',
              kind: 'example',
              body: 'Compare two factories. In one, every worker walks to the central warehouse for each part and carries each finished piece back. In the other, workers stand along a conveyor and hand work to the neighbor. Each worker keeps a small tray of parts. The second factory makes far fewer warehouse trips.'
            },
            { t: 'p', text: 'Last step\'s CPU and GPU look like the first factory. A {{spatial-architecture|spatial architecture}} looks like the second. It is a grid of {{pe|processing elements (PEs)}}, each with a MAC unit and a small {{register-file|register file}}, connected so neighbors pass data directly. A shared {{global-buffer|global buffer}} sits between the grid and {{dram|DRAM}}. The survey calls this dataflow processing, and most dedicated accelerators use it.' },
            { t: 'figure', draw: window.SZE.figTemporal, source: 'original', caption: 'Temporal: arithmetic units reach data only through the memory hierarchy.', alt: 'Central control above three ALUs, each connected to a memory hierarchy below.' },
            { t: 'figure', draw: window.SZE.figSpatial, source: 'original', caption: 'Spatial: four levels of storage. The cost per access (relative to one MAC) is 1x in a PE\'s own register file, 2x for a neighbor, 6x for the global buffer and 200x for DRAM.', alt: 'DRAM feeding a global buffer, which feeds three processing elements that also connect to their neighbors.' },
            { t: 'p', text: 'A spatial design gives the compiler or designer four places to keep data and a way to move it sideways. The design question becomes: **which data lives at which level, for how long?** That question is called the dataflow.' },
            {
              t: 'quiz',
              id: 'sze-q14',
              q: 'What can a PE in a spatial array do that an ALU in a CPU cannot?',
              options: ['Pass data directly to a neighboring PE', 'Do arithmetic', 'Read from DRAM', 'Run at a clock speed'],
              answer: 0,
              whyNot: [null, 'Both do arithmetic.', 'Both can get data that came from DRAM.', 'Clock speed is not the difference.'],
              explain: 'Direct PE-to-PE links cost about 2x a MAC, far below the 6x of the buffer or 200x of DRAM, so passing data sideways is cheap.'
            }
          ]
        },
        {
          id: 'dataflows',
          title: 'A first look at dataflows',
          min: 8,
          blocks: [
            { t: 'p', text: 'A {{dataflow}} says which data stays in place in the PEs and which data moves. The survey presents four families, taken from the Eyeriss analysis (Paper 4 compares them with measured energy). Learn the vocabulary here. Click each card.' },
            {
              t: 'flip',
              hint: 'Click to see what stays and what moves',
              cards: [
                { front: 'Weight stationary (WS)', back: 'Keeps each weight in a PE\'s register file. Inputs stream past and partial sums move along. Maximizes weight reuse. Partial sums travel a lot.' },
                { front: 'Output stationary (OS)', back: 'Keeps each partial sum in a PE until the output value is finished. Weights and inputs stream by. Minimizes the movement of partial sums, which are the costliest because they are both read and written.' },
                { front: 'No local reuse (NLR)', back: 'No register file in the PEs. All data comes from the global buffer, which gets a big share of the on-chip memory area. Simple PEs, many buffer accesses.' },
                { front: 'Row stationary (RS)', back: 'Each PE keeps one row of a filter and one row of the input, and produces a row of partial sums. All three data types get reuse at once. Paper 4 explains how.' }
              ]
            },
            {
              t: 'table',
              head: ['Dataflow', 'Stays in the PE', 'Moves', 'Strength', 'Weak point'],
              rows: [
                ['Weight stationary', 'Weights', 'Inputs and partial sums', 'Weights reused many times', 'Partial sums and inputs travel'],
                ['Output stationary', 'Partial sums', 'Weights and inputs', 'Partial sums stay put', 'Weights and inputs travel'],
                ['No local reuse', 'Nothing', 'Everything, via the global buffer', 'Simple PEs', 'Many buffer accesses'],
                ['Row stationary', 'A row of weights, a row of inputs', 'Partial sums between rows', 'Balances all three types', 'Complex mapping']
              ],
              source: 'original',
              caption: 'Our summary table of the four dataflows. Paper 4 gives the details and the measured comparison.'
            },
            {
              t: 'callout',
              kind: 'paper',
              body: 'The survey names these dataflows and notes that real accelerators fit them: for example, a weight stationary design keeps filter weights near the arithmetic. It also stresses that dataflow is mostly about the loop order and how loops are split across the array. (Our paraphrase. **Reading task:** note which accelerators the survey lists under each dataflow. Paper 5 will let you check which one the TPU uses.)'
            },
            {
              t: 'quiz',
              id: 'sze-q15',
              q: 'A design preloads each weight into a PE\'s register file and streams inputs past it, with partial sums moving along the array. Which dataflow is this?',
              options: ['Weight stationary', 'Output stationary', 'No local reuse', 'Row stationary'],
              answer: 0,
              whyNot: [null, 'Output stationary would keep partial sums in place and stream weights.', 'NLR has no register file to hold anything.', 'Row stationary keeps a row of weights and a row of inputs.'],
              explain: 'The weight is the stationary data, so it is weight stationary.'
            },
            {
              t: 'quiz',
              id: 'sze-q16',
              q: 'Why might an output stationary design save energy compared with a weight stationary design?',
              options: ['Partial sums never travel to a larger memory until they are finished', 'Weights become free', 'It needs no register file', 'It removes the MAC'],
              answer: 0,
              whyNot: [null, 'Weights still have to be delivered to the PEs.', 'It uses a register file to hold the partial sum.', 'The MAC is the computation and still happens.'],
              explain: 'A partial sum is both read and written, so each trip counts double. Keeping it local until the output is finished avoids most of those trips.'
            }
          ]
        }
      ]
    },

    /* ------------------------------ Part 4 ------------------------------ */
    {
      id: 'codesign',
      title: 'Co-design: change the network too',
      summary: 'Fewer bits, zeros, compact layers, and why MAC counts mislead.',
      steps: [
        {
          id: 'bits',
          title: 'Fewer bits per number',
          min: 5,
          blocks: [
            {
              t: 'callout',
              kind: 'example',
              body: 'To estimate a grocery bill quickly, round every price to the nearest dollar. The total is a little off, and the arithmetic is much easier. If the rounding is good enough for the decision, you saved effort for free.'
            },
            { t: 'p', text: 'Paper 1 showed that a multiplier\'s energy scales with the bits squared and that memory traffic scales with the bits. So replacing 32-bit floats with 16-bit or 8-bit numbers ({{quantization}}) cuts both. The survey covers fixed-point formats, nonuniform schemes, and even binary and ternary networks, where a multiply becomes a simple logic operation.' },
            {
              t: 'table',
              head: ['Format', 'Bytes per value', 'Multiplier energy (bits squared rule)', 'Memory traffic'],
              rows: [
                ['32-bit float', '4', '1 (baseline)', '1 (baseline)'],
                ['16-bit', '2', 'About 1/4', '1/2'],
                ['8-bit', '1', 'About 1/16', '1/4'],
                ['1-bit (binary)', '1/8', 'A logic gate instead of a multiplier', '1/32']
              ],
              source: 'original',
              caption: 'Our rule-of-thumb table using Paper 1\'s scaling. It ignores that floating point and integer multipliers differ. Accuracy is the cost.'
            },
            {
              t: 'callout',
              kind: 'watch',
              body: 'Lower precision can cost accuracy, and the hardware must support the format. Accumulators (the partial sums) usually stay wider than the weights, so some arithmetic and storage stays wide. Papers 13 (HAQ) and 5 (the TPU) show two ways this plays out.'
            },
            {
              t: 'quiz',
              id: 'sze-q17',
              q: 'You move a network from 32-bit floats to 8-bit integers. By the rules above, how do weight traffic and multiplier energy change?',
              options: ['Traffic falls 4 times, multiplier energy about 16 times', 'Both fall 4 times', 'Traffic falls 16 times, multiplier energy 4 times', 'Neither changes'],
              answer: 0,
              whyNot: [null, 'The multiplier scales with the square of the width, so it falls more than traffic.', 'The two are swapped. Traffic is proportional to the width.', 'Both change a lot.'],
              explain: 'Traffic is proportional to the number of bytes (4 times fewer). A multiplier grows with the bits squared, (32 / 8) squared = 16.'
            }
          ]
        },
        {
          id: 'sparsity',
          title: 'Zeros: sparsity and pruning',
          min: 7,
          blocks: [
            {
              t: 'callout',
              kind: 'example',
              body: 'A cashier skips every item priced at zero instead of ringing it up and adding nothing. If the shelf has two kinds of zeros (free samples and sold-out items), the cashier skips both and finishes faster.'
            },
            { t: 'p', text: 'Zeros appear in two places. {{relu|ReLU}} makes many **activations** exactly zero. {{pruning|Pruning}} sets small **weights** to zero. Hardware can use zeros in two ways: **compress** the data (store and move fewer values) and **avoid the work** (a multiply by zero adds nothing). Avoiding work comes in two forms. {{gating|Gating}} switches the multiplier off, which saves energy but not time. {{skipping|Skipping}} never issues the multiply, which saves both.' },
            { t: 'widget', name: 'sparsitySim', title: 'What zeros buy you', tag: 'Toy model, not from the paper' },
            {
              t: 'callout',
              kind: 'try',
              body: [
                '1. Keep **50%** zero weights and **40%** zero activations. Only **30%** of the MACs have two non-zero inputs, so a skipping design could be about 3.3 times faster. A gating design saves energy on the multipliers but not the cycles.',
                '2. Look at storage. With 8-bit weights and a 4-bit index, storing only the non-zero weights takes 75% of the dense storage.',
                '3. Drag zero weights down to **20%**. Storage rises to 120%. The index costs more than the zeros save, so below about 33% zero weights compression loses.'
              ]
            },
            {
              t: 'callout',
              kind: 'paper',
              body: 'The survey discusses exploiting zeros in activations (created by ReLU), pruning weights to create sparsity, and compressing data to save storage and bandwidth. Papers 6 (EIE) and 7 (SCNN) are accelerators built around it.'
            },
            {
              t: 'quiz',
              id: 'sze-q18',
              q: 'What is the difference between zero gating and zero skipping?',
              options: ['Gating saves multiplier energy but the cycle still happens. Skipping also saves the time.', 'Gating makes the network more accurate', 'Skipping only works for weights', 'They are the same'],
              answer: 0,
              whyNot: [null, 'Neither changes the numbers computed. A zero times anything is zero either way.', 'Skipping can be applied to zero weights or zero activations.', 'They save different things, so they differ.'],
              explain: 'Gating turns a unit off for a zero. Skipping avoids issuing the operation, so the freed cycle can do other work, at the price of extra logic to find the non-zero values.'
            }
          ]
        },
        {
          id: 'compact',
          title: 'Compact layers',
          min: 6,
          blocks: [
            {
              t: 'callout',
              kind: 'example',
              body: 'Instead of one dish that needs nine ingredients combined from every pantry shelf at once, prepare each ingredient simply on its own and then do one simple mixing step. Two easy steps can cost far less than one hard one.'
            },
            { t: 'p', text: 'A standard convolution mixes channels and space in one go. A **{{depthwise|depthwise}}** convolution filters each channel separately (the spatial part), and a **{{pointwise|pointwise}}** (1 x 1) convolution then mixes channels. Together they replace the standard layer with far fewer MACs and weights.' },
            { t: 'widget', name: 'compactConv', title: 'Standard layer against depthwise plus pointwise', tag: 'Original arithmetic, not from the paper' },
            {
              t: 'callout',
              kind: 'try',
              body: [
                '1. With the default (128 channels in and out, 3 x 3, 28 x 28), the separable pair needs about **8.4 times** fewer MACs and the same factor fewer weights.',
                '2. Raise the output channels **M to 512**. The saving rises toward 9 times, the limit set by 1 / (3 x 3).',
                '3. Set the filter to **7 x 7**. The saving jumps to about 35 times, because the big spatial filter is now applied per channel.'
              ]
            },
            {
              t: 'callout',
              kind: 'watch',
              body: 'Fewer MACs does not guarantee faster or lower-energy hardware. A depthwise layer reuses each weight over fewer channels, so a PE array can be harder to keep busy. That is the topic of the next step.'
            },
            {
              t: 'callout',
              kind: 'paper',
              body: 'The survey covers compact network design: using 1 x 1 filters to shrink channels, and factorizing filters into smaller pieces, to cut weights and MACs. (Our paraphrase. **Reading task:** note which designs it lists and how it describes depthwise separable layers.)'
            },
            {
              t: 'quiz',
              id: 'sze-q19',
              q: 'A layer has 256 input channels, 256 output channels, a 3 x 3 filter and a 14 x 14 output. As a depthwise plus pointwise pair, what fraction of the standard layer\'s MACs does it need?',
              options: ['About 1/9', 'About 0.115', 'About 1/256', 'Exactly half'],
              answer: 1,
              whyNot: ['That is the limit when M is huge. It ignores the pointwise layer\'s 1 / M term.', null, 'That ignores the depthwise part.', 'There is no reason for exactly half.'],
              explain: 'The fraction is 1/M + 1/(R x S) = 1/256 + 1/9 = 0.0039 + 0.111 = 0.115.'
            }
          ]
        },
        {
          id: 'macs-not-energy',
          title: 'MAC counts are not energy',
          min: 5,
          blocks: [
            { t: 'p', text: 'It is tempting to rank networks by their MACs or weights. Hardware designers learned that this can mislead. Two networks with the same MACs can differ a lot in energy, because energy depends on **where** the data comes from. A network with big feature maps or little reuse spends more on DRAM.' },
            {
              t: 'table',
              head: ['Network', 'MACs', 'Average energy per MAC (units of one MAC)', 'Total energy'],
              rows: [
                ['X', '2.0 billion', '9', '18 billion units'],
                ['Y', '1.5 billion', '14', '21 billion units']
              ],
              source: 'toy',
              caption: 'Invented numbers to show the effect. Y has fewer MACs but uses more energy because its data comes from farther away.'
            },
            {
              t: 'callout',
              kind: 'paper',
              body: 'The survey argues that fewer weights or MACs does not guarantee lower energy or latency, and that designers should use direct metrics (a measurement or an energy model) when making hardware-aware choices. (Our paraphrase from memory. **Reading task:** find where it says this and note the example it gives.) Paper 8 (Timeloop) and Paper 10 (Accelergy) build such energy models.'
            },
            {
              t: 'quiz',
              id: 'sze-q20',
              q: 'Network A has 20% fewer MACs than Network B. What else do you need to know before saying A uses less energy?',
              options: ['Where each network\'s data comes from, that is, its energy per MAC', 'Nothing, fewer MACs always means less energy', 'The name of the framework', 'How many layers each has, and nothing else'],
              answer: 0,
              whyNot: [null, 'The table above is a counterexample. Fewer MACs can still cost more energy.', 'The framework does not set the hardware energy.', 'Layer count alone does not determine data movement.'],
              explain: 'Total energy is MACs times energy per MAC, and energy per MAC depends on the data movement.'
            }
          ]
        }
      ]
    },

    /* ------------------------------ Part 5 ------------------------------ */
    {
      id: 'metrics',
      title: 'Evaluating hardware honestly',
      summary: 'The metrics to ask for, peak against achieved, and benchmarking traps.',
      steps: [
        {
          id: 'metrics',
          title: 'The metrics to ask for',
          min: 5,
          blocks: [
            {
              t: 'callout',
              kind: 'example',
              body: 'Judging a car by its top speed on a test track tells you little about your commute. You also want miles per gallon, the price, whether it fits your garage, and the time the trip really takes in traffic. One number cannot rank a car, and one number cannot rank a chip.'
            },
            { t: 'p', text: 'The survey lists the metrics to use when comparing DNN hardware and says each should be reported, not just the flattering one.' },
            {
              t: 'table',
              head: ['Metric', 'What to ask for', 'Often left out'],
              rows: [
                ['Accuracy', 'On which network and dataset, at what precision', 'Accuracy after quantization or pruning'],
                ['Throughput', 'Inferences per second, measured, with the batch size', 'Batch size, and which layers are counted'],
                ['Latency', 'Time for one input, ideally the tail', 'Latency at the batch size used for throughput'],
                ['Energy and power', 'Energy per inference, for the whole system', 'DRAM energy, chip only versus board'],
                ['Hardware cost', 'Chip area, memory size, number of PEs', 'On-chip memory needed'],
                ['Flexibility', 'Which networks and layers it runs well', 'Layers that fall back to a slow path'],
                ['Scalability', 'Whether performance grows with more PEs or chips', 'Efficiency at small and large sizes']
              ],
              source: 'original',
              caption: 'Our table of the survey\'s benchmarking metrics, with the omissions to watch for. Check the survey\'s own list.'
            },
            {
              t: 'quiz',
              id: 'sze-q21',
              q: 'A vendor reports 10 times the throughput of a competitor but does not say the batch size. What is the biggest risk?',
              options: ['It may have used a large batch, which raises throughput but also latency', 'The chip is broken', 'Throughput cannot be compared', 'The clock must be higher'],
              answer: 0,
              whyNot: [null, 'Nothing suggests that. The issue is the missing context.', 'It can be compared, if both use the same conditions.', 'A higher clock is one possible cause, not the biggest risk of the missing batch.'],
              explain: 'Large batches reuse weights more, which raises throughput, and make each input wait longer. Without the batch size the comparison is not fair.'
            }
          ]
        },
        {
          id: 'peak',
          title: 'Peak against achieved',
          min: 6,
          blocks: [
            { t: 'p', text: 'The headline number of a chip is its **peak** throughput: MAC units x clock x operations counted per MAC. It assumes every unit is busy every cycle. Real networks leave units idle, often waiting for data.' },
            { t: 'widget', name: 'peakTops', title: 'Peak and achieved operations per second', tag: 'Toy calculator, not from the paper' },
            {
              t: 'callout',
              kind: 'try',
              body: [
                '1. Set **65,536** units and **700 MHz** with **2 operations per MAC**. The peak is about **92 TOPS**, the headline figure Paper 5 reports for the first TPU.',
                '2. Switch to **1 operation per MAC**. The same chip now shows about **46 TOPS**. Nothing about the hardware changed.',
                '3. Set utilization to **25%**. The chip delivers about 23 TOPS. Utilization is as important as peak.'
              ]
            },
            {
              t: 'callout',
              kind: 'paper',
              body: 'The survey asks for peak performance and utilization to be reported together, and notes that some papers count a MAC as one operation and others as two. (Our paraphrase. **Reading task:** find where it discusses utilization.) Paper 11 develops this into a full critique of quoting TOPS/W.'
            },
            {
              t: 'quiz',
              id: 'sze-q22',
              q: 'A chip has 4,096 MAC units at 1 GHz and counts 2 operations per MAC. What is its peak?',
              options: ['4.1 TOPS', '8.2 TOPS', '4,096 TOPS', '1 TOPS'],
              answer: 1,
              whyNot: ['That counts one operation per MAC. With two operations per MAC it doubles.', null, 'You multiplied by 1 GHz as if it were 1 trillion. 1 GHz is 10^9 per second.', 'That would need only 500 MAC units.'],
              explain: '4,096 x 10^9 x 2 = 8.19 x 10^12 operations per second.'
            }
          ]
        },
        {
          id: 'traps',
          title: 'Benchmarking traps',
          min: 5,
          blocks: [
            { t: 'p', text: 'Click each card to see a common way numbers mislead, and what to ask.' },
            {
              t: 'flip',
              hint: 'Click to see the fix',
              cards: [
                { front: 'Trap 1: Quoting TOPS alone', back: 'Ask for the peak together with utilization, and for achieved throughput on a stated network.' },
                { front: 'Trap 2: Counting only the best layer', back: 'A chip can look great on the easiest convolution layer and poorly on the whole network. Ask for end-to-end numbers on a named network.' },
                { front: 'Trap 3: Leaving out DRAM', back: 'A chip-only power number may leave out the off-chip memory, which can dominate. Ask what the number covers.' },
                { front: 'Trap 4: Ignoring batch size', back: 'A large batch lifts throughput and weight reuse but adds latency. Ask for the batch size and the latency.' },
                { front: 'Trap 5: Skipping accuracy', back: 'Quantization and pruning change accuracy. Ask for accuracy at the settings that produced the speed.' }
              ]
            },
            {
              t: 'quiz',
              id: 'sze-q23',
              q: 'Which questions should you ask before trusting a claim of "10 TOPS/W"? Pick all that apply.',
              options: ['Is it peak or achieved, and on which network?', 'What power does it cover, chip only or including DRAM?', 'What is the accuracy at these settings?', 'What is the vendor\'s logo?'],
              answer: [0, 1, 2],
              whyNot: [null, null, null, 'A logo says nothing about the measurement.'],
              explain: 'A TOPS/W claim needs a stated workload, a stated power boundary and the accuracy of the model that was run.'
            }
          ]
        }
      ]
    }
  ];
})();
