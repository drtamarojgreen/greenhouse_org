import bpy
tree = bpy.data.node_groups.new(name="TestTree", type='CompositorNodeTree')
node = tree.nodes.new('CompositorNodeDisplace')
print(f"--- Node: {node.bl_idname} ---")
print("Inputs:")
for i, inp in enumerate(node.inputs):
    print(f"  [{i}] {inp.name} (identifier: {inp.identifier}, type: {inp.type})")
