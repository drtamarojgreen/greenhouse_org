import bpy
import os
import sys

EQUIPMENT_DIR = "/home/tamarojgreen/Documents/Movie_Equipment/"
OUTPUT_PATH   = ("/home/tamarojgreen/development/LLM/greenhouse_org/"
                 "scripts/blender/movie/6/Spirits_V6_Assets.blend")

# FBX file pairs: (fbx_filename, texture_filename_or_None, short_nickname)
TARGETS = [
    ("Leafy_Tree_Spirit_1207153453_texture.fbx",
     "Leafy_Tree_Spirit_1207153453_texture.png",
     "LeafySpirit"),
    ("Tree_Spirit_of_Joy_1207153014_texture.fbx",
     "Tree_Spirit_of_Joy_1207153014_texture.png",
     "JoySpirit"),
    ("tree_leaf_character02.fbx",
     None,   # No dedicated texture — will fall back to LeafySpirit texture
     "LeafChar"),
]

FALLBACK_TEXTURE = "Leafy_Tree_Spirit_1207153453_texture.png"


def patch_fbx_importer():
    """Bypasses 'ImportFBX has no attribute files' in headless mode."""
    try:
        import io_scene_fbx
        ImportFBX = io_scene_fbx.ImportFBX
        if getattr(ImportFBX, '_is_patched', False):
            return
        original_execute = ImportFBX.execute
        def patched_execute(self, context):
            if not hasattr(self, 'files'):
                self.files = []
            return original_execute(self, context)
        ImportFBX.execute = patched_execute
        ImportFBX._is_patched = True
    except Exception:
        pass


def optimize_character(objs, name_prefix):
    """Decimates high-poly meshes and applies a consistent naming prefix."""
    print(f"Optimizing {name_prefix}...")
    for obj in objs:
        if obj.type != 'MESH':
            continue
        if len(obj.data.vertices) > 5000:
            mod = obj.modifiers.new(name="AutoDecimate", type='DECIMATE')
            mod.ratio = 0.4
            bpy.context.view_layer.objects.active = obj
            bpy.ops.object.modifier_apply(modifier=mod.name)
        obj.name      = f"{name_prefix}_{obj.name}"
        obj.data.name = f"{name_prefix}_{obj.data.name}"


def _get_or_load_image(tex_name):
    """Returns a Blender image data-block, loading from disk if needed."""
    img = bpy.data.images.get(tex_name)
    if img:
        return img
    tex_path = os.path.join(EQUIPMENT_DIR, tex_name)
    if os.path.exists(tex_path):
        return bpy.data.images.load(tex_path)
    print(f"  WARNING: Texture not found on disk: {tex_path}")
    return None


def setup_material(obj, tex_name):
    """
    Assigns the given texture to every material slot on obj.
    If tex_name is None, falls back to FALLBACK_TEXTURE.
    """
    resolved = tex_name or FALLBACK_TEXTURE

    for mat in obj.data.materials:
        if not mat:
            continue
        mat.use_nodes = True
        nodes = mat.node_tree.nodes
        links = mat.node_tree.links

        bsdf = next((n for n in nodes if n.type == 'BSDF_PRINCIPLED'), None)
        if not bsdf:
            continue

        # Check whether a properly-sized texture is already wired in
        has_valid_tex = any(
            n.type == 'TEX_IMAGE' and n.image and n.image.size[0] > 0
            for n in nodes
        )
        if has_valid_tex:
            continue

        img = _get_or_load_image(resolved)
        if not img:
            continue

        tex_node = next((n for n in nodes if n.type == 'TEX_IMAGE'), None)
        if tex_node is None:
            tex_node = nodes.new('ShaderNodeTexImage')
        tex_node.image = img
        links.new(tex_node.outputs['Color'], bsdf.inputs['Base Color'])


def main():
    patch_fbx_importer()
    bpy.ops.wm.read_factory_settings(use_empty=True)

    for fbx, tex, nick in TARGETS:
        path = os.path.join(EQUIPMENT_DIR, fbx)
        if not os.path.exists(path):
            print(f"SKIP: FBX not found: {path}")
            continue

        bpy.ops.import_scene.fbx(filepath=path)
        imported_objs = list(bpy.context.selected_objects)

        optimize_character(imported_objs, nick)

        for obj in imported_objs:
            if obj.type == 'MESH':
                setup_material(obj, tex)

        bpy.ops.object.select_all(action='DESELECT')

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=OUTPUT_PATH)
    print(f"Assets consolidated and saved to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
