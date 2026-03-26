import bpy
import struct
import os

# Bridge script to export Blender/FBX data to Greenhouse C++ format
def export_gmesh(obj_name, filepath):
    obj = bpy.data.objects.get(obj_name)
    if not obj or obj.type != 'MESH': return
    
    mesh = obj.data
    vertices = mesh.vertices
    polygons = mesh.polygons
    
    with open(filepath, 'wb') as f:
        f.write(struct.pack('ii', len(vertices), len(polygons)))
        for v in vertices:
            f.write(struct.pack('fff', v.co.x, v.co.y, v.co.z))
        for poly in polygons:
            f.write(struct.pack('i', len(poly.vertices)))
            for vid in poly.vertices:
                f.write(struct.pack('i', vid))

def batch_export_all_assets(output_dir):
    os.makedirs(output_dir, exist_ok=True)
    targets = [
        "Herbaceous", "Arbor", "GloomGnome", 
        "Greenhouse_Structure", "Exterior_Garden_Main",
        "BrainNode", "Neuron_A"
    ]
    for name in targets:
        path = os.path.join(output_dir, f"{name.lower()}.gmesh")
        print(f"Exporting {name} to {path}...")
        export_gmesh(name, path)

if __name__ == "__main__":
    # Example usage: export all to the C++ project's asset folder
    batch_export_all_assets("c/assets")
