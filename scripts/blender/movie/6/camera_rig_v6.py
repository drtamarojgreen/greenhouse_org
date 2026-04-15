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

def setup_follow_path(cam_obj, path_obj, duration=100):
    """Binds camera to path with Follow Path constraint."""
    constraint = cam_obj.constraints.new(type='FOLLOW_PATH')
    constraint.target = path_obj
    constraint.use_fixed_location = True

    # Animate offset from 0 to 1
    constraint.offset_factor = 0.0
    constraint.keyframe_insert(data_path="offset_factor", frame=1)

    constraint.offset_factor = 1.0
    constraint.keyframe_insert(data_path="offset_factor", frame=duration)

    return constraint

def setup_camera_rig_v6():
    """Builds standard production camera rig with paths."""
    import config

    # 1. WIDE dynamic path (Reflects Storyline Beats: Arrival, Dance, Blessing, Ascent)
    wide_points = [
        (config.CAM_WIDE_POS[0], config.CAM_WIDE_POS[1], config.CAM_WIDE_POS[2]),       # Frame 1: Arrival
        (config.CAM_WIDE_POS[0] + 5.0, config.CAM_WIDE_POS[1] + 2.0, config.CAM_WIDE_POS[2] + 2.0), # Frame 1000: Dance
        (config.CAM_WIDE_POS[0] - 5.0, config.CAM_WIDE_POS[1] + 4.0, config.CAM_WIDE_POS[2] + 4.0), # Frame 2000: Blessing
        (config.CAM_WIDE_POS[0], config.CAM_WIDE_POS[1] + 6.0, config.CAM_WIDE_POS[2] + 6.0)        # Frame 3000+: Ascent
    ]
    wide_path = create_camera_path("WIDE", wide_points)

    wide_cam = bpy.data.objects.get("WIDE")
    if wide_cam:
        setup_follow_path(wide_cam, wide_path, duration=config.TOTAL_FRAMES)

    # 2. OTS target tracking
    # OTS1 follows a small circle around its base position while tracking Herbaceous
    ots1_base = mathutils.Vector(config.CAM_OTS1_POS)
    ots1_points = [
        ots1_base + mathutils.Vector((math.sin(a), math.cos(a), 0)) * 0.5
        for a in [0, math.pi/2, math.pi, 3*math.pi/2, 2*math.pi]
    ]
    ots1_path = create_camera_path("OTS1", ots1_points)

    ots1_cam = bpy.data.objects.get("OTS1")
    if ots1_cam:
        setup_follow_path(ots1_cam, ots1_path, duration=config.TOTAL_FRAMES)

    return True
