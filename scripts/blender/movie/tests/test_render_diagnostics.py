import bpy
import unittest
import os
import sys

# Add movie root to path for imports from parent directory
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from tests.base_test import BlenderTestCase

import style_utilities as style

class TestRenderDiagnostics(BlenderTestCase):

    def test_01_engine_settings(self):
        """Verify the render engine is set correctly."""
        scene = bpy.context.scene
        engine = scene.render.engine
        self.log_result("Engine", "PASS" if engine == 'BLENDER_EEVEE' else "FAIL", f"Engine is {engine}")
        self.assertEqual(engine, 'BLENDER_EEVEE')

    def test_02_color_management(self):
        """Check color management settings."""
        scene = bpy.context.scene
        vs = scene.view_settings
        self.log_result("View Transform", "PASS", vs.view_transform)
        self.assertIn(vs.view_transform, ['Standard', 'Filmic'])
        self.log_result("Look", "PASS", vs.look)
        self.log_result("Exposure", "PASS", str(vs.exposure))
        self.log_result("Gamma", "PASS", str(vs.gamma))

    def test_03_film_settings(self):
        """Check film and transparency settings."""
        scene = bpy.context.scene
        is_transparent = scene.render.film_transparent
        self.log_result("Film Transparent", "PASS" if is_transparent else "FAIL", str(is_transparent))
        self.assertTrue(is_transparent)

    def test_04_world_settings(self):
        """Inspect the world and background settings."""
        world = bpy.context.scene.world
        self.assertIsNotNone(world, "Scene world is not set")
        self.log_result("World", "PASS", world.name)
        
        if world.use_nodes:
            background_node = next((n for n in world.node_tree.nodes if n.type == 'BACKGROUND'), None)
            self.assertIsNotNone(background_node, "Background node not found in world")
            strength_input = background_node.inputs.get("Strength")
            self.assertIsNotNone(strength_input, "Background node has no Strength input")
            strength = strength_input.default_value
            self.log_result("Background Strength", "PASS", str(strength))
            self.assertGreaterEqual(strength, 0)

    def test_05_camera_setup(self):
        """Validate the main camera settings."""
        cam_obj = bpy.context.scene.camera
        self.assertIsNotNone(cam_obj, "No active camera in scene")
        self.log_result("Active Camera", "PASS", cam_obj.name)
        
        cam_data = cam_obj.data
        self.assertGreater(cam_data.clip_end, cam_data.clip_start)
        self.log_result("Camera Clipping", "PASS", f"{cam_data.clip_start} to {cam_data.clip_end}")

    def test_06_object_visibility(self):
        """Check for potentially problematic render visibility settings."""
        # This is a diagnostic, not a strict test, so we log warnings.
        for obj in bpy.context.scene.objects:
            if obj.hide_render:
                self.log_result(f"Visibility: {obj.name}", "WARNING", "Object is hidden from render")

    def test_07_lights_exist(self):
        """Ensure there are lights in the scene."""
        lights = [o for o in bpy.context.scene.objects if o.type == 'LIGHT']
        self.assertGreater(len(lights), 0, "No lights found in the scene")
        self.log_result("Light Count", "PASS", str(len(lights)))
        for light in lights:
            if light.data.energy == 0:
                self.log_result(f"Light Energy: {light.name}", "WARNING", "Light has zero energy")

    def test_08_compositor_setup(self):
        """Check if the compositor is being used."""
        scene = bpy.context.scene
        use_nodes = scene.use_nodes
        self.log_result("Compositor Used", "PASS" if use_nodes else "INFO", str(use_nodes))
        if use_nodes:
            tree = style.get_compositor_node_tree(scene)
            self.assertIsNotNone(tree, "Compositor node tree could not be accessed or created")

    def test_09_eevee_specific_properties(self):
        """Introspect and display Eevee-specific settings."""
        scene = bpy.context.scene
        engine_settings = None
        if hasattr(scene, "eevee"):
            engine_settings = scene.eevee
        
        self.assertIsNotNone(engine_settings, "No Eevee settings block found on scene")
        self.log_result("Eevee Settings", "PASS", "Found settings block")
        
        # Log some key Eevee properties
        if engine_settings:
            props_to_check = ['use_bloom', 'use_ssr', 'use_volumetric_shadows', 'volumetric_start']
            for prop in props_to_check:
                if hasattr(engine_settings, prop):
                    value = getattr(engine_settings, prop)
                    self.log_result(f"Eevee: {prop}", "INFO", str(value))
                else:
                    self.log_result(f"Eevee: {prop}", "WARNING", "Property not found")

if __name__ == '__main__':
    unittest.main(argv=sys.argv[sys.argv.index("--") + 1:])
