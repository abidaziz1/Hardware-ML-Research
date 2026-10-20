# Verification checklist for Paper 3

This lesson was written without a copy of the PDF open. The paper's host sites could not be reached from the authoring environment, and searches did not return the paper's machine tables. So the lesson makes no claim about the paper's own machines, kernels or measured numbers. It states the model, which is arithmetic, and sends the student to the paper through reading tasks. Check the items below against the original: Williams, Waterman and Patterson, "Roofline: An Insightful Visual Performance Model for Multicore Architectures", Communications of the ACM, April 2009 (find it in the ACM Digital Library by title).

Legend: **Checked** means we recomputed it, drove the widget in a browser, or a source agreed. **Memory** means it comes from prior knowledge and the paper's own text could not be reopened. Check every **Memory** item first.

## The model

- [ ] **Attainable performance = min(peak performance, memory bandwidth x operational intensity); log-log axes; ridge point; the shape of a roof.** *Memory, very high confidence.* It is the paper's central idea.
- [ ] **Operational intensity is operations per byte of DRAM traffic, counted after the caches have filtered the accesses, and the paper uses this name in place of "arithmetic intensity".** *Memory, high confidence.* Reading task in Step 1.2.
- [ ] **Ceilings:** computation ceilings (for example no SIMD, no balance of multiplies and adds, no instruction-level parallelism) and bandwidth ceilings (for example no prefetching, no memory affinity). *Memory, high confidence in the kind, not in the exact list.* The lesson says "for example", labels the step "Our paraphrase" and asks the student to list the paper's ceilings (Step 2.3).
- [ ] **"The paper applies the model to several multicore computers and to a handful of scientific kernels."** *Memory.* The lesson names no machine, kernel or measured number from the paper. Compare with the paper and add them if you want.
- [ ] **The paper discusses techniques that raise operational intensity (blocking, data layout).** *Memory.* Flagged as a reading task in Step 3.3.
- [ ] **Publication:** Communications of the ACM, April 2009, three authors, UC Berkeley. *Memory, high confidence.* Volume and pages are not given in the lesson.
- [ ] **Wulf and McKee, "Hitting the Memory Wall: Implications of the Obvious", ACM SIGARCH Computer Architecture News, 1995.** *Memory, high confidence.*
- [ ] Section names in the reading map are descriptive because the paper's exact headings could not be confirmed.

## Numbers we computed (not quoted from the paper)

`experiments/numbers.cjs` recomputes all of these. Run it after any edit.

- [ ] **Bakery:** 100 loaves per hour, 25 kg per hour, 2 loaves per kg gives 50. *Checked.*
- [ ] **Operational intensities (32-bit):** vector add 1/12 = 0.083, dot product 0.25, scaled vector add 0.167, matrix-vector 0.5, 32 x 32 tiles 8, perfect reuse for N = 1,024 gives 170.7. *Checked by arithmetic.* The byte counts assume each value is moved the stated number of times and nothing else.
- [ ] **Matrix multiply derivations:** naive 0.25 (2 operations, 8 bytes), tiled T / bytes per value (so T / 4 at 32 bits), perfect N / 6. *Checked by arithmetic.* The tiled count ignores the result tile, which stays in the cache until it is finished.
- [ ] **Tile footprints and the 256 KB, 1 MB and 2 MB examples.** *Checked.* The collapse to 0.25 when three tiles do not fit is a toy assumption, not a measurement.
- [ ] **Layer intensities** (AlexNet CONV1 439, CONV3 301, VGG CONV1_1 52, 1 x 1 layer 101, FC6 2 at 8 bits, batch 1, each value moved once; weights-only variants 6,050 / 338 / 100,352 / 6,272 / 2). *Checked by script and by driving the widget.* Layer shapes are the same ones as Paper 2.
- [ ] **FC6 batch table** (batch 1 to 1,024, shares of peak 0.07%, 1.2%, 4.6%, 17%, 56% and weights-only 0.07%, 1.2%, 4.7%, 19%, 76%). *Checked by script.*
- [ ] **Accelerator-like ridge of 2,706** and the batch of about 1,353 for weights only. *Checked by arithmetic* from the peak and bandwidth below.
- [ ] **The Try-it tasks in Parts 1 to 4** were checked by driving each widget in a browser and reading the numbers shown.

## Numbers borrowed from other papers

- [ ] **First TPU: 92 T ops/s peak and 34 GB/s of DDR3 bandwidth** (accelerator-like machine, Step 4.1 and 4.3). The 92 TOPS figure was *Checked* against search results for Paper 5. The 34 GB/s figure is *Memory, high confidence* and will be confirmed in the Paper 5 lesson. Until then, treat the "matches the first TPU" sentence as unconfirmed.
- [ ] **"Paper 5 asks what a much faster memory would do for the TPU."** *Memory.* A hint, not a claim about its numbers.
- [ ] **"Paper 5 uses operations per weight byte and keeps activations on chip."** *Memory.* Check it there.

## Toy models (invented, not from the paper)

Labeled in the lesson. Their numbers are not results.

- **Toy machines:** CPU-like (100 G ops/s, 25 GB/s, ridge 4), GPU-like (100 T ops/s, 1 TB/s, ridge 100), accelerator-like (92 T ops/s, 34 GB/s, ridge 2,706). Only the last borrows real figures, and only from Paper 5.
- **rooflineBasic, upgradeLab, ceilingsLab:** the baseline machine above. The ceiling factors (4, 2, 2, 2) are ours.
- **tileOI:** T / 4, capped at N / 6, with 0.25 when three tiles do not fit.
- **layerRoofline and oiCalc:** best-case traffic, each value moved once.
- **Bakery:** invented numbers.

## Practice problems

`experiments/numbers.cjs` recomputes all ten numeric answers from the numbers stated in each problem and fails if the lesson's `check` values differ by more than 3%.

```
node papers/03-roofline/experiments/numbers.cjs
```
