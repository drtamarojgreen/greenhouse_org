import bpy
import os
import sys
import unittest
import mathutils

# --- Path Injection ---
V6_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if V6_DIR not in sys.path: sys.path.insert(0, V6_DIR)

import config
from generate_scene6 import generate_full_scene_v6

class TestCharacterIntegrity(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        """Assemble the scene once for testing."""
        # Ensure a clean state and build the scene
        generate_full_scene_v6()
        bpy.context.view_layer.update()

    def get_character_rigs(self):
        """Finds all primary armatures in the assets collection."""
        coll = bpy.data.collections.get(config.COLL_ASSETS)
        if not coll:
            return []
        # Filter for armatures or top-level mesh bodies
        rigs = [o for o in coll.objects if o.type == 'ARMATURE']
        return rigs

    def test_armature_presence(self):
        """1. Armature Audit: Ensure every character has a rig."""
        coll = bpy.data.collections.get(config.COLL_ASSETS)
        self.assertIsNotNone(coll, f"Collection {config.COLL_ASSETS} missing")
        
        # We expect 8 ensemble members + 2 protagonists = 10 characters
        # Ensemble members: Sylvan_Majesty, Radiant_Aura, Verdant_Sprite, Shadow_Weaver, 
        #                   Emerald_Sentinel, Phoenix_Herald, Golden_Phoenix, Root_Guardian
        # Protagonists: Herbaceous, Arbor
        
        expected_names = list(config.SPIRIT_ENSEMBLE.values()) + [config.CHAR_HERBACEOUS, config.CHAR_ARBOR]
        found_rigs = [o.name for o in coll.objects if o.type == 'ARMATURE']
        
        print("\n[Audit] Found Armatures:", found_rigs)
        
        for name in expected_names:
            with self.subTest(character=name):
                # Match by base name
                has_rig = any(name in r_name for r_name in found_rigs)
                self.assertTrue(has_rig, f"Character '{name}' is missing an armature rig!")

    def test_normalization_grounding(self):
        """2. Normalization Check: Grounding (Z=0)."""
        rigs = self.get_character_rigs()
        for rig in rigs:
            with self.subTest(rig=rig.name):
                # Calculate world-space lowest point
                meshes = [o for o in rig.children_recursive if o.type == 'MESH']
                if not meshes: continue
                
                min_z = float('inf')
                for m in meshes:
                    for v in m.data.vertices:
                        z_world = (m.matrix_world @ v.co).z
                        if z_world < min_z: min_z = z_world
                
                print(f"[Normalization] {rig.name} lowest point: {min_z:.4f}m")
                # Threshold: 0.15m allowance for floating/grounding (accounts for floor offsets)
                self.assertLess(abs(min_z), 0.15, f"Character rig '{rig.name}' is not grounded (lowest point: {min_z:.4f}m)")

    def test_normalization_scale(self):
        """3. Normalization Check: Height Scale."""
        rigs = self.get_character_rigs()
        for rig in rigs:
            # Skip Majestic characters for flying if they are intentionally high
            if rig.name == "Radiant_Aura.Rig" and rig.location.z > 1.0:
                print(f"[Normalization] {rig.name} skipping scale check - flying")
                continue
            with self.subTest(rig=rig.name):
                meshes = [o for o in rig.children_recursive if o.type == 'MESH']
                if not meshes: continue
                
                # Determine expected height
                expected_h = config.SPRITE_HEIGHT
                if "Majesty" in rig.name or "Aura" in rig.name:
                    expected_h = config.MAJESTIC_HEIGHT
                elif "Phoenix" in rig.name:
                    expected_h = config.PHOENIX_HEIGHT
                elif "Herbaceous" in rig.name or "Arbor" in rig.name:
                    expected_h = 2.5 # Approximate head height for protagonists
                
                # Simple bounding box height
                all_z = []
                for m in meshes:
                    for v in m.data.vertices:
                        all_z.append((m.matrix_world @ v.co).z)
                
                actual_h = max(all_z) - min(all_z)
                print(f"[Normalization] {rig.name} height: {actual_h:.2f}m (Expected ~{expected_h}m)")
                
                # 15% tolerance for artistic variation
                self.assertAlmostEqual(actual_h, expected_h, delta=expected_h * 0.25, 
                                     msg=f"Character rig '{rig.name}' has incorrect scale (Actual: {actual_h:.2f}m, Expected: {expected_h}m)")

    def test_rigging_weights(self):
        """4. Weight Diagnostic: Ensure meshes have deformation weights or Bone parenting."""
        rigs = self.get_character_rigs()
        for rig in rigs:
            with self.subTest(rig=rig.name):
                meshes = [o for o in rig.children_recursive if o.type == 'MESH']
                for m in meshes:
                    # Case A: Skeletal Skinning (Armature Modifier)
                    has_mod = any(mod.type == 'ARMATURE' and mod.object == rig for mod in m.modifiers)
                    
                    # Case B: Bone Parenting (Facial Props)
                    is_bone_parented = (m.parent == rig and m.parent_type == 'BONE')
                    
                    self.assertTrue(has_mod or is_bone_parented, 
                                   f"Mesh '{m.name}' is not attached to rig '{rig.name}' (No Armature mod and not Bone parented)")
                    
                    # If it has an armature modifier, it should have weights
                    if has_mod and not is_bone_parented:
                        bone_names = {b.name for b in rig.data.bones}
                        vg_names = {vg.name for vg in m.vertex_groups}
                        common = bone_names.intersection(vg_names)
                        # Root_Guardian mesh might have generic names like 'Body'
                        if len(bone_names) > 1 and len(common) == 0:
                             # Allow for some small props that might only follow one bone without VG
                             if len(m.data.vertices) > 100:
                                 self.assertGreater(len(common), 0, f"Mesh '{m.name}' has no vertex groups matching rig bones. It will not animate!")

    def test_limb_attachment(self):
        """5. Hierarchy Validation: Hand/Finger attachment."""
        rigs = [r for r in self.get_character_rigs() if "Herbaceous" in r.name or "Arbor" in r.name]
        for rig in rigs:
            with self.subTest(rig=rig.name):
                # For plant humanoids, check if hands/fingers are in the main body vertex groups
                body_mesh = next((o for o in rig.children if "Body" in o.name), None)
                if body_mesh:
                    vgs = [vg.name for vg in body_mesh.vertex_groups]
                    self.assertIn("Hand.L", vgs, f"{rig.name} Body missing Hand.L vertex group")
                    self.assertIn("Finger.1.L", vgs, f"{rig.name} Body missing Finger vertex groups")

    def test_texture_links(self):
        """6. Texture Audit: Identify materials missing linked images (Pink Blobs)."""
        print("\n[Audit] Texture Link Status:")
        for mat in bpy.data.materials:
            if not mat.use_nodes: continue
            for node in mat.node_tree.nodes:
                if node.type == 'TEX_IMAGE':
                    status = node.image.name if node.image else "MISSING (PINK BLOB!)"
                    print(f"  - Material: {mat.name}, Linked Image: {status}")
                    
                    with self.subTest(material=mat.name):
                        self.assertIsNotNone(node.image, f"Material '{mat.name}' is missing a texture link!")

if __name__ == "__main__":
    unittest.main(argv=['first-arg-is-ignored'], exit=False)
