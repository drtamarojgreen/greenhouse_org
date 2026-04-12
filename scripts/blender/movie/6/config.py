import os

# Scene 6 Production Configuration: The Spirits of the Greenhouse
TOTAL_FRAMES = 4200
EQUIPMENT_DIR = "/home/tamarojgreen/Documents/Movie_Equipment/"
SPIRITS_ASSET_BLEND = os.path.join(EQUIPMENT_DIR, "MHD2_animation133.blend")

# 1. ENSEMBLE DEFINITIONS
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
CHAR_HERBACEOUS = "Herbaceous_V6"
CHAR_ARBOR      = "Arbor_V6"

# 3. SPATIAL CONSTANTS
CHAR_HERBACEOUS_POS = (-1.75, -0.3, 0.0)
CHAR_ARBOR_POS      = ( 1.75,  0.3, 0.0)
HERB_EYE_LEVEL      = (-1.75, -0.3, 2.5)
ARBOR_EYE_LEVEL     = (1.75, 0.3, 2.5)

# 4. LIGHTING & ATMOSPHERE
RIM_LIGHT_ENERGY = 15000.0
KEY_LIGHT_ENERGY = 12000.0
LEG_LIGHT_ENERGY = 6000.0
RIM_LIGHT_COLOR  = (0.8, 0.9, 1.0, 1.0)
KEY_LIGHT_COLOR  = (1.0, 1.0, 0.9, 1.0)
CHROMA_GREEN_RGB = (0.0, 1.0, 0.0, 1.0)

# 5. CAMERAS
WIDE_CAM_POS  = (0.0, -10.0, 2.5)
OTS1_CAM_POS  = (14.0, 12.0, 7.0)
OTS2_CAM_POS  = (-14.0, -12.0, 7.0)
CAM_ANIM_START = 1
CAM_ANIM_END   = 4200

# 6. PLANT HUMANOID DIMENSIONS
PH_TORSO_H = 1.5
PH_HEAD_R  = 0.4
PH_NECK_H  = 0.2

# 7. PERFORMANCE ROLES (Varied Performances)
PERFORMANCES = {
    CHAR_HERBACEOUS: "bloom_sway",
    CHAR_ARBOR:      "ancient_talking",
    "Sylvan_Majesty": "majestic_glide",
    "Radiant_Aura":   "spirit_dance",
    "Verdant_Sprite": "sprite_flutter",
    "Shadow_Weaver":  "ethereal_drift",
    "Emerald_Sentinel": "stoic_pulse",
    "Phoenix_Herald": "solar_flare",
    "Golden_Phoenix": "golden_ascent",
    "Root_Guardian":  "earth_hum"
}

# 8. BACKDROPS
BACKDROP_WIDE_POS = (0, 60, 5)
BACKDROP_OTS1_POS = (-60, -30, 5)
BACKDROP_OTS2_POS = (60, 30, 5)
BACKDROP_WIDE_SIZE = 250
BACKDROP_OTS_SIZE  = 1200
