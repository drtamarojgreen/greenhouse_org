const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Navigate to the local server
  try {
    await page.goto('http://localhost:3000/neuro.html');

    // Wait for the app to initialize
    await page.waitForTimeout(2000);

    // Click the "Start Simulation" button if it exists (it's in an overlay)
    const startBtn = await page.$('#neuro-start-overlay button');
    if (startBtn) {
        await startBtn.click();
    }

    // Wait for some simulation to happen
    await page.waitForTimeout(3000);

    // Take a screenshot
    await page.screenshot({ path: '/home/jules/verification/neuro_check.png' });
    console.log('Neuro page screenshot saved to /home/jules/verification/neuro_check.png');

    // Check for errors in the console
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log(`PAGE ERROR: ${msg.text()}`);
        }
    });

  } catch (err) {
    console.error('Error during verification:', err);
  } finally {
    await browser.close();
  }
})();
