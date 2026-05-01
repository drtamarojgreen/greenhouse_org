# Movie Enhancement Gap Analysis (V2-V5 vs V7/V9)

## Executive Summary
This document analyzes the technical and artistic features available in the early evolutionary stages of the Movie production pipeline (Versions 2, 3, 4, and 5) that were either simplified, omitted, or lost to code rot during the transition to the registry-based architecture of Versions 7 and 9.

## 1. Animation & Expressiveness
### 1.1 Emotional State Tags (Missing in V7/V9)
- **V5 Features:** `joyful`, `worry`, `shiver`, `droop`, `stretch`, `wiggle`, `reach_out`, `bend_down`.
- **Status:** Mostly missing in V9. V9 includes `shiver` and `droop`, but lacks the more nuanced emotional states.
- **Intent Analysis:** V5 intended to map neurological states to musculoskeletal responses. V9 focuses on generic "actions" (walk, sit, stand), losing the emotional accuracy required for mental health development narratives.

### 1.2 Facial Control Fidelity & Rendering Failure
- **Rendering Bug (V7):** Characters in V7 render with entirely blank sphere-heads. The `PlantModeler` in V7 completely omits the `create_facial_props` logic found in V4/V5, resulting in characters without eyes, noses, or mouths.
- **V5 Smile:** Controlled via `Lip.Corner.Ctrl.L/R`, moving the actual mesh corners upward and outward.
- **V9 Smile:** Reduced to a simple `-5 degree` head tilt.
- **Bug/Omission:** The `BONE_NAME_MAP` in V9 lacks entries for facial control bones, making it impossible to trigger the high-resolution facial expressions developed in V4/V5.

## 2. Materials & Shading
### 2.1 Ocular Depth (The Iris Problem)
- **V4 Iris Shader:** Utilized a `QUADRATIC_SPHERE` gradient with `Generated` coordinates and a dedicated `IrisRamp` (Pupil -> Iris -> Sclera).
- **V7/V9 UniversalShader:** Replaced complex procedural nodes with a basic color/emission block.
- **Artistic Impact:** The "alive" look of the characters—critical for empathy in a clinical setting—is lost. Eyes now appear flat and "plastic."

### 2.2 Botanical Textures & Wind Physics
- **Wind Physics Bug (V7):** The `WAVE` modifier ("WindSway") that provided organic leaf motion in V4/V5 is absent in V7's `PlantModeler`. This results in static, rigid foliage that destroys the "living greenhouse" metaphor.
- **V4 Bark/Leaf Shaders:** Featured high-contrast mahogany (optimized for Chroma Keying) and translucent subsurface scattering for leaves.
- **V7/V9 Shaders:** Genericized. The "Chroma-optimized" intent of V4 is missing, leading to potential spill issues in post-production.

## 3. Cinematography & Lighting
### 3.1 6-Point Production Lighting
- **V4 Lighting:** Automated `setup_production_lighting` created Rim, Head-Key, and Leg-Key lights that tracked the character's movement.
- **V7/V9 Lighting:** Driven by static entries in `lights_camera.json`.
- **Code Change Analysis:** While the new system is more modular, it lacks the "Light Tracking" logic that ensured consistent character isolation regardless of position in the set.

## 4. System Logic & Interaction
### 4.1 Prop Interaction (Grasp/Pour/Spray)
- **V5 Capability:** Full sub-system for attaching props (`Child Of` constraints) and animating interactions (pouring water, spraying hose).
- **V7/V9 Capability:** Non-existent.
- **Intent Analysis:** V5's "Tactile Grounding" intent is completely lost. Characters in V9 are currently incapable of interacting with objects in their environment.

### 4.2 Environmental Safety & Sequencing
- **Out-of-Turn Rendering (V7):** Environmental objects frequently appear out of sequence. The registry-based director lacks the automated culling and scene-safety checks from V3, relying on manual visibility keys that are prone to error.
- **V3 Feature:** Automated eye-line alignment and "Chroma Spacing" to prevent shadows on the background.
- **V7/V9 Feature:** Manual positioning via config.
- **Regression:** The "Safety Range" logic that guaranteed render quality in V3 was replaced by a system that requires manual verification of every shot.

## 5. Vehicle Malfunctions (V7 Exclusive)
- **Sideways Driving Bug:** The `GreenhouseMobile` drives sideways relative to its visual length. This is caused by a coordinate mismatch between the modeling (X-forward) and the patrol logic (Y-forward orientation).
- **Collision Failures:** The vehicle lacks any collision detection or physics boundaries, allowing it to drive through environmental objects and terrain features without interruption.

## 6. Line-by-Line Analysis of Regressions
| Feature | Version | Intent | Current Status | Reason for Gap |
| :--- | :--- | :--- | :--- | :--- |
| Face Rendering | V4/V5 | Emotional Expression | Broken (V7) | PlantModeler omits facial prop construction logic. |
| Wind Physics | V4/V5 | Organic Dynamics | Missing (V7) | Absence of WAVE modifier in procedural modeling flow. |
| Vehicle Orientation| V7 | Cinematic Transport | Sideways | Coordinate mismatch between model (X) and patrol logic (Y). |
| Collision Detection| V7 | Physical Grounding | Missing | Patrol logic uses LERP waypoints with no raycasting/physics. |
| Anatomical Rigging | V4 | Full musculoskeletal control | Simplified | Registry porting prioritized "standard" bones (Mixamo). |
| Emotional Accuracy | V5 | Neuro-Physical mapping | Degraded | Omission of facial control bone support. |
| Prop Interaction | V5 | Environmental agency | Missing | System architecture porting focused on characters, not props. |
| 6-Point Lighting | V4 | High-contrast isolation | Static | Move to JSON config removed dynamic tracking logic. |
| Iris Shader | V4 | Empathy/Ocular Depth | Flat | UniversalShader simplification for modularity. |
