# Blender Issues Implementation Plan

## 1. Naming Convention Standardization
### Issues
- Heavy character meshes were using inconsistent suffixes (`_Mesh` vs `_Torso`).
- Greenhouse structure was inconsistently named (`Greenhouse_Main` vs `Greenhouse_Structure`).
- Assets missing in `test_assets.py` and `test_final_release_gate.py` due to naming mismatches.

### Fixes
- Standardized all character main meshes to use `_Torso` (e.g., `Herbaceous_Torso`).
- Standardized Greenhouse structure to `Greenhouse_Structure`.
- Updated all scripts and tests to reference these standardized names.

## 2. Animation & Keyframe Issues
### Issues
- **Limb Movement**: `test_animation.py` fails to detect movement on character limbs (Arm.L, Leg.R, etc.).
- **Static Camera**: Camera reported as static in several tests.
- **Noise Modifiers**: Procedural secondary motion (Noise modifiers on F-Curves) missing or not detected.
- **Interaction Scene**: Multiple failures in `test_interaction_scene.py` regarding Herbaceous movement, GazeTarget, Staff gesture, and Mouth/Eye animations.
- **Missing Keyframes**: Scenes 16-22 reported as having no keyframes in `test_scene_modules.py`.

### Fixes
- **Rig Targeting**: Update animation scripts to ensure keyframes are applied to Armature bones (`pose.bones["Torso"]`, `pose.bones["Mouth"]`, etc.) instead of mesh objects.
- **Camera Choreography**: Verify `camera_controls.py` is correctly applying keyframes and that tests account for Blender 5.0 layered actions.
- **Procedural Motion**: Re-insert Noise modifiers via `style.insert_looping_noise` and ensure they are active on the correct channels.
- **Test Alignment**: Update `test_animation.py` and `test_interaction_scene.py` to use `style.get_action_curves()` for robust F-Curve access across Blender versions.

## 3. Blender 5.0+ Compatibility
### Issues
- Accessing F-Curves on the `Action` object now requires handling Layered Actions.
- Legacy `action.fcurves` access often returns empty or incorrect data in 5.x.

### Fixes
- Consistently use `style.get_action_curves(action)` which abstracts away the version-specific details of F-Curve retrieval.
