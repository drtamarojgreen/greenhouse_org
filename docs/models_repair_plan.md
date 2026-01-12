# Models Repair Plan

## Overview
This document outlines the step‑by‑step process to fix and improve the five model pages in the Greenhouse application:
- **Pathway**
- **Neuro**
- **Genetic**
- **Synapse**
- **Models (Table of Contents)**

The goal is to ensure each page loads correctly, displays the intended UI, and follows the design guidelines (rich aesthetics, intuitive navigation, and proper separation of concerns).

---

## 1. Pathway Page
### Current Issues
- The page loads the selector but displays a blank screen; only the pathway selector UI appears.
- No error handling for missing dependencies.

### Fix Steps
1. **Verify script loading order** – Ensure `models_util.js`, `models_3d_math.js`, `brain_mesh_realistic.js`, and `neuro_ui_3d_geometry.js` are loaded before `pathway_viewer.js`.  The pathway page should not use neuro_ui_3d_geometry.js.  The pathway page should uses its own geometry module and not break other page displays.
2. **Add console warnings** for missing `baseUrl` or `targetSelector`.
3. **Unit test** – Write a complete suite of unit tests that mocks the script loader and confirms `GreenhousePathwayViewer.init` is called with the correct arguments and configure the page docs/pathway.html for complete test coverage..

---

## 2. Neuro Page
### Current Issues
- Relies on a global `window._greenhouseNeuroAttributes` that may be missing.
- No explicit separation of the genetic page’s dependencies.
- Uses a mixture of polling and dependency‑manager logic, which can cause race conditions.

### Fix Steps
1. **Create a dedicated Neuro config object** (`neuroConfig`) that contains `baseUrl` and `targetSelector`.
2. **Remove the fallback polling** – Prefer the `GreenhouseDependencyManager` path; if unavailable, abort with a clear error message.
3. **Decouple from Genetic** – Ensure `neuro.js` does **not** load any genetic scripts (e.g., `genetic_ui_3d_*`).
4. **Add a health‑check** after loading all scripts to verify `window.GreenhouseNeuroApp` and related modules exist.
5. **Add unit tests** Add a complete suite of unit tests testable from docs/neuro.html.

---

## 3. Genetic Page
### Current Issues
- Currently loads `neuro_ui_3d_geometry.js` – a dependency that belongs to the Neuro page.
- The page works but shares code with Neuro, creating a hidden coupling.

### Fix Steps
1. **Create a separate Genetic config** (`geneticConfig`) similar to Neuro.
2. **Remove the Neuro geometry import** (`neuro_ui_3d_geometry.js`). Replace it with a Genetic‑specific geometry module if needed.
3. **Add a dedicated error handling block** for missing `genetic` selector.
4. **Introduce a visual loading overlay** that disappears once all Genetic modules are loaded.
5. **Write a suite of unit tests** that confirms the Genetic UI renders in docs/genetic.html.

---

## 4. Synapse Page
### Current Issues
- UI is cluttered; the rendering logic mixes cytoplasm, ion channels, kinases, RNA, vesicles, and receptors without clear hierarchy.
- Labels are hard to read and sometimes overlap.
- No dark‑mode styling consistency.

### Fix Steps
1. **Refactor rendering pipeline** into distinct phases:
   - Phase 1: Background & Cytoplasm
   - Phase 2: Membrane Channels (with clear legends)
   - Phase 3: Kinases & RNA (grouped on the post‑synaptic side)
   - Phase 4: Vesicles & Receptors (with hover tooltips)
2. **Add a legend component** that toggles visibility of each element type.
3. **Improve label placement** using dynamic calculations based on canvas size.
4. **Standardise colour palette** – use the app’s design tokens (`--color-primary`, `--color-accent`).
5. **Add micro‑animations** for vesicle fusion and neurotransmitter release (use `requestAnimationFrame`).
6. **Create a suite of unit tests** that checks the `drawSynapticView` function runs without errors on docs/synapse.html.

---

## 5. Models Page (Table of Contents)
### Current Issues
- The Table of Contents (TOC) displays plain text instead of interactive buttons.
- No visual feedback on hover or click.

### Fix Steps
1. **Replace the static list** with a dynamic button list generated from a JSON manifest (`models_toc.json`).
2. **Add click handlers** that navigate to the corresponding model page (`pathway`, `neuro`, `genetic`, `synapse`).
3. **Style the buttons** using the app’s design system – gradient background, subtle hover scaling, and focus ring for accessibility.
4. **Add ARIA attributes** (`role="button"`, `aria-label`) for screen‑reader support.
5. **Write a simple integration test** that simulates a click on each button and verifies the correct page loads.

---

## Verification Plan
1. **Manual QA** – Open each model page in a fresh browser session and verify:
   - No console errors.
   - All expected UI elements appear.
   - Navigation from the Models TOC works.
2. **Automated Tests** – Run the new unit tests for each page (pathway, neuro, genetic, synapse, models TOC).
3. **Design Review** – Ensure the visual style matches the project’s premium aesthetic guidelines (dark mode, gradients, micro‑animations).
4. **Performance Check** – Verify that page load time remains under 2 seconds on a typical development machine.

---

*Prepared by Antigravity – your agentic coding assistant.*
