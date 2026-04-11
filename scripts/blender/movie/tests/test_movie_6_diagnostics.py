import bpy
import unittest
import os

class TestMovie6Diagnostics(unittest.TestCase):
    """Diagnostics for Movie 6 pipelines and Blender 5 features."""

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
        bg_keywords = ["bg", "background", "environment", "sky"]
        bg_found = False
        for obj in bpy.data.objects:
            if any(k in obj.name.lower() for k in bg_keywords):
                bg_found = True
                self.assertFalse(obj.hide_render, f"ERROR: Background object {obj.name} is hidden in render.")
                self.assertFalse(obj.hide_viewport, f"ERROR: Background object {obj.name} is hidden in viewport.")
        
        if not bg_found:
            print("WARNING: No objects containing 'background' keywords found.")

    def test_pipeline_6a_6b_readiness(self):
        """Verify pipeline stages for 6/a and 6/b."""
        print("\nChecking 6/a and 6/b Pipeline Stages...")
        
        collections = bpy.data.collections
        
        # Pipeline 6/a: Asset/Character focus
        has_6a = any("6a" in col.name.lower() or "asset" in col.name.lower() for col in collections)
        
        # Pipeline 6/b: Environment/Backdrop focus
        has_6b = any("6b" in col.name.lower() or "env" in col.name.lower() for col in collections)
        
        print(f"DEBUG: 6/a Stage Detected: {has_6a}")
        print(f"DEBUG: 6/b Stage Detected: {has_6b}")
        
        # If either is missing, it suggests the pipeline hasn't been merged into the master scene
        self.assertTrue(has_6a or has_6b, "ERROR: Neither 6/a nor 6/b pipeline markers found in collections.")

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
        has_animation = False
        if cam.animation_data and cam.animation_data.action:
            has_animation = True
        elif follow_path.target.animation_data:
            has_animation = True
            
        print(f"DEBUG: Camera Path: {follow_path.target.name if follow_path.target else 'None'}")
        self.assertTrue(has_animation, "ERROR: No animation data found for camera or its path.")

if __name__ == "__main__":
    print("\n" + "="*50)
    print("MOVIE 6 DIAGNOSTIC SUITE (Blender 5)")
    print("="*50)
    
    suite = unittest.TestLoader().loadTestsFromTestCase(TestMovie6Diagnostics)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    print("\nSUMMARY")
    print(f"Tests Run: {result.testsRun}")
    print(f"Errors: {len(result.errors)}")
    print(f"Failures: {len(result.failures)}")
    print("="*50)
    
    import sys
    sys.exit(0 if result.wasSuccessful() else 1)