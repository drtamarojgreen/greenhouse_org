import bpy
import os
import sys
import site
import style
from constants import QUALITY_PRESETS

def ensure_dependencies():
    """Point 6: Centralized dependency management."""
    paths = site.getsitepackages()
    if hasattr(site, 'getusersitepackages'):
        paths.append(site.getusersitepackages())

    for p in paths:
        if os.path.exists(p) and p not in sys.path:
            sys.path.append(p)

    # Add movie root and assets to path for local imports
    movie_root = os.path.dirname(os.path.abspath(__file__))
    assets_root = os.path.join(movie_root, "assets")
    for p in [movie_root, assets_root]:
        if p not in sys.path:
            sys.path.append(p)

def setup_blender_engine(master):
    """Standard engine setup with quality presets and color management."""
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end = master.total_frames
    scene.render.fps = 24

    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720

    # Point 62: Default render output
    scene.render.filepath = f"//renders/{'sequel' if master.total_frames == 6000 else 'full_movie'}/"

    # Point 61: Color Management
    scene.display_settings.display_device = 'sRGB'
    if hasattr(scene.view_settings, "view_transform"):
        scene.view_settings.view_transform = 'Filmic'

    # Point 65: Motion Blur
    scene.render.use_motion_blur = True

    if master.mode == 'SILENT_FILM':
        scene.render.engine = 'CYCLES'

        # Point 66: GPU device selection
        try:
            prefs = bpy.context.preferences.addons['cycles'].preferences
            prefs.compute_device_type = master.device_type
            prefs.get_devices()
            for device in prefs.devices:
                if device.type == master.device_type:
                    device.use = True
        except Exception:
            pass

        scene.cycles.device = 'GPU'

        # Point 30 & 67: Quality settings
        q = QUALITY_PRESETS.get(master.quality, QUALITY_PRESETS['test'])
        scene.cycles.samples = q['samples']
        scene.cycles.use_denoising = q['denoising']
        if hasattr(scene.cycles, "denoiser"):
            scene.cycles.denoiser = 'OPENIMAGEDENOISE'

        scene.world.use_nodes = True
        bg = scene.world.node_tree.nodes.get("Background")
        if bg: bg.inputs[0].default_value = (0, 0, 0, 1)
    else:
        scene.render.engine = style.get_eevee_engine_id()
        scene.world.use_nodes = True
        bg = scene.world.node_tree.nodes.get("Background")
        if bg: bg.inputs[0].default_value = (0.05, 0.05, 0.1, 1)

    master.scene = scene
    return scene
