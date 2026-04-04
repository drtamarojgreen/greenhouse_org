"""
Scene 3 Configuration
Contains constants for frame rate, resolution, chroma green, and output paths.
"""

import os

# Frame Rate and Resolution
FRAME_RATE = 24
RESOLUTION_X = 1920
RESOLUTION_Y = 1080

# Dialogue Defaults
DEFAULT_DIALOGUE_DURATION = 48  # frames
MIN_HOLD_FRAMES = 12

# Chroma Green Setup
CHROMA_GREEN_RGB = (0.0, 1.0, 0.0)  # Pure green for Blender
CHROMA_GREEN_HEX = "#00FF00"

# Output Directory Templates (Local to Scene 3)
OUTPUT_BASE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "renders")
OUTPUT_PREVIEW_DIR = os.path.join(OUTPUT_BASE_DIR, "preview")
OUTPUT_REVIEW_DIR = os.path.join(OUTPUT_BASE_DIR, "review")
OUTPUT_FINAL_DIR = os.path.join(OUTPUT_BASE_DIR, "final")

# Character Names (Real Assets)
CHAR_HERBACEOUS = "Herbaceous"
CHAR_ARBOR = "Arbor"

# Character Animation Cues
IDLE_CUE = "Idle"
TALKING_CUE = "Talking"

# Original Timing Offsets (from Scene 16)
S16_HERB_START_OFFSET = 24
S16_HERB_END_OFFSET = 280
S16_ARBOR_START_OFFSET = 350
S16_ARBOR_END_OFFSET = 600
