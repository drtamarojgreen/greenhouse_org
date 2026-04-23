import bpy
import os

def setup_render_settings():
    """Forces valid render settings for the restricted environment."""
    scene = bpy.context.scene
    scene.render.image_settings.file_format = 'JPEG'
    scene.render.image_settings.quality = 90
    scene.render.film_transparent = True
    scene.render.resolution_x = 1024
    scene.render.resolution_y = 1024

def add_overlay_text(text, location=(0, 0, 5)):
    """Creates a temporary text overlay to identify the rendered asset."""
    font_curve = bpy.data.curves.new(type="FONT", name="DiagText")
    font_obj = bpy.data.objects.new(name="DiagText", object_data=font_curve)
    bpy.context.scene.collection.objects.link(font_obj)
    font_obj.data.body = text
    font_obj.data.size = 0.5
    font_obj.location = location
    return font_obj

def render_texture_diagnostics():
    setup_render_settings()
    base_dir = os.path.join(os.path.dirname(bpy.data.filepath), "renders", "diag")
    os.makedirs(base_dir, exist_ok=True)

    rigs = [o for o in bpy.data.objects if o.type == 'ARMATURE']
    
    for rig in rigs:
        meshes = [o for o in rig.children_recursive if o.type == 'MESH']
        if not meshes: continue
        
        # We test the first material found on the first mesh
        mat = meshes[0].data.materials[0] if meshes[0].data.materials else None
        if not mat: continue
        
        images = [img for img in bpy.data.images if img.name not in ["Render Result", "Viewer Node"]]
        
        for i, img in enumerate(images):
            # Map Image
            for node in mat.node_tree.nodes:
                if node.type == 'TEX_IMAGE': node.image = img
            
            # Setup Overlay
            overlay = add_overlay_text(f"Rig: {rig.name}\nTex: {img.name}")
            
            frame_path = os.path.join(base_dir, f"{rig.name}_{i:04d}.jpg")
            bpy.context.scene.render.filepath = frame_path
            
            bpy.ops.render.render(write_still=True)
            
            # Cleanup
            bpy.data.objects.remove(overlay, do_unlink=True)

if __name__ == "__main__":
    bpy.ops.wm.open_mainfile(filepath="scripts/blender/movie/6/MHD2_optimized.blend")
    render_texture_diagnostics()
