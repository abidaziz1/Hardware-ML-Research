# Verification checklist for Paper 6

This lesson was written without a copy of the PDF open. The paper's host sites could not be reached from the authoring environment. Key facts were cross-checked against search results that quote the abstract and parts of the body. Anything that could not be confirmed was softened, labeled, or turned into a reading task inside a collapsed "Check this against the paper" box. Before you rely on the lesson, check the items below against the original: Han et al., "EIE: Efficient Inference Engine on Compressed Deep Neural Network", ISCA 2016 ([arXiv 1602.01528](https://arxiv.org/abs/1602.01528)).

Legend: **Checked** means a search result or secondary source agreed, or we recomputed it. **Memory** means it comes from prior knowledge and the paper's own text could not be reopened. Check every **Memory** item first.

## From the abstract (Checked through search results that quote it)

- [ ] Fetching weights from DRAM costs about two orders of magnitude more than an ALU operation and dominates the power.
- [ ] Deep Compression lets large networks (AlexNet and VGG) fit in on-chip SRAM, by pruning redundant connections and having several connections share one weight.
- [ ] EIE runs inference on the compressed network and accelerates the resulting sparse matrix-vector multiplication with weight sharing.
- [ ] The four savings: DRAM to SRAM 120 times, sparsity 10 times, weight sharing 8 times, skipping zero activations from ReLU 3 times.
- [ ] On nine benchmarks, 189 times and 13 times faster than a CPU and a GPU running the same network without compression.
- [ ] 102 GOPS working on the compressed network, corresponding to 3 TOPS on the uncompressed one. AlexNet's fully connected layers at 1.88 x 10^4 frames per second on about 600 mW. 24,000 times and 3,400 times more energy efficient than a CPU and a GPU.
- [ ] From the Deep Compression abstract: pruning leaves 9 to 13 times fewer connections, quantization takes 32 bits per weight to 5, Huffman coding follows, and storage falls 35 to 49 times (AlexNet 240 MB to 6.9 MB, VGG-16 552 MB to 11.3 MB).

## From search summaries of the body text (Checked at a lower level, find them in the PDF)

- [ ] **The implemented chip:** 64 PEs, 45 nm, 40.8 mm2 in all, 0.638 mm2 and 9.16 mW per PE at 800 MHz, about 590 mW in the body text and 600 mW in the abstract. The numbers agree with each other (64 x 0.638 = 40.8 mm2, 64 x 9.16 = 586 mW, 64 x 0.8 GHz x 2 = 102.4 GOPS). Used in Part 4 and in practice problems 8 and 9.
- [ ] **The stored entry:** 8 bits, a 4-bit weight code plus a 4-bit relative index. A 64-bit-wide SRAM, so 8 entries per read. About 131 thousand compressed entries per PE. The lesson's calculator uses 64 x 131,072 one-byte entries = 8.4 MB. The exact entry count per PE is *Memory*.
- [ ] **Queue depth:** a depth of 1 leaves about half the cycles idle, the paper chose 8, and the benefit flattens beyond that. Step 3.5 quotes this and tells the student to find the experiment.
- [ ] **Load balance:** one benchmark with only about 600 rows balances worse than the others. Used in practice problem 10 and labeled there as coming from a search summary.

## From memory (check these first)

- [ ] **The author list** (Han, Liu, Mao, Pu, Pedram, Horowitz, Dally) and that Mark Horowitz is a co-author. *Memory, high confidence.*
- [ ] **Layer shapes:** AlexNet FC6 9,216 to 4,096, FC7 4,096 to 4,096, FC8 4,096 to 1,000. VGG-16 FC6 25,088 to 4,096, FC7 4,096 to 4,096, FC8 4,096 to 1,000. *Memory, high confidence.* Consistency check: AlexNet's fully connected weights (58.6 million) plus about 2.3 million convolution weights come to 240 MB at 32 bits, and VGG-16's (123.6 million plus about 14.7 million) to 552 MB. Both match the Deep Compression abstract.
- [ ] **Row i belongs to PE (i mod N).** *Memory, high confidence.* The lesson gives only the generic reason that dealing rows out spreads the work.
- [ ] **The PE's units** (activation queue, pointer read, sparse matrix read, arithmetic, activation read and write) and the **leading non-zero detector.** *Memory, high confidence.* Step 3.3 puts this in a "check" box and asks the student to compare with the architecture section.
- [ ] **The central unit stalls when a PE queue is full.** *Memory, medium.* The race widget uses this rule, and it is labeled a toy model, not the paper's simulator.
- [ ] **A gap of more than 15 empty rows is handled by a filler entry that holds zero.** *Memory, medium to high.* The lesson says "a trick, such as a filler entry" and asks the student to find how the paper does it.
- [ ] **EIE works on one input at a time (batch size 1),** and the CPU and GPU comparisons use batch size 1. *Memory, medium to high.* The lesson says "the paper targets one input at a time" inside a "check" box and tells the student to find the batch size behind each bar.
- [ ] **Whether the CPU and GPU were also given the compressed network,** and **what the energy numbers count.** Not claimed. Reading tasks in Steps 4.1 and 4.2.
- [ ] **Deep Compression is by Han, Mao and Dally,** prunes, retrains, and uses k-means for weight sharing. *Memory, high confidence.*
- [ ] **The arithmetic precision used inside the PEs.** Not claimed anywhere in the lesson. Find it while reading the hardware section.
- [ ] **Section names in the reading map are descriptive** because the paper's exact headings could not be confirmed.
- [ ] **Paper 7 (SCNN) targets convolution layers.** From the SCNN title, which is in the course catalog.

## Numbers we computed (not quoted from the paper)

`experiments/numbers.cjs` recomputes all of these and compares them with the lesson. Run it after any edit.

- [ ] **Layer sizes:** AlexNet FC6 has 37,748,736 weights, 151 MB at 32 bits. AlexNet's three layers hold 58.6 million (235 MB). VGG-16's hold 123.6 million. *Checked by arithmetic,* given the shapes above.
- [ ] **141 times:** 650 pJ over (3.7 + 0.9) pJ. The 650 pJ is half of Paper 1's 1.3 nJ per 64-bit DRAM read, the 5 pJ half of its 10 pJ per 64-bit read from an 8 KB SRAM, and 0.9 pJ for the 32-bit float add is *Memory* (flagged in Paper 1's VERIFY). *Checked by arithmetic.*
- [ ] **Storage:** 10% kept at 8 bits per entry makes AlexNet's fully connected layers 5.9 MB, 40 times smaller. The chip holds 8.4 MB, so the highest whole percent that fits is 14% for AlexNet and 6% for VGG-16. *Checked by arithmetic.* The calculator ignores pointers and filler entries.
- [ ] **The sparse format:** `decode(encode(book))` reproduces the toy book column by column. *Checked.*
- [ ] **The race:** 4 cooks take 76, 66, 62 and 58 cycles at queue depths 1, 2, 4 and 8, against 51 if the work were shared perfectly. The busiest cook had 57 entries against an average of 51. *Checked by simulation.*
- [ ] **The energy waterfall:** 130 times (DRAM to SRAM), 10 times (pruning), 4 times (8-bit entries), 3.03 times (one input in three is not zero), 15,758 in all. With zero skip bits, the sharing step gives 8 times, as in the abstract. *Checked by arithmetic.*
- [ ] **Practice answers:** all ten recomputed. Problem 8 estimates 20,141 passes per second against the paper's 18,800 (7% higher). It uses 9%, 9% and 25% densities for FC6 to FC8, which are *Memory* from the pruning paper, so the problem states them as given.
- [ ] **The Try-it tasks** were checked by driving every widget in a browser (`experiments/tryit.cjs`).

## Toy models (invented, not from the paper)

Labeled in the lesson. Their numbers are not results.

- **eiePrune:** 256 random weights with an exponential size curve, and never retrained. Its output-change numbers show the damage before retraining, which the real papers repair.
- **eieCodebook:** 80 random weights and k-means. With so few weights, the error at 4 bits (9%) is larger than a real layer's would be.
- **eieSim:** four cooks, one cycle per stored entry, an empty slice costs nothing, and the central unit waits when any queue is full. The book for each cook count is the one whose results sit closest to the average of 200 random books of that shape (`experiments/numbers.cjs` rechecks this). It was not tuned to agree with the paper. The toy shows the same direction as the paper (a queue helps, and the gain flattens) with smaller numbers: 67% busy at depth 1 and 88% at depth 8, against the paper's "about half idle" at depth 1 with 64 PEs.
- **eieEnergy:** assumes a read costs energy in proportion to the bits read, and uses 5 pJ for an on-chip read. EIE's memory blocks are larger than Paper 1's 8 KB SRAM, so the real saving is smaller. The lesson says so in a "check" box.
- **eieZero, eiePeMap, eieKitchen, eieCSC:** small hand-made examples to show the idea.
