import bpy
import os
import sys
import argparse

# Ensure Movie 7 root is in sys.path
M7_ROOT = os.path.dirname(os.path.abspath(__file__))
if M7_ROOT not in sys.path:
    sys.path.insert(0, M7_ROOT)

import config
from asset_manager import AssetManager
from character_builder import CharacterBuilder
import components
from director import Director

def validate_scene_integrity():
    """Hard gate before rendering: armature count must match character expectations."""
    entities = config.config.get("ensemble.entities", [])
    expected_rigs = 0
    for entity in entities:
        if entity.get("type") == "DYNAMIC":
            expected_rigs += 1 if entity.get("components", {}).get("rigging") else 0
        else:
            expected_rigs += 1 if entity.get("source_rig") else 0

    actual_rigs = len([o for o in bpy.data.objects if o.type == 'ARMATURE' and o.name.endswith(".Rig")])
    if actual_rigs != expected_rigs:
        raise RuntimeError(f"Integrity validation failed: expected {expected_rigs} armatures, found {actual_rigs}. Aborting render.")

def build_scene():
    components.initialize_registry()
    manager = AssetManager(); manager.clear_scene()

    print("Building Characters...")
    for entity in config.config.get("ensemble.entities", []):
        print(f"  Building {entity['id']}..."); char = CharacterBuilder.create(entity["id"], entity)
        char.build(manager); char.apply_pose()

    print("Setting up Scene Orchestration...")
    director = Director(); director.setup_environment(); director.setup_cinematics(); director.setup_calligraphy()
    
    print("Composing Cinematic Layout...")
    director.compose_ensemble(); director.position_protagonists()
    
    print("Applying Animations and Sequencer...")
    director.apply_scene_animations(); director.apply_storyline(); director.apply_sequencing()
    
    # Extended Scenes
    extended = config.config.get("extended_scenes", [])
    for scene_path in extended:
        print(f"  Integrating Extended Scene: {scene_path}...")
        director.apply_extended_scene(scene_path)
    
    # Apply lighting AFTER all markers are set by extended scenes
    print("Finalizing Global Lighting...")
    director.setup_lighting()
    
    validate_scene_integrity(); print("Scene generated successfully.")

def parse_args():
    parser = argparse.ArgumentParser(description="Render Movie 7")
    parser.add_argument("--frames", type=str, help="Frames to render, e.g. 1-2 or 10")
    try:
        idx = sys.argv.index("--"); script_args = sys.argv[idx+1:]
    except ValueError:
        script_args = []
    return parser.parse_args(script_args)

def main():
    args = parse_args()
    try:
        build_scene()
        
        bpy.context.scene.render.engine = 'BLENDER_EEVEE'
        bpy.context.scene.render.image_settings.file_format = 'PNG'
        bpy.context.scene.cycles.samples = 32
        
        out_dir = os.path.join(M7_ROOT, "renders")
        os.makedirs(out_dir, exist_ok=True)
        
        # Detect total frame range from markers
        markers = sorted(bpy.context.scene.timeline_markers, key=lambda m: m.frame)
        total_max = config.config.total_frames
        if markers: total_max = max(total_max, markers[-1].frame)
        
        start_f = 1; end_f = 1
        if args.frames:
            if "-" in args.frames:
                s, e = args.frames.split("-"); start_f, end_f = int(s), int(e)
            else:
                start_f = end_f = int(args.frames)
                
        print(f"Rendering frames {start_f} to {end_f} (Total Production Range: 1-{total_max})...")
        for f in range(start_f, end_f + 1):
            bpy.context.scene.frame_set(f)
            out_path = os.path.join(out_dir, f"frame_{f:04d}.png")
            bpy.context.scene.render.filepath = out_path
            
            relevant_markers = sorted([m for m in bpy.context.scene.timeline_markers if m.frame <= f], key=lambda m: m.frame)
            if relevant_markers and relevant_markers[-1].camera:
                bpy.context.scene.camera = relevant_markers[-1].camera
                
            print(f"  Rendering frame {f} with camera {bpy.context.scene.camera.name if bpy.context.scene.camera else 'None'}...")
            bpy.ops.render.render(write_still=True)
            
        print(f"Render complete. Outputs saved to {out_dir}")
    except Exception as e:
        print(f"FATAL ERROR during render: {e}")
        import traceback
        traceback.print_exc()
    finally:
        sys.stdout.flush()
        print("Exiting Blender gracefully...")
        # Using sys.exit would kill the process, but quit_blender is cleaner for Blender
        bpy.ops.wm.quit_blender()

if __name__ == "__main__":
    main()
