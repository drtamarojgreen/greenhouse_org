# TypeScript Migration Plan - Greenhouse Mental Health IT

## 1. Executive Summary
The successful integration of TypeScript on the /tech page has demonstrated that the Greenhouse environment (React/Velo/GitHub Pages) is compatible with compiled TypeScript (ES6). This document outlines the strategy to migrate the core simulation models and informational pages to TypeScript to improve type safety, maintainability, and developer experience.

## 2. Migration Scope

### 2.1. Priority 1: Core Models (High Complexity)
These systems involve complex 3D math, state management, and biological simulations.
- **Genetic Model** (`docs/js/genetic/`, `docs/js/genetic.js`)
- **Neuro Model** (`docs/js/neuro/`, `docs/js/neuro.js`)
- **Pathway Model** (`docs/js/pathway/`, `docs/js/pathway.js`)
- **Synapse Model** (`docs/js/synapse/`, `docs/js/synapse.js`)
- **Dopamine Signaling** (`docs/js/dopamine/`, `docs/js/dopamine.js`)
- **Serotonin Model** (`docs/js/serotonin/`, `docs/js/serotonin.js`)
- **Stress Dynamics** (`docs/js/stress/`, `docs/js/stress.js`)
- **Neuroinflammation** (`docs/js/inflammation/`, `docs/js/inflammation.js`)

### 2.2. Priority 2: Informational & Interaction Pages
- **News** (`docs/js/news.js`)
- **Videos** (`docs/js/videos.js`, `docs/js/videoButton.js`)
- **Books** (`docs/js/books.js`)
- **Quizzes** (`docs/js/quizzes.js`)
- **Inspiration** (`docs/js/inspiration.js`)

### 2.3. Priority 3: Shared Infrastructure
- **Models UI & UX Framework** (`docs/js/models_ui.js`, `docs/js/models_ux.js`, `docs/js/models_ui_brain.js`, etc.)
- **Data Adapters & Parsers** (`docs/js/data_adapter.js`, `docs/js/graph_parser.js`, `docs/js/reactome_parser.js`)

## 3. Technology Evaluation: TS vs JS

### 3.1. What remains JavaScript
- **Legacy Utility Wrappers**: `docs/js/GreenhouseUtils.js` (will act as a JS bridge until fully typed).
- **External Library Shims**: Files that strictly wrap 3rd party non-typed JS libraries.
- **Wix Velo Glue Code**: Small scripts that interact directly with Wix APIs where type definitions are unavailable or overly volatile.
- **Bootstrap Loader**: `docs/js/greenhouse.js` (to maintain minimal overhead for initial page load).

### 3.2. What becomes TypeScript
- **All Simulation Logic**: `genetic_algo.ts`, `neuro_ga.ts`, etc.
- **3D Geometry & Rendering Logic**: `brain_mesh_realistic.ts`, `models_3d_math.ts`.
- **Application State & Config**: `neuro_config.ts`, `stress_app.ts`.
- **UI Components**: Class-based UI managers like `GeneticUI3D`.

## 4. Migration Roadmap (Phased Approach)

### Phase 1: Foundation (Current - Week 2)
- [x] Establish TS Compilation pipeline.
- [ ] Define global type definitions for `window.GreenhouseUtils` and `Wix` globals in `docs/js/types/globals.d.ts`.
- [ ] Convert `models_util.js` and `models_3d_math.js` to TS as they are shared dependencies.

### Phase 2: Pilot Migrations (Week 3-5)
- [ ] Migrate **Neuro Model** (High value due to high complexity).
- [ ] Migrate **Tech Page** completely to TS (Standardize the success test).

### Phase 3: Mass Migration (Week 6-10)
- [ ] Migrate remaining Core Models (Genetic, Stress, Inflammation).
- [ ] Migrate Content Pages (News, Videos, Books).

### Phase 4: Full Infrastructure (Week 11+)
- [ ] Convert `GreenhouseDependencyManager.js` to TS.
- [ ] Full removal of redundant `.js` source files (retaining only compiled artifacts).

## 5. Technical Constraints & Rules
- **ES6 Target**: All TS must compile to ES6 for compatibility.
- **No Implicit Any**: Enforcement of strict typing for simulation math.
- **JSDoc Preservation**: Maintain JSDoc in TS files for internal documentation consistency.
- **Sip Principle**: Migrations must happen in "sips" (one module at a time) with immediate functional verification.
