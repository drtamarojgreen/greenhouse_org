"""
600-Frame Scene Generator for Scene 3
Builds a complete dialogue sequence with Herbaceous and Arbor.
"""

import bpy
import os
import sys

# Ensure the scene 3 module is in path
SCENE3_DIR = os.path.dirname(os.path.abspath(__file__))
if SCENE3_DIR not in sys.path:
    sys.path.append(SCENE3_DIR)

from dialogue_scene import build_scene3_dialogue
from renderer_dialogue import render_scene3_dialogue
from chroma_green_setup import setup_chroma_green_backdrop
import config

# Import asset creation utilities
MOVIE_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if MOVIE_ROOT not in sys.path:
    sys.path.append(MOVIE_ROOT)

from assets.plant_humanoid import create_plant_humanoid

def generate_full_scene():
    """
    Sets up a 600-frame dialogue sequence and prepares it for rendering.
    """
    print("Initializing 600-frame dialogue scene...")
    
    # 0. Cleanup
    if "Cube" in bpy.data.objects:
        bpy.data.objects.remove(bpy.data.objects["Cube"], do_unlink=True)
    
    # 1. Setup Environment
    setup_chroma_green_backdrop()
    
    # 2. Create Characters
    create_plant_humanoid(config.CHAR_HERBACEOUS, location=(-1.75, -0.3, 0))
    create_plant_humanoid(config.CHAR_ARBOR, location=(1.75, 0.3, 0))
    
    # 3. Set scene frame range
    bpy.context.scene.frame_start = 1
    bpy.context.scene.frame_end = 600
    bpy.context.scene.frame_current = 1
    
    # 2. Define extended dialogue (600 frames total)
    dialogue_lines = [
        {
            "speaker_id": config.CHAR_HERBACEOUS,
            "text": "The pulse of the forest is quickening, Arbor.",
            "start_frame": 24,
            "end_frame": 120,
            "intensity": 1.2
        },
        {
            "speaker_id": config.CHAR_ARBOR,
            "text": "I feel it too. The roots are deep, but the air is different today.",
            "start_frame": 140,
            "end_frame": 280,
            "intensity": 1.0
        },
        {
            "speaker_id": config.CHAR_HERBACEOUS,
            "text": "We must prepare for the Verdant Pulse. It is not just a season.",
            "start_frame": 300,
            "end_frame": 450,
            "intensity": 1.3
        },
        {
            "speaker_id": config.CHAR_ARBOR,
            "text": "It is our very existence. I am ready.",
            "start_frame": 470,
            "end_frame": 580,
            "intensity": 0.8
        }
    ]
    
    # 3. Build the scene
    scene_obj = build_scene3_dialogue(dialogue_lines=dialogue_lines)
    
    print(f"Scene 3 assembly complete. Total frames: {bpy.context.scene.frame_end}")
    print(f"Render output path: {config.OUTPUT_BASE_DIR}")
    
    return scene_obj

if __name__ == "__main__":
    generate_full_scene()
    # To render automatically, uncomment below:
    # render_scene3_dialogue(mode="preview")
