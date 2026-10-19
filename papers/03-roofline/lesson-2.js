/* Paper 3 lesson, parts 3 and 4: raising operational intensity, and neural networks on the roofline. */
(function () {
  'use strict';
  window.ROOF = window.ROOF || {};

  window.ROOF.p2 = [
    /* ------------------------------ Part 3 ------------------------------ */
    {
      id: 'raise',
      title: 'Raising operational intensity',
      summary: 'Counting bytes by hand, tiling, and the other levers.',
      steps: [
        {
          id: 'derive',
          title: 'Counting bytes by hand: matrix multiply',
          min: 8,
          blocks: [
            { t: 'p', text: 'Multiplying two N x N matrices does 2 x N cubed operations (N cubed multiplies and N cubed adds). How many DRAM bytes it moves depends entirely on the order in which you do the work. Same arithmetic, three different intensities.' },
            {
              t: 'callout',
              kind: 'example',
              body: 'A student multiplies two big matrices on paper, with the books on a shelf across the room. Plan 1: for every single product, walk to the shelf and copy one number from each matrix. Plan 2: copy a small block of each matrix to the desk and do every product that uses those blocks before going back. Plan 3: clear a table big enough to hold all three matrices and copy each number once. The arithmetic is the same. The walking is not.'
            },
            {
              t: 'quiz',
              id: 'roof-q10',
              kind: 'predict',
              q: 'Plan 1 (the naive loops): each inner step does one multiply and one add (2 operations) and fetches one number from each matrix from DRAM, with 32-bit values. What is the operational intensity?',
              options: ['0.25 operations per byte', '2 operations per byte', '0.5 operations per byte', '8 operations per byte'],
              answer: 0,
              whyNot: [null, 'That ignores the bytes. Two 32-bit values are 8 bytes, so the ratio is 2 / 8.', 'That counts only one 4-byte value, but the step fetches two.', 'That inverts the ratio.'],
              explain: '2 operations / (2 values x 4 bytes) = 0.25. Almost nothing is reused.'
            },
            { t: 'p', text: 'Now work out the other two plans. Try each on paper, then open the answer.' },
            {
              t: 'reveal',
              label: 'Plan 2: T x T tiles',
              body: [
                'Keep a T x T block of the result in the cache. To finish it, walk along the shared dimension, one pair of tiles at a time. Each step loads a T x T tile of A and a T x T tile of B: 2 x T squared values, or 8 x T squared bytes. It does T cubed multiply-adds, or 2 x T cubed operations.',
                'Intensity = 2 x T cubed / (8 x T squared) = **T / 4** operations per byte. A tile of 32 gives 8.'
              ]
            },
            {
              t: 'reveal',
              label: 'Plan 3: everything fits',
              body: [
                'Read A once (N squared values), read B once, write C once: 3 x N squared values, or 12 x N squared bytes, for 2 x N cubed operations.',
                'Intensity = 2 x N cubed / (12 x N squared) = **N / 6**. For N = 1,024 that is about 171. This is the most reuse possible.'
              ]
            },
            {
              t: 'table',
              head: ['Plan', 'Operational intensity (32-bit values)', 'N = 1,024'],
              rows: [
                ['1. Naive loops', '0.25', '0.25'],
                ['2. T x T tiles', 'T / 4', '2 for T = 8, 8 for T = 32, 16 for T = 64'],
                ['3. Perfect reuse', 'N / 6', '171']
              ],
              source: 'original',
              caption: 'Our derivations. They count each tile move once and ignore the result tile, which stays in the cache until it is finished.'
            },
            {
              t: 'quiz',
              id: 'roof-q11',
              q: 'A tiled matrix multiply with 64 x 64 tiles of 16-bit values (2 bytes each) is at what intensity? Use intensity = T / bytes per value.',
              options: ['32', '16', '64', '8'],
              answer: 0,
              whyNot: [null, 'That is for 32-bit values (T / 4). With 2-byte values the denominator is 2.', 'That would be 1 byte per value.', 'That is the intensity of a 32 x 32 tile at 32 bits.'],
              explain: 'Operations: 2 x T cubed. Bytes: two tiles of T squared values at 2 bytes each, which is 4 x T squared. The ratio is T / 2 = 64 / 2 = 32.'
            }
          ]
        },
        {
          id: 'tile',
          title: 'Tiling: bigger tiles, up to the cache',
          min: 8,
          blocks: [
            { t: 'p', text: 'Bigger tiles mean more reuse, so higher intensity. There is a limit: three tiles (A, B and the result) must fit in the cache together. Too big and they push each other out and the reuse disappears. Slide the tile size and watch.' },
            { t: 'widget', name: 'tileOI', title: 'Tile size against the cache', tag: 'Toy model, not from the paper' },
            {
              t: 'callout',
              kind: 'try',
              body: [
                '1. With a **2048** matrix, **1 MB** cache and tile **8**, intensity is 2, and the kernel reaches 50 G ops/s, half of peak.',
                '2. Raise the tile to **16**. Intensity is 4, exactly the ridge, and the kernel reaches the full 100.',
                '3. Raise the tile to **256**. Three tiles need 768 KB, which fits in 1 MB. Intensity is 64, far right of the ridge. The kernel is compute-bound.',
                '4. Raise the tile to **512**. Three tiles need 3 MB, more than the cache. Intensity collapses to 0.25 and the kernel reaches about 6% of peak. A tile that is too big is worse than a tiny one.',
                '5. Switch the cache to **32 KB**. Tile 32 still fits (12 KB). Tile 64 does not (48 KB).'
              ]
            },
            {
              t: 'quiz',
              id: 'roof-q12',
              q: 'Three T x T tiles of 32-bit values must fit in a 256 KB cache. What is the largest power-of-two T that fits?',
              options: ['128', '256', '64', '512'],
              answer: 0,
              whyNot: [null, 'Three 256 x 256 tiles need 3 x 65,536 x 4 = 786 KB, more than 256 KB.', 'It fits, but it is not the largest. 128 also fits.', 'That is 3 MB.'],
              explain: '3 x T squared x 4 bytes <= 262,144 gives T squared <= 21,845, so T <= 147. The largest power of two is 128 (196,608 bytes).'
            },
            {
              t: 'callout',
              kind: 'watch',
              body: 'Real caches do not fail as suddenly as this toy model. Conflicts between addresses can hurt before the tiles fill the cache, and the best tile is usually a bit smaller than the largest that fits.'
            }
          ]
        },
        {
          id: 'levers',
          title: 'Other ways to raise operational intensity',
          min: 6,
          blocks: [
            { t: 'p', text: 'Operational intensity is operations divided by DRAM bytes. To raise it, keep the operations and cut the bytes. Tiling is one lever. Here are the others.' },
            {
              t: 'table',
              head: ['Lever', 'What changes', 'Example'],
              rows: [
                ['Tiling or blocking', 'Reuse data inside the cache before it leaves', 'Matrix multiply tiles'],
                ['Fusing operations', 'Intermediate results stay in cache or registers instead of going to DRAM', 'A convolution followed by ReLU in one pass'],
                ['Lower precision', 'Fewer bytes per value, same number of operations', '32-bit to 8-bit: 4 times the intensity'],
                ['Compressing data', 'Fewer bytes for the same values', 'Sparse formats, quantized weights'],
                ['Larger batch', 'Each loaded weight serves more inputs', 'A fully connected layer at batch 64 instead of 1'],
                ['Avoiding wasted traffic', 'Fewer conflict misses and extra loads', 'Padding arrays, writing results without loading them first']
              ],
              source: 'original',
              caption: 'Our summary table. The paper discusses several of these.'
            },
            { t: 'callout', kind: 'idea', body: 'SIMD, more cores and a higher clock raise the **roof**. They do nothing for **intensity**. If your kernel is left of the ridge, those are the wrong tools.' },
            {
              t: 'callout',
              kind: 'paper',
              body: 'The paper discusses ways to raise operational intensity for its kernels, such as blocking for caches and changing the data layout to avoid extra traffic. (Check which techniques it names and for which kernels. **Reading task:** make a list.)'
            },
            {
              t: 'quiz',
              id: 'roof-q13',
              q: 'Fusing a ReLU into the convolution before it, so the convolution\'s output is not written to DRAM and read back, does what to operational intensity?',
              options: ['Raises it: the same operations move fewer bytes', 'Lowers it', 'Leaves it unchanged', 'Raises the roof'],
              answer: 0,
              whyNot: [null, 'The write and read of the intermediate result disappear, so bytes fall.', 'Bytes change, so intensity changes.', 'The roof is a property of the machine. Fusion changes where the kernel sits under it.'],
              explain: 'The operations are the same and the DRAM bytes fall, so operations per byte rise.'
            }
          ]
        }
      ]
    },

    /* ------------------------------ Part 4 ------------------------------ */
    {
      id: 'nn',
      title: 'Neural networks on the roofline',
      summary: 'Layers, batch size, and why accelerator ridges sit so far right.',
      steps: [
        {
          id: 'layers',
          title: 'Layers on the roofline',
          min: 9,
          blocks: [
            {
              t: 'callout',
              kind: 'example',
              body: 'A restaurant kitchen has fast cooks and slow porters. A dish that needs a bag of produce for each chop leaves the cooks idle. A dish that needs one delivery and an hour of chopping keeps everyone busy. Layers differ in the same way.'
            },
            { t: 'p', text: 'This step is our own application of the model, not the paper\'s. Operations are 2 per MAC. The bytes depend on the data width and on what you count as DRAM traffic. The widget uses the same layers as Paper 2. Start on the accelerator-like machine, whose roof (92 T ops/s, 34 GB/s) matches the first TPU\'s numbers from Paper 5.' },
            { t: 'widget', name: 'layerRoofline', title: 'Five layers on three machines', tag: 'Original calculator, toy machines', source: 'original' },
            {
              t: 'callout',
              kind: 'try',
              body: [
                '1. Keep **Accelerator-like**, **8-bit**, **batch 1**, weights and activations both counted. The fully connected layer FC6 has 2 operations per byte and reaches about **0.07%** of peak. Even CONV1 (440 per byte) reaches only about 16%.',
                '2. Switch to **Only weights are DRAM traffic**. This describes a design that keeps activations in a big on-chip buffer. The convolution layers jump to hundreds or thousands of operations per byte, mostly compute-bound. CONV3 is still memory-bound (338). FC6 stays at 2.',
                '3. Move **batch** to 256. CONV3 becomes compute-bound and FC6 reaches about 19%.',
                '4. Switch to **CPU-like** and **32-bit**. FC6 has 0.5 operations per byte, still left of this machine\'s ridge of 4, so the fully connected layer is memory-bound even on a CPU.'
              ]
            },
            {
              t: 'quiz',
              id: 'roof-q14',
              q: 'Why is a fully connected layer at batch size 1 so far under the roof?',
              options: ['It does only 2 operations per weight byte, because each weight is used once', 'Its weights are huge numbers', 'Fully connected layers cannot use multipliers', 'It needs more than 8 bits'],
              answer: 0,
              whyNot: [null, 'The size of the numbers is not the issue. The count of bytes per operation is.', 'It uses the same multipliers as any layer.', 'Precision changes the intensity by a constant factor. The shortfall is far bigger.'],
              explain: 'At batch 1 each weight is fetched and used for one multiply-add (2 operations) with no reuse. That makes the intensity 2 operations per byte at 8 bits, far below a ridge in the thousands.'
            },
            {
              t: 'callout',
              kind: 'watch',
              body: 'What you count as DRAM traffic changes the answer. A design with a big on-chip buffer counts only weights. A design with a small buffer counts activations too. Paper 5 uses the first view and measures operations per weight byte.'
            }
          ]
        },
        {
          id: 'batch',
          title: 'Batch size and the roofline',
          min: 6,
          blocks: [
            { t: 'p', text: 'The way to raise a fully connected layer\'s intensity is to reuse each weight across several inputs: a larger batch. Here is the AlexNet FC6 layer at 8 bits on the accelerator-like machine.' },
            {
              t: 'table',
              head: ['Batch', 'Intensity, all traffic counted', 'Share of peak', 'Intensity, only weights counted (2 x batch)', 'Share of peak'],
              rows: [
                ['1', '2', '0.07%', '2', '0.07%'],
                ['16', '32', '1.2%', '32', '1.2%'],
                ['64', '125', '4.6%', '128', '4.7%'],
                ['256', '470', '17%', '512', '19%'],
                ['1,024', '1,505', '56%', '2,048', '76%']
              ],
              source: 'original',
              caption: 'Our arithmetic (see experiments/numbers.cjs). The accelerator-like machine has its ridge at about 2,706 operations per byte. Reaching peak with only weights counted needs a batch of about 1,353.'
            },
            {
              t: 'callout',
              kind: 'note',
              title: 'The price of batching',
              body: 'A batch of 256 means the first request waits for 255 others to arrive. Services with a strict response time cannot wait. That tension between throughput and latency is the center of Paper 5, which describes a data-center chip that faced exactly this limit.'
            },
            {
              t: 'quiz',
              id: 'roof-q15',
              q: 'For a fully connected layer with 8-bit weights, counting only weight bytes as DRAM traffic, what is the operational intensity at batch size N?',
              options: ['2 x N operations per byte', 'N operations per byte', '2 operations per byte regardless of N', 'N / 2 operations per byte'],
              answer: 0,
              whyNot: [null, 'Each MAC is two operations, so the count is twice the MACs.', 'That is the value at N = 1. Reuse grows with the batch.', 'You halved it instead of doubling it.'],
              explain: 'Each weight byte feeds N MACs, which is 2 x N operations.'
            }
          ]
        },
        {
          id: 'accel-ridge',
          title: 'Why accelerator ridges sit far to the right',
          min: 5,
          blocks: [
            { t: 'p', text: 'Look at the three machines in the widgets. The CPU-like ridge is at 4. The GPU-like one is at 100. The accelerator-like ridge is at about **2,706**. As designers added arithmetic units (cheaper and cheaper per operation, as Paper 1 explained), memory bandwidth did not keep pace, so the ridge moved right.' },
            {
              t: 'table',
              head: ['Machine (toy numbers)', 'Peak', 'Bandwidth', 'Ridge'],
              rows: [
                ['CPU-like', '100 G ops/s', '25 GB/s', '4'],
                ['GPU-like', '100 T ops/s', '1 TB/s', '100'],
                ['Accelerator-like', '92 T ops/s', '34 GB/s', '2,706']
              ],
              source: 'toy',
              caption: 'Round numbers for teaching. The accelerator row uses the first TPU\'s peak and memory bandwidth as Paper 5 reports them. The first two rows are invented.'
            },
            { t: 'p', text: 'A ridge that far right means almost no kernel reaches peak unless its data is reused thousands of times. That is why accelerators carry large on-chip buffers (so activations never touch DRAM), why they depend on batching, and why dataflow (Paper 4) matters so much.' },
            {
              t: 'callout',
              kind: 'try',
              title: 'Reading task',
              body: 'Pick two chips whose datasheets you can find. Divide peak operations per second by memory bandwidth for each. Compare the ridge points. Note which number types (8-bit, 16-bit, 32-bit) the peak refers to, because they change the ridge by large factors.'
            },
            {
              t: 'quiz',
              id: 'roof-q16',
              q: 'A chip has a peak of 92 T ops/s. How much memory bandwidth would put its ridge near 500 operations per byte?',
              options: ['About 180 GB/s', 'About 34 GB/s', 'About 1 TB/s', 'About 18 GB/s'],
              answer: 0,
              whyNot: [null, 'That is the first TPU\'s DDR3 bandwidth, which gives a ridge of about 2,700.', 'That would give a ridge of about 92.', 'That would give a ridge of about 5,000.'],
              explain: 'Bandwidth = peak / ridge = 92 x 10^12 / 500 = 184 GB/s. Paper 5 asks what a much faster memory would do for the TPU. Compare its numbers with this one.'
            }
          ]
        }
      ]
    }
  ];
})();
