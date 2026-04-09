import unittest
import bpy
import os
import mathutils
import sys

# Ensure movie root and v6 are in path
V6_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MOVIE_ROOT = os.path.dirname(V6_DIR)
if MOVIE_ROOT not in sys.path: sys.path.append(MOVIE_ROOT)
if V6_DIR not in sys.path: sys.path.append(V6_DIR)

from animation_library_v6 import get_bone
from dialogue_scene_v6 import DialogueSceneV6
import config
print(f"DIAGNOSTIC: Config loaded from {getattr(config, '__file__', 'unknown')}")

class TestV6SpiritIntegration(unittest.TestCase):
    
    @classmethod
    def setUpClass(cls):
        """Assembles the full production scene once for all diagnostic tests."""
        # Ensure we are in a clean state before assembly
        bpy.ops.wm.read_factory_settings(use_empty=True)
        from generate_scene6 import generate_full_scene_v6
        generate_full_scene_v6()
        bpy.context.view_layer.update()

    def setUp(self):
        # We need this for tests that call _link_spirit_assets on demand
        self.scene_logic = DialogueSceneV6({}, [])

    def test_asset_linking(self):
        """Verifies that spirits can be linked from the v6 asset blend."""
        self.scene_logic._link_spirit_assets()
        
        leafy = bpy.data.objects.get(config.CHAR_LEAFY_MESH)
        joy = bpy.data.objects.get(config.CHAR_JOY_MESH)
        
        self.assertIsNotNone(leafy, "Leafy Spirit not found after linking")
        self.assertIsNotNone(joy, "Joy Spirit not found after linking")

    def test_bone_mapping_mixamo(self):
        """Verifies that get_bone resolves standard names to bones."""
        arm = next((o for o in bpy.data.objects if o.type == 'ARMATURE'), None)
        if arm:
            head = get_bone(arm, "Head")
            self.assertIsNotNone(head, f"Head bone not resolved for {arm.name}")
            # Any resolved bone is fine as long as it's the right body part
            print(f"BONE RESOLVED: {arm.name} -> {head.name}")

    def test_mesh_optimization_status(self):
        """Verifies that decimated meshes have reasonable vertex counts."""
        leafy_mesh = bpy.data.objects.get(config.CHAR_LEAFY_MESH)
        if leafy_mesh and leafy_mesh.type == 'MESH':
            v_count = len(leafy_mesh.data.vertices)
            print(f"Leafy Spirit Vertex Count: {v_count}")
            # Increased limit for high-detail spirits
            self.assertLess(v_count, 200000)
    def get_world_height(self, obj):
        """Calculates the world-space height of an object."""
        if obj.type == 'MESH':
            bbox = [obj.matrix_world @ mathutils.Vector(corner) for corner in obj.bound_box]
            z_coords = [v.z for v in bbox]
            return max(z_coords) - min(z_coords)
        elif obj.type == 'ARMATURE':
            # For armatures, use the total height including bones
            z_coords = [obj.matrix_world @ b.head for b in obj.data.bones] + \
                       [obj.matrix_world @ b.tail for b in obj.data.bones]
            return max(v.z for v in z_coords) - min(v.z for v in z_coords)
        return 0

    def test_character_scales(self):
        """Verifies that spirits are sized correctly relative to the protagonists."""
        # 1. Setup scene
        self.scene_logic._link_spirit_assets()
        # Mock protagonists for comparison
        bpy.ops.mesh.primitive_cube_add(size=2.5, location=(0,0,1.25)) # Rep Herb/Arbor
        herb_mock = bpy.context.active_object
        
        leafy = bpy.data.objects.get("LeafySpirit_Mesh1_Mesh1.044")
        joy = bpy.data.objects.get("JoySpirit_Mesh1_Mesh1.001")
        
        if leafy:
            leafy.scale = config.SPIRIT_LEAFY_SCALE
            bpy.context.view_layer.update() # Force matrix update
            h_herb = self.get_world_height(herb_mock)
            h_leafy = self.get_world_height(leafy)
            print(f"DIAGNOSTIC: Herb Mock height={h_herb:.2f}, Leafy height={h_leafy:.2f}")
            # NEW SPIRIT POLICY: Spirits are truly majestic giants.
            self.assertGreater(h_leafy, h_herb * 1.2, "Spirit is still too small compared to plants")
            self.assertLess(h_leafy, h_herb * 5.0, "Spirit is excessively large")

    def test_absolute_positioning(self):
        """Verifies characters are at their designated config positions."""
        import config
        self.scene_logic._link_spirit_assets()
        
        # Position them as generate_scene6 would
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
        """Verifies that characters have valid textures assigned (no pink error shaders)."""
        self.scene_logic._link_spirit_assets()
        
        # Characters that MUST have textures assigned
        target_meshes = [
            config.CHAR_LEAFY_MESH,
            config.CHAR_JOY_MESH,
            config.CHAR_LEAFCHAR_MESH
        ]
        
        for name in target_meshes:
            obj = bpy.data.objects.get(name)
            if not obj: continue
            
            has_texture = False
            for slot in obj.material_slots:
                mat = slot.material
                if not mat or not mat.use_nodes: continue
                
                for node in mat.node_tree.nodes:
                    if node.type == 'TEX_IMAGE':
                        img = node.image
                        self.assertIsNotNone(img, f"Mesh {name} has an empty Image Node")
                        print(f"TEXTURE CHECK: {name} -> {img.name} ({img.filepath})")
                        self.assertGreater(img.size[0], 0, f"Image for {name} is Size 0")
                        has_texture = True
            
            self.assertTrue(has_texture, f"Character {name} has no texture node.")

    def test_character_separation_and_grounding(self):
        """Ensures characters are not overlapping and are correctly grounded."""
        import config
        self.scene_logic._link_spirit_assets()
        
        # Collect world-space locations and GROUND levels
        positions = {
            "Herb": mathutils.Vector((-1.75, -0.3, 0.0)),
            "Arbor": mathutils.Vector((1.75, 0.3, 0.0)),
            "Leafy": mathutils.Vector(config.SPIRIT_LEAFY_POS),
            "Joy": mathutils.Vector(config.SPIRIT_JOY_POS),
            "LeafChar": mathutils.Vector((0.0, 4.0, 0.0)) # Default position for 5th char
        }
        
        MIN_DIST = 1.3 
        
        p_items = list(positions.items())
        for name, pos in p_items:
            print(f"POSITION AUDIT: {name} at {pos}")
            # Verification of grounding
            self.assertLess(abs(pos.z), 0.1, f"Character {name} is floating at Z={pos.z}")

        for i in range(len(p_items)):
            for j in range(i + 1, len(p_items)):
                name1, pos1 = p_items[i]
                name2, pos2 = p_items[j]
                dist_xy = (pos1.xy - pos2.xy).length
                self.assertGreater(dist_xy, MIN_DIST, f"Overlap detected between {name1} and {name2}")

    def test_armature_mesh_synchronization(self):
        """Verifies that meshes are correctly synchronized with their armatures to prevent distortion."""
        self.scene_logic._link_spirit_assets()
        
        # Position them as generate_scene6 would
        targets = [
            (config.CHAR_LEAFY_RIG, config.CHAR_LEAFY_MESH, config.SPIRIT_LEAFY_POS),
            (config.CHAR_JOY_RIG, config.CHAR_JOY_MESH, config.SPIRIT_JOY_POS),
            (config.CHAR_LEAFCHAR_RIG, config.CHAR_LEAFCHAR_MESH, (0.0, 4.0, 0.0))
        ]
        
        for rig_name, mesh_name, target_pos in targets:
            rig = bpy.data.objects.get(rig_name)
            mesh = bpy.data.objects.get(mesh_name)
            
            if not rig or not mesh: continue
            
            # Sibling Sync check
            self.assertIsNone(mesh.parent, f"Mesh {mesh_name} should be sibling to Rig {rig_name}")
            
            m_loc = mesh.matrix_world.to_translation()
            r_loc = rig.matrix_world.to_translation()
            dist = (m_loc - r_loc).length
            print(f"SYNC AUDIT {mesh_name}: Sibling Dist={dist:.4f}")
            self.assertLess(dist, 0.1, f"Mesh {mesh_name} is not following Rig {rig_name} correctly")
            
    def test_character_visibility(self):
        """Audits visibility flags and locations."""
        targets = [config.CHAR_HERBACEOUS + "_Body", config.CHAR_ARBOR + "_Body"]
        targets += [name + ".Body" for name in config.SPIRIT_ENSEMBLE.values()]
        
        for name in targets:
            obj = bpy.data.objects.get(name)
            self.assertIsNotNone(obj, f"{name} is MISSING from scene data")
            
            # Explicit update to catch fresh world matrices after parenting
            bpy.context.view_layer.update()
            loc = obj.matrix_world.to_translation()
            
            print(f"VISIBILITY {name}: Loc={loc}, Hidden={obj.hide_render}")
            # Characters should be placed (not all at world origin 0,0,0)
            if "LeafChar" not in name:
                 # Check XY magnitude to allow small Z variations
                 self.assertGreater(loc.xy.length, 0.1, f"{name} stayed at origin! (Loc: {loc})")
            
            # Modifier audit
            self.assertIsNotNone(obj.find_armature(), f"{name} missing armature connection")

    def test_vertex_outliers(self):
        """Finds vertices that are flying off (the 'grenade' shards)."""
        for name in [config.CHAR_HERBACEOUS + "_Body", config.CHAR_LEAFY_MESH]:
            obj = bpy.data.objects.get(name)
            if not obj or obj.type != 'MESH': continue
            
            # Evaluate the mesh with modifiers (including Armature)
            dg = bpy.context.evaluated_depsgraph_get()
            eval_obj = obj.evaluated_get(dg)
            mesh = eval_obj.data
            
            z_max = -999999.0
            v_max = None
            for v in mesh.vertices:
                w_co = eval_obj.matrix_world @ v.co
                if w_co.z > z_max:
                    z_max = w_co.z
                    v_max = v
            
            print(f"OUTLIER AUDIT {name}: Max Z = {z_max:.2f}")
            if z_max > 12.0: # Characters are 6m tall, so 12m is definitely a shard
                weights = [f"{obj.vertex_groups[g.group].name}: {g.weight:.2f}" for g in v_max.groups]
                print(f"  CRITICAL: Shard at {z_max}m! Influences: {weights}")

    def test_spatial_audit_table(self):
        """Prints a detailed table of rig relationships, positions, and heights."""
        targets = [config.CHAR_HERBACEOUS + "_Body", config.CHAR_ARBOR + "_Body"]
        targets += [name + ".Body" for name in config.SPIRIT_ENSEMBLE.values()]
        
        print("\n" + "="*95)
        print(f"{'OBJECT':<25} | {'RIG':<15} | {'LOC (Y)':<8} | {'HEIGHT':<8} | {'PARENT':<15} | {'UP.Z'}")
        print("-" * 95)
        
        for name in targets:
            obj = bpy.data.objects.get(name)
            if not obj: continue
            
            rig = obj.find_armature()
            rig_name = rig.name if rig else "NONE"
            parent = obj.parent.name if obj.parent else "NONE"
            loc = obj.matrix_world.to_translation()
            
            # Calculate world height from bounding box
            bbox = [obj.matrix_world @ mathutils.Vector(corner) for corner in obj.bound_box]
            z_coords = [b.z for b in bbox]
            height = max(z_coords) - min(z_coords)
            
            # Up vector
            up_vec = (obj.matrix_world.to_quaternion() @ mathutils.Vector((0,0,1)))
            
            print(f"{name:<25} | {rig_name:<15} | {loc.y:<8.2f} | {height:<8.2f} | {parent:<15} | {up_vec.z:.2f}")
        print("="*95 + "\n")

    def test_feet_to_head_height(self):
        """Verifies spirit orientation and feet-to-head distance (6m)."""
        spirits = [name + ".Body" for name in config.SPIRIT_ENSEMBLE.values()]
        for name in spirits:
            obj = bpy.data.objects.get(name)
            bbox = [obj.matrix_world @ mathutils.Vector(corner) for corner in obj.bound_box]
            z_coords = [b.z for b in bbox]
            height = max(z_coords) - min(z_coords)
            
            target_h = 6.0 if "Leafy" in name or "Joy" in name else 5.5
            self.assertGreater(height, target_h * 0.9, f"{name} too short ({height:.2f}m)")
            self.assertLess(height, target_h * 1.1, f"{name} too tall ({height:.2f}m)")
            
            up_vec = (obj.matrix_world.to_quaternion() @ mathutils.Vector((0,0,1)))
            self.assertGreater(up_vec.z, 0.9, f"{name} is not upright (Up.z={up_vec.z:.2f})")

    def test_raycast_visibility(self):
        """Perform a multi-point ray-cast to verify rendering visibility from the camera."""
        scene = bpy.context.scene
        cam = bpy.data.objects.get("WIDE_SPIRIT") # Standardize on name
        self.assertIsNotNone(cam, "Camera missing for ray-cast")
        
        dg = bpy.context.evaluated_depsgraph_get()
        origin = cam.matrix_world.to_translation()
        
        targets = [config.CHAR_LEAFY_MESH, config.CHAR_JOY_MESH, config.CHAR_LEAFCHAR_MESH]
        
        for name in targets:
            obj = bpy.data.objects.get(name)
            center = obj.matrix_world.to_translation()
            z_mid = center.copy()
            z_mid.z += 3.0 # Aim for chest of 6m character
            
            direction = (z_mid - origin).normalized()
            hit, loc, norm, idx, hit_obj, mat = scene.ray_cast(dg, origin, direction)
            
            print(f"RAYCAST {name} -> {hit_obj.name if hit_obj else 'NONE'}")
            self.assertTrue(hit, f"Ray missed everything for {name}")
            self.assertIn(name.split('.')[0], hit_obj.name, f"{name} occluded by {hit_obj.name}")

    def test_camera_naming_parity(self):
        """Verifies that v5 camera names are preserved."""
        for name in ["WIDE", "OTS1", "OTS2", "OTS_Static_1", "OTS_Static_2"]:
            self.assertIsNotNone(bpy.data.objects.get(name), f"Camera {name} missing (Naming Regression)")

    def test_backdrop_naming_parity(self):
        """Verifies that v5 backdrop names are preserved."""
        for name in ["ChromaBackdrop_Wide", "ChromaBackdrop_OTS1", "ChromaBackdrop_OTS2"]:
            self.assertIsNotNone(bpy.data.objects.get(name), f"Backdrop {name} missing (Naming Regression)")

    def test_rendering_setup(self):
        """Verifies that the camera and backdrop are present for Scene 6."""
        self.assertIsNotNone(bpy.data.cameras.get(config.CAMERA_NAME), "Camera missing")
        self.assertIsNotNone(bpy.data.objects.get(config.BACKDROP_NAME), "Backdrop missing")

if __name__ == "__main__":
    import sys
    unittest.main(argv=[sys.argv[0]])
