import subprocess
import os
import sys

def render_range(start, end, output_subdir, master_script_name="silent_movie_generator.py"):
    """
    Renders a specific frame range of the GreenhouseMD movie using a specified master script.
    Ensures that no single blender call renders more than 200 frames.
    """
    master_script = os.path.join(os.path.dirname(os.path.abspath(__file__)), master_script_name)
    render_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "renders", output_subdir)
    os.makedirs(render_dir, exist_ok=True)

    # Verify range
    if end - start + 1 > 200:
        print(f"Warning: Range {start}-{end} exceeds 200 frames. Sub-dividing...")
        for s in range(start, end + 1, 200):
            e = min(s + 199, end)
            render_range(s, e, f"{output_subdir}/sub_{s:04d}", master_script_name=master_script_name)
        return

    cmd = [
        "blender", "--background", "--python", master_script, "--",
        "--render-anim",
        "--start-frame", str(start),
        "--end-frame", str(end),
        "--render-output", os.path.join(render_dir, "render_")
    ]

    print(f"--- Rendering frames {start} to {end} ---")
    print(f"Command: {' '.join(cmd)}")
    try:
        subprocess.run(cmd, check=True)
        print(f"--- Finished frames {start} to {end} ---")
    except subprocess.CalledProcessError as e:
        print(f"Error rendering range {start}-{end}: {e}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python3 render_manager.py <start_frame> <end_frame> [output_subdir]")
        sys.exit(1)

    start = int(sys.argv[1])
    end = int(sys.argv[2])
    subdir = sys.argv[3] if len(sys.argv) > 3 else f"manual_{start}_{end}"
    render_range(start, end, subdir)
