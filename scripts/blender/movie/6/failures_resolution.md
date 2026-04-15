# Scene 6 Failures: 5x5x5 Resolution Strategy

This document outlines the systematic approach to resolving the 5 primary production failures identified in Scene 6, providing 5 distinct solutions per failure and 5 test scenarios per solution.

## Failure 1: Phase A Asset Extraction Skips (Phoenix_Herald/Rig Sharing)
*Symptoms*: Phoenix_Herald rig missing, shared armatures causing naming collisions.

### Solutions:
1. **Source-Property Resolution**: Utilize the `source_name` custom property to resolve objects regardless of current name.
2. **Deep Rig Duplication**: Recursively duplicate and re-bind shared armatures so every character owns a unique rig instance.
3. **Rig Proxy Pattern**: Export characters with a standardized "SpiritRig" and bind them to specific actions post-import.
4. **Namespace Isolation**: Prefix all source objects with character tags before any extraction logic begins.
5. **Collection-based Scoping**: Use source collections to identify mesh-rig pairs instead of name mapping.

### Test Cases (for Solution 2):
1. Verify rig name matches `{Character}.Rig` after duplication.
2. Confirm Armature modifier on mesh points to the new rig instance.
3. Ensure no two characters share the same armature Data-block.
4. Verify source animation actions are re-assigned to the new rig.
5. Confirm total armature count in scene matches character count.

## Failure 2: FBX Import/Export Compatibility (files/use_space_transform)
*Symptoms*: AttributeError on 'ImportFBX' and 'ExportFBX' objects in Blender 5.0.1.

### Solutions:
1. **Class-Level Monkeypatch**: Set attributes directly on the Operator class using `setattr`.
2. **Operator RNA Extension**: Dynamically register properties using `bpy.props`.
3. **Internal Addon Patching**: Locally modify the `io_scene_fbx` addon scripts during runtime.
4. **Subprocess isolation**: Run export/import in a separate Blender process using a minimal script.
5. **Universal Wrapper**: Decorate all FBX calls with an attribute-injection shim.

### Test Cases (for Solution 1):
1. Verify `use_space_transform` exists on `EXPORT_SCENE_OT_fbx`.
2. Verify `files` property exists on `IMPORT_SCENE_OT_fbx`.
3. Ensure FBX export command executes without RuntimeError.
4. Confirm FBX import command accepts a valid filepath.
5. Verify property values are readable after operator initialization.

## Failure 3: Slotted Action Discovery
*Symptoms*: AttributeError: 'Action' object has no attribute 'fcurves'.

### Solutions:
1. **Channel Bag Retrieval**: Use `anim_utils.action_get_channelbag_for_slot`.
2. **Legacy F-Curve Projection**: Flatten slotted actions into a temporary virtual fcurve list.
3. **Data-Path Mapping**: Directly iterate `action.fcurves` (if they exist in some slots).
4. **Binding Proxy**: Use `action.fcurve_find` with explicit data blocks.
5. **Unified Discovery Utility**: Implement `get_action_curves` in `style_utilities`.

### Test Cases (for Solution 1):
1. Confirm Action has at least one Slot.
2. Verify Slot name matches object name or bone path.
3. Confirm Channel Bag contains F-Curves for the target property.
4. Verify keyframe point count matches animation duration.
5. Confirm F-Curve can be evaluated at a specific frame.

## Failure 4: Distorted Character Scaling (0.08m height)
*Symptoms*: Sylvan_Majesty appearing as a 0.08m "dot" or being incorrectly measured.

### Solutions:
1. **Bone-to-Bone World Height**: Measure distance between Head and Foot bone heads in world space.
2. **Robust Percentile Fallback**: 0.5% - 99.5% vertex Z-filtering.
3. **Rig-Relative Normalization**: Measure height at rig scale 1.0 and then apply calculated scale.
4. **Parent Inverse Reset**: Force Identity matrix on all parented meshes.
5. **Manual Marker Calibration**: Use "Top" and "Bottom" empties linked to rig.

### Test Cases (for Solution 1):
1. Verify Head bone world Z > Foot bone world Z.
2. Confirm calculated height is within 10% of config target.
3. Ensure no mesh vertices have Z coordinates > 100m (shard detection).
4. Verify Rig scale factor is between 0.1 and 10.0.
5. Confirm character feet are grounded (min Z ≈ 0).

## Failure 5: Animation Tag Parity
*Symptoms*: Protagonist actions missing "talking" or "dance" tags in their metadata.

### Solutions:
1. **Tagged Action Naming**: Action names must contain `_{tag}`.
2. **Custom Property Metadata**: Store tags in `action["tag"]`.
3. **Action Grouping**: Store specific animations in named Slot Groups.
4. **Registry Tracking**: Maintain a global `AnimationRegistry` mapping objects to active tags.
5. **Heuristic Detection**: Analyze f-curve amplitude to determine animation type (talking vs idle).

### Test Cases (for Solution 1):
1. Verify Action name contains protagonist name.
2. Confirm Action name contains the assigned tag (e.g. "talking").
3. Verify keyframes exist at the expected start frame for the tag.
4. Confirm Action is assigned to the object's animation_data.
5. Verify no orphaned actions exist without character associations.
