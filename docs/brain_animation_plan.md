# Brain Animation and Visualization Plan

## 1. Overview

This document outlines a phased approach to extend the existing Blender animation suite. The primary goal is to shift from general cinematic animations to a more focused, scientific visualization of specific brain regions associated with mental health. This plan details the methodology for programmatically creating, highlighting, and animating these regions, as well as introducing a stylized simulation of neural activity.

## 2. Phase 1: Region Definition and Modeling

This phase focuses on creating the 3D models for the specified brain regions. Since the source `brain.fbx` is a single, undifferentiated mesh, we will programmatically construct new 3D objects to represent each region.

### 2.1. Methodology

-   **Programmatic Construction:** Instead of manual or programmatic sculpting (which is non-deterministic), we will use Blender's Python API (`bpy`) to create and position primitive shapes (e.g., spheres, cubes).
-   **Boolean Operations:** Complex shapes will be formed by combining these primitives using boolean "union" operations.
-   **Configuration-Driven:** The position, size, and rotation of each primitive will be defined in a configuration file (e.g., `regions.json`). This will allow for easy adjustments without altering the core scripts.

### 2.2. Regions to be Modeled

Based on the user's request, the following regions will be modeled:

-   Amygdala
-   Hippocampus
-   Insula
-   Anterior Cingulate Cortex
-   Prefrontal Cortex

## 3. Phase 2: Highlighting and Visualization

Once the regions are modeled, we will develop visual effects to highlight them.

### 3.1. Proposed Effects

-   **Glow/Emission:** The targeted region will be given a glowing material, similar to the existing `zoom_glow` effect.
-   **Wireframe Overlay:** A wireframe representation of the region will be overlaid on the main brain model.
-   **Isolation:** The main brain model will be made transparent, leaving only the highlighted region visible.

## 4. Phase 3: Animation and Camera Control

New camera animations will be created to focus on the newly modeled regions.

### 4.1. Proposed Animations

-   **Region Focus:** The camera will start with a view of the full brain, then slowly zoom in to focus on a specific region.
-   **Multi-Region Tour:** The camera will move sequentially from one region to another, highlighting each in turn.
-   **Contextual Orbit:** The camera will orbit a highlighted region, keeping the rest of the brain model faintly visible for context.

## 5. Phase 4: Physics-Based Effects (Neuron Simulation)

This phase addresses the request for a simulation of neurons and synapses. Given the complexity of a scientifically accurate simulation, we will aim for a visually representative effect.

### 5.1. Methodology

-   **Particle Systems:** We will use Blender's built-in particle systems to generate flowing particles.
-   **Emitter and Target:** An "emitter" object will be placed in one brain region, and a "target" object in another. Particles will flow from the emitter to the target.
-   **Stylized Appearance:** The particles will be rendered as small, glowing points of light to represent neural signals.

## 6. Phase 5: Integration and Automation

All new features will be integrated into the existing automation framework.

### 6.1. Integration Steps

-   **New Functions in `visual_effects.py`:** Functions for creating the region models and applying the highlighting effects will be added.
-   **New Functions in `camera_animations.py`:** The new region-focused camera animations will be added.
-   **New Render Jobs in `render_suite.py`:** New render jobs will be created to combine the new models, effects, and animations.
-   **New Bash Scripts:** New `render_*.sh` scripts will be created as user-facing entry points for the new render jobs.
-   **Documentation Updates:** The `README.md` and `run_blender_job.sh` will be updated to include the new animations.

## 7. Assumptions and Risks

-   **Anatomical Accuracy:** The programmatic creation of brain regions will be based on publicly available anatomical diagrams. **This will be an artistic and approximate representation, not a medically accurate, patient-specific model.** The goal is illustrative, not diagnostic.
-   **FBX Model as a Reference:** The `brain.fbx` model will be used as a visual reference for the placement of the new region objects. The scale and proportions of the new objects will be relative to this base model.
-   **Performance:** The addition of new objects and particle systems may increase render times. The complexity of the effects will be balanced against performance considerations.

## 8. Proposed Implementation Steps

1.  **Create `regions.json`:** Define the coordinates and dimensions for the primitives that will form each brain region.
2.  **Implement Region Modeling:** Write the Python code in `visual_effects.py` to read the `regions.json` file and generate the 3D models.
3.  **Implement Highlighting Effects:** Add new functions to `visual_effects.py` for the glow, wireframe, and isolation effects.
4.  **Implement New Camera Animations:** Add the region-focused camera animations to `camera_animations.py`.
5.  **Implement Neuron Simulation:** Create a new module, `physics_effects.py`, to manage the particle systems for the neuron simulation.
6.  **Create New Render Jobs:** Add the new render jobs to `render_suite.py`, integrating the new models, effects, and animations.
7.  **Create New Bash Scripts:** Add the new `render_*.sh` scripts.
8.  **Update Documentation:** Update all relevant documentation.
