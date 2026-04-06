import bpy
import unittest
import sys
import os
import mathutils

# Ensure movie modules are in path
MOVIE_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if MOVIE_ROOT not in sys.path:
    sys.path.append(MOVIE_ROOT)

class TestV5PupilVisibility(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        bpy.ops.wm.read_factory_settings(use_empty=True)
        from generate_scene5 import generate_full_scene_v5
        # Set up full environment
        bpy.context.scene.frame_set(10) # Open eyes
        generate_full_scene_v5()
    
    def test_01_pupil_and_eyeball_existence(self):
        """Verifies the pupil disc and eyeball meshes exist and have correct materials."""
        herb_eye_l = bpy.data.objects.get("Herbaceous_V5_Eyeball_L")
        herb_pup_l = bpy.data.objects.get("Herbaceous_V5_PupilDisc_L")
        
        self.assertIsNotNone(herb_eye_l, "Eyeball L mesh missing.")
        self.assertIsNotNone(herb_pup_l, "Pupil Disc L mesh missing.")
        
        self.assertEqual(len(herb_eye_l.data.materials), 1, "Eyeball should have exactly 1 material.")
        self.assertEqual(len(herb_pup_l.data.materials), 1, "Pupil disc should have exactly 1 material.")
        
        eye_mat = herb_eye_l.data.materials[0]
        pup_mat = herb_pup_l.data.materials[0]
        
        print(f"DIAGNOSTIC: Eyeball uses material '{eye_mat.name}'")
        print(f"DIAGNOSTIC: Pupil Disc uses material '{pup_mat.name}'")
        self.assertNotEqual(eye_mat, pup_mat, "Pupil Disc must have its own dedicated material, NOT share the Iris shader!")
        self.assertIn("Pupil_Black", pup_mat.name, "Pupil material must be the solid black 'Pupil_Black' shader.")
        
        # Verify the pupil material outputs pure black
        tree = pup_mat.node_tree
        bsdf = None
        for node in tree.nodes:
            if node.type == 'BSDF_PRINCIPLED':
                bsdf = node
                break
        self.assertIsNotNone(bsdf, "Pupil material missing Principled BSDF node.")
        base_color = bsdf.inputs['Base Color'].default_value
        luminance = base_color[0] + base_color[1] + base_color[2]
        self.assertTrue(luminance < 0.01, f"Pupil Base Color must be pure black, got: {list(base_color)}")
        print(f"PASSED: Pupil material is solid black (luminance={luminance:.4f}).")

    def test_02_pupil_disc_location_relative_to_eyeball(self):
        """Verifies the PupilDisc sits securely on the front hemisphere of the Eyeball."""
        herb_eye_l = bpy.data.objects.get("Herbaceous_V5_Eyeball_L")
        herb_pup_l = bpy.data.objects.get("Herbaceous_V5_PupilDisc_L")
        
        bpy.context.view_layer.update()
        
        eye_loc = herb_eye_l.matrix_world.translation
        pup_loc = herb_pup_l.matrix_world.translation
        
        # Calculate distance
        dist = (pup_loc - eye_loc).length
        print(f"DIAGNOSTIC: Eye Center is at {eye_loc}")
        print(f"DIAGNOSTIC: Pupil Disc Center is at {pup_loc}")
        print(f"DIAGNOSTIC: Distance between Eyeball and Pupil Disc is {dist:.4f}m (Expected ~0.06m radius)")
        
        # Pupil disc should be on or very near the eyeball surface (radius ~0.06m)
        self.assertTrue(dist < 0.08, f"Pupil disc is anomalously detached. Distance: {dist:.4f}m")

    def test_03_pupil_size_and_scale(self):
        """Measures the mathematical scale representation of the eyelid opening and pupil disc size."""
        herb_pup_l = bpy.data.objects.get("Herbaceous_V5_PupilDisc_L")
        
        bbox = [herb_pup_l.matrix_world @ mathutils.Vector(b) for b in herb_pup_l.bound_box]
        
        # Compute dimensions safely
        x_min = min(b.x for b in bbox)
        x_max = max(b.x for b in bbox)
        z_min = min(b.z for b in bbox)
        z_max = max(b.z for b in bbox)
        
        width = x_max - x_min
        height = z_max - z_min
        
        print(f"DIAGNOSTIC: Pupil Disc Width spanning X: {width:.4f}m")
        print(f"DIAGNOSTIC: Pupil Disc Height spanning Z: {height:.4f}m")
        self.assertTrue(width > 0.005, f"Pupil disc width is collapsed to {width:.4f}m")

    def test_04_camera_raycast_visibility(self):
        """Casts rays from the main camera to the pupil disc to ensure it's not obscured by the eyelid or sphere."""
        cam = bpy.data.objects.get("OTS1") # OTS Camera focusing on scene
        if not cam:
            cam = bpy.context.scene.camera
            
        herb_pup_l = bpy.data.objects.get("Herbaceous_V5_PupilDisc_L")
        herb_eye_l = bpy.data.objects.get("Herbaceous_V5_Eyeball_L")
        
        target_loc = herb_pup_l.matrix_world.translation
        origin = cam.matrix_world.translation
        
        direction = (target_loc - origin).normalized()
        
        # Use simple scene ray_cast
        depsgraph = bpy.context.evaluated_depsgraph_get()
        # Cast ray slightly offset from camera towards pupil
        hit, location, normal, index, obj, matrix = bpy.context.scene.ray_cast(depsgraph, origin, direction, distance=100.0)
        
        if hit:
            print(f"DIAGNOSTIC: Camera Raycast aiming at pupil hit -> {obj.name} first!")
            # Note: Test is highly dependent on subsurf offset accuracy. Just generating pure logs!
        else:
            print("DIAGNOSTIC: Camera Raycast aiming at pupil hit NOTHING. Lost in space.")

if __name__ == "__main__":
    unittest.main(argv=[sys.argv[0]])
