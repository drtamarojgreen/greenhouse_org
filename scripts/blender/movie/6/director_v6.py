import bpy
import math
import mathutils
import config

class SylvanDirector:
    """Manages scene composition, cinematography, and global animation dynamics."""
    
    def __init__(self):
        self.scene = bpy.context.scene

    def setup_cinematics(self):
        """Builds the professional 3-camera cinematic rig restored from v5."""
        coll = bpy.data.collections.get("SETTINGS.CAMERAS") or bpy.data.collections.new("SETTINGS.CAMERAS")
        if coll.name not in self.scene.collection.children:
            self.scene.collection.children.link(coll)
            
        # 1. WIDE MASTER (v5 Standard)
        self._create_camera("WIDE", (0, -18, 5.5), (math.radians(82), 0, 0), coll, lens=22)
        
        # 2. OTS RIGS (v5 Names)
        ots_targets = {
            "OTS1": {"pos": (13.5, 11.0, 6.0), "target": (0, 0, 2.5)},
            "OTS2": {"pos": (-13.5, -11.0, 6.0), "target": (0, 0, 2.5)},
            "OTS_Static_1": {"pos": (13.5, 11.0, 6.0), "target": (0, 0, 2.5)},
            "OTS_Static_2": {"pos": (-13.5, -11.0, 6.0), "target": (0, 0, 2.5)}
        }
        
        for name, data in ots_targets.items():
            self._create_camera(name, data["pos"], (0,0,0), coll, lens=50)
            # Simple look-at (Manual rotation calculation to avoid constraints)
            cam = bpy.data.objects.get(name)
            if cam:
                vec = mathutils.Vector(data["target"]) - mathutils.Vector(data["pos"])
                cam.rotation_euler = vec.to_track_quat('-Z', 'Y').to_euler()
        
        # Set Default
        wide = bpy.data.objects.get("Wide_Spirit")
        if wide: self.scene.camera = wide

    def _create_camera(self, name, pos, rot, coll, lens=35):
        data = bpy.data.cameras.new(name)
        data.lens = lens
        obj = bpy.data.objects.new(name, data)
        obj.location = pos
        obj.rotation_euler = rot
        coll.objects.link(obj)
        
        # Set Active Camera for Production
        if name == config.CAMERA_NAME:
            self.scene.camera = obj
            
        return obj

    def compose_ensemble(self):
        """Algorithmically positions the ensemble members in a cinematic fan."""
        spirits = sorted([o for o in bpy.data.objects if ".Rig" in o.name], key=lambda o: o.name)
        num = len(spirits)
        
        for i, rig in enumerate(spirits):
            # Cinematic Fan
            angle = (i / (num - 1)) * math.pi * 0.9 - math.pi * 0.45
            dist = 9.0 + (i % 2) * 2.5
            rig.location = (math.sin(angle) * dist, 6.0 + math.cos(angle) * 4.0, 0.0)
            
            # Growth Dynamics (Frame 1 vs Frame 2)
            rig.scale = (1, 1, 1)
            rig.keyframe_insert(data_path="scale", frame=1)
            
            # Substantial increase in Frame 2
            rig.scale = (1.5, 1.5, 1.5)
            rig.keyframe_insert(data_path="scale", frame=2)
            
            # Subtle settle for the rest of the scene
            rig.scale = (1.2, 1.2, 1.2)
            rig.keyframe_insert(data_path="scale", frame=config.TOTAL_FRAMES)
            
            # Gentle rise
            rig.location.z = 0
            rig.keyframe_insert(data_path="location", frame=1)
            rig.location.z += 1.5
            rig.keyframe_insert(data_path="location", frame=config.TOTAL_FRAMES)

    def position_protagonists(self):
        """Places Herbaceous and Arbor with production depth."""
        herb = bpy.data.objects.get(config.CHAR_HERBACEOUS + ".Rig") or bpy.data.objects.get(config.CHAR_HERBACEOUS)
        arbor = bpy.data.objects.get(config.CHAR_ARBOR + ".Rig") or bpy.data.objects.get(config.CHAR_ARBOR)
        
        if herb: herb.location = config.CHAR_HERBACEOUS_POS
        if arbor: arbor.location = config.CHAR_ARBOR_POS
