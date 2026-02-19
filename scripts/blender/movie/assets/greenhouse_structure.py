import bpy
import math
import mathutils
import style

def create_greenhouse_iron_mat():
    mat = bpy.data.materials.get("GH_Iron")
    if mat and mat.node_tree: return mat
    if not mat: mat = bpy.data.materials.new(name="GH_Iron")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    bsdf = nodes.get("Principled BSDF") or nodes.new("ShaderNodeBsdfPrincipled")

    bsdf.inputs["Base Color"].default_value = (0.106, 0.302, 0.118, 1) # Greenhouse Brand Green
    bsdf.inputs["Metallic"].default_value = 1.0
    bsdf.inputs["Roughness"].default_value = 0.7

    # Mossy Iron
    node_moss = nodes.new(type='ShaderNodeTexNoise')
    node_moss.inputs['Scale'].default_value = 20.0
    node_mix = style.create_mix_node(mat.node_tree, blend_type='OVERLAY', data_type='RGBA')
    fac_sock, in1_sock, in2_sock = style.get_mix_sockets(node_mix)
    fac_sock.default_value = 0.5
    in1_sock.default_value = (0.106, 0.302, 0.118, 1)
    mat.node_tree.links.new(node_moss.outputs['Color'], in2_sock)
    mat.node_tree.links.new(style.get_mix_output(node_mix), bsdf.inputs['Base Color'])

    return mat

def create_greenhouse_glass_mat():
    mat = bpy.data.materials.get("GH_Glass")
    if mat and mat.node_tree: return mat
    if not mat: mat = bpy.data.materials.new(name="GH_Glass")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    bsdf = nodes.get("Principled BSDF") or nodes.new("ShaderNodeBsdfPrincipled")

    bsdf.inputs["Base Color"].default_value = (0.7, 0.8, 0.9, 1)
    bsdf.inputs["Alpha"].default_value = 1.0

    # Modern 5.0+ Sockets
    bsdf.inputs['Transmission Weight'].default_value = 1.0
    bsdf.inputs["Roughness"].default_value = 0.05

    # Scratched Glass
    node_scratches = nodes.new(type='ShaderNodeTexNoise')
    node_scratches.inputs['Scale'].default_value = 50.0

    # Fogged Glass
    node_fog = nodes.new(type='ShaderNodeTexNoise')
    node_fog.inputs['Scale'].default_value = 100.0
    node_ramp = nodes.new(type='ShaderNodeValToRGB')
    node_ramp.color_ramp.elements[0].position = 0.4
    node_ramp.color_ramp.elements[1].position = 0.6

    mat.node_tree.links.new(node_fog.outputs['Fac'], node_ramp.inputs['Fac'])

    # Mix into Roughness
    mix_rough = nodes.new(type='ShaderNodeMath')
    mix_rough.operation = 'ADD'
    mat.node_tree.links.new(node_scratches.outputs['Fac'], mix_rough.inputs[0])
    mat.node_tree.links.new(node_ramp.outputs['Color'], mix_rough.inputs[1])
    mat.node_tree.links.new(mix_rough.outputs[0], bsdf.inputs['Roughness'])

    style.set_blend_method(mat, 'BLENDED')
    return mat

def create_mossy_stone_mat(name="MossyStone"):
    """Enhancement #38: Procedural Moss on Stone Surfaces."""
    mat = bpy.data.materials.get(name)
    if mat and mat.node_tree: return mat
    if not mat: mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links

    bsdf = nodes.get("Principled BSDF") or nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value = (0.3, 0.3, 0.3, 1) # Stone gray

    # Moss layer
    node_moss = nodes.new(type='ShaderNodeTexNoise')
    node_moss.inputs['Scale'].default_value = 50.0

    node_mix = style.create_mix_node(mat.node_tree, blend_type='MIX', data_type='RGBA')
    fac_sock, in1_sock, in2_sock = style.get_mix_sockets(node_mix)
    in2_sock.default_value = (0.05, 0.1, 0.02, 1) # Moss green

    # Height-based gradient for moss
    node_coord = nodes.new(type='ShaderNodeTexCoord')
    node_sep = nodes.new(type='ShaderNodeSeparateXYZ')
    links.new(node_coord.outputs['Object'], node_sep.inputs['Vector'])

    node_ramp = nodes.new(type='ShaderNodeValToRGB')
    node_ramp.color_ramp.elements[0].position = 0.0
    node_ramp.color_ramp.elements[1].position = 0.3 # Grow in lower 30%
    links.new(node_sep.outputs['Z'], node_ramp.inputs['Fac'])

    # Combine with noise
    node_math = nodes.new(type='ShaderNodeMath')
    node_math.operation = 'MULTIPLY'
    links.new(node_ramp.outputs['Color'], node_math.inputs[0])
    links.new(node_moss.outputs['Fac'], node_math.inputs[1])

    links.new(node_math.outputs[0], fac_sock)
    links.new(style.get_mix_output(node_mix), bsdf.inputs['Base Color'])

    return mat

def create_greenhouse_structure(location=(0,0,0), size=(15, 15, 8)):
    """Point 95: Optimized BMesh Greenhouse structure."""
    import bmesh
    main_loc = mathutils.Vector(location)

    iron_mat = create_greenhouse_iron_mat()
    glass_mat = create_greenhouse_glass_mat()
    beam_thickness = 0.08

    # 1. Main Iron Mesh
    iron_data = bpy.data.meshes.new("Greenhouse_Iron_MeshData")
    iron_obj = bpy.data.objects.new("Greenhouse_Iron", iron_data)
    bpy.context.scene.collection.objects.link(iron_obj)
    iron_obj.location = main_loc

    bm_iron = bmesh.new()

    def add_beam(loc, scale, rot=(0,0,0)):
        matrix = mathutils.Matrix.Translation(loc) @ mathutils.Euler(rot).to_matrix().to_4x4()
        ret = bmesh.ops.create_cube(bm_iron, size=2.0, matrix=matrix)
        for v in ret['verts']:
            v.co.x *= scale[0]; v.co.y *= scale[1]; v.co.z *= scale[2]

    # Pillars
    pillar_locs = [(-size[0]/2, -size[1]/2), (size[0]/2, -size[1]/2), (-size[0]/2, size[1]/2), (size[0]/2, size[1]/2),
                   (0, -size[1]/2), (0, size[1]/2), (-size[0]/2, 0), (size[0]/2, 0)]
    for px, py in pillar_locs:
        add_beam((px, py, size[2]/2), (beam_thickness, beam_thickness, size[2]/2))

    # Horizontal Beams
    for z in [0, size[2]]:
        for x in [-size[0]/2, size[0]/2]:
            add_beam((x, 0, z), (beam_thickness, size[1]/2, beam_thickness))
        for y in [-size[1]/2, size[1]/2]:
            add_beam((0, y, z), (size[0]/2, beam_thickness, beam_thickness))

    # Roof
    peak_h = size[2] + 4
    add_beam((0, 0, peak_h), (size[0]/2, beam_thickness, beam_thickness))
    for x in [-size[0]/2, 0, size[0]/2]:
        for side_y in [-1, 1]:
            y_start, z_start, y_end, z_end = side_y * size[1]/2, size[2], 0, peak_h
            mid = mathutils.Vector((x, (y_start + y_end)/2, (z_start + z_end)/2))
            dist = math.sqrt((y_end - y_start)**2 + (z_end - z_start)**2)
            angle = math.atan2(z_end - z_start, y_end - y_start)
            add_beam(mid, (beam_thickness, dist/2, beam_thickness), (angle - math.pi/2, 0, 0))

    bm_iron.to_mesh(iron_data)
    bm_iron.free()
    iron_obj.data.materials.append(iron_mat)

    # 2. Glass Mesh
    glass_data = bpy.data.meshes.new("Greenhouse_Glass_MeshData")
    glass_obj = bpy.data.objects.new("Greenhouse_Glass", glass_data)
    bpy.context.scene.collection.objects.link(glass_obj)
    glass_obj.location = main_loc

    bm_glass = bmesh.new()
    for side in [-1, 1]:
        # X-walls
        matrix_x = mathutils.Matrix.Translation((side * size[0]/2, 0, size[2]/2)) @ mathutils.Euler((0, math.pi/2, 0)).to_matrix().to_4x4()
        bmesh.ops.create_grid(bm_glass, x_segments=1, y_segments=1, size=1.0, matrix=matrix_x)
        for v in bm_glass.verts[-4:]:
            v.co.y *= size[1]/2; v.co.z *= size[2]/2
        # Y-walls
        matrix_y = mathutils.Matrix.Translation((0, side * size[1]/2, size[2]/2)) @ mathutils.Euler((math.pi/2, 0, 0)).to_matrix().to_4x4()
        bmesh.ops.create_grid(bm_glass, x_segments=1, y_segments=1, size=1.0, matrix=matrix_y)
        for v in bm_glass.verts[-4:]:
            v.co.x *= size[0]/2; v.co.z *= size[2]/2

    bm_glass.to_mesh(glass_data)
    bm_glass.free()
    glass_obj.data.materials.append(glass_mat)

    # Merge
    bpy.ops.object.select_all(action='DESELECT')
    iron_obj.select_set(True)
    glass_obj.select_set(True)
    bpy.context.view_layer.objects.active = iron_obj
    bpy.ops.object.join()
    main_obj = iron_obj
    main_obj.name = "Greenhouse_Main"

    return main_obj
