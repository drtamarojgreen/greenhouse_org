import bpy
import math
import style
from constants import SCENE_MAP

def setup_lighting_scenes(master):
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

    # Firefly Fill Light (#22)
    bpy.ops.object.light_add(type='POINT', location=(0, 0, 2))
    master.firefly_fill = bpy.context.object
    master.firefly_fill.name = "FireflyFill"
    master.firefly_fill.data.energy = 0
    master.firefly_fill.data.color = (0.8, 1.0, 0.2)
    # Pulsing firefly light in sanctuary
    sanctuary_start, sanctuary_end = SCENE_MAP['scene11_nature_sanctuary']
    for f in range(sanctuary_start, sanctuary_end, 48):
        master.firefly_fill.data.energy = 500
        master.firefly_fill.data.keyframe_insert(data_path="energy", frame=f)
        master.firefly_fill.data.energy = 1500
        master.firefly_fill.data.keyframe_insert(data_path="energy", frame=f + 24)

    # Spot
    bpy.ops.object.light_add(type='SPOT', location=(0, -15, 10))
    master.spot = bpy.context.object
    master.spot.name = "Spot"
    master.spot.data.energy = 10000

    # Volumetric light shaft (Sun Beam / Moonlight Enhancement #21)
    bpy.ops.object.light_add(type='SPOT', location=(0, 10, 15))
    master.beam = bpy.context.object
    master.beam.name = "LightShaftBeam"
    master.beam.data.energy = 80000
    master.beam.data.spot_size = math.radians(20)
    master.beam.data.spot_blend = 1.0
    master.beam.rotation_euler = (math.radians(-60), 0, 0)
    style.setup_god_rays(master.scene, beam_obj=master.beam)

    # Animate Sunlight to Moonlight transition (#21)
    # Day color: warm yellow-white
    # Shadow/Gnome scenes: cold blue
    shadow_start = SCENE_MAP['scene07_shadow'][0]
    shadow_end = SCENE_MAP['scene11_nature_sanctuary'][1]

    day_color = (1.0, 0.95, 0.8)
    moon_color = (0.4, 0.5, 1.0)

    master.beam.data.color = day_color
    master.beam.data.keyframe_insert(data_path="color", frame=shadow_start - 50)
    master.beam.data.color = moon_color
    master.beam.data.keyframe_insert(data_path="color", frame=shadow_start)
    master.beam.data.keyframe_insert(data_path="color", frame=shadow_end)
    master.beam.data.color = day_color
    master.beam.data.keyframe_insert(data_path="color", frame=shadow_end + 50)

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

    # --- Enhancement #25: Character-Tinted Rim Lights ---
    def add_tinted_rim(name, location, color):
        bpy.ops.object.light_add(type='SPOT', location=location)
        rim = bpy.context.object
        rim.name = f"{name}_RimTint"
        rim.data.energy = 5000
        rim.data.color = color
        rim.data.spot_size = math.radians(45)
        return rim

    master.h1_rim = add_tinted_rim("Herbaceous", (-3, 5, 2), (1.0, 0.6, 0.1)) # Warm Amber
    master.h2_rim = add_tinted_rim("Arbor", (3, 5, 2), (0.7, 0.8, 1.0))      # Cool Silver
    master.gnome_rim = add_tinted_rim("Gnome", (5, 5, 2), (0.5, 0.1, 0.8))   # Purple/Green menace

    # --- Enhancement #28: Gloom Orb Practical Light ---
    bpy.ops.object.light_add(type='POINT', location=(0, 0, 0))
    orb_light = bpy.context.object
    orb_light.name = "GloomOrb_Practical"
    orb_light.data.energy = 1000
    orb_light.data.color = (0.6, 0.1, 1.0)
    # We will parent this to the staff in silent_movie_generator or a helper
    master.orb_light = orb_light

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

    # --- Enhancement #23: Lightning Flashes ---
    import random
    storm_start, storm_end = SCENE_MAP['scene22_retreat']
    for f in range(storm_start, storm_end, 120): # Every ~5 seconds
        if random.random() > 0.4:
            flash_frame = f + random.randint(0, 60)
            master.sun.data.energy = 5.0
            master.sun.data.keyframe_insert(data_path="energy", frame=flash_frame - 1)
            master.sun.data.energy = 500.0 # Lightning spike
            master.sun.data.keyframe_insert(data_path="energy", frame=flash_frame)
            master.sun.data.energy = 5.0
            master.sun.data.keyframe_insert(data_path="energy", frame=flash_frame + 2)

    # Enhancement #26, #27, #29, #30
    style.animate_dawn_progression(master.sun)
    style.apply_interior_exterior_contrast(master.sun, master.scene.camera)
    style.replace_with_soft_boxes()
    style.animate_hdri_rotation(master.scene)

    # Store new lights on master for visibility control elsewhere
    master.herb_key = herb_key
    master.arbor_key = arbor_key
    master.gnome_key = gnome_key
    # Note: area lights were replaced by soft boxes
