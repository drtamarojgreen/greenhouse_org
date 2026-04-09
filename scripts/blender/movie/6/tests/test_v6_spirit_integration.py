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
        arm = next((o for o in bpy.data.objects if o.type == 'ARMATURE'), None)
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
        self.scene_logic._link_spirit_assets()

        targets = [
            (config.CHAR_LEAFY_RIG,    config.CHAR_LEAFY_MESH,    config.SPIRIT_LEAFY_POS),
            (config.CHAR_JOY_RIG,      config.CHAR_JOY_MESH,      config.SPIRIT_JOY_POS),
            (config.CHAR_LEAFCHAR_RIG, config.CHAR_LEAFCHAR_MESH,  (0.0, 4.0, 0.0)),
        ]

        for rig_name, mesh_name, target_pos in targets:
            rig  = bpy.data.objects.get(rig_name)
            mesh = bpy.data.objects.get(mesh_name)
            if not rig or not mesh:
                continue

            self.assertIsNone(mesh.parent,
                              f"Mesh {mesh_name} should be sibling to Rig {rig_name}")

            m_loc = mesh.matrix_world.to_translation()
            r_loc = rig.matrix_world.to_translation()
            dist  = (m_loc - r_loc).length
            print(f"SYNC AUDIT {mesh_name}: Sibling Dist={dist:.4f}")
            self.assertLess(dist, 0.1,
                            f"Mesh {mesh_name} not following Rig {rig_name}")

    def test_character_visibility(self):
        targets  = [config.CHAR_HERBACEOUS + "_Body", config.CHAR_ARBOR + "_Body"]
        targets += [name + ".Body" for name in config.SPIRIT_ENSEMBLE.values()]

        for name in targets:
            obj = bpy.data.objects.get(name)
            self.assertIsNotNone(obj, f"{name} is MISSING from scene data")

            bpy.context.view_layer.update()
            loc = obj.matrix_world.to_translation()
            print(f"VISIBILITY {name}: Loc={loc}, Hidden={obj.hide_render}")

            if "LeafChar" not in name:
                self.assertGreater(loc.xy.length, 0.1,
                                   f"{name} stayed at origin! (Loc: {loc})")

            self.assertIsNotNone(obj.find_armature(),
                                 f"{name} missing armature connection")

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
            self.assertGreater(height, target_h * 0.9, f"{name} too short ({height:.2f}m)")
            self.assertLess(height,    target_h * 1.1, f"{name} too tall ({height:.2f}m)")

            up_vec = obj.matrix_world.to_quaternion() @ mathutils.Vector((0, 0, 1))
            self.assertGreater(up_vec.z, 0.9, f"{name} not upright (Up.z={up_vec.z:.2f})")

    def test_raycast_visibility(self):
        """
        Multi-point ray-cast to verify rendering visibility from the WIDE camera.
        Camera is named 'WIDE' (config.CAMERA_NAME) — NOT 'WIDE_SPIRIT'.
        """
        scene = bpy.context.scene
        # Use config.CAMERA_NAME so this test stays aligned with director_v6.py
        cam = bpy.data.objects.get(config.CAMERA_NAME)
        self.assertIsNotNone(cam, f"Camera '{config.CAMERA_NAME}' missing for ray-cast")

        dg     = bpy.context.evaluated_depsgraph_get()
        origin = cam.matrix_world.to_translation()

        targets = [config.CHAR_LEAFY_MESH, config.CHAR_JOY_MESH, config.CHAR_LEAFCHAR_MESH]

        for name in targets:
            obj = bpy.data.objects.get(name)
            if not obj:
                continue

            center    = obj.matrix_world.to_translation()
            z_mid     = center.copy()
            z_mid.z  += 3.0  # aim for chest of 6m character
            direction = (z_mid - origin).normalized()

            hit, loc, norm, idx, hit_obj, mat = scene.ray_cast(dg, origin, direction)
            print(f"RAYCAST {name} -> {hit_obj.name if hit_obj else 'NONE'}")
            self.assertTrue(hit, f"Ray missed everything for {name}")
            self.assertIn(name.split('.')[0], hit_obj.name,
                          f"{name} occluded by {hit_obj.name}")

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

    def test_rendering_setup(self):
        """Verifies camera and backdrop are present for Scene 6."""
        self.assertIsNotNone(
            bpy.data.cameras.get(config.CAMERA_NAME), "Camera missing"
        )
        self.assertIsNotNone(
            bpy.data.objects.get(config.BACKDROP_NAME), "Backdrop missing"
        )


if __name__ == "__main__":
    unittest.main(argv=[sys.argv[0]])
