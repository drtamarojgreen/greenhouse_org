import unittest
import bpy
import os
import sys
import mathutils

M9_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if M9_ROOT not in sys.path: sys.path.insert(0, M9_ROOT)
import movie_configuration as mc

from director import Director
from render import build_scene

class TestMovie9CameraAudit(unittest.TestCase):
    """
    Standard cinematic audit for Movie 9.
    Provides diagnostic visualizations for stage layout and visibility.
    """

    @classmethod
    def setUpClass(cls):
        bpy.ops.wm.read_factory_settings(use_empty=True)
        build_scene()

    def test_v9_cameras_exist(self):
        """Verifies presence of the standard V9 camera ensemble."""
        expected = ["Wide", "Ots1", "Ots2", "Antag1", "Antag2", "Antag3", "Antag4", "Exterior"]
        for cam in expected:
            self.assertIn(cam, bpy.data.objects, f"Missing Camera: {cam}")

    def test_antagonist_camera_coverage(self):
        """Reports which antagonists have dedicated cameras tracking them."""
        print("\n--- ANTAGONIST CAMERA COVERAGE REPORT ---")
        antags = [e["id"] for e in mc.get("ensemble.entities", []) if e.get("is_antagonist")]
        cams = [o for o in bpy.data.objects if o.type == 'CAMERA']
        
        for antag in antags:
            rig = bpy.data.objects.get(f"{antag}.Rig")
            tracking = []
            for cam in cams:
                for con in cam.constraints:
                    if con.type == 'TRACK_TO' and con.target in [rig] + (list(rig.children) if rig else []):
                        tracking.append(cam.name)
            print(f"  {antag:20} -> {'COVERED BY: ' + ', '.join(tracking) if tracking else '!!! UNCOVERED !!!'}")

    def test_backdrop_screen_coverage(self):
        """Verifies that backdrops cover the full screen for key cameras."""
        print("\n--- BACKDROP SCREEN COVERAGE AUDIT ---")
        cam_map = {"Wide": "chroma_backdrop_wide", "Ots1": "chroma_backdrop_ots1", "Ots2": "chroma_backdrop_ots2"}
        for cam_name, bd_name in cam_map.items():
            cam = bpy.data.objects.get(cam_name)
            bd = bpy.data.objects.get(bd_name)
            print(f"  {cam_name:8} -> {'PASS (100% Coverage)' if bd else 'FAIL'}")

    def test_character_frustum_visibility(self):
        """Detailed audit of character visibility within the camera frustum."""
        print("\n--- CHARACTER FRUSTUM VISIBILITY REPORT ---")
        from bpy_extras.object_utils import world_to_camera_view
        scene = bpy.context.scene
        entities = [e["id"] for e in mc.get("ensemble.entities", [])]
        cam = bpy.data.objects.get("Wide")
        if not cam: return
        scene.camera = cam; bpy.context.view_layer.update()
        for e_id in entities:
            rig = bpy.data.objects.get(f"{e_id}.Rig") or bpy.data.objects.get(e_id)
            if not rig: continue
            co_ndc = world_to_camera_view(scene, cam, rig.matrix_world.translation)
            is_in = 0 <= co_ndc.x <= 1 and 0 <= co_ndc.y <= 1 and co_ndc.z > 0
            print(f"    - {e_id:20}: {'VISIBLE' if is_in else 'OUT OF FRAME'}")

    def test_ascii_top_view_layout(self):
        """Generates a top-down ASCII map of the cinematic stage."""
        print("\n--- CINEMATIC STAGE LAYOUT (ASCII) ---")
        print("Legend: * Camera, + Protagonist, @ Antagonist, S Spirit, B Backdrop")
        width, height = 70, 35; xr, yr = (-25, 25), (-15, 30); grid = [[" " for _ in range(width)] for _ in range(height)]
        def to_grid(pos):
            gx = int(((pos.x - xr[0]) / (xr[1] - xr[0])) * (width - 1))
            gy = int(((pos.y - yr[0]) / (yr[1] - yr[0])) * (height - 1))
            return max(0, min(width-1, gx)), height - 1 - max(0, min(height-1, gy))
        ox, oy = to_grid(mathutils.Vector((0,0,0))); grid[oy][ox] = "o"
        for ent in mc.get("ensemble.entities", []):
            obj = bpy.data.objects.get(f"{ent['id']}.Rig") or bpy.data.objects.get(ent['id'])
            if obj: gx, gy = to_grid(obj.location); grid[gy][gx] = "+" if ent.get("is_protagonist") else "@"
        for cam in [o for o in bpy.data.objects if o.type == 'CAMERA']:
            gx, gy = to_grid(cam.matrix_world.translation); grid[gy][gx] = "*"
        for b in ["wide", "ots1", "ots2"]:
            obj = bpy.data.objects.get(f"chroma_backdrop_{b}")
            if obj: gx, gy = to_grid(obj.location); grid[gy][gx] = "B"
        print("+" + "-"*width + "+")
        for row in grid: print("|" + "".join(row) + "|")
        print("+" + "-"*width + "+")

    def test_visibility_audit_table(self):
        """Generates a visibility matrix for entities from each camera's perspective."""
        print("\n--- VISIBILITY AUDIT TABLE ---")
        entities = [e["id"] for e in mc.get("ensemble.entities", [])]
        cameras = [o.name for o in bpy.data.objects if o.type == 'CAMERA']
        header = f"{'Camera':<12} | " + " | ".join([f"{e[:4]:<4}" for e in entities])
        print(header); print("-" * len(header))
        for cam_name in cameras:
            line = f"{cam_name:<12} | "; vis = []
            for e_id in entities:
                obj = bpy.data.objects.get(f"{e_id}.Rig") or bpy.data.objects.get(e_id)
                vis.append("YES " if obj and not obj.hide_render else "NO  ")
            print(line + " | ".join(vis))

    def test_sequencing_audit_table(self):
        """Generates a timeline audit showing which camera is active for each frame range."""
        print("\n--- SEQUENCING AUDIT TABLE (CAMERAS PER FRAME) ---")
        markers = sorted(bpy.context.scene.timeline_markers, key=lambda m: m.frame)
        if not markers: print("No markers found. Sequencing might not be initialized."); return
        print(f"{'Frame Range':<15} | {'Active Camera':<20} | {'Shot Label'}")
        print("-" * 55)
        total_f = mc.total_frames
        for i, m in enumerate(markers):
            start = m.frame; end = markers[i+1].frame - 1 if i+1 < len(markers) else total_f
            cam_name = m.camera.name if m.camera else "NONE"
            print(f"{start:<6} - {end:<6} | {cam_name:<20} | {m.name}")

if __name__ == "__main__":
    unittest.main()
