/*
 * Smoke test for a lesson. Opens the lesson in headless Chromium from file://, walks every step,
 * answers every quiz correctly, and fails on console errors, render errors, missing glossary
 * terms and horizontal page overflow.
 *
 *   node tests/smoke.cjs                       # tests every lesson listed in assets/js/catalog.js
 *   node tests/smoke.cjs papers/01-tensorflow  # tests one lesson folder
 *   SHOTS=/some/dir node tests/smoke.cjs ...   # also saves a screenshot of every step
 *
 * Needs Playwright: `npm i -D playwright` (or a global install; set NODE_PATH to its parent folder).
 */
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const shots = process.env.SHOTS || '';
const viewport = process.env.MOBILE ? { width: 390, height: 800 } : { width: 1280, height: 900 };

function lessonFolders() {
  if (process.argv[2]) return [process.argv[2]];
  const src = fs.readFileSync(path.join(root, 'assets/js/catalog.js'), 'utf8');
  return [...src.matchAll(/lesson:\s*'([^']+)'/g)].map((m) => m[1]);
}

async function testLesson(browser, folder) {
  const problems = [];
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  page.on('console', (m) => {
    if (m.type() === 'error') problems.push('console error: ' + m.text());
  });
  page.on('pageerror', (e) => problems.push('page error: ' + e.message));

  const url = 'file://' + path.join(root, folder, 'index.html');
  await page.goto(url);
  await page.waitForSelector('.card h1');

  const total = await page.evaluate(() => MLS.player.flat.length);
  const glossaryKeys = await page.evaluate(() => Object.keys(MLS.glossary));
  let minutes = 0;
  let quizzes = 0;
  let practiceChecked = 0;
  let chats = 0;

  for (let i = 0; i < total; i++) {
    const info = await page.evaluate((idx) => {
      const f = MLS.player.flat[idx];
      const quizSpecs = [];
      const practiceSpecs = [];
      const chatSpecs = [];
      (function walk(blocks) {
        (blocks || []).forEach((b) => {
          if (!b || typeof b === 'string') return;
          if (b.t === 'quiz') quizSpecs.push({ answer: b.answer, n: b.options.length });
          if (b.t === 'chat') chatSpecs.push({ turns: b.turns.length, open: !!b.open });
          if (b.t === 'practice') b.problems.forEach((pr) => practiceSpecs.push({ level: pr.level, check: pr.check || null, hasSolution: !!pr.solution }));
          if (Array.isArray(b.body)) walk(b.body);
          if (b.tabs) b.tabs.forEach((t) => walk(t.body));
          if (b.left) walk(b.left.body);
          if (b.right) walk(b.right.body);
        });
      })(f.step.blocks);
      return { title: f.step.title, min: f.step.min || 0, part: f.part.id, quizSpecs, practiceSpecs, chatSpecs };
    }, i);
    minutes += info.min;
    const label = `step ${i + 1}/${total} "${info.title}"`;

    const h1 = await page.textContent('.card h1');
    if (!h1 || h1.trim() !== info.title) problems.push(`${label}: heading mismatch (${h1})`);
    if (await page.$('.callout.watch:has-text("failed to render")')) problems.push(`${label}: render error callout`);
    if (await page.$('.callout.watch:has-text("Unknown block type")')) problems.push(`${label}: unknown block type`);
    if (await page.$('.widget .wbody:has-text("Missing widget")')) problems.push(`${label}: missing widget`);

    const terms = await page.$$eval('button.term', (els) => els.map((e) => e.getAttribute('data-term')));
    terms.forEach((t) => {
      if (!glossaryKeys.includes(t)) problems.push(`${label}: glossary key "${t}" is not defined`);
    });

    // Answer every quiz correctly, in page order (quizzes inside hidden tabs are skipped).
    const quizEls = await page.$$('.quiz');
    for (let q = 0; q < quizEls.length && q < info.quizSpecs.length; q++) {
      const spec = info.quizSpecs[q];
      const opts = await quizEls[q].$$('.opt');
      if (opts.length !== spec.n) {
        problems.push(`${label}: quiz ${q} has ${opts.length} options, expected ${spec.n}`);
        continue;
      }
      const answers = Array.isArray(spec.answer) ? spec.answer : [spec.answer];
      if (!(await quizEls[q].isVisible())) continue;
      for (const a of answers) await opts[a].click();
      if (Array.isArray(spec.answer)) await (await quizEls[q].$('.actions button')).click();
      const ok = await quizEls[q].$('.feedback.ok');
      if (!ok) problems.push(`${label}: quiz ${q} did not accept the correct answer`);
      quizzes++;
    }

    // Chats: ask every question in order and check that each one adds a question and an answer.
    const chatEls = await page.$$('.chat');
    if (chatEls.length !== info.chatSpecs.length) problems.push(`${label}: ${chatEls.length} chat blocks, expected ${info.chatSpecs.length}`);
    for (let c = 0; c < chatEls.length && c < info.chatSpecs.length; c++) {
      const spec = info.chatSpecs[c];
      const afterEl = await page.$('.chatwrap > .chatafter');
      if (afterEl && (await afterEl.isVisible())) problems.push(`${label}: chat ${c} shows its closing blocks before the last answer`);
      for (let k = 0; k < spec.turns; k++) {
        const ask = await chatEls[c].$('.askbtn');
        if (!ask) {
          problems.push(`${label}: chat ${c} ran out of questions after ${k} of ${spec.turns}`);
          break;
        }
        await ask.click();
      }
      const bubbles = (await chatEls[c].$$('.bubble')).length;
      const expected = spec.turns * 2 + (spec.open ? 1 : 0);
      if (bubbles !== expected) problems.push(`${label}: chat ${c} shows ${bubbles} bubbles, expected ${expected}`);
      if (await chatEls[c].$('.askbtn')) problems.push(`${label}: chat ${c} still offers a question after the last turn`);
      if (afterEl && !(await afterEl.isVisible())) problems.push(`${label}: chat ${c} did not show its closing blocks after the last answer`);
      chats++;
    }

    // Practice problems: check that a wrong answer is refused, the right answer is accepted,
    // and that every hint and solution opens and has content.
    if (info.practiceSpecs.length) {
      const cards = await page.$$('.problem');
      if (cards.length !== info.practiceSpecs.length) problems.push(`${label}: ${cards.length} problem cards, expected ${info.practiceSpecs.length}`);
      for (let q = 0; q < cards.length && q < info.practiceSpecs.length; q++) {
        const spec = info.practiceSpecs[q];
        if (!spec.hasSolution) problems.push(`${label}: practice problem ${q + 1} has no solution`);
        if (spec.check) {
          const input = await cards[q].$('input.numinput');
          const go = await cards[q].$('.pcheck button');
          await input.fill(String(spec.check.answer * 3 + 7));
          await go.click();
          if (!/Not yet/.test(await cards[q].textContent('.pfb'))) problems.push(`${label}: practice problem ${q + 1} accepted a wrong answer`);
          await input.fill(String(spec.check.answer));
          await go.click();
          if (!/Correct/.test(await cards[q].textContent('.pfb'))) problems.push(`${label}: practice problem ${q + 1} rejected the right answer ${spec.check.answer}`);
          practiceChecked++;
        }
        for (const sum of await cards[q].$$('details.reveal > summary')) {
          await sum.click();
        }
        const solText = await cards[q].$eval('details.reveal:last-of-type', (d) => d.textContent.trim().length);
        if (solText < 30) problems.push(`${label}: practice problem ${q + 1} has a very short solution`);
      }
    }

    // Step through any graph walkthrough to the last frame.
    const nextStep = await page.$('.walk .wnav button.primary');
    if (nextStep) {
      for (let k = 0; k < 20; k++) {
        if (await nextStep.isDisabled()) break;
        await nextStep.click();
      }
    }

    // Flip every flip card and open every tab, to make sure nothing throws.
    for (const card of await page.$$('button.flip')) await card.click();
    for (const tab of await page.$$('[role=tab]')) {
      if (await tab.isVisible()) await tab.click();
    }

    // Open every hidden detail so the overflow check below sees the longest version of the page.
    await page.$$eval('details.reveal', (els) => els.forEach((d) => { d.open = true; }));

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (overflow > 2) problems.push(`${label}: page scrolls sideways by ${overflow}px`);

    if (shots) {
      fs.mkdirSync(shots, { recursive: true });
      const name = String(i + 1).padStart(2, '0') + '-' + info.part + '.png';
      await page.screenshot({ path: path.join(shots, name), fullPage: true });
    }
    if (i < total - 1) await page.click('.pager .btn.primary');
  }

  console.log(`${folder}: ${total} steps, ${quizzes} quizzes answered, ${practiceChecked} practice answers checked, ${chats} chats clicked through, about ${minutes} minutes of content, viewport ${viewport.width}px`);
  await ctx.close();
  return problems;
}

async function testLanding(browser) {
  const problems = [];
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  page.on('console', (m) => {
    if (m.type() === 'error') problems.push('landing console error: ' + m.text());
  });
  page.on('pageerror', (e) => problems.push('landing page error: ' + e.message));
  await page.goto('file://' + path.join(root, 'index.html'));
  await page.waitForSelector('.pcard');
  const cards = await page.$$eval('.pcard', (els) => els.length);
  if (cards !== 24) problems.push(`landing: expected 24 paper cards, found ${cards}`);
  await page.click('button.chip:has-text("Starter 10")');
  const starter = await page.$$eval('.pcard', (els) => els.length);
  if (starter !== 10) problems.push(`landing: expected 10 starter cards, found ${starter}`);
  await ctx.close();
  return problems;
}

(async () => {
  const browser = await chromium.launch();
  let problems = await testLanding(browser);
  for (const folder of lessonFolders()) problems = problems.concat(await testLesson(browser, folder));
  await browser.close();
  if (problems.length) {
    console.error('\nFAILED:\n - ' + problems.join('\n - '));
    process.exit(1);
  }
  console.log('OK: no problems found');
})();
