
import os
import trimesh
import numpy as np
try:
    from fbxloader import FBXLoader
    HAS_FBXLOADER = True
except ImportError:
    HAS_FBXLOADER = False

fbx_path = os.path.join('scripts', 'blender', 'brain.fbx')

print(f"Checking {fbx_path}...")
if not os.path.exists(fbx_path):
    print("File not found!")
    exit(1)

print("\n--- Inspecting trimesh.load ---")
try:
    mesh_or_scene = trimesh.load(fbx_path, force='scene')
    print(f"Type: {type(mesh_or_scene)}")
    if isinstance(mesh_or_scene, trimesh.Scene):
        print(f"Is Scene. Geometry keys: {list(mesh_or_scene.geometry.keys())}")
        print(f"Graph nodes: {len(mesh_or_scene.graph.nodes)}")
        for node in mesh_or_scene.graph.nodes_geometry:
             print(f"Node: {node}, Geometry: {mesh_or_scene.graph[node]}")
    else:
        print("Is not a Scene.")
except Exception as e:
    print(f"trimesh load failed: {e}")

if HAS_FBXLOADER:
    print("\n--- Inspecting FBXLoader ---")
    try:
        loader = FBXLoader(fbx_path)
        print(f"Loader attributes: {dir(loader)}")
        # Check if there is a method to get individual meshes
    except Exception as e:
        print(f"FBXLoader failed: {e}")
else:
    print("\nFBXLoader module not found.")
