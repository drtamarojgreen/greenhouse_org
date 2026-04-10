
import { test, expect } from '@playwright/test';
import * as fs from 'fs';

test('capture baseline 3d brain', async ({ page }) => {
  // Start a local server in the background or assume one is running.
  // For this environment, I'll use a direct file path if possible,
  // but usually it's better to use a server to avoid CORS/fetch issues.

  // I will use python to start a server
  // Actually, I can't start a server and keep it running for playwright in the same tool call easily
  // without using & and waiting.

  await page.goto('http://localhost:8000/docs/test_models.html');

  // Wait for the app to load
  await page.waitForSelector('#models-app-container', { timeout: 10000 });

  // Navigate to Neuro model and Launch 3D View
  // (Assuming test_models.html has these buttons or I can trigger them)

  // For now, let's just take a screenshot of the main page
  await page.screenshot({ path: '/home/jules/baseline_main.png' });

  // Launch 3D View - based on docs/js/models_ui_3d.js
  const launchBtn = await page.locator('#toggle-3d-btn');
  if (await launchBtn.isVisible()) {
    await launchBtn.click();
    await page.waitForTimeout(2000); // Wait for animation/render
    await page.screenshot({ path: '/home/jules/baseline_3d_view.png' });
  }
});
