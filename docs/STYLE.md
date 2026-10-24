# Lesson style guide: plain language, short steps

Papers 1 to 5 were written for completeness. They averaged 230 to 265 visible words per step, sentences of 17 to 23 words, and first screens of 340 to 365 words. Almost no step fit on one screen. A reader who is not yet sure the topic is for them sees a wall of text and drifts.

Papers 6 and later follow this guide. `node tests/density.cjs papers/NN-name` measures a lesson against the budgets below. Write the lesson, run the report, cut until it passes.

## The recipe for every step

The reader should know what to do within three seconds of landing on a step.

1. **Title.** A plain question or statement, at most 8 words. "Why does the chip wait on memory?" beats "The memory wall".
2. **Hook** (`{ t: 'p', hook: true, text }`). One or two short sentences that put the reader in a situation or ask a question. No jargon.
3. **Story.** Two to four short paragraphs. A concrete example carries the idea. The paper's term arrives after the reader can already do the thing.
4. **One thing to touch.** A widget, a walkthrough, a figure or a chat. Pick one. Two competing interactives split attention.
5. **Takeaway** (`{ t: 'takeaway', text }`). One sentence the reader can say out loud without looking.
6. **Optional check.** One predict-first question before the reveal, or one question after.
7. **Optional, collapsed.** `{ t: 'reveal', tone: 'more', label: 'More detail: ...', body }` for extra depth. `tone: 'check'` with the label "Check this against the paper" for anything you could not verify.

## Budgets per step

| Measure | Budget | Why |
|---|---|---|
| Visible words (not counting widgets, quiz, figures, collapsed text) | 150 | About one screen. Under a minute of reading. |
| Longest paragraph | 45 words | Three short sentences. |
| Longest sentence | 25 words | Most sentences should be 12 to 18. |
| New glossary terms | 2 | Each underlined word is a small stop sign. |
| Boxes (callouts and takeaways) | 2 | A takeaway plus one more. Boxes compete for the eye. |
| Tables | 1 | And only after the idea is clear. |

A lesson passes when 90% of its steps are within budget. The first step has the tightest rule in practice: if the opening screen needs more than 120 words, cut it.

## Word rules

- **Plain word first, jargon second.** Write "the weights (the numbers the network learned)", then use "weights" every time. Never rename a thing halfway through.
- **One idea per sentence.** If a sentence has "which", "while" and "and" in it, split it.
- **Active voice, "you".** "You fetch 151 MB from DRAM" beats "151 MB must be fetched".
- **Every number gets a unit and something to compare with.** "151 MB, about 40 songs of music" tells the reader more than "151 MB".
- **No hedging in the main flow.** Verification notes go in a `check` reveal and in `VERIFY.md`.
- **Cut stock phrases.** "It is worth noting that", "in order to", "a number of", "essentially".
- **No dash as a pause.** Use a period or a comma.

### Before and after

Before (Paper 5): 72 words, 3 sentences, 24 words per sentence.

> Weight stationary is the right match when the workload gives each weight many uses and when you can afford a huge array with simple PEs. Paper 4 warned that weight stationary leaves partial sums and inputs expensive to move. The TPU answers with a design in which partial sums only travel between neighbors (cheap) and accumulate in a dedicated memory, and inputs are read once and flow across (reused by every column).

After: 73 words, 7 sentences, 10 words per sentence.

> Weight stationary suits a workload that uses each weight many times. It also needs a chip that can afford a huge array of simple PEs. Paper 4 named its weakness. Partial sums and inputs are expensive to move. The TPU fixes both. Partial sums hop only to a neighbor, which is cheap, then land in a dedicated memory. Each input is read once and flows across the array, so every column reuses it.

The two versions have the same facts and nearly the same length. The second reads faster because every sentence has one job. Length matters less than sentence shape.

## Examples

Pick one running example for the whole lesson and reuse it in every widget and every figure. Paper 6 uses a restaurant kitchen: the recipe book is the weight matrix, tonight's orders are the input vector, the ingredient totals are the output.

The example must be the real computation in everyday clothes, not a loose comparison. If a reader could not compute the answer from the example alone, the example is too vague.

## Where the extra goes

- **Details a curious reader may want:** `reveal` with `tone: 'more'`.
- **"Check this against the paper" notes, reading tasks, caveats about memory:** `reveal` with `tone: 'check'`, and also `VERIFY.md`.
- **Formulas:** after the reader has done one example by hand or in a widget, never before.
- **Tables:** only to compare three or more things the reader has already met.
- **Opinion:** a `note` callout titled "Our take", at the end of a part, not in the middle.

## The chat block

Use `chat` when a beginner would naturally ask "but why?" Two to four questions, each one a question a student would really type. Each answer is one to three sentences. The reader clicks to ask the next question, so they pull the explanation instead of receiving it.

```js
{ t: 'chat', turns: [
  { q: 'Why not just buy more memory?', a: 'Memory that sits next to the chip is small. Big memory sits far away, and every trip there costs about 100 times more energy.' },
  { q: 'So what do we do?', a: 'Shrink the weights until they fit on the chip.' }
] }
```

## Interactives

- One goal per widget, stated in one sentence above it ("Get all four cooks to finish within 20 cycles").
- The `try` callout lists at most three tasks, each with the number the reader should see.
- Every number a task promises has been checked by driving the widget. Do not guess.

## Checklist before you commit

1. `node tests/density.cjs papers/NN-name` passes.
2. Read the first screen of the first three steps out loud. Where you stumble, rewrite.
3. Every step ends with a takeaway you could say without looking.
4. The example appears in step 1 and again in the last step.
5. `node tests/smoke.cjs papers/NN-name` passes at desktop and at `MOBILE=1`.
6. `VERIFY.md` lists every fact as Checked or Memory.
