"""
Final Render Script for Scene 3
Builds the 600-frame dialogue sequence and renders it to 3/renders/.
"""

import bpy
import os
import sys
import time

# Ensure the scene 3 module is in path
SCENE3_DIR = os.path.dirname(os.path.abspath(__file__))
if SCENE3_DIR not in sys.path:
    sys.path.append(SCENE3_DIR)

from generate_scene3 import generate_full_scene
from renderer_dialogue import Scene3Renderer
import config

def main():
    # 1. Build the full 600-frame scene
    generate_full_scene()
    
    # 2. Trigger the render
    render_mode = os.getenv("RENDER_MODE", "review")
    print(f"\n--- Starting Render: Scene 3 [{render_mode.upper()}] ---")
    
    scene = bpy.context.scene
    start = scene.frame_start
    end = scene.frame_end
    
    renderer = Scene3Renderer()
    renderer._apply_preset(render_mode)
    
    base_path = getattr(config, f"OUTPUT_{render_mode.upper()}_DIR")
    if not os.path.exists(base_path):
        os.makedirs(base_path, exist_ok=True)

    print(f"Frames: {start} to {end}")
    print(f"Output Directory: {base_path}\n")

    total_start = time.time()
    for frame in range(start, end + 1):
        frame_start = time.time()
        scene.frame_set(frame)
        
        output_file = os.path.join(base_path, f"frame_{frame:04d}.png")
        scene.render.filepath = output_file
        
        # Capture stdout to minimize noise if needed, or just print professional log
        bpy.ops.render.render(write_still=True)
        
        duration = time.time() - frame_start
        print(f"RENDER: Frame {frame:04d}/{end:04d} complete | Duration: {duration:.2f}s | Path: {output_file}", flush=True)
    
    total_duration = time.time() - total_start
    print(f"\n--- Render Complete ---", flush=True)
    print(f"Total Duration: {total_duration/60:.2f} minutes", flush=True)
    print(f"Average time per frame: {total_duration/(end-start+1):.2f}s", flush=True)

if __name__ == "__main__":
    main()
