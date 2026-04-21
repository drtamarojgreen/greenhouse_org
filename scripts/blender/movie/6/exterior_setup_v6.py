"""
Exterior World Setup Module - Movie 6
Procedural generation of the outdoor greenhouse environment.
All constants are sourced from config.py.
"""
import bpy
import bmesh
import math
import random
import mathutils
import config


def _make_principled_mat(name, color, roughness=0.85, alpha=1.0):
    """Helper: create or reuse a simple Principled BSDF material."""
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.use_nodes = True
    mat.node_tree.nodes.clear()
    n_out = mat.node_tree.nodes.new(type='ShaderNodeOutputMaterial')
    n_d   = mat.node_tree.nodes.new(type='ShaderNodeBsdfPrincipled')
    n_d.inputs['Base Color'].default_value = color
    n_d.inputs['Roughness'].default_value = roughness
    if 'Alpha' in n_d.inputs:
        n_d.inputs['Alpha'].default_value = alpha
    mat.node_tree.links.new(n_d.outputs['BSDF'], n_out.inputs['Surface'])
    if alpha < 1.0:
        mat.blend_method = 'BLEND'
        if hasattr(mat, 'shadow_method'):
            mat.shadow_method = 'NONE'
    return mat


def _link_to_coll(obj, coll):
    """Link an object exclusively to the given collection."""
    if obj.name not in coll.objects:
        coll.objects.link(obj)
    for c in list(obj.users_collection):
        if c != coll:
            c.objects.unlink(obj)


def setup_exterior_world():
    """Entry point to build the full procedural exterior environment."""
    print("Building Exterior World...")
    coll = (bpy.data.collections.get("6b_Environment")
            or bpy.data.collections.new("6b_Environment"))
    if coll.name not in bpy.context.scene.collection.children:
        bpy.context.scene.collection.children.link(coll)

    create_interior_floor(coll)
    create_exterior_floor(coll)
    create_greenhouse_roof(coll)
    create_greenhouse_pillars(coll)
    create_lavender_beds(coll)
    create_rock_path(coll)
    create_mountain_range(coll)
    scatter_exterior_vegetation(coll)
    create_lighting(coll)
    add_doom_character_exterior(coll)


# ---------------------------------------------------------------------------
# FLOORS
# ---------------------------------------------------------------------------

def create_interior_floor(coll):
    """Brown dirt floor inside the greenhouse."""
    name = "interior_floor"
    if bpy.data.objects.get(name):
        return
    bpy.ops.mesh.primitive_plane_add(
        size=config.INTERIOR_FLOOR_SIZE,
        location=(0, 0, -0.02)
    )
    floor = bpy.context.active_object
    floor.name = name
    mat = _make_principled_mat(
        "mat_interior_floor",
        config.INTERIOR_FLOOR_COLOR,
        roughness=1.0
    )
    floor.data.materials.append(mat)
    _link_to_coll(floor, coll)


def create_exterior_floor(coll):
    """Vast green ground plane outside the greenhouse."""
    name = "exterior_floor"
    if bpy.data.objects.get(name):
        return
    bpy.ops.mesh.primitive_circle_add(
        radius=config.EXTERIOR_FLOOR_RADIUS,
        fill_type='NGON',
        location=(0, 0, -0.05)
    )
    floor = bpy.context.active_object
    floor.name = name
    mat = _make_principled_mat(
        "mat_exterior_floor",
        config.EXTERIOR_FLOOR_COLOR,
        roughness=0.9
    )
    floor.data.materials.append(mat)
    _link_to_coll(floor, coll)


# ---------------------------------------------------------------------------
# GREENHOUSE STRUCTURE
# ---------------------------------------------------------------------------

def create_greenhouse_roof(coll):
    """Translucent misty glass roof over the greenhouse."""
    name = "greenhouse_roof"
    if bpy.data.objects.get(name):
        return
    bpy.ops.mesh.primitive_plane_add(
        size=config.GREENHOUSE_ROOF_SIZE,
        location=(0, 0, config.GREENHOUSE_ROOF_HEIGHT)
    )
    roof = bpy.context.active_object
    roof.name = name

    alpha = config.GREENHOUSE_ROOF_ALPHA
    color = (*config.GREENHOUSE_ROOF_COLOR, 1.0)
    mat = _make_principled_mat(
        "mat_greenhouse_roof",
        color,
        roughness=0.05,
        alpha=alpha
    )
    # Glass feel: low metallic, high specular transmission
    for node in mat.node_tree.nodes:
        if node.type == 'BSDF_PRINCIPLED':
            if 'IOR' in node.inputs:
                node.inputs['IOR'].default_value = 1.45
            if 'Specular' in node.inputs:
                node.inputs['Specular'].default_value = 0.8
    roof.data.materials.append(mat)
    _link_to_coll(roof, coll)


# ---------------------------------------------------------------------------
# ROCK PATH
# ---------------------------------------------------------------------------

def create_rock_path(coll):
    """Sinuous grey stone path starting outside the greenhouse front wall, extending outward."""
    name = "rock_path"
    if bpy.data.objects.get(name):
        return

    mesh = bpy.data.meshes.new(name)
    obj  = bpy.data.objects.new(name, mesh)
    coll.objects.link(obj)

    bm   = bmesh.new()
    segs = config.ROCK_PATH_SEGMENTS
    length = config.ROCK_PATH_LENGTH
    w = config.ROCK_PATH_WIDTH / 2.0

    # Path starts at the FRONT EDGE of the greenhouse (-INTERIOR_WALL_HALF)
    # and extends further in the -Y direction (toward exterior cameras).
    y_start = -config.INTERIOR_WALL_HALF
    y_end   = y_start - length

    for i in range(segs):
        t0 = i / segs
        t1 = (i + 1) / segs
        y0 = y_start + t0 * (y_end - y_start)
        y1 = y_start + t1 * (y_end - y_start)
        # Gentle sinusoidal weave
        x_off0 = math.sin(t0 * math.pi * 2.0) * (config.ROCK_PATH_WIDTH * 0.6)
        x_off1 = math.sin(t1 * math.pi * 2.0) * (config.ROCK_PATH_WIDTH * 0.6)

        v0 = bm.verts.new((x_off0 - w, y0, 0.005))
        v1 = bm.verts.new((x_off0 + w, y0, 0.005))
        v2 = bm.verts.new((x_off1 + w, y1, 0.005))
        v3 = bm.verts.new((x_off1 - w, y1, 0.005))
        bm.faces.new((v0, v1, v2, v3))

    bm.to_mesh(mesh)
    bm.free()

    mat = _make_principled_mat(
        "mat_rock_path",
        config.ROCK_PATH_COLOR,
        roughness=0.95
    )
    obj.data.materials.append(mat)


# ---------------------------------------------------------------------------
# MOUNTAINS
# ---------------------------------------------------------------------------

def create_mountain_range(coll):
    """Distant ring of low-poly mountains on the horizon."""
    name = "mountain_range"
    if bpy.data.objects.get(name):
        return

    mesh = bpy.data.meshes.new(name)
    obj  = bpy.data.objects.new(name, mesh)
    coll.objects.link(obj)

    bm = bmesh.new()
    num_peaks = config.MOUNTAIN_NUM_PEAKS
    radius    = config.MOUNTAIN_RING_RADIUS

    for i in range(num_peaks):
        angle = (i / num_peaks) * math.pi * 2
        r_off = random.uniform(-config.MOUNTAIN_JITTER, config.MOUNTAIN_JITTER)
        px    = math.sin(angle) * (radius + r_off)
        py    = math.cos(angle) * (radius + r_off)

        peak_h = random.uniform(config.MOUNTAIN_PEAK_H_MIN, config.MOUNTAIN_PEAK_H_MAX)
        peak_w = random.uniform(config.MOUNTAIN_PEAK_W_MIN, config.MOUNTAIN_PEAK_W_MAX)

        b_off = (math.pi * 2 / num_peaks) / 2
        v1 = bm.verts.new((math.sin(angle - b_off) * (radius + peak_w / 2),
                           math.cos(angle - b_off) * (radius + peak_w / 2), 0))
        v2 = bm.verts.new((math.sin(angle + b_off) * (radius + peak_w / 2),
                           math.cos(angle + b_off) * (radius + peak_w / 2), 0))
        v3 = bm.verts.new((math.sin(angle) * (radius - peak_w / 2),
                           math.cos(angle) * (radius - peak_w / 2), 0))
        v_peak = bm.verts.new((px, py, peak_h))
        bm.faces.new((v1, v2, v_peak))
        bm.faces.new((v2, v3, v_peak))
        bm.faces.new((v3, v1, v_peak))

    bm.to_mesh(mesh)
    bm.free()

    mat = _make_principled_mat("mat_mountains", config.MOUNTAIN_COLOR)
    obj.data.materials.append(mat)


# ---------------------------------------------------------------------------
# VEGETATION SCATTER
# ---------------------------------------------------------------------------

def scatter_exterior_vegetation(coll):
    """Scatter a mix of branching trees and bushes — NEVER in the front corridor.

    The front corridor is the entire -Y hemisphere (Y < 0), which is the
    clear zone between the greenhouse entrance and the exterior cameras.
    Vegetation is restricted to Y >= 0 (back and sides of the greenhouse).
    """
    tree_types = ['evergreen', 'maple', 'oak', 'bush']
    # Weighted distribution: 30% evergreen, 25% maple, 25% oak, 20% bush
    weights = [0.30, 0.25, 0.25, 0.20]

    placed = 0
    attempts = 0
    max_attempts = config.EXTERIOR_NUM_TREES * 10  # Guard against infinite loop

    while placed < config.EXTERIOR_NUM_TREES and attempts < max_attempts:
        attempts += 1
        angle = random.uniform(0, math.pi * 2)
        dist  = random.uniform(config.EXTERIOR_TREE_MIN_DIST,
                               config.EXTERIOR_TREE_MAX_DIST)
        loc_x = math.sin(angle) * dist
        loc_y = math.cos(angle) * dist

        # CLEAR FRONT RULE: skip any placement in the -Y hemisphere
        if loc_y < 0:
            continue

        loc   = (loc_x, loc_y, 0)
        kind  = random.choices(tree_types, weights=weights, k=1)[0]
        scale = random.uniform(2.5, 5.0)  # Larger scale relative to greenhouse

        if kind == 'evergreen':
            _create_branching_tree(
                f"exterior_tree_{placed}", loc, scale, coll,
                config.EXTERIOR_EVERGREEN_SHADES
            )
        elif kind == 'maple':
            _create_branching_tree(
                f"exterior_maple_{placed}", loc, scale, coll,
                config.EXTERIOR_MAPLE_SHADES,
                canopy_shape='round'
            )
        elif kind == 'oak':
            _create_branching_tree(
                f"exterior_oak_{placed}", loc, scale, coll,
                config.EXTERIOR_OAK_SHADES,
                canopy_shape='wide'
            )
        else:
            _create_bush(f"exterior_bush_{placed}", loc, scale * 0.5, coll)

        placed += 1


def _create_trunk_mat():
    return _make_principled_mat("mat_trunk", config.EXTERIOR_TRUNK_COLOR, roughness=0.9)


def _create_foliage_mat(name, shades):
    shade = random.choice(shades)
    return _make_principled_mat(name, shade, roughness=0.8)


# ---------------------------------------------------------------------------
# BRANCHING TREE GENERATOR
# ---------------------------------------------------------------------------

def _create_branching_tree(name, loc, scale, coll, leaf_shades,
                           canopy_shape='conical'):
    """Procedural tree with cylinder trunk, angled branches, and leaf clusters.

    canopy_shape:
        'conical' — tall narrow (evergreen-like)
        'round'   — wide rounded dome (maple-like)
        'wide'    — flattened spread (oak-like)
    """
    mesh = bpy.data.meshes.new(name)
    obj  = bpy.data.objects.new(name, mesh)
    coll.objects.link(obj)
    obj.location = loc

    bm = bmesh.new()

    trunk_h = 5.0 * scale
    trunk_r = 0.28 * scale

    # --- Trunk ---
    bmesh.ops.create_cone(
        bm, segments=8,
        radius1=trunk_r, radius2=trunk_r * 0.55, depth=trunk_h,
        matrix=mathutils.Matrix.Translation((0, 0, trunk_h / 2))
    )

    # --- Major branches ---
    if canopy_shape == 'conical':
        num_branches = random.randint(4, 5)
        spread = 0.5      # Outward lean
        up_bias = 0.7
        leaf_r_range = (0.9, 1.4)
    elif canopy_shape == 'round':
        num_branches = random.randint(5, 7)
        spread = 0.85
        up_bias = 0.45
        leaf_r_range = (1.2, 1.9)
    else:  # wide / oak
        num_branches = random.randint(4, 6)
        spread = 1.1
        up_bias = 0.25
        leaf_r_range = (1.3, 2.1)

    leaf_centres = []

    for i in range(num_branches):
        b_angle = (i / num_branches) * math.pi * 2 + random.uniform(-0.4, 0.4)
        bz_frac = random.uniform(0.55, 0.88)  # Start height fraction of trunk
        bz = trunk_h * bz_frac
        bl = random.uniform(1.8, 3.0) * scale  # Branch length

        # Direction outward + slightly up
        dx = math.sin(b_angle) * spread
        dy = math.cos(b_angle) * spread
        dz = up_bias + random.uniform(-0.1, 0.2)
        length = math.sqrt(dx**2 + dy**2 + dz**2)
        dx, dy, dz = dx / length, dy / length, dz / length

        sx, sy, sz = dx * trunk_r * 0.5, dy * trunk_r * 0.5, bz
        ex = sx + dx * bl
        ey = sy + dy * bl
        ez = sz + dz * bl

        mid = mathutils.Vector(((sx + ex) / 2, (sy + ey) / 2, (sz + ez) / 2))
        branch_vec = mathutils.Vector((dx, dy, dz))
        rot_mat = branch_vec.to_track_quat('Z', 'Y').to_matrix().to_4x4()
        trans_mat = mathutils.Matrix.Translation(mid)

        bmesh.ops.create_cone(
            bm, segments=5,
            radius1=trunk_r * 0.30, radius2=trunk_r * 0.10, depth=bl,
            matrix=trans_mat @ rot_mat
        )
        leaf_centres.append((ex, ey, ez))

        # 1–2 secondary branches from each major branch
        for _ in range(random.randint(1, 2)):
            sub_angle = b_angle + random.uniform(-0.8, 0.8)
            sdx = math.sin(sub_angle) * spread * 0.7
            sdy = math.cos(sub_angle) * spread * 0.7
            sdz = up_bias * 0.6 + random.uniform(0, 0.3)
            sl = math.sqrt(sdx**2 + sdy**2 + sdz**2)
            sdx, sdy, sdz = sdx / sl, sdy / sl, sdz / sl
            sbl = bl * random.uniform(0.45, 0.65)
            smid_x = ex + sdx * sbl / 2
            smid_y = ey + sdy * sbl / 2
            smid_z = ez + sdz * sbl / 2
            svec = mathutils.Vector((sdx, sdy, sdz))
            srot = svec.to_track_quat('Z', 'Y').to_matrix().to_4x4()
            strans = mathutils.Matrix.Translation((smid_x, smid_y, smid_z))
            bmesh.ops.create_cone(
                bm, segments=4,
                radius1=trunk_r * 0.15, radius2=trunk_r * 0.05, depth=sbl,
                matrix=strans @ srot
            )
            leaf_centres.append((
                ex + sdx * sbl, ey + sdy * sbl, ez + sdz * sbl
            ))

    # --- Leaf clusters at all branch tips ---
    for (lx, ly, lz) in leaf_centres:
        lr = random.uniform(*leaf_r_range) * scale
        bmesh.ops.create_uvsphere(
            bm, u_segments=7, v_segments=5, radius=lr,
            matrix=mathutils.Matrix.Translation((lx, ly, lz))
        )

    bm.to_mesh(mesh)
    bm.free()

    mat_t = _create_trunk_mat()
    mat_l = _create_foliage_mat(f"mat_leaves_{name}", leaf_shades)
    obj.data.materials.append(mat_t)   # index 0: trunk/branches
    obj.data.materials.append(mat_l)   # index 1: leaves

    # Assign by XY radius from Z axis — trunk/branches are near centre
    cutoff_r = trunk_r * 3.5
    for poly in obj.data.polygons:
        c = poly.center
        xy_r = math.sqrt(c.x ** 2 + c.y ** 2)
        poly.material_index = 1 if (xy_r > cutoff_r and c.z > trunk_h * 0.45) else 0

    return obj


# Keep simple bush unchanged
def _create_bush(name, loc, scale, coll):
    """Low rounded shrub."""
    mesh = bpy.data.meshes.new(name)
    obj  = bpy.data.objects.new(name, mesh)
    coll.objects.link(obj)
    obj.location = loc
    obj.scale = (
        random.uniform(0.8, 1.2) * scale,
        random.uniform(0.8, 1.2) * scale,
        random.uniform(0.5, 0.9) * scale,
    )
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=8, v_segments=6, radius=1.5,
                              matrix=mathutils.Matrix.Translation((0, 0, 0.75)))
    bm.to_mesh(mesh)
    bm.free()
    mat = _create_foliage_mat(f"mat_bush_{name}", config.EXTERIOR_BUSH_SHADES)
    obj.data.materials.append(mat)


# ---------------------------------------------------------------------------
# DOOM CHARACTER (Root_Guardian sitting outside the entrance)
# ---------------------------------------------------------------------------

def add_doom_character_exterior(coll):
    """Places Root_Guardian (the doom/skeleton character) outside the greenhouse
    entrance with a gentle idle sway to give it 'more life'.

    Assumes Root_Guardian.Rig is already loaded by the ensemble manager.
    Position: centred on the rock path, just past the front wall.
    """
    if bpy.data.objects.get("doom_exterior"):
        return  # Already placed

    # Try canonical rig names in priority order
    source = (
        bpy.data.objects.get("Root_Guardian.Rig")
        or bpy.data.objects.get("Root_Guardian")
        or bpy.data.objects.get("Shadow_Weaver.Rig")
    )
    if not source:
        print("WARNING: Doom character (Root_Guardian) not found. Skipping exterior placement.")
        return

    doom = source.copy()
    if hasattr(source.data, 'copy'):
        doom.data = source.data.copy()
    doom.name = "doom_exterior"

    # Sit on the rock path, just outside the greenhouse front wall
    doom.location = (0.0, -(config.INTERIOR_WALL_HALF + 3.0), 0.0)
    # Face toward the cameras (-Y direction)
    doom.rotation_euler = (0, 0, math.radians(180))

    coll.objects.link(doom)

    # --- Gentle idle sway animation ---
    if doom.animation_data is None:
        doom.animation_data_create()

    # Slow Z-rotation sway (±6°)
    for frame, angle in [(1, -6), (60, 6), (120, -6), (180, 0), (240, -6)]:
        doom.rotation_euler.z = math.radians(180 + angle)
        doom.keyframe_insert(data_path="rotation_euler", index=2, frame=frame)

    # Subtle vertical float (gives a ghostly hovering feel)
    for frame, z in [(1, 0.0), (80, 0.25), (160, 0.0), (240, -0.1), (320, 0.0)]:
        doom.location.z = z
        doom.keyframe_insert(data_path="location", index=2, frame=frame)

    # Smooth (SINE) interpolation on all keyframes
    if doom.animation_data and doom.animation_data.action:
        for fc in doom.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = 'SINE'

    print(f"Doom character placed at {doom.location} as '{doom.name}'.")


# ---------------------------------------------------------------------------
# GREENHOUSE PILLARS & LEOPARD STATUES
# ---------------------------------------------------------------------------

def create_greenhouse_pillars(coll):
    """Four marble columns at greenhouse corners with sitting leopard statues."""
    if bpy.data.objects.get("pillar_0"):
        return
    half = config.INTERIOR_WALL_HALF
    corners = [(-half, -half), (half, -half), (-half, half), (half, half)]
    for i, (cx, cy) in enumerate(corners):
        _create_pillar(f"pillar_{i}", (cx, cy, 0), coll)
        _create_leopard_statue(f"leopard_{i}", (cx, cy, config.PILLAR_HEIGHT), coll)


def _create_pillar(name, loc, coll):
    mesh = bpy.data.meshes.new(name)
    obj  = bpy.data.objects.new(name, mesh)
    coll.objects.link(obj)
    obj.location = loc
    bm = bmesh.new()
    h = config.PILLAR_HEIGHT
    r = config.PILLAR_RADIUS
    # Base slab
    bmesh.ops.create_cone(bm, segments=16, radius1=r*1.4, radius2=r*1.4, depth=0.5,
                          matrix=mathutils.Matrix.Translation((0, 0, 0.25)))
    # Shaft
    bmesh.ops.create_cone(bm, segments=16, radius1=r, radius2=r*0.9, depth=h-1.0,
                          matrix=mathutils.Matrix.Translation((0, 0, h/2)))
    # Capital
    bmesh.ops.create_cone(bm, segments=16, radius1=r*1.4, radius2=r*1.4, depth=0.5,
                          matrix=mathutils.Matrix.Translation((0, 0, h-0.25)))
    bm.to_mesh(mesh)
    bm.free()
    mat = _make_principled_mat("mat_marble", config.PILLAR_COLOR, roughness=0.08)
    for n in mat.node_tree.nodes:
        if n.type == 'BSDF_PRINCIPLED':
            if 'Specular' in n.inputs:
                n.inputs['Specular'].default_value = 0.9
    obj.data.materials.append(mat)


def _create_leopard_statue(name, loc, coll):
    """Stylised sitting big-cat stone sculpture."""
    mesh = bpy.data.meshes.new(name)
    obj  = bpy.data.objects.new(name, mesh)
    coll.objects.link(obj)
    obj.location = loc
    bm = bmesh.new()

    # Body — upright sitting sphere
    sx = mathutils.Matrix.Scale(1.0, 4, (1, 0, 0))
    sy = mathutils.Matrix.Scale(0.65, 4, (0, 1, 0))
    sz = mathutils.Matrix.Scale(1.35, 4, (0, 0, 1))
    body_mat = mathutils.Matrix.Translation((0, 0, 0.42)) @ (sx @ sy @ sz)
    bmesh.ops.create_uvsphere(bm, u_segments=10, v_segments=8, radius=0.38,
                              matrix=body_mat)
    # Head
    bmesh.ops.create_uvsphere(bm, u_segments=8, v_segments=6, radius=0.20,
                              matrix=mathutils.Matrix.Translation((0.12, 0, 0.92)))
    # Ears
    for ey in [-0.10, 0.10]:
        bmesh.ops.create_cone(bm, segments=4, radius1=0.055, radius2=0, depth=0.11,
                              matrix=mathutils.Matrix.Translation((-0.06, ey, 1.10)))
    # Front paws
    for px in [-0.13, 0.13]:
        bmesh.ops.create_uvsphere(bm, u_segments=6, v_segments=4, radius=0.08,
                                  matrix=mathutils.Matrix.Translation((px, 0.28, 0.08)))
    # Tail arc
    for t in range(5):
        a = t * 0.28
        bmesh.ops.create_cone(bm, segments=4, radius1=0.035, radius2=0.02, depth=0.16,
                              matrix=mathutils.Matrix.Translation(
                                  (-0.32 + t*0.04, 0.1 + math.sin(a)*0.2, 0.15 + t*0.06)))
    bm.to_mesh(mesh)
    bm.free()
    mat = _make_principled_mat("mat_leopard_statue", config.STATUE_COLOR, roughness=0.3)
    obj.data.materials.append(mat)


# ---------------------------------------------------------------------------
# LAVENDER FLOWER BEDS
# ---------------------------------------------------------------------------

def create_lavender_beds(coll):
    """Lavender beds lining the greenhouse front wall, either side of the path."""
    if bpy.data.objects.get("lavender_0_0"):
        return
    half   = config.INTERIOR_WALL_HALF
    path_w = config.ROCK_PATH_WIDTH / 2.0 + 0.6  # Small clearance around path
    y_front = -half

    bed_regions = [(-half, -path_w), (path_w, half)]
    for s, (x_min, x_max) in enumerate(bed_regions):
        for j in range(config.LAVENDER_DENSITY):
            px = random.uniform(x_min, x_max)
            py = random.uniform(y_front - config.LAVENDER_BED_DEPTH, y_front)
            _create_lavender_plant(f"lavender_{s}_{j}", (px, py, 0), coll)


def _create_lavender_plant(name, loc, coll):
    mesh = bpy.data.meshes.new(name)
    obj  = bpy.data.objects.new(name, mesh)
    coll.objects.link(obj)
    obj.location = loc
    bm = bmesh.new()
    for _ in range(random.randint(3, 6)):
        ox = random.uniform(-0.07, 0.07)
        oy = random.uniform(-0.07, 0.07)
        sh = random.uniform(0.28, 0.48)
        # Stalk
        bmesh.ops.create_cone(bm, segments=4, radius1=0.013, radius2=0.008, depth=sh,
                              matrix=mathutils.Matrix.Translation((ox, oy, sh/2)))
        # Flower spike
        bmesh.ops.create_cone(bm, segments=6, radius1=0.038, radius2=0.008, depth=0.11,
                              matrix=mathutils.Matrix.Translation((ox, oy, sh+0.055)))
    bm.to_mesh(mesh)
    bm.free()
    mat_s = _make_principled_mat("mat_lav_stalk",  config.LAVENDER_STALK_COLOR,  roughness=0.9)
    mat_f = _make_principled_mat("mat_lav_flower", config.LAVENDER_FLOWER_COLOR, roughness=0.8)
    obj.data.materials.append(mat_s)
    obj.data.materials.append(mat_f)
    for poly in obj.data.polygons:
        poly.material_index = 1 if poly.center.z > 0.30 else 0


# ---------------------------------------------------------------------------
# LIGHTING — SUN + PATH TORCHES
# ---------------------------------------------------------------------------

def create_lighting(coll):
    """Sun directional light + emissive torches along the rock path."""
    _create_sun_light()
    _create_path_torches(coll)


def _create_sun_light():
    if bpy.data.objects.get("sun_light"):
        return
    ld = bpy.data.lights.new("sun_light", type='SUN')
    ld.energy = config.SUN_ENERGY
    ld.color  = (1.0, 0.97, 0.88)
    if hasattr(ld, 'angle'):
        ld.angle = math.radians(0.5)
    sun = bpy.data.objects.new("sun_light", ld)
    sun.location = (60, -40, 120)
    sun.rotation_euler = tuple(math.radians(d) for d in config.SUN_ROT_DEGREES)
    bpy.context.scene.collection.objects.link(sun)


def _create_path_torches(coll):
    half    = config.INTERIOR_WALL_HALF
    y_start = -half
    y_end   = y_start - config.ROCK_PATH_LENGTH
    offset  = config.ROCK_PATH_WIDTH / 2.0 + 1.0   # Side offset from path centre
    y       = y_start
    idx     = 0
    while y >= y_end:
        for side in [-1, 1]:
            _create_torch(f"torch_{idx}_{side}", (side * offset, y, 0), coll)
        y   -= config.TORCH_SPACING
        idx += 1


def _create_torch(name, loc, coll):
    """Wooden stick + emissive flame cap + point light."""
    if bpy.data.objects.get(name):
        return
    mesh = bpy.data.meshes.new(name)
    obj  = bpy.data.objects.new(name, mesh)
    coll.objects.link(obj)
    obj.location = loc
    bm = bmesh.new()
    h  = config.TORCH_HEIGHT
    # Stick
    bmesh.ops.create_cone(bm, segments=6, radius1=0.05, radius2=0.04, depth=h,
                          matrix=mathutils.Matrix.Translation((0, 0, h/2)))
    # Bowl
    bmesh.ops.create_cone(bm, segments=8, radius1=0.14, radius2=0.05, depth=0.14,
                          matrix=mathutils.Matrix.Translation((0, 0, h+0.07)))
    # Flame tip
    bmesh.ops.create_cone(bm, segments=6, radius1=0.07, radius2=0, depth=0.28,
                          matrix=mathutils.Matrix.Translation((0, 0, h+0.28)))
    bm.to_mesh(mesh)
    bm.free()

    mat_stick = _make_principled_mat("mat_torch_stick", config.TORCH_STICK_COLOR, roughness=0.9)

    mat_flame = bpy.data.materials.new(f"mat_flame_{name}")
    mat_flame.use_nodes = True
    mat_flame.node_tree.nodes.clear()
    n_out  = mat_flame.node_tree.nodes.new(type='ShaderNodeOutputMaterial')
    n_emit = mat_flame.node_tree.nodes.new(type='ShaderNodeEmission')
    n_emit.inputs['Color'].default_value    = (*config.TORCH_COLOR[:3], 1.0)
    n_emit.inputs['Strength'].default_value = 6.0
    mat_flame.node_tree.links.new(n_emit.outputs['Emission'], n_out.inputs['Surface'])

    obj.data.materials.append(mat_stick)   # index 0
    obj.data.materials.append(mat_flame)   # index 1
    for poly in obj.data.polygons:
        poly.material_index = 1 if poly.center.z > h * 0.88 else 0

    # NOTE: No point light — torches glow visually via emissive material only.
    # Adding actual point lights was consuming 2+ shadow buffer slots per torch
    # and pushing the scene over EEVEE's 2048-slot limit.
