import sys
import os
import bpy
import time

# --- Path Injection (ensures movie/6 and assets_v6 are prioritized) ---
V6_DIR = os.path.dirname(os.path.abspath(__file__))
if V6_DIR not in sys.path: sys.path.insert(0, V6_DIR)

ASSETS_V6_DIR = os.path.join(V6_DIR, "assets_v6")
if ASSETS_V6_DIR not in sys.path: sys.path.insert(0, ASSETS_V6_DIR)

from generate_scene6 import generate_full_scene_v6

def get_frame_range():
    """Parses --frames START-END from sys.argv."""
    start, end = 1, 4200
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

def render_scene6():
    mode = os.getenv("RENDER_MODE", "review")
    print("\n" + "="*50)
    print(f"SCENE 6 PRODUCTION RENDER [{mode.upper()}]")
    print("="*50)
    
    # 1. Assemble Scene using standardized logic
    generate_full_scene_v6()
    
    # 2. Render Loop
    start_f, end_f = get_frame_range()
    bpy.context.scene.frame_start = start_f
    bpy.context.scene.frame_end = end_f
    
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
