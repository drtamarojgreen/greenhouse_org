import bpy
import unittest
import os
import sys
import math
import mathutils
from bpy_extras.object_utils import world_to_camera_view

# Add the specific scene 6 directory to sys.path to avoid dots in package names
SCENE6_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if SCENE6_DIR not in sys.path:
    sys.path.append(SCENE6_DIR)

import config
import generate_scene6

class TestCameraAudit(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        """Build the full scene once before auditing."""
        print("\n--- INITIALIZING SCENE 6 PRODUCTION ENVIRONMENT ---")
        generate_scene6.generate_full_scene_v6()
        bpy.context.view_layer.update()

    def test_antagonist_camera_coverage(self):
        """Reports which antagonists have dedicated cameras tracking them."""
        print("\n--- ANTAGONIST CAMERA COVERAGE REPORT ---")
        antagonists = config.SPIRIT_ANTAGONISTS
        cams = [o for o in bpy.data.objects if o.type == 'CAMERA']
        
        coverage = {}
        for antag in antagonists:
            rig_name = f"{antag}.Rig"
            rig = bpy.data.objects.get(rig_name)
            if not rig:
                print(f"MISSING: Antagonist rig {rig_name} not found in scene.")
                continue
            
            tracking_cams = []
            for cam in cams:
                for const in cam.constraints:
                    if const.type == 'TRACK_TO' and const.target:
                        target_obj = const.target
                        is_target = (target_obj == rig) or (target_obj.parent == rig)
                        if is_target:
                            tracking_cams.append(cam.name)
            
            coverage[antag] = tracking_cams
            status = "COVERED BY: " + ", ".join(tracking_cams) if tracking_cams else "!!! UNCOVERED !!!"
            print(f"  {antag:20} -> {status}")
            
        self.assertTrue(len(coverage) > 0, "No antagonists found to audit.")

    def test_backdrop_screen_coverage(self):
        """
        Verifies that specific cameras have their assigned backdrops covering 100% of the screen.
        Uses 4-corner frustum projection.
        """
        print("\n--- BACKDROP SCREEN COVERAGE AUDIT ---")
        scene = bpy.context.scene
        
        # Mapping cameras to their intended backdrops (Sentence_case to lower_case)
        cam_to_backdrop = {
            "Wide":   "chroma_backdrop_wide",
            "Ots1":   "chroma_backdrop_ots1",
            "Ots2":   "chroma_backdrop_ots2",
            "Antag1": "chroma_backdrop_wide",
            "Antag2": "chroma_backdrop_wide",
            "Antag3": "chroma_backdrop_wide",
            "Antag4": "chroma_backdrop_wide"
        }

        render = scene.render
        aspect_ratio = render.resolution_x / render.resolution_y

        for cam_name, bd_name in cam_to_backdrop.items():
            cam_obj = bpy.data.objects.get(cam_name)
            bd_obj = bpy.data.objects.get(bd_name)
            
            if not cam_obj or not bd_obj:
                print(f"  {cam_name:8} -> ERROR: Camera or Backdrop {bd_name} missing.")
                continue

            # Corner points in NDC (Normalized Device Coordinates)
            corners = [(0,0), (1,0), (1,1), (0,1)]
            PLANE_BOUND = 100.0 
            all_corners_covered = True
            missing_corners = []
            
            # Check coverage at diagnostic frame
            diag_frames = []
            if cam_name == "Wide":
                diag_frames = [1, 12] # Check both start and far-diagnostic positions
            else:
                mapping = {"Ots1": 2, "Ots2": 3, "Antag1": 4, "Antag2": 5, "Antag3": 6, "Antag4": 7}
                diag_frames = [mapping.get(cam_name, 1)]

            for df in diag_frames:
                scene.frame_set(df)
                bpy.context.view_layer.update()

                for cx, cy in corners:
                    # Calculation of frustum corner at depth D
                    cam_pos = cam_obj.matrix_world.translation
                    bd_pos  = bd_obj.matrix_world.translation
                    distance = (bd_pos - cam_pos).length
                    
                    # FOV math
                    vfov = cam_obj.data.angle_y if hasattr(cam_obj.data, "angle_y") else 0.6
                    h = 2.0 * distance * math.tan(vfov / 2.0)
                    w = h * aspect_ratio
                    
                    # Frustum corners in camera local space
                    f_local = mathutils.Vector(((cx - 0.5) * w, (cy - 0.5) * h, -distance))
                    
                    # Convert to world then to backdrop local
                    f_world = cam_obj.matrix_world @ f_local
                    f_back_local = bd_obj.matrix_world.inverted() @ f_world
                    
                    # Check bounds
                    if abs(f_back_local.x) > PLANE_BOUND or abs(f_back_local.y) > PLANE_BOUND:
                        all_corners_covered = False
                        missing_corners.append(f"F{df}:({cx},{cy})")

            status = "PASS (100% Coverage)" if all_corners_covered else f"FAIL: Leakage at {', '.join(missing_corners)}"
            print(f"  {cam_name:8} -> {status}")

    def test_character_visibility_audit(self):
        """
        Verifies that every character in the ensemble is fully visible in the Diagnostic Wide Reveal (F12)
        and that each antagonist is correctly framed in their individual shot.
        """
        print("\n--- CHARACTER VISIBILITY & FRAMING REPORT ---")
        scene = bpy.context.scene
        
        # 1. Diagnostic Wide Check (Frame 12)
        wide_cam = bpy.data.objects.get("Wide")
        if wide_cam:
            print(f"  [Wide] Diagnostic Reveal (Frame 12):")
            scene.frame_set(12)
            bpy.context.view_layer.update()
            
            # Diagnostic Positional Report
            print(f"    - Camera Pos: {wide_cam.matrix_world.translation}")
            
            for src_name, art_name in config.SPIRIT_ENSEMBLE.items():
                rig = bpy.data.objects.get(f"{art_name}.Rig") or bpy.data.objects.get(art_name)
                if not rig: continue
                
                # Get all meshes parented to this rig
                meshes = [c for c in rig.children_recursive if c.type == 'MESH']
                if not meshes: continue
                
                visible, clipped_sides = self._check_object_visibility(wide_cam, meshes)
                status = "VISIBLE" if visible else f"CLIPPED ({', '.join(clipped_sides)})"
                if not visible:
                    # Report first clipped mesh location for debugging
                    mesh_pos = meshes[0].matrix_world.translation
                    status += f" at {mesh_pos.y:.1f}Y"
                print(f"    - {art_name:20}: {status}")

        # 2. Antagonist Shot Check
        antag_shots = {
            "Antag1": config.SPIRIT_ANTAGONISTS[0],
            "Antag2": config.SPIRIT_ANTAGONISTS[1],
            "Antag3": config.SPIRIT_ANTAGONISTS[2],
            "Antag4": config.SPIRIT_ANTAGONISTS[3]
        }
        
        print("\n  [ANTAG] Individual Portrait Check:")
        for cam_name, antag_name in antag_shots.items():
            cam = bpy.data.objects.get(cam_name)
            rig = bpy.data.objects.get(f"{antag_name}.Rig") or bpy.data.objects.get(antag_name)
            if not cam or not rig:
                print(f"    - {cam_name:8}: ERROR (Camera or {antag_name} missing)")
                continue
            
            # Use specific frame for each antagonist
            # shadow(4), emerald(5), verdant(6), root(7)
            idx = config.SPIRIT_ANTAGONISTS.index(antag_name)
            frame = 4 + idx
            scene.frame_set(frame)
            bpy.context.view_layer.update()
            
            meshes = [c for c in rig.children_recursive if c.type == 'MESH']
            visible, clipped_sides = self._check_object_visibility(cam, meshes)
            status = "VISIBLE" if visible else f"CLIPPED ({', '.join(clipped_sides)})"
            print(f"    - {cam_name:8} ({antag_name:16}): {status}")

    def _check_object_visibility(self, cam, meshes):
        """Helper to determine if a collection of meshes is fully in camera frustum."""
        visible = True
        clipped_sides = set()
        
        # Explicitly set the active camera to ensure context is correct for projection
        bpy.context.scene.camera = cam
        bpy.context.view_layer.update()
        
        for mesh in meshes:
            # 8 corners of bounding box
            corners = [mathutils.Vector(corner) for corner in mesh.bound_box]
            mw = mesh.matrix_world
            
            for v in corners:
                co_ndc = world_to_camera_view(bpy.context.scene, cam, mw @ v)
                
                # Check bounds (NDC is 0->1)
                # We allow 0.001 margin for numerical precision
                if co_ndc.x < -0.001: clipped_sides.add("Left")
                if co_ndc.x > 1.001:  clipped_sides.add("Right")
                if co_ndc.y < -0.001: clipped_sides.add("Bottom")
                if co_ndc.y > 1.001:  clipped_sides.add("Top")
                if co_ndc.z < 0:      clipped_sides.add("Behind")

        if clipped_sides:
            visible = False
            
        return visible, sorted(list(clipped_sides))


    def test_ascii_top_view_layout(self):
        """Prints an ASCII top-view map of the scene orchestration."""
        print("\n--- TOP-VIEW SCENE LAYOUT (ASCII) ---")
        print("  * = Camera (Number = stacked count), + = Protagonist, @ = Antagonist")
        print("  S = Spirit (Ally), U = Back Backdrop, [ = Left Backdrop, ] = Right Backdrop")
        
        # Hero-area zoom: focused on cameras and protagonists
        x_min, x_max = -25, 25
        y_min, y_max = -15, 35
        width, height = 70, 40
        
        grid = [[" " for _ in range(width)] for _ in range(height)]

        def world_to_grid(x, y):
            gx = int(((x - x_min) / (x_max - x_min)) * (width - 1))
            gy = int(((y - y_min) / (y_max - y_min)) * (height - 1))
            return gx, height - 1 - gy # Flip Y for top-down display

        # 1. Draw Axes
        zx, zy = world_to_grid(0,0)
        if 0 <= zx < width:
            for y in range(height): grid[y][zx] = "|"
        if 0 <= zy < height:
            for x in range(width): grid[zy][x] = "-"
        if 0 <= zx < width and 0 <= zy < height:
            grid[zy][zx] = "o" # 'o' for Origin center, leave '+' for Protagonists

        # 2. Add Entities
        # Protagonists
        for name in [config.CHAR_HERBACEOUS, config.CHAR_ARBOR]:
            # Try rig name, body name, or artistic name directly
            rig = bpy.data.objects.get(f"{name}_Rig") or bpy.data.objects.get(f"{name}.Rig") or bpy.data.objects.get(name) or bpy.data.objects.get(f"{name}_Body")
            if rig:
                gx, gy = world_to_grid(rig.location.x, rig.location.y)
                if 0 <= gx < width and 0 <= gy < height: grid[gy][gx] = "+"

        for antag in config.SPIRIT_ENSEMBLE.values():
            # Check for rig names
            name_rig = f"{antag}.Rig"
            rig = bpy.data.objects.get(name_rig) or bpy.data.objects.get(antag)
            if rig:
                gx, gy = world_to_grid(rig.location.x, rig.location.y)
                if 0 <= gx < width and 0 <= gy < height:
                    # Don't overwrite cameras
                    if grid[gy][gx] == " ":
                        grid[gy][gx] = "@" if antag in config.SPIRIT_ANTAGONISTS else "S" # S for other Spirits

        # 3. Add Backdrops
        backdrops = {
            "chroma_backdrop_wide": "U",
            "chroma_backdrop_ots1": "[",
            "chroma_backdrop_ots2": "]"
        }
        for b_name, b_sym in backdrops.items():
            b_obj = bpy.data.objects.get(b_name)
            if b_obj:
                gx, gy = world_to_grid(b_obj.location.x, b_obj.location.y)
                # Clamp to borders if out of range
                gx = max(0, min(width - 1, gx))
                gy = max(0, min(height - 1, gy))
                grid[gy][gx] = b_sym

        # Force scene evaluation to resolve constraints and animation paths
        bpy.context.view_layer.update()

        # Cameras
        for cam in [o for o in bpy.data.objects if o.type == 'CAMERA']:
            # Use world matrix to capture constrained/parented positions
            world_pos = cam.matrix_world.translation
            gx, gy = world_to_grid(world_pos.x, world_pos.y)
            if 0 <= gx < width and 0 <= gy < height:
                # If multiple cameras in one cell, use a number
                if grid[gy][gx] == "*": grid[gy][gx] = "2"
                elif grid[gy][gx].isdigit(): grid[gy][gx] = str(int(grid[gy][gx]) + 1)
                else: grid[gy][gx] = "*"

        # 3. Print
        print("+" + "-"*width + "+")
        for row in grid:
            print("|" + "".join(row) + "|")
        print("+" + "-"*width + "+")

if __name__ == "__main__":
    unittest.main(argv=['first-arg-is-ignored'], exit=False)
