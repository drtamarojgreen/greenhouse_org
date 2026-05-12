# Movie Character Face Architecture Assessment

## 1. Executive Summary
This report analyzes the recurring "adding/removing" cycle of facial features (eyes, pupils, and facial props) in the Movie 9 production pipeline. The instability is primarily driven by an architectural conflict between **Integrated Mesh Modeling** and **Modular Prop Rigging**.

## 2. Historical Analysis (Last 3 Months)
### 2.1 Key Event: Commit 5c9d797
*   **Title**: "Fix Redundant Eye Creation in Movie 9 Plant Characters"
*   **Action**: Removed eye and pupil geometry from `scripts/blender/movie/9/modeling/plant.py`.
*   **Context**: This commit was a reaction to "double-vision" bugs where characters appeared with two sets of eyes—one baked into the body mesh and one attached as independent props.

### 2.2 The "Push-Pull" Cycle
The git history reveals a pattern where:
1.  **Modeling Phase**: Eyes are added to `PlantModeler` to ensure characters look complete in "mesh-only" previews.
2.  **Rigging Phase**: High-fidelity facial props (eyelids, iris depth) are added via `PlantRigger` and `facial_utilities_v6` to support advanced animation.
3.  **Conflict**: The resulting character has redundant geometry.
4.  **Resolution**: One set is deleted (usually from the Modeler), but this often breaks material slot expectations or simpler visualization paths, leading someone to "re-add" them later.

## 3. Technical Root Cause
### 3.1 Material Slot Mismatch
The `UniversalShader` and SDD audits (`Facial_Features.facts`) expect specific material slots:
*   Slot 0: Primary (Bark)
*   Slot 1: Secondary (Leaf)
*   Slot 2: Iris
*   Slot 3: Pupil

When geometry is removed from `PlantModeler`, the BMesh often loses these material indices. If the `UniversalShader` then attempts to apply materials to a mesh with only 2 slots, the facial materials are either dropped or applied incorrectly.

### 3.2 Component Decoupling
The current `CharacterBuilder` logic executes Rigging then Modeling. However, the `PlantRigger` creates independent objects (props) that are not part of the `self.body` mesh returned by the modeler. This creates a "split personality" for the character's geometry that the pipeline doesn't always handle consistently.

## 4. Recommendations for Stabilization

### 4.1 Adopt the "Modular Prop Approach" (Recommended)
Facial features should be treated as **Props**, not baked mesh geometry. This allows for:
*   Independent movement (eyeball tracking).
*   Switchable fidelity (simple spheres vs. complex v6 rigs).
*   Cleaner body mesh topology.

### 4.2 Standardize the "Empty Slot" Protocol
`PlantModeler` must be updated to ensure that even if it doesn't generate eye geometry, the resulting mesh contains at least 4 material slots. This ensures `UniversalShader` can always apply the full material set without failing audits.

### 4.3 Explicit Configuration
Update `movie_config.json` to include a `facial_fidelity` parameter.
*   `fidelity: "LOW"` -> Modeler generates simple eye spheres.
*   `fidelity: "HIGH"` -> Rigger attaches advanced facial props; Modeler generates empty slots.

## 5. Implementation Plan
1.  **Update `PlantModeler.py`**: Add a final step to `build_mesh` that ensures 4 material slots exist, regardless of face counts.
2.  **Update `PlantRigger.py`**: Formalize the use of `facial_utilities_v6` and ensure it checks for existing geometry before attaching props to prevent future redundancy.
3.  **SDD Audit Update**: Modify `ProtagonistStructureAudit.cpp` to verify the presence of material slots rather than just geometry presence.

---
**Assessment Conducted by**: Precision Power (Systems Architect)
**Status**: Pending User Approval
