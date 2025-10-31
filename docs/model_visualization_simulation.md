# 2D Brain Visualization Technical Plan

This document outlines the technical approach for creating a 2D visualization of a human brain for the interactive educational model. The primary goal of this feature is to provide a clear, intuitive context for understanding how therapeutic practices can impact specific brain regions. The visualization will be rendered on an HTML5 Canvas and will be the main interactive component of the simulation.

## Core Objective: Drawing the Human Brain

The central task is to render a simplified but recognizable 2D representation of a human brain. This will be accomplished using the HTML5 Canvas API and will involve the following technical steps:

### 1. Drawing the Brain's Structure

The foundation of the visualization will be the anatomical structure of the brain.

-   **Outline Definition:** A series of `bezierCurveTo` and `quadraticCurveTo` paths will be used to define the main outline of the brain's hemispheres and the cerebellum. These paths will be based on a simplified anatomical drawing to ensure a recognizable shape.
-   **Major Sulci and Gyri:** Key sulci (grooves) and gyri (folds) will be drawn as simple lines or arcs. This will give the brain texture and define the boundaries of the major lobes (e.g., frontal, parietal, temporal, occipital).
-   **Color Coding:** The major lobes and key structures, such as the amygdala and prefrontal cortex, will be filled with distinct, semi-transparent colors. This color-coding is essential for allowing users to easily identify and distinguish between different regions.

### 2. Interactivity and Highlighting

To connect the visualization to the simulation's core concepts, the brain will react dynamically to the user's input.

-   **Region Highlighting:** The targeted brain region (e.g., the prefrontal cortex for CBT-related tasks) will be highlighted with a brighter, more opaque color or a subtle pulsing animation. The intensity of this effect will be directly proportional to the `learningMetric` in the simulation's state, providing clear visual feedback.
-   **Data Overlay:** To provide educational context, text labels or tooltips will appear when a user hovers over a region. These overlays will identify the highlighted brain area and display relevant information, such as its primary function and how it is affected by the simulated therapeutic practice.

## Supporting Visualization Modes

To provide additional context, the simulation will also include two legacy, more abstract visualization modes.

### Synaptic Close-up View

This view is designed to illustrate the process of neurotransmission at a single synapse. It features two arc shapes representing the pre-synaptic and post-synaptic terminals and an animation of neurotransmitter particles moving between them. The strength of the connection is represented by the opacity of a rectangle in the synaptic cleft.

### Network Overview

This view provides a higher-level abstraction of a neural network, showing multiple interconnected neurons. Neurons are rendered as circles with dendrites, and the connections between them are drawn as lines whose thickness is proportional to the `synapticWeight`.

## Technical Implementation Details

-   **Canvas and Rendering Context:** The simulation initializes by creating a `<canvas>` element with the ID `simulation-canvas`. A 2D rendering context is obtained from this canvas, which serves as the interface for all drawing operations. The canvas is designed to be responsive, automatically resizing to fit its container and redrawing its contents when the window size changes.
-   **Rendering Loop:** The `simulationLoop` function is the core of the animation. It is called repeatedly using `requestAnimationFrame`, creating a smooth animation. Inside this loop, the simulation's state is updated based on user input, and the appropriate drawing function is called to render the updated state to the canvas.
