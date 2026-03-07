import bpy
import math
import mathutils
import style_utilities as style

def create_greenhouse_iron_mat():
    mat = bpy.data.materials.get("GH_Iron")
    if mat and mat.node_tree: return mat
    if not mat: mat = bpy.data.materials.new(name="GH_Iron")
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    bsdf = nodes.get("Principled BSDF") or nodes.new("ShaderNodeBsdfPrincipled")
    
    bsdf.inputs["Base Color"].default_value = (0.15, 0.25, 0.15, 1) # Dark Forest Green
    bsdf.inputs["Metallic"].default_value = 0.3 # Less "pipey"
    bsdf.inputs["Roughness"].default_value = 0.9 # More "painted"

    # Mossy Iron (Restored & Enhanced)
    node_moss = nodes.new(type='ShaderNodeTexNoise')
    node_moss.inputs['Scale'].default_value = 20.0
    node_mix = style.create_mix_node(mat.node_tree, blend_type='OVERLAY', data_type='RGBA')
    fac_sock, in1_sock, in2_sock = style.get_mix_sockets(node_mix)
    if fac_sock: fac_sock.default_value = 0.5
    in1_sock.default_value = (0.2, 0.4, 0.2, 1)
    links.new(node_moss.outputs['Color'], in2_sock)
    links.new(style.get_mix_output(node_mix), bsdf.inputs['Base Color'])

    # Enhancement #37: Macroscopic Iron Pitting (Scale-Aware)
    node_pitting = nodes.new(type='ShaderNodeTexVoronoi')
    node_pitting.feature = 'DISTANCE_TO_EDGE'
    node_pitting.inputs['Scale'].default_value = 25.0 # Visible from distance
    node_pitting_ramp = nodes.new(type='ShaderNodeValToRGB')
    node_pitting_ramp.color_ramp.elements[0].position = 0.0
    node_pitting_ramp.color_ramp.elements[1].position = 0.2
    links.new(node_pitting.outputs['Distance'], node_pitting_ramp.inputs['Fac'])
    
    node_bump = nodes.new(type='ShaderNodeBump')
    node_bump.inputs['Strength'].default_value = 0.5
    links.new(node_pitting_ramp.outputs['Color'], node_bump.inputs['Height'])
    
    # Enhancement #40: Shader-Based Beveling (Cycles Only)
    node_sbev = nodes.new(type='ShaderNodeBevel')
    node_sbev.inputs['Radius'].default_value = 0.03
    links.new(node_sbev.outputs['Normal'], node_bump.inputs['Normal'])
    
    links.new(node_bump.outputs['Normal'], bsdf.inputs['Normal'])

    return mat

def create_greenhouse_glass_mat():
    mat = bpy.data.materials.get("GH_Glass")
    if mat and mat.node_tree: return mat
    if not mat: mat = bpy.data.materials.new(name="GH_Glass")
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    nodes.clear()

    node_out = nodes.new("ShaderNodeOutputMaterial")
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")

    # Truly transparent - do NOT use Transmission (causes refraction/blur)
    bsdf.inputs["Base Color"].default_value = (0.9, 0.95, 1.0, 1.0)
    bsdf.inputs["Alpha"].default_value = 0.05  # Near-invisible
    bsdf.inputs["Roughness"].default_value = 0.0
    bsdf.inputs["Specular IOR Level"].default_value = 0.5

    # Showcase: Moisture-beaded bump detail
    node_coord = nodes.new(type='ShaderNodeTexCoord')
    node_mapping = nodes.new(type='ShaderNodeMapping')
    node_mapping.inputs['Scale'].default_value = (8, 8, 1)
    links.new(node_coord.outputs['UV'], node_mapping.inputs['Vector'])

    node_moisture = nodes.new(type='ShaderNodeTexNoise')
    node_moisture.inputs['Scale'].default_value = 4.0
    node_moisture.inputs['Detail'].default_value = 12.0
    node_moisture.inputs['Roughness'].default_value = 0.6
    links.new(node_mapping.outputs['Vector'], node_moisture.inputs['Vector'])

    node_bump = nodes.new(type='ShaderNodeBump')
    node_bump.inputs['Strength'].default_value = 0.02 # Subtle beaded look
    node_bump.inputs['Distance'].default_value = 0.012
    links.new(node_moisture.outputs['Fac'], node_bump.inputs['Height'])
    links.new(node_bump.outputs['Normal'], bsdf.inputs['Normal'])

    links.new(bsdf.outputs['BSDF'], node_out.inputs['Surface'])
    style.set_blend_method(mat, 'ALPHA_BLEND')
    return mat


def create_mossy_stone_mat(name="MossyStone"):
    """Enhancement #38: Procedural Moss on Stone Surfaces."""
    mat = bpy.data.materials.get(name)
    if mat and mat.node_tree: return mat
    if not mat: mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links

    bsdf = nodes.get("Principled BSDF") or nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value = (0.5, 0.5, 0.5, 1) # Brightened

    # Moss layer
    node_moss = nodes.new(type='ShaderNodeTexNoise')
    node_moss.inputs['Scale'].default_value = 50.0

    node_mix = style.create_mix_node(mat.node_tree, blend_type='MIX', data_type='RGBA')
    fac_sock, in1_sock, in2_sock = style.get_mix_sockets(node_mix)
    in2_sock.default_value = (0.1, 0.2, 0.05, 1) # Moss green brightened

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

    # Enhancement #38: Moss Displacement (Fuzz)
    node_disp = nodes.new(type='ShaderNodeDisplacement')
    node_disp.inputs['Scale'].default_value = 0.05
    links.new(node_math.outputs[0], node_disp.inputs['Height'])
    links.new(node_disp.outputs['Displacement'], nodes.get("Material Output").inputs['Displacement'])
    mat.displacement_method = 'BOTH'

    return mat

def create_greenhouse_structure(location=(0,0,0), size=(15, 15, 8)):
    """Point 95: Optimized BMesh Greenhouse structure."""
    import bmesh
    main_loc = mathutils.Vector(location)
    
    iron_mat = create_greenhouse_iron_mat()
    glass_mat = create_greenhouse_glass_mat()
    beam_thickness = 0.15 # Doubled for architectural presence
    
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

    # Pillars & Foundation Base
    pillar_locs = [(-size[0]/2, -size[1]/2), (size[0]/2, -size[1]/2), (-size[0]/2, size[1]/2), (size[0]/2, size[1]/2),
                   (0, -size[1]/2), (0, size[1]/2), (-size[0]/2, 0), (size[0]/2, 0)]
    for px, py in pillar_locs:
        # Stone Base (Architectural presence)
        add_beam((px, py, 0.4), (0.3, 0.3, 0.4))
        # Iron Pillar
        add_beam((px, py, size[2]/2 + 0.8), (beam_thickness, beam_thickness, size[2]/2))

    # Horizontal Beams
    for z in [size[2]]: # Removed Z=0 so characters don't stand on a "fence"
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

    # Phase 6: Glass Panels (Architectural Solidification)
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
        
        # Point 150: Set material index to 1 (Glass slot after join)
        for f in bm_glass.faces:
            f.material_index = 1

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
    main_obj.name = "Greenhouse_Structure"

    # Enhancement #40: Cinematic Beveled Hard Edges
    bev = main_obj.modifiers.new(name="Bevel", type='BEVEL')
    bev.width = 0.03 # 3cm for "Big Screen" visibility
    bev.segments = 3
    
    # Enable Weighted Normals for better shading
    main_obj.modifiers.new(name="WeightedNormal", type='WEIGHTED_NORMAL')
    
    # Point 142: Smooth Shading (Blender 4.1+ Fallback)
    # If SMOOTH_BY_ANGLE or use_auto_smooth fails, we rely on Bevel + WeightedNormal
    # which is already added above.
    
    return main_obj
