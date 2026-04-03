const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Listen for console logs and errors
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  await page.goto('http://127.0.0.1:8000/docs/test_models.html');

  // Wait for loading overlay to disappear
  await page.waitForSelector('#loading-overlay', { state: 'hidden', timeout: 10000 });

  console.log('Selecting Genetic Model...');
  await page.selectOption('#model-selector', 'genetic');

  // Wait for some time for the model to load and start
  await page.waitForTimeout(5000);

  await page.screenshot({ path: '/home/jules/genetic_model_check.png' });

  console.log('Selecting Neuro Model...');
  await page.selectOption('#model-selector', 'neuro');

  await page.waitForTimeout(5000);

  await page.screenshot({ path: '/home/jules/neuro_model_check.png' });

  await browser.close();
})();
