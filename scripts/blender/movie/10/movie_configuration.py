try:
    import bpy
    import bmesh
    import mathutils
except ImportError:
    bpy = None
    bmesh = None
    mathutils = None

    import bpy
except ImportError:
    bpy = None
import json
import os

_data = {}
_config_path = os.path.join(os.path.dirname(__file__), "movie_config.json")

def _load_config():
    global _data
    if os.path.exists(_config_path):
        with open(_config_path, 'r') as f:
            _data = json.load(f)

def get(key, default=None):
    keys = key.split('.')
    value = _data
    for k in keys:
        if isinstance(value, dict) and k in value:
            value = value[k]
        else:
            return default
    return value

_load_config()
total_frames = get("production.total_frames", 10000)
output_dir = get("paths.output_dir", "scripts/blender/movie/10/assets/")
coll_assets = get("collections.characters", "CHARACTERS")
coll_environment = get("collections.environment", "9b.ENVIRONMENT")
coll_cameras = get("collections.cameras", "CAMERAS")
coll_lights = get("collections.lights", "LIGHTS")
equipment_dir = "/home/tamarojgreen/Documents/Movie_Equipment/"
assets_blend = os.path.join(equipment_dir, "MHD2_animation133.blend")

def get_character_config(char_id):
    entities = get("ensemble.entities", [])
    for e in entities:
        if e["id"] == char_id: return e
    return None

COLL_ASSETS = coll_assets
COLL_ENVIRONMENT = coll_environment
COLL_CAMERAS = coll_cameras
COLL_LIGHTS = coll_lights
