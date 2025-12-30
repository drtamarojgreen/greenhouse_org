
import bpy
import math

def setup_camera_focus(camera, target):
    """
    Sets the camera to always point at a target object.

    :param camera: The camera object.
    :param target: The object for the camera to track.
    """
    # Create a new track-to constraint
    if not any(c.type == 'TRACK_TO' for c in camera.constraints):
        track_to = camera.constraints.new(type='TRACK_TO')
        track_to.target = target
        track_to.track_axis = 'TRACK_NEGATIVE_Z'
        track_to.up_axis = 'UP_Y'

def create_turntable_animation(camera, target, duration_frames, rotation_degrees=360):
    """
    Creates a turntable animation with the camera orbiting a target.

    :param camera: The camera object to animate.
    :param target: The object to orbit around.
    :param duration_frames: The duration of the animation in frames.
    :param rotation_degrees: The total degrees of rotation.
    """
    # Create an empty to act as a pivot point at the target's location
    pivot = bpy.data.objects.new("TurntablePivot", None)
    bpy.context.scene.collection.objects.link(pivot)
    pivot.location = target.location

    # Parent the camera to the pivot
    camera.parent = pivot

    # Animate the pivot's Z-axis rotation
    pivot.rotation_euler = (0, 0, 0)
    pivot.keyframe_insert(data_path="rotation_euler", frame=1, index=2) # Z-axis

    pivot.rotation_euler = (0, 0, math.radians(rotation_degrees))
    pivot.keyframe_insert(data_path="rotation_euler", frame=duration_frames, index=2) # Z-axis

def create_yaw_animation(camera, duration_frames, angle_degrees=15):
    """
    Creates a yaw (left-right) animation for the camera.

    :param camera: The camera object to animate.
    :param duration_frames: The duration of the animation in frames.
    :param angle_degrees: The maximum angle of the yaw in degrees.
    """
    mid_frame = duration_frames // 2

    # Animate Z-axis rotation for yaw
    camera.rotation_euler = (0, 0, math.radians(-angle_degrees))
    camera.keyframe_insert(data_path="rotation_euler", frame=1, index=2)

    camera.rotation_euler = (0, 0, math.radians(angle_degrees))
    camera.keyframe_insert(data_path="rotation_euler", frame=mid_frame, index=2)

    camera.rotation_euler = (0, 0, math.radians(-angle_degrees))
    camera.keyframe_insert(data_path="rotation_euler", frame=duration_frames, index=2)

def create_pitch_animation(camera, duration_frames, angle_degrees=10):
    """
    Creates a pitch (up-down) animation for the camera.

    :param camera: The camera object to animate.
    :param duration_frames: The duration of the animation in frames.
    :param angle_degrees: The maximum angle of the pitch in degrees.
    """
    mid_frame = duration_frames // 2

    # Animate X-axis rotation for pitch
    camera.rotation_euler = (math.radians(-angle_degrees), 0, 0)
    camera.keyframe_insert(data_path="rotation_euler", frame=1, index=0)

    camera.rotation_euler = (math.radians(angle_degrees), 0, 0)
    camera.keyframe_insert(data_path="rotation_euler", frame=mid_frame, index=0)

    camera.rotation_euler = (math.radians(-angle_degrees), 0, 0)
    camera.keyframe_insert(data_path="rotation_euler", frame=duration_frames, index=0)

def create_dolly_animation(camera, duration_frames, start_distance, end_distance):
    """
    Creates a dolly animation (moving the camera closer or further).

    :param camera: The camera object to animate.
    :param duration_frames: The duration of the animation in frames.
    :param start_distance: The starting distance from the origin on the Y-axis.
    :param end_distance: The ending distance from the origin on the Y-axis.
    """
    # Animate Y-axis location for dolly
    camera.location = (camera.location.x, start_distance, camera.location.z)
    camera.keyframe_insert(data_path="location", frame=1, index=1)

    camera.location = (camera.location.x, end_distance, camera.location.z)
    camera.keyframe_insert(data_path="location", frame=duration_frames, index=1)

def create_zoom_animation(camera, duration_frames, start_focal_length, end_focal_length):
    """
    Creates a focal length zoom animation.

    :param camera: The camera object to animate.
    :param duration_frames: The duration of the animation in frames.
    :param start_focal_length: The starting focal length in mm.
    :param end_focal_length: The ending focal length in mm.
    """
    camera_data = camera.data

    # Animate the lens (focal length)
    camera_data.lens = start_focal_length
    camera_data.keyframe_insert(data_path="lens", frame=1)

    camera_data.lens = end_focal_length
    camera_data.keyframe_insert(data_path="lens", frame=duration_frames)
