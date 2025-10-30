# Educational Simulation - Detailed 2D Visualization Plan

## 1. Overview

This document provides a detailed visual and technical plan for implementing Enhancement #1 from the capabilities plan: **Detailed 2D Anatomical Representations**. The goal is to enhance the educational value of the simulation by grounding the abstract concepts of neural networks and synaptic activity in a stylized anatomical context.

All rendering will be done using the HTML5 Canvas 2D API, with a strict adherence to the "no new libraries" constraint. The design philosophy is "conceptual, not clinical"—visuals should be illustrative and educational, not photorealistic or medically precise.

## 2. Part 1: Network Overview - Brain Cross-Section Backdrop

This view will place the abstract neural network within the context of a simplified 2D brain map.

### 2.1. Visual Design

-   **Style:** A stylized, minimalist cross-section of the human brain, viewed from the side (sagittal view). It will be rendered in soft, muted, low-contrast background colors to ensure the vibrant, active neural network drawn on top remains the primary focus.
-   **Key Regions:** Two primary regions will be visually delineated and labeled:
    -   **Prefrontal Cortex (PFC):** A region at the front, associated with executive function and cognitive control (relevant to CBT).
    -   **Amygdala:** A deeper, almond-shaped structure associated with emotional processing (relevant to DBT).
-   **Color Palette:**
    -   Brain Outline: A soft grey (`#cccccc`).
    -   PFC Region Fill: A very light, muted blue (`#eaf2f8`).
    -   Amygdala Region Fill: A very light, muted orange (`#fef5e7`).
    -   Labels: A non-intrusive dark grey (`#555555`) using the site's body font.
-   **Layering Strategy:** The canvas will be rendered in a specific order on each frame:
    1.  **Clear Canvas:** The entire canvas is cleared.
    2.  **Draw Brain Backdrop:** The static 2D brain cross-section and its colored regions are drawn.
    3.  **Draw Neural Network:** The dynamic, interactive neural network (nodes and connections) is drawn on top. The active, high-contrast colors of the network will stand out against the muted backdrop.

### 2.2. Technical Implementation (Canvas 2D API)

-   **Drawing the Shapes:** The outlines of the brain and its internal regions will be created using `ctx.beginPath()`, `ctx.moveTo()`, `ctx.lineTo()`, and `ctx.bezierCurveTo()`. These shapes will be pre-defined as a series of coordinates in a helper module.
-   **Filling and Stroking:** `ctx.fillStyle` will be used to apply the muted background colors to the PFC and Amygdala regions, followed by `ctx.fill()`. A single `ctx.strokeStyle` and `ctx.stroke()` call will draw the main outline.
-   **Rendering Labels:** `ctx.font` and `ctx.fillText()` will be used to render the "Prefrontal Cortex" and "Amygdala" labels in their respective regions.
-   **Performance:** Since the backdrop is static, it can be pre-rendered to an offscreen canvas (`new OffscreenCanvas()` or a hidden `<canvas>` element) once. On each animation frame, the main canvas can simply copy this pre-rendered image (`ctx.drawImage(offscreenCanvas, 0, 0)`) instead of redrawing the complex shapes every time, which is highly efficient.

## 3. Part 2: Synaptic Close-up - Detailed Cleft Diagram

This view will provide a more detailed and dynamic representation of synaptic transmission.

### 3.1. Visual Design

-   **Style:** A clean, cross-section diagram of a synaptic cleft. The design will be clear and illustrative, like a high-quality textbook diagram.
-   **Key Components:**
    -   **Pre-synaptic Terminal (Top):** A rounded rectangular shape. It will contain small circles representing **Vesicles**.
    -   **Synaptic Cleft:** The space between the top and bottom terminals.
    -   **Post-synaptic Terminal (Bottom):** Another rounded rectangular shape. It will have small, embedded shapes representing **Receptors**.
    -   **Neurotransmitters:** Small dots or star-like particles that are animated.
    -   **Reuptake Transporters:** Small "gate" like shapes on the pre-synaptic terminal.
-   **Animation Flow (Step-by-Step):**
    1.  **Action Potential Arrives:** A brief pulse of light travels down the pre-synaptic terminal.
    2.  **Vesicle Fusion:** A vesicle moves towards the edge of the terminal.
    3.  **Neurotransmitter Release:** The vesicle disappears, and a small burst of neurotransmitter particles are created in the synaptic cleft. The number of particles will be proportional to the `practiceIntensity` state.
    4.  **Binding:** The particles travel across the cleft and "stick" to the receptors, causing the receptor to light up briefly.
    5.  **Reuptake/Diffusion:** After a short delay, particles are either animated back towards a reuptake transporter or simply fade away.

### 3.2. Technical Implementation (Canvas 2D API)

-   **Static Elements:** The pre- and post-synaptic terminals and the receptors will be drawn as static shapes on each frame, similar to the brain backdrop.
-   **Dynamic Elements (Particles):** The neurotransmitters will be managed as an array of JavaScript objects, where each object has properties like `x`, `y`, `vx` (velocity x), `vy` (velocity y), and `lifetime`.
-   **Animation Loop (`requestAnimationFrame`):**
    -   On each frame, the main function will iterate through the particle array.
    -   It will update each particle's position (`p.x += p.vx`, `p.y += p.vy`) and decrease its `lifetime`.
    -   It will draw each particle as a small circle (`ctx.arc()`) or rectangle (`ctx.fillRect()`).
    -   Particles whose `lifetime` has expired will be removed from the array.
-   **Event Triggering:** The animation sequence will be triggered when the simulation state indicates a "firing" event. This will initialize a new set of particles at the pre-synaptic edge and give them an initial velocity towards the post-synaptic terminal.
-   **State Integration:** The number of particles created will be directly determined by `state.practiceIntensity`. The "strength" of the connection (e.g., the number of active receptors) can be tied to `state.synapticWeight`.
