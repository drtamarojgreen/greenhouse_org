
import bpy
import math

def setup_camera_focus(camera, target):
    """
    Sets or updates the camera to always point at a target object.
    """
    # Find existing track-to constraint or create new
    track_to = next((c for c in camera.constraints if c.type == 'TRACK_TO'), None)
    if not track_to:
        track_to = camera.constraints.new(type='TRACK_TO')
    
    track_to.target = target
    track_to.track_axis = 'TRACK_NEGATIVE_Z'
    track_to.up_axis = 'UP_Y'

def create_turntable_animation(camera, target, duration_frames, rotation_degrees=360):
    """
    Creates a turntable animation with the camera orbiting a target.
    """
    # Create an empty to act as a pivot point at the target's location
    if "TurntablePivot" in bpy.data.objects:
        pivot = bpy.data.objects["TurntablePivot"]
    else:
        pivot = bpy.data.objects.new("TurntablePivot", None)
        bpy.context.scene.collection.objects.link(pivot)
    
    pivot.location = target.location
    camera.parent = pivot

    # Animate the pivot's Z-axis rotation
    pivot.rotation_euler = (0, 0, 0)
    pivot.keyframe_insert(data_path="rotation_euler", frame=1, index=2)

    pivot.rotation_euler = (0, 0, math.radians(rotation_degrees))
    pivot.keyframe_insert(data_path="rotation_euler", frame=duration_frames, index=2)
