import bpy
import sys

bpy.context.scene.use_nodes = True
tree = getattr(bpy.context.scene, 'compositing_node_group', None) or getattr(bpy.context.scene, 'node_tree', None)

if tree:
    print("Tree type:", type(tree))
    try:
        node = tree.nodes.new('CompositorNodeComposite')
        print("Success creating CompositorNodeComposite")
    except Exception as e:
        print("Failed to create CompositorNodeComposite:", e)
    
    try:
        node = tree.nodes.new('NodeGroupOutput')
        print("Success creating NodeGroupOutput")
    except Exception as e:
        print("Failed to create NodeGroupOutput:", e)

    print("Nodes in tree currently:")
    for n in tree.nodes:
        print(" -", n.type, n.name)
else:
    print("No tree found")
