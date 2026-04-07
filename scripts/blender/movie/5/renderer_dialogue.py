"""
Renderer Dialogue Module
Dedicated renderer for Scene 3 output settings and render invocation.
"""

try:
    import bpy
except ImportError:
    bpy = None

import os
try:
    from . import config
    from . import render_presets
except (ImportError, ValueError):
    import config
    import render_presets

class Scene3Renderer:
    def __init__(self, output_dir=None):
        self.output_dir = output_dir or config.OUTPUT_BASE_DIR

    def _enable_gpu_acceleration(self):
        """Auto-detects and enables CUDA/OptiX GPU acceleration if available."""
        if not bpy: return
        
        cycles_prefs = bpy.context.preferences.addons['cycles'].preferences
        cuda_devices, optix_devices = [], []
        
        for device_type in ('CUDA', 'OPTIX'):
            cycles_prefs.get_devices_for_type(device_type)
            for device in cycles_prefs.devices:
                if device.type == 'CUDA': cuda_devices.append(device)
                elif device.type == 'OPTIX': optix_devices.append(device)
        
        if optix_devices:
            cycles_prefs.compute_device_type = 'OPTIX'
            for dev in optix_devices: dev.use = True
            print("GPU: Enabled OPTIX acceleration")
        elif cuda_devices:
            cycles_prefs.compute_device_type = 'CUDA'
            for dev in cuda_devices: dev.use = True
            print("GPU: Enabled CUDA acceleration")
        else:
            print("GPU: No CUDA/OPTIX devices found, defaulting to CPU")

    def _apply_preset(self, preset_name):
        settings = render_presets.GET_PRESET(preset_name)
        scene = bpy.context.scene
        
        # Engine selection
        scene.render.engine = settings.get("engine", "CYCLES")
        
        if scene.render.engine == 'CYCLES':
            self._enable_gpu_acceleration()
            scene.cycles.device = 'GPU'
            scene.cycles.samples = settings.get("samples", 128)
            scene.cycles.use_adaptive_sampling = True
            # Speed optimizations: Reduce light bounces
            scene.cycles.max_bounces = 4
            scene.cycles.diffuse_bounces = 1
            scene.cycles.glossy_bounces = 1
            scene.cycles.transparent_max_bounces = 4
        
        scene.render.use_motion_blur = settings.get("motion_blur", True)
        scene.render.image_settings.file_format = settings.get("format", "PNG")
        scene.render.image_settings.color_mode = settings.get("color_mode", "RGB")

    def render_preview(self, scene_name="Scene"):
        self._apply_preset("preview")
        bpy.context.scene.render.filepath = os.path.join(config.OUTPUT_PREVIEW_DIR, "frame_")
        bpy.ops.render.render(animation=True, write_still=True)

    def render_review(self, scene_name="Scene"):
        self._apply_preset("review")
        bpy.context.scene.render.filepath = os.path.join(config.OUTPUT_REVIEW_DIR, "frame_")
        print(f"Rendering review animation to: {bpy.context.scene.render.filepath}")
        bpy.ops.render.render(animation=True, write_still=True)

    def render_final(self, scene_name="Scene"):
        self._apply_preset("final")
        bpy.context.scene.render.filepath = os.path.join(config.OUTPUT_FINAL_DIR, "frame_")
        bpy.ops.render.render(animation=True, write_still=True)

def render_scene3_dialogue(mode="preview"):
    renderer = Scene3Renderer()
    if mode == "preview":
        renderer.render_preview()
    elif mode == "review":
        renderer.render_review()
    elif mode == "final":
        renderer.render_final()
