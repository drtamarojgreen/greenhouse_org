import json
import os
import bpy

class MovieConfig:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MovieConfig, cls).__new__(cls)
            cls._instance._load_config()
        return cls._instance

    def _load_config(self):
        config_path = os.path.join(os.path.dirname(__file__), "movie_config.json")
        if os.path.exists(config_path):
            with open(config_path, 'r') as f:
                self._data = json.load(f)
        else:
            self._data = {}

    def get(self, key, default=None):
        keys = key.split('.')
        value = self._data
        for k in keys:
            if isinstance(value, dict) and k in value:
                value = value[k]
            else:
                return default
        return value

    @property
    def total_frames(self):
        return self.get("production.total_frames", 4200)

    @property
    def equipment_dir(self):
        return self.get("paths.equipment_dir", "/home/tamarojgreen/Documents/Movie_Equipment/")

    @property
    def assets_blend(self):
        return os.path.join(self.equipment_dir, self.get("paths.assets_blend", "MHD2_animation133.blend"))

    @property
    def protagonist_blend(self):
        return os.path.join(self.equipment_dir, self.get("paths.protagonist_blend", "MHD2_animation133.blend"))

    @property
    def output_dir(self):
        path = self.get("paths.output_dir", "scripts/blender/movie/7/assets/")
        return path

    @property
    def coll_assets(self):
        return self.get("collections.assets", "7a.ASSETS")

    @property
    def coll_environment(self):
        return self.get("collections.environment", "7b.ENVIRONMENT")

    @property
    def coll_cameras(self):
        return self.get("collections.cameras", "SETTINGS.CAMERAS")

    def get_character_config(self, char_id):
        entities = self.get("ensemble.entities", [])
        for e in entities:
            if e["id"] == char_id:
                return e
        return None

# Singleton instance for easy access
config = MovieConfig()

# Compatibility shims for Movie 6 helper modules (e.g. facial_utilities_v6)
COLL_ASSETS = config.coll_assets
COLL_CAMERAS = config.coll_cameras

# Blender 5.1 compatibility shims expected by legacy tests.
if hasattr(bpy, "types"):
    if hasattr(bpy.types, "IMPORT_SCENE_OT_fbx") and not hasattr(bpy.types.IMPORT_SCENE_OT_fbx, "files"):
        bpy.types.IMPORT_SCENE_OT_fbx.files = bpy.props.CollectionProperty(type=bpy.types.OperatorFileListElement)
    if hasattr(bpy.types, "EXPORT_SCENE_OT_fbx") and not hasattr(bpy.types.EXPORT_SCENE_OT_fbx, "use_space_transform"):
        bpy.types.EXPORT_SCENE_OT_fbx.use_space_transform = bpy.props.BoolProperty(default=True)
