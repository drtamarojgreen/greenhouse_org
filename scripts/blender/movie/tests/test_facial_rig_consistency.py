import bpy
import unittest
import sys
import os

# Add assets and tests to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from assets import plant_humanoid, gnome_antagonist

class TestFacialRigConsistency(unittest.TestCase):
    def setUp(self):
        # Clear scene
        bpy.ops.wm.read_factory_settings(use_empty=True)

    def test_plant_facial_props(self):
        """Verify plant humanoid facial prop architecture."""
        name = "TestPlant"
        armature = plant_humanoid.create_plant_humanoid(name, (0, 0, 0))
        
        expected_props = [f"{name}_Eye_L", f"{name}_Eye_R", f"{name}_Mouth", f"{name}_Brow_L", f"{name}_Brow_R"]
        for prop_name in expected_props:
            with self.subTest(prop=prop_name):
                obj = bpy.data.objects.get(prop_name)
                self.assertIsNotNone(obj, f"Facial prop {prop_name} not found")
                self.assertEqual(obj.parent, armature, f"{prop_name} not parented to armature")
                self.assertEqual(obj.parent_type, 'BONE', f"{prop_name} not bone-parented")
                self.assertTrue(obj.parent_bone in armature.data.bones, f"Parent bone for {prop_name} missing")
                
                # Check material assignment
                self.assertGreater(len(obj.data.materials), 0, f"{prop_name} has no materials")
                if "Eye" in prop_name:
                    # Check for iris material nodes
                    mat = obj.data.materials[0]
                    nodes = mat.node_tree.nodes
                    self.assertTrue(any(n.type == 'TEX_GRADIENT' for n in nodes), "Eye material missing gradient")
                    # Check for UV mapping
                    coord = next((n for n in nodes if n.type == 'TEX_COORD'), None)
                    if coord:
                        links = mat.node_tree.links
                        uv_linked = any(l.from_socket.name == 'UV' for l in coord.outputs['UV'].links)
                        self.assertTrue(uv_linked, "Eye shader not using UV mapping")

    def test_gnome_facial_props(self):
        """Verify gnome antagonist facial prop architecture."""
        name = "TestGnome"
        armature = gnome_antagonist.create_gnome(name, (0, 0, 0))
        
        expected_props = [f"{name}_Eye_L", f"{name}_Eye_R", f"{name}_Mouth", f"{name}_Brow_L", f"{name}_Brow_R"]
        for prop_name in expected_props:
            with self.subTest(prop=prop_name):
                obj = bpy.data.objects.get(prop_name)
                self.assertIsNotNone(obj, f"Facial prop {prop_name} not found")
                self.assertEqual(obj.parent, armature, f"{prop_name} not parented to armature")
                self.assertEqual(obj.parent_type, 'BONE', f"{prop_name} not bone-parented")
                
                # Check eye material is red
                if "Eye" in prop_name:
                    mat = obj.data.materials[0]
                    bsdf = mat.node_tree.nodes.get("Principled BSDF")
                    # Color check (looking for red)
                    # Note: we might have wrapped it in a mix node
                    if bsdf:
                        # Find the color ramp or direct color
                        ramp = mat.node_tree.nodes.get("ShaderNodeValToRGB")
                        if ramp:
                            iris_color = ramp.color_ramp.elements[1].color
                            self.assertGreater(iris_color[0], 0.4, "Gnome eye iris color not red-ish")
                            self.assertLess(iris_color[1], 0.2, "Gnome eye iris color has too much green")

    def test_no_internal_face_geometry(self):
        """Verify that internal face geometry has been removed from main mesh."""
        arm = plant_humanoid.create_plant_humanoid("TestClean", (0, 0, 0))
        mesh_obj = bpy.data.objects.get("TestClean_Torso")
        self.assertIsNotNone(mesh_obj)
        
        # In the old version, eyes were material index 2. 
        # We can check if any faces use material index 2 (assuming index 2 was ONLY eyes)
        # Or more simply, check if the vertex groups for eyes have any internal mesh influence.
        vg_l = mesh_obj.vertex_groups.get("Eye.L")
        if vg_l:
            # Check if any vertex in the main mesh has weight > 0 for Eye.L
            # (In the new version, only the standalone Eye_L object should be influenced by the bone,
            # but the main mesh might still have the group if it's auto-generated, but it should be empty)
            has_influence = False
            for v in mesh_obj.data.vertices:
                for g in v.groups:
                    if g.group == vg_l.index and g.weight > 0.001:
                        has_influence = True
                        break
            self.assertFalse(has_influence, "Main torso mesh still has vertices influenced by internal Eye.L group")

if __name__ == "__main__":
    argv = [sys.argv[0]]
    if "--" in sys.argv: argv.extend(sys.argv[sys.argv.index("--") + 1:])
    unittest.main(argv=argv, exit=False)
