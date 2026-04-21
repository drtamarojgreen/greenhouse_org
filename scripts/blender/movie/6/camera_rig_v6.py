import bpy
import math
import mathutils

def create_camera_path(name, points):
    """Creates a Bezier curve for camera movement."""
    curve_data = bpy.data.curves.new(name=f"Path_{name}", type='CURVE')
    curve_data.dimensions = '3D'

    obj = bpy.data.objects.new(f"Path_{name}", curve_data)
    bpy.context.scene.collection.objects.link(obj)

    spline = curve_data.splines.new('BEZIER')
    spline.bezier_points.add(len(points) - 1)

    for i, pt in enumerate(points):
        spline.bezier_points[i].co = pt
        spline.bezier_points[i].handle_left_type = 'AUTO'
        spline.bezier_points[i].handle_right_type = 'AUTO'

    return obj

def setup_follow_path(cam_obj, path_obj, duration=100, track_target=None):
    """Binds camera to path with Follow Path and optional Track To constraint."""
    # 1. Follow Path
    con_path = cam_obj.constraints.new(type='FOLLOW_PATH')
    con_path.target = path_obj
    con_path.use_fixed_location = True

    # Animate offset from 0 to 1
    con_path.offset_factor = 0.0
    con_path.keyframe_insert(data_path="offset_factor", frame=1)

    con_path.offset_factor = 1.0
    con_path.keyframe_insert(data_path="offset_factor", frame=duration)

    # 2. Track To (Ensure camera faces target during motion)
    if track_target:
        con_track = cam_obj.constraints.new(type='TRACK_TO')
        con_track.target = track_target
        con_track.track_axis = 'TRACK_NEGATIVE_Z'
        con_track.up_axis = 'UP_Y'

    return con_path

def setup_camera_rig_v6():
    """Builds standard production camera rig with paths."""
    import config

    # 1. WIDE dynamic path
    wide_points = [
        (config.CAM_WIDE_POS[0], config.CAM_WIDE_POS[1], config.CAM_WIDE_POS[2]),
        (config.CAM_WIDE_POS[0], config.CAM_WIDE_POS[1] + 2.0, config.CAM_WIDE_POS[2] + 1.0)
    ]
    wide_path = create_camera_path("WIDE", wide_points)

    wide_cam = bpy.data.objects.get("WIDE")
    mid_target = bpy.data.objects.get(config.LIGHTING_MIDPOINT)
    if wide_cam:
        setup_follow_path(wide_cam, wide_path, duration=config.TOTAL_FRAMES, track_target=mid_target)

    # 2. OTS1 target tracking (Circular drift)
    ots1_base = mathutils.Vector(config.CAM_OTS1_POS)
    ots1_points = [
        ots1_base + mathutils.Vector((math.sin(a), math.cos(a), 0)) * 0.5
        for a in [0, math.pi/2, math.pi, 3*math.pi/2, 2*math.pi]
    ]
    ots1_path = create_camera_path("OTS1", ots1_points)

    ots1_cam = bpy.data.objects.get("OTS1")
    herb_target = bpy.data.objects.get(config.FOCUS_HERBACEOUS)
    if ots1_cam:
        setup_follow_path(ots1_cam, ots1_path, duration=config.TOTAL_FRAMES, track_target=herb_target)

    # 3. OTS2 dynamic path (Rising for Act IV climax)
    ots2_base = mathutils.Vector(config.CAM_OTS2_POS)
    ots2_points = [
        ots2_base,
        ots2_base + mathutils.Vector((0, 0, 3.0)), # Rise to see Radiant_Aura dance
        ots2_base + mathutils.Vector((2.0, 2.0, 4.0)) # Side sweep for finale
    ]
    ots2_path = create_camera_path("OTS2", ots2_points)

    ots2_cam = bpy.data.objects.get("OTS2")
    arbor_target = bpy.data.objects.get(config.FOCUS_ARBOR)
    if ots2_cam:
        setup_follow_path(ots2_cam, ots2_path, duration=config.TOTAL_FRAMES, track_target=arbor_target)

    return True
