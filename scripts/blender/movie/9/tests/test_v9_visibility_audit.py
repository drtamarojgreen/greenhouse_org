import unittest
import bpy
import os
import sys
import mathutils

# Ensure Movie 9 root is in sys.path
M9_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if M9_ROOT not in sys.path:
    sys.path.insert(0, M9_ROOT)
import movie_configuration as mc

from render import build_scene

class TestVisibilityAudit(unittest.TestCase):
    """
    High-fidelity audit suite for Movie 9 camera and entity visibility.
    Restores the ASCII layout chart and visibility matrix from Movie 4/5 standards.
    """

    @classmethod
    def setUpClass(cls):
        # Build the full production scene once for the audit
        bpy.ops.wm.read_factory_settings(use_empty=True)
        build_scene()

    def test_ascii_camera_layout(self):
        """Generates a top-down ASCII map of the cinematic stage."""
        width, height = 80, 40
        x_range = (-30, 30)
        y_range = (-20, 40)

        grid = [[" " for _ in range(width)] for _ in range(height)]

        def to_grid(world_pos):
            x, y = world_pos.x, world_pos.y
            gx = int(((x - x_range[0]) / (x_range[1] - x_range[0])) * (width - 1))
            gy = int(((y - y_range[0]) / (y_range[1] - y_range[0])) * (height - 1))
            return max(0, min(width-1, gx)), height - 1 - max(0, min(height-1, gy))

        # 1. Plot Origin and Axes
        ox, oy = to_grid(mathutils.Vector((0, 0, 0)))
        for x in range(width): grid[oy][x] = "-"
        for y in range(height): grid[y][ox] = "|"
        grid[oy][ox] = "O"

        # 2. Plot Entities
        entities = mc.get("ensemble.entities", [])
        for ent in entities:
            e_id = ent["id"]
            obj = bpy.data.objects.get(f"{e_id}.Rig") or bpy.data.objects.get(e_id)
            if obj:
                gx, gy = to_grid(obj.location)
                symbol = "+" if ent.get("is_protagonist") else ("@" if ent.get("is_antagonist") else "S")
                grid[gy][gx] = symbol

        # 3. Plot Cameras
        for cam in [o for o in bpy.data.objects if o.type == 'CAMERA']:
            gx, gy = to_grid(cam.matrix_world.translation)
            grid[gy][gx] = "*"

        # 4. Plot Backdrops
        for wall in ["wide", "ots1", "ots2"]:
            obj = bpy.data.objects.get(f"chroma_backdrop_{wall}")
            if obj:
                gx, gy = to_grid(obj.location)
                grid[gy][gx] = "B"

        print("\n--- CINEMATIC STAGE LAYOUT (ASCII) ---")
        print("Legend: * Camera, + Protagonist, @ Antagonist, S Spirit, B Backdrop")
        print("+" + "-" * width + "+")
        for row in grid:
            print("|" + "".join(row) + "|")
        print("+" + "-" * width + "+")

    def test_visibility_matrix(self):
        """Generates a matrix showing entity visibility per camera."""
        entities = [e["id"] for e in mc.get("ensemble.entities", [])]
        cameras = [o for o in bpy.data.objects if o.type == 'CAMERA']
        
        print("\n--- ENTITY VISIBILITY MATRIX ---")
        header = f"{'Camera':<12} | " + " | ".join([f"{e[:4]:<4}" for e in entities])
        print(header)
        print("-" * len(header))

        for cam in cameras:
            # Audit visibility from this camera's perspective
            line = f"{cam.name:<12} | "
            statuses = []
            for e_id in entities:
                obj = bpy.data.objects.get(f"{e_id}.Rig") or bpy.data.objects.get(e_id)
                # Check render visibility (hide_render)
                is_visible = obj and not obj.hide_render
                statuses.append("YES " if is_visible else "NO  ")
            print(line + " | ".join(statuses))

if __name__ == "__main__":
    unittest.main()
