import json
import os
try:
    import bpy
except ImportError:
    bpy = None

# Internal state
_data = {}
_config_path = os.path.join(os.path.dirname(__file__), "movie_config.json")

def _load_config():
    global _data
    if os.path.exists(_config_path):
        with open(_config_path, 'r') as f:
            _data = json.load(f)

def get(key, default=None):
    """Retrieves nested configuration values using dot notation."""
    keys = key.split('.')
    value = _data
    for k in keys:
        if isinstance(value, dict) and k in value:
            value = value[k]
        else:
            return default
    return value

# Direct property accessors
@property
def total_frames():
    return get("production.total_frames", 5000)

@property
def output_dir():
    return get("paths.output_dir", "scripts/blender/movie/10/assets/")

@property
def coll_assets():
    return get("collections.characters", "CHARACTERS")

@property
def coll_cameras():
    return get("collections.cameras", "CAMERAS")

def get_character_config(char_id):
    entities = get("ensemble.entities", [])
    for e in entities:
        if e["id"] == char_id:
            return e
    return None

# Initialization
_load_config()

# Shims for legacy compatibility
COLL_ASSETS = coll_assets
COLL_CAMERAS = coll_cameras

# Blender 5.1 compatibility shims
if bpy and hasattr(bpy, "types"):
    if hasattr(bpy.types, "IMPORT_SCENE_OT_fbx") and not hasattr(bpy.types.IMPORT_SCENE_OT_fbx, "files"):
        bpy.types.IMPORT_SCENE_OT_fbx.files = bpy.props.CollectionProperty(type=bpy.types.OperatorFileListElement)
    if hasattr(bpy.types, "EXPORT_SCENE_OT_fbx") and not hasattr(bpy.types.EXPORT_SCENE_OT_fbx, "use_space_transform"):
        bpy.types.EXPORT_SCENE_OT_fbx.use_space_transform = bpy.props.BoolProperty(default=True)

# Variables initialized at load time for constants.
total_frames = get("production.total_frames", 5000)
output_dir = get("paths.output_dir", "scripts/blender/movie/10/assets/")
coll_assets = get("collections.characters", "CHARACTERS")
coll_cameras = get("collections.cameras", "CAMERAS")
# Equipment dir is not used in Movie 10 config but keep for parity if tests expect it
equipment_dir = "/home/tamarojgreen/Documents/Movie_Equipment/"
assets_blend = os.path.join(equipment_dir, "MHD2_animation133.blend")

# Add to sys.modules to handle top-level imports when package-relative fails
import sys
if 'movie_configuration' not in sys.modules:
    sys.modules['movie_configuration'] = sys.modules[__name__]
