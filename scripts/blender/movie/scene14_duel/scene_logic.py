import bpy
import math
import os
import sys

# Ensure assets are importable
ASSETS_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets")
if ASSETS_PATH not in sys.path:
    sys.path.append(ASSETS_PATH)

import plant_humanoid

def setup_scene(master):
    """The Duel Scene for the sequel."""
    frame_start = 4501
    frame_end = 5800

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
            bsdf = mat.node_tree.nodes.get("Principled BSDF")
            if bsdf:
                bsdf.inputs["Emission Strength"].default_value = 0.5
                bsdf.inputs["Emission Strength"].keyframe_insert(data_path="default_value", frame=4650)
                bsdf.inputs["Emission Strength"].default_value = 50.0
                bsdf.inputs["Emission Strength"].keyframe_insert(data_path="default_value", frame=4670)
                bsdf.inputs["Emission Strength"].default_value = 0.5
                bsdf.inputs["Emission Strength"].keyframe_insert(data_path="default_value", frame=4700)

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
