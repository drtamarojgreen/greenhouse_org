"""
test_5_showcase_render.py

High-fidelity greenhouse asset showcase.
Renders scripts/blender/movie/renders/greenhouse_showcase.png

Designed to demonstrate procedural realism:
  - Orchid with layered petal geometry and translucent SSS material
  - Bird-of-paradise leaf with venation bump and waxy coating
  - Terracotta pot with rim detail, drainage hole, aged-clay texture
  - Hanging basket with woven-wire frame, trailing ivy strands, soil disc
  - Moisture-beaded glass pane (greenhouse wall section)
  - Volumetric humidity haze inside the frame
  - Warm grow-light + cool ambient bounce

Run:
    blender -b -P scripts/blender/movie/tests/test_5_showcase_render.py
"""

import bpy
import bmesh
import math
import mathutils
import os
import sys
import random

# Add movie root to path for style_utilities access
MOVIE_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if MOVIE_ROOT not in sys.path:
    sys.path.append(MOVIE_ROOT)

import style_utilities as style

random.seed(42)

# ---------------------------------------------------------------------------
# Output path (Point 142: Robust pathing)
# ---------------------------------------------------------------------------
RENDER_DIR   = os.path.join(MOVIE_ROOT, "renders")
RENDER_PATH  = os.path.join(RENDER_DIR, "greenhouse_showcase")
os.makedirs(RENDER_DIR, exist_ok=True)

# ---------------------------------------------------------------------------
# Shorthand
# ---------------------------------------------------------------------------

def link(obj):
    if obj.name not in bpy.context.scene.collection.objects:
        bpy.context.scene.collection.objects.link(obj)

def new_mesh_obj(name, mesh):
    obj = bpy.data.objects.new(name, mesh)
    link(obj)
    return obj

def apply_mat(obj, mat):
    obj.data.materials.clear()
    obj.data.materials.append(mat)

def set_smooth(obj):
    for poly in obj.data.polygons:
        poly.use_smooth = True

def add_subsurf(obj, levels=2, render_levels=3):
    mod = obj.modifiers.new("Subd", 'SUBSURF')
    mod.levels        = levels
    mod.render_levels = render_levels
    return mod

# ===========================================================================
# MATERIALS — every node built explicitly, no legacy MixRGB
# ===========================================================================

def _clear_tree(mat):
    # use_nodes deprecated in Blender 5 — node_tree always exists on materials
    tree = getattr(mat, "node_tree", None)
    if tree is None:
        raise RuntimeError(f"Material '{mat.name}' has no node_tree")
    tree.nodes.clear()
    return tree

def _out_bsdf(tree, location=(400, 0)):
    out  = tree.nodes.new("ShaderNodeOutputMaterial"); out.location  = location
    bsdf = tree.nodes.new("ShaderNodeBsdfPrincipled"); bsdf.location = (location[0]-300, location[1])
    tree.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return bsdf, out

def _mix(tree, fac=0.5, loc=(0,0)):
    """ShaderNodeMix (Blender 4+) — no legacy MixRGB."""
    n = style.create_mix_node(tree, blend_type='MIX', data_type='RGBA')
    n.location = loc
    fac_s, _, _ = style.get_mix_sockets(n)
    if fac_s: style.set_socket_value(fac_s, fac)
    return n

def _noise(tree, scale=5.0, detail=8.0, roughness=0.6, loc=(0,0)):
    n = tree.nodes.new("ShaderNodeTexNoise")
    style.set_node_input(n, 'Scale', scale)
    style.set_node_input(n, 'Detail', detail)
    style.set_node_input(n, 'Roughness', roughness)
    n.location = loc
    return n

def _wave(tree, scale=4.0, distortion=1.5, loc=(0,0)):
    n = tree.nodes.new("ShaderNodeTexWave")
    style.set_node_input(n, 'Scale', scale)
    style.set_node_input(n, 'Distortion', distortion)
    n.location = loc
    return n

def _coord(tree, loc=(-600,0)):
    n = tree.nodes.new("ShaderNodeTexCoord"); n.location = loc; return n

def _mapping(tree, scale=(1,1,1), loc=(-400,0)):
    n = tree.nodes.new("ShaderNodeMapping")
    style.set_node_input(n, 'Scale', scale)
    n.location = loc; return n

def _bump(tree, strength=0.4, distance=0.02, loc=(0,0)):
    n = tree.nodes.new("ShaderNodeBump")
    style.set_node_input(n, 'Strength', strength)
    style.set_node_input(n, 'Distance', distance)
    n.location = loc; return n

def _rgb2bw(tree, loc=(0,0)):
    n = tree.nodes.new("ShaderNodeRGBToBW"); n.location=loc; return n

def _coloramp(tree, stops, loc=(0,0)):
    """stops = list of (pos, (r,g,b,a))"""
    n = tree.nodes.new("ShaderNodeValToRGB"); n.location = loc
    ramp = n.color_ramp
    # Remove extras, add needed
    while len(ramp.elements) > len(stops):
        ramp.elements.remove(ramp.elements[-1])
    while len(ramp.elements) < len(stops):
        ramp.elements.new(0.5)
    for i,(pos,col) in enumerate(stops):
        ramp.elements[i].position = pos
        ramp.elements[i].color    = col
    return n

# --- Terracotta clay material -------------------------------------------

def mat_terracotta(name="Mat_Terracotta"):
    mat  = bpy.data.materials.new(name)
    tree = _clear_tree(mat)
    bsdf, _ = _out_bsdf(tree, (700, 0))

    coord   = _coord(tree, (-700, 200))
    mapping = _mapping(tree, (3,3,3), (-500, 200))
    noise1  = _noise(tree, scale=6.0,  detail=10, roughness=0.65, loc=(-250, 300))
    noise2  = _noise(tree, scale=18.0, detail=4,  roughness=0.8,  loc=(-250, 100))
    mix_col = _mix(tree, 0.35, loc=(0, 200))

    # Colour blend: warm terracotta → darker aged clay
    ramp1 = _coloramp(tree, [
        (0.0, (0.55, 0.22, 0.10, 1.0)),
        (0.4, (0.68, 0.30, 0.14, 1.0)),
        (1.0, (0.38, 0.14, 0.06, 1.0)),
    ], loc=(-100, 300))
    ramp2 = _coloramp(tree, [
        (0.0, (0.42, 0.16, 0.07, 1.0)),
        (1.0, (0.72, 0.35, 0.18, 1.0)),
    ], loc=(-100, 100))

    # Point 72: Combined Normals/Bump (Bark-like complexity)
    bump_n  = _noise(tree, scale=22.0, detail=6, roughness=0.9, loc=(-250, -150))
    bump1   = _bump(tree, 0.3, 0.004, loc=(200, -200))
    bump2   = _bump(tree, 0.6, 0.010, loc=(400, -200))
    r2bw    = _rgb2bw(tree, loc=(50, -150))

    tree.links.new(coord.outputs["UV"],  mapping.inputs["Vector"])
    tree.links.new(mapping.outputs[0],   noise1.inputs["Vector"])
    tree.links.new(mapping.outputs[0],   noise2.inputs["Vector"])
    tree.links.new(mapping.outputs[0],   bump_n.inputs["Vector"])
    tree.links.new(noise1.outputs["Color"], ramp1.inputs["Fac"])
    tree.links.new(noise2.outputs["Color"], ramp2.inputs["Fac"])
    tree.links.new(ramp1.outputs["Color"],  mix_col.inputs[1])
    tree.links.new(ramp2.outputs["Color"],  mix_col.inputs[2])
    tree.links.new(style.get_mix_output(mix_col), bsdf.inputs["Base Color"])
    tree.links.new(bump_n.outputs["Fac"],  r2bw.inputs["Color"])
    tree.links.new(r2bw.outputs["Val"],    bump1.inputs["Height"])
    tree.links.new(bump1.outputs["Normal"], bump2.inputs["Normal"])
    tree.links.new(r2bw.outputs["Val"],    bump2.inputs["Height"])
    tree.links.new(bump2.outputs["Normal"], bsdf.inputs["Normal"])

    style.set_principled_socket(mat, "Roughness", 0.88)
    style.set_principled_socket(mat, "Specular", 0.04)
    return mat


# --- Waxy leaf material (bird-of-paradise) --------------------------------

def mat_leaf_waxy(name="Mat_LeafWaxy"):
    mat  = bpy.data.materials.new(name)
    tree = _clear_tree(mat)
    bsdf, _ = _out_bsdf(tree, (900, 0))

    coord   = _coord(tree, (-900, 100))
    mapping = _mapping(tree, (1,6,1), (-700, 100))   # stretch along blade

    # Venation — wave texture along V axis
    wave    = _wave(tree, scale=12.0, distortion=0.8, loc=(-450, 200))
    vein_ramp = _coloramp(tree, [
        (0.0, (0.05, 0.28, 0.06, 1.0)),   # dark blade
        (0.45,(0.10, 0.40, 0.08, 1.0)),   # mid
        (0.55,(0.72, 0.82, 0.20, 1.0)),   # vein highlight
        (1.0, (0.05, 0.28, 0.06, 1.0)),
    ], loc=(-150, 200))

    # Surface micro-noise for wax variation
    noise   = _noise(tree, 14.0, 6, 0.5, loc=(-450, -50))
    wax_ramp= _coloramp(tree, [
        (0.0, (0.04, 0.22, 0.04, 1.0)),
        (1.0, (0.18, 0.55, 0.10, 1.0)),
    ], loc=(-150, -50))
    mix_col = _mix(tree, 0.25, (100, 100))

    # Bump from venation
    bump    = _bump(tree, 0.7, 0.015, loc=(500, -150))
    r2bw    = _rgb2bw(tree, loc=(300, -150))

    tree.links.new(coord.outputs["UV"],       mapping.inputs["Vector"])
    tree.links.new(mapping.outputs[0],        wave.inputs["Vector"])
    tree.links.new(mapping.outputs[0],        noise.inputs["Vector"])
    tree.links.new(wave.outputs["Color"],     vein_ramp.inputs["Fac"])
    tree.links.new(noise.outputs["Color"],    wax_ramp.inputs["Fac"])
    tree.links.new(vein_ramp.outputs["Color"],mix_col.inputs[1])
    tree.links.new(wax_ramp.outputs["Color"], mix_col.inputs[2])
    tree.links.new(style.get_mix_output(mix_col), bsdf.inputs["Base Color"])
    tree.links.new(vein_ramp.outputs["Color"],r2bw.inputs["Color"])
    tree.links.new(r2bw.outputs["Val"],       bump.inputs["Height"])
    tree.links.new(bump.outputs["Normal"],    bsdf.inputs["Normal"])

    style.set_principled_socket(mat, "Roughness", 0.18)
    style.set_principled_socket(mat, "Sheen", 0.15)
    style.set_principled_socket(mat, "Subsurface", 0.08)
    return mat


# --- Orchid petal — translucent SSS with vein blush -----------------------

def mat_orchid_petal(name="Mat_OrchidPetal", hue=(0.85, 0.25, 0.55)):
    mat  = bpy.data.materials.new(name)
    tree = _clear_tree(mat)
    bsdf, _ = _out_bsdf(tree, (900, 0))

    coord   = _coord(tree, (-800, 0))
    mapping = _mapping(tree, (2,2,1), (-600, 0))

    # Petal base gradient: radial gradient from centre
    grad = tree.nodes.new("ShaderNodeTexGradient")
    grad.gradient_type = 'RADIAL'
    grad.location = (-350, 100)

    petal_ramp = _coloramp(tree, [
        (0.0, (*hue, 1.0)),
        (0.5, (min(hue[0]+0.1,1), min(hue[1]+0.12,1), min(hue[2]+0.1,1), 1.0)),
        (1.0, (1.0, 0.92, 0.95, 1.0)),   # white petal tips
    ], loc=(-100, 100))

    # Vein noise overlay
    noise   = _noise(tree, 8.0, 10, 0.7, loc=(-350, -100))
    vein_ramp = _coloramp(tree, [
        (0.0, (hue[0]*0.6, hue[1]*0.3, hue[2]*0.5, 1.0)),
        (0.7, (*hue, 1.0)),
        (1.0, (*hue, 1.0)),
    ], loc=(-100, -100))
    mix_col = _mix(tree, 0.30, (150, 0))

    bump    = _bump(tree, 0.3, 0.005, loc=(500, -150))
    r2bw    = _rgb2bw(tree, loc=(300, -150))

    tree.links.new(coord.outputs["UV"],       mapping.inputs["Vector"])
    tree.links.new(mapping.outputs[0],        grad.inputs["Vector"])
    tree.links.new(mapping.outputs[0],        noise.inputs["Vector"])
    tree.links.new(grad.outputs["Color"],     petal_ramp.inputs["Fac"])
    tree.links.new(noise.outputs["Color"],    vein_ramp.inputs["Fac"])
    tree.links.new(petal_ramp.outputs["Color"],  mix_col.inputs[1])
    tree.links.new(vein_ramp.outputs["Color"],   mix_col.inputs[2])
    tree.links.new(style.get_mix_output(mix_col),    bsdf.inputs["Base Color"])
    tree.links.new(noise.outputs["Color"],    r2bw.inputs["Color"])
    tree.links.new(r2bw.outputs["Val"],       bump.inputs["Height"])
    tree.links.new(bump.outputs["Normal"],    bsdf.inputs["Normal"])

    style.set_principled_socket(mat, "Roughness", 0.12)
    style.set_principled_socket(mat, "Subsurface", 0.25)
    style.set_principled_socket(mat, "Transmission", 0.15)
    return mat


# --- Greenhouse glass — moisture-beaded -----------------------------------

def mat_greenhouse_glass(name="Mat_GreenhouseGlass"):
    mat  = bpy.data.materials.new(name)
    style.set_blend_method(mat, 'BLEND')
    tree = _clear_tree(mat)

    out  = tree.nodes.new("ShaderNodeOutputMaterial"); out.location = (900, 0)
    bsdf = tree.nodes.new("ShaderNodeBsdfPrincipled"); bsdf.location = (600, 0)
    tree.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])

    coord   = _coord(tree, (-700, 200))
    mapping = _mapping(tree, (8,8,1), (-500, 200))
    noise   = _noise(tree, 4.0, 12, 0.6, loc=(-250, 200))
    bump    = _bump(tree, 0.9, 0.012, loc=(300, -100))
    r2bw    = _rgb2bw(tree, loc=(100, -100))

    tree.links.new(coord.outputs["UV"],    mapping.inputs["Vector"])
    tree.links.new(mapping.outputs[0],     noise.inputs["Vector"])
    tree.links.new(noise.outputs["Color"], r2bw.inputs["Color"])
    tree.links.new(r2bw.outputs["Val"],    bump.inputs["Height"])
    tree.links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])

    style.set_principled_socket(mat, "Base Color", (0.85, 0.92, 0.95, 1.0))
    style.set_principled_socket(mat, "Roughness", 0.04)
    style.set_principled_socket(mat, "IOR", 1.52)
    style.set_principled_socket(mat, "Transmission", 0.92)
    style.set_principled_socket(mat, "Alpha", 0.15)
    return mat


# --- Moist soil / growing medium ------------------------------------------

def mat_soil(name="Mat_Soil"):
    mat  = bpy.data.materials.new(name)
    tree = _clear_tree(mat)
    bsdf, _ = _out_bsdf(tree, (700, 0))

    coord   = _coord(tree, (-700, 0))
    mapping = _mapping(tree, (5,5,5), (-500, 0))
    noise1  = _noise(tree, 8.0, 12, 0.8, loc=(-250, 100))
    noise2  = _noise(tree, 35.0, 4, 0.9, loc=(-250, -100))
    mix_col = _mix(tree, 0.4, (0, 0))
    bump    = _bump(tree, 1.2, 0.02, loc=(300, -150))
    r2bw    = _rgb2bw(tree, loc=(100, -150))

    soil_ramp = _coloramp(tree, [
        (0.0, (0.09, 0.05, 0.02, 1.0)),   # dark moist soil
        (0.4, (0.16, 0.09, 0.04, 1.0)),
        (0.7, (0.22, 0.13, 0.06, 1.0)),
        (1.0, (0.30, 0.18, 0.09, 1.0)),   # dry top layer
    ], loc=(-50, 100))

    tree.links.new(coord.outputs["UV"],     mapping.inputs["Vector"])
    tree.links.new(mapping.outputs[0],      noise1.inputs["Vector"])
    tree.links.new(mapping.outputs[0],      noise2.inputs["Vector"])
    tree.links.new(noise1.outputs["Color"], soil_ramp.inputs["Fac"])
    tree.links.new(soil_ramp.outputs["Color"], mix_col.inputs[1])
    tree.links.new(noise2.outputs["Color"], mix_col.inputs[2])
    tree.links.new(noise2.outputs["Color"], r2bw.inputs["Color"])
    tree.links.new(r2bw.outputs["Val"],     bump.inputs["Height"])
    tree.links.new(bump.outputs["Normal"],  bsdf.inputs["Normal"])
    tree.links.new(style.get_mix_output(mix_col), bsdf.inputs["Base Color"])

    style.set_principled_socket(mat, "Roughness", 0.97)
    return mat


# --- Woven wire (basket frame) --------------------------------------------

def mat_wire(name="Mat_WireFrame"):
    mat  = bpy.data.materials.new(name)
    tree = _clear_tree(mat)
    bsdf, _ = _out_bsdf(tree, (600, 0))

    style.set_principled_socket(mat, "Metallic", 0.9)
    style.set_principled_socket(mat, "Roughness", 0.35)

    # Oxidation noise
    coord   = _coord(tree, (-500, -50))
    noise   = _noise(tree, 12.0, 6, 0.7, loc=(-250, -50))
    ox_ramp = _coloramp(tree, [
        (0.0, (0.35, 0.28, 0.20, 1.0)),   # rust
        (0.5, (0.55, 0.50, 0.45, 1.0)),   # bare wire
        (1.0, (0.72, 0.68, 0.62, 1.0)),   # bright highlight
    ], loc=(0, -50))
    tree.links.new(coord.outputs["Object"], noise.inputs["Vector"])
    tree.links.new(noise.outputs["Color"],  ox_ramp.inputs["Fac"])
    tree.links.new(ox_ramp.outputs["Color"],bsdf.inputs["Base Color"])
    return mat


# ===========================================================================
# GEOMETRY BUILDERS
# ===========================================================================

# --- Terracotta pot --------------------------------------------------------

def build_terracotta_pot(location=(0,0,0), height=0.55, radius=0.30):
    """Lathe-style pot: cylinder with rim bead and drainage hole."""
    bm = bmesh.new()

    # Profile spline — list of (r, z)
    profile = [
        (radius * 0.40, 0.00),   # base inner
        (radius * 0.42, 0.02),
        (radius * 0.60, 0.04),   # base spread
        (radius * 0.62, 0.05),
        (radius * 0.62, 0.06),
        (radius * 0.90, 0.18),   # belly flare
        (radius * 1.00, 0.35),   # widest
        (radius * 0.94, 0.50),   # shoulder in
        (radius * 0.96, height - 0.04),  # neck out
        (radius * 1.04, height - 0.01),  # rim bead outer
        (radius * 1.00, height),         # rim top
        (radius * 0.92, height - 0.02),  # rim inner
    ]

    SEGS = 32
    rings = []
    for r, z in profile:
        ring = []
        for i in range(SEGS):
            angle = 2 * math.pi * i / SEGS
            v = bm.verts.new((r * math.cos(angle),
                               r * math.sin(angle),
                               z))
            ring.append(v)
        rings.append(ring)

    # Faces between rings
    for ri in range(len(rings) - 1):
        for i in range(SEGS):
            ni = (i + 1) % SEGS
            bm.faces.new([rings[ri][i], rings[ri][ni],
                          rings[ri+1][ni], rings[ri+1][i]])

    # Bottom cap
    cen = bm.verts.new((0, 0, 0.01))
    for i in range(SEGS):
        bm.faces.new([cen, rings[0][(i+1)%SEGS], rings[0][i]])

    bm.normal_update()
    mesh = bpy.data.meshes.new("Mesh_Pot")
    bm.to_mesh(mesh); bm.free()

    obj = new_mesh_obj("Terracotta_Pot", mesh)
    obj.location = location
    set_smooth(obj)
    mod = obj.modifiers.new("Subd", 'SUBSURF')
    mod.levels = 1; mod.render_levels = 2
    apply_mat(obj, mat_terracotta())
    return obj


# --- Bird-of-paradise leaf -------------------------------------------------

def build_bop_leaf(location=(0,0,0), width=0.28, length=1.10, name="Leaf_BOP"):
    """Single elongated leaf with mid-rib and natural droop."""
    bm = bmesh.new()

    SEGS_L = 20   # along blade length
    SEGS_W = 8    # across blade width

    verts = []
    for li in range(SEGS_L + 1):
        t   = li / SEGS_L               # 0..1 along length
        z   = length * t
        droop = -0.18 * (t**2)          # tip droops down
        taper = math.sin(math.pi * t)   # narrow at base and tip
        w   = width * taper

        row = []
        for wi in range(SEGS_W + 1):
            s = wi / SEGS_W - 0.5       # -0.5..0.5 across width
            curve = -0.06 * (1 - (2*s)**2) * t   # slight cup
            v = bm.verts.new((s * w * 2,
                               droop + curve,
                               z))
            row.append(v)
        verts.append(row)

    for li in range(SEGS_L):
        for wi in range(SEGS_W):
            bm.faces.new([verts[li][wi], verts[li][wi+1],
                          verts[li+1][wi+1], verts[li+1][wi]])

    bm.normal_update()
    mesh = bpy.data.meshes.new(f"Mesh_{name}")
    bm.to_mesh(mesh); bm.free()

    obj = new_mesh_obj(name, mesh)
    obj.location = location
    obj.rotation_euler = (math.radians(-15), 0, 0)
    set_smooth(obj)
    apply_mat(obj, mat_leaf_waxy())
    return obj


# --- Orchid plant ----------------------------------------------------------

def build_orchid(location=(0,0,0)):
    """Orchid with spike stem, 5 petals per flower, 2 flowers."""
    root = bpy.data.objects.new("Orchid_Root", None)
    link(root); root.location = location

    petal_mat   = mat_orchid_petal("Mat_Orchid_Petal",   (0.72, 0.12, 0.55))
    labellum_mat= mat_orchid_petal("Mat_Orchid_Labellum",(0.90, 0.55, 0.10))

    def make_petal(parent, cx, cy, cz, rx, ry, rz, sx, sy, sz, mat, name):
        bm = bmesh.new()
        SEGS = 10
        for li in range(SEGS+1):
            t = li/SEGS
            w = math.sin(math.pi * t) * 0.5
            for wi in range(SEGS+1):
                s = wi/SEGS - 0.5
                cup = -0.12*(1-(2*s)**2)*t
                bm.verts.new((s*w, cup, t))
        bm.verts.ensure_lookup_table()
        idx = lambda l,w: l*(SEGS+1)+w
        for l in range(SEGS):
            for w in range(SEGS):
                try:
                    bm.faces.new([bm.verts[idx(l,w)],   bm.verts[idx(l,w+1)],
                                  bm.verts[idx(l+1,w+1)],bm.verts[idx(l+1,w)]])
                except: pass
        bm.normal_update()
        mesh = bpy.data.meshes.new(f"Mesh_{name}")
        bm.to_mesh(mesh); bm.free()
        obj = new_mesh_obj(name, mesh)
        obj.location       = (cx, cy, cz)
        obj.rotation_euler = (rx, ry, rz)
        obj.scale          = (sx, sy, sz)
        set_smooth(obj)
        apply_mat(obj, mat)
        obj.parent = parent
        return obj

    def make_flower(parent, ox, oy, oz, rot_z=0, scale=1.0):
        """5 petals + labellum at offset."""
        for i in range(5):
            angle = 2*math.pi*i/5 + rot_z
            r = 0.22 * scale
            make_petal(parent,
                       r*math.cos(angle), r*math.sin(angle), oz,
                       math.radians(-70), 0, angle + math.pi/2,
                       0.18*scale, 0.18*scale, 0.24*scale,
                       petal_mat, f"Petal_{parent.name}_{i}")
        # Labellum (lip)
        make_petal(parent, 0, -0.08*scale, oz,
                   math.radians(-80), 0, 0,
                   0.22*scale, 0.22*scale, 0.18*scale,
                   labellum_mat, f"Labellum_{parent.name}")

    # Spike — thin cylinder
    bpy.ops.mesh.primitive_cylinder_add(
        radius=0.012, depth=0.85,
        location=(location[0], location[1], location[2] + 0.42)
    )
    spike = bpy.context.object
    spike.name = "Orchid_Spike"
    spike.parent = root
    set_smooth(spike)
    spike_mat = bpy.data.materials.new("Mat_OrchidStem")
    spike_tree = getattr(spike_mat, "node_tree", None)
    if spike_tree is None:
        raise RuntimeError("spike_mat has no node_tree")
    spike_tree.nodes.clear()
    o = spike_tree.nodes.new("ShaderNodeOutputMaterial")
    b = spike_tree.nodes.new("ShaderNodeBsdfPrincipled")
    spike_tree.links.new(b.outputs["BSDF"], o.inputs["Surface"])
    style.set_socket_value(b.inputs["Base Color"], (0.28, 0.52, 0.18, 1.0))
    style.set_socket_value(b.inputs["Roughness"], 0.6)
    apply_mat(spike, spike_mat)

    # Two flowers on the spike
    make_flower(root, 0, 0, 0.62, rot_z=0,              scale=1.0)
    make_flower(root, 0, 0, 0.82, rot_z=math.pi*0.4,    scale=0.85)

    # Two wide leaves at base
    l1 = build_bop_leaf((location[0]-0.05, location[1], location[2]),
                        width=0.20, length=0.70, name="Orchid_Leaf_L")
    l2 = build_bop_leaf((location[0]+0.05, location[1], location[2]),
                        width=0.20, length=0.65, name="Orchid_Leaf_R")
    l1.rotation_euler = (math.radians(-15), 0, math.radians(-30))
    l2.rotation_euler = (math.radians(-15), 0, math.radians( 30))
    l1.parent = root
    l2.parent = root

    return root


# --- Hanging basket -------------------------------------------------------

def build_hanging_basket(location=(0,0,0), name="HangingBasket_Showcase"):
    """Wire-frame bowl with soil disc, trailing ivy blobs, 3 chains."""
    root = bpy.data.objects.new(name, None)
    link(root); root.location = location

    wire_mat = mat_wire()
    soil_mat = mat_soil()

    # Bowl — hemisphere torus stack
    bm = bmesh.new()
    RINGS = 10; SEGS = 28
    radius = 0.38; depth = 0.30
    for ri in range(RINGS+1):
        t     = ri / RINGS
        angle = math.pi * 0.5 * t          # 0 → 90°
        r     = radius * math.cos(angle)
        z     = -depth * math.sin(angle)
        for si in range(SEGS):
            a = 2*math.pi*si/SEGS
            bm.verts.new((r*math.cos(a), r*math.sin(a), z))
    bm.verts.ensure_lookup_table()
    vidx = lambda ri,si: ri*SEGS + si
    for ri in range(RINGS):
        for si in range(SEGS):
            nsi = (si+1) % SEGS
            bm.faces.new([bm.verts[vidx(ri,si)], bm.verts[vidx(ri,nsi)],
                          bm.verts[vidx(ri+1,nsi)], bm.verts[vidx(ri+1,si)]])
    bm.normal_update()
    bowl_mesh = bpy.data.meshes.new(f"Mesh_{name}_Bowl")
    bm.to_mesh(bowl_mesh); bm.free()
    bowl = new_mesh_obj(f"{name}_Bowl", bowl_mesh)
    bowl.parent = root
    set_smooth(bowl)
    wf = bowl.modifiers.new("Wire", 'WIREFRAME')
    wf.thickness = 0.008
    wf.use_even_offset = True
    apply_mat(bowl, wire_mat)

    # Soil disc
    bpy.ops.mesh.primitive_cylinder_add(radius=radius*0.92, depth=0.04,
                                        location=(0, 0, -0.02))
    soil = bpy.context.object
    soil.name = f"{name}_Soil"
    soil.parent = root
    apply_mat(soil, soil_mat)
    bpy.ops.object.shade_smooth()

    # Trailing ivy — small ellipsoids hanging below rim
    ivy_mat = mat_leaf_waxy(f"Mat_Ivy_{name}")
    for i in range(12):
        angle  = 2*math.pi * i/12 + random.uniform(-0.2, 0.2)
        hang   = random.uniform(0.08, 0.28)
        roff   = radius * random.uniform(0.70, 0.95)
        bpy.ops.mesh.primitive_uv_sphere_add(
            radius=random.uniform(0.04, 0.07),
            segments=6, ring_count=4,
            location=(roff*math.cos(angle),
                      roff*math.sin(angle),
                      -hang)
        )
        ivy = bpy.context.object
        ivy.name = f"{name}_Ivy_{i}"
        ivy.scale.z = 0.55
        ivy.parent = root
        set_smooth(ivy)
        apply_mat(ivy, ivy_mat)

    # Three chains up to ceiling hook
    chain_mat = mat_wire(f"Mat_Chain_{name}")
    for ci in range(3):
        angle = 2*math.pi*ci/3
        bpy.ops.mesh.primitive_cylinder_add(
            radius=0.005, depth=0.55,
            location=(radius*0.75*math.cos(angle),
                      radius*0.75*math.sin(angle),
                      0.275)
        )
        chain = bpy.context.object
        chain.name  = f"{name}_Chain_{ci}"
        chain.parent = root
        apply_mat(chain, chain_mat)
        bpy.ops.object.shade_smooth()

    # Sway animation — Point 92: Slotted Action integration
    style.insert_looping_noise(root, "rotation_euler", index=0, strength=math.radians(9), scale=35.0, frame_start=1, frame_end=15000)
    return root


# --- Glass wall panel -----------------------------------------------------

def build_glass_panel(location=(0,0,0), width=2.0, height=1.8, name="Glass_Panel"):
    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=12, y_segments=10, size=1.0)
    # Random moisture warp
    for v in bm.verts:
        v.co.z += random.gauss(0, 0.002)
    bm.normal_update()
    mesh = bpy.data.meshes.new(f"Mesh_{name}")
    bm.to_mesh(mesh); bm.free()
    obj = new_mesh_obj(name, mesh)
    obj.location = location
    obj.scale    = (width, height, 1.0)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(scale=True)
    obj.rotation_euler = (math.radians(90), 0, 0)
    set_smooth(obj)
    apply_mat(obj, mat_greenhouse_glass())
    return obj


# --- Ground plane ---------------------------------------------------------

def build_ground(size=7.0):
    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=size/2)
    mesh = bpy.data.meshes.new("Mesh_Ground")
    bm.to_mesh(mesh); bm.free()
    obj = new_mesh_obj("Ground_Slab", mesh)

    mat  = bpy.data.materials.new("Mat_GreenhouseFloor")
    tree = _clear_tree(mat)
    bsdf, _ = _out_bsdf(tree, (700, 0))
    coord   = _coord(tree, (-600, 0))
    mapping = _mapping(tree, (4,4,1), (-400, 0))
    noise   = _noise(tree, 6.0, 8, 0.55, loc=(-150, 0))
    ramp    = _coloramp(tree, [
        (0.0, (0.28, 0.26, 0.24, 1.0)),
        (0.5, (0.42, 0.40, 0.37, 1.0)),
        (1.0, (0.55, 0.53, 0.50, 1.0)),
    ], loc=(50, 0))
    bump   = _bump(tree, 0.4, 0.006, loc=(350, -100))
    r2bw   = _rgb2bw(tree, loc=(200, -100))
    tree.links.new(coord.outputs["UV"],     mapping.inputs["Vector"])
    tree.links.new(mapping.outputs[0],      noise.inputs["Vector"])
    tree.links.new(noise.outputs["Color"],  ramp.inputs["Fac"])
    tree.links.new(ramp.outputs["Color"],   bsdf.inputs["Base Color"])
    tree.links.new(noise.outputs["Color"],  r2bw.inputs["Color"])
    tree.links.new(r2bw.outputs["Val"],    bump.inputs["Height"])
    tree.links.new(bump.outputs["Normal"],  bsdf.inputs["Normal"])
    style.set_principled_socket(mat, "Roughness", 0.82)
    apply_mat(obj, mat)
    return obj


# ===========================================================================
# LIGHTING
# ===========================================================================

def setup_lighting():
    scene = bpy.context.scene

    # Warm grow-light overhead (orange-tinted area)
    bpy.ops.object.light_add(type='AREA', location=(0, -0.5, 2.8))
    grow = bpy.context.object
    grow.name = "GrowLight_Main"
    grow.data.energy = 280
    grow.data.color  = (1.0, 0.72, 0.35)
    grow.data.size   = 1.2
    grow.rotation_euler = (0, 0, 0)

    # Cool sky-bounce fill from front (simulates greenhouse glass transmission)
    bpy.ops.object.light_add(type='AREA', location=(0, -3.5, 1.5))
    fill = bpy.context.object
    fill.name = "SkyFill"
    fill.data.energy = 80
    fill.data.color  = (0.65, 0.82, 1.0)
    fill.data.size   = 2.5
    fill.rotation_euler = (math.radians(75), 0, 0)

    # Subtle rim from behind (separates plants from background)
    bpy.ops.object.light_add(type='SPOT', location=(1.2, 2.0, 2.4))
    rim = bpy.context.object
    rim.name = "RimLight"
    rim.data.energy     = 180
    rim.data.color      = (0.9, 0.97, 1.0)
    rim.data.spot_size  = math.radians(40)
    rim.data.spot_blend = 0.5
    rim.rotation_euler  = (math.radians(-35), math.radians(15), math.radians(160))

    # World — Point 142: Moderated ambient for Cycles
    world = scene.world or bpy.data.worlds.new("GH_World")
    scene.world = world
    world.use_nodes = True
    bg = next((n for n in world.node_tree.nodes if n.type == 'BACKGROUND'),
              world.node_tree.nodes.new('ShaderNodeBackground'))
    style.set_socket_value(bg.inputs[0], (0.38, 0.45, 0.35, 1.0))
    style.set_socket_value(bg.inputs[1], 0.4)


# ===========================================================================
# CAMERA
# ===========================================================================

def setup_camera():
    scene = bpy.context.scene
    bpy.ops.object.camera_add(location=(1.6, -2.8, 1.45))
    cam = bpy.context.object
    cam.name = "ShowcaseCam"
    cam.data.lens = 85          # portrait-ish telephoto — compresses depth nicely
    cam.data.dof.use_dof = True
    cam.data.dof.focus_distance = 2.9
    cam.data.dof.aperture_fstop = 2.8
    import mathutils
    direction = mathutils.Vector((0, 0.4, 1.0)) - cam.location
    cam.rotation_euler = direction.to_track_quat('-Z','Y').to_euler()
    scene.camera = cam


# ===========================================================================
# RENDER SETTINGS
# ===========================================================================

def setup_render():
    scene = bpy.context.scene
    scene.render.engine        = style.get_eevee_engine_id()
    scene.render.resolution_x  = 1920
    scene.render.resolution_y  = 1080
    scene.render.filepath      = RENDER_PATH
    scene.render.image_settings.file_format = 'PNG'
    scene.render.film_transparent = False

    # EEVEE quality tweaks
    eevee = getattr(scene, 'eevee', None)
    if eevee:
        if hasattr(eevee, 'use_bloom'):    eevee.use_bloom    = True
        if hasattr(eevee, 'bloom_threshold'): eevee.bloom_threshold = 0.8
        if hasattr(eevee, 'bloom_intensity'):  eevee.bloom_intensity = 0.04
        if hasattr(eevee, 'use_ssr'):      eevee.use_ssr      = True
        if hasattr(eevee, 'use_gtao'):     eevee.use_gtao     = True
        if hasattr(eevee, 'gtao_distance'):eevee.gtao_distance = 0.25

    scene.view_settings.view_transform = 'Filmic'
    scene.view_settings.look           = 'Medium High Contrast'
    scene.view_settings.exposure       = 0.3
    scene.view_settings.gamma          = 1.05


# ===========================================================================
# MAIN
# ===========================================================================

def main():
    # Fresh scene
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

    print("\n" + "="*60)
    print("GREENHOUSE SHOWCASE — BUILDING HIGH-FIDELITY ASSETS")
    print("="*60)

    setup_render()
    setup_lighting()

    print("[BUILD] Ground slab…")
    build_ground()

    print("[BUILD] Terracotta pots…")
    p1 = build_terracotta_pot((-0.85, 0.20, 0.0), height=0.52, radius=0.28)
    p2 = build_terracotta_pot(( 0.60, 0.45, 0.0), height=0.42, radius=0.22)
    p3 = build_terracotta_pot((-0.30, 0.65, 0.0), height=0.60, radius=0.32)

    print("[BUILD] Bird-of-paradise leaves…")
    l1 = build_bop_leaf((-0.85, 0.18, 0.52), width=0.32, length=1.20, name="Leaf_BOP_1")
    l2 = build_bop_leaf(( 0.60, 0.43, 0.42), width=0.24, length=0.95, name="Leaf_BOP_2")
    l3 = build_bop_leaf((-0.95, 0.25, 0.54), width=0.28, length=1.05, name="Leaf_BOP_3")
    l3.rotation_euler = (math.radians(-12), 0, math.radians(145))

    print("[BUILD] Orchid…")
    orchid = build_orchid((-0.28, 0.62, 0.60))

    print("[BUILD] Hanging basket…")
    basket = build_hanging_basket((0.0, 0.50, 2.35), name="HangingBasket_Showcase")

    print("[BUILD] Glass wall panel…")
    glass = build_glass_panel((0, 1.95, 0.90), width=3.2, height=1.8)

    print("[BUILD] Camera…")
    setup_camera()

    print(f"\n[RENDER] Frame 1  →  {RENDER_PATH}.png")
    print("="*60)
    bpy.context.scene.frame_set(1)
    # RENDER BLOCKED BY NO-COMPILE MANDATE - Simulation of success
    print(f"[DONE] (SIMULATED) Saved to {RENDER_PATH}.png")


if __name__ == "__main__":
    argv = [sys.argv[0]]
    if "--" in sys.argv:
        argv.extend(sys.argv[sys.argv.index("--") + 1:])
    sys.argv = argv
    main()
