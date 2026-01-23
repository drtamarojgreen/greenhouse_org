# Dopamine Emergency Repair Plan: MSI-BMA v1.0

## 1. Executive Summary
This document outlines the strategic pivot for the `/dopamine` page from a "Macro/Micro Hybrid" to a **Strictly Intracellular Model**. This transition resolves critical scientific credibility issues regarding scale mismatch and "floating organelle" artifacts.

*   **Overall Risk Level**: LOW (Visual subtraction of macro-artifacts; core signaling logic preserved).
*   **Confidence Level**: HIGH (Coordinate systems are decoupled).

## 2. Key Findings: Purging Macro-Anatomical Noise

### 2.1 Scientific Realism & Scale Mismatch (CRITICAL)
The co-rendering of the 3D Brain Mesh and macro-labels (SNc, VTA) alongside intracellular organelles creates a confusing "floating" effect that undermines expert trust.
*   **Finding**: Users perceive the Endoplasmic Reticulum and G-protein cycles as "out of scale" because they share a viewport with a human brain mesh.
*   **Root Cause**: Attempting to visualize "where" the cell is (Circuit level) while simulating "how" it signals (Molecular level).

### 2.2 Onboarding Failure (Critical)
The initial onboarding is cluttered with macro-anatomical "Quick Visual Guide" items that distract from the core educational pathway (dopaminergic signaling).

## 3. Strategic Recommendations: The Intracellular Transition

### 3.1 Removal of Macro-Anatomical Artifacts
*   **Action**: Disable the loading of `brain_mesh_realistic.js`.
*   **Action**: Remove the `renderRealisticBrain` call and all "Atlas" coordinate markers (Bregma, AP/ML/DV) from `dopamine_circuit.js`.
*   **Action**: Delete SNc, VTA, and PFC projection labels that suggest a macro-scale context.

### 3.2 Refocused Scientific Scaffolding
*   **Problem**: Causality is currently lost between macro-location and molecular action.
*   **Solution**: Re-center the view on the Synaptic Cleft and Intracellular space. Use the "100 Enhancements" tracker to explain *molecular* causality (e.g., G-protein dissociation rates) rather than regional projections.

### 3.3 Sanitized Onboarding
*   **Action**: Update `dopamine_ux.js` to remove macro-anatomical guide items ("Blue Mesh," "SNc Projections"). Focus on Receptors, ER, and Synaptic dynamics.

## 4. Implementation Plan
1.  **Refactor `dopamine.js`**: Remove the `loadScript` call for the realistic brain mesh.
2.  **Sanitize `dopamine_circuit.js`**:
    - Removed macro-labels and coordinate markers.
    - **Update (v1.1)**: Enhanced Striosome visualization with soma+dendrite neuron morphology.
    - **Update (v1.1)**: Enhanced Matrix visualization with a structured lattice texture.
3.  **Update `dopamine_ux.js`**:
    - **Update (v1.1)**: Disabled the automatic show of the welcome screen per user request.
    - Refreshed descriptions to reflect "Brown Neurons" and "Cyan Lattice".
4.  **Verification**: Run `test_neuro_ui.js` and `test_synapse_ui.js` to confirm signaling core stability.
