# Verification checklist for Paper 2

This lesson was written without a copy of the PDF open. The paper's host sites could not be reached from the authoring environment. Key facts were cross-checked against search results and secondary sources. Anything that could not be confirmed was softened, labeled "our paraphrase", or turned into a reading task. Before you rely on the lesson, check the items below against the original: Sze, Chen, Yang and Emer, "Efficient Processing of Deep Neural Networks: A Tutorial and Survey", Proceedings of the IEEE, December 2017 ([arXiv 1703.09039](https://arxiv.org/abs/1703.09039)).

Legend: **Checked** means a search result or secondary source agreed, or we recomputed it. **Memory** means it comes from prior knowledge and the survey's own text could not be reopened. Check every **Memory** item first.

## Bibliographic details

- [ ] Title, four authors (Sze, Chen, Yang, Emer), Proceedings of the IEEE, December 2017. *Memory, high confidence.* Volume, issue and pages are not given in the lesson.
- [ ] arXiv number 1703.09039. *Memory, high confidence.* Open the link to confirm it is this paper.

## Numbers we computed (not quoted from the survey)

`experiments/numbers.cjs` recomputes every one of these from layer shapes or from the problem statements. Run it after any edit.

- [ ] **LeNet (2 CONV, 2 FC, 28 x 28 input, 20 and 50 filters of 5 x 5, FC 800 to 500 to 10): 2.29 M MACs and 431 k weights.** *Checked by arithmetic.* The survey's LeNet row may describe a different variant. Compare.
- [ ] **AlexNet: 724 M MACs, 61.0 M weights** (two-group layer shapes). *Checked by arithmetic.* The count is the same as Paper 1's `alexnet-count.cjs`.
- [ ] **VGG-16: 15.47 G MACs, 138 M weights, average 112 MACs per weight.** *Checked by arithmetic* from the 13 CONV and 3 FC layer shapes.
- [ ] **LeNet to VGG-16 growth of about 6,700 times.** Derived from the two rows above.
- [ ] **AlexNet worst-case accesses: 4 x 724 M = 2,896 M.** Our arithmetic from the rounded 724 M (the exact MAC count gives 2,898 M). The survey may quote the same figure. Confirm.
- [ ] CONV1 / CONV3 / VGG CONV1_1 / 1 x 1 layer presets in the shape calculator (E, MACs, weights, ifmap and ofmap sizes, reuse counts): *Checked by arithmetic* and by driving the widget.
- [ ] **Winograd 2.25 times fewer multiplies** for a 3 x 3 filter and a 2 x 2 output tile (36 against 16), and **Strassen 8 to 7**: *Checked by arithmetic.* The lesson does not claim the survey quotes these exact numbers. Look for them.
- [ ] **Toeplitz duplication** (2.25 times for a 4 x 4 image with a 2 x 2 filter, 3.24 times for 5 x 5 with 3 x 3, about 9 times for large images with 3 x 3): *Checked by arithmetic.*
- [ ] **Reuse formulas** (weights N x E x F times, input values about M x R x S / U squared, C x R x S additions per output): our derivation from the loop nest. The survey names the reuse types (Memory) but may not give these formulas.
- [ ] **Depthwise separable ratio 1/M + 1/(R x S):** our arithmetic.
- [ ] **TPU peak of 92 TOPS from 65,536 units at 700 MHz (counting 2 operations per MAC):** the arithmetic gives 91.75 TOPS. The 92 TOPS and 65,536-MAC figures for the TPU were *Checked* against search results for Paper 5. The 700 MHz clock is *Memory* until the Paper 5 lesson checks it.

## Facts from the survey

- [ ] **Energy per access relative to one MAC: register file 1x, neighbor PE 2x, global buffer 6x, DRAM 200x.** *Checked* through a lecture slide that cites the Eyeriss ISCA 2016 paper for these ratios. The lesson says the survey shows them. *Memory:* that the survey reproduces this figure, and which manufacturing process and data width it assumes (reading task in Step 3.1).
- [ ] **Convolution notation: N, M, C, H, W, R, S, E, F, U and the output-size formula E = (H - R + U) / U.** *Memory, high confidence.* The lesson adds padding P to the formula for the calculator, which is our extension.
- [ ] **The survey tabulates LeNet, AlexNet, VGG, GoogLeNet and ResNet.** *Memory.* The lesson computes only LeNet, AlexNet and VGG-16 and leaves GoogLeNet and ResNet to a reading task.
- [ ] **CPUs and GPUs commonly compute convolutions as matrix multiplications, using a Toeplitz matrix that duplicates data; FFT, Winograd and Strassen reduce multiplications.** *Memory, high confidence.*
- [ ] **Temporal against spatial architectures, with temporal meaning CPU and GPU (SIMD, SIMT) and spatial meaning arrays of PEs, and "most dedicated accelerators are spatial".** *Memory.*
- [ ] **Reuse types: convolutional reuse, feature map reuse, filter reuse.** *Memory, high confidence.* Also used by the Eyeriss paper.
- [ ] **Four dataflows (weight stationary, output stationary, no local reuse, row stationary), taken from the Eyeriss analysis.** *Memory, high confidence.* The one-line descriptions and the "strength and weak point" table are our summary.
- [ ] **Which accelerators the survey lists under each dataflow.** Not given in the lesson. Reading task in Step 3.4.
- [ ] **Co-design topics: reduced precision (including binary), sparsity and pruning, compact network design.** *Memory, high confidence.*
- [ ] **"MACs and weights are poor proxies for energy and latency; use direct metrics."** *Memory.* Labeled as our paraphrase.
- [ ] **Metrics list: accuracy, throughput, latency, energy and power, hardware cost, flexibility, scalability.** *Memory.* The "often left out" column is ours.
- [ ] **"Some papers count a MAC as one operation, others as two."** *Memory.* Labeled as our paraphrase.
- [ ] Section names in the reading map are descriptive because the survey's exact headings and numbers could not be confirmed.

## Toy models and calculators (not from the survey)

Labeled in the lesson. Their numbers are not results.

- **convWindow** (Original diagram): a 7 x 7 single-channel input and small filters.
- **convShape** (Original calculator): exact arithmetic on real layer shapes. Not a model of any hardware.
- **im2col** (Toy model): a small matrix copy demonstration.
- **hierEnergy** (Paper's cost ratios, our access mixes): the three preset mixes ("no reuse", "buffer in the middle", "mostly local") are invented to show the effect.
- **sparsitySim** (Toy model): independent zeros, 8-bit weights, 4-bit or 8-bit index. The sparsity levels are slider settings.
- **compactConv** (Original arithmetic): MAC and weight counts only.
- **peakTops** (Toy calculator): example chip sizes, no real product.
- **Network X and Y table** in Step 4.4: invented to show that MACs do not determine energy.

## Practice problems

`experiments/numbers.cjs` recomputes all ten numeric answers and fails if the lesson's `check` values differ by more than 3%.

```
node papers/02-sze-survey/experiments/numbers.cjs
```

The Try-it tasks in Parts 1 to 5 were checked by driving each widget in a browser and reading the numbers shown.
