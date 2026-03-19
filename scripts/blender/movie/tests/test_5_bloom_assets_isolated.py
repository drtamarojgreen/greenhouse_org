"""
test_5_bloom_assets_isolated.py

Isolated creation, verification and single-frame render for every asset
required by the Section 5 bloom-transformation tests:

    5.4.1  PottedPlant / Fern / Orchid / Cactus / Bromeliad  (×12 minimum)
    5.4.2  Hedge ring objects                                  (×4 minimum)
    5.4.3  Flower / Blossom objects                           (×6 minimum)
    5.5.1  World background animated colour keyframes
    5.6.1  PetalEmitter with particle system (frames 2800-3200, count ≥ 2000)
    5.7.1  Bee objects with FOLLOW_PATH on a NURBS curve       (×3)
    5.8.1  HangingBasket rotation keyframes                    (×3 minimum)
    5.9.1  Compositor GLARE node (FOG_GLOW, threshold ≤ 0.8)

After creation each asset group is verified with a focused unittest suite.
Finally the scene is rendered to:

    scripts/blender/movie/renders/bloom_assets_isolated_test.png

Run with:
    blender -b -P scripts/blender/movie/tests/test_5_bloom_assets_isolated.py
"""

import bpy
import os
import sys
import math
import unittest

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
SCRIPT_DIR   = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(os.path.dirname(SCRIPT_DIR))   # …/greenhouse_org
RENDER_DIR   = os.path.join(PROJECT_ROOT, "scripts", "blender", "movie", "renders")
RENDER_PATH  = os.path.join(RENDER_DIR, "bloom_assets_isolated_test")  # Blender appends .png

os.makedirs(RENDER_DIR, exist_ok=True)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _mat_with_nodes(name, base_color=(0.1, 0.6, 0.1, 1.0), emission_strength=0.0):
    """Create or return a simple Principled-BSDF material, no legacy nodes."""
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.use_nodes = True
    tree = mat.node_tree
    tree.nodes.clear()
    out  = tree.nodes.new("ShaderNodeOutputMaterial")
    bsdf = tree.nodes.new("ShaderNodeBsdfPrincipled")
    out.location  = (300, 0)
    bsdf.location = (0, 0)
    tree.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    bsdf.inputs["Base Color"].default_value = base_color
    # Emission — use "Emission Color" (Blender 4.0+) with fallback
    for sock_name in ("Emission Color", "Emission"):
        sock = bsdf.inputs.get(sock_name)
        if sock:
            sock.default_value = (1.0, 1.0, 0.6, 1.0)
            break
    for sock_name in ("Emission Strength",):
        sock = bsdf.inputs.get(sock_name)
        if sock:
            sock.default_value = emission_strength
    return mat


def _apply_mat(obj, mat):
    if obj.data.materials:
        obj.data.materials[0] = mat
    else:
        obj.data.materials.append(mat)


def _deselect_all():
    bpy.ops.object.select_all(action='DESELECT')


def _look_at(cam_obj, target):
    """Point camera at a world-space target Vector."""
    direction = target - cam_obj.location
    rot_quat  = direction.to_track_quat('-Z', 'Y')
    cam_obj.rotation_euler = rot_quat.to_euler()


# ===========================================================================
# 1. SCENE BOOTSTRAP — minimal camera + lighting so the render is useful
# ===========================================================================

def setup_render_scene():
    scene = bpy.context.scene
    scene.render.engine        = 'BLENDER_EEVEE' #if hasattr(bpy.types, 'SceneEEVEE') else 'BLENDER_EEVEE'
    scene.render.resolution_x  = 1280
    scene.render.resolution_y  = 720
    scene.render.filepath      = RENDER_PATH
    scene.render.image_settings.file_format = 'PNG'
    scene.frame_set(1)

    # Camera — positioned to see most assets in one framing
    if not scene.camera:
        bpy.ops.object.camera_add(location=(0, -18, 8))
        cam = bpy.context.object
        cam.name = "BloomTestCam"
        import mathutils
        _look_at(cam, mathutils.Vector((0, 0, 2)))
        scene.camera = cam

    # Sun light
    existing_lights = [o for o in scene.objects if o.type == 'LIGHT']
    if not existing_lights:
        bpy.ops.object.light_add(type='SUN', location=(5, -5, 10))
        sun = bpy.context.object
        sun.name = "BloomTestSun"
        sun.data.energy = 3.0

    # World background — plain colour so film_transparent=False works
    world = scene.world or bpy.data.worlds.new("BloomWorld")
    scene.world = world
    world.use_nodes = True
    bg = next((n for n in world.node_tree.nodes if n.type == 'BACKGROUND'), None)
    if not bg:
        bg = world.node_tree.nodes.new('ShaderNodeBackground')
    bg.inputs["Color"].default_value    = (0.53, 0.81, 0.92, 1.0)  # sky blue
    bg.inputs["Strength"].default_value = 1.0

    scene.render.film_transparent = False


# ===========================================================================
# 2. ASSET CREATORS
# ===========================================================================

# --- 2a. Potted plants (5.4.1) ---------------------------------------------

PLANT_SPECS = [
    ("PottedPlant_Fern_0",      "Fern",       (0.05, 0.45, 0.05, 1.0), (-4,  2, 0)),
    ("PottedPlant_Fern_1",      "Fern",       (0.05, 0.45, 0.05, 1.0), (-3,  2, 0)),
    ("PottedPlant_Orchid_0",    "Orchid",     (0.70, 0.10, 0.50, 1.0), (-2,  2, 0)),
    ("PottedPlant_Orchid_1",    "Orchid",     (0.70, 0.10, 0.50, 1.0), (-1,  2, 0)),
    ("PottedPlant_Orchid_2",    "Orchid",     (0.70, 0.10, 0.50, 1.0), ( 0,  2, 0)),
    ("PottedPlant_Cactus_0",    "Cactus",     (0.15, 0.55, 0.15, 1.0), ( 1,  2, 0)),
    ("PottedPlant_Cactus_1",    "Cactus",     (0.15, 0.55, 0.15, 1.0), ( 2,  2, 0)),
    ("PottedPlant_Bromeliad_0", "Bromeliad",  (0.85, 0.30, 0.05, 1.0), ( 3,  2, 0)),
    ("PottedPlant_Bromeliad_1", "Bromeliad",  (0.85, 0.30, 0.05, 1.0), ( 4,  2, 0)),
    ("PottedPlant_Fern_2",      "Fern",       (0.05, 0.45, 0.05, 1.0), (-4,  4, 0)),
    ("PottedPlant_Orchid_3",    "Orchid",     (0.70, 0.10, 0.50, 1.0), (-2,  4, 0)),
    ("PottedPlant_Cactus_2",    "Cactus",     (0.15, 0.55, 0.15, 1.0), ( 0,  4, 0)),
    ("PottedPlant_Bromeliad_2", "Bromeliad",  (0.85, 0.30, 0.05, 1.0), ( 2,  4, 0)),
    ("PottedPlant_Fern_3",      "Fern",       (0.05, 0.45, 0.05, 1.0), ( 4,  4, 0)),
]


def create_potted_plants():
    """Build pot (cylinder) + stem (cone) combos for each plant spec."""
    created = []
    for obj_name, plant_type, color, loc in PLANT_SPECS:
        if bpy.data.objects.get(obj_name):
            created.append(bpy.data.objects[obj_name])
            continue

        x, y, z = loc

        # Pot — terracotta-coloured cylinder
        bpy.ops.mesh.primitive_cylinder_add(
            radius=0.25, depth=0.30,
            location=(x, y, z + 0.15)
        )
        pot = bpy.context.object
        pot.name = obj_name + "_Pot"
        pot_mat = _mat_with_nodes(f"PotMat_{plant_type}",
                                  base_color=(0.55, 0.25, 0.08, 1.0))
        _apply_mat(pot, pot_mat)

        # Plant body — cone on top of pot
        bpy.ops.mesh.primitive_cone_add(
            radius1=0.22, radius2=0.05, depth=0.60,
            location=(x, y, z + 0.60)
        )
        stem = bpy.context.object
        stem.name = obj_name
        plant_mat = _mat_with_nodes(
            f"PlantMat_{plant_type}_{obj_name}",
            base_color=color,
            emission_strength=0.3  # subtle inner glow — satisfies 5.4.4
        )
        _apply_mat(stem, plant_mat)
        created.append(stem)

    return created


# --- 2b. Hedge ring (5.4.2) -----------------------------------------------

HEDGE_SPECS = [
    ("Hedge_North", ( 0,  6, 0.5)),
    ("Hedge_South", ( 0, -6, 0.5)),
    ("Hedge_East",  ( 6,  0, 0.5)),
    ("Hedge_West",  (-6,  0, 0.5)),
]


def create_hedges():
    created = []
    hedge_mat = _mat_with_nodes("HedgeMat_Bloom",
                                base_color=(0.08, 0.38, 0.08, 1.0))
    for name, loc in HEDGE_SPECS:
        if bpy.data.objects.get(name):
            created.append(bpy.data.objects[name])
            continue
        bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
        hedge = bpy.context.object
        hedge.name  = name
        hedge.scale = (5.5, 0.5, 1.0)
        bpy.ops.object.transform_apply(scale=True)
        _apply_mat(hedge, hedge_mat)
        created.append(hedge)
    return created


# --- 2c. Flower / Blossom objects (5.4.3) ---------------------------------

FLOWER_SPECS = [
    ("Flower_Rose_0",    (0.85, 0.08, 0.08, 1.0), (-3, -2, 0.6)),
    ("Flower_Rose_1",    (0.85, 0.08, 0.08, 1.0), (-1, -2, 0.6)),
    ("Blossom_Cherry_0", (0.95, 0.70, 0.75, 1.0), ( 1, -2, 0.6)),
    ("Blossom_Cherry_1", (0.95, 0.70, 0.75, 1.0), ( 3, -2, 0.6)),
    ("Flower_Lily_0",    (1.00, 0.90, 0.20, 1.0), (-2, -4, 0.6)),
    ("Blossom_Apple_0",  (1.00, 0.80, 0.85, 1.0), ( 2, -4, 0.6)),
]


def create_flowers():
    created = []
    for name, color, loc in FLOWER_SPECS:
        if bpy.data.objects.get(name):
            created.append(bpy.data.objects[name])
            continue
        bpy.ops.mesh.primitive_uv_sphere_add(
            radius=0.25, segments=8, ring_count=6,
            location=loc
        )
        flower = bpy.context.object
        flower.name = name
        mat = _mat_with_nodes(f"BloomMat_{name}",
                              base_color=color,
                              emission_strength=0.8)  # satisfies 5.4.4
        _apply_mat(flower, mat)
        created.append(flower)
    return created


# --- 2d. World color animation (5.5.1) ------------------------------------

def animate_world_color():
    scene = bpy.context.scene
    world = scene.world
    if not world or not world.node_tree:
        return

    bg = next((n for n in world.node_tree.nodes if n.type == 'BACKGROUND'), None)
    if not bg:
        return

    color_sock = bg.inputs["Color"]

    # Frame 1 — cold winter blue-grey
    scene.frame_set(1)
    color_sock.default_value = (0.55, 0.60, 0.70, 1.0)
    color_sock.keyframe_insert("default_value", frame=1)

    # Frame 1800 — overcast rain (darker, desaturated)
    color_sock.default_value = (0.35, 0.38, 0.42, 1.0)
    color_sock.keyframe_insert("default_value", frame=1800)

    # Frame 3000 — vivid spring sky
    color_sock.default_value = (0.53, 0.81, 0.92, 1.0)
    color_sock.keyframe_insert("default_value", frame=3000)

    # Reset to current frame
    scene.frame_set(1)


# --- 2e. PetalEmitter (5.6.1) ---------------------------------------------

def create_petal_emitter():
    name = "PetalEmitter"
    if bpy.data.objects.get(name):
        return bpy.data.objects[name]

    bpy.ops.mesh.primitive_plane_add(size=4, location=(0, 0, 3.5))
    emitter = bpy.context.object
    emitter.name = name
    emitter.hide_render = False

    # Add particle system
    bpy.ops.object.particle_system_add()
    psys    = emitter.particle_systems[-1]
    psys.name = "PetalBurst"
    settings = psys.settings
    settings.name        = "PetalBurstSettings"
    settings.count       = 2500
    settings.frame_start = 2800
    settings.frame_end   = 3200
    settings.lifetime    = 80
    settings.emit_from   = 'FACE'
    settings.physics_type = 'NEWTON'
    settings.normal_factor = 2.5
    settings.factor_random = 0.8

    # Petal material on emitter mesh
    petal_mat = _mat_with_nodes("PetalParticleMat",
                                base_color=(0.95, 0.70, 0.75, 1.0),
                                emission_strength=0.5)
    _apply_mat(emitter, petal_mat)
    return emitter


# --- 2f. Bee objects + NURBS flight path (5.7.1) --------------------------

BEE_POSITIONS = [
    ("Bee_0", (-2, 0, 2.5)),
    ("Bee_1", ( 0, 0, 2.5)),
    ("Bee_2", ( 2, 0, 2.5)),
]


def create_bees():
    """Create simplified bee meshes (body + wings as cubes) on NURBS flight curves."""
    created = []
    gaze = bpy.data.objects.get("GazeTarget")

    for i, (bee_name, loc) in enumerate(BEE_POSITIONS):
        if bpy.data.objects.get(bee_name):
            created.append(bpy.data.objects[bee_name])
            continue

        x, y, z = loc

        # --- Flight path NURBS curve ---
        curve_name = f"BeePath_{i}"
        if not bpy.data.objects.get(curve_name):
            bpy.ops.curve.primitive_nurbs_circle_add(
                radius=1.5 + i * 0.4,
                location=(x, y, z)
            )
            path_obj = bpy.context.object
            path_obj.name = curve_name
            # Tilt the circle slightly per bee for variation
            path_obj.rotation_euler = (math.radians(10 + i * 15), 0,
                                       math.radians(i * 45))
        else:
            path_obj = bpy.data.objects[curve_name]

        # --- Bee body ---
        bpy.ops.mesh.primitive_uv_sphere_add(
            radius=0.12, segments=6, ring_count=4,
            location=(x, y, z)
        )
        bee = bpy.context.object
        bee.name = bee_name
        bee_mat = _mat_with_nodes(f"BeeMat_{i}",
                                  base_color=(0.9, 0.65, 0.0, 1.0))
        _apply_mat(bee, bee_mat)

        # --- Follow Path constraint ---
        fp = bee.constraints.new('FOLLOW_PATH')
        fp.target        = path_obj
        fp.use_curve_follow = True

        # --- Optional Track-To GazeTarget ---
        if gaze:
            tt = bee.constraints.new('TRACK_TO')
            tt.target    = gaze
            tt.track_axis = 'TRACK_NEGATIVE_Z'
            tt.up_axis    = 'UP_Y'

        # Bloom-only visibility (hidden before frame 2800)
        bee.hide_render = True
        bee.keyframe_insert("hide_render", frame=1)
        bee.hide_render = False
        bee.keyframe_insert("hide_render", frame=2800)

        created.append(bee)

    return created


# --- 2g. HangingBasket sway animation (5.8.1) -----------------------------

def animate_hanging_baskets():
    """Add gentle rotation sway to existing HangingBasket objects."""
    baskets = [o for o in bpy.data.objects if "HangingBasket" in o.name]
    animated = []

    for i, basket in enumerate(baskets):
        # Small phase offset per basket so they don't all swing identically
        phase = i * 7
        amp   = math.radians(8 + (i % 3) * 3)   # 8–14° swing

        basket.rotation_euler[2] = 0.0
        basket.keyframe_insert("rotation_euler", index=2, frame=1 + phase)

        basket.rotation_euler[2] = amp
        basket.keyframe_insert("rotation_euler", index=2, frame=30 + phase)

        basket.rotation_euler[2] = 0.0
        basket.keyframe_insert("rotation_euler", index=2, frame=60 + phase)

        basket.rotation_euler[2] = -amp
        basket.keyframe_insert("rotation_euler", index=2, frame=90 + phase)

        basket.rotation_euler[2] = 0.0
        basket.keyframe_insert("rotation_euler", index=2, frame=120 + phase)

        # Smooth interpolation
        if basket.animation_data and basket.animation_data.action:
            for fc in basket.animation_data.action.fcurves:
                if "rotation_euler" in fc.data_path:
                    for kp in fc.keyframe_points:
                        kp.interpolation = 'SINE'

        animated.append(basket)

    return animated


# --- 2h. Compositor GLARE node (5.9.1) ------------------------------------

def create_compositor_glare():
    scene = bpy.context.scene

    # Enable compositor — use non-deprecated path
    # In Blender 5.0 we assign a node group; in older builds use use_nodes
    if not getattr(scene, "compositing_node_group", None):
        # Blender < 4.2 path: set use_nodes if attribute exists
        if hasattr(scene, "use_nodes"):
            scene.use_nodes = True

    # Resolve the compositor tree via every known path
    tree = getattr(scene, "compositing_node_group", None)
    if tree is None and hasattr(scene, "node_tree"):
        tree = scene.node_tree
    if tree is None:
        # Final fallback: find it in bpy.data.node_groups
        for ng in bpy.data.node_groups:
            if ng.type == 'COMPOSITING' or getattr(ng, 'bl_idname', '') == 'CompositorNodeTree':
                tree = ng
                break
    if tree is None:
        print("  ⚠ Could not locate compositor node tree — skipping Glare setup.")
        return None

    nodes = tree.nodes

    # Ensure Render Layers and Composite exist
    rl = nodes.get("Render Layers") or nodes.new("CompositorNodeRLayers")
    rl.name = "Render Layers"
    co = nodes.get("Composite") or nodes.new("CompositorNodeComposite")
    co.location = (800, 0)

    # Remove any existing Glare so we start clean
    for n in [n for n in nodes if n.type == 'GLARE']:
        nodes.remove(n)

    # Add Glare node
    glare = nodes.new("CompositorNodeGlare")
    glare.name        = "GlareBloom"
    glare.glare_type  = 'FOG_GLOW'
    glare.threshold   = 0.5
    glare.mix         = 0.0          # will be animated
    glare.location    = (400, 0)

    # Wire: RenderLayers.Image → Glare.Image → Composite.Image
    tree.links.new(rl.outputs["Image"],    glare.inputs["Image"])
    tree.links.new(glare.outputs["Image"], co.inputs["Image"])

    # Animate glare.mix: 0.0 at frame 1, ramps to 1.0 at frame 3000
    glare.inputs["Fac"].default_value = 0.0
    glare.inputs["Fac"].keyframe_insert("default_value", frame=1)
    glare.inputs["Fac"].default_value = 1.0
    glare.inputs["Fac"].keyframe_insert("default_value", frame=3000)
    scene.frame_set(1)

    return glare


# ===========================================================================
# 3. ISOLATED TEST SUITE
# ===========================================================================

class TestBloomAssetsIsolated(unittest.TestCase):

    def _log(self, test_id, name, status, details=""):
        icon = "✓" if status == "PASS" else ("!" if status == "WARNING" else "✗")
        print(f"[{icon}] {test_id}: {name} -> {status} ({details})")

    # -----------------------------------------------------------------------
    # 5.4.1 — Potted plants

    def test_5_4_1_potted_plant_count(self):
        """5.4.1: ≥ 12 potted plant objects exist."""
        plants = [o for o in bpy.data.objects
                  if any(t in o.name for t in
                         ("PottedPlant", "Fern", "Orchid", "Cactus", "Bromeliad"))]
        self._log("5.4.1", "Potted Plant Count", "PASS" if len(plants) >= 12 else "FAIL",
                  f"Found: {len(plants)}")
        self.assertGreaterEqual(len(plants), 12)

    def test_5_4_1b_plant_materials_have_emission(self):
        """5.4.1b: Plant materials include non-zero Emission Strength."""
        plants = [o for o in bpy.data.objects
                  if any(t in o.name for t in
                         ("PottedPlant", "Fern", "Orchid", "Cactus", "Bromeliad"))
                  and "_Pot" not in o.name]
        missing = []
        for obj in plants:
            for slot in obj.material_slots:
                mat = slot.material
                if not mat:
                    continue
                nt = getattr(mat, "node_tree", None)
                if not nt:
                    continue
                bsdf = next((n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'), None)
                if bsdf:
                    sock = bsdf.inputs.get("Emission Strength")
                    if sock and sock.default_value == 0.0:
                        missing.append(obj.name)
        self._log("5.4.1b", "Plant Emission", "PASS" if not missing else "FAIL",
                  f"Zero-emission: {missing}" if missing else "All emit")
        self.assertEqual(missing, [])

    # -----------------------------------------------------------------------
    # 5.4.2 — Hedges

    def test_5_4_2_hedge_count(self):
        """5.4.2: ≥ 4 Hedge objects exist."""
        hedges = [o for o in bpy.data.objects if "Hedge" in o.name]
        self._log("5.4.2", "Hedge Count", "PASS" if len(hedges) >= 4 else "FAIL",
                  f"Found: {len(hedges)}")
        self.assertGreaterEqual(len(hedges), 4)

    def test_5_4_2b_hedges_are_meshes(self):
        """5.4.2b: All Hedge objects are MESH type."""
        hedges = [o for o in bpy.data.objects if "Hedge" in o.name]
        non_mesh = [o.name for o in hedges if o.type != 'MESH']
        self._log("5.4.2b", "Hedges Are Meshes", "PASS" if not non_mesh else "FAIL",
                  f"Non-mesh: {non_mesh}" if non_mesh else "All MESH")
        self.assertEqual(non_mesh, [])

    # -----------------------------------------------------------------------
    # 5.4.3 — Flowers

    def test_5_4_3_flower_count(self):
        """5.4.3: ≥ 6 Flower/Blossom objects exist."""
        flowers = [o for o in bpy.data.objects
                   if any(t in o.name for t in ("Flower", "Blossom", "Petal", "Bloom"))]
        self._log("5.4.3", "Flower Count", "PASS" if len(flowers) >= 6 else "FAIL",
                  f"Found: {len(flowers)}")
        self.assertGreaterEqual(len(flowers), 6)

    def test_5_4_3b_flower_materials_named_bloom(self):
        """5.4.3b: Flower materials are named BloomMat_* (discoverable by 5.4.4)."""
        flowers = [o for o in bpy.data.objects
                   if any(t in o.name for t in ("Flower", "Blossom"))]
        bad = []
        for obj in flowers:
            for slot in obj.material_slots:
                if slot.material and "Bloom" not in slot.material.name:
                    bad.append(f"{obj.name}:{slot.material.name}")
        self._log("5.4.3b", "Flower Material Names", "PASS" if not bad else "FAIL",
                  f"Bad names: {bad}" if bad else "All BloomMat_*")
        self.assertEqual(bad, [])

    # -----------------------------------------------------------------------
    # 5.5.1 — World colour animation

    def test_5_5_1_world_has_color_keyframes(self):
        """5.5.1: World background color is animated across ≥ 3 keyframes."""
        world = bpy.context.scene.world
        self.assertIsNotNone(world)
        has_anim = False
        if world.animation_data and world.animation_data.action:
            for fc in world.animation_data.action.fcurves:
                if ("color" in fc.data_path or "default_value" in fc.data_path):
                    if len(fc.keyframe_points) >= 3:
                        has_anim = True
                        break
        self._log("5.5.1", "World Color Keyframes", "PASS" if has_anim else "FAIL",
                  "≥3 keyframes" if has_anim else "Static")
        self.assertTrue(has_anim)

    def test_5_5_1b_world_color_changes_at_bloom(self):
        """5.5.1b: World colour at frame 3000 differs from frame 1 (spring is brighter)."""
        scene = bpy.context.scene
        world = scene.world
        if not world or not world.animation_data or not world.animation_data.action:
            self.skipTest("World not animated.")
        scene.frame_set(1)
        col_winter = tuple(world.node_tree.nodes.get("Background")
                           .inputs["Color"].default_value[:3])
        scene.frame_set(3000)
        col_spring = tuple(world.node_tree.nodes.get("Background")
                           .inputs["Color"].default_value[:3])
        changed = col_winter != col_spring
        self._log("5.5.1b", "World Colour Shift", "PASS" if changed else "FAIL",
                  f"Winter={col_winter} Spring={col_spring}")
        self.assertTrue(changed)

    # -----------------------------------------------------------------------
    # 5.6.1 — PetalEmitter

    def test_5_6_1_petal_emitter_exists(self):
        """5.6.1: PetalEmitter object is present."""
        obj = bpy.data.objects.get("PetalEmitter")
        self._log("5.6.1", "PetalEmitter Exists", "PASS" if obj else "FAIL",
                  "Found" if obj else "Missing")
        self.assertIsNotNone(obj)

    def test_5_6_1b_petal_emitter_particle_count(self):
        """5.6.1b: PetalEmitter particle count ≥ 2000."""
        obj = bpy.data.objects.get("PetalEmitter")
        if not obj or not obj.particle_systems:
            self.skipTest("PetalEmitter missing.")
        count = obj.particle_systems[0].settings.count
        self._log("5.6.1b", "Petal Count", "PASS" if count >= 2000 else "FAIL",
                  f"Count: {count}")
        self.assertGreaterEqual(count, 2000)

    def test_5_6_1c_petal_burst_frame_range(self):
        """5.6.1c: Petal burst fires within frames 2800–3200."""
        obj = bpy.data.objects.get("PetalEmitter")
        if not obj or not obj.particle_systems:
            self.skipTest("PetalEmitter missing.")
        s = obj.particle_systems[0].settings.frame_start
        e = obj.particle_systems[0].settings.frame_end
        ok = 2800 <= s <= 3200 and e >= s
        self._log("5.6.1c", "Petal Frame Range", "PASS" if ok else "FAIL",
                  f"{s}–{e}")
        self.assertTrue(ok)

    # -----------------------------------------------------------------------
    # 5.7.1 — Bee objects

    def test_5_7_1_bee_objects_exist(self):
        """5.7.1: ≥ 3 Bee objects exist."""
        bees = [o for o in bpy.data.objects if "Bee" in o.name
                and o.type == 'MESH']
        self._log("5.7.1", "Bee Objects", "PASS" if len(bees) >= 3 else "FAIL",
                  f"Found: {len(bees)}")
        self.assertGreaterEqual(len(bees), 3)

    def test_5_7_1b_bees_have_follow_path(self):
        """5.7.1b: Each Bee has a FOLLOW_PATH constraint."""
        bees = [o for o in bpy.data.objects
                if "Bee" in o.name and o.type == 'MESH']
        missing = [b.name for b in bees
                   if not any(c.type == 'FOLLOW_PATH' for c in b.constraints)]
        self._log("5.7.1b", "Bee Follow Path", "PASS" if not missing else "FAIL",
                  f"Missing: {missing}" if missing else "All constrained")
        self.assertEqual(missing, [])

    def test_5_7_1c_bee_path_is_nurbs(self):
        """5.7.1c: Each Bee's flight path target is a NURBS curve."""
        bees = [o for o in bpy.data.objects
                if "Bee" in o.name and o.type == 'MESH']
        non_nurbs = []
        for bee in bees:
            fp = next((c for c in bee.constraints if c.type == 'FOLLOW_PATH'), None)
            if not fp or not fp.target:
                non_nurbs.append(bee.name)
                continue
            splines = fp.target.data.splines
            if not any(s.type == 'NURBS' for s in splines):
                non_nurbs.append(bee.name)
        self._log("5.7.1c", "Bee NURBS Path", "PASS" if not non_nurbs else "FAIL",
                  f"Non-NURBS: {non_nurbs}" if non_nurbs else "All NURBS")
        self.assertEqual(non_nurbs, [])

    def test_5_7_1d_bees_hidden_before_bloom(self):
        """5.7.1d: Bees are hidden before frame 2800 (hide_render keyframed)."""
        bees = [o for o in bpy.data.objects
                if "Bee" in o.name and o.type == 'MESH']
        not_hidden = []
        for bee in bees:
            if not bee.animation_data or not bee.animation_data.action:
                not_hidden.append(bee.name)
                continue
            hide_curves = [fc for fc in bee.animation_data.action.fcurves
                           if "hide_render" in fc.data_path]
            if not hide_curves:
                not_hidden.append(bee.name)
        self._log("5.7.1d", "Bees Hidden Pre-Bloom", "PASS" if not not_hidden else "FAIL",
                  f"Not keyframed: {not_hidden}" if not_hidden else "All keyframed")
        self.assertEqual(not_hidden, [])

    # -----------------------------------------------------------------------
    # 5.8.1 — HangingBasket sway

    def test_5_8_1_baskets_have_sway(self):
        """5.8.1: ≥ 3 HangingBasket objects have rotation animation."""
        baskets = [o for o in bpy.data.objects if "HangingBasket" in o.name]
        if not baskets:
            self.skipTest("No HangingBasket objects in scene.")
        swaying = []
        for b in baskets:
            if not b.animation_data or not b.animation_data.action:
                continue
            for fc in b.animation_data.action.fcurves:
                if "rotation_euler" in fc.data_path:
                    vals = [kp.co[1] for kp in fc.keyframe_points]
                    if len(vals) > 1 and (max(vals) - min(vals)) > 0.01:
                        swaying.append(b.name)
                        break
        self._log("5.8.1", "Basket Sway", "PASS" if len(swaying) >= 3 else "FAIL",
                  f"Swaying: {len(swaying)}/{len(baskets)}")
        self.assertGreaterEqual(len(swaying), 3)

    def test_5_8_1b_sway_amplitude_is_visible(self):
        """5.8.1b: Sway peak rotation ≥ 5° (visually readable)."""
        baskets = [o for o in bpy.data.objects if "HangingBasket" in o.name]
        low_amp = []
        for b in baskets:
            if not b.animation_data or not b.animation_data.action:
                continue
            for fc in b.animation_data.action.fcurves:
                if "rotation_euler" in fc.data_path:
                    vals = [abs(kp.co[1]) for kp in fc.keyframe_points]
                    if max(vals) < math.radians(5):
                        low_amp.append(b.name)
        self._log("5.8.1b", "Sway Amplitude", "PASS" if not low_amp else "FAIL",
                  f"Low amp: {low_amp}" if low_amp else "All ≥ 5°")
        self.assertEqual(low_amp, [])

    # -----------------------------------------------------------------------
    # 5.9.1 — Compositor Glare

    def _get_tree(self):
        scene = bpy.context.scene
        # Strategy 1 — compositing_node_group (Blender 4.2+)
        t = getattr(scene, "compositing_node_group", None)
        if t:
            return t
        # Strategy 2 — scan node_groups
        for ng in bpy.data.node_groups:
            if ng.type == 'COMPOSITING' or getattr(ng, 'bl_idname', '') == 'CompositorNodeTree':
                return ng
        return None

    def test_5_9_1_glare_node_exists(self):
        """5.9.1: Compositor has a GLARE node."""
        tree = self._get_tree()
        if not tree:
            self.skipTest("Compositor tree not accessible.")
        glare = next((n for n in tree.nodes if n.type == 'GLARE'), None)
        self._log("5.9.1", "Glare Node", "PASS" if glare else "FAIL",
                  "Found" if glare else "Missing")
        self.assertIsNotNone(glare)

    def test_5_9_1b_glare_is_fog_glow(self):
        """5.9.1b: Glare node type is FOG_GLOW."""
        tree = self._get_tree()
        if not tree:
            self.skipTest("Compositor tree not accessible.")
        glare = next((n for n in tree.nodes if n.type == 'GLARE'), None)
        if not glare:
            self.skipTest("Glare node not found.")
        ok = glare.glare_type == 'FOG_GLOW'
        self._log("5.9.1b", "Glare FOG_GLOW", "PASS" if ok else "FAIL",
                  f"Type: {glare.glare_type}")
        self.assertEqual(glare.glare_type, 'FOG_GLOW')

    def test_5_9_1c_glare_threshold_sensitive(self):
        """5.9.1c: Glare threshold ≤ 0.8."""
        tree = self._get_tree()
        if not tree:
            self.skipTest("Compositor tree not accessible.")
        glare = next((n for n in tree.nodes if n.type == 'GLARE'), None)
        if not glare:
            self.skipTest("Glare node not found.")
        ok = glare.threshold <= 0.8
        self._log("5.9.1c", "Glare Threshold", "PASS" if ok else "FAIL",
                  f"Threshold: {glare.threshold:.2f}")
        self.assertLessEqual(glare.threshold, 0.8)

    def test_5_9_1d_glare_wired_to_composite(self):
        """5.9.1d: Glare output is linked to the Composite node."""
        tree = self._get_tree()
        if not tree:
            self.skipTest("Compositor tree not accessible.")
        glare = next((n for n in tree.nodes if n.type == 'GLARE'), None)
        if not glare:
            self.skipTest("Glare node not found.")
        linked = any(lnk.from_node == glare for lnk in tree.links)
        self._log("5.9.1d", "Glare Wired", "PASS" if linked else "FAIL",
                  "Output linked" if linked else "Dangling node")
        self.assertTrue(linked)


# ===========================================================================
# 4. RENDER ONE FRAME
# ===========================================================================

def render_single_frame():
    scene = bpy.context.scene
    scene.frame_set(1)
    scene.render.filepath = RENDER_PATH

    print(f"\n{'='*60}")
    print(f"RENDERING FRAME 1  →  {RENDER_PATH}.png")
    print(f"{'='*60}")
    bpy.ops.render.render(write_still=True)
    print(f"Render complete.\n")


# ===========================================================================
# 5. ENTRY POINT
# ===========================================================================

def main():
    print("\n" + "="*60)
    print("SECTION 5 — BLOOM ASSET ISOLATION BUILD + TEST + RENDER")
    print("="*60)

    # --- Build ---
    print("\n[BUILD] Setting up render scene…")
    setup_render_scene()

    print("[BUILD] Creating potted plants…")
    create_potted_plants()

    print("[BUILD] Creating hedges…")
    create_hedges()

    print("[BUILD] Creating flowers…")
    create_flowers()

    print("[BUILD] Animating world colour…")
    animate_world_color()

    print("[BUILD] Creating PetalEmitter…")
    create_petal_emitter()

    print("[BUILD] Creating bees…")
    create_bees()

    print("[BUILD] Animating hanging baskets…")
    animate_hanging_baskets()

    print("[BUILD] Setting up compositor Glare node…")
    create_compositor_glare()

    # --- Test ---
    print("\n" + "="*60)
    print("RUNNING ISOLATED TESTS")
    print("="*60)

    loader = unittest.TestLoader()
    suite  = loader.loadTestsFromTestCase(TestBloomAssetsIsolated)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    # --- Render ---
    render_single_frame()

    # Exit with failure code if tests failed
    if not result.wasSuccessful():
        sys.exit(1)


if __name__ == "__main__":
    # Strip Blender's own argv so unittest doesn't choke on it
    argv = [sys.argv[0]]
    if "--" in sys.argv:
        argv.extend(sys.argv[sys.argv.index("--") + 1:])
    sys.argv = argv
    main()
