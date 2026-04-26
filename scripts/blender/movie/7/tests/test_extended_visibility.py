import unittest
import bpy
import os
import sys

# Standard path injection
M7_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if M7_ROOT not in sys.path:
    sys.path.insert(0, M7_ROOT)

import config
from render import build_scene

class TestExtendedVisibility(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Build the full production scene
        bpy.ops.wm.read_factory_settings(use_empty=True)
        build_scene()

    def test_list_visible_characters_extended(self):
        """Lists characters visible in the extended frame range 4200-4800."""
        print("\n--- Visibility Audit (Frames 4200 - 4800) ---")
        
        entities = [e["id"] for e in config.config.get("ensemble.entities", [])]
        frames_to_check = [4200, 4400, 4600, 4800]
        
        for frame in frames_to_check:
            bpy.context.scene.frame_set(frame)
            visible_info = []
            active_cam = bpy.context.scene.camera.name if bpy.context.scene.camera else "NONE"
            
            for char_id in entities:
                rig = bpy.data.objects.get(f"{char_id}.Rig")
                body = bpy.data.objects.get(f"{char_id}.Body")
                
                is_visible = False
                loc = (0,0,0)
                if rig and not rig.hide_render:
                    is_visible = True; loc = rig.matrix_world.translation
                elif body and not body.hide_render:
                    is_visible = True; loc = body.matrix_world.translation
                
                if is_visible:
                    visible_info.append(f"{char_id}({loc.x:.1f},{loc.y:.1f},{loc.z:.1f})")
            
            print(f"Frame {frame} | Cam: {active_cam} | Visible: {', '.join(visible_info) if visible_info else 'NONE'}")
        
        print("--------------------------------------------")

if __name__ == "__main__":
    unittest.main(argv=[sys.argv[0]])
