/*
 * Drives the Paper 6 widgets in a real browser and checks every claim in the "Try it" boxes and the
 * numbers quoted next to widgets. It reads what a student would read on the screen.
 *
 *   node papers/06-eie/experiments/tryit.cjs        (needs Playwright, see tests/smoke.cjs)
 */
const { chromium } = require('playwright');
const path = require('path');

let failures = 0;
function check(name, actual, wanted) {
  const ok = String(actual) === String(wanted);
  if (!ok) failures++;
  console.log((ok ? '  ok   ' : '  FAIL ') + name + ': ' + actual + (ok ? '' : '   (expected ' + wanted + ')'));
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await page.goto('file://' + path.resolve(__dirname, '..', 'index.html'));
  await page.waitForSelector('.card h1');
  const go = async (id) => {
    await page.evaluate((stepId) => {
      const f = MLS.player.flat.filter((x) => x.step.id === stepId)[0];
      MLS.player.goTo(f.part.id, f.si);
    }, id);
    await page.waitForTimeout(80);
  };
  const stat = async (label) =>
    page.evaluate((l) => {
      const el = [...document.querySelectorAll('.stat')].filter((s) => s.querySelector('.k').textContent.toLowerCase().startsWith(l.toLowerCase()))[0];
      return el ? el.querySelector('.v').textContent.trim() : null;
    }, label);
  const msg = async () => page.evaluate(() => [...document.querySelectorAll('.widget .msg')].map((m) => m.textContent.trim()).filter(Boolean).pop());
  const setSlider = async (index, value) =>
    page.evaluate(
      ([i, v]) => {
        const el = document.querySelectorAll('.widget input[type=range]')[i];
        el.value = v;
        el.dispatchEvent(new Event('input', { bubbles: true }));
      },
      [index, value]
    );

  console.log('Step: kitchen');
  await go('kitchen');
  await page.click('.eie-kt .totalbtn >> nth=2');
  check('Tomato equation', await msg(), 'Tomato: 80 × 3 + 100 × 2 + 150 × 0 + 60 × 4 = 680 g');
  const totalsBefore = await page.$$eval('.eie-kt .totalbtn', (els) => els.map((e) => e.textContent));
  await page.click('button[aria-label="One more soup order"]');
  await page.click('button[aria-label="One more soup order"]');
  const totalsAfter = await page.$$eval('.eie-kt .totalbtn', (els) => els.map((e) => e.textContent));
  check('soup 0 to 2 changes only tomato, by 300 g', totalsAfter.map((t, i) => Number(t) - Number(totalsBefore[i])).join(','), '0,0,300');

  console.log('Step: layer');
  await go('layer');
  check('AlexNet FC6 weights', await stat('Weights in the book'), '37.7 M');
  await page.click('.seg button:text-is("VGG-16")');
  check('VGG-16 FC6 weights', await stat('Weights in the book'), '102.8 M');
  check('VGG-16 FC6 over AlexNet FC6', (102760448 / 37748736).toFixed(1), '2.7');

  console.log('Step: cost');
  await go('cost');
  check('batch 1, DRAM, per multiply-add', await stat('Per multiply-add, weights in DRAM'), '655 pJ');
  check('batch 1, SRAM, per multiply-add', await stat('Per multiply-add, weights in SRAM'), '9.6 pJ');
  check('read share at batch 1', await stat('Share spent on reading'), '99.3%');
  await setSlider(0, 7);
  check('batch 128 message still says the read is larger', /still larger than the math/.test(await msg()), true);
  await setSlider(0, 8);
  check('batch 256 message says the math costs more', /math now costs more than the DRAM read/.test(await msg()), true);

  console.log('Step: prune');
  await go('prune');
  await setSlider(0, 50);
  check('50% pruned: output change', await stat('Output change'), '19%');
  await setSlider(0, 90);
  check('90% pruned: weights left', await stat('Weights left'), '26 of 256');

  console.log('Step: share');
  await go('share');
  await page.click('.seg button:text-is("4 bits")');
  check('4 bits: error', await stat('Average error'), '9%');
  await page.click('.seg button:text-is("1 bit")');
  check('1 bit: error', await stat('Average error'), '66%');
  await page.click('.seg button:text-is("3 bits")');
  check('3 bits: error', await stat('Average error'), '17%');
  await page.click('.seg button:text-is("2 bits")');
  check('2 bits: error', await stat('Average error'), '43%');

  console.log('Step: store');
  await go('store');
  check('column 2 default selection text', /Column 2 starts at entry 2 and ends before entry 6, so it has 4 entries/.test(await msg()), true);
  check('column 2 rows', (await page.$$eval('.eie-rebuild li', (els) => els.map((e) => e.textContent.split('= ').pop()))).join(','), '0,2,3,7');
  await page.click('button[aria-label="Select column 1"]');
  check('column 1 is empty', /no entries/.test(await page.textContent('.eie-rebuild')), true);
  check('shrink factor', await stat('Smaller by'), '15 times');

  console.log('Step: total');
  await go('total');
  check('default stored size', await stat('Stored'), '5.9 MB');
  check('default shrink', await stat('Smaller by'), '40 times');
  await setSlider(0, 14);
  check('14% still fits AlexNet', /^Fits/.test(await msg()), true);
  await setSlider(0, 15);
  check('15% does not fit AlexNet', /^Does not fit/.test(await msg()), true);
  await page.click('.seg button:has-text("VGG-16")');
  await setSlider(0, 6);
  check('6% fits VGG-16', /^Fits/.test(await msg()), true);
  await setSlider(0, 7);
  check('7% does not fit VGG-16', /^Does not fit/.test(await msg()), true);

  console.log('Step: zeros');
  await go('zeros');
  check('before ReLU, columns read', await stat('Columns you read'), '12 of 12');
  await page.click('button:text-is("Apply ReLU")');
  check('after ReLU, columns read', await stat('Columns you read'), '4 of 12');
  check('after ReLU, entries read', await stat('Stored entries you read'), '34 of 109 (31%)');
  const negatives = await page.$$('.zt.skip .zin');
  for (const n of negatives) await n.click();
  check('after flipping every negative, columns read', await stat('Columns you read'), '12 of 12');
  check('nothing to skip message', /nothing can be skipped/.test(await msg()), true);

  console.log('Step: split');
  await go('split');
  await page.click('button[aria-label="Select column 3"]');
  check('column 3 message', /Cook 1 has the most work \(3\)/.test(await msg()), true);
  await page.click('button[aria-label="Select column 7"]');
  check('column 7 message', /Cook 3 has the most work \(3\)/.test(await msg()), true);

  console.log('Step: race');
  await go('race');
  const run = async (n, d) => {
    await page.click('.seg button:text-is("' + n + ' cooks")');
    await page.click('.seg button:text-is("' + d + '")');
    await page.click('button:has-text("Run to the end")');
    return { cycles: await stat('Cycles so far'), busy: await stat('Cooks busy') };
  };
  const a = await run(4, 1);
  check('4 cooks, depth 1: cycles', a.cycles, '76');
  check('4 cooks, depth 1: busy', a.busy, '67%');
  const b = await run(4, 8);
  check('4 cooks, depth 8: cycles', b.cycles, '58');
  check('cycles saved', Number(a.cycles) - Number(b.cycles), 18);
  const c = await run(8, 1);
  check('8 cooks, depth 1: busy', c.busy, '62%');
  check('8 cooks are less busy than 4', parseInt(c.busy) < parseInt(a.busy), true);

  console.log('Step: energy');
  await go('energy');
  const rows = await page.$$eval('.erow', (els) => els.map((e) => [e.querySelector('.ev').textContent, e.querySelector('.efac').textContent]));
  check('DRAM to SRAM factor', rows[1][1], '130 times');
  check('pruning factor', rows[2][1], '10 times');
  check('sharing factor with 4-bit skips', rows[3][1], '4 times');
  check('zero-input factor', rows[4][1], '3 times');
  await setSlider(2, 0);
  const rows2 = await page.$$eval('.erow', (els) => els.map((e) => e.querySelector('.efac').textContent));
  check('sharing factor with 0 skip bits', rows2[3], '8 times');
  await setSlider(2, 4);
  check('end message says reading is cheaper than the math', /less than the math/.test(await msg()), true);
  check('total', await stat('All four together'), '15,758 times');

  console.log('Step: results');
  await go('results');
  check('figure draws four bars', await page.$$eval('.eie-results .bar', (els) => els.length), 4);

  console.log(errors.length ? 'Console errors: ' + errors.join(' | ') : 'No console errors.');
  console.log(failures || errors.length ? '\nFAILED: ' + failures + ' check(s) failed.' : '\nOK: every Try-it claim matches what the widgets show.');
  await browser.close();
  process.exit(failures || errors.length ? 1 : 0);
})();
