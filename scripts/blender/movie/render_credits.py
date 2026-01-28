from render_manager import render_range
import os

def render_credits():
    print("Starting Credits Render...")
    # Credits: 4501-5000 (500 frames)
    # Must divide into chunks <= 200
    render_range(4501, 4700, "credits/part1")
    render_range(4701, 4900, "credits/part2")
    render_range(4901, 5000, "credits/part3")
    print("Credits Render sequence queued.")

if __name__ == "__main__":
    render_credits()
