
import bpy
import sys
import argparse
import os

def analyze_blend_file(filepath):
    """
    Analyzes the contents of a .blend file and prints a report
    of the data-block sizes.
    """
    if not os.path.exists(filepath):
        print(f"Error: File not found at {filepath}")
        return

    bpy.ops.wm.open_mainfile(filepath=filepath)

    print(f"\n--- Analysis Report for: {os.path.basename(filepath)} ---")

    data_sizes = {
        "Meshes": 0,
        "Textures": 0,
        "Animations": 0,
        "Materials": 0,
        "Objects": 0,
        "Other": 0,
    }

    # It's difficult to get the exact size of each data-block in bytes
    # from within Blender's Python API, as the file format is complex
    # and includes compression.
    # Instead, we can count the number of elements and make some educated
    # guesses about what is taking up the most space.

    # --- Meshes ---
    mesh_count = len(bpy.data.meshes)
    total_verts = sum(len(m.vertices) for m in bpy.data.meshes)
    total_polys = sum(len(m.polygons) for m in bpy.data.meshes)
    data_sizes["Meshes"] = f"{mesh_count} meshes, {total_verts} vertices, {total_polys} polygons"

    # --- Textures ---
    image_count = len(bpy.data.images)
    total_texture_size = 0
    for img in bpy.data.images:
        # This is a rough estimate of the memory usage, not the file size
        if img.packed_file:
            total_texture_size += img.packed_file.size
        elif os.path.exists(bpy.path.abspath(img.filepath)):
             total_texture_size += os.path.getsize(bpy.path.abspath(img.filepath))
             
    data_sizes["Textures"] = f"{image_count} images, estimated size: {total_texture_size / (1024*1024):.2f} MB"

    # --- Animations ---
    action_count = len(bpy.data.actions)
    total_fcurves = sum(len(a.fcurves) for a in bpy.data.actions)
    data_sizes["Animations"] = f"{action_count} actions, {total_fcurves} F-curves"

    # --- Materials ---
    material_count = len(bpy.data.materials)
    data_sizes["Materials"] = f"{material_count} materials"
    
    # --- Objects ---
    object_count = len(bpy.data.objects)
    data_sizes["Objects"] = f"{object_count} objects"


    for data_type, size_info in data_sizes.items():
        print(f"- {data_type}: {size_info}")

    print("--- End of Report ---")


if __name__ == "__main__":
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1:]
    else:
        argv = []

    parser = argparse.ArgumentParser(description="Analyze a .blend file and report on data-block sizes.")
    parser.add_argument("--file", required=True, help="Path to the .blend file to analyze.")
    args = parser.parse_args(argv)

    analyze_blend_file(args.file)
