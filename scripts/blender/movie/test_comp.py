import bpy
bpy.context.scene.use_nodes = True
print("node_tree:", getattr(bpy.context.scene, "node_tree", None))
print("compositing_node_group:", getattr(bpy.context.scene, "compositing_node_group", None))
print("ALL properties in scene:")
for prop in dir(bpy.context.scene):
    if "node" in prop.lower() or "tree" in prop.lower() or "comp" in prop.lower():
        print(f" - {prop}: {getattr(bpy.context.scene, prop, None)}")
