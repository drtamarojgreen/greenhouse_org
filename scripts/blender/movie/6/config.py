import os
import math

# Scene 6 Production Configuration
TOTAL_FRAMES = 4200
EQUIPMENT_DIR = "/home/tamarojgreen/Documents/Movie_Equipment/"
SPIRITS_ASSET_BLEND = os.path.join(EQUIPMENT_DIR, "MHD2_animation133.blend")

# 1. ENSEMBLE DEFINITIONS (Artistic Naming)
SPIRIT_ENSEMBLE = {
    "Mesh1_Mesh1.044": "Sylvan_Majesty",
    "Mesh1_Mesh1.001": "Radiant_Aura",
    "Mesh1_Mesh1.006": "Verdant_Sprite",
    "Mesh1_Mesh1.052": "Shadow_Weaver",
    "Mesh1_Mesh1.058": "Emerald_Sentinel",
    "Leonardo_Phoenix textured 3D model": "Phoenix_Herald",
    "Leonardo_Phoenix textured 3D model.001": "Golden_Phoenix",
    "skeleton": "Root_Guardian"
}

# Source armature names for each artistic character (Root_Guardian uses skeleton rig = same obj)
RIG_MAP_SRC = {
    "Sylvan_Majesty":   "Armature.002",
    "Radiant_Aura":     "Armature.004",
    "Verdant_Sprite":   "Armature.001",
    "Shadow_Weaver":    "Armature.003",
    "Emerald_Sentinel": "Armature",
    "Phoenix_Herald":   "skeleton",
    "Golden_Phoenix":   "skeleton.001",
}

# 2. PROTAGONISTS
CHAR_HERBACEOUS = "Herbaceous_V5"
CHAR_ARBOR      = "Arbor_V5"

# 3. PROTAGONIST ASSET MAPPING
PROTAGONIST_SOURCE = {
    CHAR_HERBACEOUS: {"mesh": "Herbaceous_V5_Body", "rig": "Herbaceous_V5_Rig"},
    CHAR_ARBOR:      {"mesh": "Arbor_V5_Body",      "rig": "Arbor_V5_Rig"},
}

# 4. TARGET HEIGHTS (Production Standard)
CHAR_HERBACEOUS_HEIGHT = 2.4
CHAR_ARBOR_HEIGHT      = 2.6
MAJESTIC_HEIGHT        = 6.0
SPRITE_HEIGHT          = 5.5
PHOENIX_HEIGHT         = 5.5
SENTINEL_HEIGHT        = 6.5
AURA_HEIGHT            = 5.8
WEAVER_HEIGHT          = 6.2
GUARDIAN_HEIGHT        = 8.0

TARGET_HEIGHTS = {
    "Herbaceous_V5":    CHAR_HERBACEOUS_HEIGHT,
    "Arbor_V5":         CHAR_ARBOR_HEIGHT,
    "Sylvan_Majesty":   MAJESTIC_HEIGHT,
    "Radiant_Aura":     AURA_HEIGHT,
    "Verdant_Sprite":   SPRITE_HEIGHT,
    "Shadow_Weaver":    WEAVER_HEIGHT,
    "Emerald_Sentinel": SENTINEL_HEIGHT,
    "Phoenix_Herald":   PHOENIX_HEIGHT,
    "Golden_Phoenix":   PHOENIX_HEIGHT,
    "Root_Guardian":    GUARDIAN_HEIGHT
}

# 5. SPATIAL CONSTANTS
CHAR_HERBACEOUS_POS = (-1.75, -0.3, 0.0)
CHAR_ARBOR_POS      = ( 1.75,  0.3, 0.0)

HERB_EYE_LEVEL   = (-1.75, -0.3, 2.5)
ARBOR_EYE_LEVEL  = ( 1.75,  0.3, 2.5)

# 6. CAMERA CONFIG
CAMERA_WIDE_LOC = (0.0, -8.0, 2.0)
CAMERA_OTS1_LOC = (13.5, 11.0, 6.0)
CAMERA_OTS2_LOC = (-13.5, -11.0, 6.0)

# 7. BACKDROP CONFIG
BACKDROP_WIDE_LOC = (0, 50, 5)
BACKDROP_OTS1_LOC = (-50, -20, 5)
BACKDROP_OTS2_LOC = (50, 20, 5)
BACKDROP_SIZE_WIDE = 200
BACKDROP_SIZE_OTS  = 1000

# 8. PLANT HUMANOID DIMENSIONS
TORSO_H_BASE = 1.5
HEAD_R_BASE  = 0.4
NECK_H_BASE  = 0.2

# Facial Bone Projection
EYE_PROJ_X = 0.35
EYE_PROJ_Z = 0.35
ELD_U_Z = 0.40
ELD_L_Z = 0.30
NOSE_Z  = 0.05
LIP_U_Z = -0.18
LIP_L_Z = -0.24

# 9. LIGHTING CONFIG
ENERGY_RIM = 12000.0
ENERGY_HEAD_KEY = 10000.0
ENERGY_LEG_KEY = 5000.0

SPOT_SIZE_RIM = math.radians(40)
SPOT_SIZE_HEAD_KEY = math.radians(45)
SPOT_SIZE_LEG_KEY = math.radians(50)

# 10. RENDER CONFIG
RENDER_OUTPUT_PATH = "/tmp/scene6_render"
DEFAULT_FRAME_START = 1
DEFAULT_FRAME_END = 250

# 11. TEXTURE STACK
TEX_LEAFY = "Leafy_Tree_Spirit_1207153453_texture.png"
TEX_JOY   = "Tree_Spirit_of_Joy_1207153014_texture.png"

# 12. CINEMATICS & ENVIRONMENT
CAMERA_NAME  = "WIDE"
CHROMA_GREEN_RGB = (0, 1, 0)
