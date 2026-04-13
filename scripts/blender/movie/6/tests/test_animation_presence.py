import unittest
import bpy
import os
import sys

# Standardize path injection for movie/6 assets
V6_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if V6_DIR not in sys.path: sys.path.insert(0, V6_DIR)

import config
import generate_scene6

class TestAnimationPresence(unittest.TestCase):

    def test_keyframes_assigned(self):
        """Verifies that characters have keyframes on their armatures."""
        # This will run the whole scene generation
        # (Assuming dependencies like assets are mockable or present)
        generate_scene6.generate_full_scene_v6()

        coll = bpy.data.collections.get(config.COLL_ASSETS)
        self.assertIsNotNone(coll)

        found_animated = 0
        print(f"DEBUG: Checking {len(coll.objects)} objects in {coll.name}")
        for obj in coll.objects:
            print(f"DEBUG: Found object {obj.name}, type {obj.type}")
            if obj.type == 'ARMATURE':
                # Force an update to ensure animations are pushed to actions if needed
                bpy.context.view_layer.update()

                if obj.animation_data:
                    if obj.animation_data.action:
                        print(f"DEBUG: Armature {obj.name} has action: {obj.animation_data.action.name}")
                        found_animated += 1
                    elif obj.animation_data.nla_tracks:
                        print(f"DEBUG: Armature {obj.name} has NLA tracks.")
                        found_animated += 1
                    else:
                        print(f"DEBUG: Armature {obj.name} has animation_data but no action/NLA.")
                elif obj.data.animation_data:
                    print(f"DEBUG: Armature {obj.name} DATA has animation_data.")
                    found_animated += 1
                else:
                    print(f"DEBUG: Armature {obj.name} has NO animation_data (Object or Data).")

        print(f"DEBUG: Global actions: {list(bpy.data.actions.keys())}")

        # If production assets are missing, we expect at least the 2 protagonists to be animated
        self.assertGreater(found_animated, 0, "No animated characters found")

if __name__ == "__main__":
    import sys
    if "--" in sys.argv:
        sys.argv = [sys.argv[0]] + sys.argv[sys.argv.index("--") + 1:]
    unittest.main()
