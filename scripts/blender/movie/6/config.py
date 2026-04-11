import os

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

# Source armature names for each artistic character
RIG_MAP_SRC = {
    "Sylvan_Majesty":   "Armature.002",
    "Radiant_Aura":     "Armature.004",
    "Verdant_Sprite":   "Armature.001",
    "Shadow_Weaver":    "Armature.003",
    "Emerald_Sentinel": "Armature",
    "Phoenix_Herald":   "skeleton",
    "Golden_Phoenix":   "skeleton.001",
    "Root_Guardian":    "skeleton",
}

# 2. PROTAGONISTS
CHAR_HERBACEOUS = "Herbaceous_V5"
CHAR_ARBOR      = "Arbor_V5"

# 3. PROTAGONIST ASSET MAPPING
PROTAGONIST_SOURCE = {
    CHAR_HERBACEOUS: {"mesh": "Herbaceous_V5_Body", "rig": "Herbaceous_V5_Rig"},
    CHAR_ARBOR:      {"mesh": "Arbor_V5_Body",      "rig": "Arbor_V5_Rig"},
}

# 4. SPATIAL CONSTANTS
CHAR_HERBACEOUS_POS = (-1.75, -0.3, 0.0)
CHAR_ARBOR_POS      = ( 1.75,  0.3, 0.0)

HERB_EYE_LEVEL  = (-1.75, -0.3, 2.5)
ARBOR_EYE_LEVEL = (1.75, 0.3, 2.5)

# 5. LIGHTING CONSTANTS
RIM_LIGHT_ENERGY = 12000.0
KEY_LIGHT_ENERGY = 10000.0
LEG_LIGHT_ENERGY = 5000.0
RIM_LIGHT_COLOR  = (1.0, 0.9, 0.8)
KEY_LIGHT_COLOR  = (0.95, 1.0, 1.0)
LEG_LIGHT_COLOR  = (1.0, 1.0, 0.95)

# 6. PLANT HUMANOID DIMENSIONS
PH_TORSO_H = 1.5
PH_HEAD_R  = 0.4
PH_NECK_H  = 0.2

# 7. CAMERAS & CINEMATICS
WIDE_CAM_POS  = (0.0, -8.0, 2.0)
OTS1_CAM_POS  = (13.5, 11.0, 6.0)
OTS2_CAM_POS  = (-13.5, -11.0, 6.0)

CAM_ANIM_START = 1
CAM_ANIM_END   = 4200

# 8. BACKDROPS
BACKDROP_WIDE_POS = (0, 50, 5)
BACKDROP_OTS1_POS = (-50, -20, 5)
BACKDROP_OTS2_POS = (50, 20, 5)
BACKDROP_WIDE_SIZE = 200
BACKDROP_OTS_SIZE  = 1000
CHROMA_GREEN_RGB   = (0.0, 1.0, 0.0, 1.0)

# 9. CINEMATICS & ENVIRONMENT
CAMERA_NAME  = "WIDE"
BACKDROP_NAME = "ChromaBackdrop_Wide"
