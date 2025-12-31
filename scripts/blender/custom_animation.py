
import bpy
import json
import numpy as np
import os
import sys
import math

# Add the script's directory to the Python path
script_dir = os.path.dirname(os.path.realpath(__file__))
if script_dir not in sys.path:
    sys.path.append(script_dir)

import camera_animations
import visual_effects

def get_center_of_label(label_name, data_dir, region_map_file, labels_file, vertices_file):
    with open(region_map_file, 'r') as f:
        region_map = json.load(f)
    label_id = None
    for k, v in region_map.items():
        if v.lower() == label_name.lower():
            label_id = int(k); break
    if label_id is None: return None
    labels = np.load(labels_file)
    vertices = np.load(vertices_file)
    indices = np.where(labels == label_id)[0]
    if len(indices) == 0: return None
    return tuple(np.mean(vertices[indices], axis=0))

def create_brain_tour_animation(label_names, data_dir, region_map_file, labels_file, vertices_file, modifiers=None):
    if modifiers is None:
        modifiers = {'intro_duration': 150, 'dwell_duration': 48, 'transition_duration': 48, 'zoom_factor': 0.7, 'neon_color': (0.1, 1.0, 1.0)}

    brain_model = bpy.data.objects['BrainModel']
    camera = bpy.data.objects['SceneCamera']
    
    if "TourTarget" in bpy.data.objects:
        target_empty = bpy.data.objects["TourTarget"]
    else:
        target_empty = bpy.data.objects.new("TourTarget", None)
        bpy.context.scene.collection.objects.link(target_empty)

    intro_duration = modifiers['intro_duration']
    dwell_duration = modifiers['dwell_duration']
    transition_duration = modifiers['transition_duration']
    current_frame = 1
    
    # 1. Intro Turntable
    brain_model.display_type = 'SOLID'
    brain_model.color = (0.05, 0.05, 0.05, 1)
    camera_animations.setup_camera_focus(camera, brain_model)
    camera_animations.create_turntable_animation(camera, brain_model, intro_duration)
    current_frame += intro_duration

    # 2. Region Tour Transition
    # CRITICAL: Unparent camera and clear constraints for world-space flight
    bpy.ops.object.select_all(action='DESELECT')
    camera.select_set(True)
    bpy.context.view_layer.objects.active = camera
    bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM')
    camera.constraints.clear()
    
    camera_animations.setup_camera_focus(camera, target_empty)
    camera.keyframe_insert(data_path="location", frame=current_frame)
    
    with open(region_map_file, 'r') as f:
        region_map = json.load(f)
    labels = np.load(labels_file)

    for label_name in label_names:
        target_coords = get_center_of_label(label_name, data_dir, region_map_file, labels_file, vertices_file)
        if target_coords is None: continue
            
        target_empty.location = target_coords
        target_empty.keyframe_insert(data_path="location", frame=current_frame + transition_duration)
        
        cam_start = np.array(camera.location)
        zoom_vec = np.array(target_coords) + (cam_start - np.array(target_coords)) * modifiers['zoom_factor']
        camera.location = tuple(zoom_vec)
        camera.keyframe_insert(data_path="location", frame=current_frame + transition_duration)
        
        h_name = f"Highlight_{label_name.replace(' ', '_')}"
        if h_name not in bpy.data.objects:
            bpy.ops.object.select_all(action='DESELECT')
            brain_model.select_set(True)
            bpy.context.view_layer.objects.active = brain_model
            
            label_id = next((int(k) for k, v in region_map.items() if v.lower() == label_name.lower()), None)
            if label_id is not None:
                for v in brain_model.data.vertices:
                    v.select = (v.index < len(labels) and labels[v.index] == label_id)
                
                bpy.ops.object.mode_set(mode='EDIT')
                bpy.ops.mesh.duplicate_move()
                bpy.ops.mesh.separate(type='SELECTED')
                bpy.ops.object.mode_set(mode='OBJECT')
                
                h_obj = next((o for o in bpy.context.selected_objects if o != brain_model), None)
                if h_obj:
                    h_obj.name = h_name
                    h_obj.modifiers.clear()
                    # Decimate for performance
                    dec = h_obj.modifiers.new(name="StabilityDecimate", type='DECIMATE')
                    dec.ratio = 0.2
                    bpy.context.view_layer.objects.active = h_obj
                    bpy.ops.object.modifier_apply(modifier="StabilityDecimate")
                    
                    visual_effects.apply_textured_highlight(h_obj, color=modifiers['neon_color'])
                    h_obj.show_in_front = True
        
        h_obj = bpy.data.objects.get(h_name)
        if h_obj:
            h_obj.hide_render = True
            h_obj.keyframe_insert(data_path="hide_render", frame=current_frame - 1)
            h_obj.hide_render = False
            h_obj.keyframe_insert(data_path="hide_render", frame=current_frame)
            h_obj.keyframe_insert(data_path="hide_render", frame=current_frame + transition_duration + dwell_duration)
            h_obj.hide_render = True
            h_obj.keyframe_insert(data_path="hide_render", frame=current_frame + transition_duration + dwell_duration + 1)

        current_frame += transition_duration + dwell_duration
        target_empty.keyframe_insert(data_path="location", frame=current_frame)
        camera.keyframe_insert(data_path="location", frame=current_frame)

    bpy.context.scene.frame_end = current_frame
    return current_frame

if __name__ == "__main__":
    pass
