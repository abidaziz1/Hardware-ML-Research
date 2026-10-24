# Hardware ML Course: Interactive Paper Lessons

Learn 24 papers on **computer architecture for AI and hardware/software co-design**. Each paper is an interactive lesson. You read one part, press **Next**, try a simulation, check yourself with a quiz, and move on. Every lesson ends with **practice problems** (simple, medium and hard) whose solutions stay hidden until you open them.

Sub-areas: memory and data movement, dataflow, accelerators, efficient inference, mapping and runtime.

## Start here

Open `index.html` in a browser. No install, no build step, no server needed. Then open **Paper 1: Horowitz**.

To serve it locally instead:

```
python3 -m http.server 8000
```

To publish it, enable GitHub Pages (Settings, Pages, deploy from branch, root folder). The site is plain files, so it works as is. Note that GitHub Pages on a private repository needs a paid plan.

## What a lesson looks like

1. **A real-life example first.** You meet the idea in a kitchen, a warehouse or a road trip before you see the paper's term for it.
2. **Short steps.** Papers 6 and later use steps of about 100 words, one thing to touch per step, and a one-sentence takeaway. Papers 1 to 5 are longer and denser. See [docs/STYLE.md](docs/STYLE.md).
3. **Something to play with.** Sliders, step-through diagrams, small models of the hardware, and short question-and-answer chats you click through.
4. **A check.** Predict-first questions, quizzes with a reason for every wrong answer, and a final quiz that tells you which parts to revisit.
5. **What to check against the paper.** Notes on facts we could not verify sit in collapsed boxes, so they never get in the way of the explanation.
6. **A reading map.** Which sections of the real paper to read closely, which to skim, and reading tasks to do while you read.
7. **Practice.** Simple, medium and hard problems with hints and full solutions that you reveal only when you want them.

Every figure, table and widget carries a tag: **From the paper**, **Redrawn from the paper**, **Original diagram**, or **Toy model, not from the paper**. You can always tell the authors' data from our teaching aids.

Progress is saved in your browser only. Nothing is uploaded.

## The reading list

| Status | Papers |
|---|---|
| Ready | 1. Horowitz (ISSCC 2014), 2. Sze survey (Proc. IEEE 2017), 3. Roofline (CACM 2009), 4. Eyeriss (ISCA 2016), 5. TPU (ISCA 2017), 6. EIE (ISCA 2016) |
| Planned, Tier 1 | 7. SCNN, 8. Timeloop, 9. MAESTRO, 10. Accelergy, 11. TOPS/W considered harmful, 12. TETRIS |
| Planned, Tier 2 | 13. HAQ, 14. Once-for-All, 15. MCUNet, 16. MCUNetV2, 17. FINN |
| Planned, Tier 3 | 18. FlashAttention, 19. PagedAttention, 20. LLMCompass |
| Planned, Tier 4 | 21. TPU v4, 22. FlexGen |
| Planned, Tier 5 | 23. DIAMoND (ISCA 2026), 24. MoEBlaze (MLSys 2026) |

The full list with authors and venues lives in `assets/js/catalog.js`. The "Starter 10" filter on the home page marks the ten papers to read first: Horowitz, Sze, Roofline, Eyeriss, TPU, Timeloop, MAESTRO, MCUNet, MCUNetV2 and FlashAttention.

## Repository layout

```
index.html                 course home page (reads assets/js/catalog.js)
assets/
  css/site.css             all styles, light and dark themes
  js/core.js               DOM, markup, storage helpers
  js/graphkit.js           draws small directed graphs as SVG
  js/ui.js                 sliders, segmented buttons, stat boxes
  js/engine.js             the lesson player and every block type (including practice problems)
  js/glossary-common.js    terms shared by all lessons
  js/catalog.js            the 24-paper reading list
papers/
  NN-short-name/           one folder per paper: lesson text, widgets, glossary, VERIFY.md
  _template/               copy this to start a new paper
docs/AUTHORING.md          how to write the next lesson (blocks and tests)
docs/STYLE.md              how to write it so it reads easily (budgets and the step recipe)
tests/smoke.cjs            browser test for every lesson
tests/density.cjs          reading-load report: words, sentence length, terms and boxes per step
```

## Writing the next lesson

Read [docs/STYLE.md](docs/STYLE.md) for how to write a step, then [docs/AUTHORING.md](docs/AUTHORING.md) for the blocks. In short: copy `papers/_template`, fill in the parts, register the paper in `assets/js/catalog.js`, and run the smoke test and the reading-load report.

## Testing

The smoke test opens each lesson in headless Chromium, walks every step, answers every quiz, types the correct answer into every practice problem that has a numeric check (and a wrong one, to confirm it is refused), and fails on console errors, missing glossary terms or sideways scrolling on a phone.

```
npm install
npm test                       # all lessons, desktop width
MOBILE=1 npm test              # phone width
SHOTS=/tmp/shots npm test      # also save a screenshot of every step
node tests/density.cjs papers/06-eie   # reading load per step against the budgets in docs/STYLE.md
```

## A note on accuracy

Each lesson ships a `VERIFY.md` that lists the facts to check against the original PDF: every number, section reference and paraphrase, plus the scripts that produced the practice answers. Read the original paper too. The lesson is a guide to the paper, not a replacement for it.

Each lesson also has a script that recomputes its own arithmetic and every numeric practice answer, and fails if the lesson text disagrees:

```
node papers/02-sze-survey/experiments/numbers.cjs
node papers/01-horowitz/experiments/practice-answers.cjs
```

The same check exists in `papers/03-roofline`, `papers/04-eyeriss`, `papers/05-tpu` and `papers/06-eie`. Paper 6 also has `experiments/tryit.cjs`, which drives every widget in a browser and checks each claim in the "Try it" boxes.

## History

This repository previously held a short text note on the Roofline model. That content is in the git history before the interactive course was added.
