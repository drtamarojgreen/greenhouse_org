import os
import sys
import subprocess
from constants import SCENE_MAP

def render_scene_batch(master, scene_names, output_dir="renders"):
    """Enhancement #90: Renders a batch of scenes specifically."""
    import bpy # Isolated import
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    master.load_assets()
    master.setup_lighting()
    master._setup_camera()
    master.setup_compositor()
    master._animate_characters()
    master._animate_props()
    master.animate_master()

    for name in scene_names:
        if name in SCENE_MAP:
            start, end = SCENE_MAP[name]
            # Point 86: Added chunking logic for parallel render support
            chunk_size = 500
            for frame_start in range(start, end + 1, chunk_size):
                frame_end = min(frame_start + chunk_size - 1, end)
                print(f"Queueing chunk for scene: {name} (Frames {frame_start}-{frame_end})")

                master.scene.frame_start = frame_start
                master.scene.frame_end = frame_end
                master.scene.render.filepath = os.path.join(output_dir, f"{name}_{frame_start}_")
                bpy.ops.render.render(animation=True)

def render_range(start, end, output_subdir, master_script_name="silent_movie_generator.py", device_type='HIP'):
    """Orchestrates a Blender render for a specific frame range as a subprocess."""
    # Ensure output directory exists relative to repo root
    output_path = os.path.join("renders", output_subdir)
    os.makedirs(output_path, exist_ok=True)
    
    # Base command for background blender execution
    # Point 94: Pass --frame-start and --frame-end to targeted generator
    cmd = [
        "blender",
        "--background",
        "--python", f"scripts/blender/movie/{master_script_name}",
        "--",
        "--frame-start", str(start),
        "--frame-end", str(end),
        "--output-dir", output_path,
        "--device-type", device_type,
        "--render-anim"
    ]
    
    print(f"Executing Chunk: {start}-{end} -> {output_path}")
    result = subprocess.run(cmd, capture_output=False, text=True)
    
    if result.returncode == 0:
        # Phase 3: Automated QC Scan
        qc_bin = os.path.join(os.path.dirname(__file__), "c", "qc_scanner")
        if os.path.exists(qc_bin):
            print(f"QC: Scanning frames in {output_path}...")
            qc_res = subprocess.run([qc_bin, output_path, str(start), str(end)], capture_output=True, text=True)
            if qc_res.returncode != 0:
                print(f"QC WARNING: Potential corruption or missing frames in {output_path}")
                print(qc_res.stdout)
            else:
                print(f"QC PASSED: {output_path}")
        return True
    else:
        print(f"Error: Chunk {start}-{end} failed with return code {result.returncode}")
        return False

def main():
    # This can be called from command line:
    # blender -b movie.blend -P render_manager.py -- --scenes scene01_intro,scene02_garden
    argv = sys.argv
    args = argv[argv.index("--") + 1:] if "--" in argv else []

    scene_list = []
    if '--scenes' in args:
        scene_list = args[args.index('--scenes') + 1].split(',')

    # We'd need to instantiate MovieMaster here if called directly
    # but usually this is called from within silent_movie_generator context

if __name__ == "__main__":
    main()
