import bpy
import os
import sys

# Add movie root for style_utilities access
MOVIE_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if MOVIE_ROOT not in sys.path:
    sys.path.append(MOVIE_ROOT)

import style_utilities as style

EQUIPMENT_DIR = "/home/tamarojgreen/Documents/Movie_Equipment/"
OUTPUT_PATH = "/home/tamarojgreen/development/LLM/greenhouse_org/scripts/blender/movie/6/Spirits_V6_Assets.blend"

# FBX File pairs (FBX, Texture)
TARGETS = [
    ("Leafy_Tree_Spirit_1207153453_texture.fbx", "Leafy_Tree_Spirit_1207153453_texture.png", "LeafySpirit"),
    ("Tree_Spirit_of_Joy_1207153014_texture.fbx", "Tree_Spirit_of_Joy_1207153014_texture.png", "JoySpirit"),
    ("tree_leaf_character02.fbx", None, "LeafChar") # No explicit texture mentioned for this one
]

def patch_fbx_importer():
    try:
        import io_scene_fbx
        ImportFBX = io_scene_fbx.ImportFBX
        original_execute = ImportFBX.execute
        def patched_execute(self, context):
            if not hasattr(self, 'files'): self.files = []
            return original_execute(self, context)
        ImportFBX.execute = patched_execute
    except: pass

def optimize_character(objs, name_prefix):
    print(f"Optimizing {name_prefix}...")
    for obj in objs:
        if obj.type == 'MESH':
            # Decimate
            if len(obj.data.vertices) > 5000:
                mod = obj.modifiers.new(name="AutoDecimate", type='DECIMATE')
                mod.ratio = 0.4
                bpy.context.view_layer.objects.active = obj
                bpy.ops.object.modifier_apply(modifier=mod.name)
            
            # Name
            obj.name = f"{name_prefix}_{obj.name}"
            obj.data.name = f"{name_prefix}_{obj.data.name}"

def setup_material(obj, tex_name):
    """Assigns texture if missing, or validates existing ones."""
    for mat in obj.data.materials:
        if not mat: continue
        mat.use_nodes = True
        nodes = mat.node_tree.nodes
        links = mat.node_tree.links
        
        # Check if it already has a texture
        has_linked_tex = False
        bsdf = nodes.get("Principled BSDF")
        if not bsdf: continue
        
        for node in nodes:
            if node.type == 'TEX_IMAGE' and node.image:
                has_linked_tex = True
                break
        
        # If no texture (or missing), and we have a target PNG, apply it
        if (not has_linked_tex or nodes.get("TEX_IMAGE").image.size[0] == 0) and tex_name:
            tex_path = os.path.join(EQUIPMENT_DIR, tex_name)
            if os.path.exists(tex_path):
                img = bpy.data.images.get(tex_name) or bpy.data.images.load(tex_path)
                tex_node = nodes.get("TEX_IMAGE") or nodes.new('ShaderNodeTexImage')
                tex_node.image = img
                if bsdf:
                    links.new(tex_node.outputs['Color'], bsdf.inputs['Base Color'])
        elif (not has_linked_tex or nodes.get("TEX_IMAGE").image.size[0] == 0) and not tex_name:
            # Fallback for LeafChar: Use LeafySpirit's texture
            fallback_tex = "Leafy_Tree_Spirit_1207153453_texture.png"
            tex_path = os.path.join(EQUIPMENT_DIR, fallback_tex)
            if os.path.exists(tex_path):
                img = bpy.data.images.get(fallback_tex) or bpy.data.images.load(tex_path)
                tex_node = nodes.get("TEX_IMAGE") or nodes.new('ShaderNodeTexImage')
                tex_node.image = img
                if bsdf:
                   links.new(tex_node.outputs['Color'], bsdf.inputs['Base Color'])

def main():
    patch_fbx_importer()
    bpy.ops.wm.read_factory_settings(use_empty=True)
    
    all_imported = []
    
    for fbx, tex, nick in TARGETS:
        path = os.path.join(EQUIPMENT_DIR, fbx)
        if not os.path.exists(path): continue
        
        # Import
        bpy.ops.import_scene.fbx(filepath=path)
        imported_objs = [o for o in bpy.context.selected_objects]
        
        # Optimize
        optimize_character(imported_objs, nick)
        
        # Texture
        for o in imported_objs:
            if o.type == 'MESH' and tex:
                setup_material(o, tex)
        
        all_imported.extend(imported_objs)
        # Deselect for next import
        bpy.ops.object.select_all(action='DESELECT')

    # Save
    bpy.ops.wm.save_as_mainfile(filepath=OUTPUT_PATH)
    print(f"Assets consolidated and saved to {OUTPUT_PATH}")

if __name__ == "__main__":
    main()
