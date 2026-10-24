/*
 * Reading-load report for lessons. It opens each step in headless Chromium and measures what a
 * reader meets on that screen, then flags steps that are over budget (see docs/STYLE.md).
 *
 *   node tests/density.cjs                          # every lesson in assets/js/catalog.js
 *   node tests/density.cjs papers/06-eie            # one lesson
 *   BUDGET=0 node tests/density.cjs                 # report only, no warnings
 *   VERBOSE=1 node tests/density.cjs papers/06-eie  # one line per step
 *
 * What counts as "visible words": all text on the step except widgets, quiz questions, figures,
 * the heading, flip-card backs, buttons and anything inside a closed <details> (optional detail).
 * Collapsed text is counted apart. Practice and final-quiz steps are reported but not held to the budget.
 * Boxes are callouts plus takeaways. Terms are glossary links the reader sees underlined.
 *
 * Budgets (per step): 150 visible words, 45 words in the longest paragraph, 25 words in the longest
 * sentence, 2 glossary terms, 2 boxes, 1 table. A lesson passes when 90% of its steps are within budget.
 */
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const budgetOn = process.env.BUDGET !== '0';
const verbose = !!process.env.VERBOSE;
const BUDGET = { words: 150, para: 45, sentence: 25, terms: 2, boxes: 2, tables: 1 };

function lessonFolders() {
  if (process.argv[2]) return [process.argv[2]];
  const src = fs.readFileSync(path.join(root, 'assets/js/catalog.js'), 'utf8');
  return [...src.matchAll(/lesson:\s*'([^']+)'/g)].map((m) => m[1]);
}

function measureStep() {
  const card = document.querySelector('.card');
  const count = (t) => (t || '').split(/\s+/).filter(Boolean).length;
  const clone = card.cloneNode(true);
  clone.querySelectorAll('.kicker, h1').forEach((e) => e.remove());
  const collapsed =
    Array.from(clone.querySelectorAll('details')).reduce((n, d) => n + count(d.textContent), 0) +
    Array.from(clone.querySelectorAll('.flip .back')).reduce((n, b) => n + count(b.textContent), 0);
  /* Widgets, quizzes, figures, collapsed text and controls are not part of the prose a reader must get through. */
  clone.querySelectorAll('details, .widget, .quiz, figure, svg, .flip .back, .flip .hintline, .chat .askbtn, .walk .wnav, button:not(.term)').forEach((e) => e.remove());
  const words = count(clone.textContent);
  /* Sentence length is measured on prose only: paragraphs, list items and definitions, one element at a time. */
  const prose = Array.from(clone.querySelectorAll('p, li, dd')).filter((e) => !e.querySelector('p, li, dd'));
  const sentences = [];
  prose.forEach((e) => {
    e.textContent
      .replace(/\s+/g, ' ')
      .trim()
      .split(/(?<=[.!?])\s+(?=[A-Z0-9(*])/)
      .forEach((t) => {
        if (count(t) > 0) sentences.push({ text: t, n: count(t) });
      });
  });
  const longest = sentences.reduce((a, b) => (b.n > a.n ? b : a), { n: 0, text: '' });
  const paras = prose.map((p) => count(p.textContent));
  const allText = clone.textContent;
  const longWords = allText.split(/\s+/).filter((w) => w.replace(/[^A-Za-z]/g, '').length >= 10).length;
  return {
    words,
    collapsed,
    terms: card.querySelectorAll('button.term').length,
    boxes: card.querySelectorAll('.callout, .takeaway').length,
    tables: card.querySelectorAll('.tablewrap').length,
    longPara: Math.max(0, ...paras),
    longSentence: longest.n,
    longSentenceText: longest.text,
    avgSentence: sentences.length ? sentences.reduce((a, b) => a + b.n, 0) / sentences.length : 0,
    longWords,
    practice: !!card.querySelector('.practice, .finalquiz'),
    interactive: card.querySelectorAll('.widget, .quiz, .chat, details.reveal, .walk').length
  };
}

(async () => {
  const browser = await chromium.launch();
  const rows = [];
  const warnings = [];
  for (const folder of lessonFolders()) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto('file://' + path.join(root, folder, 'index.html'));
    await page.waitForSelector('.card h1');
    const total = await page.evaluate(() => MLS.player.flat.length);
    const stats = [];
    for (let i = 0; i < total; i++) {
      await page.evaluate((idx) => {
        const f = MLS.player.flat[idx];
        MLS.player.goTo(f.part.id, f.si);
      }, i);
      const s = await page.evaluate(measureStep);
      s.title = await page.textContent('.card h1');
      s.idx = i + 1;
      const over = [];
      if (s.practice) {
        s.over = over;
        if (verbose) console.log(`${folder} #${s.idx} ${s.title}: ${s.words} words (practice or quiz step, not counted against the budget)`);
        stats.push(s);
        continue;
      }
      if (s.words > BUDGET.words) over.push(`${s.words} words`);
      if (s.longPara > BUDGET.para) over.push(`paragraph of ${s.longPara} words`);
      if (s.longSentence > BUDGET.sentence) over.push(`sentence of ${s.longSentence} words`);
      if (s.terms > BUDGET.terms) over.push(`${s.terms} glossary terms`);
      if (s.boxes > BUDGET.boxes) over.push(`${s.boxes} boxes`);
      if (s.tables > BUDGET.tables) over.push(`${s.tables} tables`);
      s.over = over;
      stats.push(s);
      if (verbose) {
        console.log(`${folder} #${s.idx} ${s.title}: ${s.words} words, ${s.collapsed} collapsed, ${s.terms} terms, ${s.boxes} boxes, para ${s.longPara}, sentence ${s.longSentence}${over.length ? '  OVER: ' + over.join(', ') : ''}`);
        if (s.longSentence > BUDGET.sentence) console.log(`    longest sentence: ${s.longSentenceText}`);
      }
    }
    const sum = (k) => stats.reduce((a, s) => a + s[k], 0);
    const within = stats.filter((s) => !s.over.length).length;
    const allWords = sum('words');
    rows.push({
      lesson: path.basename(folder),
      steps: total,
      'avg words': Math.round(allWords / total),
      'max words': Math.max(...stats.map((s) => s.words)),
      'avg sentence': (stats.reduce((a, s) => a + s.avgSentence, 0) / total).toFixed(1),
      'long words /100': ((sum('longWords') / allWords) * 100).toFixed(1),
      'longest para': Math.max(...stats.map((s) => s.longPara)),
      'terms /step': (sum('terms') / total).toFixed(1),
      'boxes /step': (sum('boxes') / total).toFixed(1),
      'tables /step': (sum('tables') / total).toFixed(1),
      'first screen': stats[0].words + ' words, ' + stats[0].terms + ' terms',
      'collapsed words': sum('collapsed'),
      'within budget': within + ' of ' + total
    });
    if (budgetOn && within / total < 0.9) {
      warnings.push(`${folder}: only ${within} of ${total} steps are within the reading budget`);
      stats.filter((s) => s.over.length).forEach((s) => warnings.push(`  #${s.idx} ${s.title}: ${s.over.join(', ')}`));
    }
    await page.close();
  }
  console.table(rows);
  await browser.close();
  if (warnings.length) {
    console.error('\nOver budget:\n' + warnings.join('\n'));
    process.exitCode = 1;
  }
})();
