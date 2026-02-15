from render_manager import render_range
import os

def render_credits():
    print("Starting Credits Render...")
    # Credits: 9501-10000 (500 frames)
    # Must divide into chunks <= 200
    render_range(9501, 9700, "credits/part1")
    render_range(9701, 9900, "credits/part2")
    render_range(9901, 10000, "credits/part3")
    print("Credits Render sequence queued.")

if __name__ == "__main__":
    render_credits()
