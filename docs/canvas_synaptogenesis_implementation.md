# Synaptogenesis & Molecular Dynamics Implementation Plan

This document details the technical implementation strategy for adding high-fidelity biological elements to the Synapse and Brain canvases on the Models page. It also defines the verification strategy using the CanvasML computer vision pipeline.

## 1. Overview of Biological Elements

We will enhance the existing `canvas-synaptic` and `canvas-network` visualizations to include the following molecular components:

| Component | Target Canvas | Implementation Layer | Visual Representation |
| :--- | :--- | :--- | :--- |
| **Voltage-Gated Channels** | Synapse | Pre-synaptic Membrane | Cylindrical pores embedded in the membrane that open/close. |
| **Receptors** | Synapse | Post-synaptic Membrane | Distinct shapes (Y-shape, Cup-shape) receiving ligands. |
| **Ligands** | Synapse | Synaptic Cleft | Diverse particle shapes (triangles, squares) representing neurotransmitters. |
| **Ion Channels** | Synapse | Post-synaptic Membrane | Pores that open upon ligand binding (flux visualization). |
| **Protein Kinases** | Synapse | Post-synaptic Cytoplasm | Floating globular proteins (e.g., CaMKII) activated by ion flux. |
| **Cytoplasm** | Synapse | Background | Textured, viscous fluid simulation (gradient + noise). |
| **DNA** | Brain | Neuron Nucleus | Double helix strand inside the soma (node center). |
| **RNA** | Brain | Soma / Cytoplasm | Single strands migrating from nucleus to dendrites. |
| **Transcription Factors** | Brain | Soma | Particles migrating *towards* the nucleus to trigger gene expression. |

---

## 2. Implementation Specifications

### 2.1 Synapse Canvas (`docs/js/models_ui_synapse.js`)

#### 2.1.1 Voltage-Gated Channels (VGCs)
*   **Location**: Embedded in the pre-synaptic terminal membrane (top section).
*   **State**: `closed` (solid block), `open` (pore visible).
*   **Drawing Logic**:
    ```javascript
    // Pseudo-code for drawSynapticView
    this.state.synaptic.voltageGatedChannels.forEach(vgc => {
        ctx.save();
        ctx.translate(vgc.x, vgc.y);
        ctx.fillStyle = vgc.isOpen ? '#FFD700' : '#808080'; // Gold for open, Grey for closed
        // Draw cylinder side view
        ctx.fillRect(-5, -10, 10, 20);
        if (vgc.isOpen) {
            // Draw pore
            ctx.fillStyle = '#000000';
            ctx.fillRect(-2, -10, 4, 20);
        }
        ctx.restore();
    });
    ```

#### 2.1.2 Receptors & Ion Channels
*   **Enhancement**: Existing receptors are simple rectangles. We will upgrade them to composite shapes.
*   **Ion Channel Logic**: When `receptor.isBound === true`, the channel opens.
*   **Visual**: Draw a "glow" or "stream" of ions (small dots) entering the channel when open.

#### 2.1.3 Protein Kinases (Signal Transduction)
*   **Location**: Floating in the post-synaptic area (bottom section).
*   **Behavior**: Brownian motion. When ions (calcium) enter, kinases change color/state (Phosphorylated).
*   **Data Structure**:
    ```javascript
    // In models_data.js -> synapseData
    kinases: [
        { id: 'pk-1', x: 100, y: 400, state: 'INACTIVE', type: 'CaMKII' }
    ]
    ```

#### 2.1.4 Cytoplasm
*   **Implementation**: Instead of a solid background color, use a generic `createCytoplasmPattern(ctx)` function.
*   **Technique**: High-density low-contrast noise or Voronoi regions to simulate cellular fluid.

### 2.2 Brain Canvas (`docs/js/models_ui_brain.js`)

#### 2.2.1 DNA & Gene Expression
*   **Location**: Center of the Neuron Node (Soma).
*   **Visibility**: Only visible when `node.scale > threshold` or when "Gene Expression" mode is active.
*   **Drawing**:
    *   Draw a small circle (Nucleus) inside the Node.
    *   Inside the Nucleus, draw a stylized double helix (sine waves).
    *   **State**: If `expressionLevel > 0`, the helix glows/pulsates.

#### 2.2.2 RNA & Transcription Factors
*   **Traffic System**:
    *   **Transcription Factors (TFs)**: Particles moving *from* dendrites/membrane *to* the Nucleus.
    *   **RNA**: Particles moving *from* Nucleus *to* cytoplasm.
*   **Drawing**:
    ```javascript
    // In _renderElement loop for Neurons
    if (this.state.showGenetics) {
        this._drawNucleus(ctx, node.x, node.y, node.radius);
        this._drawTranscriptionFactors(ctx, node);
        this._drawRNA(ctx, node);
    }
    ```

---

## 3. Data Integration (`docs/js/models_data.js`)

We must expand the state objects to support these new entities.

### 3.1 Synaptic State Expansion
```javascript
this.state.synapseData = {
    // ... existing elements
    voltageGatedChannels: [
        { id: 'vgc-1', x: 'w/2 - 20', y: 'psy', type: 'Ca_v', state: 'closed' },
        { id: 'vgc-2', x: 'w/2 + 20', y: 'psy', type: 'Ca_v', state: 'closed' }
    ],
    kinases: [], // Array of kinase objects
    cytoplasm: { viscosity: 0.5, color: '#f0f0f0' }
};
```

### 3.2 Brain State Expansion
```javascript
// Inside each node object in simulation.nodes
node.genetics = {
    expressionLevel: 0.0, // 0 to 1
    dnaState: 'idle', // 'transcribing', 'idle'
    rnaCount: 0,
    transcriptionFactors: []
};
```

---

## 4. CanvasML Verification Strategy

We will use the **CanvasML** toolset to verify that these elements render correctly, are visually distinct, and behave as expected under simulation.

### 4.1 New Generator Variations (`tools/canvas_ml/generator.py`)

We will add specific configuration flags to generate scenes rich in these new elements.

1.  **`variation_genetics.json`**:
    *   **Config**: `{ "showGenetics": true, "geneticExpressionLevel": 1.0 }`
    *   **Goal**: Force all neurons to display DNA/RNA.
2.  **`variation_synapse_storm.json`**:
    *   **Config**: `{ "synapse": { "kinases": 50, "voltageGatedChannels": 10 } }`
    *   **Goal**: High density of molecular elements to check for overlap/clutter.

### 4.2 New Task Registry Entries (`tools/canvas_ml/task_registry.py`)

We will define tasks that drive the simulation into states where these elements are active.

#### Task: `verify_gene_expression`
*   **Target**: `#canvas-network`
*   **Setup Script**:
    ```javascript
    window.GreenhouseModelsUX.state.environment.genetic_factors = 1.0;
    // Trigger gene expression event
    window.GreenhouseModelsUX.triggerEvent('gene_activation');
    ```
*   **Success Criteria**:
    *   **Color Detection**: Detect specific pixel colors associated with DNA (e.g., specific Blue/Purple hex codes).
    *   **Centroid Convergence**: Detect high density of particles (TFs) near node centers.

#### Task: `verify_kinase_cascade`
*   **Target**: `#canvas-synaptic`
*   **Setup Script**:
    ```javascript
    window.GreenhouseModelsUX.state.synaptic.ionsCrossed = 1000; // Trigger CaMKII
    ```
*   **Success Criteria**:
    *   **Color Shift**: Detect color change in the post-synaptic region (Cytoplasm) indicating kinase activation.

### 4.3 Vision Pipeline Enhancements (`tools/canvas_ml/vision.py`)

We will add specialized feature detectors.

1.  **`detect_helix_patterns(edges)`**:
    *   Use a Hough transform or template matching to find small sinusoidal patterns (DNA).
2.  **`color_histogram_analysis(pixels)`**:
    *   Verify the presence of "Gold" (Active VGCs) or "Phospho-Red" (Active Kinases).
    *   **Metric**: `active_fraction = count(active_pixels) / total_pixels`.

### 4.4 Automated Verification Plan

1.  **Generate**: Run `python3 tools/canvas_ml/generator.py` to create the new variations.
2.  **Harvest**: Run `python3 tools/canvas_ml/harvester.py` to capture screenshots of the new elements.
3.  **Analyze**: Run `python3 tools/canvas_ml/vision.py` to ensure:
    *   The **Complexity Score** (Edge Energy) increases significantly when `showGenetics` is enabled (verifying elements are drawn).
    *   The **Calm Score** remains within acceptable limits (ensuring we didn't create a "messy" UI).

## 5. Summary of Work

1.  **Update Data Models**: Add properties for DNA, RNA, Kinases, VGCs.
2.  **Update Renderers**: Implement `_drawDNA`, `_drawVGC`, `_drawKinase` in UI files.
3.  **Update CanvasML**: Add generator variations and vision tasks to verify presence and aesthetics.
