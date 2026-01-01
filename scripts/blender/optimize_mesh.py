
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

        print(f"Optimizing mesh: {obj.name.encode('utf-8', errors='replace').decode('utf-8')}")
        
        # Ensure object is active and selected for operators
        context.view_layer.objects.active = obj
        obj.select_set(True)

        # 1. Add Modifiers
        ratio = self.config.get('decimate_ratio', 0.5)
        if ratio < 1.0:
            obj.modifiers.new(name="AutoDecimate", type='DECIMATE')
            obj.modifiers["AutoDecimate"].ratio = ratio

        if self.config.get('triangulate', True):
            obj.modifiers.new(name="Triangulate", type='TRIANGULATE')
            
        # 2. Apply all modifiers in order
        for mod in list(obj.modifiers):
            try:
                context.view_layer.objects.active = obj
                bpy.ops.object.modifier_apply(modifier=mod.name)
                print(f" - Applied a modifier")
            except Exception as e:
                print(f" - Warning: Could not apply a modifier to {obj.name.encode('utf-8', errors='replace').decode('utf-8')}: {e}")
                obj.modifiers.remove(mod) # Clean up failed modifier

        # 3. Cleanup & Normalization
        try:
            context.view_layer.objects.active = obj
            bpy.ops.object.mode_set(mode='EDIT')
            bpy.ops.mesh.select_all(action='SELECT')
            bpy.ops.mesh.normals_make_consistent(inside=False)
            bpy.ops.object.mode_set(mode='OBJECT')
            print(" - Normals recalculated.")
        except Exception as e:
            print(f" - Warning: Normals/Mode manipulation failed for {obj.name}: {e}")
            if context.object.mode != 'OBJECT':
                bpy.ops.object.mode_set(mode='OBJECT')

    def post_process(self, context):
        # Remove unused mesh data
        for mesh in bpy.data.meshes:
            if mesh.users == 0:
                bpy.data.meshes.remove(mesh)
