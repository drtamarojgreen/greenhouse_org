# Environment Canvas Evolution Plan
## Transforming Visualization into a Research Platform

This document outlines a 5-stage strategic roadmap to evolve the Mental Health Environment Canvas from a static visualization into a dynamic, customizable, and research-grade platform. The goal is to eliminate "shortcuts" and hardcoded logic, replacing them with a robust, data-driven architecture capable of integrating with real-world health and genomic APIs.

---

### Stage 1: Configuration-Driven Architecture
**Goal:** Decouple rendering logic from content definition.
**Current State:** Elements (Pills, Therapies, Trees) are hardcoded in JavaScript files with specific coordinates and drawing instructions.
**Target State:** The entire scene is generated from a single configuration file (e.g., `environment_config.json`).

#### Key Deliverables:
1.  **Schema Definition:** Define a strict JSON schema for environment entities.
    *   Properties: `id`, `type` (e.g., 'medication_container', 'therapy_node'), `position` (logical coordinates), `dataSource`, `visualStyle`.
2.  **Generic Rendering Engine:** Refactor `models_ui_environment.js` to iterate through this config and instantiate the appropriate renderer for each item.
3.  **Hot-Reloading:** Allow the config file to be edited to instantly update the canvas without code changes.

**Outcome:** A researcher can add a new medication group or therapy type simply by editing a text file, not JavaScript code.

---

### Stage 2: API Integration & Data Binding
**Goal:** Connect visual elements to real-world data sources.
**Current State:** Data (descriptions, activation levels) is static or mock data.
**Target State:** Elements bind to external APIs (FHIR, Genomic Data, User Health Records).

#### Key Deliverables:
1.  **Data Adapter Layer:** Create a service layer that normalizes data from various sources.
    *   *Genomics:* 23andMe / AncestryDNA exports.
    *   *Health Records:* FHIR (Fast Healthcare Interoperability Resources) endpoints.
2.  **Reactive Data Binding:** Visual properties (size, color, opacity, "wobble") become functions of live data.
    *   *Example:* The "Genomes" helix thickness is driven by actual polygenic risk scores.
3.  **Asynchronous Loading States:** Visual indicators for when data is fetching, successful, or failed.

**Outcome:** The canvas becomes a live dashboard reflecting a specific patient's or population's real-time health profile.

---

### Stage 3: Advanced Interaction & "Smart" Containers
**Goal:** Implement the "Single Element, Multiple Data Points" capability properly.
**Current State:** Separate pills/nodes are used because a single element cannot easily display complex, multi-faceted data.
**Target State:** "Smart Containers" that serve as interactive portals to deep data.

#### Key Deliverables:
1.  **Compound Hover/Click States:**
    *   A single "Medication" pill acts as a container.
    *   **Hover:** Shows a summary (e.g., "3 Active Prescriptions").
    *   **Click/Expand:** Opens a detailed overlay or "drawer" listing specific medications (SSRI, SNRI), dosages, and adherence data.
2.  **Hierarchical Data Visualization:** Logic to aggregate sub-items (e.g., individual therapy sessions) into a high-level visual summary (the "Therapy" Dyad) while retaining access to the granular details.
3.  **Context-Aware Tooltips:** Tooltips that can render charts, lists, or warnings based on the data type, not just text strings.

**Outcome:** Solves the "clutter" problem. A clean high-level view (One Pill, One Dyad) that allows deep diving into complex datasets without overwhelming the UI.

---

### Stage 4: Research & Simulation Controls
**Goal:** Enable "What-If" scenarios and longitudinal study.
**Current State:** The model shows a single snapshot in time.
**Target State:** A simulation tool where variables can be manipulated to observe system effects.

#### Key Deliverables:
1.  **Variable Control Panel:** A UI to manually adjust input variables (e.g., "Increase Environmental Stress by 20%", "Simulate Medication Adherence 100%").
2.  **State Management & History:** Ability to save specific configurations ("Patient A - Baseline") and compare them ("Patient A - Post-Intervention").
3.  **Export Capabilities:** Export the canvas state as a high-resolution image or JSON dataset for publication.

**Outcome:** Researchers can use the tool to model hypotheses and visualize potential treatment outcomes.

---

### Stage 5: Modular Extensibility & Ecosystem
**Goal:** Allow third-party development and specialized modules.
**Current State:** Only core team developers can add features.
**Target State:** A plugin architecture where new visualization modules can be dropped in.

#### Key Deliverables:
1.  **Plugin Interface:** A documented API for creating custom renderers (e.g., a "3D Brain Scan" module or a "Social Network Graph" module).
2.  **Module Registry:** A system to register and load these external modules at runtime.
3.  **Theming Engine:** Full control over the aesthetic layer (colors, fonts, icon sets) to match different institutional branding or accessibility needs.

**Outcome:** The platform becomes an ecosystem where the community can contribute specialized visualizations for specific disorders or research focuses.
