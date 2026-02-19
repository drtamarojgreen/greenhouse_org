import bpy
import os

def export_for_unity(filepath, objects_to_export):
    """
    Exporters the selected objects to FBX with settings optimized for Unity.
    Bakes animations and ensures correct scale/axis.
    """
    # Deselect all
    bpy.ops.object.select_all(action='DESELECT')

    # Select target objects
    for obj in objects_to_export:
        obj.select_set(True)
        # Select children too
        for child in obj.children_recursive:
            child.select_set(True)

    # Unity typically uses Y up, but Blender FBX exporter handles conversion.
    # We ensure 'Apply Transform' is on and 'Bake Animation' is on.

    bpy.ops.export_scene.fbx(
        filepath=filepath,
        use_selection=True,
        apply_unit_scale=True,
        apply_scale_options='FBX_SCALE_ALL',
        bake_anim=True,
        bake_anim_use_all_actions=False,
        bake_anim_step=1.0,
        bake_anim_simplify_factor=1.0,
        path_mode='COPY',
        embed_textures=True,
        axis_forward='-Z',
        axis_up='Y'
    )
    print(f"Exported Unity asset to {filepath}")

def run_unity_pipeline():
    """Main entry point for Unity export."""
    output_dir = os.path.join(os.getcwd(), "scripts/blender/movie/unity_assets")
    os.makedirs(output_dir, exist_ok=True)

    # Export Characters
    characters = [obj for obj in bpy.context.scene.objects if "Torso" in obj.name or "Mesh" in obj.name]
    if characters:
        export_for_unity(os.path.join(output_dir, "Characters.fbx"), characters)

    # Export Environment
    env_objs = [obj for obj in bpy.context.scene.objects if any(k in obj.name for k in ["Floor", "Pillar", "Bush"])]
    if env_objs:
        export_for_unity(os.path.join(output_dir, "Environment.fbx"), env_objs)

if __name__ == "__main__":
    run_unity_pipeline()
