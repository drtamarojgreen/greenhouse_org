import bpy
import bmesh
import mathutils
import math
import random
import os
import sys

# Ensure style_utilities and other movie modules are accessible
MOVIE_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if MOVIE_ROOT not in sys.path:
    sys.path.append(MOVIE_ROOT)

import style_utilities as style
from .facial_utilities_v4 import create_facial_props_v4

def create_bark_material_v4(name, color=(0.05, 0.02, 0.01)):
    """High-Contrast Mahogany Bark for Chroma Keying."""
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    nodes.clear()
    
    node_out = nodes.new('ShaderNodeOutputMaterial')
    node_bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    links.new(node_bsdf.outputs['BSDF'], node_out.inputs['Surface'])
    
    # Base Color: Very Dark Mahogany
    node_bsdf.inputs['Base Color'].default_value = (*color, 1)
    node_bsdf.inputs['Roughness'].default_value = 0.98 # Matte
    style.set_principled_socket(node_bsdf, "Subsurface Weight", 0.02) # Near zero to prevent green bleed
    
    node_noise = nodes.new('ShaderNodeTexNoise')
    node_noise.inputs['Scale'].default_value = 100.0
    node_bump = nodes.new('ShaderNodeBump')
    node_bump.inputs['Strength'].default_value = 0.3
    links.new(node_noise.outputs['Fac'], node_bump.inputs['Height'])
    links.new(node_bump.outputs['Normal'], node_bsdf.inputs['Normal'])
    
    return mat

def setup_production_lighting(subjects):
    """Adds 6-point lighting (Rim, HeadKey, LegKey) for full-body isolation."""
    for i, obj in enumerate(subjects):
        armature = obj.parent if obj.parent and obj.parent.type == 'ARMATURE' else None
        # Use world matrix to find actual location
        base_loc = obj.matrix_world.translation
        
        # 1. RIM LIGHT (High & Behind)
        rim_name = f"RimLight_{obj.name}"
        if rim_name not in bpy.data.objects:
            loc = (base_loc.x, base_loc.y + 3.0, base_loc.z + 3.0)
            bpy.ops.object.light_add(type='SPOT', location=loc)
            rim = bpy.context.active_object
            rim.name = rim_name
            rim.data.energy = 12000.0; rim.data.spot_size = math.radians(40)
            rim.data.color = (1.0, 0.9, 0.8)
            t = rim.constraints.new(type='TRACK_TO')
            t.target = armature if armature else obj
            if armature: t.subtarget = "Head"
            t.track_axis = 'TRACK_NEGATIVE_Z'; t.up_axis = 'UP_Y'
            
        # 2. HEAD KEY (Front-High - Cross Lighting)
        key_name = f"HeadKey_{obj.name}"
        if key_name not in bpy.data.objects:
            # Shared focal point between characters for cross-lighting
            mid_name = "Lighting_Midpoint"
            if mid_name not in bpy.data.objects:
                mid = bpy.data.objects.new(mid_name, None)
                mid.location = (0, 0, 2.2) # Between faces
                bpy.context.scene.collection.objects.link(mid)
            else:
                mid = bpy.data.objects.get(mid_name)

            # Offset significantly in X to provide volume
            x_side = 3.5 if base_loc.x > 0 else -3.5
            loc = (base_loc.x + x_side, base_loc.y - 6.0, base_loc.z + 2.0)
            bpy.ops.object.light_add(type='SPOT', location=loc)
            key = bpy.context.active_object
            key.name = key_name
            key.data.energy = 10000.0; key.data.spot_size = math.radians(45)
            key.data.color = (0.95, 1.0, 1.0)
            t = key.constraints.new(type='TRACK_TO')
            t.target = mid # Track the shared midpoint for cross-face lighting
            t.track_axis = 'TRACK_NEGATIVE_Z'; t.up_axis = 'UP_Y'

        # 3. LEG KEY (Front-Low)
        leg_name = f"LegKey_{obj.name}"
        if leg_name not in bpy.data.objects:
            loc = (obj.location.x * 1.5, obj.location.y - 4.0, 0.5)
            bpy.ops.object.light_add(type='SPOT', location=loc)
            leg = bpy.context.active_object
            leg.name = leg_name
            leg.data.energy = 5000.0; leg.data.spot_size = math.radians(50)
            leg.data.color = (1.0, 1.0, 0.95)
            t = leg.constraints.new(type='TRACK_TO')
            t.target = armature if armature else obj
            if armature: t.subtarget = "Torso"
            t.track_axis = 'TRACK_NEGATIVE_Z'; t.up_axis = 'UP_Y'

def create_iris_material_v4(name, color=(0.2, 0.5, 0.1)):
    """Advanced Eye Shader with Depth."""
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    nodes.clear()
    
    node_bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    node_out = nodes.new('ShaderNodeOutputMaterial')
    links.new(node_bsdf.outputs['BSDF'], node_out.inputs['Surface'])
    
    # Color & Texture Mapping (REFINED with Pupil)
    tex_coord = nodes.new('ShaderNodeTexCoord')
    mapping = nodes.new('ShaderNodeMapping')
    mapping.name = "PupilMapping"
    links.new(tex_coord.outputs['Object'], mapping.inputs['Vector'])
    mapping.inputs['Scale'].default_value = (16.6, 0.0, 16.6) # Flattens Y to cylinder, sizes to eye bounds
    
    # 1. Iris Base
    grad = nodes.new('ShaderNodeTexGradient')
    grad.gradient_type = 'QUADRATIC_SPHERE'
    links.new(mapping.outputs['Vector'], grad.inputs['Vector'])
    
    # 2. Pupil (Internal Black circle - Inverted Mapping)
    pupil_cr = nodes.new('ShaderNodeValToRGB')
    pupil_cr.color_ramp.elements[0].position = 0.50
    pupil_cr.color_ramp.elements[0].color = (1, 1, 1, 1) # White
    pupil_cr.color_ramp.elements[1].position = 0.60
    pupil_cr.color_ramp.elements[1].color = (0, 0, 0, 1) # Black
    links.new(grad.outputs['Fac'], pupil_cr.inputs['Fac'])
    
    # 3. Iris Color
    iris_cr = nodes.new('ShaderNodeValToRGB')
    iris_cr.color_ramp.elements[0].color = (color[0]*0.2, color[1]*0.2, color[2]*0.2, 1.0) # Outer Dark
    iris_cr.color_ramp.elements[1].color = (color[0], color[1], color[2], 1.0) # Inner Bright
    links.new(grad.outputs['Fac'], iris_cr.inputs['Fac'])
    
    # 4. Combine
    mix = nodes.new('ShaderNodeMixRGB')
    mix.blend_type = 'MULTIPLY'
    links.new(pupil_cr.outputs['Color'], mix.inputs[1])
    links.new(iris_cr.outputs['Color'], mix.inputs[2])
    
    links.new(mix.outputs['Color'], node_bsdf.inputs['Base Color'])
    node_bsdf.inputs['Roughness'].default_value = 0.1
    node_bsdf.inputs['Coat Weight'].default_value = 1.0 # Clear coat for moisture
    
    return mat

def create_leaf_material_v4(name, color=(0.4, 0.6, 0.2)):
    """Translucent botanical leaf material."""
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    nodes.clear()
    
    node_bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    node_out = nodes.new('ShaderNodeOutputMaterial')
    links.new(node_bsdf.outputs['BSDF'], node_out.inputs['Surface'])
    
    style.set_principled_socket(node_bsdf, "Base Color", (*color, 1))
    style.set_principled_socket(node_bsdf, "Subsurface Weight", 0.5)
    style.set_principled_socket(node_bsdf, "Transmission Weight", 0.2)
    node_bsdf.inputs['Roughness'].default_value = 0.4
    
    return mat

def create_plant_humanoid_v4(name, location, height_scale=1.0, seed=None):
    """
    Upgraded Plant Humanoid for Scene 4:
    - Full rig with Shoulders, Elbows, Hips, Knees.
    - Structural mesh for Shoulders/Hips.
    - Dual lips and Eyelids.
    """
    location = mathutils.Vector(location)
    if seed is not None: random.seed(seed)
    
    # 1. Armature
    armature_data = bpy.data.armatures.new(f"{name}_ArmatureData")
    armature_obj = bpy.data.objects.new(name, armature_data)
    bpy.context.scene.collection.objects.link(armature_obj); armature_obj.location = location
    bpy.context.view_layer.objects.active = armature_obj; bpy.ops.object.mode_set(mode='EDIT')
    
    torso_h = 1.5 * height_scale; head_r = 0.4; neck_h = 0.2
    
    # Define Extended Bone Structure
    # Format: (head, tail, parent)
    bones = {
        "Torso": ((0,0,0), (0,0,torso_h), None),
        "Neck": ((0,0,torso_h), (0,0,torso_h+neck_h), "Torso"),
        "Head": ((0,0,torso_h+neck_h), (0,0,torso_h+neck_h+head_r*2), "Neck"),
        
        # Arms with Elbows and Shoulders
        "Shoulder.L": ((0.2, 0, torso_h*0.9), (0.4, 0, torso_h*0.9), "Torso"),
        "Arm.L": ((0.4, 0, torso_h*0.9), (0.4, 0, torso_h*0.9 - 0.4), "Shoulder.L"),
        "Elbow.L": ((0.4, 0, torso_h*0.9 - 0.4), (0.4, 0, torso_h*0.9 - 0.8), "Arm.L"),
        
        "Shoulder.R": ((-0.2, 0, torso_h*0.9), ((-0.4, 0, torso_h*0.9)), "Torso"),
        "Arm.R": ((-0.4, 0, torso_h*0.9), (-0.4, 0, torso_h*0.9 - 0.4), "Shoulder.R"),
        "Elbow.R": ((-0.4, 0, torso_h*0.9 - 0.4), (-0.4, 0, torso_h*0.9 - 0.8), "Arm.R"),
        
        # Legs with Hips and Knees
        "Hip.L": ((0.15, 0, 0.1), (0.25, 0, 0.1), "Torso"),
        "Thigh.L": ((0.25, 0, 0.1), (0.25, 0, -0.4), "Hip.L"),
        "Knee.L": ((0.25, 0, -0.4), (0.25, 0, -0.9), "Thigh.L"),
        
        "Hip.R": ((-0.15, 0, 0.1), (-0.25, 0, 0.1), "Torso"),
        "Thigh.R": ((-0.25, 0, 0.1), (-0.25, 0, -0.4), "Hip.R"),
        "Knee.R": ((-0.25, 0, -0.4), (-0.25, 0, -0.9), "Thigh.R"),
        
        # Hands and Fingers
        "Hand.L": ((0.4, 0, torso_h*0.9 - 0.8), (0.4, 0, torso_h*0.9 - 0.95), "Elbow.L"),
        "Finger.1.L": ((0.4, 0, torso_h*0.9 - 0.95), (0.45, 0, torso_h*0.9 - 1.1), "Hand.L"),
        "Finger.2.L": ((0.4, 0, torso_h*0.9 - 0.95), (0.4, 0.05, torso_h*0.9 - 1.1), "Hand.L"),
        "Finger.3.L": ((0.4, 0, torso_h*0.9 - 0.95), (0.35, 0, torso_h*0.9 - 1.1), "Hand.L"),
        
        "Hand.R": ((-0.4, 0, torso_h*0.9 - 0.8), (-0.4, 0, torso_h*0.9 - 0.95), "Elbow.R"),
        "Finger.1.R": ((-0.4, 0, torso_h*0.9 - 0.95), (-0.45, 0, torso_h*0.9 - 1.1), "Hand.R"),
        "Finger.2.R": ((-0.4, 0, torso_h*0.9 - 0.95), (-0.4, 0.05, torso_h*0.9 - 1.1), "Hand.R"),
        "Finger.3.R": ((-0.4, 0, torso_h*0.9 - 0.95), (-0.35, 0, torso_h*0.9 - 1.1), "Hand.R"),
        
        # Feet and Toes
        "Foot.L": ((0.25, 0, -0.9), (0.25, -0.15, -0.95), "Knee.L"),
        "Toe.1.L": ((0.25, -0.15, -0.95), (0.32, -0.45, -0.95), "Foot.L"),
        "Toe.2.L": ((0.25, -0.15, -0.95), (0.25, -0.5, -0.95), "Foot.L"),
        "Toe.3.L": ((0.25, -0.15, -0.95), (0.18, -0.45, -0.95), "Foot.L"),
        
        "Foot.R": ((-0.25, 0, -0.9), (-0.25, -0.15, -0.95), "Knee.R"),
        "Toe.1.R": ((-0.25, -0.15, -0.95), (-0.32, -0.45, -0.95), "Foot.R"),
        "Toe.2.R": ((-0.25, -0.15, -0.95), (-0.25, -0.5, -0.95), "Foot.R"),
        "Toe.3.R": ((-0.25, -0.15, -0.95), (-0.18, -0.45, -0.95), "Foot.R"),
        
        # Facial Bones (Projected to Surface using Spherical Math intersection to prevent floating shadows)
        "Ear.L": ((head_r*0.9, 0, torso_h+neck_h+head_r), (head_r*1.1, 0, torso_h+neck_h+head_r+0.1), "Head"),
        "Ear.R": ((-head_r*0.9, 0, torso_h+neck_h+head_r), (-head_r*1.1, 0, torso_h+neck_h+head_r+0.1), "Head"),
        
        # Eyes at Z_rel = 0.35 (Z = 1.35), X_rel = 0.35
        # Y_rel = -sqrt(1 - 0.35^2 - 0.35^2) = -0.868
        "Eye.L": ((head_r*0.35, -head_r*0.84, torso_h+neck_h+head_r*1.35), (head_r*0.35, -head_r*0.92, torso_h+neck_h+head_r*1.35), "Head"),
        "Eye.R": ((-head_r*0.35, -head_r*0.84, torso_h+neck_h+head_r*1.35), (-head_r*0.35, -head_r*0.92, torso_h+neck_h+head_r*1.35), "Head"),
        
        "Eyelid.Upper.L": ((head_r*0.35, -head_r*0.84, torso_h+neck_h+head_r*1.40), (head_r*0.35, -head_r*0.92, torso_h+neck_h+head_r*1.40), "Head"),
        "Eyelid.Lower.L": ((head_r*0.35, -head_r*0.84, torso_h+neck_h+head_r*1.30), (head_r*0.35, -head_r*0.92, torso_h+neck_h+head_r*1.30), "Head"),
        "Eyelid.Upper.R": ((-head_r*0.35, -head_r*0.84, torso_h+neck_h+head_r*1.40), (-head_r*0.35, -head_r*0.92, torso_h+neck_h+head_r*1.40), "Head"),
        "Eyelid.Lower.R": ((-head_r*0.35, -head_r*0.84, torso_h+neck_h+head_r*1.30), (-head_r*0.35, -head_r*0.92, torso_h+neck_h+head_r*1.30), "Head"),
        
        # Eyebrows at Z_rel = 0.45 (Z = 1.45), X_rel = 0.35
        # Y_rel = -sqrt(1 - 0.35^2 - 0.45^2) = -0.82
        "Eyebrow.L": ((head_r*0.35, -head_r*0.81, torso_h+neck_h+head_r*1.45), (head_r*0.4, -head_r*0.89, torso_h+neck_h+head_r*1.45), "Head"),
        "Eyebrow.R": ((-head_r*0.35, -head_r*0.81, torso_h+neck_h+head_r*1.45), (-head_r*0.4, -head_r*0.89, torso_h+neck_h+head_r*1.45), "Head"),
        
        # Nose at Z_rel = 0.05 (Z = 1.05)
        # Y_rel = -sqrt(1 - 0^2 - 0.05^2) = -0.998
        "Nose": ((0, -head_r*0.97, torso_h+neck_h+head_r*1.05), (0, -head_r*1.07, torso_h+neck_h+head_r*1.05), "Head"),
        
        # Upper Lip at Z_rel = -0.18 (Z = 0.82)
        # Y_rel = -sqrt(1 - 0 - 0.18^2) = -0.983
        "Lip.Upper": ((0, -head_r*0.96, torso_h+neck_h+head_r*0.82), (0, -head_r*1.06, torso_h+neck_h+head_r*0.82), "Head"),
        
        # Lower Lip at Z_rel = -0.24 (Z = 0.76)
        # Y_rel = -sqrt(1 - 0 - 0.24^2) = -0.97
        "Lip.Lower": ((0, -head_r*0.95, torso_h+neck_h+head_r*0.76), (0, -head_r*1.05, torso_h+neck_h+head_r*0.76), "Head"),

    }
    
    for bname, (h, t, p) in bones.items():
        bone = armature_data.edit_bones.new(bname); bone.head, bone.tail = h, t
        if p: bone.parent = armature_data.edit_bones[p]
    
    bpy.ops.object.mode_set(mode='OBJECT')
    
    # 2. Mesh Construction
    mesh_data = bpy.data.meshes.new(f"{name}_MeshData")
    mesh_obj = bpy.data.objects.new(f"{name}_Body", mesh_data)
    bpy.context.scene.collection.objects.link(mesh_obj); mesh_obj.parent = armature_obj
    bm = bmesh.new(); dlayer = bm.verts.layers.deform.verify()
    
    def add_organic_part(rad1, rad2, height, loc, bname, mid_scale=1.1, rot=(0,0,0)):
        """High-density organic part with structural welding and rotation."""
        vg = mesh_obj.vertex_groups.get(bname) or mesh_obj.vertex_groups.new(name=bname)
        matrix = mathutils.Matrix.Translation(loc) @ mathutils.Euler(rot).to_matrix().to_4x4()
        ret = bmesh.ops.create_cone(bm, segments=24, cap_ends=True, radius1=rad1, radius2=rad2, depth=height, matrix=matrix)
        for v in ret['verts']:
            v[dlayer][vg.index] = 1.0
            # Organic mid-bulge (Local Z is now affected by rot, but v.co is world space)
            # For simplicity, we bulge based on distance from loc
            dist = (v.co - mathutils.Vector(loc)).length
            z_fact = 1.0 - abs(dist / (height/2))
            factor = 1.0 + (mid_scale - 1.0) * max(0, z_fact)
            # Apply bulge perpendicular to the part direction? 
            # For now, uniform scale is safer for various rotations
            v.co = mathutils.Vector(loc) + (v.co - mathutils.Vector(loc)) * factor
        return ret

    def add_joint_bulb(loc, rad, bname):
        """Creates a structural joint bulb (sphere) for anatomical realism."""
        vg = mesh_obj.vertex_groups.get(bname) or mesh_obj.vertex_groups.new(name=bname)
        matrix = mathutils.Matrix.Translation(loc)
        ret = bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=16, radius=rad, matrix=matrix)
        for v in ret['verts']: v[dlayer][vg.index] = 1.0

    # 3. Build Body Sections (WELDED)
    # Torso (Main bulk)
    add_organic_part(0.5, 0.25, torso_h, (0, 0, torso_h/2), "Torso", mid_scale=1.2)
    
    # Neck with Base Bulb
    add_joint_bulb((0, 0, torso_h), 0.18, "Torso") # Welding bulb
    add_organic_part(0.15, 0.12, neck_h, (0, 0, torso_h + neck_h/2), "Neck")
    
    # Head
    matrix_head = mathutils.Matrix.Translation((0, 0, torso_h + neck_h + head_r))
    bmesh.ops.create_uvsphere(bm, u_segments=32, v_segments=32, radius=head_r, matrix=matrix_head)
    head_vg = mesh_obj.vertex_groups.get("Head") or mesh_obj.vertex_groups.new(name="Head")
    for v in bm.verts:
        if v.co.z > torso_h + neck_h: head_vg.add([v.index], 1.0, 'REPLACE')

    # Limbs with Structural Joints (Hips, Knees, Shoulders, Elbows)
    # Arms
    for side, mult in [("L", 1), ("R", -1)]:
        s_loc = (0.4 * mult, 0, torso_h * 0.9)
        e_loc = (0.4 * mult, 0, torso_h * 0.9 - 0.4)
        h_loc = (0.4 * mult, 0, torso_h * 0.9 - 0.8)
        
        add_joint_bulb(s_loc, 0.16, f"Arm.{side}") # Shoulder
        add_organic_part(0.14, 0.11, 0.4, (s_loc[0], s_loc[1], s_loc[2]-0.2), f"Arm.{side}", mid_scale=1.15)
        add_joint_bulb(e_loc, 0.12, f"Elbow.{side}") # Elbow
        add_organic_part(0.11, 0.08, 0.4, (e_loc[0], e_loc[1], e_loc[2]-0.2), f"Elbow.{side}", mid_scale=1.1)
        
        # HANDS & FINGERS
        add_joint_bulb(h_loc, 0.1, f"Hand.{side}") # Wrist
        add_organic_part(0.08, 0.12, 0.15, (h_loc[0], h_loc[1], h_loc[2]-0.07), f"Hand.{side}") # Palm
        
        for f in range(1, 4):
            fx = h_loc[0] + (f-2)*0.06
            fy, fz = h_loc[1], h_loc[2]-0.2
            add_organic_part(0.04, 0.01, 0.25, (fx, fy, fz), f"Finger.{f}.{side}")

    # Legs
    for side, mult in [("L", 1), ("R", -1)]:
        hi_loc = (0.25 * mult, 0, 0.1)
        k_loc = (0.25 * mult, 0, -0.4)
        an_loc = (0.25 * mult, 0, -0.9)
        
        add_joint_bulb(hi_loc, 0.22, f"Thigh.{side}") # Hip
        add_organic_part(0.2, 0.16, 0.5, (hi_loc[0], hi_loc[1], hi_loc[2]-0.25), f"Thigh.{side}", mid_scale=1.15)
        add_joint_bulb(k_loc, 0.16, f"Knee.{side}") # Knee
        add_organic_part(0.16, 0.12, 0.5, (k_loc[0], k_loc[1], k_loc[2]-0.25), f"Knee.{side}", mid_scale=1.1)
        
        # FEET & TOES
        add_joint_bulb(an_loc, 0.12, f"Foot.{side}") # Ankle
        # Foot points forward (-Y)
        add_organic_part(0.1, 0.15, 0.25, (an_loc[0], an_loc[1]-0.15, an_loc[2]), f"Foot.{side}", rot=(math.radians(90), 0, 0)) 
        
        for t in range(1, 4):
            tx = an_loc[0] + (t-2)*0.08
            ty, tz = an_loc[1]-0.3, an_loc[2]
            add_organic_part(0.05, 0.02, 0.25, (tx, ty, tz), f"Toe.{t}.{side}", rot=(math.radians(90), 0, 0))

    # 4. Foliage Overhaul (Branch-Based for Facial Visibility)
    foliage_vg = mesh_obj.vertex_groups.get("Foliage") or mesh_obj.vertex_groups.new(name="Foliage")
    head_center = mathutils.Vector((0, 0, torso_h + neck_h + head_r))
    
    # 4.1 Head Branches (Top/Back of head only - Facial Clearance)
    for i in range(16): # Increased for lushness in back
        angle = (i/16)*6.28
        # EXCLUSION ZONE: No foliage on front face (Y < -0.1)
        z_off = random.uniform(head_r*0.4, head_r*0.9)
        loc = head_center + mathutils.Vector((math.cos(angle)*head_r*0.5, math.sin(angle)*head_r*0.5, z_off))
        
        # Check if the branch location is in the 'face' hemisphere
        if loc.y < head_center.y - 0.1:
            continue 
            
        # Branch pointing UP and OUT
        dir_vec = (loc - head_center).normalized()
        rot_quat = dir_vec.to_track_quat('Z', 'Y')
        b_height = random.uniform(0.3, 0.6)
        
        b_ret = bmesh.ops.create_cone(bm, segments=8, cap_ends=True, radius1=0.04, radius2=0.01, depth=b_height, 
                                      matrix=mathutils.Matrix.Translation(loc + dir_vec*(b_height/2)) @ rot_quat.to_matrix().to_4x4())
        
        for v in b_ret['verts']: v[dlayer][head_vg.index] = 1.0 # Rigged to head
        
        # 4.2 Leaves on this Branch
        for j in range(12): # Increased density
            l_loc = loc + dir_vec * random.uniform(b_height*0.2, b_height)
            l_scale = random.uniform(0.2, 0.45) # Large head leaves
            l_m = mathutils.Matrix.Translation(l_loc) @ mathutils.Euler((random.uniform(0,3), 0, angle)).to_matrix().to_4x4()
            l_ret = bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=l_scale, matrix=l_m)
            for v in l_ret['verts']:
                v[dlayer][head_vg.index] = 1.0
                v[dlayer][foliage_vg.index] = 1.0 
                for f in v.link_faces: f.material_index = 1

    # 4.3 Limb Foliage (Lush overgrown)
    limbs = ["Arm.L", "Arm.R", "Elbow.L", "Elbow.R", "Thigh.L", "Thigh.R", "Knee.L", "Knee.R"]
    for bone_name in limbs:
        vg = mesh_obj.vertex_groups.get(bone_name)
        vg_verts = [v for v in bm.verts if vg.index in v[dlayer]]
        if vg_verts:
            for _ in range(10): # Lush limb foliage
                v_target = random.choice(vg_verts)
                l_loc = v_target.co + v_target.normal * 0.05
                l_m = mathutils.Matrix.Translation(l_loc) @ mathutils.Euler((random.uniform(0,3), 0, random.uniform(0,6))).to_matrix().to_4x4()
                l_ret = bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=0.2, matrix=l_m)
                for v in l_ret['verts']:
                    v[dlayer][vg.index] = 1.0
                    v[dlayer][foliage_vg.index] = 0.5 
                    for f in v.link_faces: f.material_index = 1

    # 5. Global Production Smoothing
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.03)
    for _ in range(10): 
        bmesh.ops.smooth_vert(bm, verts=bm.verts, factor=0.7)
    
    bm.to_mesh(mesh_data)
    bm.free()
    
    # 2.5 Modifiers (Wind Sway Implementation)
    mesh_obj.modifiers.new(name="Armature", type='ARMATURE').object = armature_obj
    
    # WIND SWAY: Using Wave modifier for procedural motion
    wave = mesh_obj.modifiers.new(name="WindSway", type='WAVE')
    wave.use_x = True; wave.use_y = True
    wave.height = 0.05; wave.width = 1.5; wave.narrowness = 1.5
    wave.speed = 0.15; wave.vertex_group = "Foliage"
    
    mesh_obj.modifiers.new(name="Subsurf", type='SUBSURF').levels = 2
    mesh_obj.modifiers.new(name="WeightedNormal", type='WEIGHTED_NORMAL')
    
    # Organic Bark Displacement
    tex_bark = bpy.data.textures.get("BarkBump") or bpy.data.textures.new("BarkBump", type='CLOUDS')
    tex_bark.noise_scale = 0.05
    disp = mesh_obj.modifiers.new(name="BarkBump", type='DISPLACE')
    disp.texture = tex_bark; disp.strength = 0.06; disp.vertex_group = "Torso"

    mesh_obj.data.materials.append(create_bark_material_v4(f"Bark_{name}"))
    mesh_obj.data.materials.append(create_leaf_material_v4(f"Leaf_{name}"))

    # 2.6 NATURAL A-POSE (Pose Mode - Keyed at Frame 1)
    bpy.context.view_layer.objects.active = armature_obj
    bpy.ops.object.mode_set(mode='POSE')
    for side in ["L", "R"]:
        mult = 1 if side == "L" else -1
        # Raise arms significantly (Forward and Out)
        if f"Arm.{side}" in armature_obj.pose.bones:
            bone = armature_obj.pose.bones[f"Arm.{side}"]
            bone.rotation_mode = 'XYZ'
            # SWING FORWARD (around local X)
            bone.rotation_euler[0] = math.radians(-40) 
            # SWING OUT (around local Z)
            bone.rotation_euler[2] = math.radians(-40 * mult)
            bone.keyframe_insert(data_path="rotation_euler", frame=1)
            
        # Elbows bent (Fluid joint check)
        if f"Elbow.{side}" in armature_obj.pose.bones:
            ebone = armature_obj.pose.bones[f"Elbow.{side}"]
            ebone.rotation_mode = 'XYZ'
            ebone.rotation_euler[0] = math.radians(30)
            ebone.keyframe_insert(data_path="rotation_euler", frame=1)
    bpy.ops.object.mode_set(mode='OBJECT')

    # 3. Facial Props (PUSHED FORWARD FOR VISIBILITY)
    bones_map = {b.name: b.name for b in armature_obj.data.bones}
    iris_mat = create_iris_material_v4(f"Iris_{name}")
    bark_mat = create_bark_material_v4(f"FacialBark_{name}", color=(0.1, 0.15, 0.05))
    
    create_facial_props_v4(name, armature_obj, bones_map, iris_mat, bark_mat)
    
    return armature_obj
