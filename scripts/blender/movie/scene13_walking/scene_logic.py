import bpy
import math
import os
import sys
import random

# Ensure assets are importable
ASSETS_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets")
if ASSETS_PATH not in sys.path:
    sys.path.append(ASSETS_PATH)

from assets import plant_humanoid

def setup_scene(master):
    """
    The Walking Scene for the sequel.
    Shot ID: S13
    Intent: Demonstrate movement and character interaction in motion.
    """
    # MUSIC CUE: Plucky, rhythmic strings.
    frame_start = 501
    frame_end = 1500

    # Animate Herbaceous walking
    if master.h1:
        plant_humanoid.animate_walk(master.h1, frame_start, frame_end)
        # Move forward
        master.h1.location.x = -5
        master.h1.keyframe_insert(data_path="location", index=0, frame=frame_start)
        master.h1.location.x = 5
        master.h1.keyframe_insert(data_path="location", index=0, frame=frame_end)

        # Talk while walking
        plant_humanoid.animate_talk(master.h1, frame_start + 200, frame_start + 600)

        # Look around while walking
        for f in range(frame_start, frame_end, 100):
            master.h1.rotation_euler.z = math.radians(random.uniform(-20, 20))
            master.h1.keyframe_insert(data_path="rotation_euler", index=2, frame=f)

        # Expression change
        plant_humanoid.animate_expression(master.h1, frame_start + 150, 'SURPRISED')
        plant_humanoid.animate_expression(master.h1, frame_start + 400, 'NEUTRAL')

    # Zoom in on Herbaceous face during talk
    cam = master.scene.camera
    target = bpy.data.objects.get("CamTarget")
    if cam and target:
        cam.keyframe_insert(data_path="location", frame=frame_start + 150)
        target.keyframe_insert(data_path="location", frame=frame_start + 150)

        # Closer shot
        cam.location = (-1, -8, 2.5)
        target.location = (-1, 0, 2)
        cam.keyframe_insert(data_path="location", frame=frame_start + 300)
        target.keyframe_insert(data_path="location", frame=frame_start + 300)

        # Return
        cam.location = (0, -15, 5)
        target.location = (0, 0, 1.5)
        cam.keyframe_insert(data_path="location", frame=frame_start + 500)
        target.keyframe_insert(data_path="location", frame=frame_start + 500)

    # Animate Arbor walking following
    if master.h2:
        plant_humanoid.animate_walk(master.h2, frame_start + 100, frame_end + 100)
        master.h2.location.x = -8
        master.h2.keyframe_insert(data_path="location", index=0, frame=frame_start)
        master.h2.location.x = 2
        master.h2.keyframe_insert(data_path="location", index=0, frame=frame_end)
