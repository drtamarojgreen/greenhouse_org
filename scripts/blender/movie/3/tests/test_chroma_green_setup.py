import unittest
try:
    import bpy
except ImportError:
    bpy = None

try:
    from scripts.blender.movie._3.chroma_green_setup import setup_chroma_green_backdrop, config
except ImportError:
    try:
        from chroma_green_setup import setup_chroma_green_backdrop, config
    except ImportError:
        setup_chroma_green_backdrop = None
        config = None

class TestChromaGreenSetup(unittest.TestCase):
    @unittest.skipIf(bpy is None or setup_chroma_green_backdrop is None, "Blender or module not available")
    def test_backdrop_creation(self):
        backdrop = setup_chroma_green_backdrop()
        self.assertIsNotNone(backdrop)
        self.assertEqual(backdrop.name, "Chroma_Green_Backdrop")

    @unittest.skipIf(bpy is None or setup_chroma_green_backdrop is None, "Blender or module not available")
    def test_backdrop_color(self):
        backdrop = bpy.data.objects.get("Chroma_Green_Backdrop")
        if not backdrop: return
        mat = backdrop.data.materials[0]
        nodes = mat.node_tree.nodes
        emission_node = next(n for n in nodes if n.type == 'EMISSION')
        color = emission_node.inputs['Color'].default_value[:3]
        self.assertEqual(tuple(color), config.CHROMA_GREEN_RGB)

if __name__ == "__main__":
    unittest.main()
