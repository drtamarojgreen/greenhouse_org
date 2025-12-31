
import bpy
import os
import math

def apply_simple_texture(obj):
    mat = bpy.data.materials.new(name="BrainTexture")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    voronoi = nodes.new(type='ShaderNodeTexVoronoi')
    voronoi.inputs['Scale'].default_value = 5.0
    
    bsdf = nodes.get("Principled BSDF")
    if bsdf:
        mat.node_tree.links.new(voronoi.outputs['Color'], bsdf.inputs['Base Color'])
    
    if obj.data.materials:
        obj.data.materials[0] = mat
    else:
        obj.data.materials.append(mat)

def render_brain_path_animation():
    print("\n--- Brain Path Animation Test (EEVEE_NEXT + Texture + Light) ---")
    
    # 1. Clear Scene
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    
    # 2. Import Brain (150k verts)
    fbx_path = '/home/tamarojgreen/development/LLM/greenhouse_org/scripts/blender/brain.fbx'
    if not os.path.exists(fbx_path):
        print(f"ERROR: FBX not found at {fbx_path}")
        return
        
    bpy.ops.import_scene.fbx(filepath=fbx_path)
    brain = bpy.context.selected_objects[0]
    brain.name = "TargetBrain"
    
    # Add Texture
    apply_simple_texture(brain)
    
    # 3. Add Path (Bezier Circle)
    bpy.ops.curve.primitive_bezier_circle_add(radius=10, location=(0, 0, 0))
    path = bpy.context.active_object
    path.name = "CameraPath"
    
    # 4. Add Camera
    bpy.ops.object.camera_add()
    camera = bpy.context.active_object
    camera.name = "PathCamera"
    
    # 5. Add Follow Path Constraint
    constraint = camera.constraints.new(type='FOLLOW_PATH')
    constraint.target = path
    constraint.use_fixed_location = True
    constraint.forward_axis = 'TRACK_NEGATIVE_Z'
    constraint.up_axis = 'UP_Y'
    
    # 6. Add Track To Constraint
    track = camera.constraints.new(type='TRACK_TO')
    track.target = brain
    track.track_axis = 'TRACK_NEGATIVE_Z'
    track.up_axis = 'UP_Y'
    
    # Add Light
    bpy.ops.object.light_add(type='POINT', location=(5, 5, 10))
    light = bpy.context.active_object
    light.data.energy = 5000
    
    # 7. Animate Path Evaluation
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end = 10 # Rapid test: 10 frames
    
    constraint.offset_factor = 0.0
    constraint.keyframe_insert(data_path="offset_factor", frame=1)
    constraint.offset_factor = 1.0
    constraint.keyframe_insert(data_path="offset_factor", frame=60)
    
    # 8. Render Settings
    scene.render.engine = 'BLENDER_EEVEE_NEXT'
    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format = 'MKV'
    scene.render.ffmpeg.codec = 'H264'
    scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
    scene.render.ffmpeg.ffmpeg_preset = 'GOOD'
    
    output_path = "/home/tamarojgreen/development/LLM/greenhouse_org/scripts/blender/brain_path_test_lit_eevee"
    scene.render.filepath = output_path
    
    scene.camera = camera
    
    print(f"Attempting to render 10 frames in EEVEE_NEXT (Software GL) to {output_path}.mkv...")
    bpy.ops.render.render(animation=True)
    
    print("Checking for generated file...")
    found = False
    for f in os.listdir("/home/tamarojgreen/development/LLM/greenhouse_org/scripts/blender/"):
        if f.startswith("brain_path_test_lit_eevee") and f.endswith(".mkv"):
            print(f"Found: {f} (Size: {os.path.getsize(os.path.join('/home/tamarojgreen/development/LLM/greenhouse_org/scripts/blender/', f))} bytes)")
            found = True
            
    if found:
        print("SUCCESS: EEVEE_NEXT lit textured brain path animation rendered.")
    else:
        print("FAILURE: MKV file not found.")

if __name__ == "__main__":
    render_brain_path_animation()
