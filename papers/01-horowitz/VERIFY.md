# Verification checklist for Paper 1

This lesson was written without a copy of the PDF open. The paper's host sites could not be reached from the authoring environment. Key facts were cross-checked against search results and secondary sources that quote the paper. Anything that could not be confirmed was softened, flagged in the lesson with a dagger, or turned into a reading task. Before you rely on the lesson, check the items below against the original: Horowitz, "Computing's Energy Problem (and what we can do about it)", ISSCC 2014, plenary session (find it in IEEE Xplore by title).

Legend: **Checked** means a search result or secondary source agreed. **Memory** means it comes from prior knowledge and the paper's own text could not be reopened. Check every **Memory** item first.

## The energy table (45 nm)

All values live in one place, `assets/js/hw.js`, so a correction there updates every lesson. Pico-joules per operation. The lesson marks every Memory value with a dagger.

- [ ] **32-bit integer add, 0.1 pJ.** *Checked.* A paper's energy table cites it as taken from Horowitz's 45 nm, 0.9 V table.
- [ ] **32-bit integer multiply, 3.1 pJ.** *Checked,* same source.
- [ ] **Floating-point operations span 0.4 to 3.7 pJ.** *Checked* as a range. The lesson reads the low end as the 16-bit float add (0.4 pJ) and the high end as the 32-bit float multiply (3.7 pJ). Confirm which entries are the endpoints.
- [ ] **32-bit float add 0.9 pJ and 16-bit float multiply 1.1 pJ.** *Memory.* They fall inside the checked 0.4 to 3.7 range.
- [ ] **8-bit add 0.03 pJ, 16-bit add 0.05 pJ, 8-bit multiply 0.2 pJ.** *Memory,* not confirmed by any source. The lesson shows that a width rule (add proportional to bits, multiply to bits squared) predicts 0.025 and 0.19 pJ from the 32-bit values, which is consistent with these numbers, but consistency is not confirmation. **Read these in the PDF first.**
- [ ] **Cache and SRAM reads (64-bit): 10 pJ for 8 KB, 100 pJ for 1 MB.** *Checked* as a range ("10 to 100 pJ depending on cache size"). **32 KB at 20 pJ:** *Memory.*
- [ ] **Off-chip DRAM, 1.3 to 2.6 nJ per 64-bit read.** *Checked* (1300 to 2600 pJ).
- [ ] **Process and voltage:** 45 nm and 0.9 V. *Checked* through the same secondary source. The Reading task in Step 2.2 asks the student to confirm both.
- [ ] The exact figure number of the table in the paper is not given in the lesson. Add it once you have the PDF.

## Our assumptions (not from the paper)

- **5 pJ and 650 pJ per 32-bit word.** We halve the paper's 64-bit values (10 pJ and 1.3 nJ). This matches the numbers many later papers quote for 32-bit words, but it is our convention. Marked as an assumption wherever used.
- **Word cost proportional to bits** (8-bit words cost one quarter): our assumption in the energy-accounting widget.
- **Three operands per multiply-add** with equal treatment of weights, inputs and partial sums: our simplification.
- **60 pJ instruction overhead** (default of the overhead widget): our guess, chosen only so the effect is visible. **Replace it with the paper's number** (reading task in Step 3.3).
- **Dennard scaling factors** (0.7 per generation, no leakage, no wire effects): the textbook rule. The lesson does not claim real chips followed it exactly.

## Facts and paraphrases

- [ ] Dennard scaling: Dennard et al., IEEE JSSC, 1974. *Memory, high confidence.*
- [ ] Moore's law: Moore, *Electronics*, 1965. Intel 4004 (1971) with about 2,300 transistors. *Memory, high confidence.*
- [ ] **Voltage scaling stopped in the mid-2000s, near 1 V.** *Memory.* The paper's own statement of when and at what voltage is a reading task in Step 1.3.
- [ ] **The paper says energy, not transistor count, is the limit.** *Memory,* high confidence. Paraphrase.
- [ ] **The paper breaks down the energy of an instruction in a general-purpose processor and finds the arithmetic a small part.** *Memory.* The lesson gives no numbers for it and asks the student to read them (Step 3.3).
- [ ] **The paper discusses examples of specialized hardware beating general-purpose cores.** *Memory.* The lesson gives no ratios (Step 4.2 reading task). An earlier draft considered a video-encoder example. It was left out because it could not be confirmed.
- [ ] **The paper argues that design cost is an obstacle and discusses better design methods.** *Memory.* Paraphrase, flagged in the lesson.
- [ ] **AlexNet: about 724 million MACs and 61 million weights.** *Checked by arithmetic.* `experiments/alexnet-count.cjs` recomputes both from the standard AlexNet layer shapes (two-group version): CONV layers 666 M MACs, FC layers 58.6 M, total 724 M MACs and 61.0 M weights. The lesson attributes these to the survey in Paper 2, so check them there too.
- [ ] Section names in the reading map are descriptive because the paper's exact headings could not be confirmed.

## Toy models (invented, not from the paper)

Labeled "Toy model" in the lesson. Their numbers are not results.

- **Power budget** (powerBudget): uses 4.6 pJ arithmetic, 5 pJ and 650 pJ words, 3 operands, and a 724 million multiply-add network.
- **Dennard widget** (dennard): the 0.7 shrink rule, three regimes.
- **Bit width** (bitwidth): add proportional to bits, multiply to bits squared, anchored at 32-bit values.
- **Instruction overhead** (overheadAmortize): the overhead per instruction is a guess.
- **Energy accounting** (energyBudget): see the assumptions above.
- **Weights table** in Step 5.1: 61 million weights at 650 pJ per 32-bit word, one read each.
- **Square-root rule for SRAM** in Step 2.3: our reading of the three SRAM rows. It matches 8 KB to 1 MB (128 times the size, 10 times the energy, square root 11.3). The 32 KB entry that supports the 4 times / 2 times prediction is itself a Memory value.

## Practice problems

`experiments/practice-answers.cjs` recomputes all ten numeric answers from the numbers stated in each problem and fails if the lesson's `check` values differ by more than 3%. Run it after any edit to `lesson-3.js`:

```
node papers/01-horowitz/experiments/practice-answers.cjs
```

The Try-it tasks in Parts 1 to 3 were checked by driving each widget in a browser and reading the numbers shown.
