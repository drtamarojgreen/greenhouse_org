
import os
import time
import json
import base64
from playwright.sync_api import sync_playwright

def render_and_capture(url, output_path=None, canvas_selector="canvas", setup_script=None):
    """
    Renders the given URL using Playwright, captures performance metrics,
    and extracts pixel data from the full page or specific canvas if identifiable.

    Args:
        url (str): The URL or file path to render.
        output_path (str, optional): Path to save the screenshot.
        canvas_selector (str): CSS selector for the canvas to extract pixels from.
        setup_script (str, optional): JavaScript code to execute before capturing.

    Returns:
        dict: Contains metrics, pixel_data, screenshot_path, etc.
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

            # Execute setup script if provided (e.g., to set state)
            if setup_script:
                print("Executing setup script...")
                try:
                    page.evaluate(setup_script)
                    # Give it time to re-render after state change
                    page.wait_for_timeout(1000)
                except Exception as e:
                    print(f"Error executing setup script: {e}")

            # Capture screenshot
            # If a selector is specific, we might want to screenshot just that element?
            # But usually we want the whole context for "Visual Polish".
            # For "Task-to-Pixel", maybe we want just the element.
            # Let's stick to full page screenshot for the file, but crop for the pixels.
            if output_path:
                page.screenshot(path=output_path)
                result["screenshot_path"] = output_path
                print(f"Screenshot saved to {output_path}")

            # Extract raw pixel data via browser JS
            pixel_data_script = f"""
            () => {{
                const width = 100;
                const height = 100;

                // Try to find the target canvas
                const targetCanvas = document.querySelector('{canvas_selector}');

                // Create a temporary canvas to draw into
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = width;
                canvas.height = height;

                if (targetCanvas) {{
                    try {{
                        // Draw target canvas to our smaller canvas
                        ctx.drawImage(targetCanvas, 0, 0, width, height);
                        const imgData = ctx.getImageData(0, 0, width, height);
                        return {{
                            data: Array.from(imgData.data),
                            width: width,
                            height: height,
                            found: true
                        }};
                    }} catch(e) {{
                         return {{ error: e.toString(), found: true }};
                    }}
                }}
                return {{ found: false }};
            }}
            """

            js_result = page.evaluate(pixel_data_script)

            # Universal Capture Fallback:
            # If no canvas found, we screenshot the page, feed it back, and extract pixels.
            if not js_result or not js_result.get("found"):
                print("Canvas not found. Attempting Universal Capture via Screenshot...")
                try:
                    png_bytes = page.screenshot()
                    b64_str = base64.b64encode(png_bytes).decode('utf-8')

                    universal_capture_script = f"""
                    (b64) => new Promise((resolve) => {{
                        const img = new Image();
                        img.onload = () => {{
                            const width = 100;
                            const height = 100;
                            const canvas = document.createElement('canvas');
                            const ctx = canvas.getContext('2d');
                            canvas.width = width;
                            canvas.height = height;

                            // Draw full image scaled down
                            ctx.drawImage(img, 0, 0, width, height);
                            const imgData = ctx.getImageData(0, 0, width, height);
                            resolve({{
                                data: Array.from(imgData.data),
                                width: width,
                                height: height,
                                found: true
                            }});
                        }};
                        img.onerror = (e) => resolve({{ error: "Image load failed", found: true }});
                        img.src = 'data:image/png;base64,' + b64;
                    }})
                    """
                    js_result = page.evaluate(universal_capture_script, b64_str)
                except Exception as e:
                    print(f"Universal Capture failed: {e}")

            if js_result and js_result.get("found"):
                if "error" in js_result:
                    print(f"Error extracting pixels: {js_result['error']}")
                else:
                    result["pixel_data"] = js_result["data"]
                    result["width"] = js_result["width"]
                    result["height"] = js_result["height"]
            else:
                print(f"No accessible canvas found for selector '{canvas_selector}' and Universal Capture failed.")
                # Fallback: We can't use PIL.
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
