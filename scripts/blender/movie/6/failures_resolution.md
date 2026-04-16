# Scene 6 Failures: 5x5x5 Resolution Strategy

This document outlines the systematic approach to resolving the 5 primary production failures identified in Scene 6, providing 5 distinct solutions per failure and 5 test scenarios per solution.

## Failure 1: Phase A Asset Extraction Skips (Phoenix_Herald/Rig Sharing)
*Symptoms*: Characters like Sylvan_Majesty and Radiant_Aura skipped due to "body missing" or rig naming collisions.

### Solutions:
1. **Source-Property Resolution**: Resolve objects via `source_name` custom property instead of final artistic name.
2. **Deep Rig Duplication**: Explicitly `.copy()` shared armatures (e.g. 'skeleton') for each character to ensure independent FBX hierarchies.
3. **Multi-Stage Resolution Map**: Build a full map of (mesh, rig, art_name) before performing ANY renames to prevent reference loss.
4. **Armature Modifier Re-binding**: Post-import/duplication, force re-assignment of `modifier.object` to the character-specific rig.
5. **Recursive Child Inclusion**: Explicitly select all children of both the mesh AND the armature during FBX selection export.

### Test Scenarios (Solution 2):
1. Verify `Phoenix_Herald.Rig` is not identical to `Root_Guardian.Rig` data-block.
2. Confirm Armature modifier on `Phoenix_Herald.Body` points to `Phoenix_Herald.Rig`.
3. Ensure no two characters share the same armature object reference in the extraction scene.
4. Verify total rig count in extraction scene matches ensemble definition count.
5. Confirm rig names follow canonical `Character.Rig` pattern after resolution.

## Failure 2: FBX Pipeline Compatibility (AttributeErrors)
*Symptoms*: 'ExportFBX' object has no attribute 'use_space_transform' and 'ImportFBX' has no attribute 'files'.

### Solutions:
1. **Robust Class setattr**: Set attributes directly on the Operator class at runtime using `setattr(bpy.types.OP_CLASS, "attr", val)`.
2. **Annotation-Level Injection**: Update `__annotations__` with `bpy.props.BoolProperty` or `CollectionProperty`.
3. **Context-Sensitive Shimming**: Wrap FBX calls in a try-except block that injects missing parameters into the keyword arguments.
4. **RNA Property Fallback**: Dynamically inspect `bl_rna.properties` and only pass supported keys to the operator.
5. **Operator Registration Reset**: Force re-registration of the `io_scene_fbx` addon during script initialization.

### Test Scenarios (Solution 1):
1. Confirm `hasattr(bpy.types.EXPORT_SCENE_OT_fbx, "use_space_transform")` is True.
2. Confirm `hasattr(bpy.types.IMPORT_SCENE_OT_fbx, "files")` is True.
3. Verify FBX export executes without RuntimeError in background mode.
4. Verify FBX import accepts a valid filepath without crashing on `self.files` access.
5. Confirm monkeypatching persists across multiple script execution calls.

## Failure 3: Protagonist Head Animation Isolation
*Symptoms*: "Head" sphere meshes do not animate with the bodies.

### Solutions:
1. **Bone Parenting Override**: Parent facial props directly to bones using `parent_type='BONE'` instead of vertex skinning.
2. **Deform Flag Verification**: Force `bone.use_deform = True` for Head, Neck, and Torso during rig generation.
3. **Explicit Weight Assignment**: Use `VertexGroup.add()` with full weight (1.0) on the entire head mesh post-creation.
4. **Matrix World Synchronization**: Force view_layer update before keyframing to ensure world-space transforms are accurate.
5. **Armature Modifier Priority**: Ensure the Armature modifier is the first in the stack and targets the correct rig object.

### Test Scenarios (Solution 1):
1. Verify `Herbaceous_V5_Eye_L.parent_type == 'BONE'`.
2. Confirm `Herbaceous_V5_Eye_L.parent_bone == 'Eye.L'`.
3. Verify head props move when the Head bone is rotated in Pose Mode.
4. Ensure head props are linked to the correct Assets collection.
5. Confirm no "double transform" issues exist between mesh skinning and bone parenting.

## Failure 4: Distorted Character Scaling (0.08m dots)
*Symptoms*: Sylvan_Majesty appearing as a 0.08m dot or being incorrectly measured.

### Solutions:
1. **Bone-to-Bone Height**: Measure world-distance between Head bone head and Foot bone head.
2. **Percentile-Based Fallback**: Use 0.5% - 99.5% vertex filtering to ignore outlier shards.
3. **Parent Inverse Normalization**: Force `mesh.matrix_parent_inverse = Identity` and reset local transforms to zero.
4. **Rig-Scale Priority**: Measure characters at a default scale of 1.0 before applying production scale factor.
5. **Visual Bounding Box Update**: Force `depsgraph` update before calculating any spatial dimensions.

### Test Scenarios (Solution 1):
1. Verify Head bone world Z > Foot bone world Z.
2. Confirm calculated height is within 10% of config target (e.g. 6.0m for Majesty).
3. Ensure no mesh vertices have Z coordinates > 100m (shard detection).
4. Verify Rig scale factor is non-zero and reasonable (e.g. 0.5 to 5.0).
5. Confirm character feet are grounded (min Z ≈ 0 after normalization).

## Failure 5: Animation Tag Discovery and Slotted Actions
*Symptoms*: AttributeErrors on `Action.fcurves` in Blender 5; tags not found in action names.

### Solutions:
1. **Channel Bag Discovery**: Use `style_utilities.fcurves_operations.get_action_curves` to find curves in modern slots.
2. **Metadata-Driven Naming**: Enforce action names like `Character_Tag_Action` for substring discovery.
3. **Slotted Action Layers**: Ensure every action has at least one layer and slot assigned during creation.
4. **Manual Keyframe Inspection**: Iterate through slots to find keyframes at specific story frames (e.g. frame 120 for nod).
5. **Animation Data Creation shim**: Ensure `animation_data_create()` is called before any keyframe insertions.

### Test Scenarios (Solution 1):
1. Confirm Action has at least one Slot.
2. Verify Slot name contains the object name or bone identifier.
3. Confirm F-Curves are returned by the utility for a given protagonist.
4. Verify keyframe point count in the bag is greater than zero.
5. Confirm the action assigned to the object matches the story-driven tag.
