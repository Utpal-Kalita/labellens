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
  await page.click('text=Experiments');
  await t(800);
  await page.click('text=Cereal label study');
  await t(1200);
  // Session 2: incorrect answers
  await runSession(page, { text: '25g', mc: 'May contain traces' }, 's2');

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
  console.log('B done');
})().catch(e => { console.error('B ERROR:', e.message.split('\n')[0]); process.exit(1); });
