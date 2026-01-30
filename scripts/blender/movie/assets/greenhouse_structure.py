import bpy
import math
import mathutils

def create_greenhouse_iron_mat():
    mat = bpy.data.materials.get("GH_Iron")
    if mat: return mat
    mat = bpy.data.materials.new(name="GH_Iron")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (0.02, 0.02, 0.02, 1)
    bsdf.inputs["Metallic"].default_value = 1.0
    bsdf.inputs["Roughness"].default_value = 0.7
    return mat

def create_greenhouse_glass_mat():
    mat = bpy.data.materials.get("GH_Glass")
    if mat: return mat
    mat = bpy.data.materials.new(name="GH_Glass")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (0.7, 0.8, 0.9, 1)
    bsdf.inputs["Alpha"].default_value = 0.15
    if "Transmission" in bsdf.inputs:
        bsdf.inputs["Transmission"].default_value = 1.0
    elif "Transmission Weight" in bsdf.inputs:
        bsdf.inputs["Transmission Weight"].default_value = 1.0
    bsdf.inputs["Roughness"].default_value = 0.05
    mat.blend_method = 'BLEND'
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
        bpy.context.collection.objects.unlink(pillar)

    # 2. Horizontal Beams (Floor and Top of walls)
    for z in [0, size[2]]:
        # Longitudinal
        for x in [-size[0]/2, size[0]/2]:
            bpy.ops.mesh.primitive_cube_add(location=main_loc + mathutils.Vector((x, 0, z)))
            beam = bpy.context.object
            beam.scale = (beam_thickness, size[1]/2, beam_thickness)
            beam.data.materials.append(iron_mat)
            gh_col.objects.link(beam)
            bpy.context.collection.objects.unlink(beam)
        # Latitudinal
        for y in [-size[1]/2, size[1]/2]:
            bpy.ops.mesh.primitive_cube_add(location=main_loc + mathutils.Vector((0, y, z)))
            beam = bpy.context.object
            beam.scale = (size[0]/2, beam_thickness, beam_thickness)
            beam.data.materials.append(iron_mat)
            gh_col.objects.link(beam)
            bpy.context.collection.objects.unlink(beam)

    # 3. Gabled Roof
    peak_height = size[2] + 4
    # Peak beam
    bpy.ops.mesh.primitive_cube_add(location=main_loc + mathutils.Vector((0, 0, peak_height)))
    peak_beam = bpy.context.object
    peak_beam.scale = (size[0]/2, beam_thickness, beam_thickness)
    peak_beam.data.materials.append(iron_mat)
    gh_col.objects.link(peak_beam)
    bpy.context.collection.objects.unlink(peak_beam)

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
            bpy.context.collection.objects.unlink(rafter)

    # 4. Glass Panes (simplified planes)
    # Walls
    for side in [-1, 1]:
        # X-walls
        bpy.ops.mesh.primitive_plane_add(location=main_loc + mathutils.Vector((side * size[0]/2, 0, size[2]/2)), rotation=(0, math.pi/2, 0))
        pane = bpy.context.object
        pane.scale = (size[2]/2, size[1]/2, 1)
        pane.data.materials.append(glass_mat)
        gh_col.objects.link(pane)
        bpy.context.collection.objects.unlink(pane)

        # Y-walls
        bpy.ops.mesh.primitive_plane_add(location=main_loc + mathutils.Vector((0, side * size[1]/2, size[2]/2)), rotation=(math.pi/2, 0, 0))
        pane = bpy.context.object
        pane.scale = (size[0]/2, size[2]/2, 1)
        pane.data.materials.append(glass_mat)
        gh_col.objects.link(pane)
        bpy.context.collection.objects.unlink(pane)

    return gh_col

if __name__ == "__main__":
    # Test
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    create_greenhouse_structure()
