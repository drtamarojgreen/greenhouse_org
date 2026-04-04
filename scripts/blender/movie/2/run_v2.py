"""
The Verdant Pulse (Movie v2.0) - Entry Point
CLEAN SLATE: 100% Zero-Dependency from v1.
Usage: blender -b -P run_v2.py
"""
import sys
import os
import bpy

# Add current directory to path
script_dir = os.path.dirname(os.path.abspath(__file__))
if script_dir not in sys.path:
    sys.path.append(script_dir)

import constants
from master_v2 import VaultMaster
from scene_orchestrator_v2 import orchestrate_v2

def parse_args():
    import argparse
    import sys
    
    # Point 142: In Blender, arguments for the script must follow '--'
    script_args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    
    parser = argparse.ArgumentParser()
    parser.add_argument("--frame-start", type=int, default=1)
    parser.add_argument("--frame-end", type=int, default=constants.TOTAL_FRAMES)
    parser.add_argument("--render", action="store_true")
    parser.add_argument("--draft", action="store_true")
    
    args = parser.parse_args(script_args)
    return args

def run_production():
    args = parse_args()
    print(f"--- STARTING PRODUCTION V2.0: {args.frame_start} to {args.frame_end} (DRAFT={args.draft}) ---")
    
    # 1. Initialize Engine
    master = VaultMaster()
    master.initialize_system(draft=args.draft)
    master.setup_camera_rig()
    
    # 2. Set Frame Range for this chunk
    master.scene.frame_start = args.frame_start
    master.scene.frame_end = args.frame_end
    
    # 3. Orchestrate Scenes
    orchestrate_v2(master)
    
    # 4. Final Verification & Execute
    if args.render:
        print(f"Rendering frames {args.frame_start} to {args.frame_end}...")
        bpy.ops.render.render(animation=True)
    else:
        print("Initialization complete. Use --render to execute.")

if __name__ == "__main__":
    run_production()
