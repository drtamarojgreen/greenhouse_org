import bpy
import math
import mathutils
import config

class SylvanDirector:
    """Manages scene composition and cinematography, restored to v5 standards."""
    
    def __init__(self):
        self.scene = bpy.context.scene

    def setup_cinematics(self):
        """Builds the professional 3-camera cinematic rig restored from v5."""
        coll = bpy.data.collections.get("SETTINGS.CAMERAS") or bpy.data.collections.new("SETTINGS.CAMERAS")
        if coll.name not in self.scene.collection.children:
            self.scene.collection.children.link(coll)
            
        # 1. WIDE MASTER
        self._create_camera("WIDE", config.CAM_WIDE_LOC, (math.radians(90), 0, 0), coll, lens=35)
        
        # 2. OTS RIGS
        ots_targets = {
            "OTS1": {"pos": config.CAM_OTS1_POS, "target": config.HERB_EYE_LEVEL},
            "OTS2": {"pos": config.CAM_OTS2_POS, "target": config.ARBOR_EYE_LEVEL},
            "OTS_Static_1": {"pos": config.CAM_OTS1_POS, "target": config.HERB_EYE_LEVEL},
            "OTS_Static_2": {"pos": config.CAM_OTS2_POS, "target": config.ARBOR_EYE_LEVEL}
        }
        
        for name, data in ots_targets.items():
            self._create_camera(name, data["pos"], (0,0,0), coll, lens=50)
            cam = bpy.data.objects.get(name)
            if cam:
                vec = mathutils.Vector(data["target"]) - mathutils.Vector(data["pos"])
                cam.rotation_euler = vec.to_track_quat('-Z', 'Y').to_euler()
        
        # Set Active Camera
        if "WIDE" in bpy.data.objects:
            self.scene.camera = bpy.data.objects["WIDE"]

    def _create_camera(self, name, pos, rot, coll, lens=35):
        data = bpy.data.cameras.new(name)
        data.lens = lens
        obj = bpy.data.objects.new(name, data)
        obj.location = pos
        obj.rotation_euler = rot
        if name not in coll.objects:
            coll.objects.link(obj)
        return obj

    def compose_ensemble(self):
        """Predictable fan placement for spirits."""
        spirits = sorted([o for o in bpy.data.objects if ".Rig" in o.name], key=lambda o: o.name)
        num = len(spirits)
        if num == 0: return
        
        for i, rig in enumerate(spirits):
            angle = (i / (num - 1 if num > 1 else 1)) * math.pi * 0.8 - math.pi * 0.4
            dist = 10.0
            rig.location = (math.sin(angle) * dist, 8.0 + math.cos(angle) * 3.0, 0.0)
            rig.scale = (1, 1, 1)

    def position_protagonists(self):
        """Places Herbaceous and Arbor at v5-standard production coordinates."""
        herb = bpy.data.objects.get(config.CHAR_HERBACEOUS + ".Body") or bpy.data.objects.get(config.CHAR_HERBACEOUS)
        arbor = bpy.data.objects.get(config.CHAR_ARBOR + ".Body") or bpy.data.objects.get(config.CHAR_ARBOR)
        
        if herb: herb.location = config.CHAR_HERBACEOUS_POS
        if arbor: arbor.location = config.CHAR_ARBOR_POS
