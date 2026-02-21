import bpy
import style
import math
from constants import SCENE_MAP

def orchestrate_scenes(master_instance):
    """Coordinates global scene-specific events and transitions."""
    scene = master_instance.scene

    # Enhancement #74: Markers
    style.add_scene_markers(master_instance)

    # Enhancement #48: Parallel Editing Markers (specific logic beats)
    # We add markers for the 'intercuts' between brain and characters
    if 'scene05_bridge' in SCENE_MAP:
        start, end = SCENE_MAP['scene05_bridge']
        scene.timeline_markers.new("Intercut_Brain", frame=start + 50)
        scene.timeline_markers.new("Intercut_Face", frame=start + 100)

    # Enhancement #71: Sound Design Cues
    add_sound_design_cues(master_instance)

    # Enhancement #42: Foreshadowing Shadow
    # In scene 07, we want a shadow of the gnome to appear before him
    if 'scene07_shadow' in SCENE_MAP:
        start, end = SCENE_MAP['scene07_shadow']
        setup_foreshadowing_shadow(master_instance, start, start + 100)

    # Enhancement #44: Reacting Props
    # Flowers droop during shadow scene, bloom during finale
    if 'scene07_shadow' in SCENE_MAP:
        start, end = SCENE_MAP['scene07_shadow']
        animate_flower_reaction(master_instance, start, end, mode='DROOP')

    if 'scene22_retreat' in SCENE_MAP:
        start, end = SCENE_MAP['scene22_retreat']
        animate_flower_reaction(master_instance, start, end, mode='BLOOM')

    # Enhancement #88: Bioluminescent Veins
    chars = [master_instance.h1, master_instance.h2, master_instance.gnome]
    style.apply_bioluminescent_veins([c for c in chars if c], 1, 15000)

    # Enhancement #83: Distance Based Glow
    if master_instance.gnome:
        style.animate_distance_based_glow(master_instance.gnome, [master_instance.h1, master_instance.h2], 1, 15000)

    # Enhancement #54: Volumetric Fog Cues
    # Dense fog during shadow scene, clearing for sanctuary
    if 'scene07_shadow' in SCENE_MAP:
        start, end = SCENE_MAP['scene07_shadow']
        style.animate_mood_fog(scene, start, density=0.05)
    if 'scene09_climbing' in SCENE_MAP:
        start, end = SCENE_MAP['scene09_climbing']
        style.animate_mood_fog(scene, start, density=0.01)

    # Enhancement #60: Wet Glass Refraction
    # Heavy refraction during the rain scenes
    import compositor_settings
    compositor_settings.animate_wet_glass(scene, 1801, 2500, strength=15.0)
    compositor_settings.animate_wet_glass(scene, 13701, 14200, strength=30.0) # Heavier in storm

def add_sound_design_cues(master):
    """Enhancement #71: Adds markers for sound design synchronization."""
    scene = master.scene
    # Music Cues
    if 'scene01_intro' in SCENE_MAP:
        scene.timeline_markers.new("MUS_Intro_Theme", frame=SCENE_MAP['scene01_intro'][0])
    if 'scene07_shadow' in SCENE_MAP:
        scene.timeline_markers.new("MUS_Tension_Rise", frame=SCENE_MAP['scene07_shadow'][0])
    if 'scene22_retreat' in SCENE_MAP:
        scene.timeline_markers.new("MUS_Triumphant", frame=SCENE_MAP['scene22_retreat'][0])

    # SFX Cues
    # Footsteps during gait
    for start, end in [(401, 1500), (13701, 14500)]:
        for f in range(start, end, 32): # Every step
            scene.timeline_markers.new("SFX_Footstep", frame=f)

    # Wind/Rain
    if 'scene07_shadow' in SCENE_MAP:
        scene.timeline_markers.new("SFX_Rain_Start", frame=SCENE_MAP['scene07_shadow'][0])

    # Thunder/Lightning
    lightning_frames = [13800, 13950, 14100]
    for f in lightning_frames:
        scene.timeline_markers.new("SFX_Thunder", frame=f)

def setup_foreshadowing_shadow(master, frame_start, frame_end):
    """Enhancement #42: Creates a dramatic shadow before the character enters."""
    if not master.gnome: return
    # We move the gnome (hidden) to a position where his shadow is cast on the floor
    # but he is not in the camera view
    master.gnome.location = (10, 5, 0) # Off-center
    master.gnome.keyframe_insert(data_path="location", frame=frame_start)

    # Rotate toward the light
    master.gnome.rotation_euler[2] = math.radians(45)
    master.gnome.keyframe_insert(data_path="rotation_euler", index=2, frame=frame_start)

def animate_flower_reaction(master, frame_start, frame_end, mode='DROOP'):
    """Enhancement #44: Props react to the narrative mood."""
    # Find all flowers in the scene
    flowers = [obj for obj in bpy.context.scene.objects if "Flower" in obj.name and obj.type == 'MESH']
    for flower in flowers:
        if mode == 'DROOP':
            flower.rotation_euler[0] = 0
            flower.keyframe_insert(data_path="rotation_euler", index=0, frame=frame_start)
            flower.rotation_euler[0] = math.radians(45)
            flower.keyframe_insert(data_path="rotation_euler", index=0, frame=frame_start + 48)
        else: # BLOOM
            flower.scale = (0.5, 0.5, 0.5)
            flower.keyframe_insert(data_path="scale", frame=frame_start)
            flower.scale = (1.2, 1.2, 1.2)
            flower.keyframe_insert(data_path="scale", frame=frame_start + 48)
            flower.scale = (1.0, 1.0, 1.0)
            flower.keyframe_insert(data_path="scale", frame=frame_start + 60)
