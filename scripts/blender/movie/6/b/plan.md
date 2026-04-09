# Project 6 - Phase B: Cinematic Production and Rendering

## Objective
Assemble the final Scene 6 cinematic environment using the assets extracted in Phase A, restoring total visual parity with Scene 5 production standards.

## Deliverables
1. **Scene 6 Master Assembly**: A production-ready assembly script linking FBX assets.
2. **Restored Cinematic Rig**: Implementation of the `WIDE`, `OTS1`, `OTS2`, `OTS_Static_1`, and `OTS_Static_2` camera rig.
3. **Environmental Restoration**: 1:1 restoration of the `ChromaBackdrop_Wide` three-plane architecture with image-mapped shaders.

## Strict Requirements
*   **RESTORATION FOCUS**: Background images and camera positions must match the v5 proven configurations exactly.

## Implementation Steps
1. **Initialize Scene**: Ensure a clean production workspace.
2. **Environment Setup**: Re-integrate `chroma_green_setup.py` (v5 logic) and map background images.
4. **Asset Integration**: Link the FBX assets exported in Phase A.
5. **Dialogue & Blocking**: Apply cinematic direction and dialogue sequences.

## Verification
*   `audit_scene_v6.py`: Verifying all camera names, backdrop shaders, and character visibility.
*   `test_v6_spirit_integration.py`: Expanded regression tests for production parity.
