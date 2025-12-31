
import bpy
try:
    from optimizer_base import BaseOptimizer
except ImportError:
    # Handle direct execution or different pathing
    import sys
    import os
    sys.path.append(os.path.dirname(__file__))
    from optimizer_base import BaseOptimizer

class MeshOptimizer(BaseOptimizer):
    """
    Optimizes mesh objects by decimating geometry and normalizing properties.
    """
    def process(self, context, obj):
        if obj.type != 'MESH':
            return

        print(f"Optimizing mesh: {obj.name}")
        
        # Ensure object is active and selected for operators
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)

        # 1. Decimate
        ratio = self.config.get('decimate_ratio', 0.5)
        if ratio < 1.0:
            mod = obj.modifiers.new(name="AutoDecimate", type='DECIMATE')
            mod.ratio = ratio
            # Apply the modifier
            try:
                bpy.ops.object.modifier_apply(modifier=mod.name)
                print(f" - Decimated with ratio: {ratio}")
            except Exception as e:
                print(f" - Warning: Could not apply decimate to {obj.name}: {e}")

        # 2. Cleanup & Normalization
        try:
            # Fix normals
            bpy.ops.object.mode_set(mode='EDIT')
            bpy.ops.mesh.select_all(action='SELECT')
            bpy.ops.mesh.normals_make_consistent(inside=False)
            bpy.ops.object.mode_set(mode='OBJECT')
            print(" - Normals recalculated.")
        except Exception as e:
            print(f" - Warning: Normals/Mode manipulation failed for {obj.name}: {e}")
            if obj.mode != 'OBJECT':
                bpy.ops.object.mode_set(mode='OBJECT')
        
        # Triangulate
        if self.config.get('triangulate', True):
            try:
                tri_mod = obj.modifiers.new(name="Triangulate", type='TRIANGULATE')
                bpy.ops.object.modifier_apply(modifier=tri_mod.name)
                print(" - Mesh triangulated.")
            except Exception as e:
                print(f" - Warning: Triangulation failed for {obj.name}: {e}")

    def post_process(self, context):
        # Remove unused mesh data
        for mesh in bpy.data.meshes:
            if mesh.users == 0:
                bpy.data.meshes.remove(mesh)
