import bpy
import sys
import os
from collections import Counter

# Add movie root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
try:
    from silent_movie_generator import MovieMaster
except ImportError:
    # Fallback
    sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
    from silent_movie_generator import MovieMaster

def count_objects():
    print("=== OBJECT COUNT ANALYSIS ===")
    
    # Run quick generation
    try:
        master = MovieMaster(mode='SILENT_FILM')
        master.run(quick=True)
    except Exception as e:
        print(f"Error during generation: {e}")
        return

    objects = bpy.data.objects
    meshes = bpy.data.meshes
    
    print(f"Total Objects: {len(objects)}")
    print(f"Total Meshes: {len(meshes)}")
    
    # Analyze Objects
    obj_prefixes = [o.name.split('_')[0] for o in objects]
    obj_counts = Counter(obj_prefixes)
    
    print("\n--- Object Counts by Prefix ---")
    for prefix, count in obj_counts.most_common(20):
        print(f"{prefix}: {count}")
        
    # Analyze Meshes
    mesh_prefixes = [m.name.split('.')[0].split('_')[0] for m in meshes]
    mesh_counts = Counter(mesh_prefixes)
    
    print("\n--- Mesh Counts by Prefix ---")
    for prefix, count in mesh_counts.most_common(20):
        print(f"{prefix}: {count}")

    # Check for specific merged objects
    print("\n--- Check for Merged Objects ---")
    for name in ["Herbaceous_Hair", "Arbor_Hair", "GardenBush", "GardenBush_Combined"]:
        found = any(o.name == name for o in objects)
        print(f"{name}: {'FOUND' if found else 'NOT FOUND'}")
        
    print("=== END ANALYSIS ===")

if __name__ == "__main__":
    count_objects()
