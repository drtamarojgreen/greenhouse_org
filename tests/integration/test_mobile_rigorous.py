import asyncio
from playwright.async_api import async_playwright
import os
import sys

async def test_meditation_app_rigorous(page, base_url):
    print("\n--- Rigorous Testing of Meditation App ---")
    await page.goto(f"{base_url}/mobile/app/index.html")

    # 1. Test Signup with Privacy Consent
    print("Testing Signup...")
    await page.click('#show-signup')
    await page.fill('#signup-name', 'Test User')
    await page.fill('#signup-email', 'test@example.com')
    await page.fill('#signup-password', 'password123')

    # Try to signup without consent
    # We expect an alert. Playwright handles dialogs.
    alert_text = ""
    async def handle_alert(dialog):
        nonlocal alert_text
        alert_text = dialog.message
        await dialog.dismiss()

    page.on("dialog", handle_alert)
    await page.click('#signup-button')
    print(f"  ✓ Alert text: {alert_text}")
    assert "agree" in alert_text.lower(), "Should alert about privacy consent"

    # Give consent and signup
    page.remove_listener("dialog", handle_alert)
    await page.check('#privacy-consent')
    await page.click('#signup-button')

    # Check if we reached meditation page
    await page.wait_for_selector('#meditation-page', state='visible')
    print("  ✓ Signup with consent successful")

    # 2. Test Breathing Rate Tapping
    print("Testing Breathing Rate...")
    # Tap 5 times with ~1 second intervals
    for i in range(5):
        await page.click('#breathing-circle')
        await asyncio.sleep(0.5)

    pre_breathing = await page.inner_text('#pre-run-breathing-value')
    print(f"  ✓ Pre-run breathing rate: {pre_breathing}")
    assert pre_breathing != '--', "Breathing rate should be calculated"

    # 3. Test Pulse Rate Sync
    print("Testing Pulse Rate...")
    await page.click('#connect-smartwatch')
    pre_pulse = await page.inner_text('#pre-run-pulse-value')
    print(f"  ✓ Pre-run pulse rate: {pre_pulse}")
    assert 'bpm' in pre_pulse, "Pulse rate should be calculated with bpm"

    # 4. Test Mood Score Slider
    print("Testing Mood Score...")
    await page.fill('#mood-dial-input', '8')
    # Trigger input event
    await page.evaluate("document.getElementById('mood-dial-input').dispatchEvent(new Event('input'))")
    mood_score = await page.inner_text('#mood-score-value')
    print(f"  ✓ Mood score updated to: {mood_score}")
    assert mood_score == '8', "Mood score should be 8"

    # 5. Test Reminders
    print("Testing Reminders...")
    await page.fill('#reminder-datetime', '2025-12-01T19:00')

    alert_triggered = False
    async def handle_reminder_alert(dialog):
        nonlocal alert_triggered
        alert_triggered = True
        await dialog.accept()

    page.on("dialog", handle_reminder_alert)
    await page.click('#set-reminder')

    notification_count = await page.inner_text('#notification-count')
    print(f"  ✓ Notification count: {notification_count}")
    assert notification_count == '1', "Notification count should increment"
    assert alert_triggered, "Alert should have been triggered"

    # 6. Test Scheduler
    print("Testing Scheduler...")
    await page.click('button[data-target="schedule-page"]')
    await page.wait_for_selector('#schedule-page', state='visible')

    await page.select_option('#event-type', 'running')
    await page.fill('#event-date', '2025-12-02')
    await page.fill('#event-time', '08:00')
    await page.click('#add-event-button')

    events = await page.inner_text('#event-list')
    print(f"  ✓ Event added: {events}")
    assert 'Running at 08:00 on 2025-12-02' in events, "Event should be in the list"

    await page.click('#schedule-page .back-button')
    # Wait for transition
    await asyncio.sleep(0.5)

    # 7. Test Meditation Scene
    print("Testing Meditation Scene...")
    await page.click('button[data-target="scene-page"]')
    await page.wait_for_selector('#scene-page', state='visible')

    await page.click('#play-pause-button')
    await asyncio.sleep(2)
    timer_val = await page.inner_text('#scene-timer')
    print(f"  ✓ Timer value after 2s: {timer_val}")
    assert timer_val != '15:00', "Timer should have decreased"

    await page.click('#play-pause-button')
    await page.click('#scene-page .back-button')
    await asyncio.sleep(0.5)

    # 8. Test History
    print("Testing History...")
    await page.click('button[data-target="history-page"]')
    await page.wait_for_selector('#history-page', state='visible')
    history = await page.inner_text('#history-list')
    print(f"  ✓ History populated")
    assert 'Yesterday' in history, "History should contain mock data"
    await page.click('#history-page .back-button')
    await asyncio.sleep(0.5)

    # 9. Test Notifications Modal
    print("Testing Notifications Modal...")
    await page.click('#notification-bell')
    await page.wait_for_selector('#notification-modal', state='visible')
    print("  ✓ Notification modal visible")
    await page.click('.close-button')
    # Wait for modal to hide
    await asyncio.sleep(0.5)

    return True

async def main():
    async with async_playwright() as p:
        device = p.devices['iPhone 12']
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(**device)
        page = await context.new_page()

        # Start local server
        print("Starting local server...")
        server_process = await asyncio.create_subprocess_exec(
            'python3', '-m', 'http.server', '8009',
            stdout=asyncio.subprocess.DEVNULL,
            stderr=asyncio.subprocess.DEVNULL
        )
        await asyncio.sleep(2)

        base_url = "http://localhost:8009"

        try:
            ok = await test_meditation_app_rigorous(page, base_url)
            if ok:
                print("\n✅ RIGOROUS MOBILE TESTS PASSED")
            else:
                print("\n❌ RIGOROUS MOBILE TESTS FAILED")
                sys.exit(1)
        except Exception as e:
            print(f"\n❌ ERROR DURING TESTING: {str(e)}")
            import traceback
            traceback.print_exc()
            sys.exit(1)
        finally:
            server_process.kill()
            await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
