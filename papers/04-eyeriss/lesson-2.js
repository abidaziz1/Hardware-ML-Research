/* Paper 4 lesson, parts 3 and 4: row stationary, and comparing the dataflows. */
(function () {
  'use strict';
  window.EYE = window.EYE || {};

  window.EYE.p2 = [
    /* ------------------------------ Part 3 ------------------------------ */
    {
      id: 'rs',
      title: 'Row stationary',
      summary: 'The 1D primitive, the PE set, interleaving, and folding onto the array.',
      steps: [
        {
          id: 'idea',
          title: 'The idea: a 2D convolution is a sum of 1D convolutions',
          min: 6,
          blocks: [
            {
              t: 'callout',
              kind: 'example',
              body: 'A tray of muffins has rows. Rather than one baker doing the whole tray, give each baker one row of the tray and one row of the recipe card, and let the bakers who work on neighboring rows hand each other the partial results. Each baker only ever looks at one row of each.'
            },
            { t: 'p', text: 'A 2D convolution can be cut into 1D convolutions. Output row e of one filter is the sum, over the filter rows r, of the 1D convolution of filter row r with input row e + r (stride 1). Row stationary assigns each of those 1D convolutions to one {{pe|PE}}.' },
            {
              t: 'reveal',
              label: 'See it as an equation',
              body: [
                'For one input channel and one filter, with stride 1: output[e][f] = the sum over r of the sum over s of filter[r][s] x input[e + r][f + s].',
                'Group the terms by r. For a fixed r, the inner sum over s is a 1D convolution of filter row r with input row e + r. So output row e is the **sum over r** of R separate 1D convolutions. Each 1D convolution is one PE\'s job, and the sum over r is a vertical accumulation of partial sum rows.'
              ]
            },
            {
              t: 'quiz',
              id: 'eye-q10',
              q: 'A filter has 3 rows. How many 1D convolutions are added up to make one output row of a 2D convolution (one channel, one filter)?',
              options: ['3, one per filter row', '1', '9', 'As many as there are input channels'],
              answer: 0,
              whyNot: [null, 'One output row needs every filter row, each applied to a different input row.', '9 would be the number of weights, not the number of rows.', 'Channels add further terms. For one channel the count is the number of filter rows.'],
              explain: 'Output row e = (filter row 0 on input row e) + (filter row 1 on input row e + 1) + (filter row 2 on input row e + 2).'
            },
            {
              t: 'callout',
              kind: 'paper',
              body: 'The paper builds the row stationary dataflow from a 1D convolution primitive that runs in one PE, then composes primitives across the array for 2D convolution. (Our paraphrase. **Reading task:** find the figure that shows the primitive, and note what the register file holds during it.)'
            }
          ]
        },
        {
          id: 'primitive',
          title: 'The 1D primitive inside one PE',
          min: 8,
          blocks: [
            { t: 'p', text: 'One PE holds a **filter row** (R weights) and slides it along an **input row** (W values), producing an **output row** (W - R + 1 values). Both rows live in the PE\'s register file. Step through it.' },
            { t: 'widget', name: 'rsPrimitive', title: 'One PE, one row of the filter, one row of the input', tag: 'Original diagram, exact counts', source: 'original' },
            {
              t: 'callout',
              kind: 'try',
              body: [
                '1. Keep the filter row of **3** and the input row of **7**. Press **Finish the row**. The PE did 15 MACs and touched the buffer only **15** times (3 weights, 7 inputs, 5 outputs). Its register file served 60 accesses. The energy is 165 against 375 for a design with no local storage, a saving of about 2.3 times.',
                '2. Press **Back** a few times and watch the input row. Each new MAC reuses most of the window. After the first output only **one** new input value arrives per output.',
                '3. Switch to the filter row of **5** and the input row of **13**. The buffer sees 27 accesses for 45 MACs. A no-local-storage design would make 180. The energy saving grows to about 2.9 times.'
              ]
            },
            {
              t: 'quiz',
              id: 'eye-q11',
              q: 'In the 1D primitive with a filter row of 3 and an input row of 7, how many times is each weight read from the register file?',
              options: ['5 times, once for each output', '1 time', '3 times', '7 times'],
              answer: 0,
              whyNot: [null, 'It is fetched from the buffer once, but read from the register file for every output.', 'That is the number of weights, not how often each is used.', 'That is the length of the input row.'],
              explain: 'The output row has 7 - 3 + 1 = 5 values, and every weight takes part in each of them.'
            },
            {
              t: 'callout',
              kind: 'watch',
              body: 'This counts one PE in isolation. It ignores the DRAM, the movement of rows between PEs and the passing of partial sums to neighbors. It shows the effect of keeping a row in the register file. The whole-array energy comes from the analysis framework in the paper.'
            }
          ]
        },
        {
          id: 'peset',
          title: 'The PE set: who shares what',
          min: 8,
          blocks: [
            { t: 'p', text: 'Now tile the 1D primitives into a grid. The logical {{pe-set|PE set}} for one 2D convolution has **R rows** (one per filter row) and **E columns** (one per output row). PE (r, e) takes **filter row r**, **input row r + e**, and contributes to **output row e**. The same data lands in several PEs, which is what allows reuse by direct transfer.' },
            { t: 'widget', name: 'rsPESet', title: 'The logical PE set', tag: 'Original diagram', source: 'original' },
            {
              t: 'callout',
              kind: 'try',
              body: [
                '1. Keep **Filter rows**, R = 3, E = 5. Row 0 sits in **5** PEs along one row of the set. The same weights are **multicast** horizontally.',
                '2. Switch to **Input rows** and pick row 2. It sits in **3** PEs along a diagonal: (0, 2), (1, 1) and (2, 0). The set needs E + R - 1 = 7 input rows in total.',
                '3. Switch to **Partial sum rows** and pick row 0. **3** PEs in one column contribute to it, and their partial sums are added **vertically**, passing from PE to PE and never visiting the buffer between additions.'
              ]
            },
            {
              t: 'table',
              head: ['Data', 'Where it is reused in the set', 'Direction', 'How it moves'],
              rows: [
                ['Filter row r', 'All PEs in row r of the set', 'Horizontal', 'Multicast from the buffer to E PEs'],
                ['Input row y', 'PEs with r + e = y', 'Diagonal', 'Multicast along the diagonal'],
                ['Partial sum row e', 'PEs in column e', 'Vertical', 'Passed from PE to PE and added']
              ],
              source: 'original',
              caption: 'Our summary of the logical PE set. The direction labels describe the logical set.'
            },
            {
              t: 'callout',
              kind: 'paper',
              body: 'The paper arranges 1D primitives into a PE array in which filter rows are reused horizontally, input rows diagonally, and partial sum rows are accumulated vertically. (Our paraphrase. **Reading task:** find that figure and check the directions against the three rows above.)'
            },
            {
              t: 'quiz',
              id: 'eye-q12',
              q: 'A logical PE set has R = 5 rows and E = 27 columns. How many PEs does it need?',
              options: ['135', '32', '27', '5'],
              answer: 0,
              whyNot: [null, 'That adds the two numbers. The set has one PE per (filter row, output row) pair.', 'That is only the number of columns.', 'That is only the number of rows.'],
              explain: 'R x E = 5 x 27 = 135 PEs.'
            }
          ]
        },
        {
          id: 'multi',
          title: 'More channels, filters and images: interleaving',
          min: 7,
          blocks: [
            {
              t: 'callout',
              kind: 'example',
              body: 'A baker at one station has room for a few extra trays. Instead of finishing one recipe, the baker can juggle three recipes at once on the same counter. The trays take space, and the baker reuses the same oven mitts (a shared tool) across all three.'
            },
            { t: 'p', text: 'A real layer has many channels, filters and images, and one 2D set does a single channel for a single filter. To raise reuse further, a PE can handle **several** rows at once by {{interleaving|interleaving}} them. The paper describes three techniques, each trading register file space for reuse.' },
            {
              t: 'table',
              head: ['Technique', 'What the PE holds extra', 'Reuse it increases', 'Limited by'],
              rows: [
                ['Interleave rows from several inputs (batch)', 'Several input rows against the same filter row', 'Filter reuse: the same weights serve more inputs', 'Register file space for the extra input rows'],
                ['Interleave rows from several filters', 'Several filter rows against the same input row', 'Input reuse: the same input values feed more filters', 'Register file space for the extra filter rows'],
                ['Interleave several channels', 'Rows from different channels, accumulating into the same partial sums', 'Partial sum accumulation without leaving the PE', 'Register file space for the extra rows and the shared partial sums']
              ],
              source: 'original',
              caption: 'Our summary of the techniques the paper describes. Each costs register file space, which is why the PE\'s register file size matters.'
            },
            {
              t: 'callout',
              kind: 'paper',
              body: 'The paper describes processing several rows in one PE (from different inputs, filters or channels) to increase filter reuse, input reuse and local partial sum accumulation. The chip\'s register file holds a few hundred words per PE (about half a kilobyte). (Our paraphrase from memory. **Reading task:** find how the register file is split among filter, input and partial sum data, and check the 0.5 KB figure.)'
            },
            {
              t: 'quiz',
              id: 'eye-q13',
              q: 'A PE interleaves rows from three different inputs against the same filter row. Which reuse does this raise?',
              options: ['Filter reuse: the same weights are used for more inputs', 'Input reuse across filters', 'Partial sum accumulation across channels', 'Nothing, it only adds work'],
              answer: 0,
              whyNot: [null, 'Input reuse across filters needs several filter rows against one input row.', 'Channel accumulation needs rows from several channels.', 'It makes each weight fetch serve three inputs, which is a real saving.'],
              explain: 'The same filter row is applied to three input rows, so one fetch of the weights serves three inputs.'
            }
          ]
        },
        {
          id: 'fold',
          title: 'Folding and replication: fitting the set onto the array',
          min: 8,
          blocks: [
            { t: 'p', text: 'The logical set for a layer is R rows by E columns. The physical array is fixed. The Eyeriss chip has 12 rows and 14 columns, 168 PEs. If the set is wider than the array, {{folding|folding}} runs it in passes. If rows are left over, {{replication|replication}} stacks several sets to keep PEs busy. Try the AlexNet layers.' },
            { t: 'widget', name: 'foldingLab', title: 'Mapping a PE set onto a 12 x 14 array', tag: 'Original calculator', source: 'original' },
            {
              t: 'callout',
              kind: 'try',
              body: [
                '1. **CONV1** (R = 11, E = 55): the set is 55 columns wide, so it folds into **4** passes. One set of 11 rows fits, leaving 1 row idle. Average utilization is **90%**.',
                '2. **CONV2** (R = 5, E = 27): 2 passes, and **2** sets stack vertically (10 of 12 rows). Utilization is about **80%**.',
                '3. **CONV3 to 5** (R = 3, E = 13): the set fits in one pass, and **4** sets stack (12 rows). Utilization is about **93%**.',
                '4. Choose **Your own** and set R = 7 and E = 35. Only one set fits (7 of 12 rows), it folds into 3 passes, and utilization falls to about **49%**. Awkward shapes waste PEs.'
              ]
            },
            {
              t: 'callout',
              kind: 'paper',
              body: 'The paper describes mapping a layer\'s PE set onto the physical array by folding and replication. The chip papers that follow report PE utilization for AlexNet\'s layers. (Our paraphrase. **Reading task:** find those utilization numbers and compare them with the 90%, 80% and 93% this lab calculates.)'
            },
            {
              t: 'quiz',
              id: 'eye-q14',
              q: 'A layer has a PE set of R = 4 rows and E = 20 columns, mapped onto a 12 x 14 array. How many copies of the set stack vertically, and how many passes does folding need?',
              options: ['3 copies and 2 passes', '4 copies and 1 pass', '1 copy and 2 passes', '3 copies and 1 pass'],
              answer: 0,
              whyNot: [null, 'The set has 20 columns, wider than the 14 available, so one pass is not enough.', '12 / 4 = 3 rows fit, so 3 copies can stack.', 'Twenty columns do not fit in 14, so folding is needed.'],
              explain: 'floor(12 / 4) = 3 copies stack. ceil(20 / 14) = 2 passes cover the width. Average utilization is 3 x 4 x 20 / (168 x 2) = 71.4%.'
            }
          ]
        }
      ]
    },

    /* ------------------------------ Part 4 ------------------------------ */
    {
      id: 'compare',
      title: 'Comparing the dataflows',
      summary: 'Why row stationary adapts to layer shape, what the paper reports, and the chip.',
      steps: [
        {
          id: 'adapts',
          title: 'Why row stationary adapts to the layer shape',
          min: 6,
          blocks: [
            { t: 'p', text: 'Return to the three kinds of reuse. The layer decides which is biggest, and the dataflow decides which it can use. Row stationary does not commit to one. With interleaving it can raise filter reuse (batch), input reuse (filters) and partial sum accumulation (channels) as the layer allows, within the register file budget.' },
            { t: 'widget', name: 'reuseProfile', title: 'The biggest reuse changes with the layer', tag: 'Original calculator, AlexNet layers', source: 'original' },
            {
              t: 'callout',
              kind: 'try',
              body: [
                '1. Step through CONV1 to CONV5 and FC6. Note which bar is the longest for each.',
                '2. For a dataflow that only exploits weight reuse, which layers leave most of its potential unused? (Hint: look for layers where the weight bar is short.)',
                '3. Raise the batch on FC6. Weight reuse grows with the batch, so a fully connected layer is poor at batch 1 and far better at batch 64 for dataflows that depend on weight reuse.'
              ]
            },
            {
              t: 'callout',
              kind: 'paper',
              body: 'The paper argues that row stationary adapts to different CNN shape configurations and reduces all types of data movement, where dataflows that exploit only one kind of reuse do not. This is a central claim of the abstract.'
            },
            {
              t: 'quiz',
              id: 'eye-q15',
              q: 'Why might a dataflow built entirely around weight reuse do poorly on a fully connected layer at batch size 1?',
              options: ['Each weight is used only once, so there is no weight reuse to capture', 'Fully connected layers have no weights', 'The layer has too many channels', 'It needs a bigger clock'],
              answer: 0,
              whyNot: [null, 'Fully connected layers are mostly weights.', 'Channel count is not what limits weight reuse.', 'Clock speed does not create reuse.'],
              explain: 'With one input, a fully connected weight takes part in one MAC. The dataflow\'s strength has nothing to work with.'
            }
          ]
        },
        {
          id: 'results',
          title: 'What the paper reports',
          min: 6,
          blocks: [
            { t: 'p', text: 'Here are the headline results, from the abstract, and where each one needs checking.' },
            {
              t: 'table',
              head: ['Claim', 'Where it comes from', 'Status in this lesson'],
              rows: [
                ['On the convolutional layers of AlexNet, row stationary uses 1.4 to 2.5 times less energy than the other dataflows', 'The analysis framework (abstract)', 'Confirmed through a secondary source. Read the figure for each layer.'],
                ['On fully connected layers, row stationary is at least 1.3 times better for batch sizes above 16', 'The analysis framework (abstract)', 'From memory. Check the exact wording.'],
                ['The row stationary dataflow was demonstrated on a fabricated chip, which verified the energy analysis', 'The chip (abstract)', 'From memory. Check what was verified and how.']
              ],
              source: 'paper',
              caption: 'Our summary of the abstract. Treat the status column as a to-do list for your copy.'
            },
            {
              t: 'quiz',
              id: 'eye-q16',
              q: 'Another dataflow uses 100 units of energy on a layer. Row stationary is 2.5 times better. How much does it use?',
              options: ['40 units', '250 units', '25 units', '97.5 units'],
              answer: 0,
              whyNot: [null, 'That multiplies instead of dividing. Better means lower energy.', 'That would be 4 times better.', 'That subtracts 2.5 instead of dividing by it.'],
              explain: '100 / 2.5 = 40 units. A 1.4 times advantage would be 100 / 1.4 = 71 units.'
            },
            {
              t: 'callout',
              kind: 'try',
              title: 'Reading task',
              body: [
                'Find the figures that break energy down by storage level and by data type, and answer for row stationary:',
                '1. Which storage level uses the largest share of the energy?',
                '2. Which data type uses the largest share?',
                '3. How does that differ from weight stationary and output stationary?',
                'The pattern is the evidence for the claim that row stationary reduces all types of data movement.'
              ]
            }
          ]
        },
        {
          id: 'chip',
          title: 'From analysis to silicon: the Eyeriss chip',
          min: 6,
          blocks: [
            { t: 'p', text: 'The analysis is a model. The authors also built a chip to check it. The numbers below come from the authors\' later papers about the same chip, so read them as a follow-up, not as the ISCA paper\'s own results.' },
            {
              t: 'table',
              head: ['Item', 'Value', 'Status'],
              rows: [
                ['PE array', '168 PEs (12 rows x 14 columns)', 'Confirmed through a secondary source'],
                ['Global buffer', 'About 108 KB', 'From memory. Check it.'],
                ['Data width', '16-bit fixed point', 'From memory. Check it.'],
                ['AlexNet convolution layers, batch 4', '35 frames per second at 278 mW', 'Confirmed through a secondary source (the journal paper on the chip)'],
                ['DRAM accesses for AlexNet convolution layers', '0.0029 per MAC', 'Confirmed through a secondary source']
              ],
              source: 'paper',
              caption: 'Figures about the chip, from the authors\' follow-up work. Check them in the papers.'
            },
            { t: 'p', text: 'The last row connects to Part 1. In the worst case each MAC makes 4 DRAM accesses. The chip makes **0.0029**. That is 4 / 0.0029, about **1,380 times fewer**. With DRAM at 200 times a MAC, DRAM energy per MAC falls from 800 units to about **0.58**.' },
            {
              t: 'callout',
              kind: 'note',
              title: 'Later context',
              body: 'The chip also compresses feature maps with {{rlc|run-length coding}} and gates the arithmetic when an input is zero. These features are described in the chip papers, not in the dataflow paper, and they add to the savings.'
            },
            {
              t: 'quiz',
              id: 'eye-q17',
              q: 'The chip makes 0.0029 DRAM accesses per MAC for AlexNet\'s convolution layers. The worst case is 4. About how many times fewer is that?',
              options: ['About 1,380 times fewer', 'About 14 times fewer', 'About 200 times fewer', 'About 4 times fewer'],
              answer: 0,
              whyNot: [null, 'That would be 0.29 accesses per MAC.', '200 is the energy cost ratio of DRAM, not the access ratio.', 'That would be one access per MAC.'],
              explain: '4 / 0.0029 = 1,379.'
            }
          ]
        }
      ]
    }
  ];
})();
