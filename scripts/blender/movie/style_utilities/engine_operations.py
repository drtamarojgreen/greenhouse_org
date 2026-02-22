"""
Engine and render operations for Greenhouse Movie Production.
"""
import bpy

def get_eevee_engine_id():
    """Probes Blender for the correct Eevee engine identifier."""
    try:
        for engine in ['BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE']:
            if engine in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items:
                return engine
    except Exception: pass
    return 'BLENDER_EEVEE'

def patch_fbx_importer():
    """Patches the Blender 5.0 FBX importer."""
    try:
        import sys
        fbx_module = sys.modules.get('io_scene_fbx')
        if not fbx_module:
            try: import io_scene_fbx; fbx_module = io_scene_fbx
            except ImportError: pass
        if fbx_module and hasattr(fbx_module, 'ImportFBX'):
            ImportFBX = fbx_module.ImportFBX
            if not getattr(ImportFBX, '_is_patched', False):
                original_execute = ImportFBX.execute
                def patched_execute(self, context):
                    if not hasattr(self, 'files'): self.files = []
                    return original_execute(self, context)
                ImportFBX.execute = patched_execute; ImportFBX._is_patched = True
                return True
    except: pass
    return False

def set_blend_method(mat, method='BLEND'):
    """Version-safe transparency method setter."""
    if hasattr(mat, 'surface_render_method'):
        if bpy.app.version >= (4, 2, 0): mat.surface_render_method = 'BLENDED'
        else: mat.blend_method = method
    else: mat.blend_method = method

def clear_scene_selective():
    """Clear objects/data without a full session reset."""
    bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete()
    for block in (bpy.data.meshes, bpy.data.materials, bpy.data.actions, bpy.data.curves, bpy.data.armatures, bpy.data.node_groups):
        for item in block:
            if item.users == 0: block.remove(item)
