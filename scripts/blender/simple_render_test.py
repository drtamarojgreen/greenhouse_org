
import bpy
import os

print("--- Starting simple_render_test.py ---")

try:
    # --- Basic Scene Setup ---
    print("Cleaning scene...")
    if bpy.context.object and bpy.context.object.mode == 'EDIT':
        bpy.ops.object.mode_set(mode='OBJECT')
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    print("Scene cleaned.")

    # --- Load FBX ---
    script_dir = os.path.dirname(os.path.abspath(__file__))
    fbx_path = os.path.join(script_dir, "brain.fbx")
    print(f"Attempting to import FBX: {fbx_path}")
    if not os.path.exists(fbx_path):
        print("CRITICAL: brain.fbx not found!")
    else:
        bpy.ops.import_scene.fbx(filepath=fbx_path)
        print("FBX import call completed.")

    # --- Improve Lighting ---
    print("Creating lights...")
    # Key light
    bpy.ops.object.light_add(type='POINT', location=(5, -5, 5))
    key_light = bpy.context.active_object
    key_light.data.energy = 1000
    # Fill light
    bpy.ops.object.light_add(type='POINT', location=(-5, -5, 0))
    fill_light = bpy.context.active_object
    fill_light.data.energy = 300
    # Rim light
    bpy.ops.object.light_add(type='POINT', location=(0, 5, 0))
    rim_light = bpy.context.active_object
    rim_light.data.energy = 500
    print("Lights created.")

    # --- Create Material and Texture ---
    print("Creating material and texture...")
    # Get the brain object (assuming it's the first object)
    brain_obj = bpy.data.objects[0]

    # Create a new material
    mat = bpy.data.materials.new(name="BrainMaterial")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')

    # Add a Noise texture
    tex_noise = mat.node_tree.nodes.new('ShaderNodeTexNoise')
    tex_noise.inputs['Scale'].default_value = 5.0
    tex_noise.inputs['Detail'].default_value = 10.0
    tex_noise.inputs['Roughness'].default_value = 0.8
    
    # Add a color ramp
    color_ramp = mat.node_tree.nodes.new('ShaderNodeValToRGB')
    color_ramp.color_ramp.elements[0].color = (0.8, 0.1, 0.1, 1) # Red
    color_ramp.color_ramp.elements.new(0.5)
    color_ramp.color_ramp.elements[1].color = (0.8, 0.5, 0.5, 1) # Pink
    
    # Link nodes
    mat.node_tree.links.new(tex_noise.outputs['Fac'], color_ramp.inputs['Fac'])
    mat.node_tree.links.new(color_ramp.outputs['Color'], bsdf.inputs['Base Color'])

    # Assign material to object
    if brain_obj.data.materials:
        brain_obj.data.materials[0] = mat
    else:
        brain_obj.data.materials.append(mat)
    print("Material and texture created.")


    # --- Camera Path Animation ---
    print("Creating camera path and animation...")
    # Create a path for the camera
    bpy.ops.curve.primitive_bezier_circle_add(radius=10, location=(0, 0, 5))
    path = bpy.context.active_object

    # Create camera
    bpy.ops.object.camera_add(location=(10, 0, 5))
    camera = bpy.context.active_object
    bpy.context.scene.camera = camera
    camera.data.clip_start = 0.1
    camera.data.clip_end = 1000
    
    # Add "Follow Path" constraint to camera
    follow_path_constraint = camera.constraints.new(type='FOLLOW_PATH')
    follow_path_constraint.target = path
    
    # Animate camera along the path
    path.data.path_duration = 5
    bpy.context.scene.frame_start = 1
    bpy.context.scene.frame_end = 5
    print("Camera path and animation created.")

    print("Performing diagnostic render of frame 1...")
    scene = bpy.context.scene
    render_dir = os.path.join(script_dir, "output")
    if not os.path.exists(render_dir):
        os.makedirs(render_dir)
    scene.render.filepath = os.path.join(render_dir, "diagnostic_frame.png")
    scene.render.image_settings.file_format = 'PNG'
    bpy.context.scene.frame_current = 1
    bpy.ops.render.render(write_still=True)
    print("Diagnostic render completed.")


    # --- Render Settings for Animation ---
    print("Configuring render settings for animation...")
    scene.render.filepath = os.path.join(render_dir, "brain_animation.mp4")
    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format = 'MPEG4'
    scene.render.ffmpeg.codec = 'H264'
    print("Render settings configured.")
    
    # --- Render Animation ---
    print("Calling bpy.ops.render.render(animation=True)...")
    bpy.ops.render.render(animation=True)
    print("bpy.ops.render.render() call completed.")

    print("--- simple_render_test.py finished successfully ---")

except Exception as e:
    print(f"An error occurred: {e}")
    # Force a non-zero exit code on error
    import sys
    sys.exit(1)
