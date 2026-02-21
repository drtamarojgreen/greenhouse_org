import bpy
import style_utilities as style

def setup_scene(master):
    """Brain Focus Scene Logic."""
    if not master.brain: return

    # Point 42: Dedicated brain animation logic
    # Point 142: Enhanced framing with Z-lift to avoid flat origin feel
    target = bpy.data.objects.get("CamTarget")
    if target:
        # Lift target to center of brain
        target.location = (0, 0, 2.5)
        target.keyframe_insert(data_path="location", frame=201)
        target.location = (0, 0, 3.0) # Slow drift up
        target.keyframe_insert(data_path="location", frame=400)

    # Brain Pulsing
    style.animate_pulsing_emission(master.brain, 201, 400, base_strength=1.0, pulse_amplitude=5.0, cycle=48)
