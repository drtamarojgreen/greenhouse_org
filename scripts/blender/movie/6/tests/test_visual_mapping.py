import bpy
import os

def render_visual_test():
    """
    Renders visual verification frames by saving pixels directly.
    This bypasses the restricted FFMPEG-only render settings.
    """
    output_dir = os.path.join(os.path.dirname(bpy.data.filepath), "renders", "visual_test")
    os.makedirs(output_dir, exist_ok=True)
    
    # 1. Identify Rig and Material
    rig = next((o for o in bpy.data.objects if o.type == 'ARMATURE'), None)
    if not rig: return
        
    mesh = next((o for o in rig.children_recursive if o.type == 'MESH'), None)
    mat = mesh.data.materials[0] if mesh and mesh.data.materials else None
    if not mat: return

    images = [img for img in bpy.data.images if img.name not in ["Render Result", "Viewer Node"]]
    
    # 2. Camera Setup (Top-down focus)
    cam = bpy.data.objects.get("Camera")
    if cam: bpy.context.scene.camera = cam

    # 3. Direct Image Export Loop
    for i, img in enumerate(images):
        # Assign texture
        for node in mat.node_tree.nodes:
            if node.type == 'TEX_IMAGE':
                node.image = img
        
        # Trigger render to the internal buffer
        bpy.ops.render.render(write_still=False)
        
        # Directly save the buffer to disk as PNG (bypassing render settings enum)
        frame_path = os.path.join(output_dir, f"test_{i:04d}_{img.name[:10]}.png")
        bpy.data.images['Render Result'].save_render(filepath=frame_path)
        
        print(f"Director: Saved {frame_path}")

if __name__ == "__main__":
    filepath = "scripts/blender/movie/6/MHD2_optimized.blend"
    bpy.ops.wm.open_mainfile(filepath=filepath)
    render_visual_test()
