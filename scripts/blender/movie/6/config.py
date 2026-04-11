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
    # Root_Guardian is itself the skeleton object; it has no separate rig row.
}

# 2. PROTAGONISTS
CHAR_HERBACEOUS = "Herbaceous_V5"
CHAR_ARBOR      = "Arbor_V5"

# 3. PROTAGONIST ASSET MAPPING
# These identify the source objects in the .blend file for the protagonists.
PROTAGONIST_SOURCE = {
    CHAR_HERBACEOUS: {"mesh": "Herbaceous_V5_Body", "rig": "Herbaceous_V5_Rig"},
    CHAR_ARBOR:      {"mesh": "Arbor_V5_Body",      "rig": "Arbor_V5_Rig"},
}

# 4. LEGACY MESH / RIG ALIASES (used by tests — single canonical definition)
# Protagonist Blend Source (v5 reference)
PROTAGONIST_SOURCE_BLEND = os.path.join(EQUIPMENT_DIR, "MHD2_characters_v5.blend")

CHAR_LEAFY_MESH    = "Sylvan_Majesty.Body"
CHAR_JOY_MESH      = "Radiant_Aura.Body"
CHAR_LEAFCHAR_MESH = "Verdant_Sprite.Body"
CHAR_SCRIBE_MESH   = "Shadow_Weaver.Body"
CHAR_SENTINEL_MESH = "Emerald_Sentinel.Body"

CHAR_LEAFY_RIG    = "Sylvan_Majesty.Rig"
CHAR_JOY_RIG      = "Radiant_Aura.Rig"
CHAR_LEAFCHAR_RIG = "Verdant_Sprite.Rig"
CHAR_SCRIBE_RIG   = "Shadow_Weaver.Rig"
CHAR_SENTINEL_RIG = "Emerald_Sentinel.Rig"

# 5. SPATIAL CONSTANTS & TARGET HEIGHTS
CHAR_HERBACEOUS_POS = (-1.75, -0.3, 0.0)
CHAR_ARBOR_POS      = ( 1.75,  0.3, 0.0)

# Canonical Heights for Normalization
MAJESTIC_HEIGHT   = 6.0
SPRITE_HEIGHT     = 5.5
PHOENIX_HEIGHT    = 5.5
HERBACEOUS_HEIGHT = 2.2
ARBOR_HEIGHT      = 2.2

# Spirit Mapping to Targets
HEIGHT_TARGETS = {
    "Sylvan_Majesty":   MAJESTIC_HEIGHT,
    "Radiant_Aura":     SPRITE_HEIGHT,
    "Verdant_Sprite":   SPRITE_HEIGHT,
    "Shadow_Weaver":    SPRITE_HEIGHT,
    "Emerald_Sentinel": MAJESTIC_HEIGHT,
    "Phoenix_Herald":   PHOENIX_HEIGHT,
    "Golden_Phoenix":   PHOENIX_HEIGHT,
    "Root_Guardian":    MAJESTIC_HEIGHT,
    CHAR_HERBACEOUS:    HERBACEOUS_HEIGHT,
    CHAR_ARBOR:         ARBOR_HEIGHT
}

# 6. PLANT HUMANOID DIMENSIONS
PH_TORSO_H = 1.5
PH_HEAD_R  = 0.4
PH_NECK_H  = 0.2

# 7. LIGHTING CONSTANTS
RIM_LIGHT_ENERGY = 12000.0
KEY_LIGHT_ENERGY = 10000.0
LEG_LIGHT_ENERGY = 5000.0
RIM_LIGHT_COLOR  = (1.0, 0.9, 0.8)
KEY_LIGHT_COLOR  = (0.95, 1.0, 1.0)
LEG_LIGHT_COLOR  = (1.0, 1.0, 0.95)

# 8. CAMERAS & CINEMATICS
WIDE_CAM_POS  = (0.0, -8.0, 2.0)
OTS1_CAM_POS  = (13.5, 11.0, 6.0)
OTS2_CAM_POS  = (-13.5, -11.0, 6.0)

HERB_EYE_LEVEL  = (-1.75, -0.3, 2.5)
ARBOR_EYE_LEVEL = (1.75, 0.3, 2.5)

# Camera Animation
CAM_ANIM_START = 1
CAM_ANIM_END   = 4200

# 9. BACKDROPS
BACKDROP_WIDE_POS = (0, 50, 5)
BACKDROP_OTS1_POS = (-50, -20, 5)
BACKDROP_OTS2_POS = (50, 20, 5)
BACKDROP_WIDE_SIZE = 200
BACKDROP_OTS_SIZE  = 1000

# 10. TEXTURE STACK (for legacy material repair)
TEX_LEAFY = "Leafy_Tree_Spirit_1207153453_texture.png"
TEX_JOY   = "Tree_Spirit_of_Joy_1207153014_texture.png"

# 11. CINEMATICS & ENVIRONMENT
CAMERA_NAME  = "WIDE"
BACKDROP_NAME = "ChromaBackdrop_Wide"
CHROMA_GREEN_RGB = (0, 1, 0)
