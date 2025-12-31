
import bpy
import json
import numpy as np
import os
import sys
import math

# Add the script's directory to the Python path to allow importing camera_animations
script_dir = os.path.dirname(os.path.realpath(__file__))
if script_dir not in sys.path:
    sys.path.append(script_dir)

import camera_animations
import visual_effects

def get_center_of_label(label_name, data_dir, region_map_file, labels_file, vertices_file):
    """
    Find the 3D coordinates for the center of a labeled region.
    """
    print(f"Finding center for label: {label_name}")

    if not os.path.exists(region_map_file):
        print(f"Error: Region map file not found at {region_map_file}")
        return None

    # Load the region map to get the label ID for the given name
    with open(region_map_file, 'r') as f:
        region_map = json.load(f)

    label_id = None
    for k, v in region_map.items():
        if v.lower() == label_name.lower():
            label_id = int(k)
            break

    if label_id is None:
        print(f"Error: Label '{label_name}' not found in region map.")
        return None

    # Load the labels and vertices
    if not os.path.exists(labels_file) or not os.path.exists(vertices_file):
        print(f"Error: Labels or vertices file missing. {labels_file}, {vertices_file}")
        return None

    labels = np.load(labels_file)
    vertices = np.load(vertices_file)

    # Find the indices of the vertices that match the label_id
    label_indices = np.where(labels == label_id)[0]

    if len(label_indices) == 0:
        print(f"Warning: No vertices found for label '{label_name}'.")
        return None

    # Get the coordinates of the vertices for this label
    label_vertices = vertices[label_indices]

    # Calculate the mean of the coordinates to find the center
    center = np.mean(label_vertices, axis=0)
    return tuple(center)

def create_brain_tour_animation(label_names, data_dir, region_map_file, labels_file, vertices_file, modifiers=None):
    """
    Creates an animation tour: turntable rotation followed by 
    zooming into a sequence of specific brain regions.
    """
    # Default modifiers
    if modifiers is None:
        modifiers = {
            'intro_duration': 150,
            'dwell_duration': 48,
            'transition_duration': 48,
            'zoom_factor': 0.4,
            'glow_intensity': 20.0,
            'neon_color': (0.1, 1.0, 1.0)
        }
    print(f"Creating tour for labels: {label_names}")

    # --- 1. Setup Scene ---
    try:
        brain_model = bpy.data.objects['BrainModel']
    except KeyError:
        print("Error: Could not find 'BrainModel'. Ensure it's imported.")
        return 0

    try:
        camera = bpy.data.objects['SceneCamera']
    except KeyError:
        print("Error: Could not find 'SceneCamera'.")
        return 0
    
    # Create an empty object to be the target of the camera
    target_empty = bpy.data.objects.new("TourTarget", None)
    bpy.context.scene.collection.objects.link(target_empty)

    # --- 2. Animation Setup ---
    # Duration segments
    intro_duration = modifiers.get('intro_duration', 150)
    dwell_duration = modifiers.get('dwell_duration', 48)
    transition_duration = modifiers.get('transition_duration', 48)
    
    current_frame = 1
    
    # --- 3. Intro: Turntable ---
    print("Setting up intro turntable...")
    camera_animations.setup_camera_focus(camera, brain_model)
    camera_animations.create_turntable_animation(camera, brain_model, intro_duration)
    current_frame += intro_duration

    # --- 4. Region Tour ---
    # Switch focus to the target empty for the rest of the tour
    camera_animations.setup_camera_focus(camera, target_empty)
    
    # Initial location keyframe for the camera (where the turntable ended)
    camera.keyframe_insert(data_path="location", frame=current_frame)
    
    for i, label_name in enumerate(label_names):
        print(f"Processing region {i+1}: {label_name}")
        target_coords = get_center_of_label(label_name, data_dir, region_map_file, labels_file, vertices_file)
        
        if target_coords is None:
            continue
            
        # 1. Transition to new target
        target_empty.location = target_coords
        target_empty.keyframe_insert(data_path="location", frame=current_frame + transition_duration)
        
        # Calculate a nice zoom position: move camera closer along the vector
        # This is a simplification; a better dolly script would compute the vector from model center.
        cam_start_loc = np.array(camera.location)
        target_vec = np.array(target_coords)
        zoom_vec = target_vec + (cam_start_loc - target_vec) * 0.4 # Move 60% closer
        
        camera.location = tuple(zoom_vec)
        camera.keyframe_insert(data_path="location", frame=current_frame + transition_duration)
        
        # 2. Add Neon Glow to the brain model
        visual_effects.apply_neon_glow(brain_model, modifiers.get('neon_color'), modifiers.get('glow_intensity'))
        brain_model.keyframe_insert(data_path="location", frame=current_frame) # Dummy keyframe to ensure update
        
        current_frame += transition_duration
        
        # 3. Dwell at region
        target_empty.keyframe_insert(data_path="location", frame=current_frame + dwell_duration)
        camera.keyframe_insert(data_path="location", frame=current_frame + dwell_duration)
        
        current_frame += dwell_duration

    total_frames = current_frame
    bpy.context.scene.frame_start = 1
    bpy.context.scene.frame_end = total_frames

    # --- 5. Render Settings ---
    bpy.context.scene.render.image_settings.file_format = 'FFMPEG'
    bpy.context.scene.render.ffmpeg.format = 'MKV'
    bpy.context.scene.render.ffmpeg.codec = "H264"
    render_dir = os.path.join(script_dir, "render_outputs")
    os.makedirs(render_dir, exist_ok=True)
    
    # We will let render_suite.py handle the final filename for consistency

    print(f"Tour animation complete. Frames: {total_frames}")
    return total_frames

if __name__ == "__main__":
    import sys
    argv = sys.argv
    try:
        # Get labels from command line arguments after '--'
        idx = argv.index("--")
        labels_to_animate = argv[idx + 1:]
    except (ValueError, IndexError):
        labels_to_animate = ["Field CA1", "Midbrain", "Cerebellum"]

    # Check for labels_pred.npy vs labels.npy
    DATA_DIR = os.path.join(script_dir, '..', 'python')
    REGION_MAP_FILE = os.path.join(DATA_DIR, "region_map.json")
    VERTICES_FILE = os.path.join(DATA_DIR, "vertices.npy")
    
    # Use predicted labels if they exist, otherwise fallback to ground truth
    LABELS_PRED = os.path.join(DATA_DIR, "labels_pred.npy")
    LABELS_FILE = LABELS_PRED if os.path.exists(LABELS_PRED) else os.path.join(DATA_DIR, "labels.npy")
    
    create_brain_tour_animation(labels_to_animate, DATA_DIR, REGION_MAP_FILE, LABELS_FILE, VERTICES_FILE)
