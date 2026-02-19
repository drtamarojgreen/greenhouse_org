import bpy
import sys
import os

# Add movie root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
try:
    from silent_movie_generator import MovieMaster
except ImportError:
    # Fallback if running from a different context
    sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
    from silent_movie_generator import MovieMaster

def list_meshes():
    print("=== LISTING ALL MESHES ===")
    
    # Run a quick generation to populate the scene
    # We use quick=True to generate the structure without full heavy rendering setup if possible
    try:
        master = MovieMaster(mode='SILENT_FILM')
        master.run(quick=True)
    except Exception as e:
        print(f"Error during generation: {e}")
    
    meshes = bpy.data.meshes
    print(f"Total Meshes: {len(meshes)}")
    
    # Sort for readability
    mesh_names = sorted([m.name for m in meshes])
    
    # Group by prefix to show counts
    from collections import Counter
    prefixes = [n.split('.')[0].split('_')[0] for n in mesh_names]
    counts = Counter(prefixes)
    
    print("\n--- Summary by Prefix ---")
    for prefix, count in counts.most_common():
        print(f"{prefix}: {count}")

    print("\n--- Full Mesh List ---")
    for name in mesh_names:
        print(name)
        
    print("=== END OF LIST ===")

if __name__ == "__main__":
    list_meshes()
