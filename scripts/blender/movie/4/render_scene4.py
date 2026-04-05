import sys
import os
import math
import bpy
import time

# Ensure movie modules are in path
MOVIE_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if MOVIE_ROOT not in sys.path:
    sys.path.append(MOVIE_ROOT)

# Ensure local Scene 4 directory is in path
SCENE4_DIR = os.path.dirname(os.path.abspath(__file__))
if SCENE4_DIR not in sys.path:
    sys.path.append(SCENE4_DIR)

import config
from generate_scene4 import generate_full_scene_v4, setup_scene4_cameras
from render_presets import apply_render_preset
from dialogue_scene_v4 import DialogueSceneV4

def get_frame_range():
    """Parses --frames START-END from sys.argv."""
    start, end = 1, config.TOTAL_FRAMES
    if "--frames" in sys.argv:
        try:
            idx = sys.argv.index("--frames")
            f_range = sys.argv[idx + 1]
            if "-" in f_range:
                parts = f_range.split("-")
                start, end = int(parts[0]), int(parts[1])
            else:
                start = end = int(f_range)
        except (ValueError, IndexError):
            print("WARNING: Could not parse --frames argument. Using defaults.")
    return start, end

def render_scene4():
    """Builds and renders Scene 4 with explicit camera switching and safety resets."""
    mode = os.getenv("RENDER_MODE", "review")
    print(f"\n--- SCENE 4 PRODUCTION RENDER [{mode.upper()}] ---")
    
    # 1. Initialize Scene (Environment, Assets, Lighting, 3-Camera Rig)
    generate_full_scene_v4()
    scene = bpy.context.scene
    
    # 2. Safety Calibration: Ensure no post-processing blocks the scene
    scene.render.use_compositing = False
    scene.render.use_sequencer = False
    scene.render.film_transparent = False
    
    # 3. Cameras
    cameras = {
        "WIDE":          bpy.data.objects.get("WIDE"),
        "OTS_STATIC_1":  bpy.data.objects.get("OTS_Static_1"),
        "OTS_STATIC_2":  bpy.data.objects.get("OTS_Static_2"),
        config.CHAR_HERBACEOUS: bpy.data.objects.get("OTS1"),
        config.CHAR_ARBOR:      bpy.data.objects.get("OTS2"),
    }

    # Pin static cameras to frames 1 and 2 explicitly
    scene.timeline_markers.clear()
    if cameras["OTS_STATIC_1"]:
        m1 = scene.timeline_markers.new("Static_OTS1", frame=1)
        m1.camera = cameras["OTS_STATIC_1"]
    if cameras["OTS_STATIC_2"]:
        m2 = scene.timeline_markers.new("Static_OTS2", frame=2)
        m2.camera = cameras["OTS_STATIC_2"]
    if cameras["WIDE"]:
        m3 = scene.timeline_markers.new("WIDE", frame=3)
        m3.camera = cameras["WIDE"]

    # Dialogue blocking
    dialogue_lines = [
        {"speaker_id": config.CHAR_HERBACEOUS, "start_frame": 24, "end_frame": 120},
        {"speaker_id": config.CHAR_ARBOR, "start_frame": 150, "end_frame": 280},
        {"speaker_id": config.CHAR_HERBACEOUS, "start_frame": 310, "end_frame": 450},
        {"speaker_id": config.CHAR_ARBOR, "start_frame": 480, "end_frame": 580},
    ]

    scene_logic = DialogueSceneV4({config.CHAR_HERBACEOUS: {}, config.CHAR_ARBOR: {}}, dialogue_lines)
    scene_logic.setup_scene(cameras)
    
    # 4. Render Setup
    apply_render_preset(mode)

    def enforce_render_safety():
        """
        Keep rig controls out of output even if keyed visibility toggles or
        viewport-style render paths are used.
        """
        hidden_armatures = []
        hidden_face_helpers = []

        for obj in bpy.data.objects:
            # Rig bones are carried by armature objects.
            if obj.type == "ARMATURE":
                obj.hide_render = True
                obj.hide_viewport = True
                obj.show_in_front = False
                arm_data = getattr(obj, "data", None)
                if arm_data is not None:
                    # Extra hardening for viewport/openGL style renders where
                    # bone overlays/custom shapes can still be drawn.
                    for attr, value in (
                        ("display_type", "WIRE"),
                        ("show_names", False),
                        ("show_axes", False),
                        ("show_bone_custom_shapes", False),
                    ):
                        if hasattr(arm_data, attr):
                            setattr(arm_data, attr, value)
                hidden_armatures.append(obj.name)
                continue

            # Facial control helpers are bone-parented guide meshes.
            if obj.parent_type == "BONE":
                bone_name = obj.parent_bone or ""
                obj_name = obj.name or ""
                if (".Ctrl" in bone_name
                        or "LidCorner" in obj_name
                        or "Ctrl" in obj_name
                        or "Flare" in obj_name):
                    obj.hide_render = True
                    obj.hide_viewport = True
                    hidden_face_helpers.append(obj.name)

        if hidden_armatures:
            print(f"RENDER SAFETY: Hidden armatures: {hidden_armatures}")
        if hidden_face_helpers:
            print(f"RENDER SAFETY: Hidden face helpers: {hidden_face_helpers}")

    # Initial safety pass before frame stepping.
    enforce_render_safety()

    output_dir = os.path.join(config.OUTPUT_BASE_DIR, "scene4", mode)
    os.makedirs(output_dir, exist_ok=True)
    
    # 5. Render Range Logic
    start_f, end_f = get_frame_range()
    scene.frame_start = start_f
    scene.frame_end = end_f
    
    print(f"RENDER: Sequence {start_f} to {end_f} starting now...")
    
    for f in range(start_f, end_f + 1):
        scene.frame_set(f)
        # Re-apply every frame in case keyframed visibility re-enables helpers.
        enforce_render_safety()
        
        # Camera Switching
        marker = next((m for m in sorted(scene.timeline_markers, key=lambda x: x.frame, reverse=True) if m.frame <= f), None)
        if marker and marker.camera:
            scene.camera = marker.camera
            
        start_time = time.time()
        frame_path = os.path.join(output_dir, f"frame_{f:04d}.png")
        scene.render.filepath = frame_path
        
        # Logging
        cam = scene.camera
        dg = bpy.context.evaluated_depsgraph_get()
        cam_pos = cam.evaluated_get(dg).matrix_world.translation
        print(f"RENDER: Frame {f:04d} | Camera: {cam.name} | Pos: ({cam_pos.x:.2f}, {cam_pos.y:.2f}, {cam_pos.z:.2f})", flush=True)

        # Execution
        bpy.ops.render.render(write_still=True)
        duration = time.time() - start_time
        print(f"RENDER: Frame {f:04d}/{end_f:04d} done | {duration:.2f}s", flush=True)

if __name__ == "__main__":
    render_scene4()
