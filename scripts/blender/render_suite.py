
import bpy
import os
import sys
import math
import time
from datetime import datetime
import importlib
import shutil
import json

# --- SCRIPT SETUP ---
script_dir = os.path.dirname(os.path.abspath(__file__))
if script_dir not in sys.path:
    sys.path.append(script_dir)

import camera_animations as cam_anim
import visual_effects as vfx
import custom_animation as custom_anim
import neuron_physics

importlib.reload(cam_anim)
importlib.reload(vfx)
importlib.reload(custom_anim)
importlib.reload(neuron_physics)

def clean_scene():
    if bpy.context.object and bpy.context.object.mode == 'EDIT':
        bpy.ops.object.mode_set(mode='OBJECT')
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

def setup_scene(fbx_path):
    print(f"Importing {fbx_path}...")
    bpy.ops.import_scene.fbx(filepath=fbx_path)
    if not bpy.context.selected_objects:
        raise RuntimeError("FBX Import failed.")
    model = bpy.context.selected_objects[0]
    model.name = "BrainModel"
    vfx.apply_brain_texture(model)
    bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
    model.location = (0, 0, 0)
    bpy.ops.object.camera_add(location=(0, -12, 2))
    camera = bpy.context.active_object
    camera.name = "SceneCamera"
    bpy.context.scene.camera = camera

    # Add lighting
    bpy.ops.object.light_add(type='POINT', location=(5, 5, 5))
    light = bpy.context.active_object
    light.data.energy = 1000.0

    bpy.ops.object.light_add(type='POINT', location=(-5, -5, 5))
    light2 = bpy.context.active_object
    light2.data.energy = 1000.0

    # Add background plane with logo
    bpy.ops.mesh.primitive_plane_add(size=20, location=(0, 10, 0), rotation=(1.5708, 0, 0)) # Rotate 90 degrees on X-axis
    plane = bpy.context.active_object
    plane.name = "BackgroundPlane"

    # Create a material for the plane
    mat = bpy.data.materials.new(name="LogoMaterial")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    # Add nodes
    output = nodes.new(type='ShaderNodeOutputMaterial')
    emission = nodes.new(type='ShaderNodeEmission')
    tex_image = nodes.new(type='ShaderNodeTexImage')

    # Load the logo image
    logo_path = os.path.join(script_dir, "..", "..", "docs", "images", "Greenhouse_Logo.png")
    if os.path.exists(logo_path):
        tex_image.image = bpy.data.images.load(logo_path)

    # Link nodes
    links.new(tex_image.outputs['Color'], emission.inputs['Color'])
    links.new(emission.outputs['Emission'], output.inputs['Surface'])

    # Assign material to plane
    plane.data.materials.append(mat)

    # UV unwrap the plane
    bpy.context.view_layer.objects.active = plane
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.unwrap()
    bpy.ops.object.mode_set(mode='OBJECT')

    cam_anim.setup_camera_track(camera, model, name="Initial")
    return model, camera

def configure_render_settings(output_folder, duration_frames):
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 128
    scene.cycles.diffuse_bounces = 3
    scene.cycles.glossy_bounces = 3
    scene.cycles.transparent_max_bounces = 8
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720
    scene.frame_start = 1
    scene.frame_end = 1
    
    out_dir = os.path.join(script_dir, "render_outputs", output_folder)
    os.makedirs(out_dir, exist_ok=True)
    scene.render.filepath = os.path.join(out_dir, "sample_frame.png")
    
    scene.render.image_settings.file_format = 'PNG'

def run_job_brain_tour(label_names):
    start_time = time.time()
    base_fbx_path = os.path.join(script_dir, "brain.fbx")
    
    print("--- Phase 1: Cleaning Scene ---")
    clean_scene()
    
    print("--- Phase 2: Setup Scene ---")
    model, camera = setup_scene(base_fbx_path)
    model.color = (0.05, 0.05, 0.05, 1) # Dimmed main brain
    
    print("--- Phase 3: Neurons ---")
    neuron_physics.create_neuron_cloud(count=50, radius=2.0)
    
    print("--- Phase 4: Animation and ROI Setup ---")
    DATA_DIR = os.path.join(script_dir, '..', 'python')
    REGION_MAP_FILE = os.path.join(DATA_DIR, "region_map.json")
    VERTICES_FILE = os.path.join(DATA_DIR, "vertices.npy")
    LABELS_FILE = os.path.join(DATA_DIR, "labels.npy")

    # Rapid Test Modifiers (Total ~60-70 frames)
    short_modifiers = {
        'intro_duration': 30,
        'dwell_duration': 15,
        'transition_duration': 15,
        'zoom_factor': 0.7,
        'neon_color': (0.1, 1.0, 1.0)
    }

    duration = custom_anim.create_brain_tour_animation(
        label_names, DATA_DIR, REGION_MAP_FILE, LABELS_FILE, VERTICES_FILE,
        modifiers=short_modifiers
    )
    
    print("--- Phase 5: Scene Verification ---")
    print(f"Total objects in scene: {len(bpy.data.objects)}")
    for obj in bpy.data.objects:
        if obj.name.startswith("Highlight"):
            print(f"  ROI {obj.name}: {len(obj.data.vertices)} vertices")

    if duration > 0:
        print(f"--- Phase 6: Rendering {duration} frames ---")
        configure_render_settings("temp", duration)
        bpy.ops.render.render(animation=True)
        
        # Cleanup and Move
        timestamp = datetime.now().strftime("%y%m%d_%H%M")
        final_filename = f"ShortTest_{timestamp}.mkv"
        completed_dir = os.path.join(script_dir, "completed")
        os.makedirs(completed_dir, exist_ok=True)
        
        temp_dir = os.path.join(script_dir, "render_outputs", "temp")
        mkv_files = [f for f in os.listdir(temp_dir) if f.endswith(".mkv")]
        if mkv_files:
            mkv_files.sort(key=lambda x: os.path.getctime(os.path.join(temp_dir, x)), reverse=True)
            source = os.path.join(temp_dir, mkv_files[0])
            dest = os.path.join(completed_dir, final_filename)
            shutil.move(source, dest)
            print(f"DONE. Render saved to: {dest}")

def run_all_jobs():
    DATA_DIR = os.path.join(script_dir, '..', 'python')
    REGION_MAP_FILE = os.path.join(DATA_DIR, "region_map.json")
    with open(REGION_MAP_FILE, 'r') as f:
        region_map = json.load(f)

    for region_name in region_map.values():
        if region_name == "background":
            continue
        print(f"--- Starting job for region: {region_name} ---")
        run_job_brain_tour([region_name])
        print(f"--- Completed job for region: {region_name} ---")

def main():
    if "--" in sys.argv:
        args = sys.argv[sys.argv.index("--") + 1:]
        if args[0] == 'brain_tour':
            run_job_brain_tour(args[1:])
        elif args[0] == 'all':
            run_all_jobs()

if __name__ == "__main__":
    main()
