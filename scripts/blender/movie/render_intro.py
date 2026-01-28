from render_manager import render_range
import os

def render_intro():
    print("Starting Intro Render (Branding + Opening)...")
    # Branding: 1-200
    render_range(1, 200, "intro/branding")
    # Intro: 201-400
    render_range(201, 400, "intro/opening")
    print("Intro Render sequence queued.")

if __name__ == "__main__":
    render_intro()
