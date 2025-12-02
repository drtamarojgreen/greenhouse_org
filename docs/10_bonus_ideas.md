# 10 Bonus Ideas for The Greenhouse & CanvasML

To ensure originality, I am deliberately diverging from standard computer vision ideas like "Face Detection" or "Basic Accessibility Checks".

## 1. Universal DOM-to-Canvas Bridge
**Idea:** Allow CanvasML to run on *any* web page, not just those with a `<canvas>` element.
**Implementation:** Use a headless browser (Playwright) to take a screenshot of the full DOM, base64 encode it, and feed it back into an off-screen canvas. This unlocks "Visual Regression Testing" for the entire application, including text flows and CSS layouts.
**Benefit:** Expands CanvasML from a niche tool to a universal testing powerhouse.

## 2. The "UX Heatmap" Predictor
**Idea:** Train a lightweight regression model to predict user attention hot-spots based on visual saliency (contrast, edges, color intensity).
**Implementation:** Use the existing `edge_density` and `contrast` maps to generate a "heatmap" overlay. Compare this against expected interaction zones (buttons).
**Benefit:** Identifies if critical UI elements are visually "drowned out" by background noise.

## 3. Responsive Breakpoint Fuzzer
**Idea:** Automatically run the visual pipeline across a spectrum of viewport widths (320px, 480px, 768px, 1024px, 1920px).
**Implementation:** A loop in `renderer.py` that resizes the viewport before capture.
**Benefit:** Detects layout breaks (e.g., overlapping text, squashed canvas) that only occur at specific, untested resolutions.

## 4. Dark Mode Compliance Bot
**Idea:** Simulate system-level Dark Mode preferences and verify that the canvas renders appropriately (e.g., no black text on dark background).
**Implementation:** Inject `emulateMedia({ colorScheme: 'dark' })` in Playwright and re-run contrast analysis.
**Benefit:** Ensures accessibility for light-sensitive users.

## 5. "Brand Voice" Visualizer
**Idea:** Map abstract brand concepts ("Calm", "Energetic", "Professional") to concrete visual metrics (Color Entropy, Whitespace Ratio).
**Implementation:** A classifier trained to flag when a design drifts "off-brand" (e.g., too chaotic for a "Calm" app).
**Benefit:** Automated design governance.

## 6. Animation Jitter Detector
**Idea:** Detect non-smooth animations (jank) purely through vision.
**Implementation:** Capture a sequence of 60 frames. Track the centroid of major blobs. If the velocity curve is noisy/jagged, flag as "Jittery".
**Benefit:** Ensures smooth, therapeutic visual experiences.

## 7. Dead Pixel Hunter
**Idea:** Identify regions of the canvas that *never* update, potentially indicating a rendering bug or frozen UI state.
**Implementation:** Compare frames across a user session. Calculate a "Change Map". Areas with zero change (excluding background) are flagged.
**Benefit:** Catches "zombie" UI elements.

## 8. The "Glare" Simulator
**Idea:** Test legibility under poor physical lighting conditions.
**Implementation:** Overlay a semi-transparent white/gradient mask (simulating sun glare) on the captured image and re-run OCR or Edge Detection.
**Benefit:** Real-world usability testing for mobile users outdoors.

## 9. Colorblindness Simulator
**Idea:** Bake accessibility checks directly into the pipeline by simulating different types of color blindness (Protanopia, Deuteranopia).
**Implementation:** Apply a matrix transformation to the pixel data (LMS color space) before running the standard "Distinction Scorer".
**Benefit:** Proactive accessibility validation.

## 10. The "Layout Stability" Index
**Idea:** A visual-only implementation of Cumulative Layout Shift (CLS).
**Implementation:** Compare consecutive frames during loading. If large clusters of pixels shift position significantly without user interaction, penalize the score.
**Benefit:** Prevents jarring user experiences that cause frustration.
