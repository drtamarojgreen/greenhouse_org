import bpy
import math

def setup_scene(master):
    """
    Scene 01: The Seed.
    CLEAN SLATE: Choreography from scratch.
    """
    scene = bpy.context.scene
    cam = master.camera
    target = master.cam_target
    
    # 1. Opening Pan: Zoom from Vault roof to the Seedling
    target.location = (0, 0, 1) # Focus on Seedling
    target.keyframe_insert(data_path="location", frame=1)
    
    cam.location = (0, -20, 25) # High angle
    cam.keyframe_insert(data_path="location", frame=1)
    
    cam.location = (0, -10, 5) # Close-in
    cam.keyframe_insert(data_path="location", frame=1000)
    
    # 2. The Blight Intrusion (2001 - 5500 is S02, but start creeping now)
    blight = master.blight
    blight.location = (5, 5, 0)
    blight.keyframe_insert(data_path="location", frame=500)
    blight.location = (1, 1, 0.5) # Creeping close to the pedestal
    blight.keyframe_insert(data_path="location", frame=2000)
    
    # 3. Setup Scene Lighting (Cycles Native)
    bpy.ops.object.light_add(type='POINT', location=(0, 0, 5))
    vault_light = bpy.context.object
    vault_light.name = "Vault_KeyLight"
    vault_light.data.energy = 5000
    vault_light.data.color = (0.7, 0.8, 1.0) # Cold Blue
    
    # Pulsing Seedling Light
    bpy.ops.object.light_add(type='POINT', location=(0, 0, 1.2))
    seed_light = bpy.context.object
    seed_light.name = "Seed_Glow"
    seed_light.data.color = (0.2, 1.0, 0.3)
    
    # Animate Seed Pulse
    for f in range(1, 2001, 48):
        seed_light.data.energy = 200
        seed_light.data.keyframe_insert(data_path="energy", frame=f)
        seed_light.data.energy = 1000
        seed_light.data.keyframe_insert(data_path="energy", frame=f + 24)

    print("Scene 01 Setup Complete.")
