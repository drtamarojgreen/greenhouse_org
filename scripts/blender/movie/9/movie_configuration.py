import json
import os
import bpy

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
    return get("production.total_frames", 4800)

@property
def equipment_dir():
    return get("paths.equipment_dir", "/home/tamarojgreen/Documents/Movie_Equipment/")

@property
def assets_blend():
    return os.path.join(equipment_dir, get("paths.assets_blend", "MHD2_animation133.blend"))

@property
def output_dir():
    return get("paths.output_dir", "scripts/blender/movie/9/assets/")

@property
def coll_assets():
    return get("collections.assets", "9a.ASSETS")

@property
def coll_environment():
    return get("collections.environment", "9b.ENVIRONMENT")

@property
def coll_cameras():
    return get("collections.cameras", "SETTINGS.CAMERAS")

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
if hasattr(bpy, "types"):
    if hasattr(bpy.types, "IMPORT_SCENE_OT_fbx") and not hasattr(bpy.types.IMPORT_SCENE_OT_fbx, "files"):
        bpy.types.IMPORT_SCENE_OT_fbx.files = bpy.props.CollectionProperty(type=bpy.types.OperatorFileListElement)
    if hasattr(bpy.types, "EXPORT_SCENE_OT_fbx") and not hasattr(bpy.types.EXPORT_SCENE_OT_fbx, "use_space_transform"):
        bpy.types.EXPORT_SCENE_OT_fbx.use_space_transform = bpy.props.BoolProperty(default=True)

# Note: In Python, properties work on class instances. 
# For module-level properties, we export them as functions or simple variables.
# We'll use simple variables initialized at load time for constants.
total_frames = get("production.total_frames", 4800)
equipment_dir = get("paths.equipment_dir", "/home/tamarojgreen/Documents/Movie_Equipment/")
assets_blend = os.path.join(equipment_dir, get("paths.assets_blend", "MHD2_animation133.blend"))
output_dir = get("paths.output_dir", "scripts/blender/movie/9/assets/")
coll_assets = get("collections.assets", "9a.ASSETS")
coll_environment = get("collections.environment", "9b.ENVIRONMENT")
coll_cameras = get("collections.cameras", "SETTINGS.CAMERAS")
