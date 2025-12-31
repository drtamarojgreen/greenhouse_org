
import bpy
mat = bpy.data.materials.new(name="Test")
mat.use_nodes = True
voronoi = mat.node_tree.nodes.new(type='ShaderNodeTexVoronoi')
print("VORONOI ATTRIBUTES:")
for attr in dir(voronoi):
    if not attr.startswith("__"):
        try:
            val = getattr(voronoi, attr)
            print(f"  {attr}: {val}")
        except:
            print(f"  {attr}: [COULD NOT READ]")
