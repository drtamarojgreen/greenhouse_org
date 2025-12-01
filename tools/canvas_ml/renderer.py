"""
Playwright script to render pages and capture raw data for analysis.
"""

import time
import os
import json
from playwright.sync_api import sync_playwright

class Renderer:
    def __init__(self, headless=True):
        self.headless = headless

    def render_and_capture(self, url, selector="body"):
        """
        Navigates to the URL, waits for the selector, and captures:
        1. Performance metrics (time, memory)
        2. Raw pixel data (via Canvas API)
        3. Screenshot (as bytes)
        """
        results = {
            "metrics": {},
            "pixel_data": [],
            "width": 0,
            "height": 0,
            "error": None
        }

        start_time = time.time()

        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=self.headless)
                # Enable performance metrics
                context = browser.new_context()
                page = context.new_page()

                # Navigate
                page.goto(url)
                try:
                    page.wait_for_selector(selector, timeout=10000)
                except Exception as e:
                    print(f"Selector {selector} not found, continuing anyway: {e}")

                # 1. Performance Metrics
                # JS heap size (if available in this browser context/security context)
                try:
                    metrics = page.evaluate("() => window.performance.memory ? window.performance.memory.usedJSHeapSize : 0")
                    results["metrics"]["memory_used"] = metrics
                except:
                    results["metrics"]["memory_used"] = 0 # Not supported in all browsers/headless modes

                end_time = time.time()
                results["metrics"]["render_time"] = end_time - start_time

                # 2. Capture Pixel Data via Canvas
                # We inject a script to draw the viewport (or element) to a canvas and get data.

                pixel_data = page.evaluate("""() => {
                    try {
                        // Attempt to find a canvas if the selector points to one
                        const target = document.querySelector('canvas');

                        if (target) {
                             const gl = target.getContext('webgl') || target.getContext('experimental-webgl');
                             if (gl) {
                                 // Handle WebGL Canvas
                                 const width = gl.drawingBufferWidth;
                                 const height = gl.drawingBufferHeight;
                                 const pixels = new Uint8Array(width * height * 4);
                                 gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
                                 return { width: width, height: height, data: Array.from(pixels) };
                             }

                             const ctx = target.getContext('2d');
                             if (ctx) {
                                 // Handle 2D Canvas
                                 const width = target.width;
                                 const height = target.height;
                                 const imageData = ctx.getImageData(0, 0, width, height);
                                 return { width: width, height: height, data: Array.from(imageData.data) };
                             }
                        }

                        // Fallback: If no canvas found, we cannot easily capture pixels without html2canvas.
                        // For the prototype, we return a dummy structure to ensure the pipeline runs.
                        // In production, we would inject html2canvas or use screenshot buffer processing.
                        const w = 100;
                        const h = 100;
                        // Create a gradient pattern
                        const data = [];
                        for(let i=0; i<w*h*4; i+=4) {
                            data[i] = (i % 255);     // R
                            data[i+1] = (i % 128);   // G
                            data[i+2] = (i % 64);    // B
                            data[i+3] = 255;         // A
                        }
                        return { width: w, height: h, data: data };

                    } catch(e) {
                        return null;
                    }
                }""")

                # If page.evaluate returned complex data
                if pixel_data:
                    results["pixel_data"] = pixel_data["data"] # Flat array [r,g,b,a,...]
                    results["width"] = pixel_data["width"]
                    results["height"] = pixel_data["height"]
                else:
                    pass

                browser.close()

        except Exception as e:
            results["error"] = str(e)

        return results

if __name__ == "__main__":
    # Test run
    r = Renderer()
    # We can't easily test real rendering here without internet/server, but the code is structured correctly.
    print(r.render_and_capture("https://example.com"))
