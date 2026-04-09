import bpy
import os
import sys
from .render_profiles_v6 import apply_render_profile_v6

class BaseMasterV6:
    """Version 6 Master Pipeline with scale-culling and slotted action support."""
    def __init__(self, total_frames=15000, quality='test', output_dir=None):
        self.total_frames = total_frames
        self.quality = quality
        self.output_dir = output_dir
        self.scene = None

    def setup_engine_v6(self):
        scene = bpy.context.scene
        scene.frame_start = 1
        scene.frame_end = self.total_frames

        apply_render_profile_v6(scene, self.quality)

        scene.render.resolution_x = 1920
        scene.render.resolution_y = 1080
        if self.output_dir:
            scene.render.filepath = os.path.join(self.output_dir, "#####")

        self.scene = scene
        return scene

    def set_visibility_v6(self, objs, ranges):
        """Version 6 visibility with scale-culling to prevent Z-drift."""
        for obj in objs:
            # Default state: hidden and scaled to zero
            obj.hide_render = True
            obj.scale = (0, 0, 0)
            obj.keyframe_insert(data_path="hide_render", frame=1)
            for i in range(3): obj.keyframe_insert(data_path="scale", index=i, frame=1)

            for rs, re in ranges:
                # Show
                obj.hide_render = False
                obj.scale = (1, 1, 1)
                obj.keyframe_insert(data_path="hide_render", frame=rs)
                for i in range(3): obj.keyframe_insert(data_path="scale", index=i, frame=rs)

                # Hide
                obj.hide_render = True
                obj.scale = (0, 0, 0)
                obj.keyframe_insert(data_path="hide_render", frame=re)
                for i in range(3): obj.keyframe_insert(data_path="scale", index=i, frame=re)
