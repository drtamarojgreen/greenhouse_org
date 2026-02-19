import bpy
import math
import mathutils
import style

def create_greenhouse_iron_mat():
    mat = bpy.data.materials.get("GH_Iron")
    if mat: return mat
    mat = bpy.data.materials.new(name="GH_Iron")
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (0.106, 0.302, 0.118, 1) # Greenhouse Brand Green
    bsdf.inputs["Metallic"].default_value = 1.0
    bsdf.inputs["Roughness"].default_value = 0.7

    # Mossy Iron (Noise overlay mixed with base color)
    node_moss = mat.node_tree.nodes.new(type='ShaderNodeTexNoise')
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
    if mat: return mat
    mat = bpy.data.materials.new(name="GH_Glass")
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (0.7, 0.8, 0.9, 1)
    # Point 74: Use Transmission for Cycles, Alpha 1.0 to avoid conflicts
    bsdf.inputs["Alpha"].default_value = 1.0

    # Transmission (Guarded for Blender 5.0 naming drift)
    style.set_principled_socket(bsdf, 'Transmission', 1.0)

    bsdf.inputs["Roughness"].default_value = 0.05

    # Scratched Glass (Noise replacing Musgrave in Blender 5.0)
    node_scratches = mat.node_tree.nodes.new(type='ShaderNodeTexNoise')
    node_scratches.inputs['Scale'].default_value = 50.0
    mat.node_tree.links.new(node_scratches.outputs['Fac'], bsdf.inputs['Roughness'])

    # Enhancement #35: Greenhouse Fogged Glass Effect (Condensation)
    node_fog = mat.node_tree.nodes.new(type='ShaderNodeTexNoise')
    node_fog.inputs['Scale'].default_value = 100.0
    node_ramp = mat.node_tree.nodes.new(type='ShaderNodeValToRGB')
    node_ramp.color_ramp.elements[0].position = 0.4
    node_ramp.color_ramp.elements[1].position = 0.6

    mat.node_tree.links.new(node_fog.outputs['Fac'], node_ramp.inputs['Fac'])
    # Mix fog into Roughness
    mix_rough = mat.node_tree.nodes.new(type='ShaderNodeMath')
    mix_rough.operation = 'ADD'
    mat.node_tree.links.new(node_scratches.outputs['Fac'], mix_rough.inputs[0])
    mat.node_tree.links.new(node_ramp.outputs['Color'], mix_rough.inputs[1])
    mat.node_tree.links.new(mix_rough.outputs[0], bsdf.inputs['Roughness'])

    style.set_blend_method(mat, 'BLEND')
    return mat

def create_ivy(parent_obj, frame_start=1):
    """Enhancement #31: Procedural Ivy on Greenhouse Walls."""
    # Simplified ivy using recursive cuboid growth or particle system
    # We'll use a simple particle system for 'leaf' growth
    bpy.ops.mesh.primitive_plane_add(size=0.1)
    leaf_master = bpy.context.object
    leaf_master.name = "Ivy_Leaf_Master"
    leaf_master.hide_render = True

    mat = bpy.data.materials.new(name="IvyLeafMat")
    mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.02, 0.15, 0.05, 1)
    leaf_master.data.materials.append(mat)

    # Emitter
    emitter = parent_obj
    mod = emitter.modifiers.new(name="IvyParticles", type='PARTICLE_SYSTEM')
    psys = emitter.particle_systems[0]
    psys.settings.type = 'HAIR'
    psys.settings.count = 2000
    psys.settings.render_type = 'OBJECT'
    psys.settings.instance_object = leaf_master
    psys.settings.particle_size = 0.05
    psys.settings.size_random = 0.5
    psys.settings.phase_factor_random = 2.0

    # Animate growth (#31)
    psys.settings.particle_size = 0.001
    psys.settings.keyframe_insert(data_path="particle_size", frame=1)
    psys.settings.particle_size = 0.08
    psys.settings.keyframe_insert(data_path="particle_size", frame=8000)

def create_mossy_stone_mat(name="MossyStone"):
    """Enhancement #38: Procedural Moss on Stone Surfaces."""
    mat = bpy.data.materials.get(name)
    if mat: return mat
    mat = bpy.data.materials.new(name=name)
    nodes, links = mat.node_tree.nodes, mat.node_tree.links

    bsdf = nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (0.3, 0.3, 0.3, 1) # Stone gray

    # Moss layer
    node_moss = nodes.new(type='ShaderNodeTexNoise')
    node_moss.inputs['Scale'].default_value = 50.0

    node_mix = nodes.new(type='ShaderNodeMixRGB')
    node_mix.blend_type = 'MIX'
    node_mix.inputs[2].default_value = (0.05, 0.1, 0.02, 1) # Moss green

    # Height-based gradient for moss (#38)
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

    links.new(node_math.outputs[0], node_mix.inputs[0])
    links.new(node_mix.outputs[0], bsdf.inputs['Base Color'])

    return mat

def create_greenhouse_structure(location=(0,0,0), size=(15, 15, 8)):
    """Creates a 1920s expressionist iron and glass greenhouse."""
    main_loc = mathutils.Vector(location)

    # Container collection
    gh_col = bpy.data.collections.new("Greenhouse_Structure")
    bpy.context.scene.collection.children.link(gh_col)

    iron_mat = create_greenhouse_iron_mat()
    glass_mat = create_greenhouse_glass_mat()

    beam_thickness = 0.08

    # 1. Pillars (Corners and along walls)
    pillar_locs = []
    for x in [-size[0]/2, size[0]/2]:
        for y in [-size[1]/2, size[1]/2]:
            pillar_locs.append((x, y))

    # Mid-wall pillars
    pillar_locs.append((0, -size[1]/2))
    pillar_locs.append((0, size[1]/2))
    pillar_locs.append((-size[0]/2, 0))
    pillar_locs.append((size[0]/2, 0))

    for px, py in pillar_locs:
        bpy.ops.mesh.primitive_cube_add(location=main_loc + mathutils.Vector((px, py, size[2]/2)))
        pillar = bpy.context.object
        pillar.scale = (beam_thickness, beam_thickness, size[2]/2)
        pillar.data.materials.append(iron_mat)
        gh_col.objects.link(pillar)
        # Point 15: Guarded unlink
        if pillar.name in bpy.context.scene.collection.objects:
            bpy.context.scene.collection.objects.unlink(pillar)

    # 2. Horizontal Beams (Floor and Top of walls)
    for z in [0, size[2]]:
        # Longitudinal
        for x in [-size[0]/2, size[0]/2]:
            bpy.ops.mesh.primitive_cube_add(location=main_loc + mathutils.Vector((x, 0, z)))
            beam = bpy.context.object
            beam.scale = (beam_thickness, size[1]/2, beam_thickness)
            beam.data.materials.append(iron_mat)
            gh_col.objects.link(beam)
            if beam.name in bpy.context.scene.collection.objects:
                bpy.context.scene.collection.objects.unlink(beam)
        # Latitudinal
        for y in [-size[1]/2, size[1]/2]:
            bpy.ops.mesh.primitive_cube_add(location=main_loc + mathutils.Vector((0, y, z)))
            beam = bpy.context.object
            beam.scale = (size[0]/2, beam_thickness, beam_thickness)
            beam.data.materials.append(iron_mat)
            gh_col.objects.link(beam)
            if beam.name in bpy.context.scene.collection.objects:
                bpy.context.scene.collection.objects.unlink(beam)

    # 3. Gabled Roof
    peak_height = size[2] + 4
    # Peak beam
    bpy.ops.mesh.primitive_cube_add(location=main_loc + mathutils.Vector((0, 0, peak_height)))
    peak_beam = bpy.context.object
    peak_beam.scale = (size[0]/2, beam_thickness, beam_thickness)
    peak_beam.data.materials.append(iron_mat)
    gh_col.objects.link(peak_beam)
    if peak_beam.name in bpy.context.scene.collection.objects:
        bpy.context.scene.collection.objects.unlink(peak_beam)

    # Rafters
    for x in [-size[0]/2, 0, size[0]/2]:
        for side_y in [-1, 1]:
            y_start = side_y * size[1]/2
            z_start = size[2]
            y_end = 0
            z_end = peak_height

            mid = mathutils.Vector((x, (y_start + y_end)/2, (z_start + z_end)/2))
            dist = math.sqrt((y_end - y_start)**2 + (z_end - z_start)**2)
            angle = math.atan2(z_end - z_start, y_end - y_start)

            bpy.ops.mesh.primitive_cube_add(location=main_loc + mid)
            rafter = bpy.context.object
            rafter.scale = (beam_thickness, dist/2, beam_thickness)
            rafter.rotation_euler[0] = angle - math.pi/2
            rafter.data.materials.append(iron_mat)
            gh_col.objects.link(rafter)
            if rafter.name in bpy.context.scene.collection.objects:
                bpy.context.scene.collection.objects.unlink(rafter)

    # 4. Glass Panes (simplified planes)
    # Walls
    glass_panes = []
    for side in [-1, 1]:
        # X-walls
        bpy.ops.mesh.primitive_plane_add(location=main_loc + mathutils.Vector((side * size[0]/2, 0, size[2]/2)), rotation=(0, math.pi/2, 0))
        pane = bpy.context.object
        pane.scale = (size[2]/2, size[1]/2, 1)
        pane.data.materials.append(glass_mat)
        glass_panes.append(pane)

        # Y-walls
        bpy.ops.mesh.primitive_plane_add(location=main_loc + mathutils.Vector((0, side * size[1]/2, size[2]/2)), rotation=(math.pi/2, 0, 0))
        pane = bpy.context.object
        pane.scale = (size[0]/2, size[2]/2, 1)
        pane.data.materials.append(glass_mat)
        glass_panes.append(pane)

    # Point 29: Join all parts to minimize object count and noise modifier overhead
    bpy.ops.object.select_all(action='DESELECT')
    for obj in gh_col.objects:
        obj.select_set(True)
    for pane in glass_panes:
        pane.select_set(True)

    # Point 29/7: We join everything into one main object
    # Ensure we have a valid active object that is a mesh from our collection
    main_obj = gh_col.objects[0]
    bpy.context.view_layer.objects.active = main_obj
    bpy.ops.object.join()
    main_obj.name = "Greenhouse_Main"

    # Ensure it's in the collection
    if main_obj.name not in gh_col.objects:
        gh_col.objects.link(main_obj)

    # Enhancement #31: Ivy
    create_ivy(main_obj)

    return gh_col

if __name__ == "__main__":
    # Test
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    create_greenhouse_structure()
