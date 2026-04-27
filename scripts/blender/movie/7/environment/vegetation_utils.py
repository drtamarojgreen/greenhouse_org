import bpy
import bmesh
import math
import random
import mathutils

def create_leaf_material(name, base_color, leaf_cfg):
    """Creates a procedural node-based leaf material with translucency and variation."""
    if len(base_color) == 3: base_color = (*base_color, 1.0)
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()
    
    # Nodes
    n_out = nodes.new(type='ShaderNodeOutputMaterial')
    n_bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    n_trans = nodes.new(type='ShaderNodeBsdfTranslucent')
    n_mix = nodes.new(type='ShaderNodeMixShader')
    
    n_tex = nodes.new(type='ShaderNodeTexCoord')
    n_noise = nodes.new(type='ShaderNodeTexNoise')
    n_ramp = nodes.new(type='ShaderNodeValToRGB')
    
    # Config
    n_bsdf.inputs['Base Color'].default_value = base_color
    n_bsdf.inputs['Roughness'].default_value = leaf_cfg.get("roughness", 0.7)
    if 'Subsurface Weight' in n_bsdf.inputs:
        n_bsdf.inputs['Subsurface Weight'].default_value = leaf_cfg.get("translucency", 0.35)
    if 'Subsurface Radius' in n_bsdf.inputs:
        n_bsdf.inputs['Subsurface Radius'].default_value = leaf_cfg.get("subsurface_radius", [0.05, 0.12, 0.05])
    
    # Noise variation
    n_noise.noise_dimensions = '4D'
    n_noise.inputs['W'].default_value = leaf_cfg.get("variation_seed", 42)
    n_noise.inputs['Scale'].default_value = 10.0
    
    # ColorRamp for variation
    n_ramp.color_ramp.elements[0].color = [max(0, c - 0.05) for c in base_color]
    n_ramp.color_ramp.elements[1].color = [min(1, c + 0.05) for c in base_color]
    
    # Links
    links = mat.node_tree.links
    links.new(n_tex.outputs['Generated'], n_noise.inputs['Vector'])
    links.new(n_noise.outputs['Fac'], n_ramp.inputs['Fac'])
    links.new(n_ramp.outputs['Color'], n_bsdf.inputs['Base Color'])
    
    links.new(n_bsdf.outputs['BSDF'], n_mix.inputs[1])
    links.new(n_trans.outputs['BSDF'], n_mix.inputs[2])
    n_mix.inputs[0].default_value = leaf_cfg.get("translucency", 0.35)
    
    links.new(n_mix.outputs['Shader'], n_out.inputs['Surface'])
    
    return mat

def create_branching_tree(name, loc, scale, coll, shades, canopy_shape, leaf_cfg=None):
    mesh = bpy.data.meshes.new(name)
    obj = bpy.data.objects.new(name, mesh)
    coll.objects.link(obj)
    obj.location = loc
    bm = bmesh.new()

    trunk_h = 5.0 * scale
    trunk_r = 0.28 * scale

    bmesh.ops.create_cone(bm, segments=8, radius1=trunk_r, radius2=trunk_r * 0.55, depth=trunk_h, matrix=mathutils.Matrix.Translation((0, 0, trunk_h / 2)))

    if canopy_shape == 'conical':
        num_branches = random.randint(4, 5); spread = 0.5; up_bias = 0.7; leaf_r_range = (0.9, 1.4)
    elif canopy_shape == 'round':
        num_branches = random.randint(5, 7); spread = 0.85; up_bias = 0.45; leaf_r_range = (1.2, 1.9)
    else:
        num_branches = random.randint(4, 6); spread = 1.1; up_bias = 0.25; leaf_r_range = (1.3, 2.1)

    leaf_centres = []
    for i in range(num_branches):
        b_angle = (i / num_branches) * math.pi * 2 + random.uniform(-0.4, 0.4)
        bz = trunk_h * random.uniform(0.55, 0.88)
        bl = random.uniform(1.8, 3.0) * scale

        dx = math.sin(b_angle) * spread; dy = math.cos(b_angle) * spread; dz = up_bias + random.uniform(-0.1, 0.2)
        length = math.sqrt(dx**2 + dy**2 + dz**2)
        dx, dy, dz = dx / length, dy / length, dz / length

        sx, sy, sz = dx * trunk_r * 0.5, dy * trunk_r * 0.5, bz
        ex, ey, ez = sx + dx * bl, sy + dy * bl, sz + dz * bl

        mid = mathutils.Vector(((sx + ex) / 2, (sy + ey) / 2, (sz + ez) / 2))
        branch_vec = mathutils.Vector((dx, dy, dz))
        rot_mat = branch_vec.to_track_quat('Z', 'Y').to_matrix().to_4x4()
        trans_mat = mathutils.Matrix.Translation(mid)

        bmesh.ops.create_cone(bm, segments=5, radius1=trunk_r * 0.30, radius2=trunk_r * 0.10, depth=bl, matrix=trans_mat @ rot_mat)
        leaf_centres.append((ex, ey, ez))

        for _ in range(random.randint(1, 2)):
            sub_angle = b_angle + random.uniform(-0.8, 0.8)
            sdx = math.sin(sub_angle) * spread * 0.7; sdy = math.cos(sub_angle) * spread * 0.7; sdz = up_bias * 0.6 + random.uniform(0, 0.3)
            sl = math.sqrt(sdx**2 + sdy**2 + sdz**2)
            sdx, sdy, sdz = sdx / sl, sdy / sl, sdz / sl
            sbl = bl * random.uniform(0.45, 0.65)
            smid_x, smid_y, smid_z = ex + sdx * sbl / 2, ey + sdy * sbl / 2, ez + sdz * sbl / 2
            svec = mathutils.Vector((sdx, sdy, sdz))
            srot = svec.to_track_quat('Z', 'Y').to_matrix().to_4x4()
            strans = mathutils.Matrix.Translation((smid_x, smid_y, smid_z))
            bmesh.ops.create_cone(bm, segments=4, radius1=trunk_r * 0.15, radius2=trunk_r * 0.05, depth=sbl, matrix=strans @ srot)
            leaf_centres.append((ex + sdx * sbl, ey + sdy * sbl, ez + sdz * sbl))

    for (lx, ly, lz) in leaf_centres:
        lr = random.uniform(*leaf_r_range) * scale
        bmesh.ops.create_uvsphere(bm, u_segments=7, v_segments=5, radius=lr, matrix=mathutils.Matrix.Translation((lx, ly, lz)))

    bm.to_mesh(mesh); bm.free()

    apply_mat(obj, "mat_trunk", (0.1, 0.05, 0.02, 1.0))
    base_color = random.choice(shades)
    if leaf_cfg and leaf_cfg.get("enabled"):
        mat_l = create_leaf_material(f"mat_leaves_{name}", base_color, leaf_cfg)
        if mat_l.name not in obj.data.materials:
            obj.data.materials.append(mat_l)
    else:
        apply_mat(obj, f"mat_leaves_{name}", (*base_color, 1.0))
    
    cutoff_r = trunk_r * 3.5
    for poly in obj.data.polygons:
        c = poly.center
        xy_r = math.sqrt(c.x ** 2 + c.y ** 2)
        poly.material_index = 1 if (xy_r > cutoff_r and c.z > trunk_h * 0.45) else 0
    return obj

def create_bush(name, loc, scale, coll, shades, leaf_cfg=None):
    mesh = bpy.data.meshes.new(name)
    obj = bpy.data.objects.new(name, mesh)
    coll.objects.link(obj)
    obj.location = loc
    obj.scale = (random.uniform(0.8, 1.2) * scale, random.uniform(0.8, 1.2) * scale, random.uniform(0.5, 0.9) * scale)
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=8, v_segments=6, radius=1.5, matrix=mathutils.Matrix.Translation((0, 0, 0.75)))
    bm.to_mesh(mesh); bm.free()
    
    base_color = random.choice(shades)
    if leaf_cfg and leaf_cfg.get("enabled"):
        mat_l = create_leaf_material(f"mat_bush_leaves_{name}", base_color, leaf_cfg)
        if mat_l.name not in obj.data.materials:
            obj.data.materials.append(mat_l)
    else:
        apply_mat(obj, f"mat_bush_{name}", (*base_color, 1.0))
    return obj

def apply_mat(obj, name, color, emission=0.0, alpha=False, metallic=0.0, roughness=0.5):
    if len(color) == 3: color = (*color, 1.0)
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name=name)
    if not mat.use_nodes: mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs['Base Color'].default_value = color
        bsdf.inputs['Metallic'].default_value = metallic
        bsdf.inputs['Roughness'].default_value = roughness
        if emission > 0:
            if 'Emission Strength' in bsdf.inputs:
                bsdf.inputs['Emission Strength'].default_value = emission
                bsdf.inputs['Emission Color'].default_value = color
            elif 'Emission' in bsdf.inputs:
                bsdf.inputs['Emission'].default_value = color
    if alpha: mat.blend_method = 'BLEND'
    if mat.name not in obj.data.materials:
        obj.data.materials.append(mat)
    return mat
