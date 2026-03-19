import bmesh
import bpy

print("\n--- BMesh Operator Audit ---")
if hasattr(bmesh.ops, "weld_verts"):
    print("weld_verts found")
    # We can't easily get the signature from the C-builtins in some Blender versions
    # but we can try to call it with dummy data to see the error message's suggestion
    bm = bmesh.new()
    try:
        bmesh.ops.weld_verts(bm, dummy_arg=True)
    except Exception as e:
        print(f"weld_verts error: {e}")
    bm.free()

if AttributeError: # Placeholder for remove_doubles check above
    pass # Cleanup logic if needed

if hasattr(bmesh.ops, "smooth_vert"):
    print("smooth_vert found")
    bm = bmesh.new()
    try:
        bmesh.ops.smooth_vert(bm, dummy_arg=True)
    except Exception as e:
        print(f"smooth_vert error: {e}")
    bm.free()
