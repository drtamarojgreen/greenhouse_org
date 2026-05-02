import bpy
import math
import mathutils
import os
import json

class CameraControls:
    """
    Centralized camera management system for Movie 9.
    Decoupled from Director to allow for data-driven cinematic orchestration.
    """

    def __init__(self, lc_cfg, coll_cameras="SETTINGS.CAMERAS", coll_env="9b.ENVIRONMENT"):
        self.lc_cfg = lc_cfg
        self.coll_cameras = coll_cameras
        self.coll_env = coll_env

    def setup_cinematics(self, total_frames):
        """Constructs focal targets, cameras, and paths from config."""
        self._ensure_collection(self.coll_env)
        cam_coll = self._ensure_collection(self.coll_cameras)

        # 1. Focal Targets
        for foc in self.lc_cfg.get("focal_targets", []):
            obj = bpy.data.objects.get(foc["id"]) or bpy.data.objects.new(foc["id"], None)
            obj.location = foc["pos"]
            if obj.name not in bpy.data.collections[self.coll_env].objects:
                bpy.data.collections[self.coll_env].objects.link(obj)

        # 2. Cameras & Paths
        for cam_cfg in self.lc_cfg.get("cameras", []):
            cam_id = cam_cfg["id"]
            cam_data = bpy.data.cameras.get(cam_id) or bpy.data.cameras.new(cam_id)
            cam_data.lens = cam_cfg.get("lens", 35.0)
            cam_data.clip_end = 2000.0
            cam_obj = bpy.data.objects.get(cam_id) or bpy.data.objects.new(cam_id, cam_data)

            if "pos" in cam_cfg: cam_obj.location = cam_cfg["pos"]
            if "rot" in cam_cfg: cam_obj.rotation_euler = [math.radians(r) for r in cam_cfg["rot"]]
            if cam_obj.name not in cam_coll.objects: cam_coll.objects.link(cam_obj)

            # Animation Paths
            anim = cam_cfg.get("animation")
            if anim: self._setup_camera_path(cam_obj, anim)

            # Constraints
            target_id = cam_cfg.get("target")
            if target_id:
                target_obj = bpy.data.objects.get(target_id)
                if target_obj is None: target_obj = bpy.data.objects.get("lighting_midpoint")
                if target_obj:
                    con = next((c for c in cam_obj.constraints if c.type == 'TRACK_TO'), None) or cam_obj.constraints.new(type='TRACK_TO')
                    con.target, con.track_axis, con.up_axis = target_obj, 'TRACK_NEGATIVE_Z', 'UP_Y'

            # Data-Driven Bounce/Animations
            if anim and "bounce" in anim and anim["bounce"].get("enabled"):
                self._apply_bounce(cam_obj, anim["bounce"], total_frames)

        if bpy.context.scene.camera is None:
            bpy.context.scene.camera = bpy.data.objects.get("Wide")

    def _apply_bounce(self, obj, b_cfg, total_frames):
        """Applies a procedural bounce animation based on JSON parameters."""
        axis = b_cfg.get("axis", "X")
        idx = {"X": 0, "Y": 1, "Z": 2}.get(axis, 0)
        freq = b_cfg.get("frequency", 0.04)
        amp = b_cfg.get("amplitude", 0.8)
        
        # Clear existing keyframes for this axis to prevent overlap
        if obj.animation_data and obj.animation_data.action:
            action = obj.animation_data.action
            if hasattr(action, "fcurves"):
                fcurves = [fc for fc in action.fcurves if fc.data_path == "location" and fc.array_index == idx]
                for fc in fcurves: action.fcurves.remove(fc)
            elif hasattr(action, "slots"):
                for slot in action.slots:
                    curves = getattr(slot, "curves", getattr(slot, "fcurves", []))
                    fcurves = [fc for fc in curves if fc.data_path == "location" and fc.array_index == idx]
                    for fc in fcurves:
                        if hasattr(slot, "curves"): slot.curves.remove(fc)
                        elif hasattr(slot, "fcurves"): slot.fcurves.remove(fc)

        for f in range(1, total_frames + 1, 40):
            val = math.sin(f * freq) * amp
            setattr(obj.location, axis.lower(), val)
            
            # Support both legacy and Slotted Actions in Blender 5.1+
            if hasattr(bpy.types, "ActionSlot"):
                if not obj.animation_data: obj.animation_data_create()
                if not obj.animation_data.action:
                    obj.animation_data.action = bpy.data.actions.new(name=f"Bounce_{obj.name}")
                
                # In Blender 5.1+, ensure the object is assigned to a slot
                if not obj.animation_data.action_slot:
                    action = obj.animation_data.action
                    slot = action.slots[0] if action.slots else action.slots.new(name="Default")
                    obj.animation_data.action_slot = slot
                
                obj.keyframe_insert(data_path="location", index=idx, frame=f)
            else:
                obj.keyframe_insert(data_path="location", index=idx, frame=f)

    def _setup_camera_path(self, cam, anim_cfg):
        """Creates a bezier curve and attaches the camera to it via follow-path."""
        points = anim_cfg.get("points", [])
        if len(points) < 2: return
        
        path_name = f"Path_{cam.name}"
        curve_data = bpy.data.curves.get(path_name) or bpy.data.curves.new(path_name, type='CURVE')
        curve_data.dimensions = '3D'
        curve_obj = bpy.data.objects.get(path_name) or bpy.data.objects.new(path_name, curve_data)
        if curve_obj.name not in bpy.data.collections[self.coll_cameras].objects:
            bpy.data.collections[self.coll_cameras].objects.link(curve_obj)
        
        spline = curve_data.splines[0] if len(curve_data.splines) > 0 else curve_data.splines.new('BEZIER')
        spline.bezier_points.add(len(points) - len(spline.bezier_points))
        for i, p in enumerate(points):
            spline.bezier_points[i].co = p
            spline.bezier_points[i].handle_left_type = 'AUTO'
            spline.bezier_points[i].handle_right_type = 'AUTO'
        
        con = next((c for c in cam.constraints if c.type == 'FOLLOW_PATH'), None) or cam.constraints.new(type='FOLLOW_PATH')
        con.target = curve_obj
        con.use_fixed_location = True
        
        # Keyframe evaluation time across duration or specific segments
        dur = anim_cfg.get("end_frame", 250)
        con.offset_factor = 0.0; con.keyframe_insert(data_path="offset_factor", frame=1)
        con.offset_factor = 1.0; con.keyframe_insert(data_path="offset_factor", frame=dur)

    def _ensure_collection(self, name):
        coll = bpy.data.collections.get(name) or bpy.data.collections.new(name)
        if coll.name not in bpy.context.scene.collection.children.keys():
            bpy.context.scene.collection.children.link(coll)
        return coll
