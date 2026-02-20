import bpy
import unittest
import math
import os
import sys

# Add movie root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from base_test import BlenderTestCase
import style

class TestTextRendering(BlenderTestCase):
    def test_intertitle_orientation(self):
        """Verify that all intertitle objects face the camera (approx 90 deg on X)."""
        titles = [obj for obj in bpy.data.objects if obj.name.startswith("Title_") and obj.type == 'FONT']
        self.assertGreater(len(titles), 0, "No intertitle objects found")
        
        for title in titles:
            rot_x = math.degrees(title.rotation_euler[0])
            # Point 142: Corrected from -90 to 90 to ensure front-facing readability with UP_Z camera.
            self.assertAlmostEqual(rot_x, 90.0, delta=1.0, msg=f"Title {title.name} has incorrect X rotation: {rot_x}")

    def test_spinning_logo_orientation(self):
        """Verify that spinning logo objects face the camera (approx 90 deg on X)."""
        logos = [obj for obj in bpy.data.objects if obj.name.startswith("Logo_") and obj.type == 'FONT']
        # If no logos, skip
        if not logos:
            self.skipTest("No logo objects found")
            
        for logo in logos:
            rot_x = math.degrees(logo.rotation_euler[0])
            # Point 142: Corrected to 90 to face production camera correctly.
            self.assertAlmostEqual(rot_x, 90.0, delta=1.0, msg=f"Logo {logo.name} has incorrect X rotation: {rot_x}")

    def test_credits_orientation(self):
        """Verify that credits text faces the camera (approx 90 deg on X)."""
        credits = bpy.data.objects.get("CreditsText")
        if not credits:
            self.skipTest("CreditsText not found")
            
        rot_x = math.degrees(credits.rotation_euler[0])
        self.assertAlmostEqual(rot_x, 90.0, delta=1.0, msg=f"CreditsText has incorrect X rotation: {rot_x}")

    def test_text_contrast_and_emission(self):
        """Verify text objects have high-emission materials for visibility/contrast."""
        text_objs = [obj for obj in bpy.data.objects if (obj.name.startswith("Title_") or obj.name.startswith("Logo_")) and obj.type == 'FONT']
        
        for obj in text_objs:
            has_emission = False
            for slot in obj.material_slots:
                mat = slot.material
                if not mat or not mat.node_tree: continue
                
                # Check for Emission socket or Principled BSDF Emission
                bsdf = mat.node_tree.nodes.get("Principled BSDF")
                if bsdf:
                    # In 4.0+, Emission socket is renamed to "Emission Color"
                    # But style.get_principled_socket handles this
                    strength_socket = style.get_principled_socket(bsdf, "Emission Strength")
                    if strength_socket:
                        strength = strength_socket.default_value
                        self.assertGreaterEqual(strength, 4.0, f"Text object {obj.name} has low emission strength: {strength}")
                        has_emission = True
                        break
            self.assertTrue(has_emission, f"Text object {obj.name} does not have an emissive material")

    def test_intertitle_backdrop_contrast(self):
        """Verify that intertitles have a dark backdrop for contrast."""
        titles = [obj for obj in bpy.data.objects if obj.name.startswith("Title_") and obj.type == 'FONT']
        
        for title in titles:
            # Expect a corresponding backdrop object (e.g. TitleBG_1)
            # Extracted frame_start from name Title_1_Green
            frame_start = title.name.split('_')[1]
            bg_name = f"TitleBG_{frame_start}"
            bg = bpy.data.objects.get(bg_name)
            
            self.assertIsNotNone(bg, f"Title {title.name} is missing its dark backdrop {bg_name}")
            
            # Verify backdrop material is dark
            has_dark_mat = False
            for slot in bg.material_slots:
                mat = slot.material
                if not mat or not mat.node_tree: continue
                bsdf = mat.node_tree.nodes.get("Principled BSDF")
                if bsdf:
                    color = bsdf.inputs["Base Color"].default_value
                    # Verify it's dark (all components low)
                    self.assertLess(color[0], 0.2, f"Backdrop {bg_name} is too bright (R={color[0]})")
                    self.assertLess(color[1], 0.2, f"Backdrop {bg_name} is too bright (G={color[1]})")
                    self.assertLess(color[2], 0.2, f"Backdrop {bg_name} is too bright (B={color[2]})")
                    has_dark_mat = True
                    break
            self.assertTrue(has_dark_mat, f"Backdrop {bg_name} does not have a valid dark material")

    def test_intro_lighting_contrast(self):
        """Verify that the intro scene has specific lighting for text contrast."""
        intro_light = bpy.data.objects.get("IntroLight")
        self.assertIsNotNone(intro_light, "IntroLight missing for branding scene")
        
        # Verify it is a point light and has high energy
        self.assertEqual(intro_light.type, 'LIGHT')
        self.assertEqual(intro_light.data.type, 'POINT')
        self.assertGreaterEqual(intro_light.data.energy, 4000.0)

if __name__ == "__main__":
    argv = [sys.argv[0]]
    if "--" in sys.argv:
        argv.extend(sys.argv[sys.argv.index("--") + 1:])
    unittest.main(argv=argv)
