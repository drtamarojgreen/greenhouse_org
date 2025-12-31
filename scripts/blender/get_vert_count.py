
import bpy
import os
fbx_path = '/home/tamarojgreen/development/LLM/greenhouse_org/scripts/blender/brain.fbx'
if os.path.exists(fbx_path):
    bpy.ops.import_scene.fbx(filepath=fbx_path)
    if bpy.context.selected_objects:
        obj = bpy.context.selected_objects[0]
        print(f"ACTUAL_VERTS: {len(obj.data.vertices)}")
        print(f"ACTUAL_FACES: {len(obj.data.polygons)}")
    else:
        print("Import failed: No objects selected.")
else:
    print(f"File not found: {fbx_path}")
