/* Paper 2 lesson, parts 0 to 2: start, DNN math for hardware people, how CPUs and GPUs run convolutions. */
(function () {
  'use strict';
  window.SZE = window.SZE || {};

  window.SZE.p1 = [
    /* ------------------------------ Part 0 ------------------------------ */
    {
      id: 'start',
      title: 'Start here',
      summary: 'What the survey is, what you will learn, and how to use this lesson.',
      steps: [
        {
          id: 'welcome',
          title: 'Welcome to Paper 2',
          min: 3,
          blocks: [
            { t: 'p', lead: true, text: 'Paper 1 gave you a price list: arithmetic is cheap and moving data is expensive. This survey applies that view to deep neural networks. It explains the computation, shows how CPUs and GPUs run it, explains why data movement dominates, and describes how accelerators and network changes cut it. It is also the best single map of the field, which is why it is Paper 2.' },
            {
              t: 'facts',
              rows: [
                ['Paper', 'Efficient Processing of Deep Neural Networks: A Tutorial and Survey'],
                ['Authors', 'Vivienne Sze, Yu-Hsin Chen, Tien-Ju Yang, Joel S. Emer (MIT)'],
                ['Venue', 'Proceedings of the IEEE, December 2017'],
                ['Read the original', '[arXiv 1703.09039](https://arxiv.org/abs/1703.09039). It is long (about 30 pages) and reads like a textbook chapter.'],
                ['Time', 'About 3 hours for the lesson, plus 40 minutes for the practice problems at the end. Your place is saved in this browser.'],
                ['You should know', 'What a matrix multiply is and roughly what a neural network does. Paper 1 helps, because its energy table is used again here.']
              ]
            },
            { t: 'h', text: 'By the end you can' },
            {
              t: 'list',
              ordered: true,
              items: [
                'Compute the output size, weight count and {{mac|MAC}} count of a convolution layer from its shape.',
                'Explain how CPUs and GPUs turn a convolution into a matrix multiply, and what that costs.',
                'Explain why each MAC needs four memory accesses and why data movement dominates energy.',
                'Name the three kinds of data reuse in a CNN and calculate how often each is available.',
                'Describe the four dataflows (weight stationary, output stationary, no local reuse, row stationary) in one sentence each.',
                'Explain how fewer bits, zeros and compact layers cut cost, and why a MAC count alone can mislead.',
                'Evaluate a hardware claim by asking for peak against achieved, batch size, network and accuracy.'
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
          title: 'The survey in 60 seconds',
          min: 3,
          blocks: [
            { t: 'p', text: 'Deep networks give excellent accuracy, but one image can need billions of multiply-accumulates and tens of millions of weights. The survey does five jobs. It explains what the layers compute. It shows how CPUs and GPUs run them. It explains that moving data costs far more than the arithmetic, so the main design question for an accelerator is how to reuse data close to the arithmetic. It describes changes to the network itself (fewer bits, zeros, compact layers) that help hardware. And it lists the metrics you need to compare hardware fairly.' },
            { t: 'callout', kind: 'idea', body: 'The same arithmetic can cost a hundred times more or less energy depending on where its data comes from. A good accelerator is mostly a plan for data movement.' },
            { t: 'h', text: 'The survey in four questions' },
            {
              t: 'flip',
              hint: 'Click to see the answer',
              cards: [
                { front: 'What problem does it address?', back: 'Neural network inference and training are expensive in energy and time. How should hardware and networks be designed to make them efficient?' },
                { front: 'What is the core idea?', back: 'Data movement, not arithmetic, dominates energy. Organize the computation (the dataflow) so data stays in small nearby memories and is reused many times.' },
                { front: 'What does the survey cover?', back: 'Layer types and popular networks, how CPUs and GPUs compute convolutions, accelerator architectures and dataflows, network-side changes such as precision and sparsity, and benchmarking metrics.' },
                { front: 'What should you question?', back: 'It is a 2017 survey of mostly CNNs, so it predates transformers. Compare any numbers it quotes with the original sources, and notice which claims are surveyed work and which are the authors\' own results.' }
              ]
            },
            { t: 'h', text: 'The course map' },
            { t: 'p', text: 'Nine short parts, the last with practice problems. Click any card to jump there.' },
            { t: 'partmap', skipFirst: true }
          ]
        }
      ]
    },

    /* ------------------------------ Part 1 ------------------------------ */
    {
      id: 'basics',
      title: 'DNN math for hardware people',
      summary: 'MACs, fully connected and convolution layers, shapes, and popular networks.',
      steps: [
        {
          id: 'neuron-mac',
          title: 'From a neuron to a MAC',
          min: 5,
          blocks: [
            {
              t: 'callout',
              kind: 'example',
              body: 'A grocery bill: for each item, multiply the price by the quantity, then add everything up. A neuron does the same. The prices are its **weights**, the quantities are its **inputs**, and the bill is its output. Each "price x quantity, added to the running total" is one {{mac|multiply-accumulate (MAC)}}.'
            },
            { t: 'p', text: 'A {{neural-network|neural network}} layer is many neurons side by side. In a {{fc-layer|fully connected layer}}, every output uses every input, so a layer with C inputs and M outputs does **C x M** MACs per input and holds **C x M** {{weight|weights}}. That is a matrix times a vector.' },
            { t: 'callout', kind: 'idea', body: '**MACs** measure how much arithmetic a layer needs. **Weights** measure how much memory it needs. The ratio of the two is how many times, on average, each weight gets used.' },
            {
              t: 'quiz',
              id: 'sze-q1',
              kind: 'predict',
              q: 'A fully connected layer maps 4,096 inputs to 4,096 outputs. How many MACs does it do for one input?',
              options: ['4,096', '8,192', 'About 16.8 million', 'About 16.8 billion'],
              answer: 2,
              whyNot: ['That is the number of inputs, not the MACs. Each of the 4,096 outputs needs 4,096 MACs.', 'That would be 2 x 4,096, as if each output used only two inputs.', null, 'That would be 4,096 cubed. A layer has only inputs x outputs MACs.'],
              explain: '4,096 x 4,096 = 16,777,216 MACs, and the layer holds the same number of weights.'
            },
            {
              t: 'quiz',
              id: 'sze-q2',
              q: 'You run that layer on a single input (batch size 1). How many times is each weight used?',
              options: ['Once', '4,096 times', '16.8 million times', 'It depends on the clock'],
              answer: 0,
              whyNot: [null, 'That would be true for a batch of 4,096 inputs. One input uses each weight once.', 'Weights do not get used that often. The layer only has that many weights.', 'Clock speed changes how fast, not how often.'],
              explain: 'With one input there are exactly as many MACs as weights. Every weight is fetched, used once and discarded, so the layer is limited by memory, not arithmetic. Running a batch reuses each weight once per input.'
            }
          ]
        },
        {
          id: 'conv-layer',
          title: 'The convolution layer',
          min: 8,
          blocks: [
            {
              t: 'callout',
              kind: 'example',
              body: 'A small square window slides over a photo. At each spot you compare the window with a stencil, for example "does this patch look like a vertical edge?", and write down one score. The stencil is the {{filter}}. The grid of scores is the output.'
            },
            { t: 'p', text: 'This is a {{convolution|convolution (CONV) layer}}. The input is an {{ifmap|input feature map}} with several {{channel|channels}} (a color photo has three). Each filter spans all of them, so one filter has **C x R x S** weights. A layer has **M** filters and produces M output channels, the {{ofmap|output feature map}}. The window moves by the {{stride}} U, and {{padding}} adds zeros around the edge.' },
            { t: 'widget', name: 'convWindow', title: 'A filter sliding over an input', tag: 'Original diagram', source: 'original', opts: {} },
            {
              t: 'callout',
              kind: 'try',
              body: [
                '1. Keep the **3 x 3** filter, **stride 1** and input size **7**. There are 25 positions (a 5 x 5 output). Switch on **Show use counts**. Every weight is used 25 times, a corner input value once and a middle value 9 times.',
                '2. Choose **Stride 2**. The output shrinks to 3 x 3 and the most-used input value is now used 4 times. Bigger strides mean less reuse.',
                '3. Go back to **Stride 1** and choose the **1 x 1** filter. Every input value is used exactly once, so there is no overlap at all. Each weight is still used at every position (49 times).'
              ]
            },
            {
              t: 'callout',
              kind: 'paper',
              body: 'The survey describes the layer with this notation: N inputs in a batch, M filters, C channels, an H x W input, R x S filters, an E x F output, and stride U. Each output value is a bias plus a sum over the filter\'s channels and positions of input times weight, with E = (H - R + U) / U and F = (W - S + U) / U. This lesson uses the same letters, because every later paper does.'
            },
            {
              t: 'code',
              code: '# One CONV layer, written as loops (our rendering with the survey\'s letters)\nfor n in range(N):            # inputs in the batch\n  for m in range(M):          # filters = output channels\n    for e in range(E):        # output rows\n      for f in range(F):      # output columns\n        out = bias[m]\n        for c in range(C):    # input channels\n          for r in range(R):  # filter rows\n            for s in range(S):# filter columns\n              out += ifmap[n][c][U*e + r][U*f + s] * weight[m][c][r][s]   # one MAC\n        ofmap[n][m][e][f] = out',
              caption: 'Seven nested loops and one MAC at the center. Every accelerator in this course is a way of ordering, splitting and parallelizing these loops.'
            },
            {
              t: 'quiz',
              id: 'sze-q3',
              q: 'A 7 x 7 input is convolved with a 3 x 3 filter, stride 1, no padding. What is the output size?',
              options: ['7 x 7', '5 x 5', '3 x 3', '9 x 9'],
              answer: 1,
              whyNot: ['That is the output size only with padding of 1. Without padding the window cannot be centered on border pixels.', null, 'That would be the output for stride 2.', 'The output cannot be larger than the input without padding.'],
              explain: 'E = (H - R + U) / U = (7 - 3 + 1) / 1 = 5.'
            }
          ]
        },
        {
          id: 'shape',
          title: 'Sizing a layer: MACs, weights and values',
          min: 8,
          blocks: [
            { t: 'p', text: 'Three numbers describe how heavy a layer is: its **MACs**, its **weights** (memory for the filters), and its **values** (the input and output feature maps). Use the calculator to size real layers from AlexNet and VGG-16.' },
            { t: 'widget', name: 'convShape', title: 'Size a convolution layer', tag: 'Original calculator, real layer shapes', source: 'original', opts: {} },
            {
              t: 'callout',
              kind: 'try',
              body: [
                '1. **AlexNet CONV1** (227 x 227 x 3 input, 96 filters of 11 x 11, stride 4): the output is 55 x 55, the layer does about **105 million MACs** with only **34,848 weights**. Each weight is used 3,025 times.',
                '2. Switch to **AlexNet CONV3**. MACs rise to about 150 million, but the weights jump to **884,736**, 25 times more, and each weight is used only 169 times. Early layers have big maps and few weights. Later layers have small maps and many weights.',
                '3. Choose **1 x 1 layer**. A 1 x 1 filter has only C weights per filter, so the layer has 16,384 weights for 51 million MACs.',
                '4. In AlexNet CONV1, set the batch **N to 16**. MACs and the reuse of each weight both grow 16 times, while the weights stay the same.'
              ]
            },
            {
              t: 'quiz',
              id: 'sze-q4',
              kind: 'predict',
              q: 'Which AlexNet layer has more weights: CONV1 (3 input channels, 11 x 11 filters, 96 filters) or CONV3 (256 input channels, 3 x 3 filters, 384 filters)?',
              options: ['CONV1, because its filters are bigger', 'CONV3, by about 25 times', 'They are equal', 'CONV1, because it has more MACs'],
              answer: 1,
              whyNot: ['The 11 x 11 filters are bigger, but they have only 3 channels. CONV3\'s filters span 256 channels.', null, 'Count: CONV1 has 96 x 3 x 11 x 11 = 34,848. CONV3 has 384 x 256 x 3 x 3 = 884,736.', 'CONV1 has fewer MACs than CONV3 (105 million against 149 million), and MACs do not determine the weight count.'],
              explain: 'Weights = M x C x R x S. CONV1: 96 x 3 x 121 = 34,848. CONV3: 384 x 256 x 9 = 884,736, about 25 times more.'
            },
            {
              t: 'quiz',
              id: 'sze-q5',
              q: 'A layer has M = 96 filters, C = 3 channels, 11 x 11 filters and a 55 x 55 output, with batch 1. How many MACs?',
              options: ['About 35 thousand', 'About 105 million', 'About 11 million', 'About 1.1 billion'],
              answer: 1,
              whyNot: ['That is the number of weights (96 x 3 x 11 x 11), not the MACs. Each weight is used at 55 x 55 positions.', null, 'That comes from dropping one factor of 11. A filter has R x S = 11 x 11 = 121 weights per channel.', 'That is ten times too large. Check the multiplication of 11 x 11 x 3.'],
              explain: 'MACs = E x F x M x C x R x S = 55 x 55 x 96 x 3 x 11 x 11 = 105.4 million.'
            }
          ]
        },
        {
          id: 'networks',
          title: 'Other layers and popular networks',
          min: 6,
          blocks: [
            { t: 'p', text: 'Convolution and fully connected layers hold nearly all the MACs. The other layers are cheap for hardware: {{relu|ReLU}} sets negative values to zero (which creates zeros the hardware can exploit later), {{pooling}} shrinks a feature map, and {{batch-norm|batch normalization}} rescales each channel. They do a few operations per value, with no reuse to exploit.' },
            { t: 'p', text: 'Networks have grown steeply. This table counts the MACs and weights of three classic image networks from their published layer shapes. We computed the three rows ourselves in `experiments/numbers.cjs`.' },
            {
              t: 'table',
              head: ['Network', 'MACs per image', 'Weights', 'MACs per weight (average reuse)'],
              rows: [
                ['LeNet (a 2-CONV, 2-FC version, 1998 style)', '2.3 million', '431 thousand', '5'],
                ['AlexNet (2012)', '724 million', '61 million', '12'],
                ['VGG-16 (2014)', '15.5 billion', '138 million', '112']
              ],
              source: 'original',
              caption: 'Our counts from layer shapes. The survey tabulates these networks too (plus GoogLeNet and ResNet). Compare our numbers with its table.'
            },
            { t: 'p', text: 'From LeNet to VGG-16 the MACs per image grew about 6,700 times. Average reuse rose too, because the convolution layers reuse each weight many times while the fully connected layers (which hold most of AlexNet\'s and VGG\'s weights) reuse them only once per input.' },
            {
              t: 'callout',
              kind: 'paper',
              body: 'The survey tabulates the number of layers, weights and MACs of popular networks (LeNet, AlexNet, VGG, GoogLeNet and ResNet) and notes the trend toward deeper networks. **Reading task:** compare its numbers with the three rows above, and note the GoogLeNet and ResNet rows we did not compute.'
            },
            {
              t: 'quiz',
              id: 'sze-q6',
              q: 'VGG-16 needs about 15.5 billion MACs and has about 138 million weights. About how many times is the average weight used for one image?',
              options: ['About 1', 'About 12', 'About 112', 'About 15 billion'],
              answer: 2,
              whyNot: ['That is the fully connected layers\' reuse at batch 1. Convolution layers reuse weights far more.', 'That is AlexNet\'s average. VGG-16 reuses its weights more because it is dominated by convolutions.', null, 'That would be if there were only one weight.'],
              explain: '15.5 x 10^9 / 138 x 10^6 is about 112.'
            }
          ]
        }
      ]
    },

    /* ------------------------------ Part 2 ------------------------------ */
    {
      id: 'cpugpu',
      title: 'How CPUs and GPUs run it',
      summary: 'Convolution as matrix multiply, tricks that cut multiplications, and temporal architectures.',
      steps: [
        {
          id: 'matmul',
          title: 'Convolution as matrix multiply',
          min: 6,
          blocks: [
            {
              t: 'callout',
              kind: 'example',
              body: 'Lay a map out on a copier and copy every overlapping 3 x 3 patch onto its own strip of paper. Now the patches sit in a neat stack, and a clerk can score all of them against one stencil using one routine. But your strips repeat map squares many times over.'
            },
            { t: 'p', text: 'Matrix multiplication ({{gemm|GEMM}}) is the best-optimized operation on CPUs and GPUs. Libraries squeeze nearly all the speed out of it. So these processors usually convert a convolution into one: write each filter window as a row of a big matrix (a {{toeplitz|Toeplitz matrix}}, often called im2col) and multiply it by the filters. The conversion costs copying.' },
            { t: 'widget', name: 'im2col', title: 'Convolution as a matrix multiply', tag: 'Toy model, not from the paper' },
            {
              t: 'callout',
              kind: 'try',
              body: [
                '1. Keep the **2 x 2 filter** and image size **4**. The matrix has 9 rows and 4 columns, so 36 numbers represent an image of 16. Each value is copied about 2.25 times.',
                '2. Switch to the **3 x 3 filter** and image size **5**. The matrix is 9 x 9 = 81 numbers for an image of 25: 3.24 copies per value.',
                '3. Move the marked row. Neighboring rows share most of their values. That is the repeated data.'
              ]
            },
            {
              t: 'callout',
              kind: 'paper',
              body: 'The survey explains that convolutions are often rewritten as matrix multiplications, using a Toeplitz matrix, and that this duplicates input data. It then describes tricks that cut the multiplications (next step). (Our paraphrase. Check its wording and figures in the section on kernel computation.)'
            },
            {
              t: 'quiz',
              id: 'sze-q7',
              q: 'A 5 x 5 image is convolved with a 3 x 3 filter (stride 1, no padding), turned into a matrix with one row per window. How many numbers does the matrix hold?',
              options: ['25', '45', '81', '9'],
              answer: 2,
              whyNot: ['That is the image itself. The matrix copies overlapping windows.', 'That mixes up the window count with the filter size. Count rows x columns.', null, 'That is just one window.'],
              explain: 'The 5 x 5 image gives a 3 x 3 output, so 9 windows. Each has 9 values. 9 x 9 = 81.'
            }
          ]
        },
        {
          id: 'fewer-mults',
          title: 'Doing fewer multiplications',
          min: 7,
          blocks: [
            {
              t: 'callout',
              kind: 'example',
              body: 'Multiplying two complex numbers (a + bi)(c + di) looks like it needs four multiplications. A trick due to Gauss does it with three, by spending a few extra additions. Fast convolution methods play the same game: fewer multiplies, more adds and bookkeeping.'
            },
            { t: 'p', text: 'The survey covers three families. {{fft|FFT-based convolution}} turns a convolution into an element-wise multiplication in the frequency domain. It helps for large filters and costs extra memory for the transforms. The {{winograd|Winograd transform}} suits small filters. {{strassen|Strassen}} speeds up the matrix multiply itself.' },
            {
              t: 'table',
              head: ['Method', 'Idea', 'Saving', 'Cost'],
              rows: [
                ['Winograd, 3 x 3 filter, 2 x 2 output', 'Transform input and filter, multiply element by element, transform back', '16 multiplies instead of 36, 2.25 times fewer', 'More additions, extra transforms, more sensitivity to rounding at low precision'],
                ['FFT', 'Convolution becomes multiplication in the frequency domain', 'Large for big filters', 'Extra storage, little gain for 3 x 3 filters'],
                ['Strassen', 'Multiply 2 x 2 blocks with 7 multiplies, not 8', '8 / 7 = 1.14 times per level', 'More additions, extra memory, rounding']
              ],
              source: 'original',
              caption: 'Our summary table. The Winograd and Strassen counts are arithmetic we checked by script. The survey explains all three.'
            },
            {
              t: 'callout',
              kind: 'watch',
              body: 'Fewer multiplications does not mean less energy by itself. Paper 1 showed that data movement dominates. A method that saves multiplies but needs extra storage or extra passes over the data can lose.'
            },
            {
              t: 'quiz',
              id: 'sze-q8',
              q: 'A 3 x 3 filter producing a 2 x 2 output tile directly needs 4 x 9 = 36 multiplies. Winograd needs 16. By what factor does it cut multiplies?',
              options: ['1.14', '2.25', '4', '16'],
              answer: 1,
              whyNot: ['That is Strassen\'s 8 / 7.', null, 'That would need only 9 multiplies.', 'That is the number of Winograd multiplies, not the ratio.'],
              explain: '36 / 16 = 2.25.'
            }
          ]
        },
        {
          id: 'temporal',
          title: 'Temporal architectures: CPUs and GPUs',
          min: 6,
          blocks: [
            {
              t: 'callout',
              kind: 'example',
              body: 'A drill team does the same move on the same beat, because one coach shouts the commands. No dancer hands anything to another. If dancer A needs something dancer B just made, B puts it on a shared table and A picks it up later.'
            },
            { t: 'p', text: 'The survey calls CPUs and GPUs {{temporal-architecture|temporal architectures}}. A central control unit drives many arithmetic units. {{simd|SIMD}} (CPUs) applies one instruction to a vector of values. SIMT (GPUs) runs the same instruction across many threads. The arithmetic units **do not pass data to each other**. Each reads its operands from the memory hierarchy and writes its result back.' },
            { t: 'p', text: 'That is flexible, and the software tools are mature. It also means every operand and every partial result takes a trip through the memory hierarchy, which Paper 1 showed is the expensive part. Part 3 shows what a spatial architecture does differently.' },
            {
              t: 'callout',
              kind: 'paper',
              body: 'The survey divides the architectures that run DNNs into temporal (CPUs and GPUs, with a central controller and arithmetic units that cannot talk to each other) and spatial (arrays of processing elements that pass data directly), and notes that most dedicated accelerators are spatial.'
            },
            {
              t: 'quiz',
              id: 'sze-q9',
              q: 'In a temporal architecture, how does arithmetic unit A hand a result to arithmetic unit B?',
              options: ['It writes the result to the memory hierarchy and B reads it', 'It sends it directly over a wire to B', 'It cannot', 'Through the clock signal'],
              answer: 0,
              whyNot: [null, 'Direct links between arithmetic units are what a spatial architecture adds.', 'It can, but only through memory.', 'The clock carries timing, not data.'],
              explain: 'Units in a temporal architecture communicate only through memory, which makes each hand-off a memory access.'
            }
          ]
        }
      ]
    }
  ];
})();
