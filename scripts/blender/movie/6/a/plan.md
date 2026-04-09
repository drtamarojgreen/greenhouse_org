# Project 6 - Phase A: Asset Extraction and Standardization

## Objective
Extract raw character and prop assets from the production `.blend` files into standardized, decoupled formats (FBX and Textures) for use in the Scene 6 production pipeline.

## Deliverables
1. **Standardized FBX Assets**: Each of the 8 Sylvan ensemble members exported as a standalone FBX (Mesh + Armature).
2. **Texture Repository**: Extraction of all diffuse and normal maps to a centralized `scripts/blender/movie/6/assets/` directory.
3. **Extraction Audit**: A verification report ensuring naming parity and geometric integrity.

## Strict Requirements
*   **NO MEASUREMENTS/SCALING**: Assets must be exported at their original linked scale.
*   **NAMING PARITY**: Maintain the artistic naming convention (`Character.Body`, `Character.Rig`).
*   **CLEAN INITIALIZATION**: The extraction environment must be initialized to a clean state before processing.

## Implementation Steps
1. **Initialize Environment**: Execute a standardized scene data-block clear.
2. **Asset Identification**: Map the source internal mesh names (e.g., `Mesh1_Mesh1.044`) to their artistic names (`Sylvan_Majesty`).
3. **Rig-Mesh Synchronization**: Enforce the sibling hierarchy (Mesh parented to Armature modifier, but no object-level parenting).
4. **Export Sequence**: Automated batch export using `bpy.ops.export_scene.fbx`.
5. **Texture Decoupling**: Unpack or copy associated image files to the asset repository.

## Verification
*   Audit script verifying the existence and file size of all 8 exported FBX files.
*   Check that textures are correctly referenced in the exported files.
