from render_manager import render_range
import os

def render_full_movie():
    print("Starting Full Movie Render (5000 frames)...")
    total_frames = 5000
    chunk_size = 200

    for start in range(1, total_frames + 1, chunk_size):
        end = min(start + chunk_size - 1, total_frames)
        subdir = f"full_movie/chunk_{start:04d}_{end:04d}"
        render_range(start, end, subdir)

    print("Full Movie Render sequence complete.")

if __name__ == "__main__":
    render_full_movie()
