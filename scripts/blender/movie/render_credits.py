from render_manager import render_range
import os

from constants import SCENE_MAP

def render_credits():
    print("Starting Credits Render...")
    # Point 142: Dynamically pull credits range from SCENE_MAP
    start, end = SCENE_MAP.get('scene12_credits', (14501, 15000))

    # Must divide into chunks <= 200
    current = start
    part = 1
    while current < end:
        chunk_end = min(current + 199, end)
        render_range(current, chunk_end, f"credits/part{part}")
        current = chunk_end + 1
        part += 1

    print("Credits Render sequence queued.")

if __name__ == "__main__":
    render_credits()
