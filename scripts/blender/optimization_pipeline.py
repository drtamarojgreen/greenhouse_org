
import bpy
import os
import sys
import argparse
import time

# Ensure scripts directory is in path
script_dir = os.path.dirname(os.path.abspath(__file__))
if script_dir not in sys.path:
    sys.path.append(script_dir)

try:
    from optimize_mesh import MeshOptimizer
    from optimize_textures import TextureOptimizer
    from optimize_fonts import FontOptimizer
except ImportError:
    print("Error: Could not import specialized optimizers.")
    sys.exit(1)

def run_pipeline(source_dir, target_dir, config):
    """
    Main orchestrator logic to batch process files.
    """
    if not os.path.exists(target_dir):
        os.makedirs(target_dir)
        print(f"Created target directory: {target_dir}")

    # Find all .blend and .fbx files
    files = [f for f in os.listdir(source_dir) if f.lower().endswith(('.blend', '.fbx'))]
    
    print(f"Found {len(files)} files to optimize in {source_dir}")

    for filename in files:
        # Initialize optimizers for each file to ensure a clean state
        optimizers = [
            MeshOptimizer(config),
            TextureOptimizer(config),
            FontOptimizer(config)
        ]
        start_time = time.time()
        source_path = os.path.join(source_dir, filename)
        target_path = os.path.join(target_dir, filename)
        
        print(f"\n>>> Processing: {filename}")
        
        # 1. Load File
        bpy.ops.wm.read_factory_settings(use_empty=True)
        if filename.lower().endswith('.blend'):
            bpy.ops.wm.open_mainfile(filepath=source_path)
        elif filename.lower().endswith('.fbx'):
            bpy.ops.import_scene.fbx(filepath=source_path)

        # 2. Run Optimizers
        for obj in bpy.data.objects:
            for opt in optimizers:
                opt.process(bpy.context, obj)
        
        # 3. Post-Process
        for opt in optimizers:
            opt.post_process(bpy.context)

        # 4. Save/Export
        if filename.lower().endswith('.blend'):
            bpy.ops.wm.save_as_mainfile(filepath=target_path)
        elif filename.lower().endswith('.fbx'):
            bpy.ops.export_scene.fbx(filepath=target_path)

        duration = time.time() - start_time
        print(f"<<< Completed in {duration:.2f}s. Saved to: {target_path}")

def main():
    # Blender passes arguments after '--'
    try:
        args_idx = sys.argv.index("--") + 1
        args = sys.argv[args_idx:]
    except (ValueError, IndexError):
        args = []

    parser = argparse.ArgumentParser(description="Greenhouse Blender Optimization Pipeline")
    parser.add_argument("--source", default=os.path.join(script_dir, "source"), help="Source directory")
    parser.add_argument("--target", default=os.path.join(script_dir, "target"), help="Target directory")
    parser.add_argument("--decimate", type=float, default=0.5, help="Decimation ratio (0.0 to 1.0)")
    parser.add_argument("--res", type=int, default=1024, help="Max texture resolution")
    
    parsed_args = parser.parse_args(args)

    config = {
        'decimate_ratio': parsed_args.decimate,
        'max_texture_res': parsed_args.res,
        'triangulate': True,
        'pack_assets': False
    }

    run_pipeline(parsed_args.source, parsed_args.target, config)

if __name__ == "__main__":
    main()
