import sys
import os
import bpy

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from silent_movie_generator import MovieMaster

def main():
    print("Generating movie...")
    master = MovieMaster(mode='SILENT_FILM')
    master.run()
    
    depsgraph = bpy.context.evaluated_depsgraph_get()
    
    print("Finding high poly objects...")
    poly_counts = []
    total_polygons = 0
    for obj in bpy.context.scene.objects:
        if obj.type == 'MESH':
            eval_obj = obj.evaluated_get(depsgraph)
            try:
                mesh = eval_obj.to_mesh()
                count = len(mesh.polygons)
                poly_counts.append((obj.name, count))
                total_polygons += count
                eval_obj.to_mesh_clear()
            except Exception:
                pass
                
    poly_counts.sort(key=lambda x: x[1], reverse=True)
    
    print(f"Total Polygons: {total_polygons}")
    print("Top 20 high poly objects:")
    for name, count in poly_counts[:20]:
        print(f"{name}: {count}")

if __name__ == "__main__":
    main()
