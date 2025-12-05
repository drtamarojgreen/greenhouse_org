# Canvas Implementation Plan: Enhanced Synapse Model

This document outlines the implementation strategy for integrating advanced biological components into the existing Greenhouse Synapse Model. The focus is on seamless integration with the current rendering engine and data architecture.

## 1. Data Integration (Synapse Model)

The core of the enhancement involves extending the `models_synapses.json` data structure. The existing system uses a dynamic coordinate system (`w`, `h`, `psy`, `tw`) which must be preserved to ensure responsiveness.

### 1.1 JSON Schema Extensions

The `elements` array in `models_synapses.json` will be augmented with new static biological structures.

**New Components to Add:**
*   **Cytoplasm Marker:** A subtle background layer to differentiate the intracellular space.
*   **Voltage-Gated Channels:** Represented as geometric paths on the presynaptic terminal.
*   **Ion Channels:** Geometric paths on the postsynaptic terminal.
*   **Nucleus (with DNA/RNA):** A complex nested structure deep in the postsynaptic area.
*   **Protein Kinase:** Elliptical representations in the cytoplasm.
*   **Text Labels:** A new `text` type element to identify these structures.

**Coordinate Integration:**
All new paths and coordinates must use the dynamic variables:
*   `w`: Canvas width
*   `h`: Canvas height
*   `psy`: Presynaptic Y-coordinate baseline
*   `tw`: Terminal width

**Example Data Structure:**
```json
{
  "id": "nucleus",
  "type": "ellipse",
  "cx": "w/2",
  "cy": "psy+180", // Relative position deeper in postsynaptic side
  "children": [
    {
      "id": "dna",
      "type": "path",
      "path": "M(w/2-40, psy+180)..." // Relative path inside nucleus
    }
  ]
}
```

### 1.2 Data Loading Strategy

The application currently supports two data loading modes:
1.  **Velo Injection (Live Site):** The Wix backend injects data via a hidden DOM element (`data-custom-holder`).
2.  **Fallback (Standalone/Dev):** `models_data.js` contains a hardcoded fallback object.

**Implementation Requirement:**
To ensure consistency across environments, the new JSON structure must be:
1.  **Updated in Velo:** The backend code (not in this repo) must be updated to serve the new JSON.
2.  **Updated in Fallback:** The `models_data.js` file *must* be updated with the identical JSON structure in its fallback `else` block. This allows developers to verify changes locally without access to the Wix backend.

## 2. Rendering Integration (models_ui_synapse.js)

The rendering engine in `models_ui_synapse.js` processes the `elements` list. It currently supports `path` and `ellipse` types.

### 2.1 Text Rendering Support

To support labels, the `_renderElement` function must be extended to handle a new `text` type.

**Implementation Logic:**
```javascript
case 'text':
    const tx = eval(GreenhouseModelsUtil.parseDynamicPath(element.x, { w, h, tw, psy }));
    const ty = eval(GreenhouseModelsUtil.parseDynamicPath(element.y, { w, h, tw, psy }));
    if (ctx.fillStyle) ctx.fillText(element.text, tx, ty);
    // Optional: strokeText support
    break;
```

### 2.2 Layering (Z-Index)

The rendering order is determined by the array order in the JSON file.
*   **Background Elements:** Cytoplasm, Nucleus, and Organelles should be placed *early* in the `elements` array.
*   **Membrane Structures:** Channels and Terminals should follow.
*   **Dynamic Particles:** Vesicles and Neurotransmitters are rendered dynamically on top by the `drawSynapticView` loop.
*   **Labels:** Text labels should be placed *last* in the `elements` array (or rendered after the main loop) to ensure they are legible and "float" above the biological structures.

## 3. Deployment Strategy

### 3.1 Frontend Code Deployment
1.  **Modify Source:** Update `docs/js/models_ui_synapse.js` and `docs/js/models_data.js` in the repository.
2.  **Verify:** Use the CanvasML pipeline (harvester) to verify the fallback mode renders correctly locally.
3.  **Deploy:** Upload the updated JS files to the Wix/GitHub Pages hosting location referenced by the live site.

### 3.2 Velo Backend Update
1.  **Access Wix Editor:** Open the site in the Wix Editor.
2.  **Locate Backend:** Find the backend file serving the model data (likely `models_synapses.jsw` or similar).
3.  **Update JSON:** Replace the existing synapse JSON object with the new enhanced structure defined in `docs/endpoints/models_synapses.json`.
4.  **Publish:** Publish the site to push the data changes live.

## 4. Verification Checklist

*   [ ] **Visual Balance:** Ensure the Nucleus (large element) does not crowd the active synaptic cleft area.
*   [ ] **Legibility:** Confirm text labels contrast well against both light and dark mode backgrounds.
*   [ ] **Performance:** Verify that the additional static paths do not degrade frame rate during particle animation.
*   [ ] **Fallback Parity:** Confirm `models_data.js` fallback matches the live Velo data exactly.
