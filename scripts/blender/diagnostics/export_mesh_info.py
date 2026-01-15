
import bpy
import os
import json
import mathutils
import sys

def export_mesh_info():
    # 1. Setup paths
    # We assume this script is run from project root or checks relative to itself
    # But usually blender -P runs in CWD.
    fbx_path = os.path.abspath("scripts/blender/brain.fbx")
    output_dir = os.path.abspath("data/atlas")
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    output_path = os.path.join(output_dir, "mesh_info.json")

    # 2. Clear Scene
    bpy.ops.wm.read_factory_settings(use_empty=True)
    
    # 3. Import FBX
    print(f"Importing {fbx_path}...")
    bpy.ops.import_scene.fbx(filepath=fbx_path)
    
    # 4. Find the main mesh
    # Just take the first mesh object found
    mesh_obj = None
    for obj in bpy.data.objects:
        if obj.type == 'MESH':
            mesh_obj = obj
            break
            
    if not mesh_obj:
        print("No mesh found in FBX!")
        sys.exit(1)
        
    print(f"Analyzing mesh: {mesh_obj.name}")
    
    # 5. Compute Bounds and Center (in World Space)
    # FBX import might have transforms. Apply them?
    # Usually we want the vertices in global space.
    
    # Get world matrix
    mw = mesh_obj.matrix_world
    
    # Calculate bounds in world space
    # (The .bound_box attribute is local coordinates of 8 corners)
    bbox_corners = [mw @ mathutils.Vector(corner) for corner in mesh_obj.bound_box]
    
    xs = [v.x for v in bbox_corners]
    ys = [v.y for v in bbox_corners]
    zs = [v.z for v in bbox_corners]
    
    bounds = [
        [min(xs), max(xs)],
        [min(ys), max(ys)],
        [min(zs), max(zs)]
    ]
    
    extents = [
        bounds[0][1] - bounds[0][0],
        bounds[1][1] - bounds[1][0],
        bounds[2][1] - bounds[2][0]
    ]
    
    center = [
        (bounds[0][0] + bounds[0][1]) / 2.0,
        (bounds[1][0] + bounds[1][1]) / 2.0,
        (bounds[2][0] + bounds[2][1]) / 2.0
    ]
    
    info = {
        "bounds": bounds,
        "extents": extents,
        "center": center,
        "name": mesh_obj.name,
        "vertex_count": len(mesh_obj.data.vertices)
    }
    
    print("Mesh Info:")
    print(json.dumps(info, indent=2))
    
    with open(output_path, 'w') as f:
        json.dump(info, f, indent=2)

    # 6. Export Geometry to NPY
    # We need numpy. Blender's bundled python usually has numpy.
    try:
        import numpy as np
        
        # Vertices (World Coords)
        mw = mesh_obj.matrix_world
        verts_world = [mw @ v.co for v in mesh_obj.data.vertices]
        verts_array = np.array([(v.x, v.y, v.z) for v in verts_world], dtype=np.float32)
        
        # Normals (World Coords - simplified, ignoring non-uniform scale issues)
        # Note: for true world normals, we need adjacent matrix transpose inverse.
        # But if scale is uniform, rotation matrix is fine.
        rot_mat = mw.to_3x3()
        norms_world = [rot_mat @ v.normal for v in mesh_obj.data.vertices]
        norms_array = np.array([(v.x, v.y, v.z) for v in norms_world], dtype=np.float32)
        # Normalize
        norms_norms = np.linalg.norm(norms_array, axis=1, keepdims=True)
        norms_array = norms_array / (norms_norms + 1e-6)

        # Faces (Indices)
        # Triangulate first? 
        # CAUTION: if mesh is not triangulated, polygons can have >3 verts.
        # The GNN expects triangles. We should iterate loops or let Blender triangulate.
        
        # Create a temporary computed mesh with triangulation
        import bmesh
        bm = bmesh.new()
        bm.from_mesh(mesh_obj.data)
        bmesh.ops.triangulate(bm, faces=bm.faces)
        
        # Get faces from bmesh
        faces_list = [[v.index for v in f.verts] for f in bm.faces]
        faces_array = np.array(faces_list, dtype=np.int32)
        
        bm.free()

        # Save files
        np.save(os.path.join(output_dir, "vertices.npy"), verts_array)
        np.save(os.path.join(output_dir, "vertex_normals.npy"), norms_array)
        np.save(os.path.join(output_dir, "faces.npy"), faces_array)
        
        print(f"Saved {len(verts_array)} vertices, {len(norms_array)} normals, {len(faces_array)} faces.")
        
    except ImportError:
        print("Error: Numpy not found in Blender python. Cannot save .npy.")
    except Exception as e:
        print(f"Error saving geometry npy: {e}")
        import traceback
        traceback.print_exc()
        
    print(f"Saved mesh info to {output_path}")

if __name__ == "__main__":
    export_mesh_info()
