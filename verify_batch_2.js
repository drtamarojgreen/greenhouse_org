const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://0.0.0.0:3000/neuro');

  // Start simulation
  await page.click('#neuro-start-overlay button');

  // Select ADHD scenario
  await page.selectOption('select', 'adhd_symptoms');

  // Wait for some generations
  await page.waitForTimeout(5000);

  await page.screenshot({ path: 'verification/batch_2_verify.png' });
  await browser.close();
})();
