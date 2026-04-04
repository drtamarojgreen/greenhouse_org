import bpy
import os
import math
import mathutils
import random
import constants

class VaultMaster:
    """
    Verdant Pulse (v2.0) Core Engine.
    CLEAN SLATE: 100% Zero-Dependency from v1.
    """
    def __init__(self, quality='TEST'):
        self.quality = quality
        self.scene = None
        self.camera = None
        self.liana = None
        self.seedling = None
        self.vault = None

    def initialize_system(self, draft=False):
        """
        Setup Rendering Engine.
        Draft Mode uses EEVEE-Next for Near-Instant results.
        """
        bpy.ops.wm.read_homefile(use_empty=True)
        self.scene = bpy.context.scene
        self.scene.frame_start = 1
        self.scene.frame_end = constants.TOTAL_FRAMES
        
        # High-Fidelity Production Standards
        self.scene.render.resolution_x = 1920
        self.scene.render.resolution_y = 1080
        self.scene.render.resolution_percentage = 50 if draft else 100
        
        self.scene.render.filepath = "//renders/v2/#####"
        
        if draft:
            # High-Speed Draft Path (EEVEE)
            self.scene.render.engine = 'BLENDER_EEVEE_NEXT'
            self.scene.eevee.taa_render_samples = 16
            self.scene.view_settings.view_transform = 'Standard'
        else:
            # Professional Production Path (Cycles)
            self.scene.render.engine = 'CYCLES'
            self.scene.cycles.samples = 128
            self.scene.cycles.use_denoising = True
            self.scene.cycles.denoiser = 'OPENIMAGEDENOISE'
            self.scene.view_settings.view_transform = 'AgX'

    def setup_camera_rig(self):
        """Create a Rail-Track Camera System to ensure 100% framing safety."""
        bpy.ops.object.camera_add(location=(0, -15, 6))
        self.camera = bpy.context.object
        self.camera.name = "VaultCamera"
        self.scene.camera = self.camera
        
        # Add a Focus Target
        bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0, 0, 1))
        self.cam_target = bpy.context.object
        self.cam_target.name = "CamFocus"
        
        # Track-To Constraint
        tt = self.camera.constraints.new('TRACK_TO')
        tt.target = self.cam_target
        tt.track_axis = 'TRACK_NEGATIVE_Z'
        tt.up_axis = 'UP_Y'

    def apply_visibility_transition(self, obj, frame_start, frame_end):
        """
        Visibility 2.0: Clean Slate.
        No Z-shifting. Uses only hide_render and scale-culling.
        """
        if not obj: return
        
        # Initially Hidden
        obj.hide_render = True
        obj.hide_viewport = True
        obj.keyframe_insert(data_path="hide_render", frame=frame_start - 1)
        obj.scale = (0, 0, 0)
        obj.keyframe_insert(data_path="scale", frame=frame_start - 1)
        
        # Visible
        obj.hide_render = False
        obj.hide_viewport = False
        obj.keyframe_insert(data_path="hide_render", frame=frame_start)
        obj.scale = (1, 1, 1)
        obj.keyframe_insert(data_path="scale", frame=frame_start)
        
        # Hidden Again
        obj.hide_render = True
        obj.hide_viewport = True
        obj.keyframe_insert(data_path="hide_render", frame=frame_end)
        obj.scale = (0, 0, 0)
        obj.keyframe_insert(data_path="scale", frame=frame_end)

    def run(self, scenes):
        self.initialize_system()
        self.setup_camera_rig()
        # To be extended by scene orchestration
        print("Vault Engine v2.0 Initialized.")

if __name__ == "__main__":
    vm = VaultMaster()
    vm.run([])
