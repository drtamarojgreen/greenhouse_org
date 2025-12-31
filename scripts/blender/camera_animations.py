
import bpy
import math

def setup_camera_rig(camera):
    """
    Sets up the Pivot -> Rig -> Camera hierarchy as defined in Plan 01.
    """
    # 1. Create Pivot (Root at origin)
    if "TurntablePivot" in bpy.data.objects:
        pivot = bpy.data.objects["TurntablePivot"]
    else:
        pivot = bpy.data.objects.new("TurntablePivot", None)
        bpy.context.scene.collection.objects.link(pivot)
    pivot.location = (0, 0, 0)
    
    # 2. Create Rig (Child of Pivot)
    if "CameraRig" in bpy.data.objects:
        rig = bpy.data.objects["CameraRig"]
    else:
        rig = bpy.data.objects.new("CameraRig", None)
        bpy.context.scene.collection.objects.link(rig)
        rig.parent = pivot
    
    # 3. Parent Camera to Rig
    camera.parent = rig
    
    return pivot, rig

def setup_camera_track(camera, target, name="Track"):
    """
    Adds a named Track To constraint to the camera.
    Returns the constraint object.
    """
    constraint_name = f"Track_{name}"
    con = camera.constraints.get(constraint_name)
    if not con:
        con = camera.constraints.new(type='TRACK_TO')
        con.name = constraint_name
    
    con.target = target
    con.track_axis = 'TRACK_NEGATIVE_Z'
    con.up_axis = 'UP_Y'
    return con

def animate_turntable(pivot, duration_frames):
    """
    Rotates the pivot from 0 to 360 degrees.
    """
    pivot.rotation_euler = (0, 0, 0)
    pivot.keyframe_insert(data_path="rotation_euler", frame=1, index=2)
    
    pivot.rotation_euler = (0, 0, 2 * math.pi)
    pivot.keyframe_insert(data_path="rotation_euler", frame=duration_frames, index=2)
