
import bpy
import json
import numpy as np
import os
import sys
import math
import bmesh

# Add script dir to path
script_dir = os.path.dirname(os.path.abspath(__file__))
if script_dir not in sys.path:
    sys.path.append(script_dir)

import camera_animations
import viscripts/blender/render_optimized.pysual_effects

def get_region_data(label_name, region_map_file, labels_file, vertices_file):
    with open(region_map_file, 'r') as f:
        region_map = json.load(f)
    
    label_id = next((int(k) for k, v in region_map.items() if v.lower() == label_name.lower()), None)
    if label_id is None: return None, None
    
    labels = np.load(labels_file)
    indices = np.where(labels == label_id)[0]
    return label_id, indices

def add_background_logo(logo_path):
    if not os.path.exists(logo_path):
        return

    if "LogoPlane" in bpy.data.objects:
        return

    bpy.ops.mesh.primitive_plane_add(size=30, location=(0, 20, 0), rotation=(math.radians(90), 0, math.radians(90)))
    plane = bpy.context.active_object
    plane.name = "LogoPlane"

    mat = bpy.data.materials.new(name="LogoMaterial")
    plane.data.materials.append(mat)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    output = nodes.new(scripts/blender/render_optimized.pytype='ShaderNodeOutputMaterial')
    emission = nodes.new(type='ShaderNodeEmission')
    tex_image = nodes.new(type='ShaderNodeTexImage')
    
    tex_image.image = bpy.data.images.load(logo_path)

    links.new(tex_image.outputs['Color'], emission.inputs['Color'])
    emission.inputs['Strength'].default_value = 5.0
    links.new(emission.outputs['Emission'], output.inputs['Surface'])
    
    bpy.context.view_layer.objects.active = plane
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.unwrap()
    bpy.ops.object.mode_set(mode='OBJECT')

def create_bscripts/blender/render_optimized.pyrain_tour_animation(label_names, data_dir, region_map_file, labels_file, vertices_file, modifiers=None):
    """
    STABLE Implementation following Plan 01.
    Uses Data-Block duplication and explicit mesh validation to prevent engine segfaults.
    """
    if modifiers is None:
        modifiers = {
            'intro_duration': 4,
            'dwell_duration': 8,
            'transition_duration': 4,
            'zoom_factor': 0.7, 
            'neon_color': (0.1, 1.0, 1.0)
        }

    # Set FPS
    bpy.context.scene.render.fps = 2
    
    # Add Logo
    logo_path = os.path.join(script_dir, "..", "..", "docs", "images", "Greenhouse_Logo.png")
    add_background_logo(logo_path)

    # --- Step 1: Hierarchy ---
    try:
        brain_model = bpy.data.objects['BrainModel']
        camera = bpy.data.objects['SceneCamera']
    except KeyError:
        return 0

    pivot, rig = camera_animations.setup_camera_rig(camera)
    
    if "TourTarget" in bpy.data.objects:
        target_empty = bpy.data.objects["TourTarget"]
    else:
        target_empty = bpy.data.objects.new("TourTarget", None)
        bpy.context.scene.collection.objects.link(target_empty)

    if "ROICollection" not in bpy.data.collections:
        roi_col = bpy.data.collections.new("ROICollection")
        bpy.context.scene.collection.children.link(roi_col)
    else:
        roi_col = bpy.data.collections["ROICollection"]

    intro_duration = modifiers['intro_duration']
    dwell_duration = modifiers['dwell_duration']
    transition_duration = modifiers['transition_duration']
    
    # --- Step 2: Turntable ---
    camera_animations.animate_turntable(pivot, intro_duration)
    rig.location = (0, -12, 2)
    rig.keyframe_insert(data_path="location", frame=1)
    rig.keyframe_insert(data_path="location", frame=intro_duration)
    
    track_brain = camera_animations.setup_camera_track(camera, brain_model, name="Brain")
    track_tour = camera_animations.setup_camera_track(camera, target_empty, name="Tour")
    
    track_brain.influence = 1.0
    track_brain.keyframe_insert(data_path="influence", frame=1)
    track_tour.influence = 0.0
    track_tour.keyframe_insert(data_path="influence", frame=1)
    
    fade_start = intro_duration
    fade_end = intro_duration + 4
    
    track_brain.keyframe_insert(data_path="influence", frame=fade_start)
    track_tour.keyframe_insert(data_path="influence", frame=fade_start)
    track_brain.influence = 0.0
    track_brain.keyframe_insert(data_path="influence", frame=fade_end)
    track_tour.influence = 1.0
    track_tour.keyframescripts/blender/render_optimized.py_insert(data_path="influence", frame=fade_end)
    
    current_frame = fade_end

    # --- Step 3: ROI Tour ---
    vertices_data = np.load(vertices_file)

    for label_name in label_names:
        label_id, indices = get_region_data(label_name, region_map_file, labels_file, vertices_file)
        if label_id is None or len(indices) == 0: continue
        center = tuple(np.mean(vertices_data[indices], axis=0))

        # 3.1 & 3.2 Movement
        target_empty.location = center
        target_empty.keyframe_insert(data_path="location", frame=current_frame + transition_duration)
        zoom_dist = 12.0 * modifiers['zoom_factor']
        rig.location = (0, -zoom_dist, 2)
        rig.keyframe_insert(data_path="location", frame=current_frame + transition_duration)
        
        # 3.3 ROI Isolation (Protocol A-C)
        h_name = f"Highlight_{label_name.replace(' ', '_')}"
        if h_name not in bpy.data.objects:
            # FIX: Use data-block copy() for 100% stability
            h_obj = brain_model.copy()
            h_obj.data = brain_model.data.copy()
            h_obj.name = h_name
            roi_col.objects.link(h_obj)
            h_obj.modifiers.clear()
            
            # BMesh Isolation
            bm = bmesh.new()
            bm.from_mesh(h_obj.data)
            bm.verts.ensscripts/blender/render_optimized.pyure_lookup_table()
            valid_indices = set(indices)
            to_delete = [v for v in bm.verts if v.index not in valid_indices]
            bmesh.ops.delete(bm, geom=to_delete, context='VERTS')
            bm.to_mesh(h_obj.data)
            bm.free()
            
            # CRITICAL: Validate and update the mesh for the renderer
            h_obj.data.update()
            h_obj.data.validate()
            
            # Step D: Aesthetics
            visual_effects.apply_textured_highlight(h_obj, color=modifiers['neon_color'])
            h_obj.display_type = 'SOLID'

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
        rig.keyframe_insert(data_path="location", frame=current_frame)

    bpy.context.scene.frame_end = current_frame
    return current_frame
