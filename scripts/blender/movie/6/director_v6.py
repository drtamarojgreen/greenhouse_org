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
        """Builds the professional 3-camera cinematic rig restored from v5."""
        coll = (bpy.data.collections.get("SETTINGS.CAMERAS")
                or bpy.data.collections.new("SETTINGS.CAMERAS"))
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

    def _setup_camera_curve(self, cam_obj, coll):
        """Creates a curve and adds a FOLLOW_PATH constraint for the camera."""
        curve_name = f"Curve.{cam_obj.name}"
        curve_data = bpy.data.curves.new(curve_name, type='CURVE')
        curve_data.dimensions = '3D'

        curve_obj = bpy.data.objects.get(curve_name)
        if not curve_obj:
            curve_obj = bpy.data.objects.new(curve_name, curve_data)
            coll.objects.link(curve_obj)

        # Create a simple path
        spline = curve_data.splines.new('BEZIER')
        spline.bezier_points.add(1)
        spline.bezier_points[0].co = (cam_obj.location.x - 5, cam_obj.location.y, cam_obj.location.z)
        spline.bezier_points[1].co = (cam_obj.location.x + 5, cam_obj.location.y, cam_obj.location.z)
        spline.bezier_points[0].handle_left = (cam_obj.location.x - 7, cam_obj.location.y, cam_obj.location.z)
        spline.bezier_points[0].handle_right = (cam_obj.location.x - 3, cam_obj.location.y, cam_obj.location.z)
        spline.bezier_points[1].handle_left = (cam_obj.location.x + 3, cam_obj.location.y, cam_obj.location.z)
        spline.bezier_points[1].handle_right = (cam_obj.location.x + 7, cam_obj.location.y, cam_obj.location.z)

        # Add constraint
        con = cam_obj.constraints.get("Follow Path")
        if not con:
            con = cam_obj.constraints.new(type='FOLLOW_PATH')
        con.target = curve_obj
        con.use_fixed_location = True

        # Animate offset
        con.offset_factor = 0.0
        con.keyframe_insert(data_path="offset_factor", frame=1)
        con.offset_factor = 1.0
        con.keyframe_insert(data_path="offset_factor", frame=config.TOTAL_FRAMES)

    def _create_camera(self, name, pos, rot, coll, lens=35):
        """Creates (or reuses) a camera and links it into the given collection."""
        # Reuse an existing camera data-block if we've already created it
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

        # Set the scene active camera when this is the designated primary
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
            print("DIRECTOR: No 6a.ASSETS collection found — skipping ensemble composition.")
            return

        # Include characters with .Rig suffix OR characters that ARE armatures (Root_Guardian)
        # Strictly scope to the asset collection to protect environment (cameras/backdrops)
        spirits = sorted(
            [o for o in coll.objects if ".Rig" in o.name or (o.type == 'ARMATURE' and "Body" in o.name)],
            key=lambda o: o.name,
        )
        num = len(spirits)
        if num == 0:
            print("DIRECTOR: No spirit rigs found — skipping ensemble composition.")
            return

        for i, rig in enumerate(spirits):
            # Cinematic fan spread
            angle = (i / max(num - 1, 1)) * math.pi * 0.9 - math.pi * 0.45
            dist  = 9.0 + (i % 2) * 2.5

            rig.location = (
                math.sin(angle) * dist,
                6.0 + math.cos(angle) * 4.0,
                0.0,
            )

            # Base scale from normalization (standardized before this call)
            s_base = rig.scale.copy()

            # Growth dynamics: compact at frame 1, majestically tall by frame 2, settled by end
            # Scale keyframes are subtle (max 1.05x base) to avoid breaking Majestic height standards
            rig.scale = s_base
            rig.keyframe_insert(data_path="scale", frame=1)

            rig.scale = s_base * 1.05
            rig.keyframe_insert(data_path="scale", frame=2)

            rig.scale = s_base * 1.02
            rig.keyframe_insert(data_path="scale", frame=config.TOTAL_FRAMES)

            # Gentle ascent over the full scene
            rig.location.z = 0.0
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
