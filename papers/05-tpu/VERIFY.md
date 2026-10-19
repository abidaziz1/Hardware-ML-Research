# Verification checklist for Paper 5

This lesson was written without a copy of the PDF open. The paper's host sites could not be reached from the authoring environment. Key facts were cross-checked against search results that quote the abstract. Anything that could not be confirmed was softened, labeled "from memory" or "our paraphrase", or turned into a reading task. Before you rely on the lesson, check the items below against the original: Jouppi et al., "In-Datacenter Performance Analysis of a Tensor Processing Unit", ISCA 2017 ([arXiv 1704.04760](https://arxiv.org/abs/1704.04760)).

Legend: **Checked** means a search result or secondary source agreed, or we recomputed it. **Memory** means it comes from prior knowledge and the paper's own text could not be reopened. Check every **Memory** item first.

## From the abstract (Checked through search results that quote it)

- [ ] A custom ASIC deployed in Google's datacenters since 2015 that accelerates the inference phase of neural networks.
- [ ] A matrix multiply unit of 65,536 8-bit MACs, a peak of 92 TeraOps per second, and a software-managed on-chip memory of 28 MiB.
- [ ] The deterministic execution model matches the 99th-percentile response-time requirement better than time-varying features such as caches, out-of-order execution, multithreading, multiprocessing and prefetching, which help average throughput more than guaranteed latency. The lack of such features helps explain why the TPU is relatively small and low power.
- [ ] Comparison with a server-class Intel Haswell CPU and an Nvidia K80 GPU deployed in the same datacenters.
- [ ] Production applications written in TensorFlow: MLPs, CNNs and LSTMs, representing 95% of the datacenters' neural network inference demand.
- [ ] On average about 15 to 30 times faster than the GPU or CPU, with TOPS per watt about 30 to 80 times higher, despite low utilization on some applications.
- [ ] Using the GPU's GDDR5 memory in the TPU would triple achieved TOPS and raise TOPS per watt to nearly 70 times the GPU and 200 times the CPU.
- [ ] Authors: Jouppi, Young, Patil, Patterson and many co-authors at Google. The first author, venue and year were *Checked*. The other three named authors are *Memory, high confidence*.

## From memory (check these first)

- [ ] **Block sizes:** 24 MiB Unified Buffer plus 4 MiB accumulators (the total 28 MiB is *Checked*, the split is *Memory, high confidence*); 8 GiB DDR3 weight memory at about **34 GB/s** (*Memory*; a search could not confirm the bandwidth, and Papers 3 and 5 depend on it); **700 MHz** clock; PCIe Gen3 x16 host link; a 4,096-entry accumulator. All *Memory, high confidence* except where noted.
- [ ] **Weight-stationary systolic array** description (weights held in the array, inputs flowing across, partial sums flowing down and collected in the accumulators). *Memory, high confidence.* The lesson's classification as "weight stationary" in Paper 4's vocabulary is ours.
- [ ] **Instruction set:** a small CISC set of about a dozen instructions, five of them main (read host memory, read weights, matrix multiply or convolve, activate, write host memory), with each instruction taking many cycles. *Memory, high confidence.* The lesson leaves the cycle counts to a reading task.
- [ ] **The six applications and their numbers** (MLP0 200, MLP1 168, LSTM0 64, LSTM1 96, CNN0 2,888, CNN1 1,750 MACs per weight byte; batch sizes 200, 168, 64, 96, 8, 32). *Memory, medium to high confidence.* One consistency check supports the first four: in a fully connected layer the MACs per weight byte equal the batch, and the remembered values agree. The CNN batch sizes and the CNN values need checking.
- [ ] **Share of demand by type** (about 61% MLPs, 29% LSTMs, 5% CNNs). *Memory, medium confidence.* The 95% total is *Checked*.
- [ ] **The 7 ms example** (the paper compares batch sizes and throughput shares of the CPU, GPU and TPU under a 7 ms 99th-percentile limit for one MLP; the lesson says the CPU and GPU run batches of about 16 and the TPU about 200, reaching about 80% of its maximum). *Memory, medium confidence.* The lesson's Step 1.3 labels it and asks the student to find the table. The toy model's own numbers are invented.
- [ ] **The roofline figure and the statement that four of the six applications are memory-bound.** *Memory.* The lesson computes the bounds from the OI values above, which gives exactly four left of the ridge. If the OI values are wrong, the count may change.
- [ ] **The accumulators sized from the ridge point** (about 1,350 MACs per weight byte, rounded to 2,048 and doubled for double buffering). *Memory, medium confidence.* Reading task in Step 2.3.
- [ ] **Why one CNN reaches far below its bound** (the lesson does not state a reason and asks the student to find the paper's explanation).
- [ ] **The 2013 projection and anecdote about doubling datacenters** is deliberately *not* in the lesson because it could not be confirmed.
- [ ] **Kung, "Why Systolic Architectures?", IEEE Computer, 1982.** *Memory, high confidence.*
- [ ] **Power accounting** (chip alone against whole server) and the paper's own numbers for power. Left as reading tasks. The paper's measured chip power is not quoted in the lesson.
- [ ] Section names in the reading map are descriptive because the paper's exact headings could not be confirmed.

## Numbers we computed (not quoted from the paper)

`experiments/numbers.cjs` recomputes all of these. Run it after any edit.

- [ ] **Peak:** 65,536 x 700 MHz x 2 = 91.75 TOPS, which rounds to the abstract's 92. *Checked.*
- [ ] **Ridge point:** 91.75 TOPS / 34 GB/s gives 1,349 MACs per weight byte (2,699 operations per byte; Paper 3 used 2,706 from the rounded 92 TOPS). *Checked by arithmetic,* given the 34 GB/s above.
- [ ] **Weight tile:** 65,536 bytes in 1.93 microseconds, or 1,349 cycles. *Checked.*
- [ ] **Buffer accesses per MAC:** (256 reads + 256 writes) / 65,536 = 1/128 per cycle at full rate. *Checked by arithmetic.* It ignores weight loads and the overlap of successive jobs.
- [ ] **Instruction amortization:** 256 vectors x 65,536 MACs = 16.8 million MACs per instruction. *Checked.*
- [ ] **Roofline bounds:** MLP0 13.6, MLP1 11.4, LSTM0 4.4, LSTM1 6.5 TOPS at 34 GB/s; 72, 60.5, 23, 34.6 TOPS at 180 GB/s. *Checked by arithmetic* from the OI values above. The 180 GB/s figure is our what-if, not the paper's design.
- [ ] **Systolic timing:** T + 2N - 2 cycles for T vectors on an N x N array, and the busy fraction T / (T + 2N - 2). *Checked by the register-level simulation,* which also compares every output with the plain matrix product.
- [ ] **Energy per weight byte:** 162.5 pJ (a quarter of Paper 1's 650 pJ) divided by the vectors per tile, against the 0.23 pJ 8-bit MAC. *Checked by arithmetic.* It uses Paper 1's 45 nm numbers, two of which (8-bit multiply and add) are themselves flagged there.
- [ ] **The Try-it tasks in Parts 1 to 3** were checked by driving each widget in a browser and reading the numbers shown.

## Toy models (invented, not from the paper)

Labeled in the lesson. Their numbers are not results.

- **batchLatency:** mean time 2 ms plus 0.01 ms per input, tails of 1.75 and 1.0 times the mean. All invented.
- **systolic:** exact for the small array shown, and a principle for the real 256 x 256 unit, which overlaps successive jobs.
- **tileBalance:** assumes the next tile loads while the current one is used, and ignores everything else.
- **tpuRoofline:** upper bounds only. The measured values are in the paper and are a reading task.
- **Part 1 tail-latency table:** invented numbers.

## Practice problems

`experiments/numbers.cjs` recomputes all ten numeric answers from the numbers stated in each problem and fails if the lesson's `check` values differ by more than 3%.

```
node papers/05-tpu/experiments/numbers.cjs
```
