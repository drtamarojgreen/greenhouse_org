import bpy
import math
import mathutils
import os
import sys
import json
import random
import config
from animation_handler import AnimationHandler

# Ensure Movie 7 root is in sys.path
M7_ROOT = os.path.dirname(os.path.abspath(__file__))
if M7_ROOT not in sys.path:
    sys.path.insert(0, M7_ROOT)

class Director:
    """Universal Director for Movie 7, driven by lights_camera.json and movie_config.json."""

    def __init__(self, lc_config_path=None):
        if not lc_config_path:
            lc_config_path = os.path.join(M7_ROOT, "lights_camera.json")
        with open(lc_config_path, 'r') as f:
            self.lc_cfg = json.load(f)
        self.coll_cameras = config.config.coll_cameras
        self.coll_env = config.config.coll_environment

    def setup_cinematics(self):
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
            target_id = cam_cfg.get("target")
            
            if target_id and "Antag" in cam_id:
                target_obj = bpy.data.objects.get(target_id)
                base_pos = mathutils.Vector(cam_cfg["pos"])
                if target_obj:
                    # Dynamic offset: scale vector from target to camera
                    foc_world = target_obj.matrix_world.translation
                    vec_to_camera = base_pos - foc_world
                    cam_obj.location = foc_world + (vec_to_camera * 3.0) # 3.0 is ANTAG_GLOBAL_OFFSET
                else:
                    cam_obj.location = cam_cfg["pos"]
                cam_obj.location.z += 20.0
            else:
                cam_obj.location = cam_cfg["pos"]
                
            if "rot" in cam_cfg:
                 cam_obj.rotation_euler = [math.radians(r) for r in cam_cfg["rot"]]

            if cam_obj.name not in cam_coll.objects:
                cam_coll.objects.link(cam_obj)

            # Animation Paths
            anim = cam_cfg.get("animation")
            if anim: self._setup_camera_path(cam_obj, anim)

            # Constraints
            target_id = cam_cfg.get("target")
            if target_id:
                target_obj = bpy.data.objects.get(target_id)
                if target_obj:
                    con = next((c for c in cam_obj.constraints if c.type == 'TRACK_TO'), None) or cam_obj.constraints.new(type='TRACK_TO')
                    con.target, con.track_axis, con.up_axis = target_obj, 'TRACK_NEGATIVE_Z', 'UP_Y'

    def setup_environment(self):
        """Constructs the environment meshes from config using ExteriorModeler."""
        from environment.exterior import ExteriorModeler
        from environment.backdrop import BackdropModeler
        ExteriorModeler().build_mesh("Env", config.config.get("environment", {}))
        BackdropModeler().build_mesh("Chroma", config.config.get("chroma", {}))

    def setup_lighting(self):
        """Constructs lighting rigs from config."""
        env_coll = self._ensure_collection(self.coll_env)
        total_f = config.config.total_frames
        for light_id, l_cfg in self.lc_cfg.get("lighting", {}).items():
            l_type = l_cfg.get("type", "SUN")
            l_data = bpy.data.lights.get(light_id) or bpy.data.lights.new(name=light_id, type=l_type)
            l_data.energy, l_data.color = l_cfg.get("energy", 1.0), l_cfg.get("color", (1,1,1))

            l_obj = bpy.data.objects.get(light_id) or bpy.data.objects.new(name=light_id, object_data=l_data)
            if l_obj.name not in env_coll.objects: env_coll.objects.link(l_obj)
            if "pos" in l_cfg: l_obj.location = l_cfg["pos"]
            if "rot" in l_cfg: l_obj.rotation_euler = [math.radians(r) for r in l_cfg["rot"]]
            if "target" in l_cfg:
                target_obj = bpy.data.objects.get(l_cfg["target"])
                if target_obj:
                    con = next((c for c in l_obj.constraints if c.type == 'TRACK_TO'), None) or l_obj.constraints.new(type='TRACK_TO')
                    con.target, con.track_axis, con.up_axis = target_obj, 'TRACK_NEGATIVE_Z', 'UP_Y'

            # 0.5Hz heartbeat pulse for scene vitality.
            base_energy = l_cfg.get("energy", 1.0)
            for f in range(1, total_f + 1, 12):
                pulse = 1.0 + 0.08 * math.sin(2.0 * math.pi * 0.5 * (f / 24.0))
                l_data.energy = base_energy * pulse
                l_data.keyframe_insert(data_path="energy", frame=f)

    def apply_sequencing(self):
        """Orchestrates timeline markers based on sequencing rules."""
        scene = bpy.context.scene; scene.timeline_markers.clear()
        seq = self.lc_cfg.get("sequencing", {})

        # Intro/Outro/Main
        for key in ["intro", "main_open", "outro"]:
            cfg = seq.get(key)
            if cfg:
                m = scene.timeline_markers.new(key.capitalize(), frame=cfg["start"])
                m.camera = bpy.data.objects.get(cfg["camera"])

        # Cycle
        cycle = seq.get("cycle")
        if cycle:
            frame, end, order, durs, c_idx = cycle["start"], cycle["end"], cycle["order"], cycle["durations"], 0
            while frame < end:
                c_type = order[c_idx % len(order)]
                cam_name = c_type
                if c_type == "Ots": cam_name = "Ots1" if (c_idx // len(order)) % 2 == 0 else "Ots2"
                if c_type == "Antag": cam_name = f"Antag{(c_idx // len(order)) % 4 + 1}"
                cam_obj = bpy.data.objects.get(cam_name)
                if cam_obj:
                    m = scene.timeline_markers.new(f"Shot_{cam_name}_{frame}", frame=frame)
                    m.camera = cam_obj
                frame += durs.get(c_type, 100); c_idx += 1

    def compose_ensemble(self):
        """Algorithmically positions ensemble spirits in a cinematic fan."""
        spirits = sorted([o for o in bpy.data.objects if ".Rig" in o.name and not o.get("is_protagonist")], key=lambda o: o.name)
        num = len(spirits)
        if num == 0: return

        entity_map = {e["id"]: e for e in config.config.get("ensemble.entities", [])}
        fan_width, fan_dist, var_dist, center_y = 0.95, 12.0, 3.5, 15.0
        for i, rig in enumerate(spirits):
            entity = entity_map.get(rig.name.replace(".Rig", ""))
            if entity and "default_pos" in entity:
                rig.location = mathutils.Vector(entity["default_pos"])
            else:
                angle = (i / max(num-1, 1)) * math.pi * fan_width - math.pi * (fan_width/2)
                dist = fan_dist + (i % 2) * var_dist
                rig.location = (math.sin(angle)*dist, center_y + math.cos(angle)*4.0, 0.0)
            # Face wide camera
            wide_pos = mathutils.Vector((0, 8, 2))
            vec = wide_pos - rig.location
            rig.rotation_euler[2] = vec.to_track_quat('Y', 'Z').to_euler().z + (math.pi/2)
            self._ground_rig_to_zero(rig)
            rig.keyframe_insert(data_path="location", frame=1)
            rig.keyframe_insert(data_path="rotation_euler", index=2, frame=1)

    def position_protagonists(self):
        """Faces Herbaceous and Arbor toward each other."""
        herb = bpy.data.objects.get("Herbaceous.Rig")
        arbor = bpy.data.objects.get("Arbor.Rig")
        if herb and arbor:
            herb_z = herb.location.z
            arbor_z = arbor.location.z
            herb.location = mathutils.Vector((-1.2, 0.5, herb_z))
            arbor.location = mathutils.Vector((1.2, 0.5, arbor_z))
            vec_h = arbor.location - herb.location
            vec_a = herb.location - arbor.location
            herb.rotation_euler[2] = vec_h.to_track_quat('Y', 'Z').to_euler().z + math.pi
            arbor.rotation_euler[2] = vec_a.to_track_quat('Y', 'Z').to_euler().z + math.pi
            self._ground_rig_to_zero(herb)
            self._ground_rig_to_zero(arbor)

    def apply_storyline(self):
        """Executes storyline events defined in movie_config.json."""
        story = config.config.get("ensemble.storyline", [])
        for beat in story:
            for event in beat.get("events", []):
                self._execute_event(event)

    def apply_scene_animations(self):
        """Orchestrates continuous timeline animations for all characters using AnimationHandler."""
        anim_handler = AnimationHandler()
        total_f = config.config.total_frames
        
        # 1. Protagonists
        herb = bpy.data.objects.get("Herbaceous.Rig") or bpy.data.objects.get("Herbaceous")
        arbor = bpy.data.objects.get("Arbor.Rig") or bpy.data.objects.get("Arbor")
        
        if herb:
            anim_handler.apply_animation(herb, "talking", 1, duration=3000)
            anim_handler.apply_animation(herb, "nod", 120)
            anim_handler.apply_animation(herb, "dance", 3000, duration=1200)
            
        if arbor:
            anim_handler.apply_animation(arbor, "talking", 1, duration=2999)
            anim_handler.apply_animation(arbor, "shake", 300)
            anim_handler.apply_animation(arbor, "dance", 3000, duration=1200)
            
        # 2. Key Entities
        majesty = bpy.data.objects.get("Sylvan_Majesty.Rig")
        if majesty:
            anim_handler.apply_animation(majesty, "idle", 1, duration=3000)
            anim_handler.apply_animation(majesty, "dance", 3000, duration=1200)
            
        aura = bpy.data.objects.get("Radiant_Aura.Rig")
        if aura:
            anim_handler.apply_animation(aura, "dance", 1, duration=total_f)
            
        # 3. Spore Tag (Weaver)
        weaver = bpy.data.objects.get("Shadow_Weaver.Rig")
        if weaver:
            anim_handler.apply_animation(weaver, "shake", 1, duration=599)
            anim_handler.apply_animation(weaver, "dance", 600, duration=total_f - 600)
            
        # 4. Blessing
        can = bpy.data.objects.get("WaterCan")
        hose = bpy.data.objects.get("GardenHose")
        if can: self._animate_blessing(can, 1800, 3000)
        if hose: self._animate_blessing(hose, 1800, 3000)
            
        # 5. Ensemble Loop
        spirits = [o for o in bpy.data.objects if ".Rig" in o.name and o not in [herb, arbor, majesty, aura, weaver]]
        tags = ["dance", "nod", "shake", "idle"]
        for i, spirit in enumerate(spirits):
            tag = tags[i % len(tags)]
            anim_handler.apply_animation(spirit, tag, 1, duration=total_f // 2)
            anim_handler.apply_animation(spirit, "dance", (total_f // 2) + 1, duration=total_f // 2)

    def _animate_blessing(self, prop_obj, start_frame, end_frame):
        """Port of animate_blessing for Movie 7."""
        if not prop_obj.animation_data:
            prop_obj.animation_data_create()
            
        base_z = prop_obj.location.z
        for f in range(start_frame, end_frame, 30):
            prop_obj.location.z = base_z + math.sin(f * 0.1) * 0.5
            prop_obj.keyframe_insert(data_path="location", index=2, frame=f)
            prop_obj.rotation_euler[0] = math.sin(f * 0.05) * 0.2
            prop_obj.rotation_euler[2] = f * 0.01
            prop_obj.keyframe_insert(data_path="rotation_euler", index=0, frame=f)
            prop_obj.keyframe_insert(data_path="rotation_euler", index=2, frame=f)

    def _execute_event(self, event):
        target = event["target"]
        action = event["action"]
        params = event["params"]

        objs = []
        if target == "ALL":
            objs = [o for o in bpy.data.objects if ".Rig" in o.name]
        else:
            objs = [bpy.data.objects.get(f"{target}.Rig") or bpy.data.objects.get(target)]

        for obj in [o for o in objs if o]:
            if action == "visibility":
                for c in obj.children_recursive:
                    if c.type == 'MESH':
                        c.hide_render = True; c.hide_viewport = True
                        c.keyframe_insert(data_path="hide_render", frame=1)
                        c.hide_render = False; c.hide_viewport = False
                        c.keyframe_insert(data_path="hide_render", frame=params["visible_at"])
            elif action == "altitude":
                obj.location.z = 0; obj.keyframe_insert(data_path="location", index=2, frame=1)
                obj.location.z = params["height"]; obj.keyframe_insert(data_path="location", index=2, frame=params["frames"])
            elif action == "emission_pulse":
                if obj.data.materials:
                    mat = obj.data.materials[0]
                    nodes = mat.node_tree.nodes
                    bsdf = nodes.get("Principled BSDF")
                    if bsdf and 'Emission Strength' in bsdf.inputs:
                        bsdf.inputs['Emission Strength'].default_value = 1.0
                        bsdf.inputs['Emission Strength'].keyframe_insert(data_path="default_value", frame=params["start"])
                        bsdf.inputs['Emission Strength'].default_value = params["max"]
                        bsdf.inputs['Emission Strength'].keyframe_insert(data_path="default_value", frame=(params["start"]+params["end"])//2)
                        bsdf.inputs['Emission Strength'].default_value = 5.0
                        bsdf.inputs['Emission Strength'].keyframe_insert(data_path="default_value", frame=params["end"])
            elif action == "animate":
                anim_handler = AnimationHandler()
                anim_handler.apply_animation(obj, params["tag"], event.get("start", 1), params.get("duration"))

    def _setup_camera_path(self, cam_obj, anim):
        points = anim["points"]; path_name = f"Path_{cam_obj.name}"
        curve_obj = bpy.data.objects.get(path_name)
        if not curve_obj:
            curve_data = bpy.data.curves.new(name=path_name, type='CURVE'); curve_data.dimensions = '3D'
            curve_obj = bpy.data.objects.new(path_name, curve_data); bpy.data.collections[self.coll_cameras].objects.link(curve_obj)
            spline = curve_data.splines.new('BEZIER'); spline.bezier_points.add(len(points)-1)
            for i, pt in enumerate(points):
                p = spline.bezier_points[i]; p.co = pt; p.handle_left_type = p.handle_right_type = 'AUTO'
        con = next((c for c in cam_obj.constraints if c.type == 'FOLLOW_PATH'), None) or cam_obj.constraints.new(type='FOLLOW_PATH')
        con.target, con.use_fixed_location = curve_obj, True
        segments = anim.get("segments", [{"start": 1, "end": anim.get("end_frame", config.config.total_frames)}])
        for seg in segments:
            con.offset_factor = 0.0; con.keyframe_insert(data_path="offset_factor", frame=seg["start"])
            con.offset_factor = 1.0; con.keyframe_insert(data_path="offset_factor", frame=seg["end"])

    def _ensure_collection(self, name):
        coll = bpy.data.collections.get(name) or bpy.data.collections.new(name)
        if coll.name not in bpy.context.scene.collection.children: bpy.context.scene.collection.children.link(coll)
        return coll

    def _ground_rig_to_zero(self, rig):
        meshes = [m for m in rig.children_recursive if m.type == 'MESH']
        for obj in bpy.data.objects:
            if obj.type != 'MESH' or obj in meshes:
                continue
            arm_mod = next((mod for mod in obj.modifiers if mod.type == 'ARMATURE' and mod.object == rig), None)
            if arm_mod:
                meshes.append(obj)
        if not meshes:
            return
        min_z = None
        for mesh in meshes:
            for corner in mesh.bound_box:
                z = (mesh.matrix_world @ mathutils.Vector(corner)).z
                min_z = z if min_z is None else min(min_z, z)
        if min_z is not None:
            rig.location.z -= min_z
