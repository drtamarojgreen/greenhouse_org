
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
    # Make the brain translucent for intro if we want to see neurons
    brain_model.display_type = 'WIRE' if modifiers.get('show_internal', True) else 'SOLID'
    brain_model.show_transparent = True
    
    camera_animations.setup_camera_focus(camera, brain_model)
    camera_animations.create_turntable_animation(camera, brain_model, intro_duration)
    current_frame += intro_duration

    # --- 3.5 Setup Highlight Material ---
    visual_effects.setup_highlight_material(brain_model, label_names, highlight_color=modifiers.get('neon_color'))

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
        
        # Calculate a nice zoom position: move camera further back
        cam_start_loc = np.array(camera.location)
        target_vec = np.array(target_coords)
        # Move only 30% closer instead of 60% to avoid entering the mesh
        zoom_vec = target_vec + (cam_start_loc - target_vec) * 0.7 
        
        camera.location = tuple(zoom_vec)
        camera.keyframe_insert(data_path="location", frame=current_frame + transition_duration)
        
        # 2. Add ROI-specific highlighting (Separate Object approach for Workbench)
        safe_name = label_name.replace(" ", "_")
        highlight_obj_name = f"Highlight_{safe_name}"
        
        if highlight_obj_name not in bpy.data.objects:
            # Duplicate the brain model to extract the region
            bpy.ops.object.select_all(action='DESELECT')
            brain_model.select_set(True)
            bpy.context.view_layer.objects.active = brain_model
            bpy.ops.object.duplicate()
            h_obj = bpy.context.active_object
            h_obj.name = highlight_obj_name
            
            # Enter Edit Mode and delete everything except the label
            bpy.ops.object.mode_set(mode='EDIT')
            bpy.ops.mesh.select_all(action='DESELECT')
            bpy.ops.object.mode_set(mode='OBJECT')
            
            # Use NumPy to find vertices to keep
            label_id = None
            with open(region_map_file, 'r') as f:
                region_map = json.load(f)
            for k, v in region_map.items():
                if v.lower() == label_name.lower():
                    label_id = int(k)
                    break
            
            if label_id is not None:
                labels = np.load(labels_file)
                print(f"DEBUG: Mesh has {len(h_obj.data.vertices)} vertices. Labels array has {len(labels)} entries.")
                
                # Switch to edit mode to perform the split
                bpy.ops.object.mode_set(mode='EDIT')
                bpy.ops.mesh.select_all(action='DESELECT')
                bpy.ops.object.mode_set(mode='OBJECT')
                
                # Select vertices belonging to this label
                select_count = 0
                for v in h_obj.data.vertices:
                    if v.index < len(labels) and labels[v.index] == label_id:
                        v.select = True
                        select_count += 1
                
                print(f"DEBUG: Selected {select_count} vertices for label {label_name}.")
                
                bpy.ops.object.mode_set(mode='EDIT')
                # In edit mode, selection should persist from object mode
                bpy.ops.mesh.select_all(action='INVERT')
                bpy.ops.mesh.delete(type='VERT')
                bpy.ops.object.mode_set(mode='OBJECT')
                
                # Set Highlight appearance
                visual_effects.apply_textured_highlight(h_obj, color=modifiers.get('neon_color', (0, 1, 1)))
                h_obj.show_wire = False # Use material color/texture instead of wire
                h_obj.display_type = 'SOLID'
            else:
                h_obj.hide_viewport = h_obj.hide_render = True
        
        h_obj = bpy.data.objects[highlight_obj_name]
        
        # Keyframe visibility: Only show during transition and dwell
        h_obj.hide_render = True
        h_obj.keyframe_insert(data_path="hide_render", frame=current_frame - 1)
        
        h_obj.hide_render = False
        h_obj.keyframe_insert(data_path="hide_render", frame=current_frame)
        
        # Keep visible during dwell
        h_obj.keyframe_insert(data_path="hide_render", frame=current_frame + transition_duration + dwell_duration)
        
        h_obj.hide_render = True
        h_obj.keyframe_insert(data_path="hide_render", frame=current_frame + transition_duration + dwell_duration + 1)

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
