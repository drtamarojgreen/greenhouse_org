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

        self._create_camera("WIDE", config.WIDE_CAM_POS, (math.radians(90), 0, 0), coll, lens=35)

        ots_targets = {
            "OTS1":         {"pos": config.OTS1_CAM_POS, "target": config.HERB_EYE_LEVEL},
            "OTS2":         {"pos": config.OTS2_CAM_POS, "target": config.ARBOR_EYE_LEVEL},
            "OTS_Static_1": {"pos": config.OTS1_CAM_POS, "target": config.HERB_EYE_LEVEL},
            "OTS_Static_2": {"pos": config.OTS2_CAM_POS, "target": config.ARBOR_EYE_LEVEL},
        }

        for name, data in ots_targets.items():
            self._create_camera(name, data["pos"], (0,0,0), coll, lens=50)
            cam = bpy.data.objects.get(name)
            if cam:
                vec = mathutils.Vector(data["target"]) - mathutils.Vector(data["pos"])
                cam.rotation_euler = vec.to_track_quat('-Z', 'Y').to_euler()
        
        import camera_rig_v6
        camera_rig_v6.setup_camera_rig_v6()

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
            rig.matrix_world = mathutils.Matrix.Identity(4)

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
        
        if herb:
            herb.matrix_world = mathutils.Matrix.Identity(4)
            herb.location = config.CHAR_HERBACEOUS_POS
        if arbor:
            arbor.matrix_world = mathutils.Matrix.Identity(4)
            arbor.location = config.CHAR_ARBOR_POS
