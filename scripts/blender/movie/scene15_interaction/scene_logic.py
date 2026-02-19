import bpy
import math
import random
import os
import sys
import mathutils

# Ensure assets are importable
MOVIE_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS_PATH = os.path.join(MOVIE_ROOT, "assets")
if ASSETS_PATH not in sys.path:
    sys.path.append(ASSETS_PATH)

from assets import plant_humanoid
import style

def setup_scene(master):
    """
    5000 frames of protagonist interaction.
    Shot ID: S15
    Intent: Emotional resonance through complex character interaction.
    """
    # MUSIC CUE: Melancholy cello theme.
    # Frame range: 4501 - 9500
    start_frame = 4501
    end_frame = 9500

    if not master.h1 or not master.h2:
        return

    # Phase 1: Walking and Talking (4501 - 6000)
    plant_humanoid.animate_walk(master.h1, 4501, 6000, step_height=0.1, cycle_length=48)
    plant_humanoid.animate_walk(master.h2, 4501, 6000, step_height=0.05, cycle_length=64)

    # Movement across stage
    master.h1.location.x = -5
    master.h1.keyframe_insert(data_path="location", index=0, frame=4501)
    master.h1.location.x = 0
    master.h1.keyframe_insert(data_path="location", index=0, frame=6000)

    master.h2.location.x = -7
    master.h2.keyframe_insert(data_path="location", index=0, frame=4501)
    master.h2.location.x = -2
    master.h2.keyframe_insert(data_path="location", index=0, frame=6000)

    # Dialogue
    plant_humanoid.animate_talk(master.h1, 4600, 5000)
    plant_humanoid.animate_talk(master.h2, 5100, 5500)
    plant_humanoid.animate_talk(master.h1, 5600, 5900)

    # Phase 2: Close-up Interaction & Expressions (6001 - 7500)
    # Stop walking
    master.h1.keyframe_insert(data_path="location", frame=6001)
    master.h2.keyframe_insert(data_path="location", frame=6001)

    # Facial Expressions
    plant_humanoid.animate_expression(master.h1, 6200, 'SURPRISED')
    # Point 39: Listener reaction
    style.animate_reaction_shot("Arbor", 6200, 6500)

    plant_humanoid.animate_expression(master.h1, 6500, 'NEUTRAL')

    plant_humanoid.animate_expression(master.h2, 6800, 'ANGRY') # Playful debate
    # Point 39: Listener reaction
    style.animate_reaction_shot("Herbaceous", 6800, 7200)

    plant_humanoid.animate_expression(master.h2, 7200, 'NEUTRAL')

    # Limb movements (Gestures)
    # Herbaceous waves staff
    staff = bpy.data.objects.get("Herbaceous_ReasonStaff")
    if staff:
        staff.rotation_euler.x = 0
        staff.keyframe_insert(data_path="rotation_euler", index=0, frame=6200)
        staff.rotation_euler.x = math.radians(45)
        staff.keyframe_insert(data_path="rotation_euler", index=0, frame=6300)
        staff.rotation_euler.x = 0
        staff.keyframe_insert(data_path="rotation_euler", index=0, frame=6400)

    # Arbor taps fingers
    fingers = [c for c in master.h2.children if "Finger" in c.name or "Vine" in c.name]
    if fingers:
        style.animate_finger_tapping(fingers, 6500, 7500)
        # Point 82: Grasp/Curl
        style.animate_finger_curl(fingers, 7000, 7100)

    # Phase 3: Emotional Resonance (7501 - 9000)
    # Both characters breathing and subtle movements
    style.animate_breathing(master.h1, 7501, 9000, amplitude=0.04)
    style.animate_breathing(master.h2, 7501, 9000, amplitude=0.02)
    style.animate_shoulder_shrug(master.h1, 7800, 8000)
    style.animate_shoulder_shrug(master.h2, 8200, 8400)

    # Looking at each other
    gaze = bpy.data.objects.get("GazeTarget")
    if gaze:
        # We don't want to parent here if it's already parented or needs world coords
        # But setup_camera_keyframes will handle camera.
        gaze.location = master.h2.location + mathutils.Vector((0, 0, 1.5))
        gaze.keyframe_insert(data_path="location", frame=7501)
        gaze.location = master.h1.location + mathutils.Vector((0, 0, 1.5))
        gaze.keyframe_insert(data_path="location", frame=8200)

    # Phase 4: Final Bloom & Transition (9001 - 9500)
    # Flourish of movement
    master.h1.rotation_euler.z = math.radians(30)
    master.h1.keyframe_insert(data_path="rotation_euler", index=2, frame=9001)
    master.h1.rotation_euler.z = 0
    master.h1.keyframe_insert(data_path="rotation_euler", index=2, frame=9500)

    # Note: Camera is handled by master.setup_camera_keyframes
