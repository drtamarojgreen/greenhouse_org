import bpy
import math
import mathutils
import config
from animation_library_v6 import apply_animation_by_tag


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
        self._create_camera("WIDE", config.CAMERA_WIDE_LOC, (math.radians(90), 0, 0), coll, lens=35)

        # 2. OTS rigs
        ots_targets = {
            "OTS1":         {"pos": config.CAMERA_OTS1_LOC, "target": config.HERB_EYE_LEVEL},
            "OTS2":         {"pos": config.CAMERA_OTS2_LOC, "target": config.ARBOR_EYE_LEVEL},
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
    # ENSEMBLE COMPOSITION & ANIMATION
    # ------------------------------------------------------------------

    def compose_ensemble(self):
        """Algorithmically positions ensemble members and assigns diverse animations."""
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

        # Available animations from library
        anim_tags = ["nod", "shake", "dance", "talking", "blink"]

        for i, rig in enumerate(spirits):
            angle = (i / max(num - 1, 1)) * math.pi * 0.9 - math.pi * 0.45
            dist  = 9.0 + (i % 2) * 2.5

            rig.location = (
                math.sin(angle) * dist,
                6.0 + math.cos(angle) * 4.0,
                0.0,
            )

            rig.keyframe_insert(data_path="location", frame=1)

            # Apply unique animation from registry
            tag = anim_tags[i % len(anim_tags)]
            apply_animation_by_tag(rig, tag, start_frame=1, duration=config.TOTAL_FRAMES)

    # ------------------------------------------------------------------
    # PROTAGONIST PLACEMENT
    # ------------------------------------------------------------------

    def position_protagonists(self):
        """Places Herbaceous and Arbor and assigns unique animations."""
        herb = bpy.data.objects.get(config.CHAR_HERBACEOUS + ".Rig") or bpy.data.objects.get(config.CHAR_HERBACEOUS)
        arbor = bpy.data.objects.get(config.CHAR_ARBOR + ".Rig") or bpy.data.objects.get(config.CHAR_ARBOR)
        
        if herb:
            herb.location = config.CHAR_HERBACEOUS_POS
            apply_animation_by_tag(herb, "talking", start_frame=1, duration=config.TOTAL_FRAMES)

        if arbor:
            arbor.location = config.CHAR_ARBOR_POS
            apply_animation_by_tag(arbor, "nod", start_frame=1, duration=config.TOTAL_FRAMES)
