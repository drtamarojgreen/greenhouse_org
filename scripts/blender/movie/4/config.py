import os

# Scene 4 Configuration
SCENE_NUMBER = 4
TOTAL_FRAMES = 600

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_BASE_DIR = os.path.join(BASE_DIR, "renders")

# Character Rig Names
CHAR_HERBACEOUS = "Herbaceous_V4"
CHAR_ARBOR = "Arbor_V4"

# Environment
BACKDROP_NAME = "Scene4_Backdrop"
CAMERA_NAME = "Scene4_Camera"
CHROMA_GREEN_RGB = (0, 1, 0) # Pure Chroma Green
