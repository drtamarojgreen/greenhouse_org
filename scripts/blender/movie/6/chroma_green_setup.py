"""
Chroma Green Setup Module
Isolated background and material setup for green-screen rendering.
"""

try:
    import bpy
except ImportError:
    bpy = None

try:
    from . import config
except (ImportError, ValueError):
    import config


def setup_chroma_green_backdrop():
    """
    Creates a three-plane green-screen backdrop and sets the World background.
    Returns the primary (Wide) backdrop object, or None if bpy is unavailable.
    """
    if not bpy:
        return None

    color = config.CHROMA_GREEN_RGB

    # -----------------------------------------------------------------------
    # Collect already-existing backdrop planes so we don't duplicate them,
    # but still return a valid object at the end.
    # -----------------------------------------------------------------------
    existing_wide = bpy.data.objects.get("ChromaBackdrop_Wide")
    if existing_wide:
        # Scene was already set up — just return the wide backdrop.
        return existing_wide

    # Create collection for 6b pipeline markers
    coll_6b = bpy.data.collections.get("ENV.CHROMA.6b")
    if not coll_6b:
        coll_6b = bpy.data.collections.new("ENV.CHROMA.6b")
        bpy.context.scene.collection.children.link(coll_6b)

    import math
    import mathutils
    import json
    import os

    planes = []

    # 1. Wide-angle backdrop (Y = 50)
    bpy.ops.mesh.primitive_plane_add(size=1000, location=(0, 50, 5))
    bw = bpy.context.active_object
    bw.name = "ChromaBackdrop_Wide"
    # Rotate to be vertical and face the WIDE camera
    bw.rotation_euler = (math.radians(90), 0, 0)
    planes.append(bw)

    # 2. OTS1 backdrop — behind Herbaceous
    bpy.ops.mesh.primitive_plane_add(size=1000, location=(-50, -20, 5))
    bo1 = bpy.context.active_object
    bo1.name = "ChromaBackdrop_OTS1"
    # Angled to face OTS1 camera
    bo1.rotation_euler = (math.radians(90), 0, math.radians(-45))
    planes.append(bo1)

    # 3. OTS2 backdrop — behind Arbor
    bpy.ops.mesh.primitive_plane_add(size=1000, location=(50, 20, 5))
    bo2 = bpy.context.active_object
    bo2.name = "ChromaBackdrop_OTS2"
    # Angled to face OTS2 camera
    bo2.rotation_euler = (math.radians(90), 0, math.radians(45))
    planes.append(bo2)

    # Link planes to 6b collection
    for plane in planes:
        coll_6b.objects.link(plane)

    # Disable light interaction on all backdrops (prevent green spill)
    for backdrop in planes:
        backdrop.visible_shadow      = False
        backdrop.visible_diffuse     = False
        backdrop.visible_glossy      = False
        backdrop.visible_transmission = False

    # Load background image paths from config.json if it exists
    config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config.json")
    try:
        with open(config_path, "r") as f:
            bg_images = json.load(f).get("background_images", [])
    except Exception:
        bg_images = []

    for i, plane in enumerate(planes):
        mat = bpy.data.materials.new(name=f"ImageBackground_{i}")
        mat.use_nodes = True
        nodes = mat.node_tree.nodes
        nodes.clear()

        emit = nodes.new(type='ShaderNodeEmission')
        # Blender 5.0+ compatibility: Use socket names or indices
        strength_socket = emit.inputs.get("Strength") or emit.inputs[1]
        color_socket = emit.inputs.get("Color") or emit.inputs[0]

        strength_socket.default_value = 5.0  # High-strength emission for production

        if bg_images and i < len(bg_images):
            img_path = bg_images[i]
            if os.path.exists(img_path):
                tex_img   = nodes.new(type='ShaderNodeTexImage')
                loaded_img = bpy.data.images.load(filepath=img_path)
                tex_img.image = loaded_img

                tex_coord = nodes.new(type='ShaderNodeTexCoord')
                mat.node_tree.links.new(tex_coord.outputs['Window'], tex_img.inputs['Vector'])
                mat.node_tree.links.new(tex_img.outputs['Color'],    color_socket)
            else:
                color_socket.default_value = (color[0], color[1], color[2], 1.0)
        else:
            color_socket.default_value = (color[0], color[1], color[2], 1.0)

        out = nodes.new(type='ShaderNodeOutputMaterial')
        mat.node_tree.links.new(emit.outputs[0], out.inputs[0])
        plane.data.materials.append(mat)

    # -----------------------------------------------------------------------
    # World background — dark anti-spill setup
    # -----------------------------------------------------------------------
    if not bpy.context.scene.world:
        bpy.context.scene.world = bpy.data.worlds.new("ChromaWorld")

    world = bpy.context.scene.world
    world.use_nodes = True
    world.node_tree.nodes.clear()
    w_nodes = world.node_tree.nodes

    lp         = w_nodes.new(type='ShaderNodeLightPath')
    mix        = w_nodes.new(type='ShaderNodeMixShader')
    bg_dark    = w_nodes.new(type='ShaderNodeBackground')
    bg_neutral = w_nodes.new(type='ShaderNodeBackground')
    w_out      = w_nodes.new(type='ShaderNodeOutputWorld')

    # Blender 5.0+ compatibility
    bg_dark_color = bg_dark.inputs.get("Color") or bg_dark.inputs[0]
    bg_neutral_color = bg_neutral.inputs.get("Color") or bg_neutral.inputs[0]

    bg_dark_color.default_value    = (0.01, 0.01, 0.01, 1.0)  # near-black for camera rays
    bg_neutral_color.default_value = (0.05, 0.05, 0.05, 1.0)  # very dim neutral for lighting

    world.node_tree.links.new(lp.outputs['Is Camera Ray'],  mix.inputs[0])
    world.node_tree.links.new(bg_neutral.outputs[0],        mix.inputs[1])
    world.node_tree.links.new(bg_dark.outputs[0],           mix.inputs[2])
    world.node_tree.links.new(mix.outputs[0],               w_out.inputs[0])

    # -----------------------------------------------------------------------
    # Production Volume Cubes (1000m depth markers)
    # -----------------------------------------------------------------------
    volume_targets = [
        ("VolumeCube_Green",  (0, 1050, 0),   (0, 1, 0, 1)),
        ("VolumeCube_Yellow", (-1050, 0, 0),  (1, 1, 0, 1)),
        ("VolumeCube_Red",    (1050, 0, 0),   (1, 0, 0, 1)),
    ]

    for name, loc, col in volume_targets:
        if not bpy.data.objects.get(name):
            bpy.ops.mesh.primitive_cube_add(size=1000, location=loc)
            cube = bpy.context.active_object
            cube.name = name
            coll_6b.objects.link(cube)

            mat = bpy.data.materials.new(name=f"Mat.{name}")
            mat.use_nodes = True
            nodes = mat.node_tree.nodes
            nodes.clear()
            n_out = nodes.new('ShaderNodeOutputMaterial')
            n_emit = nodes.new('ShaderNodeEmission')
            n_emit.inputs[0].default_value = col
            n_emit.inputs[1].default_value = 0.5 # Subtle volume glow
            mat.node_tree.links.new(n_emit.outputs[0], n_out.inputs[0])
            cube.data.materials.append(mat)

    print("Background setup complete.")
    # planes is guaranteed non-empty here (we only reach this branch when creating fresh)
    return planes[0]


def apply_anti_spill_lighting(subject_obj, backdrop_obj, distance=5.0):
    """
    Placeholder: separates subject lights from backdrop to prevent green spill.
    Implement light-linking here when Blender's light-linking API is available.
    """
    pass


def validate_backdrop_coverage(camera_obj, backdrop_obj):
    """Verifies the backdrop fills the entire camera frame (frustum check)."""
    if not camera_obj or not backdrop_obj: return False

    import mathutils
    from bpy_extras.object_utils import world_to_camera_view

    scene = bpy.context.scene
    mesh = backdrop_obj.data
    matrix = backdrop_obj.matrix_world

    # Check 4 corners of the plane
    corners = [matrix @ v.co for v in mesh.vertices[:4]]
    coords_2d = [world_to_camera_view(scene, camera_obj, c) for c in corners]

    # Check if the backdrop covers the [0,1] range in UV space (camera view)
    min_x = min(c.x for c in coords_2d)
    max_x = max(c.x for c in coords_2d)
    min_y = min(c.y for c in coords_2d)
    max_y = max(c.y for c in coords_2d)

    # Backdrop must encompass the 0.0-1.0 camera frame
    is_covered = (min_x <= 0.0 and max_x >= 1.0 and min_y <= 0.0 and max_y >= 1.0)

    # Diagnostic print
    print(f"COVERAGE: {backdrop_obj.name} vs {camera_obj.name}: X=[{min_x:.2f}, {max_x:.2f}], Y=[{min_y:.2f}, {max_y:.2f}] (OK={is_covered})")

    return is_covered
