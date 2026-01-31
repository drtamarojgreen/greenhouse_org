
const playwright = require('playwright');

(async () => {
    const browser = await playwright.chromium.launch();
    const context = await browser.newContext({
        ...playwright.devices['iPhone 12'],
        viewport: { width: 390, height: 844 }
    });
    const page = await context.newPage();

    console.log('Navigating to models.html...');
    await page.goto('http://localhost:3000/models.html?mobile=true');

    // Wait for the hub to appear
    console.log('Waiting for mobile hub...');
    await page.waitForSelector('.gh-mobile-overlay', { timeout: 10000 });

    // Capture English screenshot
    console.log('Capturing English screenshot...');
    await page.screenshot({ path: 'hub_en.png' });

    // Toggle to Spanish
    console.log('Toggling language...');
    await page.click('#gh-mobile-lang-btn');

    // Give it a moment to update
    await page.waitForTimeout(500);

    // Capture Spanish screenshot
    console.log('Capturing Spanish screenshot...');
    await page.screenshot({ path: 'hub_es.png' });

    // Check for specific text to verify
    const hubTitle = await page.innerText('.gh-hub-title');
    console.log('Hub Title (ES):', hubTitle);

    const langBtnText = await page.innerText('#gh-mobile-lang-btn');
    console.log('Lang Button Text (ES):', langBtnText);

    const modelTitle = await page.innerText('.gh-model-title');
    console.log('First Model Title (ES):', modelTitle);

    const selectBtnText = await page.innerText('.gh-mobile-btn');
    console.log('Select Button Text (ES):', selectBtnText);

    await browser.close();
})();
