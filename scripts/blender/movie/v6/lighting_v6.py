import bpy

def setup_6_point_lighting_v6(target=None):
    """Version 6 Cinematic 6-Point Lighting."""
    lights = []
    positions = [
        ("Key", (5, -5, 5), 1000),
        ("Fill", (-5, -5, 3), 400),
        ("Rim", (0, 5, 5), 800),
        ("Kicker_L", (-3, 3, 2), 200),
        ("Kicker_R", (3, 3, 2), 200),
        ("BG", (0, 10, 5), 500)
    ]

    for name, loc, energy in positions:
        bpy.ops.object.light_add(type='AREA', location=loc)
        light = bpy.context.object
        light.name = f"V6_{name}"
        light.data.energy = energy
        lights.append(light)

        if target:
            con = light.constraints.new(type='TRACK_TO')
            con.target = target
            con.track_axis = 'TRACK_NEGATIVE_Z'
            con.up_axis = 'UP_Y'

    return lights

def setup_light_show_v6(lights, frame_start, frame_end, cycle=24):
    """Version 6 Dynamic Light Show Utility."""
    colors = [(1,0,0), (0,1,0), (0,0,1), (1,1,0), (1,0,1), (0,1,1)]

    for i, light in enumerate(lights):
        for f in range(frame_start, frame_end, cycle):
            light.data.color = colors[(i + f // cycle) % len(colors)]
            light.data.keyframe_insert(data_path="color", frame=f)

            # Pulsing intensity
            orig_energy = light.data.energy
            light.data.energy = orig_energy * 2.0
            light.data.keyframe_insert(data_path="energy", frame=f)
            light.data.energy = orig_energy * 0.5
            light.data.keyframe_insert(data_path="energy", frame=f + cycle // 2)
