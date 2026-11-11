// Functional walkthrough v2: two sessions (correct vs incorrect answers) to
// validate scoring, then cascade-deletion evidence. Simulated source only.
const { _electron: electron } = require('playwright-core');
const SHOT = (n) => `/tmp/ll-shots/${n}.png`;
const t = (ms) => new Promise(r => setTimeout(r, ms));

async function runSession(page, answers, tag) {
  await page.click('button:has-text("Start participant session")');
  await t(1000);
  await page.click('text=Simulated rehearsal');
  await t(300);
  await page.click('button:has-text("Continue")');   // setup -> welcome
  await t(1200);
  await page.click('button:has-text("Start experiment")');
  await t(800);
  await page.click('button:has-text("Continue")');   // consent
  await t(6500);                                     // calibration (simulated)
  if (tag === 's1') await page.screenshot({ path: SHOT('10-calibration-passed') });
  await page.click('button:has-text("Start 30s baseline")');
  await t(32000);
  if (tag === 's1') await page.screenshot({ path: SHOT('12-first-task') });
  for (let i = 0; i < 10; i++) {
    const ans = await page.$('input[placeholder="Your answer"]');
    if (ans) { try { await ans.fill(answers.text); } catch {} }
    else {
      const opt = await page.$(`label:has-text("${answers.mc}")`);
      if (opt) await opt.click();
    }
    const submit = await page.$('button:has-text("Submit answer")');
    if (submit) { await submit.click(); await t(700); }
    if (tag === 's1' && i === 0) await page.screenshot({ path: SHOT('13-feedback') });
    const star = await page.$('button:text-is("2")');
    if (star) { try { await star.click(); await t(200); } catch {} }
    const next = await page.$('button:has-text("Next task")') || await page.$('button:has-text("Next design")') || await page.$('button:has-text("Finish")');
    if (next) { await next.click(); await t(1000); }
    const done = await page.$('text=/thank you for participating/i');
    if (done) break;
  }
  await page.screenshot({ path: SHOT(`14-complete-${tag}`) });
  await page.click('button:has-text("Back to experiment")');
  await t(1200);
}

(async () => {
  const app = await electron.launch({ args: ['.', '--no-sandbox'] });
  const page = await app.firstWindow();
  page.setDefaultTimeout(15000);
  page.on('dialog', d => d.accept());
  await page.waitForLoadState('domcontentloaded');
  await t(1500);

  await page.screenshot({ path: SHOT('01-overview') });
  await page.click('text=Experiments');
  await t(600);
  await page.click('button:has-text("New experiment")');
  await t(400);
  await page.fill('input[placeholder="Protein rice — label redesign"]', 'Cereal label study');
  await page.fill('input[placeholder="Which nutritional label layout do consumers read faster and more accurately?"]', 'Does a clear-hierarchy label make sugar content easier to find than a classic table?');
  await page.fill('input[placeholder="Packaged food"]', 'Breakfast cereal');
  await page.fill('textarea', 'Same nutritional content, two layouts. Compare findability of sugar and allergen info.');
  await page.click('button:has-text("Create experiment")');
  await t(1200);
  await page.click('text=Cereal label study');
  await t(1200);

  await page.setInputFiles('input[type=file]', '/tmp/ll-assets/label-a.png');
  await t(1500);
  await page.setInputFiles('input[type=file]', '/tmp/ll-assets/label-b.png');
  await t(1500);
  await page.screenshot({ path: SHOT('04-packaging-uploaded') });

  // Task 1: sugar (short text) with answer key 18g
  await page.click('text=+ Sugar identification');
  await t(300);
  let inputs = await page.$$('input:not([type=file])');
  await inputs[2].fill('18g');   // Expected answer field (title, instruction, expected, timelimit -> idx 2?) verify below
  await page.screenshot({ path: SHOT('05-task1-form') });
  await page.click('button:has-text("Add task")');
  await t(800);
  // Task 2: allergen (multiple choice) with answer key No peanuts
  await page.click('text=+ Allergen identification');
  await t(300);
  inputs = await page.$$('input:not([type=file])');
  await inputs[2].fill('May contain traces');
  await page.click('button:has-text("Add task")');
  await t(800);
  await page.screenshot({ path: SHOT('06-tasks-added') });

  // Session 1: correct answers
  await runSession(page, { text: '18g', mc: 'May contain traces' }, 's1');
  // Session 2: incorrect answers
  await runSession(page, { text: '25g', mc: 'No peanuts' }, 's2');

  await page.click('text=Analytics');
  await t(1500);
  await page.screenshot({ path: SHOT('15-analytics-2-sessions') });

  // select first session in timeline
  const sel = await page.$$('select');
  if (sel.length) {
    const opts = await sel[0].$$('option');
    if (opts.length > 1) { await sel[0].selectOption({ index: 1 }); await t(2000); }
  }
  await page.screenshot({ path: SHOT('16-timeline') });

  // delete ONE session, keep the other: cascade evidence
  const del = await page.$('button:has-text("Delete data")');
  if (del) { await del.click(); await t(1500); }
  await page.screenshot({ path: SHOT('17-after-delete') });

  await app.close();
  console.log('walkthrough done');
})().catch(e => { console.error('WALKTHROUGH ERROR:', e.message.split('\n')[0]); process.exit(1); });
