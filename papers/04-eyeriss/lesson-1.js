/* Paper 4 lesson, parts 0 to 2: start, the problem, the existing dataflows. */
(function () {
  'use strict';
  var MLS = window.MLS;
  window.EYE = window.EYE || {};

  /* ---------- Figures: one small diagram per dataflow ---------- */
  function dataflowFigure(kind) {
    var held = {
      ws: ['holds weight 1', 'holds weight 2', 'holds weight 3'],
      os: ['holds partial sum 1', 'holds partial sum 2', 'holds partial sum 3'],
      nlr: ['no local storage', 'no local storage', 'no local storage'],
      rs: ['filter row + input row', 'filter row + input row', 'filter row + input row']
    }[kind];
    var edgeLabels = {
      ws: { mid: 'inputs (one read, shared)', side: 'partial sums' },
      os: { mid: 'weights + inputs, outputs out', side: null },
      nlr: { mid: 'weights, inputs, partial sums, in and out', side: null },
      rs: { mid: 'one row of weights, one row of inputs', side: 'shared rows and partial sums' }
    }[kind];
    return function (host) {
      var drop = function (x) { return 'M' + x + ',66 L' + x + ',177'; };
      var edges = [
        { from: 'buf', to: 'p1', path: drop(150) },
        { from: 'buf', to: 'p2', path: drop(390), label: edgeLabels.mid, labelAt: [390, 124] },
        { from: 'buf', to: 'p3', path: drop(630) }
      ];
      if (edgeLabels.side) {
        edges.push({ from: 'p1', to: 'p2', label: kind === 'ws' ? 'psums' : 'rows', labelAt: [270, 188] });
        edges.push({ from: 'p2', to: 'p3', label: kind === 'ws' ? 'psums' : 'rows', labelAt: [510, 188] });
      }
      MLS.graph(host, {
        width: 780,
        height: 250,
        ariaLabel: 'Data movement for the ' + kind + ' dataflow with one global buffer and three processing elements',
        nodes: [
          { id: 'buf', label: 'Global buffer', sub: 'on-chip SRAM', cx: 390, cy: 40, w: 640, h: 52, kind: 'io' },
          { id: 'p1', label: 'PE 1', sub: held[0], cx: 150, cy: 205, w: 190, h: 56, kind: 'op' },
          { id: 'p2', label: 'PE 2', sub: held[1], cx: 390, cy: 205, w: 190, h: 56, kind: 'op' },
          { id: 'p3', label: 'PE 3', sub: held[2], cx: 630, cy: 205, w: 190, h: 56, kind: 'op' }
        ],
        edges: edges
      });
    };
  }
  window.EYE.dataflowFigure = dataflowFigure;

  function hierarchy(host) {
    MLS.graph(host, {
      width: 780,
      height: 160,
      ariaLabel: 'The four storage levels of a spatial architecture and the relative energy of one access',
      nodes: [
        { id: 'dram', label: 'DRAM', sub: '200x', cx: 90, cy: 88, w: 130, h: 62, kind: 'io' },
        { id: 'gb', label: 'Global buffer', sub: '6x', cx: 290, cy: 88, w: 150, h: 62, kind: 'var' },
        { id: 'pe', label: 'Neighbor PE', sub: '2x', cx: 495, cy: 88, w: 150, h: 62, kind: 'op' },
        { id: 'rf', label: 'Register file', sub: '1x (same PE)', cx: 690, cy: 88, w: 150, h: 62, kind: 'grad' }
      ],
      edges: [
        { from: 'dram', to: 'gb', label: 'off chip', labelAt: [190, 50] },
        { from: 'gb', to: 'pe', label: 'on chip', labelAt: [392, 50] },
        { from: 'pe', to: 'rf', label: 'inside the PE', labelAt: [592, 50] }
      ]
    });
  }
  window.EYE.figHierarchy = hierarchy;

  window.EYE.p1 = [
    /* ------------------------------ Part 0 ------------------------------ */
    {
      id: 'start',
      title: 'Start here',
      summary: 'What the paper is, what you will learn, and how to use this lesson.',
      steps: [
        {
          id: 'welcome',
          title: 'Welcome to Paper 4',
          min: 3,
          blocks: [
            { t: 'p', lead: true, text: 'Papers 1 to 3 told you that moving data costs far more than computing on it, that a convolution offers lots of reuse, and that a roofline shows which side you are on. This paper answers the next question: **how do you actually arrange the computation so the reuse happens in the cheap memories?** Its answer, row stationary, is the most influential dataflow idea in accelerator design.' },
            {
              t: 'facts',
              rows: [
                ['Paper', 'Eyeriss: A Spatial Architecture for Energy-Efficient Dataflow for Convolutional Neural Networks'],
                ['Authors', 'Yu-Hsin Chen, Joel Emer, Vivienne Sze (MIT)'],
                ['Venue', 'ISCA 2016 (International Symposium on Computer Architecture)'],
                ['Read the original', 'The authors\' copy is at [people.csail.mit.edu](https://people.csail.mit.edu/emer/media/papers/2016.06.isca.eyeriss_architecture.pdf). Part 7 gives a reading map.'],
                ['Time', 'About 3 hours for the lesson, plus 40 minutes for the practice problems at the end. Your place is saved in this browser.'],
                ['You should know', 'The convolution shape letters and the three kinds of reuse from Paper 2, and the four-level energy costs. Paper 3 helps.']
              ]
            },
            { t: 'h', text: 'By the end you can' },
            {
              t: 'list',
              ordered: true,
              items: [
                'Name the three kinds of data in a convolution and compute how much reuse each offers for a given layer.',
                'Explain why partial sums are the most expensive kind of data to move.',
                'Describe {{weight-stationary|weight stationary}}, {{output-stationary|output stationary}} and {{no-local-reuse|no local reuse}} in one sentence each, and say what each leaves expensive.',
                'Explain how {{row-stationary|row stationary}} turns a 2D convolution into 1D convolutions, one per PE.',
                'Draw the {{pe-set|logical PE set}} and say which PEs share a filter row, an input row and a partial sum.',
                'Explain {{folding}} and {{replication}}, and compute PE utilization for a layer on a 12 x 14 array.',
                'State the paper\'s headline results and what its analysis holds constant.',
                'Read the results critically: what the analysis counts and what it leaves out.'
              ]
            },
            {
              t: 'callout',
              kind: 'try',
              title: 'How this lesson works',
              body: [
                'Press **Next** or the right arrow key to move on. **Back** or the left arrow goes back. The **Parts** menu lets you jump anywhere.',
                'Words with a dotted underline open a short definition. The **Glossary** button lists them all.',
                'Every figure and widget is tagged. **From the paper** means the authors\' own data. **Original diagram** is ours. **Toy model** means a small model built to teach an idea, so do not quote its numbers as results.',
                'The last part holds **practice problems** at three levels. Each one hides its hint and solution until you open them.'
              ]
            }
          ]
        },
        {
          id: 'tldr',
          title: 'The paper in 60 seconds',
          min: 3,
          blocks: [
            { t: 'p', text: 'Running a CNN means moving a huge number of values. Where those values come from decides the energy. The paper proposes the **row stationary** dataflow: break each 2D convolution into 1D convolutions of one filter row against one input row, give each one to a processing element (PE), and let the PE keep both rows in its small register file. Neighbors share rows and add up each other\'s partial sums by passing them directly. Weights, inputs and partial sums all get reused locally at the same time.' },
            { t: 'p', text: 'To compare dataflows fairly, the authors build an analysis framework that holds hardware area and PE count fixed and counts energy by storage level and data type. On AlexNet, row stationary uses 1.4 to 2.5 times less energy than the other dataflows on the convolution layers. A fabricated chip demonstrates the dataflow.' },
            { t: 'callout', kind: 'idea', body: 'The best dataflow is not the one that reuses one kind of data perfectly. It is the one that keeps all three kinds of data close at once.' },
            { t: 'h', text: 'The paper in four questions' },
            {
              t: 'flip',
              hint: 'Click to see the answer',
              cards: [
                { front: 'What problem does it solve?', back: 'CNN accelerators spend most of their energy moving data. Existing dataflows each reduce only some of the movement. Which arrangement of the computation minimizes the total?' },
                { front: 'What is the core idea?', back: 'Row stationary. Each PE runs a 1D convolution of one filter row and one input row, and the array shares rows and accumulates partial sums by direct PE-to-PE transfers.' },
                { front: 'How do the authors show it works?', back: 'An analysis framework that compares four dataflows under the same area and PE count, run on the layers of AlexNet, plus a fabricated chip. (Check the details in the paper.)' },
                { front: 'What should you question?', back: 'The comparison comes from an analytical energy model. Check what it counts, what it leaves out, and how the storage was split among the dataflows.' }
              ]
            },
            { t: 'h', text: 'The course map' },
            { t: 'p', text: 'Eight short parts, the last with practice problems. Click any card to jump there.' },
            { t: 'partmap', skipFirst: true }
          ]
        }
      ]
    },

    /* ------------------------------ Part 1 ------------------------------ */
    {
      id: 'problem',
      title: 'The problem',
      summary: 'Where the energy goes, three kinds of data, partial sums, and how the paper compares dataflows.',
      steps: [
        {
          id: 'recap',
          title: 'Where the energy goes: a recap',
          min: 6,
          blocks: [
            {
              t: 'callout',
              kind: 'example',
              body: 'The cook from Paper 1 is back. Each chop needs three fetches (the onion, the recipe step, the bowl of running total) and one put-back. If every trip goes to the store across town, the cooking is almost all driving. If the ingredients sit on the counter, the cook just chops.'
            },
            { t: 'p', text: 'A spatial accelerator has four places to keep data. The cost of one access, relative to one MAC, is about **1** in the PE\'s own {{register-file|register file}}, **2** to a neighboring PE, **6** to the {{global-buffer|global buffer}} and **200** to {{dram|DRAM}}. Each MAC makes four accesses: it reads a weight, an input value and a partial sum, then writes the partial sum.' },
            { t: 'figure', draw: window.EYE.figHierarchy, source: 'original', caption: 'The four levels and the relative cost of one access (cost ratios as reported for this analysis, see the reading task below).', alt: 'DRAM, global buffer, neighbor PE and register file in a row with relative costs 200, 6, 2 and 1.' },
            { t: 'widget', name: 'hierEnergy', title: 'Energy per MAC across the hierarchy', tag: 'Paper\'s cost ratios, our access mixes', source: 'original', opts: {} },
            {
              t: 'callout',
              kind: 'try',
              body: [
                '1. Choose **No reuse**. All four accesses go to DRAM, so one MAC costs about 801 times a MAC.',
                '2. Choose **Mostly local**. Almost all accesses are in the register file, and the cost drops to about 7.7. The same arithmetic costs a hundred times less.',
                '3. Set DRAM to 0.1 accesses per MAC and everything else to 0. DRAM alone costs 20, more than the whole Mostly local mix. DRAM must be nearly eliminated.'
              ]
            },
            {
              t: 'callout',
              kind: 'paper',
              body: 'The paper builds its energy analysis on a four-level storage hierarchy with the cost ratios 200x for DRAM, 6x for the global buffer, 2x for a neighboring PE and 1x for the register file, each relative to a MAC. (Confirmed through a secondary source. **Reading task:** find the table of ratios in your copy and write down the process and data width it assumes.)'
            },
            {
              t: 'quiz',
              id: 'eye-q1',
              q: 'A design cuts DRAM accesses per MAC from 0.1 to 0.01 and does nothing else. By how much does the DRAM part of the energy per MAC fall?',
              options: ['From 20 to 2 units, a saving of 18', 'From 200 to 20 units', 'It does not change', 'From 6 to 0.6 units'],
              answer: 0,
              whyNot: [null, 'That multiplies by 2,000 accesses, not 0.1.', 'It changes, because the DRAM accesses per MAC changed.', 'That would be the global buffer at 6 per access.'],
              explain: '0.1 x 200 = 20 units before and 0.01 x 200 = 2 units after, a saving of 18 units per MAC.'
            }
          ]
        },
        {
          id: 'types',
          title: 'Three kinds of data, three kinds of reuse',
          min: 8,
          blocks: [
            { t: 'p', text: 'A convolution moves three kinds of data. **Filter weights** come from the trained model. **Input feature map values** ({{ifmap|ifmap}}, the activations) come from the previous layer. **Partial sums** ({{psum|psums}}) are the running totals that become the outputs. Each kind has its own reuse opportunity, and the amount differs from layer to layer.' },
            {
              t: 'table',
              head: ['Data type', 'Reuse opportunity', 'Count (N batch, M filters, C channels, R x R filter, E x E output, stride U)'],
              rows: [
                ['Filter weight', 'Used at every output position and by every input in the batch (convolutional reuse and filter reuse)', 'N x E x E'],
                ['Input value', 'Used by every filter and by overlapping windows (input feature map reuse and convolutional reuse)', 'About M x R x R / U squared (at most M x E x E)'],
                ['Partial sum', 'Not reuse but accumulation: each output adds up this many products before it is final', 'C x R x R']
              ],
              source: 'original',
              caption: 'The same reuse counts as Paper 2, restated for the three data types. Our arithmetic from the loop nest.'
            },
            { t: 'widget', name: 'reuseProfile', title: 'Which reuse does each layer offer?', tag: 'Original calculator, AlexNet layers', source: 'original' },
            {
              t: 'callout',
              kind: 'try',
              body: [
                '1. **CONV1**: weight reuse 3,025, input reuse 726, accumulations 363. Weights have the most reuse.',
                '2. **CONV3**: weight reuse 169, input reuse 3,456, accumulations 2,304. Now inputs have the most and weights the least. The order flipped.',
                '3. **FC6** at batch 1: weights are used once, inputs 4,096 times, accumulations 9,216. Weight reuse has vanished.',
                '4. Move **batch to 64** on CONV1. Weight reuse becomes 193,600. A bigger batch gives weights more reuse.'
              ]
            },
            {
              t: 'quiz',
              id: 'eye-q2',
              q: 'For AlexNet CONV3 at batch 1, which of the three has the **largest** count?',
              options: ['Input reuse, about 3,456', 'Weight reuse, 169', 'Accumulations per output, 2,304', 'They are all equal'],
              answer: 0,
              whyNot: [null, 'Weight reuse is the smallest here, because the output is only 13 x 13.', 'Accumulations are large (2,304) but input reuse is larger (3,456).', 'The widget shows they differ by more than an order of magnitude.'],
              explain: 'Input reuse = M x R x R / U squared = 384 x 9 = 3,456.'
            },
            {
              t: 'callout',
              kind: 'idea',
              body: 'Because the biggest reuse switches between data types as the layer changes, a dataflow built around one kind of data cannot be best everywhere. This is the problem row stationary is designed to solve.'
            }
          ]
        },
        {
          id: 'psum',
          title: 'Why partial sums are special',
          min: 6,
          blocks: [
            {
              t: 'callout',
              kind: 'example',
              body: 'A cook builds a stew by adding one ingredient at a time to a pot. If the pot must go back to the pantry after every addition, the cook carries a heavy pot (a read and a write) hundreds of times. If the pot stays on the counter until the stew is finished, the pot travels once.'
            },
            { t: 'p', text: 'A partial sum is the pot. For every MAC it is **read, updated and written**, which is two accesses, where a weight or an input value needs only one. And there are many updates: each output sums C x R x R products. If every update went through the global buffer, the partial sum alone would cost 2 buffer accesses per MAC.' },
            {
              t: 'table',
              head: ['Where the partial sum lives', 'Accesses for one output of CONV3 (2,304 updates)', 'Energy (units of one MAC)'],
              rows: [
                ['In the global buffer for every update', '2 x 2,304 = 4,608 buffer accesses', '4,608 x 6 = 27,648'],
                ['In the register file, written to the buffer once at the end', '4,608 register file accesses + 1 buffer write', '4,608 x 1 + 6 = 4,614']
              ],
              source: 'toy',
              caption: 'Our arithmetic with the 1x and 6x costs. It counts only the partial sum accesses.'
            },
            { t: 'p', text: 'The difference is about 6 times, the ratio of the two costs, for the same arithmetic. That is why keeping partial sums local until the output is finished is such a strong idea, and why dataflows that cannot do it pay dearly.' },
            {
              t: 'quiz',
              id: 'eye-q3',
              q: 'Why is a partial sum access more costly than a weight access, level for level?',
              options: ['It is both read and written for each update, so it makes two accesses per MAC', 'Partial sums are stored in DRAM only', 'Partial sums need more bits than weights', 'They are never reused'],
              answer: 0,
              whyNot: [null, 'Where a partial sum lives depends on the dataflow. DRAM is not required.', 'Wider accumulators can add cost, but the reason in this lesson is the read plus write.', 'Partial sums are not reused. They are accumulated into, which is why they cost double.'],
              explain: 'A weight is read once per MAC. A partial sum is read, updated and written back, which is two accesses.'
            }
          ]
        },
        {
          id: 'framework',
          title: 'How the paper compares dataflows fairly',
          min: 6,
          blocks: [
            { t: 'p', text: 'Earlier accelerators each proposed their own dataflow on their own chip, with different numbers of PEs and different memory sizes. A fair comparison needs the same playing field. The paper builds an **analysis framework** that holds the hardware budget fixed and counts every data movement.' },
            {
              t: 'table',
              head: ['Held constant for every dataflow', 'Varied'],
              rows: [
                ['The number of PEs (the arithmetic parallelism)', 'The dataflow'],
                ['The total storage area (the register files plus the global buffer share a fixed budget)', 'How the area is split between local register files and the global buffer'],
                ['The workload: the layers of AlexNet, at several batch sizes', 'How the layer is mapped onto the array'],
                ['The cost per access at each level (normalized to a MAC)', '']
              ],
              source: 'original',
              caption: 'Our summary of the analysis framework. Check the exact settings in the paper (reading task below).'
            },
            { t: 'p', text: 'Energy is counted by **storage level** (DRAM, global buffer, array, register file) and by **data type** (inputs, weights, partial sums), so you can see not just which dataflow wins but where its energy goes.' },
            {
              t: 'callout',
              kind: 'paper',
              body: 'The paper compares dataflows under the same area and the same number of PEs, and reports energy by storage level and data type. (Our paraphrase. **Reading task:** find the PE count, the register file size per PE, the global buffer size, the data width and the batch sizes used in the comparison, and write them down.)'
            },
            {
              t: 'quiz',
              id: 'eye-q4',
              q: 'Why does a fair comparison hold the area and the number of PEs constant?',
              options: ['Otherwise a dataflow could look better just because it was given more memory or more arithmetic', 'The authors wanted to save time', 'All dataflows need the same number of PEs', 'Area has no effect on energy'],
              answer: 0,
              whyNot: [null, 'The reason is about fairness of the result, not effort.', 'Dataflows can map onto different numbers of PEs. That is why the budget must be fixed.', 'Area limits how much storage you can build, which changes energy.'],
              explain: 'If one dataflow had twice the memory, it would win without being a better dataflow. Fixing the budget isolates the effect of the dataflow itself.'
            }
          ]
        }
      ]
    },

    /* ------------------------------ Part 2 ------------------------------ */
    {
      id: 'existing',
      title: 'The existing dataflows',
      summary: 'Weight stationary, output stationary and no local reuse.',
      steps: [
        {
          id: 'ws',
          title: 'Weight stationary',
          min: 6,
          blocks: [
            {
              t: 'callout',
              kind: 'example',
              body: 'Each cook keeps one recipe card taped to their station and never moves it. Onions are passed down the line. Each cook adds a pinch to a bowl that is handed from station to station. The recipe cards never travel. The bowls do.'
            },
            { t: 'p', text: 'In a {{weight-stationary|weight stationary (WS)}} dataflow, each PE loads a filter weight into its register file and keeps it there while inputs stream past. The weight is reused at every output position and for every input in the batch, **N x E x E** times. The inputs are shared across the PEs that hold different filters. The partial sums, though, are produced one product at a time and must be added up across PEs and over time.' },
            { t: 'figure', draw: window.EYE.dataflowFigure('ws'), source: 'original', caption: 'Weight stationary. Weights stay in the PEs. Inputs come from the buffer and partial sums pass along. (Schematic. The real arrangements differ by design.)', alt: 'A global buffer feeding three processing elements, each holding a weight, with partial sums passing between them.' },
            {
              t: 'table',
              head: ['', 'Weight stationary'],
              rows: [
                ['Stays in the PE', 'Weights'],
                ['Moves', 'Inputs and partial sums'],
                ['Strength', 'Each weight is fetched once and reused many times'],
                ['Weak point', 'Partial sums move a lot. Inputs are not reused in the register file.']
              ],
              source: 'original',
              caption: 'Our summary.'
            },
            {
              t: 'quiz',
              id: 'eye-q5',
              q: 'A CONV layer has batch 4 and a 27 x 27 output. Under weight stationary, how many times can one weight be reused from its PE?',
              options: ['4 x 27 x 27 = 2,916', '27 x 27 = 729', '4', '27'],
              answer: 0,
              whyNot: [null, 'That is for batch 1. The batch multiplies the reuse.', 'That is only the reuse across the batch. The weight is also reused at every output position.', 'That is only the output width.'],
              explain: 'N x E x E = 4 x 729 = 2,916 uses per weight.'
            }
          ]
        },
        {
          id: 'os',
          title: 'Output stationary',
          min: 6,
          blocks: [
            {
              t: 'callout',
              kind: 'example',
              body: 'Each cook keeps their own pot on the counter and builds a stew in it. Ingredients and recipe steps are brought to each cook as needed. The pot never leaves until the stew is done.'
            },
            { t: 'p', text: 'In an {{output-stationary|output stationary (OS)}} dataflow, each PE owns one output value and keeps its partial sum in the register file until all C x R x R products have been added. The partial sum never travels to a larger memory. The weights and input values, however, must be delivered to the PEs for nearly every MAC. Shared delivery (broadcast) cuts the buffer reads somewhat, but the register file holds no reusable weights or inputs.' },
            { t: 'figure', draw: window.EYE.dataflowFigure('os'), source: 'original', caption: 'Output stationary. Partial sums stay in the PEs. Weights and inputs stream in from the buffer, and finished outputs go out. (Schematic.)', alt: 'A global buffer feeding three processing elements, each holding a partial sum.' },
            {
              t: 'table',
              head: ['', 'Output stationary'],
              rows: [
                ['Stays in the PE', 'Partial sums'],
                ['Moves', 'Weights and inputs'],
                ['Strength', 'Partial sums never leave until the output is complete: one write per C x R x R MACs'],
                ['Weak point', 'Weights and inputs travel for almost every MAC']
              ],
              source: 'original',
              caption: 'Our summary.'
            },
            {
              t: 'callout',
              kind: 'paper',
              body: 'The paper describes several output stationary variants that differ in how the PE array is split among output pixels and output channels, and notes which ones target convolution layers and which target fully connected layers. (Our paraphrase from memory. **Reading task:** note the variants, how each splits the array, and which designs the paper lists for each.)'
            },
            {
              t: 'quiz',
              id: 'eye-q6',
              q: 'Under output stationary, a layer has C = 192 channels and a 3 x 3 filter. How many MACs share one partial sum write to the buffer?',
              options: ['192 x 3 x 3 = 1,728', '192', '9', '1'],
              answer: 0,
              whyNot: [null, 'That counts only the channels. Each channel also contributes R x R products.', 'That counts only the filter positions of one channel.', 'That is the cost with no local accumulation.'],
              explain: 'Each output sums C x R x R = 1,728 products, then is written once.'
            }
          ]
        },
        {
          id: 'nlr',
          title: 'No local reuse',
          min: 5,
          blocks: [
            {
              t: 'callout',
              kind: 'example',
              body: 'The cooks have no stations. Every ingredient and every pot goes back to a huge shared pantry between chops, but the pantry is big and has many doors, so many cooks can reach in at once. Space that could have been counters was used for pantry shelves.'
            },
            { t: 'p', text: 'A {{no-local-reuse|no local reuse (NLR)}} dataflow gives the PEs no register file at all. All data comes from and goes back to a large global buffer, which takes the chip area that other designs spend on local storage. Inputs can be broadcast and partial sums added in a tree. The PEs are simple, but every MAC touches the buffer.' },
            { t: 'figure', draw: window.EYE.dataflowFigure('nlr'), source: 'original', caption: 'No local reuse. The PEs hold nothing. Everything flows through the global buffer. (Schematic.)', alt: 'A global buffer feeding three processing elements that hold no data.' },
            {
              t: 'table',
              head: ['', 'No local reuse'],
              rows: [
                ['Stays in the PE', 'Nothing'],
                ['Moves', 'Weights, inputs and partial sums, all through the buffer'],
                ['Strength', 'Simple PEs and a large buffer that can be shared by every PE'],
                ['Weak point', 'Every MAC pays buffer cost (6x) for its operands instead of register file cost (1x)']
              ],
              source: 'original',
              caption: 'Our summary.'
            },
            {
              t: 'quiz',
              id: 'eye-q7',
              q: 'Counting only register file and buffer accesses (1x and 6x), how much more does one MAC cost in a no-local-reuse design than in a design that serves all four accesses from the register file?',
              options: ['6 times more for the data accesses (24 against 4)', '2 times', 'The same', '200 times'],
              answer: 0,
              whyNot: [null, 'The ratio of the two costs is 6, not 2.', 'The buffer costs 6 times the register file per access.', '200 is the DRAM cost, which this comparison leaves out.'],
              explain: 'Four accesses at 6 is 24. Four accesses at 1 is 4. The ratio is 6.'
            }
          ]
        },
        {
          id: 'summary',
          title: 'What each one leaves expensive',
          min: 6,
          blocks: [
            { t: 'p', text: 'Put the three side by side. Each existing dataflow makes one kind of data cheap and leaves the others expensive.' },
            {
              t: 'table',
              head: ['Dataflow', 'Cheap', 'Expensive', 'Best reuse it can reach'],
              rows: [
                ['Weight stationary', 'Weights', 'Partial sums and inputs', 'Weights: N x E x E'],
                ['Output stationary', 'Partial sums', 'Weights and inputs', 'Partial sums: C x R x R accumulations'],
                ['No local reuse', 'Nothing in the PE, but a big shared buffer', 'All three, each at buffer cost', 'Whatever the buffer can capture']
              ],
              source: 'original',
              caption: 'Our summary. The reuse counts come from the table in Part 1.'
            },
            {
              t: 'flip',
              hint: 'Click to see the pattern',
              cards: [
                { front: 'What do WS, OS and NLR have in common?', back: 'Each optimizes one thing. WS optimizes weights, OS optimizes partial sums, NLR optimizes area and simplicity.' },
                { front: 'What do the three layers (CONV1, CONV3, FC6) show?', back: 'The biggest reuse moves: weights in CONV1, inputs in CONV3, accumulations in FC6. A single fixed strategy will be best for some layers and poor for others.' },
                { front: 'What would a better dataflow do?', back: 'Capture all three kinds of reuse at once in the cheap memories, and adapt to the layer shape.' }
              ]
            },
            {
              t: 'quiz',
              id: 'eye-q8',
              q: 'A dataflow keeps each partial sum in the register file until the output is finished and streams weights and inputs through. Which is it?',
              options: ['Output stationary', 'Weight stationary', 'No local reuse', 'Row stationary'],
              answer: 0,
              whyNot: [null, 'Weight stationary keeps weights in the register file.', 'No local reuse has no register file.', 'Row stationary keeps rows of weights and inputs, plus partial sums, together. Part 3 explains it.'],
              explain: 'The partial sum is the stationary data, so it is output stationary.'
            },
            {
              t: 'quiz',
              id: 'eye-q9',
              q: 'Which dataflow is hurt most when a layer has little weight reuse, as FC6 does at batch 1?',
              options: ['Weight stationary, whose strength is weight reuse', 'Output stationary', 'No local reuse', 'All three are hurt equally'],
              answer: 0,
              whyNot: [null, 'Output stationary depends on accumulations, which FC6 has plenty of (9,216).', 'No local reuse does not rely on any one reuse type.', 'The dataflows depend on different reuse, so they are not hurt equally.'],
              explain: 'Weight stationary gains from using each weight many times. FC6 at batch 1 uses each weight once, so there is little to gain.'
            }
          ]
        }
      ]
    }
  ];
})();
