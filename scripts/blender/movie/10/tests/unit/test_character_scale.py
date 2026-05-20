try:
    import bpy
    import bmesh
    import mathutils
except ImportError:
    bpy = None
    bmesh = None
    mathutils = None

    from asset_manager import AssetManager
    from director import Director
    from render import build_scene
    from animation_handler import AnimationHandler
    from character_builder import CharacterBuilder
    import components
except ImportError:
    from ..asset_manager import AssetManager
    from ..director import Director
    from ..render import build_scene
    from ..animation_handler import AnimationHandler
    from ..character_builder import CharacterBuilder
    from .. import components
    import bpy
    import bmesh
    import mathutils
    bpy = None
    bmesh = None
    mathutils = None
        AssetManager = None
        Director = None
        build_scene = None
        AnimationHandler = None
        CharacterBuilder = None

import unittest

class TestMovie10CharacterScale(unittest.TestCase):
    def setUp(self):
        components.initialize_registry()
        self.manager = AssetManager(); self.manager.clear_scene()

    def test_procedural_scaling(self):
        """Verifies that the AssetManager correctly scales a character based on target_height."""
        cfg = mc.get("ensemble.entities", [])
        herb_cfg = next((c for c in cfg if c["id"] == "Herbaceous_HF"), {"id": "Herbaceous_HF", "target_height": 3.0}).copy()
        herb_cfg["type"] = "DYNAMIC"
        # Ensure components are set even if ID is not Herbaceous_HF
        herb_cfg.setdefault("components", {"modeling": "PlantModeler", "rigging": "PlantRigger", "shading": "UniversalShader", "animation": "ProceduralAnimator"})
        herb_cfg["target_height"] = 5.0
        char = CharacterBuilder.create("ScaledChar", herb_cfg)
        char.build(self.manager)

        metrics = self.manager._get_metrics(char.rig)
        self.assertAlmostEqual(metrics['height'], 5.0, places=1)

if __name__ == "__main__":
    unittest.main()