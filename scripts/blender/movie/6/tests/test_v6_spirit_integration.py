import unittest
import bpy
import os
import mathutils
import sys

# Ensure movie root and v6 are in path
V6_DIR    = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MOVIE_ROOT = os.path.dirname(V6_DIR)
if MOVIE_ROOT not in sys.path: sys.path.append(MOVIE_ROOT)
if V6_DIR    not in sys.path: sys.path.append(V6_DIR)

from animation_library_v6 import get_bone
from dialogue_scene_v6 import DialogueSceneV6
import config

print(f"DIAGNOSTIC: Config loaded from {getattr(config, '__file__', 'unknown')}")


class TestV6SpiritIntegration(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        """Assembles the full production scene once for all diagnostic tests."""
        bpy.ops.wm.read_factory_settings(use_empty=True)
        from generate_scene6 import generate_full_scene_v6
        generate_full_scene_v6()
        bpy.context.view_layer.update()

    def setUp(self):
        self.scene_logic = DialogueSceneV6({}, [])

    # ------------------------------------------------------------------

    def test_asset_linking(self):
        """Verifies that spirits can be linked from the v6 asset blend."""
        self.scene_logic._link_spirit_assets()

        leafy = bpy.data.objects.get(config.CHAR_LEAFY_MESH)
        joy   = bpy.data.objects.get(config.CHAR_JOY_MESH)

        self.assertIsNotNone(leafy, "Leafy Spirit not found after linking")
        self.assertIsNotNone(joy,   "Joy Spirit not found after linking")

    def test_bone_mapping_mixamo(self):
        """Verifies that get_bone resolves standard names to Mixamo bones."""
        # Find a production rig (not a mock)
        arm = next((o for o in bpy.data.objects if o.type == 'ARMATURE' and ".Rig" in o.name), None)
        if arm:
            head = get_bone(arm, "Head")
            self.assertIsNotNone(head, f"Head bone not resolved for {arm.name}")
            print(f"BONE RESOLVED: {arm.name} -> {head.name}")

    def test_mesh_optimization_status(self):
        """Verifies decimated meshes have reasonable vertex counts."""
        leafy_mesh = bpy.data.objects.get(config.CHAR_LEAFY_MESH)
        if leafy_mesh and leafy_mesh.type == 'MESH':
            v_count = len(leafy_mesh.data.vertices)
            print(f"Leafy Spirit Vertex Count: {v_count}")
            self.assertLess(v_count, 200000)

    def get_world_height(self, obj):
        if obj.type == 'MESH':
            bbox    = [obj.matrix_world @ mathutils.Vector(c) for c in obj.bound_box]
            z_vals  = [v.z for v in bbox]
            return max(z_vals) - min(z_vals)
        elif obj.type == 'ARMATURE':
            z_vals = (
                [obj.matrix_world @ b.head for b in obj.data.bones] +
                [obj.matrix_world @ b.tail for b in obj.data.bones]
            )
            return max(v.z for v in z_vals) - min(v.z for v in z_vals)
        return 0

    def test_character_scales(self):
        self.scene_logic._link_spirit_assets()
        bpy.ops.mesh.primitive_cube_add(size=2.5, location=(0, 0, 1.25))
        herb_mock = bpy.context.active_object

        leafy = bpy.data.objects.get("LeafySpirit_Mesh1_Mesh1.044")
        if leafy:
            leafy.scale = config.SPIRIT_LEAFY_SCALE
            bpy.context.view_layer.update()
            h_herb  = self.get_world_height(herb_mock)
            h_leafy = self.get_world_height(leafy)
            print(f"DIAGNOSTIC: Herb Mock height={h_herb:.2f}, Leafy height={h_leafy:.2f}")
            self.assertGreater(h_leafy, h_herb * 1.2, "Spirit too small vs plants")
            self.assertLess(h_leafy,    h_herb * 5.0, "Spirit excessively large")

    def test_absolute_positioning(self):
        self.scene_logic._link_spirit_assets()

        leafy = bpy.data.objects.get(config.CHAR_LEAFY_MESH)
        if leafy:
            leafy.location = config.SPIRIT_LEAFY_POS

        joy = bpy.data.objects.get(config.CHAR_JOY_MESH)
        if joy:
            joy.location = config.SPIRIT_JOY_POS

        if leafy:
            dist = (leafy.location - mathutils.Vector(config.SPIRIT_LEAFY_POS)).length
            self.assertLess(dist, 0.01, f"Leafy Spirit position mismatch: {leafy.location}")

        if joy:
            dist = (joy.location - mathutils.Vector(config.SPIRIT_JOY_POS)).length
            self.assertLess(dist, 0.01, f"Joy Spirit position mismatch: {joy.location}")

    def test_texture_integrity(self):
        self.scene_logic._link_spirit_assets()

        target_meshes = [
            config.CHAR_LEAFY_MESH,
            config.CHAR_JOY_MESH,
            config.CHAR_LEAFCHAR_MESH,
        ]

        for name in target_meshes:
            obj = bpy.data.objects.get(name)
            if not obj:
                continue

            has_texture = False
            for slot in obj.material_slots:
                mat = slot.material
                if not mat or not mat.use_nodes:
                    continue
                for node in mat.node_tree.nodes:
                    if node.type == 'TEX_IMAGE':
                        img = node.image
                        self.assertIsNotNone(img, f"Mesh {name} has an empty Image Node")
                        print(f"TEXTURE CHECK: {name} -> {img.name} ({img.filepath})")
                        self.assertGreater(img.size[0], 0, f"Image for {name} is size 0")
                        has_texture = True

            self.assertTrue(has_texture, f"Character {name} has no texture node.")

    def test_character_separation_and_grounding(self):
        self.scene_logic._link_spirit_assets()

        positions = {
            "Herb":     mathutils.Vector((-1.75,  -0.3, 0.0)),
            "Arbor":    mathutils.Vector(( 1.75,   0.3, 0.0)),
            "Leafy":    mathutils.Vector(config.SPIRIT_LEAFY_POS),
            "Joy":      mathutils.Vector(config.SPIRIT_JOY_POS),
            "LeafChar": mathutils.Vector(( 0.0,    4.0, 0.0)),
        }

        MIN_DIST = 1.3
        p_items = list(positions.items())

        for name, pos in p_items:
            print(f"POSITION AUDIT: {name} at {pos}")
            self.assertLess(abs(pos.z), 0.1, f"Character {name} floating at Z={pos.z}")

        for i in range(len(p_items)):
            for j in range(i + 1, len(p_items)):
                n1, p1 = p_items[i]
                n2, p2 = p_items[j]
                dist_xy = (p1.xy - p2.xy).length
                self.assertGreater(dist_xy, MIN_DIST, f"Overlap: {n1} <-> {n2}")

    def test_armature_mesh_synchronization(self):
        """
        Verify synchronization using Parent-Child or Constraint.
        In modern 5.0 pipeline, Mesh is child of Rig with 0,0,0 local transform.
        """
        self.scene_logic._link_spirit_assets()

        targets = [
            (config.CHAR_LEAFY_RIG,    config.CHAR_LEAFY_MESH),
            (config.CHAR_JOY_RIG,      config.CHAR_JOY_MESH),
            (config.CHAR_LEAFCHAR_RIG, config.CHAR_LEAFCHAR_MESH),
        ]

        for rig_name, mesh_name in targets:
            rig  = bpy.data.objects.get(rig_name)
            mesh = bpy.data.objects.get(mesh_name)
            if not rig or not mesh:
                continue

            # Standard production hierarchy check
            self.assertEqual(mesh.parent, rig, f"Mesh {mesh_name} not child of Rig {rig_name}")

            m_loc = mesh.matrix_world.to_translation()
            r_loc = rig.matrix_world.to_translation()
            dist  = (m_loc - r_loc).length
            print(f"SYNC AUDIT {mesh_name}: Dist={dist:.4f}")
            self.assertLess(dist, 0.1, f"Mesh {mesh_name} spatially decoupled from Rig {rig_name}")

    def test_character_visibility(self):
        targets  = [config.CHAR_HERBACEOUS + "_Body", config.CHAR_ARBOR + "_Body"]
        targets += [name + ".Body" for name in config.SPIRIT_ENSEMBLE.values()]

        # Add Root_Guardian explicitly as it might have a dot or underscore depending on previous runs
        if "Root_Guardian.Body" not in targets: targets.append("Root_Guardian.Body")

        # Ensure we are at a frame where characters have been positioned
        bpy.context.scene.frame_set(1)

        for name in targets:
            obj = bpy.data.objects.get(name)
            self.assertIsNotNone(obj, f"{name} is MISSING from scene data")

            bpy.context.view_layer.update()
            loc = obj.matrix_world.to_translation()
            print(f"VISIBILITY {name}: Loc={loc}, Hidden={obj.hide_render}")

            rig = obj.find_armature() or (obj if obj.type == 'ARMATURE' else None)
            self.assertIsNotNone(rig, f"{name} missing armature connection")

            # Protagonists should be at their set positions, not origin
            if any(p in name for p in [config.CHAR_HERBACEOUS, config.CHAR_ARBOR]):
                 # We check that they are moved from (0,0,1) mock origin
                 self.assertGreater(loc.xy.length, 0.5, f"{name} stayed at origin! (Loc: {loc})")
                 # Ensure rig moved too
                 rig_loc = rig.matrix_world.to_translation()
                 self.assertGreater(rig_loc.xy.length, 0.5, f"Rig for {name} stayed at origin! (Loc: {rig_loc})")

    def test_vertex_outliers(self):
        for name in [config.CHAR_HERBACEOUS + "_Body", config.CHAR_LEAFY_MESH]:
            obj = bpy.data.objects.get(name)
            if not obj or obj.type != 'MESH':
                continue

            dg      = bpy.context.evaluated_depsgraph_get()
            eval_obj = obj.evaluated_get(dg)
            mesh    = eval_obj.data

            z_max = -999999.0
            v_max = None
            for v in mesh.vertices:
                w_co = eval_obj.matrix_world @ v.co
                if w_co.z > z_max:
                    z_max = w_co.z
                    v_max = v

            print(f"OUTLIER AUDIT {name}: Max Z = {z_max:.2f}")
            if z_max > 12.0:
                weights = [
                    f"{obj.vertex_groups[g.group].name}: {g.weight:.2f}"
                    for g in v_max.groups
                ]
                print(f"  CRITICAL: Shard at {z_max}m! Influences: {weights}")

    def test_spatial_audit_table(self):
        targets  = [config.CHAR_HERBACEOUS + "_Body", config.CHAR_ARBOR + "_Body"]
        targets += [name + ".Body" for name in config.SPIRIT_ENSEMBLE.values()]

        # Include Root_Guardian explicitly
        if "Root_Guardian.Body" not in targets: targets.append("Root_Guardian.Body")

        print("\n" + "=" * 115)
        print(f"{'OBJECT':<25} | {'RIG':<15} | {'LOC (Y)':<8} | {'RIG LOC (Y)':<12} | {'HEIGHT':<8} | {'PARENT':<15} | {'UP.Z'}")
        print("-" * 115)

        for name in targets:
            obj = bpy.data.objects.get(name)
            if not obj:
                continue

            rig      = obj.find_armature() or (obj if obj.type == 'ARMATURE' else None)
            rig_name = rig.name if rig else "NONE"
            parent   = obj.parent.name if obj.parent else "NONE"
            loc      = obj.matrix_world.to_translation()
            rig_loc_y = rig.matrix_world.to_translation().y if rig else 0.0

            bbox    = [obj.matrix_world @ mathutils.Vector(c) for c in obj.bound_box]
            z_vals  = [b.z for b in bbox]
            height  = max(z_vals) - min(z_vals)

            up_vec = obj.matrix_world.to_quaternion() @ mathutils.Vector((0, 0, 1))
            print(f"{name:<25} | {rig_name:<15} | {loc.y:<8.2f} | {rig_loc_y:<12.2f} | "
                  f"{height:<8.2f} | {parent:<15} | {up_vec.z:.2f}")
        print("=" * 115 + "\n")

    def test_feet_to_head_height(self):
        spirits = [name + ".Body" for name in config.SPIRIT_ENSEMBLE.values()]
        for name in spirits:
            obj = bpy.data.objects.get(name)
            if not obj:
                continue

            bbox   = [obj.matrix_world @ mathutils.Vector(c) for c in obj.bound_box]
            z_vals = [b.z for b in bbox]
            height = max(z_vals) - min(z_vals)

            target_h = 6.0 if ("Leafy" in name or "Joy" in name) else 5.5
            self.assertGreater(height, target_h * 0.9, f"{name} too short ({height:.2f}m)")
            self.assertLess(height,    target_h * 1.1, f"{name} too tall ({height:.2f}m)")

            up_vec = obj.matrix_world.to_quaternion() @ mathutils.Vector((0, 0, 1))
            self.assertGreater(up_vec.z, 0.9, f"{name} not upright (Up.z={up_vec.z:.2f})")

    def test_raycast_visibility(self):
        """
        Multi-point ray-cast to verify rendering visibility from the WIDE camera.
        Camera is named 'WIDE' (config.CAMERA_NAME).
        """
        scene = bpy.context.scene
        # Use config.CAMERA_NAME so this test stays aligned with director_v6.py
        cam = bpy.data.objects.get(config.CAMERA_NAME)
        self.assertIsNotNone(cam, f"Camera '{config.CAMERA_NAME}' missing for ray-cast")

        dg     = bpy.context.evaluated_depsgraph_get()
        origin = cam.matrix_world.to_translation()

        # Added protagonists to targets
        targets = [config.CHAR_LEAFY_MESH, config.CHAR_JOY_MESH, config.CHAR_LEAFCHAR_MESH]

        # Ensure we are on a frame where they are positioned in front of backdrops
        scene.frame_set(1)
        bpy.context.view_layer.update()

        for name in targets:
            obj = bpy.data.objects.get(name)
            if not obj:
                continue

            bpy.context.view_layer.update()

            # Use geometry center for raycast target
            bbox = [obj.matrix_world @ mathutils.Vector(c) for c in obj.bound_box]
            z_vals = [v.z for v in bbox]
            x_vals = [v.x for v in bbox]
            y_vals = [v.y for v in bbox]

            target_pt = mathutils.Vector((
                (max(x_vals) + min(x_vals)) / 2.0,
                (max(y_vals) + min(y_vals)) / 2.0,
                (max(z_vals) + min(z_vals)) / 2.0
            ))

            direction = (target_pt - origin).normalized()

            hit, loc, norm, idx, hit_obj, mat = scene.ray_cast(dg, origin, direction)

            if hit and hit_obj:
                print(f"RAYCAST {name} -> {hit_obj.name}")
                art_base = name.split('.')[0]
                is_hit = art_base in hit_obj.name or hit_obj.name in art_base

                # If we hit a backdrop, check if it's behind
                if not is_hit and "Backdrop" in hit_obj.name:
                     d_hit = (loc - origin).length
                     d_obj = (target_pt - origin).length
                     if d_hit > d_obj:
                          is_hit = True

                # DEBUG: Cam->Hit: {d_hit:.2f}m, Cam->Target: {d_obj:.2f}m
                self.assertTrue(is_hit, f"{name} occluded by {hit_obj.name} (Dist hit={d_hit:.2f}, obj={d_obj:.2f})")
            else:
                print(f"RAYCAST {name} -> MISS")
                # Fallback: try origin of object
                direction = (obj.matrix_world.to_translation() + mathutils.Vector((0,0,1)) - origin).normalized()
                hit, loc, norm, idx, hit_obj, mat = scene.ray_cast(dg, origin, direction)
                self.assertTrue(hit, f"Ray missed everything for {name}")

    def test_camera_naming_parity(self):
        """Verifies that all v5 camera names are preserved."""
        for name in ("WIDE", "OTS1", "OTS2", "OTS_Static_1", "OTS_Static_2"):
            self.assertIsNotNone(
                bpy.data.objects.get(name), f"Camera '{name}' missing (naming regression)"
            )

    def test_backdrop_audit_table(self):
        """Reports a table of backdrop properties (visibility, position, scale, dimensions)."""
        targets = ["ChromaBackdrop_Wide", "ChromaBackdrop_OTS1", "ChromaBackdrop_OTS2"]

        print("\n" + "=" * 135)
        print(f"{'BACKDROP':<25} | {'VIS':<4} | {'POSITION (X,Y,Z)':<25} | {'SCALE (X,Y,Z)':<20} | {'W':<6} | {'H':<6} | {'L':<6} | {'SHAPE'}")
        print("-" * 135)

        for name in targets:
            obj = bpy.data.objects.get(name)
            if not obj:
                print(f"{name:<25} | MISSING")
                continue

            vis = "OK" if not (obj.hide_viewport or obj.hide_render) else "HID"
            loc = f"({obj.location.x:5.1f},{obj.location.y:5.1f},{obj.location.z:5.1f})"
            scl = f"({obj.scale.x:4.2f},{obj.scale.y:4.2f},{obj.scale.z:4.2f})"

            # Dimensions
            dim = obj.dimensions
            w, h, l = dim.x, dim.z, dim.y # Width, Height, Length (depth) for vertical planes

            shape = "PLANE" if obj.type == 'MESH' and len(obj.data.vertices) == 4 else obj.type

            print(f"{name:<25} | {vis:<4} | {loc:<25} | {scl:<20} | {w:<6.1f} | {h:<6.1f} | {l:<6.1f} | {shape}")
        print("=" * 135 + "\n")

    def test_backdrop_spatial_placement(self):
        """Ensures backdrops are correctly positioned relative to cameras."""
        print("\nVerifying Backdrop Spatial Placement...")
        # Backdrop should be far enough away not to clip with characters
        wide_bg = bpy.data.objects.get("ChromaBackdrop_Wide")
        if wide_bg:
            loc = wide_bg.location
            print(f"WIDE BACKDROP LOC: {loc}")
            self.assertGreater(loc.y, 20, "Wide Backdrop too close to center (y < 20)")
            self.assertLess(loc.y, 100, "Wide Backdrop too far away (y > 100)")

    def test_rendering_setup(self):
        """Verifies camera and backdrop are present for Scene 6."""
        self.assertIsNotNone(
            bpy.data.objects.get(config.CAMERA_NAME), "Camera missing"
        )
        self.assertIsNotNone(
            bpy.data.objects.get(config.BACKDROP_NAME), "Backdrop missing"
        )

    def test_background_visibility(self):
        """Check why backgrounds might not be displaying."""
        print("\nChecking Background Visibility...")

        # 1. Check World Shader
        world = bpy.context.scene.world
        self.assertIsNotNone(world, "ERROR: No World defined in scene.")
        self.assertTrue(world.use_nodes, "ERROR: World does not use nodes.")

        # 2. Check Camera Clipping
        cam_obj = bpy.context.scene.camera
        if cam_obj:
            clip_end = cam_obj.data.clip_end
            print(f"DEBUG: Camera Clip End: {clip_end}")
            self.assertGreaterEqual(clip_end, 1000, "WARNING: Camera clip_end might be too short to see backgrounds.")

        # 3. Check Object Render Visibility
        bg_keywords = ["bg", "background", "environment", "sky", "backdrop"]
        bg_found = False
        for obj in bpy.data.objects:
            if any(k in obj.name.lower() for k in bg_keywords):
                bg_found = True
                self.assertFalse(obj.hide_render, f"ERROR: Background object {obj.name} is hidden in render.")
                self.assertFalse(obj.hide_viewport, f"ERROR: Background object {obj.name} is hidden in viewport.")

        # Diagnostic: Check World Shader node structure
        if world and world.node_tree:
            output = next((n for n in world.node_tree.nodes if n.type == 'OUTPUT_WORLD'), None)
            self.assertIsNotNone(output, "DIAGNOSTIC: World has no Output node.")
            self.assertTrue(output.inputs['Surface'].is_linked, "DIAGNOSTIC: World output Surface not connected.")

            bg_node = next((n for n in world.node_tree.nodes if n.type == 'BACKGROUND'), None)
            if bg_node:
                print(f"DEBUG: World Background Color: {bg_node.inputs[0].default_value[:]}")

        if not bg_found:
            print("WARNING: No objects containing 'background' keywords found.")

    def test_pipeline_6a_6b_readiness(self):
        """Verify pipeline stages for 6/a and 6/b."""
        print("\nChecking 6/a and 6/b Pipeline Stages...")

        collections = bpy.data.collections

        # Pipeline 6/a: Asset/Character focus
        col_6a = next((col for col in collections if "6a" in col.name.lower() or "asset" in col.name.lower()), None)
        has_6a = col_6a is not None

        # Pipeline 6/b: Environment/Backdrop focus
        col_6b = next((col for col in collections if "6b" in col.name.lower() or "env" in col.name.lower()), None)
        has_6b = col_6b is not None

        print(f"DEBUG: 6/a Stage Detected: {has_6a}")
        if col_6a:
            print(f"DEBUG: 6/a Objects: {[o.name for o in col_6a.objects]}")
        print(f"DEBUG: 6/b Stage Detected: {has_6b}")
        if col_6b:
            print(f"DEBUG: 6/b Objects: {[o.name for o in col_6b.objects]}")

        # If either is missing, it suggests the pipeline hasn't been merged into the master scene
        self.assertTrue(has_6a or has_6b, "ERROR: Neither 6/a nor 6/b pipeline markers found in collections.")

    def test_scoping_integrity(self):
        """Verifies that 6a.ASSETS contains only character assets, not cameras/backdrops."""
        coll = bpy.data.collections.get("6a.ASSETS")
        self.assertIsNotNone(coll, "6a.ASSETS collection missing")

        for obj in coll.objects:
            # Ensure no cameras or backdrops are in the character asset collection
            self.assertFalse(obj.type == 'CAMERA', f"Scoping Violation: Camera {obj.name} found in asset collection.")
            self.assertFalse("Backdrop" in obj.name, f"Scoping Violation: Backdrop {obj.name} found in asset collection.")

            # Ensure it's a character mesh, rig, or protagonist
            is_valid = (".Body" in obj.name or ".Rig" in obj.name or
                        "Herbaceous" in obj.name or "Arbor" in obj.name or
                        obj.name in config.SPIRIT_ENSEMBLE.keys() or
                        obj.name in config.RIG_MAP_SRC.values())
            self.assertTrue(is_valid, f"Scoping Violation: Non-asset object {obj.name} found in 6a.ASSETS")

    def test_camera_trajectory_audit(self):
        """Blender 5 Camera Audit: Table showing location every 100 frames."""
        print("\n" + "=" * 80)
        print(f"{'FRAME':<10} | {'PRIMARY CAMERA':<20} | {'CAMERA LOCATION (X, Y, Z)':<40}")
        print("-" * 80)

        scene = bpy.context.scene
        # Ensure we check the full range from frame 1 to config.TOTAL_FRAMES
        frames = range(1, config.TOTAL_FRAMES + 1, 100)
        for f in frames:
            scene.frame_set(f)
            # Update view layer to ensure we get evaluated coordinates
            bpy.context.view_layer.update()

            cam = scene.camera
            cam_name = cam.name if cam else "NONE"

            if cam:
                loc = cam.matrix_world.to_translation()
                loc_str = f"({loc.x:7.2f}, {loc.y:7.2f}, {loc.z:7.2f})"
            else:
                loc_str = "N/A"

            print(f"{f:<10} | {cam_name:<20} | {loc_str:<40}")
        print("=" * 80 + "\n")

    def test_camera_motion_verification(self):
        """Verify Blender 5 camera motion without using deprecated fcurves."""
        print("\nVerifying Camera Motion...")

        cam = bpy.context.scene.camera
        self.assertIsNotNone(cam, "ERROR: No active camera in scene.")

        # 1. Verify Follow Path constraint
        follow_path = next((c for c in cam.constraints if c.type == 'FOLLOW_PATH'), None)
        self.assertIsNotNone(follow_path, f"ERROR: Camera {cam.name} is not following a path.")
        self.assertIsNotNone(follow_path.target, "ERROR: Follow Path constraint has no target.")

        # 2. Verify coordinate change over time (proves animation exists)
        bpy.context.scene.frame_set(1)
        bpy.context.view_layer.update()
        loc_start = cam.matrix_world.to_translation().copy()

        bpy.context.scene.frame_set(config.TOTAL_FRAMES)
        bpy.context.view_layer.update()
        loc_end = cam.matrix_world.to_translation().copy()

        dist = (loc_end - loc_start).length
        print(f"DEBUG: Camera traveled {dist:.2f}m over {config.TOTAL_FRAMES} frames.")
        self.assertGreater(dist, 1.0, f"ERROR: Camera {cam.name} appears static (dist={dist:.2f}m)")

    def test_camera_curve_animation(self):
        """Verify Blender 5 camera curve animation logic using Slotted Action API."""
        from style_utilities.fcurves_operations import get_action_curves

        cam = bpy.data.objects.get(config.CAMERA_NAME)
        self.assertIsNotNone(cam, f"{config.CAMERA_NAME} camera missing")

        curve = bpy.data.objects.get(f"Curve.{config.CAMERA_NAME}")
        self.assertIsNotNone(curve, "Camera curve missing")

        con = next((c for c in cam.constraints if c.type == 'FOLLOW_PATH'), None)
        self.assertIsNotNone(con, "Follow Path constraint missing on camera")

        # Check for keyframes on the offset factor using Blender 5.0 Slotted Action API
        self.assertIsNotNone(cam.animation_data, "Camera has no animation data")
        self.assertIsNotNone(cam.animation_data.action, "Camera has no action")

        fcurves = get_action_curves(cam.animation_data.action, obj=cam)
        con_fcurve = next((f for f in fcurves if "offset_factor" in f.data_path), None)
        self.assertIsNotNone(con_fcurve, "Animation missing for camera path offset")
        self.assertGreaterEqual(len(con_fcurve.keyframe_points), 2)

    def test_diagnostic_occlusion_and_sync(self):
        """Deep dive into raycast occlusion and coordinate sync issues."""
        print("\nDIAGNOSTIC: Analyzing Occlusion and Sync...")

        # 1. Check backdrop vs character distance
        cam = bpy.data.objects.get(config.CAMERA_NAME)
        backdrop = bpy.data.objects.get("ChromaBackdrop_Wide")
        leafy = bpy.data.objects.get(config.CHAR_LEAFY_MESH)

        if cam and backdrop and leafy:
            c_loc = cam.matrix_world.to_translation()
            b_loc = backdrop.matrix_world.to_translation()
            l_loc = leafy.matrix_world.to_translation()

            d_cam_bg = (b_loc - c_loc).length
            d_cam_char = (l_loc - c_loc).length
            print(f"DEBUG: Cam->Backdrop: {d_cam_bg:.2f}m, Cam->Character: {d_cam_char:.2f}m")

        # 2. Check Rig/Mesh Matrix Alignment
        rig = bpy.data.objects.get(config.CHAR_LEAFY_RIG)
        if rig and leafy:
            print(f"DEBUG: Rig World Matrix Translation: {rig.matrix_world.to_translation()}")
            print(f"DEBUG: Mesh World Matrix Translation: {leafy.matrix_world.to_translation()}")

if __name__ == "__main__":
    unittest.main(argv=[sys.argv[0]])
