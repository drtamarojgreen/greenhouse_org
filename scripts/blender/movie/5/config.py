import os

# Scene 5 Configuration
SCENE_NUMBER = 4
TOTAL_FRAMES = 4200

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_BASE_DIR = os.path.join(BASE_DIR, "renders")

# Character Rig Names
CHAR_HERBACEOUS = "Herbaceous_V5"
CHAR_ARBOR = "Arbor_V5"

# Environment
BACKDROP_NAME = "Scene5_Backdrop"
CAMERA_NAME = "Scene5_Camera"
CHROMA_GREEN_RGB = (0, 1, 0) # Pure Chroma Green
