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

RIG_MAP_SRC = {
    "Sylvan_Majesty": "Armature.002",
    "Radiant_Aura": "Armature.004",
    "Verdant_Sprite": "Armature.001",
    "Shadow_Weaver": "Armature.003",
    "Emerald_Sentinel": "Armature",
    "Phoenix_Herald": "skeleton",
    "Golden_Phoenix": "skeleton.001"
}

# 2. PROTAGONISTS
CHAR_HERBACEOUS = "Herbaceous_V5"
CHAR_ARBOR = "Arbor_V5"

# Legacy Aliases (Required for regression tests)
CHAR_LEAFY_MESH = "Sylvan_Majesty.Body"
CHAR_JOY_MESH = "Radiant_Aura.Body"
CHAR_LEAFCHAR_MESH = "Verdant_Sprite.Body"
CHAR_SCRIBE_MESH = "Shadow_Weaver.Body"
CHAR_SENTINEL_MESH = "Emerald_Sentinel.Body"

CHAR_LEAFY_RIG = "Sylvan_Majesty.Rig"
CHAR_JOY_RIG = "Radiant_Aura.Rig"
CHAR_LEAFCHAR_RIG = "Verdant_Sprite.Rig"
CHAR_SCRIBE_RIG = "Shadow_Weaver.Rig"
CHAR_SENTINEL_RIG = "Emerald_Sentinel.Rig"

# Legacy Aliases (Required for regression tests)
CHAR_LEAFY_MESH = "Sylvan_Majesty.Body"
CHAR_JOY_MESH = "Radiant_Aura.Body"
CHAR_LEAFCHAR_MESH = "Verdant_Sprite.Body"
CHAR_SCRIBE_MESH = "Shadow_Weaver.Body"
CHAR_SENTINEL_MESH = "Emerald_Sentinel.Body"

CHAR_LEAFY_RIG = "Sylvan_Majesty.Rig"
CHAR_JOY_RIG = "Radiant_Aura.Rig"
CHAR_LEAFCHAR_RIG = "Verdant_Sprite.Rig"
CHAR_SCRIBE_RIG = "Shadow_Weaver.Rig"
CHAR_SENTINEL_RIG = "Emerald_Sentinel.Rig"

# Required Spatial Constants for Tests
SPIRIT_LEAFY_POS = (9.3, 8.4, 0.0)
SPIRIT_JOY_POS = (0.0, 10.0, 0.0)
SPIRIT_LEAFY_SCALE = (1.0, 1.0, 1.0)
SPIRIT_JOY_SCALE = (1.0, 1.0, 1.0)

# 3. SPATIAL CONSTANTS
CHAR_HERBACEOUS_POS = (-1.75, -5.0, 0.0)
CHAR_ARBOR_POS = (1.75, -4.5, 0.0)
MAJESTIC_HEIGHT = 6.0 
SPRITE_HEIGHT = 5.5
PHEONIX_HEIGHT = 5.5

# 4. TEXTURE STACK (Required for legacy material repair)
TEX_LEAFY = "Leafy_Tree_Spirit_1207153453_texture.png"
TEX_JOY = "Tree_Spirit_of_Joy_1207153014_texture.png"

# 5. CINEMATICS & ENVIRONMENT
CAMERA_NAME = "WIDE"
BACKDROP_NAME = "ChromaBackdrop_Wide"
CHROMA_GREEN_RGB = (0, 1, 0)
