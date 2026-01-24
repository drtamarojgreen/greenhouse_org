
import bpy
import os
import sys
import math
import mathutils
import argparse
import bmesh
import numpy as np

# Ensure script directory is in sys.path
script_dir = os.path.dirname(os.path.abspath(__file__))
if script_dir not in sys.path:
    sys.path.append(script_dir)

import neuron_physics
import custom_animation
import visual_effects

def animate_neurons(frame_count):
    """
    Adds subtle random movement to neurons to demonstrate dynamic connections.
    """
    if "Neurons" not in bpy.data.collections:
        return
        
    for neuron in bpy.data.collections["Neurons"].objects:
        # Ensure we have animation data
        if not neuron.animation_data:
            neuron.animation_data_create()
        
        # Keyframe initial position to establish curves
        neuron.keyframe_insert(data_path="location", frame=1)
        
        # Add noise to X, Y, Z
        if neuron.animation_data.action:
            for fcurve in neuron.animation_data.action.fcurves:
                # Clear existing modifiers to be safe
                for mod in fcurve.modifiers:
                    fcurve.modifiers.remove(mod)
                    
                mod = fcurve.modifiers.new('NOISE')
                mod.scale = 20.0
                mod.strength = 0.2 # Subtle jitter
                mod.phase = abs(hash(neuron.name)) % 100

def create_axons(brain_obj, max_distance=2.5, max_connections=3):
    """
    Creates dynamic visual connections (axons) between neurons.
    Uses hooks to ensure axons stay connected if neurons move.
    """
    if "Neurons" not in bpy.data.collections:
        return

    neurons = list(bpy.data.collections["Neurons"].objects)
    if not neurons:
        return

    # Create a collection for axons
    if "Axons" not in bpy.data.collections:
        axon_col = bpy.data.collections.new("Axons")
        bpy.context.scene.collection.children.link(axon_col)
    else:
        axon_col = bpy.data.collections["Axons"]

    # Material for axons (Glowing Blue/Cyan)
    mat = bpy.data.materials.new(name="AxonMaterial")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    emission = nodes.new(type='ShaderNodeEmission')
    emission.inputs['Color'].default_value = (0.4, 0.8, 1.0, 1.0) 
    emission.inputs['Strength'].default_value = 5.0
    output = nodes.new(type='ShaderNodeOutputMaterial')
    links.new(emission.outputs[0], output.inputs[0])

    created_pairs = set()

    # Ensure Object Mode
    if bpy.context.object and bpy.context.object.mode != 'OBJECT':
        bpy.ops.object.mode_set(mode='OBJECT')

    for i, n1 in enumerate(neurons):
        neighbors = []
        for j, n2 in enumerate(neurons):
            if i == j: continue
            
            # Avoid duplicate connections
            pair_id = tuple(sorted((n1.name, n2.name)))
            if pair_id in created_pairs: continue

            dist = (n1.location - n2.location).length
            if dist < max_distance:
                neighbors.append((dist, n2, pair_id))
        
        # Connect to closest neighbors
        neighbors.sort(key=lambda x: x[0])
        
        for dist, n2, pair_id in neighbors[:max_connections]:
            # Create Curve Data
            curve_data = bpy.data.curves.new('axondata', type='CURVE')
            curve_data.dimensions = '3D'
            curve_data.resolution_u = 4
            curve_data.bevel_depth = 0.02
            curve_data.bevel_resolution = 2
            
            # Create Spline (Bezier)
            spline = curve_data.splines.new('BEZIER')
            spline.bezier_points.add(1)
            
            p0 = spline.bezier_points[0]
            p1 = spline.bezier_points[1]
            
            p0.co = n1.location
            p1.co = n2.location
            
            p0.handle_left_type = 'AUTO'
            p0.handle_right_type = 'AUTO'
            p1.handle_left_type = 'AUTO'
            p1.handle_right_type = 'AUTO'
            
            curve_obj = bpy.data.objects.new('Axon', curve_data)
            curve_obj.data.materials.append(mat)
            axon_col.objects.link(curve_obj)
            
            curve_obj.parent = brain_obj
            
            # Add Hooks
            bpy.context.view_layer.objects.active = curve_obj
            
            mod1 = curve_obj.modifiers.new(name="Hook_N1", type='HOOK')
            mod1.object = n1
            mod2 = curve_obj.modifiers.new(name="Hook_N2", type='HOOK')
            mod2.object = n2
            
            # Assign P0 to Hook_N1
            p0.select_control_point = True
            p1.select_control_point = False
            bpy.ops.object.mode_set(mode='EDIT')
            bpy.ops.object.hook_assign(modifier="Hook_N1")
            bpy.ops.object.mode_set(mode='OBJECT')
            
            # Assign P1 to Hook_N2
            p0.select_control_point = False
            p1.select_control_point = True
            bpy.ops.object.mode_set(mode='EDIT')
            bpy.ops.object.hook_assign(modifier="Hook_N2")
            bpy.ops.object.mode_set(mode='OBJECT')
            
            created_pairs.add(pair_id)

def create_brain_logo_animation(output_path, frame_count=20):
    """
    Creates and renders a short test animation with a textured brain
    in the foreground and the Greenhouse logo on a plane in the background.
    """
    try:
        # --- 1. Scene Setup ---
        bpy.ops.object.select_all(action='SELECT')
        bpy.ops.object.delete(use_global=False)
        scene = bpy.context.scene

        # --- 2. Render Settings ---
        scene.render.engine = 'CYCLES'
        scene.cycles.samples = 128
        scene.render.resolution_x = 1280
        scene.render.resolution_y = 720
        scene.frame_start = 1
        scene.frame_end = frame_count
        scene.render.fps = 2
        scene.render.filepath = output_path
        scene.render.image_settings.file_format = 'FFMPEG'
        scene.render.ffmpeg.format = 'MPEG4'
        scene.render.ffmpeg.codec = 'H264'

        # --- 3. Load Textured Brain (from simple_render_test.py) ---
        script_dir = os.path.dirname(os.path.abspath(__file__))
        fbx_path = os.path.join(script_dir, "brain.fbx")
        if os.path.exists(fbx_path):
            bpy.ops.import_scene.fbx(filepath=fbx_path)
            brain_obj = bpy.context.selected_objects[0]
            brain_obj.name = "BrainModel"
            
            # Ensure origin is centered for proper scaling
            bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
            
            mat = bpy.data.materials.new(name="BrainMaterial")
            brain_obj.data.materials.append(mat)
            mat.use_nodes = True
            bsdf = mat.node_tree.nodes.get('Principled BSDF')
            tex_noise = mat.node_tree.nodes.new('ShaderNodeTexNoise')
            tex_noise.inputs['Scale'].default_value = 5.0
            color_ramp = mat.node_tree.nodes.new('ShaderNodeValToRGB')
            color_ramp.color_ramp.elements[0].color = (0.8, 0.1, 0.1, 1)
            mat.node_tree.links.new(tex_noise.outputs['Fac'], color_ramp.inputs['Fac'])
            mat.node_tree.links.new(color_ramp.outputs['Color'], bsdf.inputs['Base Color'])
            bsdf.inputs['Alpha'].default_value = 0.75
        else:
            print(f"Warning: brain.fbx not found at {fbx_path}")
            bpy.ops.mesh.primitive_cube_add(size=2, location=(0,0,0))
            brain_obj = bpy.context.active_object
            brain_obj.name = "BrainModel"

        # Position the brain centered between camera (Y=-20) and text (Y=10)
        # and vertically aligned with the text center (approx Z=5)
        brain_obj.location = (0, -5, 5)

        # Animate brain scale
        mid_frame = int(frame_count / 2)
        brain_obj.scale = (2.0, 2.0, 2.0)
        brain_obj.keyframe_insert(data_path="scale", frame=1)
        brain_obj.scale = (3.0, 3.0, 3.0)
        brain_obj.keyframe_insert(data_path="scale", frame=mid_frame)
        brain_obj.scale = (2.0, 2.0, 2.0)
        brain_obj.keyframe_insert(data_path="scale", frame=frame_count)

        # --- 3b. Add Neurons and Regions ---
        # Neurons
        neuron_physics.create_neuron_cloud(count=50, radius=2.0)
        if "Neurons" in bpy.data.collections:
            for n_obj in bpy.data.collections["Neurons"].objects:
                n_obj.parent = brain_obj
        
        # Animate Neurons
        animate_neurons(frame_count)
        
        # Create Axons connecting the neurons
        create_axons(brain_obj)

        # Regions
        DATA_DIR = os.path.join(script_dir, '..', 'python')
        REGION_MAP_FILE = os.path.join(DATA_DIR, "region_map.json")
        VERTICES_FILE = os.path.join(DATA_DIR, "vertices.npy")
        LABELS_FILE = os.path.join(DATA_DIR, "labels.npy")

        # Highlight a region (e.g., Hippocampus)
        label_name = "Hippocampus"
        label_id, indices = custom_animation.get_region_data(label_name, REGION_MAP_FILE, LABELS_FILE, VERTICES_FILE)
        
        if label_id is not None and len(indices) > 0:
            h_name = f"Highlight_{label_name}"
            h_obj = brain_obj.copy()
            h_obj.data = brain_obj.data.copy()
            h_obj.name = h_name
            scene.collection.objects.link(h_obj)
            h_obj.modifiers.clear()
            h_obj.animation_data_clear()
            
            # Isolate geometry
            bm = bmesh.new()
            bm.from_mesh(h_obj.data)
            bm.verts.ensure_lookup_table()
            valid_indices = set(indices)
            to_delete = [v for v in bm.verts if v.index not in valid_indices]
            bmesh.ops.delete(bm, geom=to_delete, context='VERTS')
            bm.to_mesh(h_obj.data)
            bm.free()
            
            visual_effects.apply_textured_highlight(h_obj, color=(1.0, 0.8, 0.2))
            h_obj.parent = brain_obj
            h_obj.location = (0,0,0)
            h_obj.rotation_euler = (0,0,0)
            h_obj.scale = (1,1,1)

        # --- 4. Add Background Plane with Logo (from test_logo_animation.py) ---
        bpy.ops.mesh.primitive_plane_add(size=30, location=(0, 20, 0), rotation=(math.radians(90), 0, 0))
        plane = bpy.context.active_object
        plane.name = "LogoPlane"
        
        plane_mat = bpy.data.materials.new(name="LogoMaterial")
        plane.data.materials.append(plane_mat)
        plane_mat.use_nodes = True
        nodes = plane_mat.node_tree.nodes
        links = plane_mat.node_tree.links
        nodes.clear()

        output = nodes.new(type='ShaderNodeOutputMaterial')
        emission = nodes.new(type='ShaderNodeEmission')
        tex_image = nodes.new(type='ShaderNodeTexImage')
        
        logo_path = os.path.join(script_dir, "..", "..", "docs", "images", "Greenhouse_Logo.png")
        if os.path.exists(logo_path):
            tex_image.image = bpy.data.images.load(logo_path)

        links.new(tex_image.outputs['Color'], emission.inputs['Color'])
        emission.inputs['Strength'].default_value = 5.0
        links.new(emission.outputs['Emission'], output.inputs['Surface'])

        bpy.context.view_layer.objects.active = plane
        bpy.ops.object.mode_set(mode='EDIT')
        bpy.ops.mesh.select_all(action='SELECT')
        bpy.ops.uv.unwrap()
        bpy.ops.object.mode_set(mode='OBJECT')

        # Add Point Axis behind the logo for tracking
        bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0, 25, 0))
        target_axis = bpy.context.active_object
        target_axis.name = "CameraTarget"

        # --- 5. Add 3D Text ---
        text_lines = ["Greenhouse", "for", "Mental Health", "Development"]
        text_objects = []
        line_height = -3.5
        total_text_height = (len(text_lines) - 1) * abs(line_height)
        start_z = (total_text_height / 2) + 5.0

        text_mat = bpy.data.materials.new(name="TextMaterial")
        text_mat.use_nodes = True
        text_bsdf = text_mat.node_tree.nodes.get('Principled BSDF')
        text_bsdf.inputs['Base Color'].default_value = (0.2, 0.8, 0.2, 1)
        text_bsdf.inputs['Metallic'].default_value = 1.0
        text_bsdf.inputs['Roughness'].default_value = 0.2

        for i, line in enumerate(text_lines):
            bpy.ops.object.text_add(location=(0, 10, start_z + i * line_height), rotation=(math.radians(90), 0, 0))
            text_obj = bpy.context.active_object
            text_obj.name = f"TextLine_{i}"
            text_obj.data.body = line
            text_obj.data.align_x = 'CENTER'
            text_obj.data.align_y = 'CENTER'
            text_obj.data.size = 3.0
            text_obj.data.extrude = 0.2
            text_obj.data.bevel_depth = 0.05
            
            text_obj.data.materials.append(text_mat)
            text_objects.append(text_obj)
            
        for obj in text_objects:
            bpy.context.view_layer.objects.active = obj
            bpy.ops.object.convert(target='MESH')

        # --- 6. Camera Animation ---
        camera_z_pos = start_z + (len(text_lines) - 1) * line_height / 2
        bpy.ops.object.camera_add(location=(-10, -35, camera_z_pos))
        camera = bpy.context.active_object
        camera.data.lens = 35 # Fit size 30 logo at distance 55
        scene.camera = camera

        # Add Track To constraint
        tt_cam = camera.constraints.new(type='TRACK_TO')
        tt_cam.target = target_axis
        tt_cam.track_axis = 'TRACK_NEGATIVE_Z'
        tt_cam.up_axis = 'UP_Y'
        
        # Animate camera position and rotation
        # Frame 1
        bpy.context.scene.frame_set(1)
        camera.location = (-10, -35, camera_z_pos)
        camera.keyframe_insert(data_path="location", index=-1)

        # Frame Mid
        bpy.context.scene.frame_set(mid_frame)
        camera.location = (10, -35, camera_z_pos)
        camera.keyframe_insert(data_path="location", index=-1)

        # Frame End
        bpy.context.scene.frame_set(frame_count)
        camera.location = (-10, -35, camera_z_pos)
        camera.keyframe_insert(data_path="location", index=-1)
        
        # --- 7. Lighting ---
        bpy.ops.object.light_add(type='SUN', location=(5, -5, 10))
        light = bpy.context.active_object
        light.data.energy = 5.0

        # Add Spotlight
        bpy.ops.object.light_add(type='SPOT', location=(0, -15, 15))
        spot = bpy.context.active_object
        spot.data.energy = 3000.0
        spot.data.spot_size = math.radians(45)
        spot.data.spot_blend = 0.5
        tt = spot.constraints.new(type='TRACK_TO')
        tt.target = brain_obj
        tt.track_axis = 'TRACK_NEGATIVE_Z'
        tt.up_axis = 'UP_Y'

        # --- 8. Render ---
        print(f"Starting {frame_count}-frame test animation render...")
        bpy.ops.render.render(animation=True)
        print("Render complete.")
        return (True, f"Successfully rendered to {output_path}")

    except Exception as e:
        return (False, f"An error occurred: {e}")


if __name__ == "__main__":
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1:]
    else:
        argv = []

    parser = argparse.ArgumentParser(description="Render a short test animation of a brain with a logo background.")
    parser.add_argument("--output-mp4", required=True, help="Path for the output MP4 file.")
    args = parser.parse_args(argv)

    output_dir = os.path.dirname(args.output_mp4)
    if output_dir:
        os.makedirs(output_dir, exist_ok=True)

    success, message = create_brain_logo_animation(args.output_mp4)
    if success:
        print(message)
    else:
        print(message)
        sys.exit(1)
