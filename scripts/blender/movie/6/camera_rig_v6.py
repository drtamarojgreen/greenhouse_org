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

    # 1. WIDE dynamic path: Slow arc-zoom for cinematic reveal
    wide_base = mathutils.Vector(config.CAM_WIDE_POS)
    wide_points = [
        wide_base,
        wide_base + mathutils.Vector((2.0, 2.0, 0.5)),
        wide_base + mathutils.Vector((0.0, 4.0, 1.0))
    ]
    wide_path = create_camera_path("WIDE", wide_points)

    wide_cam = bpy.data.objects.get("WIDE")
    if wide_cam:
        setup_follow_path(wide_cam, wide_path, duration=config.TOTAL_FRAMES)

    # 2. OTS1: Breathing figure-8 motion
    ots1_base = mathutils.Vector(config.CAM_OTS1_POS)
    ots1_points = [
        ots1_base + mathutils.Vector((math.sin(a), math.sin(2*a), math.cos(a)*0.2)) * 0.8
        for a in [0, math.pi/2, math.pi, 3*math.pi/2, 2*math.pi]
    ]
    ots1_path = create_camera_path("OTS1", ots1_points)

    ots1_cam = bpy.data.objects.get("OTS1")
    if ots1_cam:
        setup_follow_path(ots1_cam, ots1_path, duration=config.TOTAL_FRAMES)

    # 3. OTS2: Symmetric breathing figure-8 motion
    ots2_base = mathutils.Vector(config.CAM_OTS2_POS)
    ots2_points = [
        ots2_base + mathutils.Vector((math.sin(a), -math.sin(2*a), math.cos(a)*0.2)) * 0.8
        for a in [0, math.pi/2, math.pi, 3*math.pi/2, 2*math.pi]
    ]
    ots2_path = create_camera_path("OTS2", ots2_points)

    ots2_cam = bpy.data.objects.get("OTS2")
    if ots2_cam:
        setup_follow_path(ots2_cam, ots2_path, duration=config.TOTAL_FRAMES)

    return True
