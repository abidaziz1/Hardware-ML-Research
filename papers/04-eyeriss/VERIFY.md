# Verification checklist for Paper 4

This lesson was written without a copy of the PDF open. The paper's host sites could not be reached from the authoring environment, though one search result listed the authors' copy (linked in the lesson). Key facts were cross-checked against search results and secondary sources. Anything that could not be confirmed was softened, labeled "our paraphrase", or turned into a reading task. Before you rely on the lesson, check the items below against the original: Chen, Emer and Sze, "Eyeriss: A Spatial Architecture for Energy-Efficient Dataflow for Convolutional Neural Networks", ISCA 2016.

Legend: **Checked** means a search result or secondary source agreed, or we recomputed it. **Memory** means it comes from prior knowledge and the paper's own text could not be reopened. Check every **Memory** item first.

## Facts from the paper

- [ ] **Title, authors (Chen, Emer, Sze), ISCA 2016.** *Checked* (search results list the paper with these details).
- [ ] **Abstract claims: the row stationary dataflow; it exploits local reuse of filter weights and feature map pixels and minimizes movement of partial sums; it adapts to different CNN shapes; it reduces all types of data movement; the analysis framework compares dataflows under the same area and processing parallelism; on AlexNet, row stationary is 1.4 to 2.5 times more energy efficient on convolution layers.** *Checked* through search results that quote the abstract.
- [ ] **"At least 1.3 times better on fully connected layers for batch sizes above 16", and "demonstrated on a fabricated chip, which verifies the energy analysis".** *Memory, high confidence.* Marked "From memory" in the table in Step 4.2.
- [ ] **Energy cost per access relative to a MAC: register file 1x, neighbor PE 2x, global buffer 6x, DRAM 200x.** *Checked* through a lecture slide that cites this paper. The lesson says the data width and manufacturing process are a reading task, because they could not be confirmed.
- [ ] **The four-level storage hierarchy of the spatial architecture, and the three data types (inputs, weights, partial sums).** *Memory, high confidence.*
- [ ] **Weight stationary, output stationary (with variants) and no local reuse, with their descriptions.** *Memory, high confidence in the families.* The one-line descriptions, strengths and weak points are our summary. The lesson does not name the designs the paper lists under each dataflow (reading tasks). The output stationary variants are mentioned but not described (reading task in Step 2.2).
- [ ] **The row stationary 1D primitive, the logical PE set (R rows by E columns), reuse of filter rows horizontally and input rows diagonally and accumulation of partial sums vertically.** *Memory, high confidence.*
- [ ] **Interleaving rows (from several inputs, filters or channels) in a PE to raise filter reuse, input reuse and local accumulation.** *Memory, medium to high confidence.* The "what the PE holds" and "limited by" columns are our reading. Reading task in Step 3.4.
- [ ] **Register file of roughly half a kilobyte per PE.** *Memory, medium confidence.* Flagged in Step 3.4.
- [ ] **Folding and replication to map a PE set onto the physical array.** *Memory, high confidence.*
- [ ] **That the comparison holds the PE count and total storage area constant, reports energy by storage level and data type, and uses AlexNet at several batch sizes.** *Memory, high confidence.* The exact PE count, register file size, buffer size, data width and batch sizes are a reading task (Step 1.4). They are not given in the lesson on purpose.
- [ ] **AlexNet layer shapes** (H padded: CONV1 227, CONV2 31, CONV3 to 5 15; R 11, 5, 3; E 55, 27, 13; C 3, 48, 256, 192, 192; M 96, 256, 384, 384, 256; U 4, 1, 1). *Checked by arithmetic:* the output sizes follow from the formula, and the five layers add up to 666 M MACs, the same total as the AlexNet count in Papers 1 and 2. The FC6 shape is treated as a 6 x 6 convolution on a 6 x 6 input.

## The chip (follow-up papers, not the ISCA paper)

- [ ] **168 PEs.** *Checked* through a search result for the journal paper on the chip.
- [ ] **AlexNet convolution layers at 35 frames per second and 278 mW, batch 4, with 0.0029 DRAM accesses per MAC.** *Checked* through the same search result (the journal paper's abstract).
- [ ] **12 x 14 array, about 108 KB global buffer, 16-bit fixed point.** *Memory, high confidence* for the array shape and the data width, *medium* for the buffer size. Marked "From memory" in Step 4.3.
- [ ] **Feature map run-length compression and zero gating on the chip.** *Memory, high confidence,* attributed in the lesson to the chip papers, not to the dataflow paper.
- [ ] **A second-generation design for compact and sparse networks.** *Memory, high confidence.* Mentioned without details.

## Numbers we computed (not quoted from the paper)

`experiments/numbers.cjs` recomputes all of these. Run it after any edit.

- [ ] **Reuse counts per layer** (weight reuse N x E x E, input reuse M x min(R x R / U squared, E x E), accumulations C x R x R): CONV1 3,025 / 726 / 363, CONV3 169 / 3,456 / 2,304, FC6 1 / 4,096 / 9,216, and the rest. *Checked by arithmetic and by driving the widget.* The input reuse is an interior-pixel approximation. Its definition is our own.
- [ ] **Partial sum cost table** (4,608 buffer accesses and 27,648 units against 4,614 for CONV3). *Checked by arithmetic.*
- [ ] **One-PE primitive counts:** filter row 3, input row 7 gives 15 MACs, 15 buffer accesses, 60 register file accesses, energy 165 against 375; filter row 5, input row 13 gives 45 MACs, 27 buffer accesses, energy 387 against 1,125. *Checked by script and by driving the widget.* The accounting is ours: each MAC does 3 register file reads and 1 write, a weight and an input value are fetched once, a finished output is written once, and DRAM and PE-to-PE transfers are ignored.
- [ ] **Folding and utilization on a 12 x 14 array:** CONV1 90.0%, CONV2 80.4%, CONV3 to 5 92.9%. *Checked by arithmetic.* These are our geometric numbers. The lesson asks the student to compare them with the utilization the Eyeriss papers report. (The geometry gives values that look like the ones the chip papers quote, but that is a resemblance we could not confirm.)
- [ ] **0.0029 DRAM accesses per MAC against 4 in the worst case gives about 1,380 times fewer; 0.58 units of DRAM energy against 800.** *Checked by arithmetic* from the quoted figure.

## Toy models (invented, not from the paper)

Labeled in the lesson. Their numbers are not results.

- **hierEnergy mixes** (inherited from Paper 2): invented access mixes.
- **rsPrimitive:** exact counts for one PE under the accounting above. It does not reproduce the paper's whole-array energy.
- **rsPESet, foldingLab, reuseProfile:** exact geometry and arithmetic on stated shapes.
- **The Part 5 "Design X and Design Y" quiz and the energy table in Step 1.3:** invented numbers for practice.
- The lesson deliberately has **no widget that ranks the four dataflows by energy.** Any simple ranking we could write would depend on modeling choices (array broadcast, buffer sizes, mapping) that the paper handles in its analysis. Use the paper's figures for the ranking.

## Practice problems

`experiments/numbers.cjs` recomputes all ten numeric answers from the numbers stated in each problem and fails if the lesson's `check` values differ by more than 3%.

```
node papers/04-eyeriss/experiments/numbers.cjs
```

The Try-it tasks in Parts 1 to 4 were checked by driving each widget in a browser and reading the numbers shown.
