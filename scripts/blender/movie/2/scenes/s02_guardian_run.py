import bpy
import math

def setup_scene(master):
    """
    Scene 02: The Pipe-Walk.
    Navigation through structural vault beams.
    """
    scene = bpy.context.scene
    cam = master.camera
    target = master.cam_target
    liana = master.liana
    
    # 1. Position Liana at the start of the 'Pipe-Way'
    start_f, end_f = 2001, 5500
    liana.location = (-10, -10, 0.5)
    liana.keyframe_insert(data_path="location", frame=start_f)
    
    # 2. Hero Walk: Moving along the X-Axis beam
    liana.location = (10, -10, 0.5)
    liana.keyframe_insert(data_path="location", frame=end_f)
    
    # 3. Camera Rail-Track: Following the Guardian along a parallel beam
    # This guarantees NO obstructions (staying in the 'corridor' between beams)
    target.location = liana.location
    target.keyframe_insert(data_path="location", frame=start_f)
    
    cam.location = (-10, -15, 3) 
    cam.keyframe_insert(data_path="location", frame=start_f)
    
    target.location = (10, -10, 0.5)
    target.keyframe_insert(data_path="location", frame=end_f)
    
    cam.location = (10, -15, 3)
    cam.keyframe_insert(data_path="location", frame=end_f)
    
    # 4. Environment Lighting (Structural Rim Lights)
    bpy.ops.object.light_add(type='AREA', location=(0, -5, 10))
    rim = bpy.context.object
    rim.name = "Vault_Rim"
    rim.data.energy = 8000
    rim.data.color = (1.0, 0.9, 0.8) # Warm contrast

    print("Scene 02 Setup Complete.")
