from constants import SCENE_MAP
import bpy

import bpy
import style

def animate_master_scenes(master, scenes):
    """Global animation and scene visibility logic."""
    # Character and Prop Animation
    master._animate_characters()
    master._animate_props()
    master._setup_gaze_system()
    master._setup_camera()

    # Global Effects
    style.apply_thermal_transition(master, 1, 15000,
                                   color_start=(0.4, 0.5, 0.8),
                                   color_end=(0.1, 0.05, 0.2))

    # Character keyword groups for visibility management
    plant_keywords = ["Herbaceous", "Arbor", "Scroll", "Bush", "Eye", "Mouth", "ShoulderPlate", "Pillar", "Flower", "Book", "Pedestal"]
    plants = [obj for obj in bpy.context.scene.objects if any(k in obj.name for k in plant_keywords) and "GloomGnome" not in obj.name]
    master._set_visibility(plants, [(401, 14500)])

    gnome_keywords = ["GloomGnome", "Staff", "GloomOrb", "Cloak"]
    gnomes = [obj for obj in bpy.context.scene.objects if any(k in obj.name for k in gnome_keywords)]
    g_ranges = [(1801, 2800), (4501, 5800), (10901, 14500)]
    master._set_visibility(gnomes, g_ranges)

    # Scientific Assets visibility
    if master.brain:
        master._set_visibility([master.brain], [(201, 400), (3501, 3800), (4101, 4500)])
    if master.neuron:
        master._set_visibility([master.neuron], [(1601, 1800), (3001, 3500)])

    # Setup individual scenes
    for scene_mod in scenes:
        if scene_mod and hasattr(scene_mod, "setup_scene"):
            scene_mod.setup_scene(master)
