from render_manager import render_range
import os

def render_credits():
    print("Starting Credits Render...")
    # Point 142: Credits are 14501-15000 in SCENE_MAP
    # Must divide into chunks <= 200
    render_range(14501, 14700, "credits/part1")
    render_range(14701, 14900, "credits/part2")
    render_range(14901, 15000, "credits/part3")
    print("Credits Render sequence queued.")

if __name__ == "__main__":
    render_credits()
