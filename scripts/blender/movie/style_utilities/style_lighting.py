import bpy
import math
import random
import mathutils
from . import core

def animate_light_flicker(light_name, frame_start, frame_end, strength=0.2, seed=None):
    """Point 96: Fixed seed usage for light flicker."""
    light_obj = bpy.data.objects.get(light_name)
    if not light_obj: return

    if not light_obj.data.animation_data:
        light_obj.data.animation_data_create()
    if not light_obj.data.animation_data.action:
        light_obj.data.animation_data.action = bpy.data.actions.new(name=f"Flicker_{light_name}")

    fcurve = core.get_or_create_fcurve(light_obj.data.animation_data.action, "energy", ref_obj=light_obj.data)
    if not fcurve:
        print(f"Warning: Could not access fcurves for light {light_name}")
        return

    modifier = fcurve.modifiers.new(type='NOISE')
    modifier.strength = light_obj.data.energy * strength
    modifier.scale = 2.0
    modifier.phase = seed if seed is not None else random.random() * 100

    modifier.use_restricted_range = True
    modifier.frame_start = frame_start
    modifier.frame_end = frame_end
    modifier.blend_in = 5
    modifier.blend_out = 5

def animate_pulsing_emission(obj, frame_start, frame_end, base_strength=5.0, pulse_amplitude=10.0, cycle=48):
    """Implements a breathing light emission effect."""
    for slot in obj.material_slots:
        mat = slot.material
        if not mat: continue

        for f in range(frame_start, frame_end + 1, cycle):
            core.set_principled_socket(mat, "Emission Strength", base_strength, frame=f)
            core.set_principled_socket(mat, "Emission Strength", base_strength + pulse_amplitude, frame=f + cycle // 2)

def setup_god_rays(scene, beam_obj=None):
    """Point 98: Support passing direct beam object reference."""
    beam = beam_obj or bpy.data.objects.get("LightShaftBeam")
    if beam:
        beam.data.color = (0, 1, 0.2)
        beam.data.keyframe_insert(data_path="color", frame=401)
        beam.data.color = (1, 0.7, 0.1)
        beam.data.keyframe_insert(data_path="color", frame=3801)
        animate_light_flicker("LightShaftBeam", 1, 15000, strength=0.1)

    sun = bpy.data.objects.get("Sun")
    if sun:
        sun.data.color = (1, 0.9, 0.8)

def animate_dawn_progression(sun_light):
    """Enhancement #26: Gradual Dawn Light Progression."""
    if not sun_light: return
    colors = [
        (1, (0.1, 0.2, 0.5)),
        (4000, (1.0, 0.6, 0.2)),
        (8000, (1.0, 0.9, 0.8)),
        (15000, (1.0, 1.0, 1.0))
    ]
    for frame, color in colors:
        sun_light.data.color = color
        sun_light.data.keyframe_insert(data_path="color", frame=frame)

    sun_light.rotation_euler[0] = math.radians(-10)
    sun_light.keyframe_insert(data_path="rotation_euler", index=0, frame=1)
    sun_light.rotation_euler[0] = math.radians(-90)
    sun_light.keyframe_insert(data_path="rotation_euler", index=0, frame=15000)

def apply_interior_exterior_contrast(sun_light, cam):
    """Enhancement #27: Interior vs Exterior Light Contrast."""
    drone_ranges = [(101, 200), (401, 480), (3901, 4100), (14200, 14400)]
    for start, end in drone_ranges:
        sun_light.data.color = (0.7, 0.8, 1.0)
        sun_light.data.keyframe_insert(data_path="color", frame=start)
        sun_light.data.color = (1.0, 0.9, 0.8)
        sun_light.data.keyframe_insert(data_path="color", frame=end)

def replace_with_soft_boxes():
    """Enhancement #29: Soft Box Fill Replacement."""
    for obj in list(bpy.context.scene.objects): # List copy for safety
        if obj.type == 'LIGHT' and obj.data.type == 'AREA':
            loc = obj.location.copy()
            rot = obj.rotation_euler.copy()
            name = obj.name
            energy = obj.data.energy
            color = obj.data.color
            parent = obj.parent
            parent_type = obj.parent_type
            parent_bone = obj.parent_bone

            bpy.ops.object.select_all(action='DESELECT')
            obj.select_set(True)
            bpy.ops.object.delete()

            bpy.ops.mesh.primitive_plane_add(location=loc, rotation=rot)
            plane = bpy.context.object
            plane.name = f"SoftBox_{name}"
            
            # Point 142: Preserve parenting (Critical for rim lights attached to camera)
            if parent:
                plane.parent = parent
                plane.parent_type = parent_type
                if parent_type == 'BONE':
                    plane.parent_bone = parent_bone
                # Re-apply local transform since primitive_plane_add uses world loc by default
                plane.location = loc
                plane.rotation_euler = rot
            plane.scale = (5, 5, 1) # Larger scale (Point 142)

            mat = bpy.data.materials.new(name=f"Mat_{plane.name}")
            # Ensure nodes are enabled
            mat.use_nodes = True
            bsdf = mat.node_tree.nodes.get("Principled BSDF")
            core.set_principled_socket(mat, "Emission Color", list(color) + [1])
            # Higher factor for better exposure (Point 142)
            core.set_principled_socket(mat, "Emission Strength", energy / 100.0)
            plane.data.materials.append(mat)

def animate_distance_based_glow(gnome, characters, frame_start, frame_end):
    """Enhancement #83: Gnome Eye Glow Intensity Driver."""
    if not gnome: return

    mat = None
    for slot in gnome.material_slots:
        if "Eye" in slot.material.name:
            mat = slot.material
            break
    if not mat: return

    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if not bsdf: return
    
    socket = core.get_principled_socket(bsdf, "Emission Strength")
    if not socket: return

    fcurve = socket.driver_add("default_value")
    driver = fcurve.driver
    driver.type = 'SCRIPTED'
    
    dist_vars = []
    for i, char in enumerate(characters):
        if not char: continue
        var = driver.variables.new()
        var.name = f"dist_{i}"
        var.type = 'LOC_DIFF'
        var.targets[0].id = gnome
        var.targets[1].id = char
        dist_vars.append(f"dist_{i}")
        
    if not dist_vars:
        driver.expression = "2.0"
        return

    min_dist_expr = f"min({', '.join(dist_vars)})"
    driver.expression = f"max(2.0, 50.0 * (1.0 / max(1.0, {min_dist_expr})))"
