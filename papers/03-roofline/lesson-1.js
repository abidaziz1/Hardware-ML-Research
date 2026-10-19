/* Paper 3 lesson, parts 0 to 2: start, the idea, reading the roofline. */
(function () {
  'use strict';
  window.ROOF = window.ROOF || {};

  window.ROOF.p1 = [
    /* ------------------------------ Part 0 ------------------------------ */
    {
      id: 'start',
      title: 'Start here',
      summary: 'What the paper is, what you will learn, and how to use this lesson.',
      steps: [
        {
          id: 'welcome',
          title: 'Welcome to Paper 3',
          min: 3,
          blocks: [
            { t: 'p', lead: true, text: 'A programmer tunes a loop for a week and gets 3% faster. An architect doubles the number of cores and the program does not speed up at all. Both are guessing, because neither knows what is holding the program back. This 2009 paper gives you one chart that says: the Roofline model. It is the quickest tool in this course for deciding whether a program needs faster arithmetic or faster memory.' },
            {
              t: 'facts',
              rows: [
                ['Paper', 'Roofline: An Insightful Visual Performance Model for Multicore Architectures'],
                ['Authors', 'Samuel Williams, Andrew Waterman, David Patterson (UC Berkeley)'],
                ['Venue', 'Communications of the ACM, April 2009'],
                ['Read the original', 'Search for the title in the ACM Digital Library, or ask your library. It is short (about 10 pages) and written for general readers. Part 6 gives a reading map.'],
                ['Time', 'About 2 hours for the lesson, plus 40 minutes for the practice problems at the end. Your place is saved in this browser.'],
                ['You should know', 'What a cache is, roughly. Paper 1 (the energy table) helps, but you can start here.']
              ]
            },
            { t: 'h', text: 'By the end you can' },
            {
              t: 'list',
              ordered: true,
              items: [
                'Compute the {{operational-intensity|operational intensity}} of a kernel by counting operations and DRAM bytes.',
                'Draw the {{roofline}} of a machine from its peak compute and its memory bandwidth, and find its {{ridge-point|ridge point}}.',
                'Read a kernel\'s attainable performance off the chart and say whether it is {{memory-bound|memory-bound}} or {{compute-bound|compute-bound}}.',
                'Decide whether more compute or more bandwidth would help a given kernel.',
                'Explain what {{ceiling|ceilings}} are and how optimizations lift a program through them.',
                'Raise operational intensity with tiling, fusion, lower precision and batching, and compute the effect.',
                'Put neural network layers on a roofline and explain why a fully connected layer at batch size 1 is so far under the roof.'
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
            { t: 'p', text: 'Every program needs two resources: arithmetic units and memory bandwidth. The paper plots **attainable performance** against **operational intensity** (operations per byte of DRAM traffic) on logarithmic axes. For a given machine the result is a roof: a slanted line from memory bandwidth, then a flat line from peak compute. The point where they meet is the **ridge**. A kernel\'s intensity picks a spot on the horizontal axis, and the roof above that spot is the best it can ever do.' },
            { t: 'p', text: 'Lower lines under the roof, called ceilings, mark what you reach without particular optimizations. Left of the ridge the fix is to raise operational intensity or bandwidth. Right of the ridge the fix is to use the arithmetic units better. The chart tells programmers which optimization to try next and tells architects what to improve.' },
            { t: 'callout', kind: 'idea', body: 'Attainable performance = the smaller of (peak compute) and (memory bandwidth x operational intensity). One line of arithmetic, one chart.' },
            { t: 'h', text: 'The paper in four questions' },
            {
              t: 'flip',
              hint: 'Click to see the answer',
              cards: [
                { front: 'What problem does it solve?', back: 'Multicore chips were getting more varied and harder to tune. Programmers and architects lacked a simple way to tell what limits a program.' },
                { front: 'What is the core idea?', back: 'Bound and bottleneck analysis: performance is capped by either compute or memory bandwidth, and the cap depends on operational intensity. Draw it on one log-log chart.' },
                { front: 'How do the authors show it works?', back: 'They draw the roofline of several multicore computers and place a handful of scientific kernels on them, then use the ceilings to explain which optimizations matter. (Check which machines and kernels in your copy.)' },
                { front: 'What should you question?', back: 'The roofline is an upper bound, not a prediction. It ignores latency, assumes compute and memory overlap perfectly, and its inputs (peak, bandwidth, intensity) must be measured with care.' }
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
      id: 'idea',
      title: 'Two ways to be slow',
      summary: 'The bakery, operational intensity, and the roofline chart.',
      steps: [
        {
          id: 'bakery',
          title: 'The bakery: ovens and a delivery truck',
          min: 5,
          blocks: [
            {
              t: 'callout',
              kind: 'example',
              body: 'A bakery has ovens that can bake 100 loaves an hour. Flour arrives by one truck that delivers 25 kg an hour. Each loaf needs 0.5 kg of flour, so a kilogram makes 2 loaves. How many loaves per hour can the bakery sell? The ovens allow 100. The truck allows 25 x 2 = 50. The bakery sells **50**, the smaller number.'
            },
            { t: 'p', text: 'Translate it to a computer. The ovens are the chip\'s **peak compute**. The truck is **memory bandwidth**. Loaves per kilogram of flour is the program\'s **operational intensity**: how much arithmetic it does for each byte it brings in. That gives the whole model in one line.' },
            { t: 'callout', kind: 'idea', body: '**Attainable performance = min( peak compute , memory bandwidth x operational intensity )**' },
            {
              t: 'quiz',
              id: 'roof-q1',
              kind: 'predict',
              q: 'The bakery buys 2 more ovens, so it can now bake 200 loaves an hour. The truck and the recipe do not change. How many loaves per hour can it sell?',
              options: ['Still 50', '100', '200', '75'],
              answer: 0,
              whyNot: [null, 'The truck still brings only 25 kg an hour, which makes 50 loaves. More ovens cannot bake flour that has not arrived.', 'That would need 100 kg of flour an hour.', 'There is no reason for a midpoint. The smaller limit wins.'],
              explain: 'The truck is the bottleneck: 25 kg x 2 loaves per kg = 50. The ovens now allow 200, but that limit is not the binding one.'
            },
            {
              t: 'quiz',
              id: 'roof-q2',
              q: 'Instead the bakery adds a second truck (50 kg an hour) and keeps its 100-loaf ovens. How many loaves per hour now?',
              options: ['50', '100', '200', '150'],
              answer: 1,
              whyNot: ['That was the answer before the new truck.', null, 'The ovens cannot bake more than 100 an hour. The truck now allows 50 x 2 = 100 as well.', 'The ovens cap the bakery at 100.'],
              explain: 'The trucks now allow 50 kg x 2 = 100 loaves and the ovens allow 100, so the bakery sells 100. It is now exactly balanced. Another truck would not help, and neither would another oven by itself.'
            },
            { t: 'callout', kind: 'paper', body: 'The paper proposes exactly this bound: performance is limited by either peak floating-point performance or by memory bandwidth times operational intensity, whichever is lower. (Our paraphrase of the model. Check its wording of the formula in your copy.)' }
          ]
        },
        {
          id: 'oi',
          title: 'Operational intensity: operations per DRAM byte',
          min: 8,
          blocks: [
            { t: 'p', text: '{{operational-intensity|Operational intensity}} is the number of operations a kernel does divided by the **bytes it moves to and from DRAM**. DRAM, not every memory access: a cache absorbs repeated reads, so only the traffic that actually reaches main memory counts. To compute it, count the operations, count those bytes, and divide.' },
            {
              t: 'callout',
              kind: 'example',
              body: 'Adding two lists of numbers, c = a + b. For every element you read two values and write one (3 x 4 = 12 bytes of 32-bit values) and do one addition. That is 1 operation per 12 bytes, an operational intensity of 0.083. It is the delivery truck bringing a bag of flour for a single bun.'
            },
            { t: 'widget', name: 'oiCalc', title: 'Operational intensity of common kernels', tag: 'Original calculator, toy machines', source: 'original' },
            {
              t: 'callout',
              kind: 'try',
              body: [
                '1. Keep **32-bit float** and **CPU-like**. The vector add has 0.083 operations per byte, so it reaches only about 2% of peak. It is memory-bound. So is the dot product and the matrix-vector product.',
                '2. The matrix multiply with 32 x 32 tiles has 8 operations per byte and reaches full peak on this machine. With perfect reuse it would be 171.',
                '3. Switch to **8-bit integer**. Every operational intensity is 4 times higher, because each value takes a quarter of the bytes. AlexNet\'s FC6 layer at batch 1 goes from 0.5 to 2.',
                '4. Switch the machine to **Accelerator-like**. Every kernel on the list is now memory-bound, even the tiled matrix multiply (8) and the one with perfect reuse (171). A machine with huge compute needs enormous reuse.'
              ]
            },
            {
              t: 'quiz',
              id: 'roof-q3',
              q: 'A kernel computes c[i] = a[i] + b[i] on 32-bit floats. What is its operational intensity, counting each value moved once?',
              options: ['1 operation per 12 bytes, about 0.083', '1 operation per 4 bytes, 0.25', '3 operations per byte', '12 operations per byte'],
              answer: 0,
              whyNot: [null, 'That counts only one of the three values moved (two reads and one write).', 'The kernel does one addition per element, not three.', 'That inverts the ratio. Intensity is operations divided by bytes.'],
              explain: 'Each element reads 2 values and writes 1, which is 12 bytes, for 1 addition.'
            },
            {
              t: 'quiz',
              id: 'roof-q4',
              q: 'You switch a kernel from 32-bit floats to 16-bit values and nothing else changes. What happens to its operational intensity?',
              options: ['It doubles', 'It halves', 'It does not change', 'It becomes zero'],
              answer: 0,
              whyNot: [null, 'The bytes fell by half, and bytes are in the denominator.', 'The same operations now move half the bytes, so the ratio rises.', 'The operations still happen.'],
              explain: 'Operations stay the same and the bytes halve, so operations per byte double.'
            },
            {
              t: 'callout',
              kind: 'paper',
              body: 'The paper names this quantity operational intensity and measures it in operations per byte of DRAM traffic (traffic after the caches have filtered the accesses). (Our paraphrase from memory. **Reading task:** find the exact definition and note how it differs from the arithmetic intensity used in other texts.)'
            }
          ]
        },
        {
          id: 'chart',
          title: 'Drawing the roofline',
          min: 8,
          blocks: [
            { t: 'p', text: 'Put operational intensity on the horizontal axis and attainable performance on the vertical axis. For a fixed machine, bandwidth x intensity is a straight line that rises with intensity, and peak compute is a flat line. Take the lower of the two at every intensity and you have a roof. Both axes are {{log-scale|logarithmic}}, so the rising line is a 45-degree diagonal.' },
            { t: 'widget', name: 'rooflineBasic', title: 'The roofline of one machine', tag: 'Toy model, not from the paper', opts: {} },
            {
              t: 'callout',
              kind: 'try',
              body: [
                '1. Keep the defaults (100 G ops/s, 25 GB/s). The ridge is at **4** operations per byte. The vector add sits far left on the slope. The tiled matrix multiply sits far right on the flat part.',
                '2. Drag your kernel to **2**. It reaches 50 G ops/s, half of peak. Drag it to **4**, the ridge, and it reaches the full 100.',
                '3. Raise **peak compute to 400**. The ridge moves to 16. Put your kernel at **8**: before the change it reached 100%, now it reaches only 50% of the new peak. A faster chip with the same memory made this kernel memory-bound.',
                '4. Raise bandwidth to 100 GB/s with peak at 100. The ridge falls to 1 and most kernels reach the flat roof.'
              ]
            },
            {
              t: 'quiz',
              id: 'roof-q5',
              q: 'A machine has 200 G ops/s peak and 50 GB/s of bandwidth. What is its ridge point?',
              options: ['4 ops per byte', '250 ops per byte', '0.25 ops per byte', '10,000 ops per byte'],
              answer: 0,
              whyNot: [null, 'You added the two numbers. The ridge is peak divided by bandwidth.', 'You divided bandwidth by peak. The ridge is peak over bandwidth, in operations per byte.', 'You multiplied the two numbers.'],
              explain: 'Ridge = peak / bandwidth = 200 G ops/s / 50 GB/s = 4 operations per byte.'
            },
            {
              t: 'quiz',
              id: 'roof-q6',
              q: 'On that machine, a kernel has an operational intensity of 2. What is its attainable performance?',
              options: ['100 G ops/s', '200 G ops/s', '50 G ops/s', '25 G ops/s'],
              answer: 0,
              whyNot: [null, 'That is the peak, which only kernels at or beyond the ridge of 4 can reach.', 'That would use 25 GB/s. The machine has 50 GB/s.', 'That would be an intensity of 0.5.'],
              explain: 'min(200, 50 GB/s x 2) = min(200, 100) = 100 G ops/s.'
            }
          ]
        }
      ]
    },

    /* ------------------------------ Part 2 ------------------------------ */
    {
      id: 'reading',
      title: 'Reading the roofline',
      summary: 'The ridge point, compute against bandwidth, and ceilings.',
      steps: [
        {
          id: 'ridge',
          title: 'The ridge point and machine balance',
          min: 6,
          blocks: [
            { t: 'p', text: 'The {{ridge-point|ridge point}} is where the slope meets the flat roof. Peak divided by bandwidth gives it, and it has a direct meaning: **how many operations the machine can do for each byte it can fetch**. People also call it the {{machine-balance|machine balance}}. A kernel with at least that much intensity can keep the arithmetic units busy. Anything below leaves them waiting.' },
            {
              t: 'callout',
              kind: 'example',
              body: 'Two bakeries. Bakery A has ovens for 100 loaves an hour and a truck for 25 kg an hour. Bakery B has ovens for 400 loaves an hour and a truck for 50 kg an hour. B has four times the ovens and only twice the flour. A recipe of 6 loaves per kg feeds A fully (100 loaves) but leaves B at 300 of its 400.'
            },
            {
              t: 'table',
              head: ['Machine', 'Peak', 'Bandwidth', 'Ridge (peak / bandwidth)', 'A kernel with intensity 6 reaches'],
              rows: [
                ['A', '100 G ops/s', '25 GB/s', '4', '100 G ops/s (100% of peak)'],
                ['B', '400 G ops/s', '50 GB/s', '8', '300 G ops/s (75% of peak)']
              ],
              source: 'toy',
              caption: 'Invented machines. B is faster in absolute terms, but its ridge sits farther right, so it is harder to keep fully busy.'
            },
            { t: 'p', text: 'Over decades, peak compute grew faster than memory bandwidth, so ridge points drifted to the right. Researchers named this trend the {{memory-wall|memory wall}}. More and more kernels sit left of the ridge, where the arithmetic is not the limit.' },
            {
              t: 'quiz',
              id: 'roof-q7',
              q: 'Machine B above (400 G ops/s, 50 GB/s) runs a kernel with an operational intensity of 2. What fraction of its peak does the kernel reach?',
              options: ['25%', '50%', '75%', '100%'],
              answer: 0,
              whyNot: [null, 'That would be an intensity of 4.', 'That is the kernel at intensity 6.', 'Only kernels at or beyond the ridge of 8 reach the full peak.'],
              explain: 'min(400, 50 x 2) = 100 G ops/s, which is 100 / 400 = 25% of peak.'
            }
          ]
        },
        {
          id: 'upgrade',
          title: 'More compute or more bandwidth?',
          min: 7,
          blocks: [
            { t: 'p', text: 'The roofline answers a question that costs real money: should the next chip have more arithmetic, more memory bandwidth, or both? Use the lab. The baseline is the 100 G ops/s, 25 GB/s machine with its ridge at 4.' },
            { t: 'widget', name: 'upgradeLab', title: 'What does each upgrade buy?', tag: 'Toy model, not from the paper' },
            {
              t: 'callout',
              kind: 'try',
              body: [
                '1. Set intensity **2** (left of the ridge). **Compute 2x** gives a speed-up of exactly 1. **Bandwidth 2x** gives 2.',
                '2. Set intensity **16** (right of the ridge). Now the opposite holds. **Compute 2x** gives 2x and **bandwidth 2x** gives nothing.',
                '3. Set intensity **4**, the ridge itself. Neither upgrade alone helps, because the other limit takes over right away. Only **both 2x** moves it, to 2x.'
              ]
            },
            {
              t: 'quiz',
              id: 'roof-q8',
              q: 'A kernel sits at an operational intensity of 1 on the baseline machine. Which single upgrade helps it, and by how much?',
              options: ['Doubling bandwidth, about 2x', 'Doubling compute, about 2x', 'Either one, about 2x', 'Neither, it is already at peak'],
              answer: 0,
              whyNot: [null, 'Intensity 1 is far left of the ridge at 4. The kernel is limited by bandwidth and cannot use extra compute.', 'Only bandwidth moves it.', 'At intensity 1 it reaches only 25 of 100 G ops/s.'],
              explain: 'The kernel is memory-bound (25 G ops/s). Doubling bandwidth raises it to 50. Doubling compute leaves it at 25.'
            }
          ]
        },
        {
          id: 'ceilings',
          title: 'Ceilings: what keeps you under the roof',
          min: 8,
          blocks: [
            {
              t: 'callout',
              kind: 'example',
              body: 'The bakery\'s ovens can bake 100 loaves an hour only if every tray is full, the oven doors are timed well and the bakers load them in a smart order. A bakery that bakes one loaf per tray bakes far fewer. The roof says what the bakery could do. The ceilings say what it does until each habit is fixed.'
            },
            { t: 'p', text: 'The roof assumes perfectly tuned code. Real code sits under lower lines called {{ceiling|ceilings}}, one per missing optimization. On the compute side, examples are not using {{simd|SIMD}} instructions or not exposing {{ilp|instruction-level parallelism}}. On the bandwidth side, examples are not {{prefetch|prefetching}} data or ignoring {{numa|memory affinity}}. Applying an optimization lifts you through its ceiling.' },
            { t: 'widget', name: 'ceilingsLab', title: 'Turn the optimizations on, one at a time', tag: 'Toy model, not from the paper' },
            {
              t: 'callout',
              kind: 'try',
              body: [
                '1. Start with intensity **4** and everything off. The kernel reaches only 12.5 G ops/s, under the flat compute ceiling.',
                '2. Turn on **SIMD**. Now it reaches 25, and the lab says memory is the limit. Fixing the first bottleneck exposed the second.',
                '3. Turn on **prefetching**. It reaches 50. Now compute limits again.',
                '4. Turn on **memory affinity** (still 50, still compute-limited), then **instruction parallelism**. Now it reaches the full 100 G ops/s. You needed all four, in an order the chart revealed.'
              ]
            },
            {
              t: 'callout',
              kind: 'paper',
              body: 'The paper adds ceilings for computation (for example, code that does not use SIMD instructions or does not balance multiplies and adds) and for memory bandwidth (for example, code without prefetching or without good data placement), and uses them to say which optimizations a programmer should try. (Our paraphrase. **Reading task:** list the ceilings the paper draws for each machine, and the order it suggests for applying the optimizations.)'
            },
            {
              t: 'quiz',
              id: 'roof-q9',
              q: 'Your kernel is at 25 G ops/s on a sloped ceiling labeled "no prefetching". What is the best next step?',
              options: ['Add prefetching', 'Use more SIMD instructions', 'Raise the clock speed', 'Buy more cores'],
              answer: 0,
              whyNot: [null, 'The kernel is on the slope, so compute is not the limit. SIMD would not move it.', 'A faster clock raises the flat roof, not the bandwidth the kernel can reach.', 'More cores raise the flat roof. The kernel is not limited by it.'],
              explain: 'A sloped ceiling is a bandwidth limit. The optimization named by its label is the way through it.'
            }
          ]
        }
      ]
    }
  ];
})();
