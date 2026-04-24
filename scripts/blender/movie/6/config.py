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

# 1. ENSEMBLE DEFINITIONS (Mapped to Internal Blend Names)
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

# 1b. RIG MAPPING
RIG_MAP_SRC = {
    "Sylvan_Majesty":   "Armature.002",
    "Radiant_Aura":     "Armature.004",
    "Verdant_Sprite":   "Armature.001",
    "Shadow_Weaver":    "Armature.003",
    "Emerald_Sentinel": "Armature",
    "Phoenix_Herald":   "skeleton",
    "Golden_Phoenix":   "skeleton.001",
    "Root_Guardian":    "skeleton"
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

MAJESTIC_HEIGHT = 3.0
SPRITE_HEIGHT   = 3.0
PHOENIX_HEIGHT  = 3.0

# 6. CAMERA POSITIONS (Sentence_case)
CAM_WIDE_POS = (0.0, -4.5, 1.8)
CAM_WIDE_FAR_POS = (0.0, -150.0, 25.0) # Hyper-wide diagnostic position
CAM_OTS1_POS = (5.5, 4.5, 3.8)
CAM_OTS2_POS = (-5.5, -4.5, 3.8)
CAM_ANTAG1_POS = ( 4.0, -4.5, 2.0)
CAM_ANTAG2_POS = ( 1.0, -4.5, 2.0)
CAM_ANTAG3_POS = (-1.0, -4.5, 2.0)
CAM_ANTAG4_POS = (-4.0, -4.5, 2.0)
CAM_EXTERIOR_PATH = [(-50.0, -175.0, 32.0), (0.0, -175.0, 32.0), (50.0, -175.0, 32.0)]

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
# Backdrop walls are positioned as perpendicular greenhouse walls
# aligned to the edges of the 40x40 interior floor.
# Rotations are FIXED (not euler-tracked) to keep walls truly vertical.
INTERIOR_FLOOR_SIZE    = 40          # Width of brown interior dirt floor
INTERIOR_WALL_HALF     = 20.0        # Interior floor half-size (floor_size / 2)
BACKDROP_SIZE          = 30          # Size of each backdrop plane
BACKDROP_ALPHA         = 0.8         # Greenhouse wall opacity (80%)

# Wall positions: centred on each edge of the interior floor at half height
BACKDROP_WIDE_POS  = (0.0,  INTERIOR_WALL_HALF, 7.5)  # Back wall  (+Y edge)
BACKDROP_OTS1_POS  = (-INTERIOR_WALL_HALF, 0.0, 7.5)  # Left wall  (-X edge)
BACKDROP_OTS2_POS  = ( INTERIOR_WALL_HALF, 0.0, 7.5)  # Right wall (+X edge)

# Fixed perpendicular rotations (degrees → radians at runtime)
# Back wall faces -Y (cameras look from -Y)
BACKDROP_WIDE_ROT  = (90, 0, 0)
# Left wall faces +X
BACKDROP_OTS1_ROT  = (90, 0, 90)
# Right wall faces -X
BACKDROP_OTS2_ROT  = (90, 0, -90)

# 11. GREENHOUSE STRUCTURE CONSTANTS
GREENHOUSE_ROOF_HEIGHT = BACKDROP_SIZE   # Roof matches wall height
GREENHOUSE_ROOF_SIZE   = 42.0            # Slightly larger than interior floor
GREENHOUSE_ROOF_ALPHA  = 0.2             # Misty glass opacity (20%)
GREENHOUSE_ROOF_COLOR  = (0.7, 0.85, 1.0)  # Cool blue-white glass tint


# 12. EXTERIOR WORLD CONSTANTS
EXTERIOR_FLOOR_RADIUS = 300       # Radius of the exterior green ground circle
EXTERIOR_FLOOR_COLOR  = (0.02, 0.15, 0.02, 1.0)  # Deep green
INTERIOR_FLOOR_COLOR  = (0.22, 0.12, 0.05, 1.0)  # Rich brown dirt
MOUNTAIN_RING_RADIUS  = 250.0
MOUNTAIN_NUM_PEAKS    = 24
MOUNTAIN_COLOR        = (0.05, 0.05, 0.08, 1.0)  # Slate blue-grey
MOUNTAIN_PEAK_H_MIN   = 40.0
MOUNTAIN_PEAK_H_MAX   = 80.0
MOUNTAIN_PEAK_W_MIN   = 60.0
MOUNTAIN_PEAK_W_MAX   = 100.0
MOUNTAIN_JITTER       = 20.0      # Radius randomisation range

EXTERIOR_NUM_TREES    = 50        # Total trees + bushes scattered
EXTERIOR_TRUNK_COLOR  = (0.18, 0.09, 0.03, 1.0)  # Dark brown
EXTERIOR_EVERGREEN_SHADES = [
    (0.04, 0.22, 0.04, 1.0),  # Deep forest green
    (0.07, 0.30, 0.07, 1.0),  # Leaf green
    (0.03, 0.18, 0.08, 1.0),  # Olive green
]
EXTERIOR_MAPLE_SHADES = [
    (0.55, 0.12, 0.03, 1.0),  # Autumn red
    (0.65, 0.30, 0.02, 1.0),  # Amber orange
    (0.50, 0.40, 0.02, 1.0),  # Golden yellow
    (0.18, 0.35, 0.05, 1.0),  # Summer green maple
]
EXTERIOR_OAK_SHADES = [
    (0.08, 0.28, 0.06, 1.0),  # Rich oak green
    (0.12, 0.25, 0.05, 1.0),  # Dusty oak
    (0.35, 0.22, 0.03, 1.0),  # Autumn oak brown
]
EXTERIOR_BUSH_SHADES = [
    (0.05, 0.25, 0.05, 1.0),  # Bright leafy green
    (0.03, 0.16, 0.06, 1.0),  # Dark olive
    (0.08, 0.32, 0.08, 1.0),  # Vivid green
    (0.06, 0.20, 0.10, 1.0),  # Sage green
]

# 13. ROCK PATH CONSTANTS
ROCK_PATH_COLOR     = (0.42, 0.42, 0.42, 1.0)  # Mid grey stone
ROCK_PATH_WIDTH     = 2.5
ROCK_PATH_SEGMENTS  = 8
ROCK_PATH_LENGTH    = 20.0         # Distance path extends from greenhouse entrance

# 14. GREENHOUSE PILLARS & LEOPARD STATUES
PILLAR_RADIUS      = 0.8
PILLAR_HEIGHT      = 10.0
PILLAR_COLOR       = (0.95, 0.95, 0.97, 1.0)  # Marble white
STATUE_COLOR       = (0.55, 0.52, 0.50, 1.0)  # Stone grey

# 15. LAVENDER FLOWER BEDS (front of greenhouse, either side of entrance path)
LAVENDER_STALK_COLOR  = (0.25, 0.50, 0.20, 1.0)  # Green stem
LAVENDER_FLOWER_COLOR = (0.55, 0.28, 0.85, 1.0)  # Purple lavender
LAVENDER_BED_DEPTH    = 3.5    # Depth of bed from front wall
LAVENDER_DENSITY      = 35     # Plants per bed

# 16. SUNLIGHT
SUN_ENERGY       = 3.0
SUN_ROT_DEGREES  = (55, 0, -40)  # Elevation, tilt, azimuth

# 17. TORCH LIGHTING
TORCH_ENERGY      = 450.0
TORCH_COLOR       = (1.0, 0.55, 0.10, 1.0)  # Warm fire orange
TORCH_STICK_COLOR = (0.12, 0.07, 0.02, 1.0)  # Dark wood
TORCH_HEIGHT      = 2.5   # Stick height metres
TORCH_SPACING     = 5.0   # Metres between torches along path

# Safety: trees must be far enough that max branch reach (scale*3m ≈ 15m)
# cannot cross interior walls at INTERIOR_WALL_HALF (20m). Min dist = 38m.
EXTERIOR_TREE_MIN_DIST = 38.0
EXTERIOR_TREE_MAX_DIST = 150.0

# Tracking reference points (now used only for camera framing, not wall rotation)
CAM_WIDE_TRACK_REF = (0.0, 0.0, 2.0)
CAM_OTS1_TRACK_REF = (1.75, -0.3, 2.5)
CAM_OTS2_TRACK_REF = (-1.75, 0.3, 2.5)

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
BACKDROP_ALPHA = 0.8
CHROMA_GREEN_RGB = (0, 1, 0)
START_FRAME = 1

# 8. ASSET NORMALIZATION SETTINGS
ENABLE_STATISTICAL_CULLING  = False
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
