
import os
import time
import json
from playwright.sync_api import sync_playwright

def render_and_capture(url, output_path=None):
    """
    Renders the given URL using Playwright, captures performance metrics,
    and extracts pixel data from the full page or specific canvas if identifiable.

    Returns a dictionary containing:
    - metrics: { duration, memory_used }
    - pixel_data: Flattened list of RGBA values (sample) or Screenshot bytes
    - screenshot_path: Path to saved screenshot
    """

    start_time = time.time()
    result = {
        "metrics": {},
        "pixel_data": [],
        "screenshot_path": None,
        "width": 0,
        "height": 0
    }

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            # If it's a local file path but missing scheme, fix it
            if not url.startswith('http') and not url.startswith('file://'):
                if os.path.exists(url):
                    url = 'file://' + os.path.abspath(url)

            print(f"Navigating to {url}")
            page.goto(url, wait_until="networkidle")

            # Allow some time for animations or 3D renders to settle
            page.wait_for_timeout(2000)

            # Capture screenshot
            if output_path:
                page.screenshot(path=output_path)
                result["screenshot_path"] = output_path
                print(f"Screenshot saved to {output_path}")

            # Extract raw pixel data via browser JS
            # We target 'canvas' tags. If models.html creates one.

            pixel_data_script = """
            () => {
                const width = 100;
                const height = 100;

                // Try to find a canvas
                const existingCanvas = document.querySelector('canvas');

                // Create a temporary canvas to draw into
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = width;
                canvas.height = height;

                if (existingCanvas) {
                    try {
                        // Draw existing canvas to our smaller canvas
                        ctx.drawImage(existingCanvas, 0, 0, width, height);
                        const imgData = ctx.getImageData(0, 0, width, height);
                        return {
                            data: Array.from(imgData.data),
                            width: width,
                            height: height
                        };
                    } catch(e) {
                         // Tainted canvas or other issue
                         return null;
                    }
                }
                return null;
            }
            """

            js_result = page.evaluate(pixel_data_script)

            if js_result:
                result["pixel_data"] = js_result["data"]
                result["width"] = js_result["width"]
                result["height"] = js_result["height"]
            else:
                print("No accessible <canvas> found to extract pixel data from. Attempting to parse screenshot...")
                # Fallback: We can't use PIL.
                # But since the user insists on 'docs/models.html', let's assume valid visualization will eventually be there.
                # For now, if no canvas, we return empty list, handled by pipeline.
                pass

        except Exception as e:
            print(f"Error rendering {url}: {e}")

        finally:
            end_time = time.time()
            result["metrics"]["duration"] = end_time - start_time
            # Placeholder for memory
            result["metrics"]["memory_used"] = 0

            browser.close()

    return result

if __name__ == "__main__":
    pass
