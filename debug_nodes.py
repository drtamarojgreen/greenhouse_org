import bpy
print("--- COMPOSITOR NODE TYPES ---")
for nt in dir(bpy.types):
    if "CompositorNode" in nt and "Mix" in nt:
        print(nt)
print("--- SHADER NODE TYPES ---")
for nt in dir(bpy.types):
    if "ShaderNode" in nt and "Mix" in nt:
        print(nt)
