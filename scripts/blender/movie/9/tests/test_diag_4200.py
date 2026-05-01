import unittest
import bpy
import os
import sys
import mathutils

# Standard path injection
M9_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if M9_ROOT not in sys.path:
    sys.path.insert(0, M9_ROOT)

import config
from render import build_scene

class TestDiagnostic4200(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Build the full production scene
        bpy.ops.wm.read_factory_settings(use_empty=True)
        build_scene()

    def test_diagnostic_frame_4200(self):
        """Deep diagnostic of frame 4200."""
        print("\n--- Diagnostic Audit: Frame 4200 ---")
        bpy.context.scene.frame_set(4200)

        # 1. Camera Audit
        active_cam = bpy.context.scene.camera
        relevant_markers = sorted([m for m in bpy.context.scene.timeline_markers if m.frame <= 4200], key=lambda m: m.frame)
        if relevant_markers and relevant_markers[-1].camera:
            active_cam = relevant_markers[-1].camera

        if active_cam:
            loc = active_cam.matrix_world.translation
            rot = active_cam.matrix_world.to_euler()
            print(f"Active Camera: {active_cam.name}")
            print(f"  World Location: ({loc.x:.2f}, {loc.y:.2f}, {loc.z:.2f})")
            print(f"  World Rotation (Euler): ({rot.x:.2f}, {rot.y:.2f}, {rot.z:.2f})")
            print(f"  Lens: {active_cam.data.lens}mm")

            # Check for obstructions
            print("  Constraints:")
            for con in active_cam.constraints:
                print(f"    - {con.type} (Target: {con.target.name if con.target else 'None'}, Influence: {con.influence})")
        else:
            print("Active Camera: NONE")

        # 2. Character Audit
        entities = [e["id"] for e in config.config.get("ensemble.entities", [])]
        for char_id in entities:
            rig = bpy.data.objects.get(f"{char_id}.Rig")
            if rig:
                loc = rig.matrix_world.translation
                hidden = rig.hide_render
                # Check for meshes
                meshes = [c for c in rig.children_recursive if c.type == 'MESH']
                mesh_info = ", ".join([f"{m.name}(hidden={m.hide_render})" for m in meshes])
                print(f"Character {char_id}: Loc=({loc.x:.1f}, {loc.y:.1f}, {loc.z:.1f}), Hidden={hidden}, Meshes=[{mesh_info}]")

        # 3. Environment Audit
        print("Environment Check:")
        for obj_name in ["interior_floor", "exterior_floor", "greenhouse_roof"]:
            obj = bpy.data.objects.get(obj_name)
            if obj:
                print(f"  {obj_name}: Loc=({obj.location.x:.1f}, {obj.location.y:.1f}, {obj.location.z:.1f}), Hidden={obj.hide_render}")

        print("-----------------------------------")

if __name__ == "__main__":
    unittest.main(argv=[sys.argv[0]])
