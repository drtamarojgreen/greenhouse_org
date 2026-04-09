import bpy
import math

def setup_rail_camera_v6(master_v6, frame_start, frame_end):
    """Version 6 Rail-Track Camera System."""
    # Create Rail (Path)
    bpy.ops.curve.primitive_bezier_circle_add(radius=10, location=(0, 0, 2))
    rail = bpy.context.object
    rail.name = "CameraRail_V6"

    # Create Camera
    bpy.ops.object.camera_add(location=(0, -15, 2))
    cam = bpy.context.object
    cam.name = "MovieCamera_V6"
    master_v6.camera = cam

    # Follow Path Constraint
    con = cam.constraints.new(type='FOLLOW_PATH')
    con.target = rail
    con.use_fixed_location = True

    # Animate progress
    con.offset_factor = 0.0
    con.keyframe_insert(data_path="offset_factor", frame=frame_start)
    con.offset_factor = 1.0
    con.keyframe_insert(data_path="offset_factor", frame=frame_end)

    return cam, rail
