import bpy
import style

def setup_all_scenes(master, scene_modules):
    """Orchestrates scene animation and global effects."""
    # Character and Prop Animation
    master._animate_characters()
    master._animate_props()
    master._setup_gaze_system()
    master._setup_camera()

    # Global Effects
    style.apply_thermal_transition(master, 1, 15000,
                                   color_start=(0.4, 0.5, 0.8),
                                   color_end=(0.1, 0.05, 0.2))

    # Scene-Specific Logic Dispatch
    for s in scene_modules:
        if s:
            s.setup_scene(master)
