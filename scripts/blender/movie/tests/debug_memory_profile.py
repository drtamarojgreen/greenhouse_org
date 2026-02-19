import bpy
import sys
import os
import gc

# Add movie root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from silent_movie_generator import MovieMaster

def print_stats(iteration):
    meshes = len(bpy.data.meshes)
    objects = len(bpy.data.objects)
    materials = len(bpy.data.materials)
    actions = len(bpy.data.actions)
    if hasattr(bpy.data, "particles"):
        particles = len(bpy.data.particles)
    else:
        # Blender < 4.0 or different API
        particles = 0
        
    print(f"[Iter {iteration}] Objects: {objects}, Meshes: {meshes}, Mats: {materials}, Actions: {actions}")

def run_profile():
    print("=== STARTING MEMORY PROFILE ===")
    
    # Run 1: Cold start
    print("--- RUN 1 ---")
    master = MovieMaster(mode='SILENT_FILM')
    master.run(quick=True) # Use quick mode if available to speed up, or full if needed
    print_stats(1)
    
    # Teardown logic usually handled by setup_engine in next run, but let's see if we can trigger accumulation
    
    # Run 2: Second pass
    print("--- RUN 2 ---")
    master = MovieMaster(mode='SILENT_FILM')
    master.run(quick=True)
    print_stats(2)

    # Run 3: Third pass
    print("--- RUN 3 ---")
    master = MovieMaster(mode='SILENT_FILM')
    master.run(quick=True)
    print_stats(3)
    
    # Explicit garbage collect
    gc.collect()
    print("--- AFTER GC ---")
    print_stats("GC")

if __name__ == "__main__":
    run_profile()
