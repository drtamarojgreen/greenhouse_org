from render_manager import render_range
import os

import sys

def render_full_movie(sequel=False):
    script_name = "sequel_generator.py" if sequel else "silent_movie_generator.py"
    title = "Sequel" if sequel else "Full Movie"
    total_frames = 6000 if sequel else 5000
    chunk_size = 200

    print(f"Starting {title} Render ({total_frames} frames) using {script_name}...")

    for start in range(1, total_frames + 1, chunk_size):
        end = min(start + chunk_size - 1, total_frames)
        subdir = f"{'sequel' if sequel else 'full_movie'}/chunk_{start:04d}_{end:04d}"
        render_range(start, end, subdir, master_script_name=script_name)

    print(f"{title} Render sequence complete.")

if __name__ == "__main__":
    sequel_mode = "--sequel" in sys.argv
    render_full_movie(sequel=sequel_mode)
