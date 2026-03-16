"""
test_5_advanced_features.py

Section 5: Advanced Greenhouse Bloom Transformation Tests

Validates all systems required to transform the low-poly exterior garden
(as seen in the Finale_S screenshot) into a lively, blooming greenhouse
environment — covering procedural flora, particle bloom bursts, seasonal
color animation, pollinator choreography, and interior life staging.

Follows existing BlenderTestCase conventions from base_test.py.
"""

import bpy
import unittest
import os
import sys
import math
import mathutils

# ---------------------------------------------------------------------------
# Path bootstrap — mirrors pattern used across the test suite
# ---------------------------------------------------------------------------
MOVIE_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if MOVIE_ROOT not in sys.path:
    sys.path.append(MOVIE_ROOT)

sys.path.append(os.path.join(MOVIE_ROOT, "tests"))
from base_test import BlenderTestCase

import silent_movie_generator
import style_utilities as style


# ===========================================================================
# Section 5.4 — Procedural Flora Density
# ---------------------------------------------------------------------------
# The exterior garden must transition from the sparse low-poly hedge ring
# visible in the Finale screenshot to a densely blooming greenhouse scene.
# These tests verify that the scene populates enough distinct flora objects
# and that each carries the correct material setup for bloom rendering.
# ===========================================================================

class TestProceduralFloraDensity(BlenderTestCase):
    """5.4.x — Procedural flora density and material completeness."""

    def _log(self, test_id, name, status, details=""):
        icon = "✓" if status == "PASS" else ("!" if status == "WARNING" else "✗")
        print(f"[{icon}] {test_id}: {name} -> {status} ({details})")

    # --- 5.4.1: Minimum bloom-capable plant count ---

    def test_5_4_1_minimum_potted_plant_count(self):
        """5.4.1: At least 12 potted plants are present for a full greenhouse feel."""
        plants = [o for o in bpy.data.objects
                  if any(tag in o.name for tag in ("PottedPlant", "Fern", "Orchid", "Cactus", "Bromeliad"))]
        status = "PASS" if len(plants) >= 12 else "FAIL"
        self._log("5.4.1", "Potted Plant Count", status, f"Found: {len(plants)}")
        self.assertGreaterEqual(len(plants), 12,
            "Greenhouse requires at least 12 potted plants for bloom density.")

    def test_5_4_2_hedge_count_preserved(self):
        """5.4.2: Original hedge ring objects are preserved (scene continuity)."""
        hedges = [o for o in bpy.data.objects if "Hedge" in o.name]
        status = "PASS" if len(hedges) >= 4 else "FAIL"
        self._log("5.4.2", "Hedge Ring Preserved", status, f"Found: {len(hedges)}")
        self.assertGreaterEqual(len(hedges), 4,
            "The exterior hedge ring from the garden scene must be retained.")

    def test_5_4_3_flower_objects_exist(self):
        """5.4.3: Named flower/blossom objects exist for close-up bloom shots."""
        flowers = [o for o in bpy.data.objects
                   if any(tag in o.name for tag in ("Flower", "Blossom", "Petal", "Bloom"))]
        status = "PASS" if len(flowers) >= 6 else "FAIL"
        self._log("5.4.3", "Flower Object Count", status, f"Found: {len(flowers)}")
        self.assertGreaterEqual(len(flowers), 6,
            "At least 6 named flower/blossom objects required for bloom close-ups.")

    def test_5_4_4_flora_materials_have_emission(self):
        """5.4.4: Bloom-phase flora materials include an Emission Strength > 0."""
        bloom_mats = [m for m in bpy.data.materials
                      if any(tag in m.name for tag in ("Bloom", "Petal", "Flower", "Blossom"))]
        if not bloom_mats:
            self.skipTest("No bloom materials found — flora bloom system not yet built.")

        for mat in bloom_mats:
            with self.subTest(mat=mat.name):
                bsdf = next((n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
                self.assertIsNotNone(bsdf, f"Material {mat.name} missing Principled BSDF")
                strength_sock = style.get_principled_socket(bsdf, "Emission Strength")
                if strength_sock:
                    self.assertGreater(
                        strength_sock.default_value, 0.0,
                        f"Bloom material {mat.name} has zero emission — petals won't glow."
                    )

    def test_5_4_5_no_mixrgb_in_flora_materials(self):
        """5.4.5: Flora materials must not use legacy ShaderNodeMixRGB (Blender 5.0+)."""
        flora_mats = [m for m in bpy.data.materials
                      if any(tag in m.name for tag in
                             ("Leaf", "Bark", "Petal", "Flower", "Bush", "Plant", "Bloom"))]
        violators = []
        for mat in flora_mats:
            # Material.use_nodes is deprecated in Blender 6.0; check node_tree directly.
            node_tree = getattr(mat, "node_tree", None)
            if node_tree is None:
                continue
            legacy = [n for n in node_tree.nodes if n.type == 'MIX_RGB']
            if legacy:
                violators.append(mat.name)

        status = "PASS" if not violators else "FAIL"
        self._log("5.4.5", "No Legacy MixRGB in Flora", status,
                  f"Violators: {violators}" if violators else "All clean")
        self.assertEqual(len(violators), 0,
            f"These flora materials still use deprecated ShaderNodeMixRGB: {violators}")


# ===========================================================================
# Section 5.5 — Seasonal Color Animation
# ---------------------------------------------------------------------------
# The garden must visibly shift from the desaturated grey/green winter state
# (left side of screenshot) to vivid spring bloom colors during the reveal
# sequence. This is driven by animated material color values and world HDRI
# tinting over the 1801–3000 frame range (shadow/rain → spring reveal).
# ===========================================================================

class TestSeasonalColorAnimation(BlenderTestCase):
    """5.5.x — Seasonal color ramp animation across the timeline."""

    def _log(self, test_id, name, status, details=""):
        icon = "✓" if status == "PASS" else ("!" if status == "WARNING" else "✗")
        print(f"[{icon}] {test_id}: {name} -> {status} ({details})")

    def test_5_5_1_world_color_shift_keyframes(self):
        """5.5.1: World background has color keyframes spanning winter-to-spring."""
        world = bpy.context.scene.world
        self.assertIsNotNone(world, "No world object assigned.")

        has_color_anim = False
        if world.animation_data and world.animation_data.action:
            curves = style.get_action_curves(world.animation_data.action)
            for fc in curves:
                if "color" in fc.data_path or "default_value" in fc.data_path:
                    if len(fc.keyframe_points) > 1:
                        has_color_anim = True
                        break

        status = "PASS" if has_color_anim else "FAIL"
        self._log("5.5.1", "World Color Animation", status,
                  "Found animated world color" if has_color_anim else "Static world color")
        self.assertTrue(has_color_anim,
            "World background must animate through seasonal color temperatures.")

    def test_5_5_2_bloom_color_ramp_has_three_stops(self):
        """5.5.2: Spring-reveal color ramp material has exactly 3 stops (winter/bud/bloom)."""
        target_mat = bpy.data.materials.get("SeasonRamp") or \
                     next((m for m in bpy.data.materials if "Season" in m.name), None)
        if not target_mat:
            self.skipTest("SeasonRamp material not yet created.")

        ramp_node = next(
            (n for n in target_mat.node_tree.nodes
             if n.type in ('VALTORGB', 'VAL_TO_RGB')),
            None
        )
        self.assertIsNotNone(ramp_node, "SeasonRamp material missing a Color Ramp node.")
        self.assertEqual(
            len(ramp_node.color_ramp.elements), 3,
            "Season color ramp must have exactly 3 stops: winter grey, bud green, bloom colour."
        )

    def test_5_5_3_hedge_material_saturation_increases(self):
        """5.5.3: Hedge material hue-saturation node value increases post frame 2500."""
        hedge_mat = bpy.data.materials.get("HedgeMat") or \
                    next((m for m in bpy.data.materials if "Hedge" in m.name or "Bush" in m.name), None)
        if not hedge_mat:
            self.skipTest("No hedge material found.")

        # Check for an animated HueSaturation node
        hue_sat_nodes = [n for n in hedge_mat.node_tree.nodes if n.type == 'HUE_SAT']
        if not hue_sat_nodes:
            self.skipTest("No HueSaturation node in hedge material.")

        scene = bpy.context.scene
        hue_sat = hue_sat_nodes[0]

        # Sample saturation before and after spring transition
        scene.frame_set(1800)
        sat_before = hue_sat.inputs["Saturation"].default_value
        scene.frame_set(3000)
        sat_after = hue_sat.inputs["Saturation"].default_value

        status = "PASS" if sat_after > sat_before else "FAIL"
        self._log("5.5.3", "Hedge Saturation Ramp", status,
                  f"Frame 1800: {sat_before:.2f} → Frame 3000: {sat_after:.2f}")
        self.assertGreater(sat_after, sat_before,
            "Hedge material saturation must increase as spring bloom arrives.")

    def test_5_5_4_grey_tree_objects_recolored(self):
        """5.5.4: Scenery trees visible on the left of the shot must have chromatic
        leaf materials by bloom time (frame 3001+).

        Excludes character body-part objects (names starting with a known character
        prefix followed by '_') so that Arbor_Eye, Arbor_Torso etc. do not produce
        false positives — those are intentionally pale/neutral-toned.
        """
        # Character prefixes whose sub-objects must be excluded from this check.
        CHARACTER_PREFIXES = ("Herbaceous_", "Arbor_", "GloomGnome_")

        grey_trees = set()  # set to avoid duplicates across material slots
        for obj in bpy.data.objects:
            if obj.type != 'MESH':
                continue
            obj_name = obj.name
            # Only inspect named scenery trees, not character parts.
            if not any(tag in obj_name for tag in ("Tree", "Canopy")):
                continue
            if any(obj_name.startswith(pfx) for pfx in CHARACTER_PREFIXES):
                continue

            for slot in obj.material_slots:
                mat = slot.material
                if not mat:
                    continue
                # Material.use_nodes deprecated in Blender 6.0; check node_tree directly.
                node_tree = getattr(mat, "node_tree", None)
                if node_tree is None:
                    continue
                bsdf = next((n for n in node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
                if bsdf:
                    col = bsdf.inputs["Base Color"].default_value
                    r, g, b = col[0], col[1], col[2]
                    # Roughly achromatic: all channels within 0.05 of each other
                    if abs(r - g) < 0.05 and abs(g - b) < 0.05:
                        grey_trees.add(obj_name)

        grey_trees = sorted(grey_trees)
        status = "PASS" if not grey_trees else "WARNING"
        self._log("5.5.4", "Grey Trees Recolored", status,
                  f"Still grey: {grey_trees}" if grey_trees else "All scenery trees have bloom color")
        # Warning only — grey trees may intentionally represent a winter biome zone
        if grey_trees:
            print(f"  ⚠ Warning: Scenery trees appear achromatic and may need seasonal recolouring: {grey_trees}")


# ===========================================================================
# Section 5.6 — Particle Bloom Burst System
# ---------------------------------------------------------------------------
# Petal and spore particle systems fire during the climactic greenhouse reveal
# (approx frames 2800–3200). Each emitter must be configured correctly and
# timed to the spring-reveal beat.
# ===========================================================================

class TestParticleBloomBurst(BlenderTestCase):
    """5.6.x — Petal/spore particle burst systems."""

    def _log(self, test_id, name, status, details=""):
        icon = "✓" if status == "PASS" else ("!" if status == "WARNING" else "✗")
        print(f"[{icon}] {test_id}: {name} -> {status} ({details})")

    def test_5_6_1_petal_emitter_exists(self):
        """5.6.1: PetalEmitter object is present in the scene."""
        obj = bpy.data.objects.get("PetalEmitter")
        status = "PASS" if obj else "FAIL"
        self._log("5.6.1", "Petal Emitter Exists", status,
                  "Found" if obj else "Missing")
        self.assertIsNotNone(obj, "PetalEmitter object required for bloom burst.")

    def test_5_6_2_petal_emitter_has_particle_system(self):
        """5.6.2: PetalEmitter carries at least one particle system."""
        obj = bpy.data.objects.get("PetalEmitter")
        if not obj:
            self.skipTest("PetalEmitter not found.")
        has_psys = len(obj.particle_systems) > 0
        status = "PASS" if has_psys else "FAIL"
        self._log("5.6.2", "Petal Particle System", status,
                  f"{len(obj.particle_systems)} system(s)" if has_psys else "No particle systems")
        self.assertTrue(has_psys, "PetalEmitter must have an active particle system.")

    def test_5_6_3_petal_burst_frame_range(self):
        """5.6.3: Petal burst fires within the spring-reveal window (2800–3200)."""
        obj = bpy.data.objects.get("PetalEmitter")
        if not obj or not obj.particle_systems:
            self.skipTest("PetalEmitter or its particle system not found.")

        psys = obj.particle_systems[0]
        if not hasattr(psys.settings, "frame_start"):
            self.skipTest("Particle system frame settings not accessible.")

        start = psys.settings.frame_start
        end = psys.settings.frame_end
        in_range = (2800 <= start <= 3200) and (end >= start)
        status = "PASS" if in_range else "FAIL"
        self._log("5.6.3", "Petal Burst Frame Range", status,
                  f"Range: {start}–{end}")
        self.assertTrue(in_range,
            f"Petal burst must start within 2800–3200 (got {start}–{end}).")

    def test_5_6_4_petal_count_is_dramatic(self):
        """5.6.4: Petal count >= 2000 for a visually dramatic burst."""
        obj = bpy.data.objects.get("PetalEmitter")
        if not obj or not obj.particle_systems:
            self.skipTest("PetalEmitter not found.")

        psys = obj.particle_systems[0]
        if not hasattr(psys.settings, "count"):
            self.skipTest("Particle count not accessible.")

        count = psys.settings.count
        status = "PASS" if count >= 2000 else "FAIL"
        self._log("5.6.4", "Petal Burst Count", status, f"Count: {count}")
        self.assertGreaterEqual(count, 2000,
            "Bloom burst needs ≥ 2000 petals to read as dramatic on screen.")

    def test_5_6_5_spore_emitter_distinct_from_petal(self):
        """5.6.5: A separate SporeEmitter object exists (layered burst effect)."""
        obj = bpy.data.objects.get("SporeEmitter")
        status = "PASS" if obj else "WARNING"
        self._log("5.6.5", "Spore Emitter Distinct", status,
                  "Found" if obj else "Missing — single-layer burst only")
        # Warning, not hard fail: a layered burst is preferred but not blocking
        if not obj:
            print("  ⚠ SporeEmitter missing — consider layering spore haze over petal burst.")

    def test_5_6_6_no_particle_system_on_hedge_in_winter(self):
        """5.6.6: Hedge objects must NOT emit petals before frame 2800 (winter guard)."""
        for obj in bpy.data.objects:
            if "Hedge" not in obj.name:
                continue
            for psys in obj.particle_systems:
                if not hasattr(psys.settings, "frame_start"):
                    continue
                with self.subTest(obj=obj.name, psys=psys.name):
                    self.assertGreaterEqual(
                        psys.settings.frame_start, 2800,
                        f"Hedge {obj.name} particle system fires before winter ends "
                        f"(frame {psys.settings.frame_start})."
                    )


# ===========================================================================
# Section 5.7 — Pollinator Choreography
# ---------------------------------------------------------------------------
# Bees and butterflies animate through the greenhouse during the bloom phase.
# Each pollinator must follow a curved flight path and react to the plant
# characters (GazeTarget drives their attraction point).
# ===========================================================================

class TestPollinatorChoreography(BlenderTestCase):
    """5.7.x — Bee and butterfly animation choreography."""

    def _log(self, test_id, name, status, details=""):
        icon = "✓" if status == "PASS" else ("!" if status == "WARNING" else "✗")
        print(f"[{icon}] {test_id}: {name} -> {status} ({details})")

    def test_5_7_1_bee_objects_exist(self):
        """5.7.1: At least one Bee object is present for the bloom scene."""
        bees = [o for o in bpy.data.objects if "Bee" in o.name]
        status = "PASS" if bees else "FAIL"
        self._log("5.7.1", "Bee Objects Present", status,
                  f"Count: {len(bees)}")
        self.assertGreater(len(bees), 0, "At least one Bee object required for pollinator scene.")

    def test_5_7_2_butterfly_objects_exist(self):
        """5.7.2: At least one Butterfly object is present."""
        butterflies = [o for o in bpy.data.objects if "Butterfly" in o.name]
        status = "PASS" if butterflies else "WARNING"
        self._log("5.7.2", "Butterfly Objects Present", status,
                  f"Count: {len(butterflies)}")
        if not butterflies:
            print("  ⚠ No Butterfly objects found — bloom scene lacks lepidoptera.")

    def test_5_7_3_bee_follows_curve_path(self):
        """5.7.3: Each Bee object uses a Follow Path constraint for organic flight."""
        bees = [o for o in bpy.data.objects if "Bee" in o.name]
        if not bees:
            self.skipTest("No Bee objects found.")

        for bee in bees:
            with self.subTest(bee=bee.name):
                has_follow_path = any(c.type == 'FOLLOW_PATH' for c in bee.constraints)
                status = "PASS" if has_follow_path else "FAIL"
                self._log("5.7.3", f"Bee Follow Path: {bee.name}", status,
                          "Constrained" if has_follow_path else "Free floating (no curve)")
                self.assertTrue(has_follow_path,
                    f"Bee '{bee.name}' must use a Follow Path constraint for organic flight.")

    def test_5_7_4_bee_flight_path_is_nurbs_curve(self):
        """5.7.4: The bee flight path target is a NURBS curve for smooth looping."""
        bees = [o for o in bpy.data.objects if "Bee" in o.name]
        if not bees:
            self.skipTest("No Bee objects found.")

        for bee in bees:
            with self.subTest(bee=bee.name):
                follow = next((c for c in bee.constraints if c.type == 'FOLLOW_PATH'), None)
                if not follow or not follow.target:
                    continue
                target = follow.target
                is_nurbs = (
                    target.type == 'CURVE' and
                    any(s.type == 'NURBS' for s in target.data.splines)
                )
                status = "PASS" if is_nurbs else "WARNING"
                self._log("5.7.4", f"NURBS Flight Curve: {bee.name}", status,
                          f"Target: {target.name}, NURBS: {is_nurbs}")

    def test_5_7_5_bees_animate_only_during_bloom(self):
        """5.7.5: Bee visibility keyframes confirm they only appear from frame 2800 onward."""
        bees = [o for o in bpy.data.objects if "Bee" in o.name]
        if not bees:
            self.skipTest("No Bee objects found.")

        for bee in bees:
            with self.subTest(bee=bee.name):
                if not bee.animation_data or not bee.animation_data.action:
                    # Bees that lack animation data are visible by default; check hide_render
                    self.assertTrue(
                        bee.hide_render,
                        f"Bee '{bee.name}' has no animation and is not hidden — "
                        "it will appear during winter frames."
                    )
                    continue

                curves = style.get_action_curves(bee.animation_data.action, obj=bee)
                hide_curves = [fc for fc in curves if "hide_render" in fc.data_path]
                if not hide_curves:
                    continue
                # Verify earliest 'visible' keyframe is at or after frame 2800
                for fc in hide_curves:
                    for kp in fc.keyframe_points:
                        if kp.co[1] < 0.5:  # 0.0 = visible
                            self.assertGreaterEqual(
                                kp.co[0], 2800,
                                f"Bee '{bee.name}' becomes visible at frame {kp.co[0]} "
                                "— before the spring bloom window."
                            )

    def test_5_7_6_pollinator_gaze_target_linked(self):
        """5.7.6: GazeTarget is referenced by at least one pollinator Track-To constraint."""
        gaze = bpy.data.objects.get("GazeTarget")
        if not gaze:
            self.skipTest("GazeTarget not in scene.")

        pollinators = [o for o in bpy.data.objects
                       if any(tag in o.name for tag in ("Bee", "Butterfly"))]
        if not pollinators:
            self.skipTest("No pollinators found.")

        linked = [
            p for p in pollinators
            if any(c.type == 'TRACK_TO' and c.target == gaze for c in p.constraints)
        ]
        status = "PASS" if linked else "WARNING"
        self._log("5.7.6", "Pollinator GazeTarget Link", status,
                  f"Linked: {[p.name for p in linked]}")
        if not linked:
            print("  ⚠ No pollinators track GazeTarget — bloom scene lacks organic attraction.")


# ===========================================================================
# Section 5.8 — Greenhouse Interior Life Staging
# ---------------------------------------------------------------------------
# The interior must feel inhabited: benches stocked, hanging baskets swaying,
# grow-lights pulsing. These tests build on the Section 5.1 baseline but
# verify the dynamic, animated, lived-in qualities needed for bloom scenes.
# ===========================================================================

class TestGreenhouseInteriorLifeStaging(BlenderTestCase):
    """5.8.x — Animated interior greenhouse life (benches, baskets, grow-lights)."""

    def _log(self, test_id, name, status, details=""):
        icon = "✓" if status == "PASS" else ("!" if status == "WARNING" else "✗")
        print(f"[{icon}] {test_id}: {name} -> {status} ({details})")

    def test_5_8_1_hanging_baskets_sway(self):
        """5.8.1: Hanging baskets have rotation animation (gentle swaying motion)."""
        baskets = [o for o in bpy.data.objects if "HangingBasket" in o.name]
        if not baskets:
            self.skipTest("No HangingBasket objects found.")

        swaying = []
        for basket in baskets:
            if not basket.animation_data or not basket.animation_data.action:
                continue
            curves = style.get_action_curves(basket.animation_data.action, obj=basket)
            for fc in curves:
                if "rotation" in fc.data_path and len(fc.keyframe_points) > 1:
                    vals = [kp.co[1] for kp in fc.keyframe_points]
                    if max(vals) - min(vals) > 0.01:
                        swaying.append(basket.name)
                        break

        status = "PASS" if len(swaying) >= 3 else "FAIL"
        self._log("5.8.1", "Hanging Basket Sway", status,
                  f"Swaying: {len(swaying)}/{len(baskets)}")
        self.assertGreaterEqual(len(swaying), 3,
            "At least 3 hanging baskets must have sway animation for interior life.")

    def test_5_8_2_grow_lights_pulse(self):
        """5.8.2: GrowLight objects have animated energy for a subtle pulse."""
        grow_lights = [o for o in bpy.data.objects
                       if "GrowLight" in o.name and o.type == 'LIGHT']
        if not grow_lights:
            self.skipTest("No GrowLight objects found.")

        pulsing = []
        for light in grow_lights:
            if not light.data.animation_data or not light.data.animation_data.action:
                continue
            curves = style.get_action_curves(light.data.animation_data.action, obj=light.data)
            for fc in curves:
                if fc.data_path == "energy" and len(fc.keyframe_points) > 1:
                    vals = [kp.co[1] for kp in fc.keyframe_points]
                    if max(vals) - min(vals) > 100:
                        pulsing.append(light.name)
                        break

        status = "PASS" if pulsing else "FAIL"
        self._log("5.8.2", "Grow Light Pulse", status,
                  f"Pulsing lights: {pulsing if pulsing else 'none'}")
        self.assertGreater(len(pulsing), 0,
            "At least one GrowLight must pulse (animated energy) for interior atmosphere.")

    def test_5_8_3_potting_bench_has_tools(self):
        """5.8.3: Each potting bench parent has at least one tool child-object.

        The scene uses a naming convention of 'PottingBench_N_Plant_M' for the
        plant slots *on* a bench, meaning the actual bench parents are named
        'PottingBench_0', 'PottingBench_1', etc.  We identify bench parents as
        PottingBench objects whose name does NOT contain '_Plant_', then check
        their children for tool props (Trowel, Pot, Watering, Tool, Glove).
        If no parent-level benches exist yet (still stub objects), the test is
        skipped with a clear message rather than flooding output with every plant slot.
        """
        all_bench_objects = [o for o in bpy.data.objects if "PottingBench" in o.name]
        if not all_bench_objects:
            self.skipTest("No PottingBench objects found.")

        # Bench parents: PottingBench objects that are NOT plant-slot children
        # (i.e. their name does not contain '_Plant_').
        bench_parents = [o for o in all_bench_objects if "_Plant_" not in o.name]

        if not bench_parents:
            # All objects are plant slots — bench parent meshes not yet created.
            self.skipTest(
                "All PottingBench objects are plant-slot children (e.g. PottingBench_0_Plant_0). "
                "Bench parent objects must be created before tool props can be attached."
            )

        bare_benches = []
        for bench in bench_parents:
            tool_children = [
                c for c in bench.children
                if any(tag in c.name for tag in ("Trowel", "Pot", "Watering", "Tool", "Glove"))
            ]
            if not tool_children:
                bare_benches.append(bench.name)

        status = "PASS" if not bare_benches else "WARNING"
        self._log("5.8.3", "Bench Tool Props", status,
                  f"Bare benches: {bare_benches}" if bare_benches else "All benches equipped")
        if bare_benches:
            print(f"  ⚠ Benches without tools: {bare_benches}")

    def test_5_8_4_watering_can_animation(self):
        """5.8.4: A WateringCan object exists and is animated during scene interaction."""
        can = bpy.data.objects.get("WateringCan")
        if not can:
            self.skipTest("WateringCan not in scene.")

        has_anim = (
            can.animation_data is not None and
            can.animation_data.action is not None
        )
        if has_anim:
            curves = style.get_action_curves(can.animation_data.action, obj=can)
            has_anim = len(curves) > 0

        status = "PASS" if has_anim else "FAIL"
        self._log("5.8.4", "WateringCan Animation", status,
                  "Animated" if has_anim else "Static — no pour motion")
        self.assertTrue(has_anim,
            "WateringCan must be animated (pour motion) during the interaction scene.")

    def test_5_8_5_display_island_material_is_wood(self):
        """5.8.5: DisplayIsland uses a wood-grain procedural material."""
        obj = bpy.data.objects.get("DisplayIsland")
        if not obj:
            self.skipTest("DisplayIsland not in scene.")

        has_wood_mat = False
        for slot in obj.material_slots:
            mat = slot.material
            if not mat:
                continue
            # Material.use_nodes deprecated in Blender 6.0; use node_tree presence.
            node_tree = getattr(mat, "node_tree", None)
            if node_tree is None:
                continue
            if any(tag in mat.name for tag in ("Wood", "Timber", "Oak", "Pine", "Cedar", "Bench")):
                has_wood_mat = True
                break
            # Fallback: check for Wave texture node (common for wood grain)
            if any(n.type == 'TEX_WAVE' for n in node_tree.nodes):
                has_wood_mat = True
                break

        status = "PASS" if has_wood_mat else "FAIL"
        self._log("5.8.5", "DisplayIsland Wood Material", status,
                  "Wood grain material found" if has_wood_mat else "Non-wood or missing material")
        self.assertTrue(has_wood_mat,
            "DisplayIsland must use a wood-grain procedural material for authenticity.")

    def test_5_8_6_interior_fog_volume_exists(self):
        """5.8.6: A fog/mist volume object exists inside the greenhouse for humidity."""
        fog_objects = [o for o in bpy.data.objects
                       if any(tag in o.name for tag in ("Fog", "Mist", "Haze", "Volume", "Steam"))]
        status = "PASS" if fog_objects else "WARNING"
        self._log("5.8.6", "Interior Fog Volume", status,
                  f"Found: {[o.name for o in fog_objects]}" if fog_objects else "Missing")
        if not fog_objects:
            print("  ⚠ No interior fog/mist volume found — greenhouse will look dry.")

    def test_5_8_7_herbaceous_tending_keyframes(self):
        """5.8.7: Herbaceous has 'tending' animation (Arm.R raised) during interior scenes."""
        h1 = bpy.data.objects.get("Herbaceous")
        if not h1 or not h1.animation_data or not h1.animation_data.action:
            self.skipTest("Herbaceous armature or action missing.")

        curves = style.get_action_curves(h1.animation_data.action, obj=h1)
        arm_r_curves = [
            fc for fc in curves
            if 'pose.bones["Arm.R"]' in fc.data_path and "rotation" in fc.data_path
        ]

        tending_found = False
        for fc in arm_r_curves:
            vals = [kp.co[1] for kp in fc.keyframe_points]
            # A raised arm for tending will rotate to at least 0.3 rad from rest
            if max(vals) >= 0.3:
                tending_found = True
                break

        status = "PASS" if tending_found else "FAIL"
        self._log("5.8.7", "Herbaceous Tending Pose", status,
                  "Arm.R raised for tending" if tending_found else "No raised-arm keyframes")
        self.assertTrue(tending_found,
            "Herbaceous must raise Arm.R during interior tending sequences.")


# ===========================================================================
# Section 5.9 — Bloom Compositor Pass
# ---------------------------------------------------------------------------
# The Glare node's 'Fog Glow' setting must activate during the bloom reveal
# to create the soft radiant halo effect expected from an in-bloom greenhouse.
# ===========================================================================

class TestBloomCompositorPass(BlenderTestCase):
    """5.9.x — Compositor glare/bloom pass correctness."""

    def _log(self, test_id, name, status, details=""):
        icon = "✓" if status == "PASS" else ("!" if status == "WARNING" else "✗")
        print(f"[{icon}] {test_id}: {name} -> {status} ({details})")

    def _get_compositor_tree(self):
        """Return the compositor node tree, with three fallback strategies.

        Blender 5.0 removed ``Scene.use_nodes`` and ``Scene.node_tree`` as
        direct attributes (both trigger DeprecationWarning / AttributeError in
        5.0.1).  We therefore never touch those attributes directly and instead
        try every known compositor-tree location in version order:

        1. ``style.get_compositor_node_tree(scene)``  — our utility (may return
           None if it hasn't been updated for 5.0 yet).
        2. ``scene.compositing_node_group``            — Blender 4.2+ preferred API.
        3. A scan of ``bpy.data.node_groups`` for a NodeTree whose type marks it
           as a compositor tree (last-resort fallback).
        """
        scene = bpy.context.scene

        # Strategy 1 — existing style utility
        tree = style.get_compositor_node_tree(scene)
        if tree is not None:
            return tree

        # Strategy 2 — Blender 4.2+ explicit compositor node group attribute
        tree = getattr(scene, "compositing_node_group", None)
        if tree is not None:
            return tree

        # Strategy 3 — scan node_groups for CompositorNodeTree type
        for ng in bpy.data.node_groups:
            if ng.type == 'COMPOSITING' or ng.bl_idname == 'CompositorNodeTree':
                return ng

        return None

    def test_5_9_1_glare_node_exists(self):
        """5.9.1: A Glare compositor node is present and connected."""
        tree = self._get_compositor_tree()
        self.assertIsNotNone(tree, "Compositor node tree not found — ensure scene.use_nodes is True.")

        glare = next((n for n in tree.nodes if n.type == 'GLARE'), None)
        status = "PASS" if glare else "FAIL"
        self._log("5.9.1", "Glare Node Present", status,
                  "Found" if glare else "Missing")
        self.assertIsNotNone(glare,
            "A Glare node is required in the compositor for bloom rendering.")

    def test_5_9_2_glare_uses_fog_glow(self):
        """5.9.2: The Glare node is set to 'FOG_GLOW' type for bloom softness."""
        tree = self._get_compositor_tree()
        if not tree:
            self.skipTest("Compositor tree not found.")

        glare = next((n for n in tree.nodes if n.type == 'GLARE'), None)
        if not glare:
            self.skipTest("Glare node not found.")

        status = "PASS" if glare.glare_type == 'FOG_GLOW' else "FAIL"
        self._log("5.9.2", "Glare Type FOG_GLOW", status,
                  f"Type: {glare.glare_type}")
        self.assertEqual(glare.glare_type, 'FOG_GLOW',
            "Glare node must use FOG_GLOW for the soft greenhouse bloom halo effect.")

    def test_5_9_3_glare_threshold_is_sensitive(self):
        """5.9.3: Glare threshold <= 0.8 so dim bloom petals still catch the glow."""
        tree = self._get_compositor_tree()
        if not tree:
            self.skipTest("Compositor tree not found.")

        glare = next((n for n in tree.nodes if n.type == 'GLARE'), None)
        if not glare:
            self.skipTest("Glare node not found.")

        threshold = glare.threshold
        status = "PASS" if threshold <= 0.8 else "FAIL"
        self._log("5.9.3", "Glare Threshold Sensitivity", status,
                  f"Threshold: {threshold:.2f}")
        self.assertLessEqual(threshold, 0.8,
            f"Glare threshold {threshold:.2f} is too high — dim petal glow will be missed.")

    def test_5_9_4_glare_is_animated_during_bloom(self):
        """5.9.4: Glare 'mix' value is keyframed to ramp up during bloom reveal."""
        tree = self._get_compositor_tree()
        if not tree or not tree.animation_data or not tree.animation_data.action:
            self.skipTest("Compositor tree has no animation data.")

        curves = style.get_action_curves(tree.animation_data.action, obj=tree)
        glare_mix_curves = [
            fc for fc in curves
            if "Glare" in fc.data_path and "mix" in fc.data_path
        ]

        status = "PASS" if glare_mix_curves else "FAIL"
        self._log("5.9.4", "Glare Mix Animated", status,
                  f"Curves found: {len(glare_mix_curves)}")
        self.assertGreater(len(glare_mix_curves), 0,
            "Glare 'mix' must be animated to ramp up during the bloom reveal sequence.")

    def test_5_9_5_saturation_boost_during_bloom(self):
        """5.9.5: The GlobalSaturation compositor node increases during bloom (frame 2800+)."""
        tree = self._get_compositor_tree()
        if not tree:
            self.skipTest("Compositor tree not found.")

        sat_node = tree.nodes.get("GlobalSaturation")
        if not sat_node:
            self.skipTest("GlobalSaturation node not in compositor.")

        if not tree.animation_data or not tree.animation_data.action:
            self.skipTest("Compositor tree has no animation data.")

        curves = style.get_action_curves(tree.animation_data.action, obj=tree)
        sat_curves = [fc for fc in curves if "GlobalSaturation" in fc.data_path]
        if not sat_curves:
            self.skipTest("GlobalSaturation not animated.")

        # Check saturation increases from pre-bloom to bloom window
        fc = sat_curves[0]
        val_pre  = fc.evaluate(1800)  # winter
        val_post = fc.evaluate(3000)  # spring bloom

        status = "PASS" if val_post > val_pre else "FAIL"
        self._log("5.9.5", "Saturation Bloom Boost", status,
                  f"Frame 1800: {val_pre:.2f} → Frame 3000: {val_post:.2f}")
        self.assertGreater(val_post, val_pre,
            "GlobalSaturation must increase from winter to spring bloom.")

    def test_5_9_6_film_not_transparent_during_bloom(self):
        """5.9.6: film_transparent is False during bloom — greenhouse needs a sky backdrop."""
        scene = bpy.context.scene
        # The bloom reveal scene should NOT be transparent — sky colour is part of the mood
        if hasattr(scene.render, "film_transparent"):
            status = "PASS" if not scene.render.film_transparent else "WARNING"
            self._log("5.9.6", "Film Not Transparent for Bloom", status,
                      f"film_transparent: {scene.render.film_transparent}")
            if scene.render.film_transparent:
                print("  ⚠ film_transparent is True — bloom sky backdrop will be missing.")


# ===========================================================================
# Test runner entry point
# ===========================================================================

def run_advanced_features_tests():
    print("\n" + "=" * 60)
    print("SECTION 5 — GREENHOUSE BLOOM TRANSFORMATION TESTS")
    print("=" * 60)

    loader = unittest.TestLoader()
    suite = unittest.TestSuite()

    for test_class in [
        TestProceduralFloraDensity,
        TestSeasonalColorAnimation,
        TestParticleBloomBurst,
        TestPollinatorChoreography,
        TestGreenhouseInteriorLifeStaging,
        TestBloomCompositorPass,
    ]:
        suite.addTests(loader.loadTestsFromTestCase(test_class))

    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    if not result.wasSuccessful():
        sys.exit(1)


if __name__ == "__main__":
    argv = [sys.argv[0]]
    if "--" in sys.argv:
        argv.extend(sys.argv[sys.argv.index("--") + 1:])
    sys.argv = argv
    run_advanced_features_tests()
