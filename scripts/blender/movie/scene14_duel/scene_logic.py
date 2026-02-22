import bpy
import math
import os
import sys
import style_utilities as style

# Ensure assets are importable
ASSETS_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets")
if ASSETS_PATH not in sys.path:
    sys.path.append(ASSETS_PATH)

from assets import plant_humanoid

def setup_scene(master):
    """
    The Duel Scene for the sequel.
    Shot ID: S14
    Intent: Action sequence demonstrating conflict.
    """
    # MUSIC CUE: High-tempo, aggressive brass and percussion.
    # Point 142: Correct frame range (4101 - 4500)
    from constants import SCENE_MAP
    frame_start, frame_end = SCENE_MAP['scene14_duel']

    # Plants vs Gnome Duel logic
    if master.h1 and master.gnome:
        # Herbaceous (Plant) attacks
        plant_humanoid.animate_expression(master.h1, 4600, 'ANGRY')
        master.h1.rotation_euler.y = 0
        master.h1.keyframe_insert(data_path="rotation_euler", index=1, frame=4600)
        master.h1.rotation_euler.y = math.radians(-30)
        master.h1.keyframe_insert(data_path="rotation_euler", index=1, frame=4610)
        master.h1.rotation_euler.y = 0
        master.h1.keyframe_insert(data_path="rotation_euler", index=1, frame=4630)

        # Point 50: Recoil from flare
        master.h1.rotation_euler[0] = 0
        master.h1.keyframe_insert(data_path="rotation_euler", index=0, frame=4660)
        master.h1.rotation_euler[0] = math.radians(-45)
        master.h1.keyframe_insert(data_path="rotation_euler", index=0, frame=4680)
        master.h1.rotation_euler[0] = 0
        master.h1.keyframe_insert(data_path="rotation_euler", index=0, frame=4720)

        # Staff strike
        staff = bpy.data.objects.get("Herbaceous_ReasonStaff")
        if staff:
            staff.rotation_euler.x = 0
            staff.keyframe_insert(data_path="rotation_euler", index=0, frame=4600)
            staff.rotation_euler.x = math.radians(120)
            staff.keyframe_insert(data_path="rotation_euler", index=0, frame=4615)
            staff.rotation_euler.x = 0
            staff.keyframe_insert(data_path="rotation_euler", index=0, frame=4640)

    if master.gnome:
        # Gnome dodge and counter
        master.gnome.rotation_euler.z = math.radians(180) # Face plants
        master.gnome.keyframe_insert(data_path="rotation_euler", index=2, frame=4501)

        master.gnome.location.y = 5
        master.gnome.keyframe_insert(data_path="location", index=1, frame=4600)
        master.gnome.location.y = 8
        master.gnome.keyframe_insert(data_path="location", index=1, frame=4615) # Dodge

        # Glow orb flare
        orb = bpy.data.objects.get("GloomGnome_GloomOrb")
        if orb and orb.material_slots:
            mat = orb.material_slots[0].material
            style.set_principled_socket(mat, "Emission Strength", 0.5, frame=4650)
            style.set_principled_socket(mat, "Emission Strength", 50.0, frame=4670)
            style.set_principled_socket(mat, "Emission Strength", 0.5, frame=4700)

    # Duel zoom
    cam = master.scene.camera
    target = bpy.data.objects.get("CamTarget")
    if cam and target:
        # Tense close up during gnome flare
        cam.keyframe_insert(data_path="location", frame=4640)
        target.keyframe_insert(data_path="location", frame=4640)

        cam.location = (4, 4, 1.5)
        target.location = (6, 6, 1)
        cam.keyframe_insert(data_path="location", frame=4670)
        target.keyframe_insert(data_path="location", frame=4670)

        cam.location = (0, -15, 5)
        target.location = (0, 0, 1.5)
        cam.keyframe_insert(data_path="location", frame=4800)
        target.keyframe_insert(data_path="location", frame=4800)
