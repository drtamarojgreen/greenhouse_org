
import bpy
import os
try:
    from optimizer_base import BaseOptimizer
except ImportError:
    import sys
    import os
    sys.path.append(os.path.dirname(__file__))
    from optimizer_base import BaseOptimizer

class TextureOptimizer(BaseOptimizer):
    """
    Optimizes textures by scaling resolutions and managing data blocks.
    """
    def process(self, context, obj):
        if not obj.data or not hasattr(obj.data, "materials"):
            return

        max_res = self.config.get('max_texture_res', 1024)
        
        for mat in obj.data.materials:
            if not mat or not mat.use_nodes:
                continue
            
            for node in mat.node_tree.nodes:
                if node.type == 'TEX_IMAGE' and node.image:
                    img = node.image
                    # Optimization: Resize if larger than max_res
                    width, height = img.size
                    if width > max_res or height > max_res:
                        print(f" - Resizing texture '{img.name}' from {width}x{height} to {max_res} max.")
                        # This works for internal packed images; external files 
                        # would need PIL/OpenCV or Blender's scale logic.
                        img.scale(min(width, max_res), min(height, max_res))
    
    def post_process(self, context):
        # Remove unused images
        for img in bpy.data.images:
            if img.users == 0:
                bpy.data.images.remove(img)
