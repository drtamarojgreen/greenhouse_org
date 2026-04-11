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

# 8. TEXTURE STACK
TEX_LEAFY = "Leafy_Tree_Spirit_1207153453_texture.png"
TEX_JOY   = "Tree_Spirit_of_Joy_1207153014_texture.png"

# 9. CINEMATICS & ENVIRONMENT
CAMERA_NAME  = "WIDE"
CHROMA_GREEN_RGB = (0, 1, 0)
