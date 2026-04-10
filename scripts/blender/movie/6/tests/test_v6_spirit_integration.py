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
from style_utilities.fcurves_operations import get_action_curves
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
        """Verifies that character meshes remain at local origin relative to their rigs."""
        self.scene_logic._link_spirit_assets()

        targets = [
            (config.CHAR_LEAFY_RIG,    config.CHAR_LEAFY_MESH,    config.SPIRIT_LEAFY_POS),
            (config.CHAR_JOY_RIG,      config.CHAR_JOY_MESH,      config.SPIRIT_JOY_POS),
        ]

        for rig_name, mesh_name, target_pos in targets:
            rig  = bpy.data.objects.get(rig_name)
            mesh = bpy.data.objects.get(mesh_name)
            if not rig or not mesh:
                continue

            # Move the RIG to the target position
            rig.location = target_pos
            bpy.context.view_layer.update()

            # The mesh should be at local (0,0,0) if properly parented/normalized
            self.assertLess(mesh.location.length, 0.01,
                            f"Mesh {mesh_name} is not at local origin of Rig {rig_name}")

            # The world position should match
            world_pos = mesh.matrix_world.to_translation()
            dist = (world_pos - mathutils.Vector(target_pos)).length
            self.assertLess(dist, 0.01, f"Character {mesh_name} world position mismatch")

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

        # Ensure we are at a frame where characters have been positioned
        bpy.context.scene.frame_set(1)

        for name in targets:
            obj = bpy.data.objects.get(name)
            self.assertIsNotNone(obj, f"{name} is MISSING from scene data")

            bpy.context.view_layer.update()
            loc = obj.matrix_world.to_translation()
            print(f"VISIBILITY {name}: Loc={loc}, Hidden={obj.hide_render}")

            # Protagonists should be at their set positions, not origin
            if any(p in name for p in [config.CHAR_HERBACEOUS, config.CHAR_ARBOR]):
                 # We check that they are moved from (0,0,1) mock origin
                 self.assertGreater(loc.xy.length, 0.5, f"{name} stayed at origin! (Loc: {loc})")

            is_arm = obj.type == 'ARMATURE' or obj.find_armature() is not None
            self.assertTrue(is_arm, f"{name} missing armature connection")

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

        print("\n" + "=" * 95)
        print(f"{'OBJECT':<25} | {'RIG':<15} | {'LOC (Y)':<8} | {'HEIGHT':<8} | {'PARENT':<15} | {'UP.Z'}")
        print("-" * 95)

        for name in targets:
            obj = bpy.data.objects.get(name)
            if not obj:
                continue

            rig      = obj.find_armature()
            rig_name = rig.name if rig else "NONE"
            parent   = obj.parent.name if obj.parent else "NONE"
            loc      = obj.matrix_world.to_translation()

            bbox    = [obj.matrix_world @ mathutils.Vector(c) for c in obj.bound_box]
            z_vals  = [b.z for b in bbox]
            height  = max(z_vals) - min(z_vals)

            up_vec = obj.matrix_world.to_quaternion() @ mathutils.Vector((0, 0, 1))
            print(f"{name:<25} | {rig_name:<15} | {loc.y:<8.2f} | "
                  f"{height:<8.2f} | {parent:<15} | {up_vec.z:.2f}")
        print("=" * 95 + "\n")

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
            # RESIZING PROHIBITED: Report actual height only.
            print(f"HEIGHT AUDIT {name}: {height:.2f}m (Imported scale, target {target_h}m)")

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

        for name in targets:
            obj = bpy.data.objects.get(name)
            if not obj:
                continue

            bpy.context.view_layer.update()

            # Try to aim at the Head bone for better reliability
            target_pt = None
            rig = obj.find_armature() or (obj if obj.type == 'ARMATURE' else None)
            if rig:
                head = get_bone(rig, "Head") or get_bone(rig, "Neck")
                if head:
                    target_pt = rig.matrix_world @ head.head

            if not target_pt:
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

                d_hit = (loc - origin).length
                d_obj = (target_pt - origin).length

                # If we hit a backdrop, check if it's behind
                if not is_hit and "Backdrop" in hit_obj.name:
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

    def test_backdrop_naming_parity(self):
        """Verifies that all v5 backdrop names are preserved."""
        for name in ("ChromaBackdrop_Wide", "ChromaBackdrop_OTS1", "ChromaBackdrop_OTS2"):
            self.assertIsNotNone(
                bpy.data.objects.get(name), f"Backdrop '{name}' missing (naming regression)"
            )

    def test_backdrop_integrity(self):
        """Verifies loading, visibility, position, and placement of backdrops."""
        print("\nVerifying Backdrop Integrity...")
        targets = ["ChromaBackdrop_Wide", "ChromaBackdrop_OTS1", "ChromaBackdrop_OTS2"]

        env_coll = bpy.data.collections.get("6b.ENVIRONMENT") or bpy.data.collections.get("ENV.CHROMA.6b")
        self.assertIsNotNone(env_coll, "Environment collection (6b) missing")

        for name in targets:
            obj = bpy.data.objects.get(name)
            self.assertIsNotNone(obj, f"Backdrop {name} MISSING")

            # Visibility checks
            self.assertFalse(obj.hide_render, f"Backdrop {name} HIDDEN from render")
            self.assertFalse(obj.hide_viewport, f"Backdrop {name} HIDDEN from viewport")
            self.assertIn(obj.name, [o.name for o in env_coll.objects], f"Backdrop {name} not in 6b collection")

            # Material / Emission check
            self.assertGreater(len(obj.data.materials), 0, f"Backdrop {name} has NO material")
            mat = obj.data.materials[0]
            self.assertTrue(mat.use_nodes, f"Backdrop {name} material not using nodes")

            has_emission = any(n.type == 'EMISSION' for n in mat.node_tree.nodes)
            self.assertTrue(has_emission, f"Backdrop {name} material missing Emission shader")

            # Placement audit
            loc = obj.matrix_world.to_translation()
            dim = obj.dimensions
            print(f"BACKDROP {name}: Loc={loc}, Dim={dim[:]}")
            self.assertGreater(dim.x, 50, f"Backdrop {name} likely too small (distorted dimensions)")

    def test_backdrop_audit_table(self):
        """Diagnostic table of backdrop distances and vectors to the active camera."""
        print("\n" + "=" * 125)
        print(f"{'BACKDROP':<25} | {'LOCATION':<22} | {'DIST':<8} | {'DIFF.X':<8} | {'DIFF.Y':<8} | {'DIFF.Z'}")
        print("-" * 125)

        cam = bpy.context.scene.camera
        cam_loc = cam.matrix_world.to_translation() if cam else mathutils.Vector((0,0,0))

        targets = ["ChromaBackdrop_Wide", "ChromaBackdrop_OTS1", "ChromaBackdrop_OTS2"]
        for name in targets:
            obj = bpy.data.objects.get(name)
            if not obj:
                continue

            loc = obj.matrix_world.to_translation()
            vec = loc - cam_loc
            dist = vec.length
            print(f"{name:<25} | {str(loc.to_tuple(1)):<22} | {dist:<8.2f}m | "
                  f"{vec.x:<8.2f} | {vec.y:<8.2f} | {vec.z:.2f}")
        print("=" * 125 + "\n")

    def test_backdrop_visual_debug_cylinders(self):
        """Draws cylinders from origin to backdrop centers and reports spatial data."""
        import math
        print("\n" + "=" * 80)
        print(f"{'BACKDROP':<25} | {'LENGTH':<10} | {'ORIENTATION (X,Y,Z)'}")
        print("-" * 80)

        origin = mathutils.Vector((0, 0, 0))
        targets = ["ChromaBackdrop_Wide", "ChromaBackdrop_OTS1", "ChromaBackdrop_OTS2"]

        for name in targets:
            obj = bpy.data.objects.get(name)
            if not obj: continue

            target = obj.matrix_world.to_translation()
            vec = target - origin
            length = vec.length

            # Create cylinder
            bpy.ops.mesh.primitive_cylinder_add(
                radius=0.1,
                depth=length,
                location=(origin + target) / 2
            )
            cyl = bpy.context.active_object
            cyl.name = f"DEBUG.Line.{name}"

            # Orient cylinder to point from origin to backdrop
            rot_quat = mathutils.Vector((0, 0, 1)).rotation_difference(vec.normalized())
            cyl.rotation_euler = rot_quat.to_euler()

            rot_deg = [round(math.degrees(a), 1) for a in cyl.rotation_euler]
            print(f"{name:<25} | {length:<10.2f} | {rot_deg}")
        print("=" * 80 + "\n")

    def test_rendering_setup(self):
        """Verifies camera and backdrop are present for Scene 6."""
        self.assertIsNotNone(
            bpy.data.cameras.get(config.CAMERA_NAME), "Camera missing"
        )
        self.assertIsNotNone(
            bpy.data.objects.get(config.BACKDROP_NAME), "Backdrop missing"
        )

    def test_camera_trajectory_audit(self):
        """Outputs a diagnostic table of primary camera coordinates."""
        print("\n" + "=" * 60)
        print(f"{'FRAME':<8} | {'PRIMARY CAMERA':<20} | {'LOCATION'}")
        print("-" * 60)

        cam = bpy.context.scene.camera
        if not cam:
            print("ERROR: No active camera for trajectory audit")
            return

        for f in range(1, config.TOTAL_FRAMES + 1, 1000):
            bpy.context.scene.frame_set(f)
            loc = cam.matrix_world.to_translation()
            print(f"{f:<8} | {cam.name:<20} | {loc}")
        print("=" * 60 + "\n")

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

    def test_camera_curve_animation(self):
        """Verify Blender 5 camera curve animation logic."""
        print("\nVerifying Camera Curve Animation...")

        cam = bpy.context.scene.camera
        self.assertIsNotNone(cam, "ERROR: No active camera in scene.")

        # Check for Follow Path constraint
        follow_path = next((c for c in cam.constraints if c.type == 'FOLLOW_PATH'), None)

        self.assertIsNotNone(follow_path, f"ERROR: Camera {cam.name} is not following a path (Curve).")
        self.assertIsNotNone(follow_path.target, "ERROR: Follow Path constraint has no target object.")
        self.assertEqual(follow_path.target.type, 'CURVE', "ERROR: Follow Path target is not a Curve.")

        # Check for animation data on the constraint (fixed path vs animated path)
        has_anim = (cam.animation_data and cam.animation_data.action) or \
                   (follow_path.target.animation_data and follow_path.target.animation_data.action)

        print(f"DEBUG: Camera Path: {follow_path.target.name if follow_path.target else 'None'}")
        self.assertTrue(has_anim, "ERROR: No animation data found for camera or its path.")

        # Targeted Diagnostic: Check evaluation of offset
        if follow_path and follow_path.use_fixed_location:
            print(f"DEBUG: Fixed Position: {follow_path.offset_factor}")

            # Check for keyframes on offset_factor
            has_offset_keys = False
            if cam.animation_data and cam.animation_data.action:
                # Blender 5.0+: Use the helper that abstracts Slotted Actions
                fcurves = get_action_curves(cam.animation_data.action, obj=cam)
                has_offset_keys = any(fc.data_path.endswith("offset_factor") for fc in fcurves)

                self.assertTrue(has_offset_keys, "DIAGNOSTIC: Camera uses Fixed Location but has no offset keyframes.")

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
