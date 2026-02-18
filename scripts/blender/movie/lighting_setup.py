import bpy
import math
import style
from constants import SCENE_MAP

def setup_lighting(master):
    """Extended lighting with character spots and area fills."""
    # Common base lighting from master if it had one,
    # but we'll implement it here for better control.

    # Sun
    bpy.ops.object.light_add(type='SUN', location=(10, -10, 20))
    master.sun = bpy.context.object
    master.sun.name = "Sun"
    master.sun.data.energy = 5.0

    # Fill
    bpy.ops.object.light_add(type='POINT', location=(-10, -10, 10))
    master.fill = bpy.context.object
    master.fill.name = "FillLight"
    master.fill.data.energy = 2000

    # Rim
    bpy.ops.object.light_add(type='AREA', location=(0, 15, 5))
    master.rim = bpy.context.object
    master.rim.name = "RimLight"
    master.rim.data.energy = 5000

    # Spot
    bpy.ops.object.light_add(type='SPOT', location=(0, -15, 10))
    master.spot = bpy.context.object
    master.spot.name = "Spot"
    master.spot.data.energy = 10000

    # Volumetric light shaft (Sun Beam)
    bpy.ops.object.light_add(type='SPOT', location=(0, 10, 15))
    master.beam = bpy.context.object
    master.beam.name = "LightShaftBeam"
    master.beam.data.energy = 80000
    master.beam.data.spot_size = math.radians(20)
    master.beam.data.spot_blend = 1.0
    master.beam.rotation_euler = (math.radians(-60), 0, 0)
    style.setup_god_rays(master.scene, beam_obj=master.beam)

    # --- NEW: Character key lights ---
    # Herbaceous key light (warm, positioned stage left above)
    bpy.ops.object.light_add(type='SPOT', location=(-3, -8, 6))
    herb_key = bpy.context.object
    herb_key.name = "HerbaceousKeyLight"
    herb_key.data.energy = 15000
    herb_key.data.spot_size = math.radians(25)
    herb_key.data.spot_blend = 0.5
    herb_key.data.color = (1.0, 0.92, 0.75)   # warm white
    herb_key.rotation_euler = (math.radians(-40), 0, math.radians(20))

    # Arbor key light (slightly cooler, stage right above)
    bpy.ops.object.light_add(type='SPOT', location=(3, -8, 6))
    arbor_key = bpy.context.object
    arbor_key.name = "ArborKeyLight"
    arbor_key.data.energy = 15000
    arbor_key.data.spot_size = math.radians(25)
    arbor_key.data.spot_blend = 0.5
    arbor_key.data.color = (0.85, 0.95, 1.0)   # cool white
    arbor_key.rotation_euler = (math.radians(-40), 0, math.radians(-20))

    # Gnome key light (sickly purple-green, from below for menace)
    bpy.ops.object.light_add(type='SPOT', location=(5, 3, 1))
    gnome_key = bpy.context.object
    gnome_key.name = "GnomeKeyLight"
    gnome_key.data.energy = 8000
    gnome_key.data.spot_size = math.radians(30)
    gnome_key.data.spot_blend = 0.7
    gnome_key.data.color = (0.4, 0.8, 0.3)     # unsettling green
    gnome_key.rotation_euler = (math.radians(30), 0, math.radians(-30))

    # --- NEW: Soft area fill for overall scene brightness ---
    # Overhead dome fill - bounced light from greenhouse glass ceiling
    bpy.ops.object.light_add(type='AREA', location=(0, 0, 12))
    dome_fill = bpy.context.object
    dome_fill.name = "DomeFill"
    dome_fill.data.energy = 3000
    dome_fill.data.size = 20.0              # large area = soft shadows
    dome_fill.data.color = (0.9, 1.0, 0.9) # faint green tint from plants
    dome_fill.rotation_euler = (math.radians(180), 0, 0)  # pointing down

    # Ground bounce fill - simulates light bouncing off marble floor
    bpy.ops.object.light_add(type='AREA', location=(0, 0, -0.5))
    ground_bounce = bpy.context.object
    ground_bounce.name = "GroundBounce"
    ground_bounce.data.energy = 1500
    ground_bounce.data.size = 15.0
    ground_bounce.data.color = (0.8, 0.9, 0.7)  # sage green marble bounce
    ground_bounce.rotation_euler = (0, 0, 0)     # pointing up

    # --- NEW: Scene-adaptive brightness keyframes ---
    # Brighten during dialogue scenes where faces need to read clearly
    dialogue_scenes = [
        'scene16_dialogue', 'scene17_dialogue', 'scene18_dialogue',
        'scene19_dialogue', 'scene20_dialogue', 'scene21_dialogue'
    ]
    for scene_name in dialogue_scenes:
        if scene_name not in SCENE_MAP: continue
        start, end = SCENE_MAP[scene_name]
        # Boost character key lights during dialogue
        for light in [herb_key, arbor_key]:
            light.data.energy = 15000
            light.data.keyframe_insert(data_path="energy", frame=start - 1)
            light.data.energy = 25000    # 67% brighter for closeups
            light.data.keyframe_insert(data_path="energy", frame=start + 12)
            light.data.energy = 25000
            light.data.keyframe_insert(data_path="energy", frame=end - 12)
            light.data.energy = 15000
            light.data.keyframe_insert(data_path="energy", frame=end)

    # Dim gnome key light as he loses power in scenes 19-22
    if 'scene19_dialogue' in SCENE_MAP:
        gnome_key.data.energy = 8000
        gnome_key.data.keyframe_insert(data_path="energy",
                                        frame=SCENE_MAP['scene19_dialogue'][0])
    if 'scene20_dialogue' in SCENE_MAP:
        gnome_key.data.energy = 4000
        gnome_key.data.keyframe_insert(data_path="energy",
                                        frame=SCENE_MAP['scene20_dialogue'][0])
    if 'scene21_dialogue' in SCENE_MAP:
        gnome_key.data.energy = 1500
        gnome_key.data.keyframe_insert(data_path="energy",
                                        frame=SCENE_MAP['scene21_dialogue'][0])
    if 'scene22_retreat' in SCENE_MAP:
        gnome_key.data.energy = 500     # nearly dark as he flees
        gnome_key.data.keyframe_insert(data_path="energy",
                                        frame=SCENE_MAP['scene22_retreat'][0])

    # Store new lights on master for visibility control elsewhere
    master.herb_key = herb_key
    master.arbor_key = arbor_key
    master.gnome_key = gnome_key
    master.dome_fill = dome_fill
    master.ground_bounce = ground_bounce
