import bpy
import math
import mathutils
import config

def create_camera_path(name, points):
    """Creates a Bezier curve path for a camera."""
    curve_data = bpy.data.curves.new(name=f"{name}_Path", type='CURVE')
    curve_data.dimensions = '3D'
    obj = bpy.data.objects.new(f"{name}_Path", curve_data)
    bpy.context.scene.collection.objects.link(obj)

    spline = curve_data.splines.new('BEZIER')
    spline.bezier_points.add(len(points) - 1)

    for i, p in enumerate(points):
        spline.bezier_points[i].co = p
        spline.bezier_points[i].handle_left = p
        spline.bezier_points[i].handle_right = p

    return obj

def setup_camera_with_path(name, lens, points, target_loc):
    """Sets up a camera with a Follow Path constraint and Track To target."""
    scene = bpy.context.scene

    # 1. Create Path
    path_obj = create_camera_path(name, points)

    # 2. Create Camera
    cam_data = bpy.data.cameras.new(name)
    cam_data.lens = lens
    cam_obj = bpy.data.objects.new(name, cam_data)
    scene.collection.objects.link(cam_obj)

    # 3. Create Focus Target (Empty)
    target_name = f"Focus_{name}"
    target_obj = bpy.data.objects.new(target_name, None)
    target_obj.location = target_loc
    scene.collection.objects.link(target_obj)

    # 4. Add Follow Path Constraint
    follow_path = cam_obj.constraints.new(type='FOLLOW_PATH')
    follow_path.target = path_obj
    follow_path.use_fixed_location = True

    # Keyframe path movement
    follow_path.offset_factor = 0.0
    follow_path.keyframe_insert(data_path="offset_factor", frame=1)
    follow_path.offset_factor = 1.0
    follow_path.keyframe_insert(data_path="offset_factor", frame=config.TOTAL_FRAMES)

    # 5. Add Track To Constraint
    track_to = cam_obj.constraints.new(type='TRACK_TO')
    track_to.target = target_obj
    track_to.track_axis = 'TRACK_NEGATIVE_Z'
    track_to.up_axis = 'UP_Y'

    return cam_obj

def setup_scene6_cameras():
    """Builds the orchestrated camera rig."""
    cameras = {}

    # WIDE: Subtle dolly in
    wide_points = [
        (config.CAMERA_WIDE_LOC[0], config.CAMERA_WIDE_LOC[1], config.CAMERA_WIDE_LOC[2]),
        (config.CAMERA_WIDE_LOC[0], config.CAMERA_WIDE_LOC[1] + 2.0, config.CAMERA_WIDE_LOC[2])
    ]
    cameras["WIDE"] = setup_camera_with_path("WIDE", 35, wide_points, (0, 0, 1.5))

    # OTS1: Over the shoulder Herbaceous
    ots1_points = [
        (config.CAMERA_OTS1_LOC[0], config.CAMERA_OTS1_LOC[1], config.CAMERA_OTS1_LOC[2]),
        (config.CAMERA_OTS1_LOC[0] - 1.0, config.CAMERA_OTS1_LOC[1] - 1.0, config.CAMERA_OTS1_LOC[2])
    ]
    cameras["OTS1"] = setup_camera_with_path("OTS1", 50, ots1_points, config.HERB_EYE_LEVEL)

    # OTS2: Over the shoulder Arbor
    ots2_points = [
        (config.CAMERA_OTS2_LOC[0], config.CAMERA_OTS2_LOC[1], config.CAMERA_OTS2_LOC[2]),
        (config.CAMERA_OTS2_LOC[0] + 1.0, config.CAMERA_OTS2_LOC[1] + 1.0, config.CAMERA_OTS2_LOC[2])
    ]
    cameras["OTS2"] = setup_camera_with_path("OTS2", 50, ots2_points, config.ARBOR_EYE_LEVEL)

    return cameras
