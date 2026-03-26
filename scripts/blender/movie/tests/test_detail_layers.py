import unittest
import bpy
import sys
import os

# Add the directory of this script to the Python path
script_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if script_dir not in sys.path:
    sys.path.append(script_dir)

from detail_config import get_detail_profile, DetailProfile
from detail_layers import EnvironmentLayer, CharacterLayer, PropLayer, BiologyLayer, DiagnosticLayer
from silent_movie_generator import MovieMaster

class TestDetailLayers(unittest.TestCase):
    def setUp(self):
        self.master = MovieMaster(quality='test')
        # Mocking h1, h2, gnome for character layer
        self.master.h1 = bpy.data.objects.new("H1", None)
        self.master.h2 = bpy.data.objects.new("H2", None)
        self.master.gnome = bpy.data.objects.new("Gnome", None)
        bpy.context.collection.objects.link(self.master.h1)
        bpy.context.collection.objects.link(self.master.h2)
        bpy.context.collection.objects.link(self.master.gnome)

    def tearDown(self):
        # Clean up objects
        bpy.data.objects.remove(self.master.h1, do_unlink=True)
        bpy.data.objects.remove(self.master.h2, do_unlink=True)
        bpy.data.objects.remove(self.master.gnome, do_unlink=True)

    def test_detail_profile_schema(self):
        profile = get_detail_profile('scene02_garden')
        self.assertIsInstance(profile, DetailProfile)
        self.assertIn('environment', profile.layers)
        self.assertEqual(profile.layers['environment']['fog_density'], 0.01)

    def test_environment_layer_apply(self):
        profile = get_detail_profile('scene02_garden')
        layer = EnvironmentLayer()
        layer.init(self.master, 'scene02_garden', profile)
        layer.apply(401, 650)
        # Check if world has fog (Volume Scatter)
        world = bpy.context.scene.world
        vol = world.node_tree.nodes.get("Volume Scatter")
        self.assertIsNotNone(vol)
        self.assertAlmostEqual(vol.inputs['Density'].default_value, 0.01)

    def test_character_layer_apply(self):
        profile = get_detail_profile('scene15_interaction')
        layer = CharacterLayer()
        layer.init(self.master, 'scene15_interaction', profile)
        layer.apply(4501, 9500)
        # Check if H1 has animation data (breathing)
        self.assertIsNotNone(self.master.h1.animation_data)
        self.assertIsNotNone(self.master.h1.animation_data.action)

    def test_diagnostic_layer_apply(self):
        profile = get_detail_profile('scene02_garden')
        # Add frame_probes to config for test
        profile.layers['diagnostic'] = {'frame_probes': True}
        layer = DiagnosticLayer()
        layer.init(self.master, 'scene02_garden', profile)
        layer.apply(401, 650)
        # Check if probe marker exists
        markers = [m.name for m in bpy.context.scene.timeline_markers]
        self.assertIn("Probe_scene02_garden", markers)

if __name__ == '__main__':
    unittest.main()
