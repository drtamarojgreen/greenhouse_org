import bpy
import mathutils
import config

def create_camera_path(name, points):
    """Creates an organic Bezier curve for camera movement."""
    curve_data = bpy.data.curves.new(name=f"Path_{name}", type='CURVE')
    curve_data.dimensions = '3D'
    curve_data.fill_mode = 'FULL'

    polyline = curve_data.splines.new('BEZIER')
    polyline.bezier_points.add(len(points) - 1)

    for i, p in enumerate(points):
        polyline.bezier_points[i].co = p
        polyline.bezier_points[i].handle_left_type = 'AUTO'
        polyline.bezier_points[i].handle_right_type = 'AUTO'

    curve_obj = bpy.data.objects.new(f"Path_{name}", curve_data)
    bpy.context.scene.collection.objects.link(curve_obj)
    return curve_obj

def setup_follow_path(cam_obj, path_obj, start_frame, end_frame):
    """Binds camera to path with Follow Path constraint."""
    constraint = cam_obj.constraints.new(type='FOLLOW_PATH')
    constraint.target = path_obj
    constraint.use_fixed_location = True

    # Animate offset factor for organic motion timing
    constraint.offset_factor = 0.0
    constraint.keyframe_insert(data_path="offset_factor", frame=start_frame)
    constraint.offset_factor = 1.0
    constraint.keyframe_insert(data_path="offset_factor", frame=end_frame)

def setup_camera_rig_v6():
    """Builds the animated organic camera rig for Scene 6."""
    # 1. Wide Angle Sweep
    wide_points = [
        (0, -12, 3),
        (0, -8, 2),
        (2, -6, 2.5)
    ]
    path_wide = create_camera_path("WIDE", wide_points)
    cam_wide = bpy.data.objects.get("WIDE")
    if cam_wide:
        setup_follow_path(cam_wide, path_wide, config.CAM_ANIM_START, config.CAM_ANIM_END)

    # 2. OTS1 Organic Drift
    ots1_points = [
        (15, 12, 7),
        (13.5, 11, 6),
        (12, 10, 5.5)
    ]
    path_ots1 = create_camera_path("OTS1", ots1_points)
    cam_ots1 = bpy.data.objects.get("OTS1")
    if cam_ots1:
        setup_follow_path(cam_ots1, path_ots1, config.CAM_ANIM_START, config.CAM_ANIM_END)

    # 3. OTS2 Organic Drift
    ots2_points = [
        (-15, -12, 7),
        (-13.5, -11, 6),
        (-12, -10, 5.5)
    ]
    path_ots2 = create_camera_path("OTS2", ots2_points)
    cam_ots2 = bpy.data.objects.get("OTS2")
    if cam_ots2:
        setup_follow_path(cam_ots2, path_ots2, config.CAM_ANIM_START, config.CAM_ANIM_END)

if __name__ == "__main__":
    setup_camera_rig_v6()
