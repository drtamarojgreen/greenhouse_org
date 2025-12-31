
import bpy
import os
import sys
import math
import time
from datetime import datetime
import importlib
import shutil

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
    bpy.ops.object.select_all(action='DESELECT')
    bpy.ops.import_scene.fbx(filepath=fbx_path)
    model = bpy.context.selected_objects[0]
    model.name = "BrainModel"
    bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
    model.location = (0, 0, 0)
    bpy.ops.object.camera_add(location=(0, -12, 2))
    camera = bpy.context.active_object
    camera.name = "SceneCamera"
    bpy.context.scene.camera = camera
    bpy.ops.object.light_add(type='SUN', location=(5, 5, 10))
    light = bpy.context.active_object
    light.data.energy = 3.0
    cam_anim.setup_camera_focus(camera, model)
    return model, camera

def configure_render_settings(output_folder, duration_frames, file_format='FFMPEG', engine='WORKBENCH'):
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_WORKBENCH'
    if hasattr(scene.display, "shading"):
        scene.display.shading.light = 'STUDIO'
        scene.display.shading.color_type = 'OBJECT'
        scene.display.shading.show_cavity = True
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720
    scene.frame_start = 1
    scene.frame_end = duration_frames
    scene.render.filepath = os.path.join(script_dir, "render_outputs", output_folder, "render")
    scene.render.image_settings.file_format = file_format
    scene.render.ffmpeg.format = "MKV"
    scene.render.ffmpeg.codec = "H264"

def create_greenhouse_logo():
    bpy.ops.object.text_add(location=(8, 0, 8))
    logo = bpy.context.active_object
    logo.data.body = "GREENHOUSE"
    logo.data.extrude = 0.1
    mat = bpy.data.materials.new(name="LogoMat")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()
    output = nodes.new(type='ShaderNodeOutputMaterial')
    emission = nodes.new(type='ShaderNodeEmission')
    emission.inputs['Color'].default_value = (0.1, 0.8, 0.1, 1)
    emission.inputs['Strength'].default_value = 10.0
    mat.node_tree.links.new(emission.outputs['Emission'], output.inputs['Surface'])
    logo.data.materials.append(mat)
    logo.rotation_euler[0] = math.radians(90)
    logo.rotation_euler[2] = math.radians(180)

def run_job_brain_tour(label_names):
    start_time = time.time()
    base_fbx_path = os.path.join(script_dir, "brain.fbx")
    clean_scene()
    model, camera = setup_scene(base_fbx_path)
    create_greenhouse_logo()
    
    # Place neurons INSIDE brain (User instruction)
    neuron_physics.create_neuron_cloud(count=150, radius=2.0)
    neuron_physics.setup_neuron_materials()
    
    model.color = (0.05, 0.05, 0.05, 1) # Dim the brain
    
    DATA_DIR = os.path.join(script_dir, '..', 'python')
    REGION_MAP_FILE = os.path.join(DATA_DIR, "region_map.json")
    VERTICES_FILE = os.path.join(DATA_DIR, "vertices.npy")
    LABELS_FILE = os.path.join(DATA_DIR, "labels.npy")

    duration = custom_anim.create_brain_tour_animation(label_names, DATA_DIR, REGION_MAP_FILE, LABELS_FILE, VERTICES_FILE)
    
    if duration > 0:
        temp_dir = os.path.join(script_dir, "render_outputs", "temp")
        configure_render_settings("temp", duration)
        bpy.ops.render.render(animation=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M")
        final_filename = f"Tour_{timestamp}.mkv"
        completed_dir = os.path.abspath(os.path.join(script_dir, "completed"))
        os.makedirs(completed_dir, exist_ok=True)
        
        mkv_files = [f for f in os.listdir(temp_dir) if f.endswith(".mkv")]
        if mkv_files:
            mkv_files.sort(key=lambda x: os.path.getctime(os.path.join(temp_dir, x)), reverse=True)
            source = os.path.join(temp_dir, mkv_files[0])
            dest = os.path.join(completed_dir, final_filename)
            try:
                shutil.move(source, dest)
                print(f"Success: {dest}")
            except Exception as e:
                shutil.copy2(source, dest)
                print(f"Fallback success: {dest}")

def main():
    if "--" in sys.argv:
        args = sys.argv[sys.argv.index("--") + 1:]
        if args[0] == 'brain_tour':
            run_job_brain_tour(args[1:])

if __name__ == "__main__":
    main()
