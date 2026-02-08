import bpy
import random

def apply_scene_grade(master, scene_name, frame_start, frame_end):
    """Applies scene mood presets: world tint, light energy/color ratios."""
    scene = master.scene
    world = scene.world
    nodes = world.node_tree.nodes
    bg = nodes.get("Background")

    # Default values (Reset)
    bg_color = (0, 0, 0, 1)
    sun_energy = 5.0
    sun_color = (1, 1, 1, 1)
    rim_energy = 5000
    rim_color = (1, 1, 1, 1)
    fill_energy = 2000
    fill_color = (1, 1, 1, 1)
    spot_energy = 10000
    spot_color = (1, 1, 1, 1)

    if scene_name == 'garden': # Scenes 1-4
        bg_color = (0.01, 0.02, 0.01, 1) # Dark mossy green
        sun_color = (1, 0.9, 0.7, 1) # Warm amber
        rim_color = (0.8, 1, 0.8, 1) # Soft green
    elif scene_name == 'resonance': # Scenes 5-6
        bg_color = (0, 0.01, 0.02, 1) # Dark cyan
        sun_color = (0.7, 0.9, 1, 1) # Electric cyan
        rim_color = (0.5, 0.8, 1, 1) # Teal
    elif scene_name == 'shadow': # Scenes 7-8
        bg_color = (0.02, 0, 0.03, 1) # Dark violet
        sun_energy = 2.0 # Dimmer
        sun_color = (0.8, 0.7, 1, 1) # Pale violet
        rim_energy = 8000 # Stronger rim to separate from dark
        rim_color = (0.6, 0.4, 1, 1) # Violet rim
        spot_energy = 5000
        spot_color = (0.7, 0.5, 1, 1)
    elif scene_name == 'sanctuary': # Scenes 9-11
        bg_color = (0.02, 0.02, 0, 1) # Dark gold/olive
        sun_color = (1, 0.95, 0.8, 1) # Rich gold
        rim_color = (1, 1, 0.9, 1) # Warm white

    # Apply to world
    if bg:
        bg.inputs[0].default_value = bg_color
        bg.inputs[0].keyframe_insert(data_path="default_value", frame=frame_start)

    # Apply to lights
    lights = {
        "Sun": (sun_energy, sun_color),
        "RimLight": (rim_energy, rim_color),
        "FillLight": (fill_energy, fill_color),
        "Spot": (spot_energy, spot_color)
    }

    for name, (energy, color) in lights.items():
        light_obj = bpy.data.objects.get(name)
        if light_obj:
            light_obj.data.energy = energy
            light_obj.data.keyframe_insert(data_path="energy", frame=frame_start)
            if hasattr(light_obj.data, "color"):
                light_obj.data.color = color[:3]
                light_obj.data.keyframe_insert(data_path="color", frame=frame_start)

def animate_foliage_wind(objects, strength=0.05, frame_start=1, frame_end=5000):
    """Adds subtle sway to foliage objects within a specific frame range."""
    for obj in objects:
        if obj.type != 'MESH': continue
        if not obj.animation_data:
            obj.animation_data_create()
        if not obj.animation_data.action:
            obj.animation_data.action = bpy.data.actions.new(name=f"WindSway_{obj.name}")

        # Keyframe current rotation to ensure there's a curve
        obj.keyframe_insert(data_path="rotation_euler", frame=frame_start)

        curves = obj.animation_data.action.fcurves

        for i in range(3): # X, Y, Z
            fcurve = None
            for fc in curves:
                if fc.data_path == "rotation_euler" and fc.array_index == i:
                    fcurve = fc
                    break
            if not fcurve:
                fcurve = curves.new(data_path="rotation_euler", index=i)

            modifier = fcurve.modifiers.new(type='NOISE')
            modifier.strength = strength * (0.5 + random.random())
            modifier.scale = 10.0 + random.random() * 5.0
            modifier.phase = random.random() * 100

            # Restrict range to avoid global sway
            modifier.use_restricted_range = True
            modifier.frame_start = frame_start
            modifier.frame_end = frame_end
            modifier.blend_in = 10
            modifier.blend_out = 10

def animate_light_flicker(light_name, frame_start, frame_end, strength=0.2, seed=None):
    """Adds magical flicker to a light within a specific frame range."""
    light_obj = bpy.data.objects.get(light_name)
    if not light_obj: return

    if seed is not None:
        random.seed(seed)

    if not light_obj.data.animation_data:
        light_obj.data.animation_data_create()
    if not light_obj.data.animation_data.action:
        light_obj.data.animation_data.action = bpy.data.actions.new(name=f"Flicker_{light_name}")

    curves = light_obj.data.animation_data.action.fcurves

    fcurve = None
    for fc in curves:
        if fc.data_path == "energy":
            fcurve = fc
            break
    if not fcurve:
        fcurve = curves.new(data_path="energy")

    modifier = fcurve.modifiers.new(type='NOISE')
    modifier.strength = light_obj.data.energy * strength
    modifier.scale = 2.0
    modifier.phase = random.random() * 100

    # Restrict range to avoid global flicker
    modifier.use_restricted_range = True
    modifier.frame_start = frame_start
    modifier.frame_end = frame_end
    modifier.blend_in = 5
    modifier.blend_out = 5
