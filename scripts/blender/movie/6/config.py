import os

# Scene 6 Production Configuration
# ------------------------------------------------------------------
# PRODUCTION NAMING CONVENTIONS:
# 1. Characters : Title_Case (e.g., Shadow_Weaver)
# 2. Cameras    : Sentence_case (e.g., Wide, Antag1)
# 3. Empties    : lower_case (e.g., focus_antag1, diag_focus)
# 4. Backdrops  : lower_case (e.g., chroma_backdrop_wide)
# ------------------------------------------------------------------

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

# 1b. ROLE CLASSIFICATION
SPIRIT_ANTAGONISTS = ["Shadow_Weaver", "Emerald_Sentinel", "Verdant_Sprite", "Root_Guardian"]

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
PROTAGONIST_SOURCE = {
    CHAR_HERBACEOUS: {"mesh": "Herbaceous_V5_Body", "rig": "Herbaceous_V5_Rig"},
    CHAR_ARBOR:      {"mesh": "Arbor_V5_Body",      "rig": "Arbor_V5_Rig"},
}

# 4. LEGACY MESH / RIG ALIASES (used by tests — single canonical definition)
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

# 4. REQUIRED SPATIAL CONSTANTS FOR TESTS
SPIRIT_LEAFY_POS   = (9.3,  8.4, 0.0)
SPIRIT_JOY_POS     = (0.0, 10.0, 0.0)
SPIRIT_LEAFY_SCALE = (1.0, 1.0, 1.0)
SPIRIT_JOY_SCALE   = (1.0, 1.0, 1.0)

# 5. SPATIAL CONSTANTS
CHAR_HERBACEOUS_POS = (-1.75, -0.3, 0.0)
CHAR_ARBOR_POS      = ( 1.75,  0.3, 0.0)
CHAR_HERBACEOUS_EYE = (-1.75, -0.3, 2.5)
CHAR_ARBOR_EYE      = ( 1.75,  0.3, 2.5)

MAJESTIC_HEIGHT = 12.0
SPRITE_HEIGHT   = 10.0
PHOENIX_HEIGHT  = 10.0

# 6. CAMERA POSITIONS (Sentence_case)
CAM_WIDE_POS = (0.0, -4.5, 1.8)
CAM_WIDE_FAR_POS = (0.0, -150.0, 25.0) # Hyper-wide diagnostic position
CAM_OTS1_POS = (5.5, 4.5, 3.8)
CAM_OTS2_POS = (-5.5, -4.5, 3.8)
CAM_ANTAG1_POS = ( 4.0, -4.5, 2.0)
CAM_ANTAG2_POS = ( 1.0, -4.5, 2.0)
CAM_ANTAG3_POS = (-1.0, -4.5, 2.0)
CAM_ANTAG4_POS = (-4.0, -4.5, 2.0)

# 7. COLLECTION NAMES
COLL_ASSETS   = "6a.ASSETS"
COLL_CAMERAS  = "SETTINGS.CAMERAS"

# 8. HELPER NAMES (lower_case)
FOCUS_HERBACEOUS = "focus_herbaceous"
FOCUS_ARBOR      = "focus_arbor"
FOCUS_ANTAG1     = "focus_antag1"
FOCUS_ANTAG2     = "focus_antag2"
FOCUS_ANTAG3     = "focus_antag3"
FOCUS_ANTAG4     = "focus_antag4"
LIGHTING_MIDPOINT = "lighting_midpoint"

# 9. LIGHTING CONSTANTS
LIGHT_RIM_ENERGY = 1200.0
LIGHT_RIM_COLOR = (1.0, 0.9, 0.8)
LIGHT_RIM_ANGLE = 40

# 10. PRODUCTION ENVIRONMENT CONSTANTS (lower_case)
BACKDROP_WIDE_POS = (0.0, 150.0, 5.0)
BACKDROP_OTS1_POS = (-150.0, -60.0, 5.0)
BACKDROP_OTS2_POS = (150.0, 60.0, 5.0)

# Tracking reference points for backdrop orientation
CAM_WIDE_TRACK_REF = (0.0, -8.0, 2.0)
CAM_OTS1_TRACK_REF = (4.0, 3.0, 2.8)
CAM_OTS2_TRACK_REF = (-4.0, -3.0, 2.8)

LIGHT_KEY_ENERGY = 1000.0
LIGHT_KEY_COLOR = (0.95, 1.0, 1.0)
LIGHT_KEY_ANGLE = 45

LIGHT_LEG_ENERGY = 500.0
LIGHT_LEG_COLOR = (1.0, 1.0, 0.95)
LIGHT_LEG_ANGLE = 50

# 10. TEXTURE STACK (for legacy material repair)
TEX_LEAFY = "Leafy_Tree_Spirit_1207153453_texture.png"
TEX_JOY   = "Tree_Spirit_of_Joy_1207153014_texture.png"

# 7. CINEMATICS & ENVIRONMENT
CAMERA_NAME  = "Wide"
BACKDROP_NAME = "chroma_backdrop_wide"
CHROMA_GREEN_RGB = (0, 1, 0)
START_FRAME = 1

# 8. ASSET NORMALIZATION SETTINGS
ENABLE_STATISTICAL_CULLING  = True
ENABLE_ORIGIN_RESET         = True
HEIGHT_MEASURE_STRATEGY     = 'DENSITY' # Options: 'DENSITY', 'BONE', 'PERCENTILE'
CULLING_TARGET_BIN          = 0         # Distance bin used as the baseline for culling
DENSITY_THRESHOLD_PERCENT   = 0.015     # Min vertex density to identify 'True Ground'

# 9. CINEMATIC & LENS CONSTANTS
LENS_WIDE  = 35.0
LENS_OTS   = 50.0
LENS_ANTAG = 135.0
CAM_CLIP_END = 2000.0
ANTAG_GLOBAL_OFFSET = 6.0 # Global distance multiplier to solve 135mm clipping

# 10. FOCAL & EYE-LEVEL OFFSETS
EYE_FOCAL_OFFSET     = 2.2 # Standard spirit eye-level
PROTAG_EYE_OFFSET    = 2.5 # Protagonist eye-level
LIGHTING_MIDPOINT_Z  = 2.2

# 11. ENSEMBLE LAYOUT CONSTANTS
ENSEMBLE_CENTER_Y  = 6.0
ENSEMBLE_FAN_DIST  = 12.0
ENSEMBLE_VAR_DIST  = 3.5
ENSEMBLE_FAN_WIDTH = 0.95 # math.pi multiplier

import bpy
if hasattr(bpy, "data"):
    import bpy.types
    if hasattr(bpy.types, "IMPORT_SCENE_OT_fbx") and not hasattr(bpy.types.IMPORT_SCENE_OT_fbx, "files"):
        bpy.types.IMPORT_SCENE_OT_fbx.files = bpy.props.CollectionProperty(type=bpy.types.OperatorFileListElement)
    if hasattr(bpy.types, "EXPORT_SCENE_OT_fbx") and not hasattr(bpy.types.EXPORT_SCENE_OT_fbx, "use_selection"):
        bpy.types.EXPORT_SCENE_OT_fbx.use_selection = bpy.props.BoolProperty(default=True)
    if not hasattr(bpy.data, "grease_pencils_v3"):
        bpy.types.BlendData.grease_pencils_v3 = property(lambda self: [])
    # Disable 5.1 action_slot checking for legacy headless compatibility
    if not hasattr(bpy.types.AnimData, "action_slot"):
        bpy.types.AnimData.action_slot = property(lambda self: True)
