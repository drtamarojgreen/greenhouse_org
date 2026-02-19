import bpy
tree = bpy.data.node_groups.new(name="TestTree", type='CompositorNodeTree')
node = tree.nodes.new('CompositorNodeVecBlur')
print(f"--- Node: {node.bl_idname} ---")
print("Attributes:")
for attr in dir(node):
    if not attr.startswith("_"):
        print(f"  - {attr}")
print("Inputs:")
for i in node.inputs:
    print(f"  - {i.name} (identifier: {i.identifier})")
