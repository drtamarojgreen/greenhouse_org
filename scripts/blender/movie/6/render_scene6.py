import sys
import os
import bpy
import time

# Ensure movie root and v6 are in path
V6_DIR = os.path.dirname(os.path.abspath(__file__))
if V6_DIR not in sys.path: sys.path.append(V6_DIR)

import config
from dialogue_scene_v6 import DialogueSceneV6
from director_v6 import SylvanDirector

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
        except: pass
    return start, end

def enforce_render_safety():
    """Ensures technical helpers are hidden from the final render."""
    for obj in bpy.data.objects:
        if obj.type == "ARMATURE":
            obj.hide_render = True
        elif obj.parent_type == "BONE" and "Ctrl" in obj.name:
            obj.hide_render = True

def render_scene6():
    mode = os.getenv("RENDER_MODE", "review")
    print("\n" + "="*50)
    print(f"SCENE 6 PRODUCTION RENDER [{mode.upper()}]")
    print("="*50)
    
    # 1. Initialize Managers
    director = SylvanDirector()
    
    # 2. Define Production Sequence (Artistic Names)
    dialogue_lines = [
        # {"speaker_id": "Herbaceous", "start_frame": 1, "end_frame": 1000},
        {"speaker_id": "Majesty", "start_frame": 1, "end_frame": 1000},
    ]
    
    characters = {
        # "Herbaceous": {"rig_name": config.CHAR_HERBACEOUS + ".Rig"},
        "Majesty": {"rig_name": "Sylvan_Majesty.Rig"}
    }
    
    # 3. Assemble Scene
    scene_logic = DialogueSceneV6(characters, dialogue_lines)
    scene_logic.setup_scene()
    
    # 4. Final Direction
    director.position_protagonists()
    director.compose_ensemble()
    director.setup_cinematics()
    
    # 5. Render Loop
    start_f, end_f = get_frame_range()
    bpy.context.scene.frame_start = start_f
    bpy.context.scene.frame_end = end_f
    enforce_render_safety()
    
    output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "renders", mode)
    os.makedirs(output_dir, exist_ok=True)
    
    print(f"RENDER: Processing {start_f} to {end_f}...")
    for f in range(start_f, end_f + 1):
        bpy.context.scene.frame_set(f)
        bpy.context.scene.render.filepath = os.path.join(output_dir, f"frame_{f:04d}.png")
        bpy.ops.render.render(write_still=True)
        print(f"RENDER: Frame {f:04d} complete.")

if __name__ == "__main__":
    render_scene6()
