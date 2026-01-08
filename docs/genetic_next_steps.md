# Project Documentation: Genetic Neural Evolution Simulation

This document outlines the recent accomplishments in the development of the Genetic Neural Evolution Simulation and provides a strategic roadmap for future enhancements.

## Summary of Accomplishments: ROI Highlighting

The following is a step-by-step summary of the work completed to implement the Region of Interest (ROI) highlighting feature.

1.  **Enabled ROI Highlighting:** Implemented the core feature to highlight a specific Region of Interest (ROI) on the 3D brain model. This allows for visual focus on the brain region targeted by the currently active gene.

2.  **Data Structure Refactoring:** The `brainShell.faces` data structure was fundamentally changed from a simple array of vertex indices to a more descriptive array of objects. Each object now contains both the `indices` for the triangle vertices and a `region` string (e.g., `{ indices: [v1, v2, v3], region: 'Frontal Lobe' }`). This was a critical prerequisite for associating 3D geometry with specific anatomical regions.

3.  **Code Centralization & Refactoring:** To improve maintainability and eliminate redundancy, the rendering logic was centralized. A duplicate, simplified `drawBrainShell` function was removed, and all brain rendering calls were consolidated into the primary, more robust function located in `neuro_ui_3d_brain.js`.

4.  **Dynamic Highlighting Logic:** The centralized `drawBrainShell` function was updated to accept an `activeGene` parameter. This object carries the `targetRegion` for the current gene. The rendering logic now iterates through each face of the brain model and compares its assigned region to the `targetRegion`, applying a different color if it matches.

5.  **Visual Enhancement for Highlighting:** To meet the requirement of a "bright glowing neon green" highlight, the rendering logic was customized. For the faces belonging to the target ROI, the standard 3D lighting calculations are bypassed, and the neon green color is applied directly. This makes the highlighted section appear emissive and stand out from the rest of the model.

6.  **Application-Wide Integration:** All function calls to `drawBrainShell` across the application were updated to match the new signature. This ensures that other views (like the neuro page) that render the brain model continue to function correctly without highlighting.

7.  **Automated Visual Verification:** A new automated test using the Playwright framework was created. This script launches the simulation, starts the genetic evolution, and captures a screenshot to verify that the ROI highlighting is rendered correctly. This provides a repeatable way to ensure the feature works as expected and prevents future regressions.

## Executive Summary: Roadmap for Scientific Viability

The current simulation provides a strong visual foundation. However, to transition it from a conceptual demonstration to a tool beneficial for scientific research, the following key areas must be addressed. The overarching goal is to enhance biological realism, enable quantitative analysis, and provide robust interactive controls.

### 1. High-Fidelity Neural Pathway Visualization

The current representation of neural connections as simple external curves is a placeholder. The next critical step is to render these pathways with anatomical accuracy.

*   **3D Pathway Mapping:** Instead of abstract curves, visualize neural pathways (axons) as 3D tubes or lines that originate, traverse, and terminate within the brain model's geometry.
*   **Synaptic Representation:** Model and visualize individual synapses, showing where connections between neurons occur. This could be represented by a change in color, a glowing particle, or a geometric marker.
*   **Activity Visualization:** Animate the pathways to show the flow of neural signals. The direction, speed, and intensity (color/brightness) of the animation should correspond to the simulated neural activity (e.g., action potentials).

### 2. Integration with Real-World Neuroscience Data

To be scientifically valid, the simulation must be driven by or comparable to real biological data.

*   **Connectome Integration:** Develop a data pipeline to import connectome data from real brain imaging studies (e.g., Diffusion Tensor Imaging - DTI). This would allow the simulation to model actual neural wiring patterns.
*   **Functional Data Overlays:** Allow users to import and overlay functional data (e.g., from fMRI or EEG) onto the 3D model. This would enable comparison between the simulation's activity and real-world brain function.
*   **Genetic Database Linking:** Connect the simulated "genes" to real-world genetic databases. This would allow researchers to explore how specific, real genes might influence neural structure and function as predicted by the model.

### 3. Quantitative Analysis & Data Export

Visualizations are insightful, but researchers need hard data. The simulation must become an instrument for quantitative measurement.

*   **Interactive Data Probes:** Allow users to "probe" any neuron or synapse to get real-time readouts of its state (e.g., membrane potential, firing rate, input weights).
*   **Network Analysis Dashboard:** Implement a dashboard that calculates and displays key network metrics in real-time (e.g., network density, clustering coefficient, path length, firing synchrony).
*   **Data Export:** Build functionality to export simulation data—including network states, connection matrices, and activity logs—into standard formats (CSV, JSON) for offline analysis in tools like Python or MATLAB.

### 4. Advanced User Interaction & Control

To facilitate research, the user needs precise control over the simulation and its visualization.

*   **Granular Simulation Control:** Provide controls to pause, rewind, and step through the simulation tick-by-tick. Allow for real-time manipulation of simulation parameters (e.g., neuron firing thresholds, genetic mutation rates).
*   **Sophisticated Camera & Visualization Controls:** Implement advanced camera controls, including cross-section views (sagittal, coronal, axial) and the ability to isolate and view specific regions or sub-networks.
*   **"Gene" Editing:** Allow users to manually edit the genetic code of the neural network to conduct "what-if" experiments, directly observing how a specific genetic change impacts the network's development and function.
