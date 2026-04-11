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
        """Builds the professional 3-camera cinematic rig restored from v5."""
        coll = (bpy.data.collections.get("SETTINGS.CAMERAS")
                or bpy.data.collections.new("SETTINGS.CAMERAS"))
        if coll.name not in self.scene.collection.children:
            self.scene.collection.children.link(coll)

        # 1. WIDE master (v5 standard) — name must match config.CAMERA_NAME ("WIDE")
        wide_cam = self._create_camera("WIDE", (0, -18, 5.5), (math.radians(82), 0, 0), coll, lens=22)
        self._setup_camera_curve(wide_cam, coll)

        # 2. OTS rigs (v5 names preserved for naming-parity tests)
        ots_targets = {
            "OTS1":         {"pos": ( 13.5,  11.0, 6.0), "target": (0, 0, 2.5)},
            "OTS2":         {"pos": (-13.5, -11.0, 6.0), "target": (0, 0, 2.5)},
            "OTS_Static_1": {"pos": ( 13.5,  11.0, 6.0), "target": (0, 0, 2.5)},
            "OTS_Static_2": {"pos": (-13.5, -11.0, 6.0), "target": (0, 0, 2.5)},
        }

        for name, data in ots_targets.items():
            cam = self._create_camera(name, data["pos"], (0, 0, 0), coll, lens=50)
            if cam:
                vec = mathutils.Vector(data["target"]) - mathutils.Vector(data["pos"])
                cam.rotation_euler = vec.to_track_quat('-Z', 'Y').to_euler()
                # Animate all cameras on curves as requested
                self._setup_camera_curve(cam, coll)

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
        # Increase clip_end to ensure massive volumes are visible
        cam_data.clip_end = 2000.0

        obj = bpy.data.objects.get(name)
        if obj is None:
            obj = bpy.data.objects.new(name, cam_data)

        obj.location      = pos
        obj.rotation_euler = rot

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
            # Reset world matrix to ensure no inherited or delta transforms interfere with Fan placement
            rig.matrix_world = mathutils.Matrix.Identity(4)

            # Cinematic fan spread
            angle = (i / max(num - 1, 1)) * math.pi * 0.9 - math.pi * 0.45
            dist  = 9.0 + (i % 2) * 2.5
            rig.location = (
                math.sin(angle) * dist,
                6.0 + math.cos(angle) * 4.0,
                0.0,
            )

            # Scale keyframes removed per directive.

            # Gentle ascent over the full scene
            rig.location.z = 0.0
            rig.keyframe_insert(data_path="location", frame=1)
            rig.location.z = 1.5
            rig.keyframe_insert(data_path="location", frame=config.TOTAL_FRAMES)

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
            herb.matrix_world = mathutils.Matrix.Identity(4)
            herb.location = config.CHAR_HERBACEOUS_POS
            herb.keyframe_insert(data_path="location", frame=1)
        if arbor:
            arbor.matrix_world = mathutils.Matrix.Identity(4)
            arbor.location = config.CHAR_ARBOR_POS
            arbor.keyframe_insert(data_path="location", frame=1)
