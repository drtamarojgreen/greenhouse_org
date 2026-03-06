import bpy
import style_utilities as style

def setup_scene(master):
    """Brain Focus Scene Logic."""
    if not master.brain: return

    # Move brain forward (negative Y) so it floats in front of the greenhouse wall
    master.brain.location = (0, -3, 2.0)
    master.brain.keyframe_insert(data_path="location", frame=201)

    # Enhanced framing: lift camera target to center of brain
    target = bpy.data.objects.get("CamTarget")
    if target:
        target.location = (0, -3, 4.0)
        target.keyframe_insert(data_path="location", frame=201)
        target.location = (0, -3, 4.5)  # Slow drift up
        target.keyframe_insert(data_path="location", frame=400)

    # Brain Pulsing
    style.animate_pulsing_emission(master.brain, 201, 400, base_strength=1.0, pulse_amplitude=5.0, cycle=48)
