import bpy
import math
import mathutils
import config


class SylvanDirector:
    """Manages scene composition, cinematography, and global animation dynamics."""

    def __init__(self):
        self.scene = bpy.context.scene

    # ------------------------------------------------------------------
    # CINEMATICS
    # ------------------------------------------------------------------

    def setup_cinematics(self):
        """Builds the professional 3-camera cinematic rig matching v5 settings."""
        coll = (bpy.data.collections.get("Cameras")
                or bpy.data.collections.new("Cameras"))
        if coll.name not in self.scene.collection.children:
            self.scene.collection.children.link(coll)

        # --- COORDINATE CONSTANTS from v5 ---
        HERB_EYE_LEVEL = (-1.75, -0.3, 2.5)
        ARBOR_EYE_LEVEL = (1.75, 0.3, 2.5)
        CAM_WIDE_LOC = (0.0, -8.0, 2.0)
        CAM_WIDE_ROT = (math.radians(90), 0.0, 0.0)
        CAM_HERB_OTS_START = (13.5, 11.0, 6.0)
        CAM_ARBOR_OTS_START = (-13.5, -11.0, 6.0)

        # 1. WIDE master (v5 standard)
        self._create_camera("WIDE", CAM_WIDE_LOC, CAM_WIDE_ROT, coll, lens=35)

        # 2. OTS rigs (v5 names and positions)
        ots_targets = {
            "OTS1":         {"pos": CAM_HERB_OTS_START, "target": HERB_EYE_LEVEL},
            "OTS2":         {"pos": CAM_ARBOR_OTS_START, "target": ARBOR_EYE_LEVEL},
            "OTS_Static_1": {"pos": CAM_HERB_OTS_START, "target": HERB_EYE_LEVEL},
            "OTS_Static_2": {"pos": CAM_ARBOR_OTS_START, "target": ARBOR_EYE_LEVEL},
        }

        for name, data in ots_targets.items():
            self._create_camera(name, data["pos"], (0, 0, 0), coll, lens=50)
            cam = bpy.data.objects.get(name)
            if cam:
                vec = mathutils.Vector(data["target"]) - mathutils.Vector(data["pos"])
                cam.rotation_euler = vec.to_track_quat('-Z', 'Y').to_euler()

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
        coll = bpy.data.collections.get(config.COLL_CHARACTERS)
        if not coll:
            print(f"DIRECTOR: No {config.COLL_CHARACTERS} collection found — skipping ensemble composition.")
            return

        spirits = sorted(
            [o for o in coll.objects if (".Rig" in o.name or (o.type == 'ARMATURE' and "Body" in o.name))
             and config.CHAR_HERBACEOUS not in o.name and config.CHAR_ARBOR not in o.name],
            key=lambda o: o.name,
        )
        num = len(spirits)
        if num == 0:
            print("DIRECTOR: No spirit rigs found — skipping ensemble composition.")
            return

        for i, rig in enumerate(spirits):
            angle = (i / max(num - 1, 1)) * math.pi * 0.9 - math.pi * 0.45
            dist  = 9.0 + (i % 2) * 2.5

            rig.location = (
                math.sin(angle) * dist,
                6.0 + math.cos(angle) * 4.0,
                0.0,
            )

    # ------------------------------------------------------------------
    # PROTAGONIST PLACEMENT
    # ------------------------------------------------------------------

    def position_protagonists(self):
        """Places Herbaceous and Arbor at their production positions."""
        herb = (bpy.data.objects.get(config.CHAR_HERBACEOUS + "_Rig")
                or bpy.data.objects.get(config.CHAR_HERBACEOUS + "_Body")
                or bpy.data.objects.get(config.CHAR_HERBACEOUS))
        arbor = (bpy.data.objects.get(config.CHAR_ARBOR + "_Rig")
                 or bpy.data.objects.get(config.CHAR_ARBOR + "_Body")
                 or bpy.data.objects.get(config.CHAR_ARBOR))

        if herb:
            herb.location = config.CHAR_HERBACEOUS_POS
        if arbor:
            arbor.location = config.CHAR_ARBOR_POS
