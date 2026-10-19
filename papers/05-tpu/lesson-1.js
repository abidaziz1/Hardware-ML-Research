/* Paper 5 lesson, parts 0 to 2: start, why Google built a chip, inside the TPU. */
(function () {
  'use strict';
  var MLS = window.MLS;
  window.TPU = window.TPU || {};

  /* ---------- Figure: the TPU's main blocks ---------- */
  function blocks(host) {
    MLS.graph(host, {
      width: 800,
      height: 330,
      ariaLabel: 'Block diagram of the TPU: host interface, unified buffer, matrix multiply unit, accumulators, activation unit, weight FIFO and weight memory',
      nodes: [
        { id: 'host', label: 'Host interface', sub: 'PCIe Gen3 x16', cx: 90, cy: 40, w: 150, h: 50, kind: 'io' },
        { id: 'ub', label: 'Unified Buffer', sub: '24 MiB, software managed', cx: 90, cy: 150, w: 168, h: 58, kind: 'var' },
        { id: 'mxu', label: 'Matrix multiply unit', sub: '256 x 256 8-bit MACs', cx: 420, cy: 150, w: 210, h: 72, kind: 'op' },
        { id: 'ddr', label: 'Weight memory', sub: '8 GiB DDR3, 34 GB/s', cx: 700, cy: 40, w: 190, h: 50, kind: 'io' },
        { id: 'fifo', label: 'Weight FIFO', cx: 700, cy: 150, w: 140, h: 50, kind: 'queue' },
        { id: 'acc', label: 'Accumulators', sub: '4 MiB of 32-bit sums', cx: 420, cy: 280, w: 210, h: 58, kind: 'var' },
        { id: 'act', label: 'Activation, pooling', sub: 'nonlinear functions', cx: 150, cy: 280, w: 210, h: 58, kind: 'op' }
      ],
      edges: [
        { from: 'host', to: 'ub', path: 'M90,65 L90,121' },
        { from: 'ub', to: 'mxu', path: 'M174,150 L315,150', label: 'activations', labelAt: [245, 138] },
        { from: 'ddr', to: 'fifo', path: 'M700,65 L700,125' },
        { from: 'fifo', to: 'mxu', path: 'M630,150 L525,150', label: 'weights', labelAt: [578, 138] },
        { from: 'mxu', to: 'acc', path: 'M420,186 L420,251', label: 'partial sums', labelAt: [485, 222] },
        { from: 'acc', to: 'act', path: 'M315,280 L255,280' },
        { from: 'act', to: 'ub', path: 'M120,251 L120,179', label: 'results', labelAt: [158, 215] }
      ]
    });
  }
  window.TPU.figBlocks = blocks;

  window.TPU.p1 = [
    /* ------------------------------ Part 0 ------------------------------ */
    {
      id: 'start',
      title: 'Start here',
      summary: 'What the paper is, what you will learn, and how to use this lesson.',
      steps: [
        {
          id: 'welcome',
          title: 'Welcome to Paper 5',
          min: 3,
          blocks: [
            { t: 'p', lead: true, text: 'In 2015 Google was already running a custom neural network chip in its datacenters, and few outsiders knew. This 2017 paper describes it, measures it against a contemporary CPU and GPU on the networks Google actually runs, and explains why a chip with 65,536 multipliers can be small, cool and fast. It is the best case study in this course, because it uses every idea from Papers 1 to 4.' },
            {
              t: 'facts',
              rows: [
                ['Paper', 'In-Datacenter Performance Analysis of a Tensor Processing Unit'],
                ['Authors', 'Norman P. Jouppi, Cliff Young, Nishant Patil, David Patterson and many co-authors at Google'],
                ['Venue', 'ISCA 2017 (International Symposium on Computer Architecture)'],
                ['Read the original', '[arXiv 1704.04760](https://arxiv.org/abs/1704.04760). Part 7 gives a reading map.'],
                ['Time', 'About 3 hours for the lesson, plus 40 minutes for the practice problems at the end. Your place is saved in this browser.'],
                ['You should know', 'Papers 1 to 4, especially the roofline (Paper 3) and the dataflow vocabulary (Paper 4).']
              ]
            },
            { t: 'h', text: 'By the end you can' },
            {
              t: 'list',
              ordered: true,
              items: [
                'Explain why a datacenter service is judged by 99th-percentile latency, and why that limit caps batching.',
                'Name the TPU\'s parts (matrix unit, Unified Buffer, accumulators, weight FIFO, weight memory) and say what each stores.',
                'Step through a {{systolic-array|systolic array}} and compute how many cycles a job takes.',
                'Compute the TPU\'s peak (92 TOPS) and its ridge point, and explain what the ridge means for weight tiles.',
                'Place the six production workloads on the roofline and say which are memory-bound and why.',
                'Explain why the TPU leaves out caches, out-of-order execution and multithreading.',
                'Apply Paper 1\'s energy table to explain the 8-bit arithmetic, and name the TPU\'s dataflow using Paper 4\'s vocabulary.',
                'Evaluate the headline results (15 to 30 times faster, 30 to 80 times higher TOPS/W) and say what to question.'
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
            { t: 'p', text: 'Google\'s neural network services need low and predictable response times. The {{tpu|TPU}} is a PCIe card built for that job. It has a 256 x 256 array of 8-bit multiply-accumulate units, 28 MiB of software-managed on-chip memory, and DDR3 memory for weights. It runs a few complex instructions and has no cache and no out-of-order logic, so its timing is predictable.' },
            { t: 'p', text: 'On six production networks (MLPs, LSTMs and CNNs, 95% of Google\'s datacenter inference demand) the paper reports that the TPU is on average about 15 to 30 times faster than a contemporary Haswell CPU or Nvidia K80 GPU, with 30 to 80 times the TOPS per watt. A roofline analysis shows most workloads are limited by weight memory bandwidth, not by the multipliers, and the authors estimate that faster memory would help most.' },
            { t: 'callout', kind: 'idea', body: 'A domain-specific chip wins by matching the workload: 8-bit arithmetic, a big array that reuses data as it flows, a big on-chip buffer so activations never reach DRAM, and no features that make timing unpredictable.' },
            { t: 'h', text: 'The paper in four questions' },
            {
              t: 'flip',
              hint: 'Click to see the answer',
              cards: [
                { front: 'What problem does it solve?', back: 'Neural network inference at datacenter scale is costly in energy and servers, and it has strict response-time limits. A general-purpose chip is a poor fit.' },
                { front: 'What is the core idea?', back: 'A matrix engine of 65,536 8-bit MACs fed by a large software-managed buffer, with deterministic execution that fits a 99th-percentile latency limit.' },
                { front: 'How do the authors show it works?', back: 'They run six production networks on the TPU, a Haswell CPU and a K80 GPU in the same datacenters, report speed and TOPS per watt, and use a roofline to explain the results.' },
                { front: 'What should you question?', back: 'The baselines are 2015-era hardware, the measurements are Google\'s own on Google\'s workloads, and 8-bit arithmetic must preserve accuracy. Check how power was counted.' }
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
      id: 'why',
      title: 'Why Google built a chip',
      summary: 'The latency limit, the six workloads, and why batching is capped.',
      steps: [
        {
          id: 'latency',
          title: 'The real constraint: response time at the 99th percentile',
          min: 6,
          blocks: [
            {
              t: 'callout',
              kind: 'example',
              body: 'A restaurant promises that nearly every order arrives within 7 minutes. The owner could raise the dishes served per hour by cooking in huge batches, but then each customer waits for the whole batch. A promise about nearly every customer is a promise about the slowest few, not about the average.'
            },
            { t: 'p', text: 'Online services are judged on {{tail-latency|tail latency}}: the time that 99 percent of requests beat. If a service has a 7 ms limit at the 99th percentile, 1 request in 100 may take longer, and no more. The average can look fine while the tail is awful.' },
            {
              t: 'table',
              head: ['Requests', 'Time', 'What the numbers say'],
              rows: [
                ['98 of 100', '5 ms', 'Mean of all 100: 5.9 ms'],
                ['2 of 100', '50 ms', '99th percentile: 50 ms']
              ],
              source: 'toy',
              caption: 'Invented numbers. The average (5.9 ms) hides the two slow requests that the 99th percentile (50 ms) exposes.'
            },
            {
              t: 'quiz',
              id: 'tpu-q1',
              kind: 'predict',
              q: 'In the table, which number tells you whether more than 1 request in 100 waits longer than 20 ms?',
              options: ['The 99th percentile (50 ms)', 'The mean (5.9 ms)', 'The fastest request (5 ms)', 'The sum of the times'],
              answer: 0,
              whyNot: [null, 'The mean mixes fast and slow requests, so it can stay low while the tail grows.', 'The fastest request says nothing about the slow ones.', 'A sum depends on how many requests you counted and says nothing about any one of them.'],
              explain: 'The 99th percentile is 50 ms, above 20 ms, so more than 1 in 100 requests is slower than 20 ms. The mean of 5.9 ms does not show it.'
            },
            {
              t: 'callout',
              kind: 'paper',
              body: 'The abstract argues that the TPU\'s deterministic execution model is a better match for the 99th-percentile response-time requirement of the applications than the time-varying optimizations of CPUs and GPUs (caches, out-of-order execution, multithreading, prefetching), which help average throughput more than guaranteed latency.'
            }
          ]
        },
        {
          id: 'workloads',
          title: 'Six networks that matter',
          min: 6,
          blocks: [
            { t: 'p', text: 'The paper evaluates six production networks, two each of three types, which together stand for 95 percent of Google\'s datacenter neural network inference demand. They are named MLP0, MLP1, LSTM0, LSTM1, CNN0 and CNN1. Multi-layer perceptrons and LSTMs are built mostly from fully connected layers. CNNs are built from the convolutions you met in Papers 2 and 4.' },
            { t: 'p', text: 'One number per network decides most of the rest of this lesson: **MACs per weight byte**. In a fully connected layer each weight is used once per input, so the MACs per weight byte equal the batch size. In a convolution, each weight is used at every output position, so the number is far larger.' },
            {
              t: 'table',
              head: ['Network', 'Kind', 'MACs per weight byte (from memory)', 'Typical batch (from memory)'],
              rows: [
                ['MLP0', 'Multi-layer perceptron', '200', '200'],
                ['MLP1', 'Multi-layer perceptron', '168', '168'],
                ['LSTM0', 'Recurrent (LSTM)', '64', '64'],
                ['LSTM1', 'Recurrent (LSTM)', '96', '96'],
                ['CNN0', 'Convolutional', '2,888', '8'],
                ['CNN1', 'Convolutional', '1,750', '32']
              ],
              source: 'paper',
              caption: 'Values from memory of the paper\'s workload table. Check every one against the table in the paper. For the four fully connected networks the two columns agree, as the reasoning above says they should.'
            },
            { t: 'p', text: 'The paper also gives the share of the datacenter\'s inference demand by type: about 61 percent MLPs, 29 percent LSTMs and 5 percent CNNs (from memory, check). Most of the work is the type with **low** reuse. That shapes everything: the TPU must be good at memory-bound work as well as at convolutions.' },
            {
              t: 'quiz',
              id: 'tpu-q2',
              q: 'A network made of fully connected layers is run with a batch of 200. About how many MACs per weight byte does it do?',
              options: ['About 200', 'About 1', 'About 40,000', 'About 2'],
              answer: 0,
              whyNot: [null, 'That would be a batch of 1. Each weight serves one MAC per input in the batch.', 'That would need each weight to be used 40,000 times.', 'That would be the operations (not MACs) at batch 1 with 8-bit weights.'],
              explain: 'Each weight byte is one 8-bit weight, used once per input. With a batch of 200 it is used in 200 MACs.'
            },
            {
              t: 'callout',
              kind: 'try',
              title: 'Reading task',
              body: 'Find the table of the six applications in the paper. For each one record the number of layers, the number of weights, the MACs per weight byte, the batch size and the share of deployed demand. Check the values above.'
            }
          ]
        },
        {
          id: 'batch',
          title: 'Batching against the latency limit',
          min: 8,
          blocks: [
            { t: 'p', text: 'Batching is the cheapest way to raise reuse: each weight fetched once serves the whole batch. It also makes every request wait for the whole batch. So a latency limit caps the batch, and the batch caps how well the hardware can be used. The cap is tighter for a chip whose timing varies.' },
            { t: 'widget', name: 'batchLatency', title: 'Throughput inside a latency limit', tag: 'Toy model, not from the paper' },
            {
              t: 'callout',
              kind: 'try',
              body: [
                '1. Keep the **7 ms** limit. The table shows the largest batch that stays inside it. The variable chip manages **200** and reaches **50%** of the unlimited maximum throughput. The deterministic chip manages **500** and reaches **71%**.',
                '2. Raise the limit to **20 ms**. The deterministic chip reaches about **90%** and the variable chip about **82%**. A loose limit lets both approach the maximum.',
                '3. Lower the limit to **3 ms**. The deterministic chip still manages a batch of 100. The variable chip cannot fit even a batch of 1, because its tail (1.75 times a 2 ms mean) already exceeds 3 ms.'
              ]
            },
            {
              t: 'callout',
              kind: 'paper',
              body: 'The paper gives an example for one application (an MLP) under a 7 ms 99th-percentile limit. It reports the batch size each chip can run inside the limit and the throughput it then reaches as a share of that chip\'s maximum. As we remember it, the CPU and GPU can run batches of about 16 and reach well under half of their maximum, while the TPU can run a batch of about 200 and reach about 80 percent. (Check the exact numbers. **Reading task:** find this table and write them down.)'
            },
            {
              t: 'quiz',
              id: 'tpu-q3',
              q: 'Why does a chip with variable timing have to run smaller batches than a deterministic chip under the same limit?',
              options: ['Its tail latency is well above its mean, so the batch must be small enough that even the tail stays inside the limit', 'Variable chips have less memory', 'Batches are illegal on variable chips', 'Its mean latency is always higher'],
              answer: 0,
              whyNot: [null, 'The two can have the same memory. The difference is how much the timing varies.', 'Batches are allowed. They just have to stay within the tail limit.', 'The mean can be the same. The tail is what differs.'],
              explain: 'The limit applies to the 99th percentile. If that is 1.75 times the mean, the mean must be 1.75 times smaller, which means a smaller batch.'
            }
          ]
        }
      ]
    },

    /* ------------------------------ Part 2 ------------------------------ */
    {
      id: 'arch',
      title: 'Inside the TPU',
      summary: 'The block diagram, the systolic matrix unit, the memories, and the instruction set.',
      steps: [
        {
          id: 'blocks',
          title: 'The block diagram',
          min: 7,
          blocks: [
            {
              t: 'callout',
              kind: 'example',
              body: 'Picture a long assembly line of 256 stations. The pantry (weight memory) is across the yard and delivers recipe cards slowly. A big prep counter (the Unified Buffer) holds the ingredients for the whole day and feeds the line without a trip to the pantry. Only the recipe cards cross the yard.'
            },
            { t: 'figure', draw: window.TPU.figBlocks, source: 'redrawn', caption: 'The TPU\'s main blocks, redrawn from memory of the paper\'s block diagram and simplified. Sizes are marked in the table below. Check the diagram in the paper.', alt: 'Host interface to a Unified Buffer, to a matrix multiply unit fed by a weight FIFO from DDR3 weight memory, then accumulators, an activation unit, and back to the Unified Buffer.' },
            {
              t: 'table',
              head: ['Block', 'What it does', 'Size', 'Status'],
              rows: [
                ['Matrix multiply unit', '{{mxu|256 x 256}} 8-bit multiply-accumulate units', '65,536 MACs', 'Confirmed (abstract)'],
                ['On-chip memory in total', 'Software-managed: no hidden cache', '28 MiB', 'Confirmed (abstract)'],
                ['{{unified-buffer|Unified Buffer}}', 'Holds activations between layers', '24 MiB', 'From memory. Check the split.'],
                ['{{accumulators|Accumulators}}', 'Collect 32-bit partial sums from the array', '4 MiB', 'From memory. Check the split.'],
                ['Weight memory', 'Off-chip DRAM holding the weights, read through the {{weight-fifo|weight FIFO}}', '8 GiB of {{ddr3|DDR3}}, about 34 GB/s', 'From memory. Check it.'],
                ['Clock', 'One matrix step per cycle', '700 MHz', 'From memory. Check it.'],
                ['Host connection', 'The card sits on the server\'s bus', 'PCIe Gen3 x16', 'From memory. Check it.']
              ],
              source: 'paper',
              caption: 'Figures about the TPU. Confirm the ones marked "from memory" in the paper.'
            },
            { t: 'p', text: 'From these numbers, the peak is 65,536 MACs x 700 MHz x 2 operations per MAC = 91.75 trillion operations per second, which rounds to the abstract\'s **92 TOPS**. The 28 MiB agrees too: 24 + 4.' },
            {
              t: 'quiz',
              id: 'tpu-q4',
              q: 'Which block holds the activations that flow from one layer to the next, so they do not have to go to DRAM?',
              options: ['The Unified Buffer', 'The weight memory', 'The weight FIFO', 'The host'],
              answer: 0,
              whyNot: [null, 'The weight memory holds weights, in off-chip DRAM.', 'The FIFO queues weight tiles on their way to the matrix unit.', 'The host sends in the first inputs and receives the final results.'],
              explain: 'The 24 MiB Unified Buffer keeps intermediate activations on chip. Only weights cross to off-chip memory.'
            }
          ]
        },
        {
          id: 'systolic',
          title: 'The matrix unit: a systolic array',
          min: 9,
          blocks: [
            { t: 'p', text: 'The matrix unit is a {{systolic-array|systolic array}}: a grid in which data moves rhythmically from PE to PE. In the TPU the weights are loaded into the grid and stay put. Input vectors flow in from one side, products are added as the sums flow across, and the results emerge at the edge. Because each input value passes by many PEs, it is read from the buffer once and used many times. Step through a small one.' },
            { t: 'widget', name: 'systolic', title: 'A weight-stationary systolic array, cycle by cycle', tag: 'Original diagram, exact simulation', source: 'original' },
            {
              t: 'callout',
              kind: 'try',
              body: [
                '1. Pick the **3 x 3** array and **1** input vector. The job takes **5** cycles (1 + 2 x 3 - 2), and only 3 of the 9 PEs are ever busy in a cycle. The array is busy 20% of the time.',
                '2. Set **6** input vectors. Now the job takes **10** cycles. In the middle (cycles 5 and 6) all 9 PEs are busy. Overall the array is busy 60% of the time.',
                '3. Pick the **2 x 2** array with **8** vectors: 10 cycles, 80% busy. A small array fills quickly.',
                '4. Look at the results table at the bottom. It fills diagonally and matches the plain matrix product, which the simulation checks.'
              ]
            },
            { t: 'p', text: 'The lesson of the simulation: a job of T vectors on an N x N array takes T + 2N - 2 cycles and is busy a fraction T / (T + 2N - 2) of the time. For a 256 x 256 array, a single vector takes 511 cycles to flow through, so one vector alone would use the array only 0.2 percent of the time. The array needs thousands of vectors per tile to be efficient.' },
            { t: 'p', text: 'A second benefit is data movement. In each cycle the real array reads 256 input values from the Unified Buffer and writes 256 results to the accumulators, while it performs 65,536 MACs. That is 512 / 65,536 = **1/128 of a buffer access per MAC**, against 4 per MAC for a design with no reuse.' },
            {
              t: 'callout',
              kind: 'paper',
              body: 'The paper describes the matrix unit as a systolic array that reads the Unified Buffer once and reuses the value across the array, and notes that this reduces the reads and writes of the buffer and so the energy. (Our paraphrase. **Reading task:** find the figure of the systolic data flow and compare it with the widget.)'
            },
            {
              t: 'quiz',
              id: 'tpu-q5',
              q: 'A weight-stationary systolic array of 4 x 4 PEs processes 5 input vectors. Counting every cycle from the first vector entering until the last result leaves, how many cycles does the job take?',
              options: ['11', '5', '20', '16'],
              answer: 0,
              whyNot: [null, 'That ignores the 2N - 2 = 6 cycles for the wave to cross the array.', 'That multiplies instead of adding.', 'That is the number of PEs.'],
              explain: 'T + 2N - 2 = 5 + 8 - 2 = 11 cycles.'
            }
          ]
        },
        {
          id: 'memory',
          title: 'Feeding the matrix unit: the weight tile balance',
          min: 8,
          blocks: [
            { t: 'p', text: 'The array holds one tile of weights at a time. A 256 x 256 tile of 8-bit weights is 65,536 bytes. With the weight memory delivering about 34 GB/s, loading one tile takes 65,536 / 34 x 10^9 = 1.93 microseconds, about **1,349 cycles** at 700 MHz. Each input vector uses the loaded tile for just one cycle. If fewer than about 1,349 vectors use the tile, the unit finishes early and waits for the next one.' },
            { t: 'widget', name: 'tileBalance', title: 'How many vectors does each weight tile serve?', tag: 'Original calculator, first TPU\'s figures', source: 'original' },
            {
              t: 'callout',
              kind: 'try',
              body: [
                '1. **FC layer, batch 1**: each tile serves 1 vector, so the matrix unit is busy 0.07% of the time.',
                '2. **FC layer, batch 200**: each tile serves 200 vectors. The unit is busy about **15%**, which is about **14 TOPS** of the 92. A fully connected layer is memory-bound even at batch 200.',
                '3. **CONV layer, 56 x 56 map, batch 1**: the tile serves 3,136 output positions, more than 1,349. The unit stays full.',
                '4. Notice **1,349**. It is also the ridge point of the TPU\'s roofline in MACs per weight byte. The two descriptions say the same thing.'
              ]
            },
            {
              t: 'callout',
              kind: 'note',
              title: 'Rounding',
              body: 'Paper 3 gave the ridge as about 2,706 operations per byte, using a rounded 92 TOPS and counting 2 operations per MAC. Dividing by 2 gives 1,353 MACs per byte. The unrounded figure is 1,349. Same quantity, slightly different rounding.'
            },
            {
              t: 'callout',
              kind: 'paper',
              body: 'The paper sizes the accumulators from the roofline: the ridge point is about 1,350 MACs per weight byte, so the accumulators hold enough entries to cover about that many vectors while the next weight tile loads. (Our paraphrase from memory. **Reading task:** find how the paper derives the 4,096-entry size of the accumulators, which is 4 MiB at 256 values of 32 bits each.)'
            },
            {
              t: 'quiz',
              id: 'tpu-q6',
              q: 'A weight tile of 65,536 bytes loads from memory at 34 GB/s. About how long does that take?',
              options: ['About 1.9 microseconds', 'About 1.9 milliseconds', 'About 19 nanoseconds', 'About 1.9 seconds'],
              answer: 0,
              whyNot: [null, 'That would be 1,000 times slower. Check the unit: 65,536 bytes is small.', 'That would need over 3 TB/s.', 'That is far too slow for 65,536 bytes.'],
              explain: '65,536 bytes / 34 x 10^9 bytes per second = 1.93 x 10^-6 seconds.'
            }
          ]
        },
        {
          id: 'isa',
          title: 'A tiny instruction set',
          min: 6,
          blocks: [
            {
              t: 'callout',
              kind: 'example',
              body: 'A head chef does not shout one word per chop. The chef says "chop all the onions in the bin" and the whole line works for several minutes. The chef\'s time is almost nothing compared with the work done.'
            },
            { t: 'p', text: 'The TPU has a {{cisc|CISC}}-style instruction set of about a dozen instructions. Five matter most: read data from the host, read weights, multiply (or convolve), apply a nonlinear function, and write data back to the host. Each instruction runs for many cycles, so the instruction overhead that Paper 1 worried about is spread over a huge amount of work.' },
            { t: 'p', text: 'Count it. One multiply instruction applied to 256 input vectors does 256 x 65,536 = 16.8 million MACs. Even if fetching and decoding the instruction cost a full nanojoule (an enormous overhead, 1,000 pJ), that is under **0.0001 pJ per MAC**, against about 0.23 pJ for an 8-bit MAC (Paper 1\'s numbers). The overhead disappears. This is the extreme end of Paper 1\'s amortization lever.' },
            {
              t: 'callout',
              kind: 'paper',
              body: 'The paper describes a small CISC instruction set in which an instruction takes many clock cycles, and lists the main instructions. (Our paraphrase from memory. **Reading task:** find the list of instructions and the typical number of cycles each takes.)'
            },
            {
              t: 'quiz',
              id: 'tpu-q7',
              q: 'Why can the TPU afford instructions that need a lot of decoding and control?',
              options: ['Each instruction triggers millions of MACs, so the overhead is shared across them', 'The TPU has no control logic', 'Instructions are free in hardware', 'It decodes them in software'],
              answer: 0,
              whyNot: [null, 'It has a small amount of control logic. The point is that it is amortized.', 'Instructions cost energy. They just cost very little per MAC here.', 'Decoding is done in hardware.'],
              explain: 'A multiply instruction can keep the matrix unit busy for thousands of cycles. The fixed cost of one instruction is divided by millions of MACs.'
            }
          ]
        }
      ]
    }
  ];
})();
