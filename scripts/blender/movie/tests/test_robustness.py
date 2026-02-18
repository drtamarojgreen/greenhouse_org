import bpy
import os
import sys
import unittest
import math
from base_test import BlenderTestCase
import style
import silent_movie_generator

class TestRobustness(BlenderTestCase):
    def test_01_missing_external_fbx(self):
        """NEG-01: Verify missing external FBX doesn't crash initialization."""
        # This is a bit tricky to test in a running session, but we can verify the 
        # presence of external files and that the generator handles missing paths in its logic.
        from silent_movie_generator import load_fbx_safe
        
        # Test the safe loader with a non-existent path
        objs = load_fbx_safe("/tmp/non_existent_file.fbx")
        self.assertEqual(len(objs), 0, "Safe loader should return empty list for missing file")
        
        # Verify that major assets like brain.fbx exist where expected
        # (Assuming they are in the parent directory)
        parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        # Adjust sibling directory check
        expected_paths = [
            os.path.join(parent_dir, "..", "brain.fbx"),
            os.path.join(parent_dir, "..", "neuron.fbx")
        ]
        
        missing = []
        for p in expected_paths:
            if not os.path.exists(p):
                missing.append(p)
        
        if missing:
            self.log_result("Missing FBX Warning", "WARNING", f"Files not found: {missing}")

    def test_02_scale_extremes(self):
        """BOU-01: Verify mouth rig scales remain within safe bounds."""
        for char in ["Herbaceous", "Arbor"]:
            mouth = bpy.data.objects.get(f"{char}_Mouth")
            if mouth and mouth.animation_data and mouth.animation_data.action:
                curves = style.get_action_curves(mouth.animation_data.action)
                for fc in curves:
                    if fc.data_path == "scale":
                        for kp in fc.keyframe_points:
                            val = kp.co[1]
                            # R71 update: Ensure scale doesn't explode
                            self.assertLessEqual(val, 5.0, f"BOU-01 FAIL: {char} mouth scale {val} too extreme")
                            self.assertGreaterEqual(val, 0.05, f"BOU-01 FAIL: {char} mouth scale {val} too small")

    def test_03_secondary_motion_modifiers(self):
        """CIN-02: Verify Wave modifier on Gnome Cloak for secondary motion."""
        gnome = bpy.data.objects.get("GloomGnome_Torso")
        if not gnome: 
            self.skipTest("GloomGnome not in scene")
            
        # The cloak is usually a child or part of the gnome. 
        # v1.1.0 joined meshes, so we check modifiers on the main torso or children.
        targets = [gnome] + [c for c in gnome.children if c.type == 'MESH']
        
        has_wave = False
        for obj in targets:
            for mod in obj.modifiers:
                if mod.type == 'WAVE' and mod.show_render:
                    if mod.height > 0:
                        has_wave = True
                        break
            if has_wave: break
            
        status = "PASS" if has_wave else "FAIL"
        self.log_result("Secondary Motion: Wave", status, "Gnome cloak has active Wave modifier" if has_wave else "NO Wave modifier found")
        self.assertTrue(has_wave)

    def test_04_saccade_detection(self):
        """CIN-03: Detect eye saccades (micro-movements) in character close-ups."""
        found_saccades = False
        for char in ["Herbaceous", "Arbor"]:
            for side in ["L", "R"]:
                eye = bpy.data.objects.get(f"{char}_Eye_{side}")
                if eye and eye.animation_data and eye.animation_data.action:
                    curves = style.get_action_curves(eye.animation_data.action)
                    for fc in curves:
                        if "rotation" in fc.data_path:
                            # Saccades are high-frequency movement
                            # Verifying if there are many keyframes with small changes
                            if len(fc.keyframe_points) > 10:
                                found_saccades = True
                                break
                if found_saccades: break
            if found_saccades: break
            
        status = "PASS" if found_saccades else "WARNING"
        self.log_result("Saccade Detection", status, "Eye micro-movements detected" if found_saccades else "No saccades found")

    def test_05_mesh_consolidation(self):
        """OPT-02: Verify gnome mesh consolidation (joined parts)."""
        gnome = bpy.data.objects.get("GloomGnome_Torso")
        if gnome:
            # In older versions, there were many parts. In v1.1.0, they should be few.
            child_meshes = [c for c in gnome.children if c.type == 'MESH']
            is_consolidated = len(child_meshes) < 10
            status = "PASS" if is_consolidated else "FAIL"
            details = f"Child mesh count: {len(child_meshes)}"
            self.log_result("Mesh Consolidation", status, details)
            self.assertTrue(is_consolidated, "Gnome meshes should be consolidated to improve draw calls")

if __name__ == "__main__":
    argv = [sys.argv[0]]
    if "--" in sys.argv:
        argv.extend(sys.argv[sys.argv.index("--") + 1:])
    unittest.main(argv=argv)
