import bpy
import math

def setup_scene(master):
    """
    Scene 03: The Solar Reset.
    The Climax: Blasting the Blight with pure light.
    """
    scene = bpy.context.scene
    cam = master.camera
    target = master.cam_target
    liana = master.liana
    blight = master.blight
    
    start_f, end_f = 5501, 8500
    
    # 1. Liana reaches the 'Solar Lever'
    liana.location = (15, 0, 1)
    liana.keyframe_insert(data_path="location", frame=start_f)
    
    # 2. Add THE SUN (Climax Light)
    bpy.ops.object.light_add(type='SUN', rotation=(0.5, 0, 0))
    sun = bpy.context.object
    sun.name = "Solar_Reset_Sun"
    sun.data.energy = 0
    sun.data.keyframe_insert(data_path="energy", frame=start_f)
    
    # The Blast (Frame 6000)
    sun.data.energy = 15.0
    sun.data.keyframe_insert(data_path="energy", frame=6000)
    
    # 3. Vaporize the Blight
    blight.scale = (1, 1, 1)
    blight.keyframe_insert(data_path="scale", frame=5999)
    blight.scale = (0, 0, 0)
    blight.keyframe_insert(data_path="scale", frame=6000)
    
    # 4. Lush Transformation (Color shift)
    # We'll use a procedural material shift on the vault
    mat = master.vault.data.materials[0]
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    
    # Frame 6000: Steel
    bsdf.inputs['Base Color'].default_value = (0.1, 0.12, 0.15, 1)
    bsdf.inputs['Base Color'].keyframe_insert(data_path="default_value", frame=6000)
    
    # Frame 7500: Mossy Green
    bsdf.inputs['Base Color'].default_value = (0.1, 0.3, 0.1, 1)
    bsdf.inputs['Base Color'].keyframe_insert(data_path="default_value", frame=7500)
    
    # 5. Finale: Zoom out from the Seedling (now a tree)
    target.location = (0, 0, 2) # Higher focus
    target.keyframe_insert(data_path="location", frame=8000)
    
    cam.location = (0, -40, 30)
    cam.keyframe_insert(data_path="location", frame=8500)

    print("Scene 03 Setup Complete.")
