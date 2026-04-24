import bpy
import os
import math
import random
import mathutils

def audit_spatial_links():
    """Maps Meshes to Armatures and Textures by spatial proximity."""
    print(f"\n{'Mesh Object':<40} | {'Parent Rig':<20} | {'Location (XYZ)':<30} | {'Linked Image'}")
    print("-" * 120)
    for obj in bpy.data.objects:
        if obj.type == 'MESH':
            rig = None
            min_dist = float('inf')
            for potential_rig in [o for o in bpy.data.objects if o.type == 'ARMATURE']:
                dist = (obj.matrix_world.translation - potential_rig.matrix_world.translation).length
                if dist < min_dist:
                    min_dist = dist
                    rig = potential_rig
            img_name = "None"
            if obj.data.materials:
                mat = obj.data.materials[0]
                if mat and mat.use_nodes:
                    for node in mat.node_tree.nodes:
                        if node.type == 'TEX_IMAGE' and node.image:
                            img_name = node.image.name
            loc = tuple(round(c, 1) for c in obj.matrix_world.translation)
            print(f"{obj.name:<40} | {rig.name if rig else 'None':<20} | {str(loc):<30} | {img_name}")

    print(f"\n{'Armature Object':<30} | {'Location (XYZ)':<30}")
    print("-" * 65)
    for rig in [o for o in bpy.data.objects if o.type == 'ARMATURE']:
        loc = tuple(round(c, 1) for c in rig.matrix_world.translation)
        print(f"{rig.name:<30} | {str(loc):<30}")

def generate_weight_map_material(mesh, bone_name):
    """Generate weight map visualization material"""
    mat = bpy.data.materials.new(name="WeightHeatMap")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()
    attr = nodes.new('ShaderNodeAttribute')
    attr.attribute_name = bone_name
    ramp = nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].color = (0, 0, 1, 1) # Blue
    ramp.color_ramp.elements[1].color = (1, 0, 0, 1) # Red
    out = nodes.new('ShaderNodeOutputMaterial')
    mat.node_tree.links.new(attr.outputs['Fac'], ramp.inputs['Fac'])
    mat.node_tree.links.new(ramp.outputs['Color'], out.inputs['Surface'])
    mesh.data.materials.clear()
    mesh.data.materials.append(mat)

def render_texture_matrix():
    print("DIRECTOR: Visual rig-pose audit (Dynamic Bone Selection)...")
    output_dir = "/home/tamarojgreen/development/LLM/greenhouse_org/scripts/blender/movie/6/renders/matrix2"
    os.makedirs(output_dir, exist_ok=True)
    
    # Audit master blend first as requested
    blend_path = "/home/tamarojgreen/development/LLM/greenhouse_org/scripts/blender/movie/6/MHD2_optimized.blend"
    if bpy.ops.wm.open_mainfile(filepath=blend_path):
        audit_spatial_links()
    
    assets_dir = "/home/tamarojgreen/development/LLM/greenhouse_org/scripts/blender/movie/6/assets"
    fbx_files = [f for f in os.listdir(assets_dir) if f.endswith(".fbx")]
    
    for fbx in fbx_files:
        print(f"\n--- Processing {fbx} ---")
        bpy.ops.wm.read_factory_settings(use_empty=True)
        
        # Setup Camera
        bpy.ops.object.camera_add(location=(0, -10, 2))
        cam = bpy.context.active_object
        cam.rotation_euler = (math.radians(80), 0, 0)
        bpy.context.scene.camera = cam
        
        # Add spotlight parented to camera
        bpy.ops.object.light_add(type='SPOT', location=(0, 0, 0))
        spot = bpy.context.active_object
        spot.parent = cam
        spot.data.energy = 1000.0
        spot.data.spot_size = math.radians(60)
        
        # Import FBX
        print(f"Importing {fbx}...")
        bpy.ops.import_scene.fbx(filepath=os.path.join(assets_dir, fbx))
        
        # Force viewport update
        bpy.context.view_layer.update()
        
        # Find armature and mesh
        rig = next((o for o in bpy.data.objects if o.type == 'ARMATURE'), None)
        mesh = next((o for o in bpy.data.objects if o.type == 'MESH'), None)
        
        if not rig or not mesh:
            print(f"ERROR: Could not find armature or mesh in {fbx}")
            continue
        
        print(f"Found rig: {rig.name}, mesh: {mesh.name}")
        
        # --- FIX: Ensure parenting and Armature modifier ---
        if mesh.parent != rig:
            bpy.context.view_layer.objects.active = rig
            mesh.select_set(True)
            bpy.ops.object.parent_set(type='ARMATURE_AUTO')
        
        # Ensure armature modifier exists
        arm_mod = next((m for m in mesh.modifiers if m.type == 'ARMATURE'), None)
        if not arm_mod:
            print("Adding Armature modifier...")
            arm_mod = mesh.modifiers.new(name="Armature", type='ARMATURE')
            arm_mod.object = rig
        
        # Verify the armature modifier points to correct rig
        if arm_mod.object != rig:
            print(f"Fixing armature modifier: was {arm_mod.object.name if arm_mod.object else 'None'}, setting to {rig.name}")
            arm_mod.object = rig
        
        # Clear baked animation
        if rig.animation_data:
            rig.animation_data_clear()
        
        # Normalize Scale and Grounding
        rig.location = (0, 0, 0)
        rig.scale = (1, 1, 1)
        bpy.context.view_layer.update()
        
        # Scale to target height
        target_h = 2.0
        bbox_corners = [rig.matrix_world @ mathutils.Vector(v) for v in rig.bound_box]
        current_h = max(v.z for v in bbox_corners) - min(v.z for v in bbox_corners)
        
        if current_h > 0:
            scale_factor = target_h / current_h
            rig.scale = (scale_factor, scale_factor, scale_factor)
            bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        
        # Grounding: Move rig so lowest point is at Z=0
        bbox_corners = [rig.matrix_world @ mathutils.Vector(v) for v in rig.bound_box]
        bbox_min_z = min(v.z for v in bbox_corners)
        rig.location.z -= bbox_min_z
        
        # Force update after transforms
        bpy.context.view_layer.update()
        bpy.context.evaluated_depsgraph_get()
        
        # Camera adjustment
        cam.location = (0, -max(rig.dimensions.y, rig.dimensions.z) * 3, rig.dimensions.z * 0.5)
        bpy.context.view_layer.update()
        
        # Apply Random Pose to all bones
        print("Applying random pose...")
        bpy.context.view_layer.objects.active = rig
        bpy.ops.object.mode_set(mode='POSE')
        
        bone_count = 0
        for bone in rig.pose.bones:
            bone.rotation_euler = (math.radians(random.uniform(-15, 15)), 
                                  math.radians(random.uniform(-15, 15)), 
                                  math.radians(random.uniform(-15, 15)))
            bone_count += 1
        
        print(f"Applied random rotation to {bone_count} bones")
        bpy.ops.object.mode_set(mode='OBJECT')
        
        # Force another update to see pose changes
        bpy.context.view_layer.update()
        bpy.context.evaluated_depsgraph_get()
        
        # Debug: Check if mesh is deformed
        print(f"Checking mesh bounds after pose: {mesh.dimensions}")
        
        # Visual debugging: Set viewport display
        rig.show_in_front = True
        rig.display_type = 'WIRE'
        rig.hide_render = False
        rig.hide_viewport = False
        
        # Render Original Pose 
        rig.animation_data_clear()
        for b in rig.pose.bones: b.rotation_euler = (0,0,0)
        bpy.context.view_layer.update()
        
        frame_path_orig = os.path.join(output_dir, f"{fbx[:-4]}_original_pose.png")
        bpy.context.scene.render.filepath = frame_path_orig
        bpy.ops.render.render(write_still=True)
        
        # Apply random pose again for rigged render
        bpy.ops.object.mode_set(mode='POSE')
        for bone in rig.pose.bones:
            bone.rotation_euler = (math.radians(random.uniform(-15, 15)), 
                                  math.radians(random.uniform(-15, 15)), 
                                  math.radians(random.uniform(-15, 15)))
        bpy.ops.object.mode_set(mode='OBJECT')
        bpy.context.view_layer.update()

        # Render Rigged Pose
        frame_path_posed = os.path.join(output_dir, f"{fbx[:-4]}_rig_pose.png")
        bpy.context.scene.render.filepath = frame_path_posed
        bpy.ops.render.render(write_still=True)
        print(f"Saved pose render: {frame_path_posed}")
        
        # Render Weight Map
        target_bone = next((b for b in rig.pose.bones if b.parent is None), None)
        if target_bone:
            generate_weight_map_material(mesh, target_bone.name)
            frame_path_weight = os.path.join(output_dir, f"{fbx[:-4]}_weight_map.png")
            bpy.context.scene.render.filepath = frame_path_weight
            bpy.ops.render.render(write_still=True)
            print(f"  - Saved Weight Map: {frame_path_weight}")
        
        # Cleanup
        bpy.ops.object.select_all(action='SELECT')
        bpy.ops.object.delete()

if __name__ == "__main__":
    render_texture_matrix()
