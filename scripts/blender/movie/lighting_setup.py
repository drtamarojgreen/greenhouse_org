import bpy
import math
import style
from constants import SCENE_MAP
from lighting_config import LIGHTING_DEFAULTS, DIALOGUE_BOOST, GNOME_DEFEAT_PRESETS, DAWN_COLORS

def setup_lighting(master_instance):
    """Extended lighting with character spots and area fills (Config-driven)."""

    def apply_cfg(obj, cfg):
        if not obj or not cfg: return
        for k, v in cfg.items():
            if hasattr(obj.data, k):
                val = math.radians(v) if k.endswith("_size") else v
                setattr(obj.data, k, val)

    # --- Existing volumetric beam ---
    bpy.ops.object.light_add(type='SPOT', location=(0, 10, 15))
    beam = bpy.context.object
    beam.name = "LightShaftBeam"
    apply_cfg(beam, LIGHTING_DEFAULTS.get(beam.name))
    beam.rotation_euler = (math.radians(-60), 0, 0)
    style.setup_god_rays(master_instance.scene, beam_obj=beam)
    master_instance.beam = beam

    # --- Character key lights parented behind camera (Point 142) ---
    cam = bpy.data.objects.get("MovieCamera")
    target = bpy.data.objects.get("CamTarget")

    def setup_camera_light(name, local_pos, color_cfg=None):
        bpy.ops.object.light_add(type='SPOT')
        light = bpy.context.object
        light.name = name
        apply_cfg(light, LIGHTING_DEFAULTS.get(name))

        if cam:
            light.parent = cam
            # Position is local to camera. Positive Z is behind the camera.
            light.location = local_pos

        if target:
            # Point at the characters
            con = light.constraints.new(type='TRACK_TO')
            con.target = target
            con.track_axis = 'TRACK_NEGATIVE_Z'
            con.up_axis = 'UP_Y'

        return light

    # Herbaceous key light (warm, slightly right and above camera)
    herb_key = setup_camera_light("HerbaceousKeyLight", (3, 3, 5))
    master_instance.herb_key = herb_key

    # Arbor key light (cool, slightly left and above camera)
    arbor_key = setup_camera_light("ArborKeyLight", (-3, 3, 5))
    master_instance.arbor_key = arbor_key

    # Gnome key light (menacing green, higher and further back for dramatic shadows)
    gnome_key = setup_camera_light("GnomeKeyLight", (0, 5, 10))
    master_instance.gnome_key = gnome_key

    # --- Area fills ---
    bpy.ops.object.light_add(type='POINT', location=(0, 0, 5))
    intro_light = bpy.context.object
    intro_light.name = "IntroLight"
    intro_light.data.energy = 2000
    intro_light.hide_render = True
    intro_light.keyframe_insert(data_path="hide_render", frame=1)

    bpy.ops.object.light_add(type='AREA', location=(0, 0, 12))
    dome_fill = bpy.context.object
    dome_fill.name = "DomeFill"
    apply_cfg(dome_fill, LIGHTING_DEFAULTS.get(dome_fill.name))
    dome_fill.rotation_euler = (math.radians(180), 0, 0)
    master_instance.dome_fill = dome_fill

    # --- Enhancement #21: Moonlight Transition ---
    bpy.ops.object.light_add(type='SUN', location=(0, 0, 10))
    sun = bpy.context.object
    sun.name = "Sun"
    master_instance.sun = sun

    # Animate sun colors from config
    for frame, color in DAWN_COLORS:
        sun.data.color = color
        sun.data.keyframe_insert(data_path="color", frame=frame)
    # Animate sun angle
    sun.rotation_euler[0] = math.radians(-10)
    sun.keyframe_insert(data_path="rotation_euler", index=0, frame=1)
    sun.rotation_euler[0] = math.radians(-90)
    sun.keyframe_insert(data_path="rotation_euler", index=0, frame=15000)

    # --- Enhancement #23: Storm Lightning ---
    style.animate_light_flicker("GnomeKeyLight", 13701, 14200, strength=5.0, seed=42)

    # --- Scene-adaptive brightness ---
    dialogue_scenes = [
        'scene16_dialogue', 'scene17_dialogue', 'scene18_dialogue',
        'scene19_dialogue', 'scene20_dialogue', 'scene21_dialogue'
    ]
    boost_val = DIALOGUE_BOOST["target_energy"]
    fade = DIALOGUE_BOOST["fade_duration"]

    for scene_name in dialogue_scenes:
        if scene_name in SCENE_MAP:
            start, end = SCENE_MAP[scene_name]
            for light in [herb_key, arbor_key]:
                base_val = LIGHTING_DEFAULTS.get(light.name, {}).get("energy", 15000)
                light.data.energy = base_val
                light.data.keyframe_insert(data_path="energy", frame=start - 1)
                light.data.energy = boost_val
                light.data.keyframe_insert(data_path="energy", frame=start + fade)
                light.data.energy = boost_val
                light.data.keyframe_insert(data_path="energy", frame=end - fade)
                light.data.energy = base_val
                light.data.keyframe_insert(data_path="energy", frame=end)

    # Dim gnome key light during defeat
    for s_name, energy in GNOME_DEFEAT_PRESETS.items():
        if s_name in SCENE_MAP:
            frame = SCENE_MAP[s_name][0]
            gnome_key.data.energy = energy
            gnome_key.data.keyframe_insert(data_path="energy", frame=frame)
            
            if gnome_key.data.animation_data and gnome_key.data.animation_data.action:
                for fc in style.get_action_curves(gnome_key.data.animation_data.action):
                    if fc.data_path == "energy":
                        for kp in fc.keyframe_points:
                            if int(kp.co[0]) == frame:
                                kp.interpolation = 'CONSTANT'

    # --- Enhancement #29: Soft Box Conversion ---
    style.replace_with_soft_boxes()
