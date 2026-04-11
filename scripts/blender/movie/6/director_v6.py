import bpy
import math
import mathutils
import config


class SylvanDirector:
    """Manages scene composition and cinematography, restored to v5 standards."""
    
    def __init__(self):
        self.scene = bpy.context.scene

    # ------------------------------------------------------------------
    # CINEMATICS
    # ------------------------------------------------------------------

    def setup_cinematics(self):
        """Builds the professional 3-camera cinematic rig matching v5 logic."""
        coll = (bpy.data.collections.get("SETTINGS.CAMERAS")
                or bpy.data.collections.new("SETTINGS.CAMERAS"))
        if coll.name not in self.scene.collection.children:
            self.scene.collection.children.link(coll)

        # 1. WIDE master (v5 standard)
        self._create_camera("WIDE", (0.0, -8.0, 2.0), (math.radians(90), 0, 0), coll, lens=35)

        # 2. OTS rigs (v5 targets: Herbaceous eye level at (-1.75, -0.3, 2.5), Arbor at (1.75, 0.3, 2.5))
        ots_targets = {
            "OTS1":         {"pos": ( 13.5,  11.0, 6.0), "target": (-1.75, -0.3, 2.5)},
            "OTS2":         {"pos": (-13.5, -11.0, 6.0), "target": ( 1.75,  0.3, 2.5)},
            "OTS_Static_1": {"pos": ( 13.5,  11.0, 6.0), "target": (-1.75, -0.3, 2.5)},
            "OTS_Static_2": {"pos": (-13.5, -11.0, 6.0), "target": ( 1.75,  0.3, 2.5)},
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
        """Creates (or reuses) a camera and links it into the given collection."""
        cam_data = bpy.data.cameras.get(name) or bpy.data.cameras.new(name)
        cam_data.lens = lens

        obj = bpy.data.objects.get(name)
        if obj is None:
            obj = bpy.data.objects.new(name, cam_data)

        obj.location      = pos
        obj.rotation_euler = rot
        obj.scale          = (1, 1, 1)
        obj.parent         = None

        if obj.name not in coll.objects:
            coll.objects.link(obj)

        if name == config.CAMERA_NAME:
            self.scene.camera = obj

        return obj

    # ------------------------------------------------------------------
    # ENSEMBLE COMPOSITION
    # ------------------------------------------------------------------

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
        """Algorithmically positions ensemble members in a cinematic fan."""
        coll = bpy.data.collections.get("6a.ASSETS")
        if not coll:
            return

        spirits = sorted(
            [o for o in coll.objects if (".Rig" in o.name or (o.type == 'ARMATURE' and "Body" in o.name))
             and "Herbaceous" not in o.name and "Arbor" not in o.name],
            key=lambda o: o.name,
        )
        num = len(spirits)
        if num == 0:
            return

        for i, rig in enumerate(spirits):
            angle = (i / max(num - 1, 1)) * math.pi * 0.9 - math.pi * 0.45
            dist  = 9.0 + (i % 2) * 2.5

            rig.location = (
                math.sin(angle) * dist,
                6.0 + math.cos(angle) * 4.0,
                0.0,
            )

            rig.keyframe_insert(data_path="location", frame=1)
            rig.location.z = 1.5
            rig.keyframe_insert(data_path="location", frame=config.TOTAL_FRAMES)

    # ------------------------------------------------------------------
    # PROTAGONIST PLACEMENT
    # ------------------------------------------------------------------

    def position_protagonists(self):
        """Places Herbaceous and Arbor at v5-standard production coordinates."""
        herb = bpy.data.objects.get(config.CHAR_HERBACEOUS + ".Body") or bpy.data.objects.get(config.CHAR_HERBACEOUS)
        arbor = bpy.data.objects.get(config.CHAR_ARBOR + ".Body") or bpy.data.objects.get(config.CHAR_ARBOR)
        
        if herb: herb.location = config.CHAR_HERBACEOUS_POS
        if arbor: arbor.location = config.CHAR_ARBOR_POS
