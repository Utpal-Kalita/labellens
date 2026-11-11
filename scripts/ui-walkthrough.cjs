// Functional walkthrough: drives the real LabelLens UI end to end under Xvfb
// and screenshots every screen. Uses the SIMULATED signal source (no camera in
// CI); the app labels all simulated values visibly.
const { _electron: electron } = require('playwright-core');
const SHOT = (n) => `/tmp/ll-shots/${n}.png`;
const t = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  const app = await electron.launch({ args: ['.', '--no-sandbox'] });
  const page = await app.firstWindow();
  page.setDefaultTimeout(15000);
  page.on('dialog', d => d.accept());
  await page.waitForLoadState('domcontentloaded');
  await t(1500);

  await page.screenshot({ path: SHOT('01-overview') });

  // Experiments -> create
  await page.click('text=Experiments');
  await t(600);
  await page.click('button:has-text("New experiment")');
  await t(400);
  await page.fill('input[placeholder="Protein rice — label redesign"]', 'Cereal label study');
  await page.fill('input[placeholder="Which nutritional label layout do consumers read faster and more accurately?"]', 'Which label layout makes sugar content easier to find?');
  await page.fill('input[placeholder="Packaged food"]', 'Breakfast cereal');
  await page.fill('textarea', 'Compare two nutrition label layouts for findability of sugar and allergen info.');
  await page.screenshot({ path: SHOT('02-new-experiment') });
  await page.click('button:has-text("Create experiment")');
  await t(1200);
  await page.click('text=Cereal label study');
  await t(1200);
  await page.screenshot({ path: SHOT('03-experiment-detail') });

  // Upload two packaging designs (single-file input, used twice)
  await page.setInputFiles('input[type=file]', '/tmp/ll-assets/label-a.png');
  await t(1500);
  await page.setInputFiles('input[type=file]', '/tmp/ll-assets/label-b.png');
  await t(1500);
  await page.screenshot({ path: SHOT('04-packaging-uploaded') });

  // Add two template tasks
  await page.click('text=+ Sugar identification');
  await t(300);
  await page.click('button:has-text("Add task")');
  await t(800);
  await page.click('text=+ Allergen identification');
  await t(300);
  await page.click('button:has-text("Add task")');
  await t(800);
  await page.screenshot({ path: SHOT('05-tasks-added') });

  // Start participant session (simulated)
  await page.click('button:has-text("Start participant session")');
  await t(1000);
  await page.screenshot({ path: SHOT('06-session-setup') });
  await page.click('text=Simulated rehearsal');
  await t(300);
  await page.click('button:has-text("Continue")');
  await t(1200);
  await page.screenshot({ path: SHOT('07-welcome') });
  await page.click('button:has-text("Start experiment")');
  await t(800);
  await page.screenshot({ path: SHOT('08-consent') });
  await page.click('button:has-text("Continue")');
  await t(3000);
  await page.screenshot({ path: SHOT('09-calibration') });

  // calibration should pass quickly in simulated mode; then start baseline (30s)
  await t(5000);
  await page.screenshot({ path: SHOT('10-calibration-passed') });
  await page.click('button:has-text("Start 30s baseline")');
  await t(4000);
  await page.screenshot({ path: SHOT('11-baseline-running') });
  await t(28000);
  await page.screenshot({ path: SHOT('12-first-task') });

  // answer all tasks until complete
  for (let i = 0; i < 10; i++) {
    const ans = await page.$('input[placeholder="Your answer"]');
    if (ans) { try { await ans.fill('18g'); } catch {} }
    else { const opt = await page.$('label:has-text("Contains peanuts")'); if (opt) await opt.click(); }
    const submit = await page.$('button:has-text("Submit answer")') || await page.$('button:has-text("Submit")');
    if (submit) { await submit.click(); await t(700); }
    if (i === 0) await page.screenshot({ path: SHOT('13-feedback') });
    const star = await page.$('button:text-is("2")');
    if (star) { try { await star.click(); await t(200); } catch {} }
    const next = await page.$('button:has-text("Next task")') || await page.$('button:has-text("Next design")') || await page.$('button:has-text("Finish")');
    if (next) { await next.click(); await t(1000); }
    const done = await page.$('text=/session complete|thank you/i');
    if (done) break;
  }
  await page.screenshot({ path: SHOT('14-complete') });

  // Analytics
  const back = await page.$('button:has-text("Back to experiment"), a:has-text("Back to experiment")');
  if (back) { await back.click(); await t(1000); }
  await page.click('text=Analytics');
  await t(1500);
  await page.screenshot({ path: SHOT('15-analytics') });

  // pick the session in the timeline dropdown
  const sel = await page.$$('select');
  if (sel.length) {
    const opts = await sel[0].$$('option');
    if (opts.length > 1) { await sel[0].selectOption({ index: 1 }); await t(2000); }
  }
  await page.screenshot({ path: SHOT('16-timeline') });

  // Delete the participant session data
  const del = await page.$('button:has-text("Delete data")');
  if (del) { await del.click(); await t(1200); }
  await page.screenshot({ path: SHOT('17-after-delete') });

  await app.close();
  console.log('walkthrough done');
})().catch(e => { console.error('WALKTHROUGH ERROR:', e.message.split('\n')[0]); process.exit(1); });
