import bpy
import math
import mathutils
import os
import sys
import json
import random
import config
from animation_handler import AnimationHandler
from calligraphy import CalligraphyDirector

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

        if bpy.context.scene.camera is None: bpy.context.scene.camera = bpy.data.objects.get("Wide")

    def setup_calligraphy(self):
        """Sets up intro/outro GreenhouseMD lettering and dedicated lighting."""
        CalligraphyDirector(self.lc_cfg, config.config.total_frames, M7_ROOT).apply()

    def setup_environment(self, force=False, env_cfg=None):
        """Constructs the environment meshes from config using Modeler components."""
        # Purge existing environment if we are switching types or forcing
        if env_cfg or force:
            coll = bpy.data.collections.get("7b.ENVIRONMENT")
            if coll:
                for obj in list(coll.objects):
                    bpy.data.objects.remove(obj, do_unlink=True)
            # Legacy/Procedural cleanup
            for name in ["Env", "mountain_face", "forest_road", "mountain_apron"]:
                old = bpy.data.objects.get(name)
                if old: bpy.data.objects.remove(old, do_unlink=True)

        if env_cfg:
            e_type = env_cfg.get("type", "exterior")
            modeler_id = "ExteriorModeler" if e_type == "exterior" else ("ForestRoadModeler" if e_type == "forest_road" else "MountainBaseModeler")
            modeler_cls = registry.get_modeling(modeler_id)
            if modeler_cls:
                modeler_cls().build_mesh("Env", env_cfg)
            return

        # Default fallback (Greenhouse Exterior)
        if bpy.data.objects.get("Env") and not force: return
        
        from environment.exterior import ExteriorModeler
        from environment.backdrop import BackdropModeler
        from environment.interior import InteriorModeler
        ExteriorModeler().build_mesh("Env", config.config.get("environment", {}))
        if not bpy.data.objects.get("Chroma"):
            BackdropModeler().build_mesh("Chroma", config.config.get("chroma", {}))
        if not bpy.data.objects.get("Interior"):
            InteriorModeler().build_mesh("Interior", config.config.get("interior", {}))

    def setup_lighting(self):
        """Constructs lighting rigs from config."""
        env_coll = self._ensure_collection(self.coll_env)
        total_f = config.config.total_frames
        for light_id, l_cfg in self.lc_cfg.get("lighting", {}).items():
            if l_cfg.get("deprecated", False): continue
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

            # Pulse heartbeat - ensure it covers the entire production range (extended scenes)
            actual_total_f = total_f
            for m in bpy.context.scene.timeline_markers:
                if m.frame > actual_total_f: actual_total_f = m.frame
            
            base_energy = l_cfg.get("energy", 1.0)
            for f in range(1, actual_total_f + 1, 24):
                pulse = 1.0 + 0.08 * math.sin(2.0 * math.pi * 0.5 * (f / 24.0))
                l_data.energy = base_energy * pulse
                l_data.keyframe_insert(data_path="energy", frame=f)

    def apply_sequencing(self):
        """Orchestrates timeline markers based on sequencing rules."""
        scene = bpy.context.scene; scene.timeline_markers.clear()
        seq = self.lc_cfg.get("sequencing", {})
        for key in ["intro", "main_open", "outro"]:
            cfg_s = seq.get(key)
            if cfg_s:
                m = scene.timeline_markers.new(key.capitalize(), frame=cfg_s["start"])
                m.camera = bpy.data.objects.get(cfg_s["camera"])
        cycle = seq.get("cycle")
        if cycle:
            frame, end, order, durs, c_idx = cycle["start"], cycle["end"], cycle["order"], cycle["durations"], 0
            while frame < end:
                c_type = order[c_idx % len(order)]; cam_name = c_type
                if c_type == "Ots": cam_name = "Ots1" if (c_idx // len(order)) % 2 == 0 else "Ots2"
                if c_type == "Antag": cam_name = f"Antag{(c_idx // len(order)) % 4 + 1}"
                cam_obj = bpy.data.objects.get(cam_name)
                if cam_obj:
                    m = scene.timeline_markers.new(f"Shot_{cam_name}_{frame}", frame=frame); m.camera = cam_obj
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
            if entity and "default_pos" in entity: rig.location = mathutils.Vector(entity["default_pos"])
            else:
                angle = (i / max(num-1, 1)) * math.pi * fan_width - math.pi * (fan_width/2); dist = fan_dist + (i % 2) * var_dist
                rig.location = (math.sin(angle)*dist, center_y + math.cos(angle)*4.0, 0.0)
            wide_pos = mathutils.Vector((0, 8, 2)); vec = wide_pos - rig.location; rig.rotation_euler[2] = vec.to_track_quat('Y', 'Z').to_euler().z + (math.pi/2)
            self._ground_rig_to_zero(rig); rig.keyframe_insert(data_path="location", frame=1); rig.keyframe_insert(data_path="rotation_euler", index=2, frame=1)

    def position_protagonists(self):
        """Faces Herbaceous and Arbor toward each other."""
        protag_objs = [o for o in bpy.data.objects if o.get("is_protagonist")]
        herb = next((o for o in protag_objs if "Herbaceous" in o.name and o.type == 'ARMATURE'), None)
        arbor = next((o for o in protag_objs if "Arbor" in o.name and o.type == 'ARMATURE'), None)
        
        if herb:
            herb.location = mathutils.Vector((-1.2, 0.5, herb.location.z))
            self._ground_rig_to_zero(herb)
            # Ensure visible
            for c in herb.children_recursive:
                if c.type == 'MESH': c.hide_render = False; c.keyframe_insert(data_path="hide_render", frame=1)
        if arbor:
            arbor.location = mathutils.Vector((1.2, 0.5, arbor.location.z))
            self._ground_rig_to_zero(arbor)
            # Ensure visible
            for c in arbor.children_recursive:
                if c.type == 'MESH': c.hide_render = False; c.keyframe_insert(data_path="hide_render", frame=1)
        
        if herb and arbor:
            bpy.context.view_layer.update()
            vec_h = arbor.location - herb.location; vec_a = herb.location - arbor.location
            herb.rotation_euler[2] = vec_h.to_track_quat('Y', 'Z').to_euler().z + math.pi; arbor.rotation_euler[2] = vec_a.to_track_quat('Y', 'Z').to_euler().z + math.pi

    def apply_storyline(self):
        """Executes storyline events defined in movie_config.json."""
        for beat in config.config.get("ensemble.storyline", []):
            for event in beat.get("events", []): self._execute_event(event)

    def apply_scene_animations(self):
        """Orchestrates continuous timeline animations for all characters."""
        anim_handler = AnimationHandler(); total_f = config.config.total_frames
        # Use tagging for robust protagonist detection
        protag_objs = [o for o in bpy.data.objects if o.get("is_protagonist")]
        herb = next((o for o in protag_objs if "Herbaceous" in o.name and o.type == 'ARMATURE'), None)
        arbor = next((o for o in protag_objs if "Arbor" in o.name and o.type == 'ARMATURE'), None)
        
        if herb:
            anim_handler.apply_animation(herb, "talking", 1, duration=3000)
            anim_handler.apply_animation(herb, "nod", 120)
            anim_handler.apply_animation(herb, "dance", 3000, duration=1200)
        if arbor:
            anim_handler.apply_animation(arbor, "talking", 1, duration=2999)
            anim_handler.apply_animation(arbor, "shake", 300)
            anim_handler.apply_animation(arbor, "dance", 3000, duration=1200)
        
        majesty = bpy.data.objects.get("Sylvan_Majesty.Rig")
        if majesty: anim_handler.apply_animation(majesty, "idle", 1, duration=3000); anim_handler.apply_animation(majesty, "dance", 3000, duration=1200)
        
        aura = bpy.data.objects.get("Radiant_Aura.Rig")
        if aura: anim_handler.apply_animation(aura, "dance", 1, duration=total_f)
        
        weaver = bpy.data.objects.get("Shadow_Weaver.Rig")
        if weaver: anim_handler.apply_animation(weaver, "shake", 1, duration=599); anim_handler.apply_animation(weaver, "dance", 600, duration=total_f - 600)
        
        can = bpy.data.objects.get("WaterCan"); hose = bpy.data.objects.get("GardenHose")
        if can: self._animate_blessing(can, 1800, 3000); 
        if hose: self._animate_blessing(hose, 1800, 3000)
        
        spirits = [o for o in bpy.data.objects if ".Rig" in o.name and o not in [herb, arbor, majesty, aura, weaver]]
        tags = ["dance", "nod", "shake", "idle"]
        for i, spirit in enumerate(spirits):
            tag = tags[i % len(tags)]; anim_handler.apply_animation(spirit, tag, 1, duration=total_f // 2); anim_handler.apply_animation(spirit, "dance", (total_f // 2) + 1, duration=total_f // 2)
        self.apply_patrol_animations()

    def apply_patrol_animations(self):
        paths = config.config.get("patrol_paths", {})
        total_f = config.config.total_frames
        for entity in config.config.get("ensemble.entities", []):
            patrol = entity.get("patrol")
            if not patrol or not patrol.get("enabled"): continue
            rig = bpy.data.objects.get(f"{entity['id']}.Rig") or bpy.data.objects.get(entity['id'])
            if not rig: continue
            waypts = paths.get(patrol["path"], {}).get("waypoints", [])
            if not waypts: continue
            
            speed = patrol.get("speed_frames_per_unit", 8)
            offset = patrol.get("start_offset", 0.0)
            h = patrol.get("height", 0.0)
            
            # Compute total distance of path
            segments = []
            total_dist = 0
            for i in range(len(waypts)-1):
                d = (mathutils.Vector(waypts[i+1]) - mathutils.Vector(waypts[i])).length
                segments.append(d); total_dist += d
            
            start_dist = offset * total_dist
            curr_dist = 0; frame = 1
            while frame <= total_f:
                # Find current segment based on curr_dist + start_dist
                target_d = (curr_dist + start_dist) % total_dist if total_dist > 0 else 0
                seg_accum = 0; seg_idx = 0
                for i, d in enumerate(segments):
                    if seg_accum + d >= target_d:
                        seg_idx = i; break
                    seg_accum += d
                
                t = (target_d - seg_accum) / segments[seg_idx] if segments[seg_idx] > 0 else 0
                p0 = mathutils.Vector(waypts[seg_idx]); p1 = mathutils.Vector(waypts[seg_idx+1])
                pos = p0.lerp(p1, t); pos.z = h
                rig.location = pos; rig.keyframe_insert(data_path="location", frame=frame)
                
                # Rotation (face forward)
                # Rotation (face forward)
                fwd = (p1 - p0).normalized()
                rig.rotation_euler[2] = math.atan2(fwd.y, fwd.x) - math.pi/2
                rig.keyframe_insert(data_path="rotation_euler", index=2, frame=frame)
                
                frame += 5; curr_dist += 5 / speed

    def apply_extended_scene(self, scene_path):
        """Loads an extended scene JSON and applies its events/environment."""
        full_path = os.path.join(M7_ROOT, scene_path)
        if not os.path.exists(full_path):
            print(f"ERROR: Scene config not found: {full_path}")
            return
            
        with open(full_path, 'r') as f:
            cfg = json.load(f)
        
        # 1. Environment Switch
        env = cfg.get("environment")
        if env:
            etype = env.get("type")
            print(f"Switching environment to: {etype}")
            # Clean up old environment
            for name in ["Env", "mountain_face", "forest_road", "mountain_apron"]:
                old = bpy.data.objects.get(name)
                if old: bpy.data.objects.remove(old, do_unlink=True)
            
            if etype == "forest_road":
                from environment.forest_road import ForestRoadModeler
                ForestRoadModeler().build_mesh("Env", env)
            elif etype == "mountain_base":
                from environment.mountain_base import MountainBaseModeler
                MountainBaseModeler().build_mesh("Env", env)
            else:
                from environment.exterior import ExteriorModeler
                ExteriorModeler().build_mesh("Env", env)
            
        # 2. Event Execution
        for beat in cfg.get("story_beats", []):
            for event in beat.get("events", []):
                self._execute_event(event)
                
        # 3. Camera Sequence
        scene = bpy.context.scene
        for cam_cfg in cfg.get("camera_sequence", []):
            m = scene.timeline_markers.new(f"Shot_{cam_cfg['camera']}_{cam_cfg['start']}", frame=cam_cfg["start"])
            cam_obj = bpy.data.objects.get(cam_cfg["camera"])
            if cam_obj: m.camera = cam_obj

    def _execute_event(self, event):
        target = event["target"]; action = event["action"]; params = event["params"]
        objs = []
        if target == "ALL": objs = [o for o in bpy.data.objects if ".Rig" in o.name]
        elif target == "ENSEMBLE": objs = [o for o in bpy.data.objects if ".Rig" in o.name and not o.get("is_protagonist")]
        else: objs = [bpy.data.objects.get(f"{target}.Rig") or bpy.data.objects.get(target)]
        
        for i, obj in enumerate([o for o in objs if o]):
            if action == "visibility":
                for c in obj.children_recursive:
                    if c.type == 'MESH':
                        if "hidden_at" in params:
                            c.hide_render = True; c.keyframe_insert(data_path="hide_render", frame=params["hidden_at"])
                        if "visible_at" in params:
                            c.hide_render = False; c.keyframe_insert(data_path="hide_render", frame=params["visible_at"])
            elif action == "altitude":
                obj.location.z = 0; obj.keyframe_insert(data_path="location", index=2, frame=1)
                obj.location.z = params["height"]; obj.keyframe_insert(data_path="location", index=2, frame=params["frames"])
            elif action == "animate":
                AnimationHandler().apply_animation(obj, params["tag"], event.get("start", 1), params.get("duration"))
            elif action == "move_to":
                start_f = event.get("start", 1); duration = params.get("duration_frames", 60)
                dest = mathutils.Vector(params["destination_pos"])
                # Formation offsets
                formation = params.get("formation")
                if formation == "loose_cluster":
                    dest += mathutils.Vector((random.uniform(-1, 1), random.uniform(-1, 1), 0))
                elif formation == "arc":
                    angle = (i / max(len(objs)-1, 1)) * math.pi * 0.5 - math.pi * 0.25
                    dest += mathutils.Vector((math.sin(angle) * 2.0, math.cos(angle) * 2.0, 0))
                
                obj.keyframe_insert(data_path="location", frame=start_f)
                obj.location = dest; obj.keyframe_insert(data_path="location", frame=start_f + duration)
            elif action == "open_door":
                door = next((c for c in obj.children_recursive if "_Door" in c.name), None)
                if door:
                    start_f = event.get("start", 1); duration = params.get("duration_frames", 30)
                    door.keyframe_insert(data_path="rotation_euler", index=1, frame=start_f)
                    door.rotation_euler[1] = -math.pi/2; door.keyframe_insert(data_path="rotation_euler", index=1, frame=start_f + duration)
            elif action == "enter_vehicle":
                v_id = params["vehicle_id"]; vehicle = bpy.data.objects.get(v_id)
                if vehicle:
                    stagger = params.get("stagger_frames", 0) * i
                    start_f = event.get("start", 1) + stagger; dest = mathutils.Vector(params.get("entry_pos", [0,0,0.5]))
                    con = obj.constraints.get("ChildOf_Vehicle") or obj.constraints.new(type='CHILD_OF')
                    con.name = "ChildOf_Vehicle"; con.target = vehicle
                    con.influence = 0.0; con.keyframe_insert(data_path="influence", frame=1)
                    con.influence = 0.0; con.keyframe_insert(data_path="influence", frame=start_f)
                    con.influence = 1.0; con.keyframe_insert(data_path="influence", frame=start_f + 1)
                    bpy.context.view_layer.update()
                    con.inverse_matrix = vehicle.matrix_world.inverted()
                    obj.keyframe_insert(data_path="location", frame=start_f)
                    obj.location = dest; obj.keyframe_insert(data_path="location", frame=start_f + 30)
                    # Heads should appear out of top, no longer hiding occupants
            elif action == "exit_vehicle":
                stagger = params.get("stagger_frames", 0) * i
                start_f = event.get("start", 1) + stagger; dest = mathutils.Vector(params.get("exit_pos", [0,0,0]))
                con = obj.constraints.get("ChildOf_Vehicle")
                if con:
                    con.influence = 1.0; con.keyframe_insert(data_path="influence", frame=start_f)
                    con.influence = 0.0; con.keyframe_insert(data_path="influence", frame=start_f + 1)
                for c in obj.children_recursive:
                    if c.type == 'MESH':
                        c.hide_render = False; c.keyframe_insert(data_path="hide_render", frame=start_f)
                obj.location = dest; obj.keyframe_insert(data_path="location", frame=start_f)
                obj.keyframe_insert(data_path="location", frame=start_f + 30)
            elif action == "climb":
                stagger = params.get("stagger_frames", 0) * i
                start_f = params["start_frame"] + stagger; end_f = params["end_frame"] + stagger
                sz, ez = params["start_z"], params["end_z"]
                obj.location.z = sz; obj.keyframe_insert(data_path="location", index=2, frame=start_f)
                obj.location.z = ez; obj.keyframe_insert(data_path="location", index=2, frame=end_f)
                # Forward tilt
                obj.rotation_euler[0] = math.radians(15); obj.keyframe_insert(data_path="rotation_euler", index=0, frame=start_f)
                amp = params.get("sway_amp", 0.05)
                for f in range(start_f, end_f + 1, 5):
                    obj.location.x += math.sin(f * 0.2) * amp; obj.keyframe_insert(data_path="location", index=0, frame=f)

    def _animate_blessing(self, prop_obj, start_frame, end_frame):
        if not prop_obj.animation_data: prop_obj.animation_data_create()
        base_z = prop_obj.location.z
        for f in range(start_frame, end_frame, 30):
            prop_obj.location.z = base_z + math.sin(f * 0.1) * 0.5; prop_obj.keyframe_insert(data_path="location", index=2, frame=f)
            prop_obj.rotation_euler[0] = math.sin(f * 0.05) * 0.2; prop_obj.rotation_euler[2] = f * 0.01
            prop_obj.keyframe_insert(data_path="rotation_euler", index=0, frame=f); prop_obj.keyframe_insert(data_path="rotation_euler", index=2, frame=f)

    def _setup_camera_path(self, cam_obj, anim):
        points = anim["points"]; path_name = f"Path_{cam_obj.name}"; curve_obj = bpy.data.objects.get(path_name)
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
            if obj.type == 'MESH' and next((mod for mod in obj.modifiers if mod.type == 'ARMATURE' and mod.object == rig), None): meshes.append(obj)
        if not meshes: return
        min_z = None
        for mesh in meshes:
            for corner in mesh.bound_box:
                z = (mesh.matrix_world @ mathutils.Vector(corner)).z
                min_z = z if min_z is None else min(min_z, z)
        if min_z is not None: rig.location.z -= min_z
