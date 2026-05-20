import movie_configuration as mc
import bpy
import os
import json
import math
from calligraphy import CalligraphyDirector
from camera.controls import CameraControls
from camera.lighting import LightingManager
from environment import character_placement
from registry import registry

M10_ROOT = os.path.dirname(os.path.abspath(__file__))

class Director:
    """
    Orchestrates Movie 10 production using context-aware environment assembly.
    Maintains full compatibility with the therapeutic audit suite.
    """

    def __init__(self, lc_config_path=None):
        self._setup_cinematics(lc_config_path)
        self.scene_cfg = {}

    def _setup_cinematics(self, path):
        lc_path = path or os.path.join(M10_ROOT, "lights_camera.json")
        with open(lc_path, 'r') as f:
            self.lc_cfg = json.load(f)
        self.camera_controls = CameraControls(self.lc_cfg, coll_cameras=mc.coll_cameras, coll_env=mc.coll_environment)
        self.lighting_manager = LightingManager(self.lc_cfg)

    def load_scene(self, scene_id):
        """Loads scene config from JSON."""
        path = os.path.join(M9_ROOT, "scene_configs", f"{scene_id}.json")
        if not os.path.exists(path):
            return False
        with open(path, 'r') as f:
            self.scene_cfg = json.load(f)
        return True

    def _keyframe_visibility(self, obj, frame, hide):
        obj.hide_render = hide
        obj.keyframe_insert(data_path="hide_render", frame=frame)
        obj.hide_viewport = hide
        obj.keyframe_insert(data_path="hide_viewport", frame=frame)
        for child in obj.children:
            self._keyframe_visibility(child, frame, hide)

    def setup_environment(self, force=False, start_f=1, end_f=None):
        """Assembles environment by filtering parameters based on context."""
        bpy.data.collections.get(mc.coll_assets) or bpy.data.collections.new(mc.coll_assets)
        # Instead of destructively purging, we manage visibility for multi-scene files
        coll = bpy.data.collections.get(mc.coll_environment)
        if not coll:
            coll = bpy.data.collections.new(mc.coll_environment)
            bpy.context.scene.collection.children.link(coll)

        raw_params = self.scene_cfg.get("environment", mc.get("environment", {}))
        env_type = raw_params.get("type", "exterior")
        context = raw_params.get("context", "greenhouse" if env_type == "interior" else "exterior")

        # Declarative pre-filtering for isolation
        filtered_params = self._filter_params(raw_params, context)

        # Create a container for this specific environment to handle visibility
        env_name = f"Env_{env_type}_{start_f}"
        env_root = bpy.data.objects.new(env_name, None)
        coll.objects.link(env_root)

        modeler_cls = registry.get_modeling(self._resolve_modeler_id(env_type))
        if modeler_cls:
            # Standardized name for test compatibility, but parented to our env_root
            mesh_root = modeler_cls().build_mesh("Env", filtered_params)
            if mesh_root:
                mesh_root.parent = env_root

        self._build_ancillary_systems(start_f, env_type, env_root, force=force)

        # Keyframe visibility
        if start_f > 1 or end_f is not None:
            # Hide before start
            if start_f > 1:
                self._keyframe_visibility(env_root, 1, True)

            self._keyframe_visibility(env_root, start_f, False)

            if end_f is not None:
                self._keyframe_visibility(env_root, end_f + 1, True)

            # Toggle other environments
            for other in coll.objects:
                if other != env_root and (other.name.startswith("Env_") or other.name.startswith("Interior_") or other.name.startswith("Chroma")):
                    if not other.parent: # Only toggle root objects
                        # Hide other environment during this new one
                        self._keyframe_visibility(other, start_f, True)
                        # Restore after if this one ends
                        if end_f is not None:
                            self._keyframe_visibility(other, end_f + 1, False)
        else:
            self._keyframe_visibility(env_root, 1, False)
        for asset_id in mc.get("context_constraints.greenhouse.disallowed_assets", []):
            obj = bpy.data.objects.get(asset_id)
            if obj:
                obj.hide_render = True
                obj.hide_viewport = True

    def _filter_params(self, params, context):
        disallowed = mc.get(f"context_constraints.{context}.disallowed_assets", [])
        return {k: v for k, v in params.items() if k not in disallowed}

    def _resolve_modeler_id(self, env_type):
        return {
            "exterior": "ExteriorModeler",
            "interior": "ExteriorModeler",
            "forest_road": "ForestRoadModeler",
            "mountain_base": "MountainBaseModeler"
        }.get(env_type, "ExteriorModeler")

    def position_protagonists(self):
        """Faces protagonists toward each other for resonance."""
        # Fix: ensure objects are fetched using standard IDs
        herb = bpy.data.objects.get("Herbaceous.Rig") or bpy.data.objects.get("Herbaceous")
        arbor = bpy.data.objects.get("Arbor.Rig") or bpy.data.objects.get("Arbor")
        if herb and arbor:
            bpy.context.view_layer.update()
            character_placement.set_eyeline_alignment(herb, arbor)
            character_placement.set_eyeline_alignment(arbor, herb)

    def _clear_environment_collection(self):
        coll = bpy.data.collections.get(mc.coll_environment)
        if coll: self._recursive_purge(coll)

    def _recursive_purge(self, coll):
        for obj in list(coll.objects): bpy.data.objects.remove(obj, do_unlink=True)
        for sub in list(coll.children): self._recursive_purge(sub)

    def _build_ancillary_systems(self, start_f, env_type, parent_root=None, force=False):
        # Interior Model
        int_cfg = self.scene_cfg.get("interior", mc.get("interior", {}))
        int_cls = registry.get_modeling("InteriorModeler")
        if int_cls and (env_type == "interior" or (int_cfg and not force)):
            mesh = int_cls().build_mesh(f"Interior_{start_f}", int_cfg)
            if mesh and parent_root: mesh.parent = parent_root

        # Backdrop
        from environment.backdrop import BackdropModeler
        chroma_cfg = mc.get("chroma", {})
        if chroma_cfg:
            # We don't have a direct return of the mesh for backdrop yet, but we can parent its objects
            BackdropModeler().build_mesh("Chroma", chroma_cfg)
            if parent_root:
                for obj in bpy.data.collections.get(mc.coll_environment).objects:
                    if obj.name.startswith("chroma_backdrop_") and not obj.parent:
                        obj.parent = parent_root

    def apply_sequencing(self):
        """Sets timeline markers, prioritizing fixed beats over cycle logic."""
        self.camera_controls.setup_cinematics(mc.total_frames)
        scene = bpy.context.scene; scene.timeline_markers.clear()

        # Resolve fixed beats from config
        fixed_beats = []
        seq_cfg = self.lc_cfg.get("sequencing", {})
        for key, cfg in seq_cfg.items():
            if key == "cycle": continue
            if "camera" in cfg and "start" in cfg:
                fixed_beats.append({
                    "name": key.capitalize(),
                    "camera": cfg["camera"],
                    "start": cfg["start"],
                    "end": cfg.get("end", cfg["start"] + 1)
                })

        # Cycle Logic
        cycle = seq_cfg.get("cycle", {})
        if cycle:
            curr = cycle.get("start", 504)
            end = cycle.get("end", 4150)
            order = cycle.get("order", [])
            durations = cycle.get("durations", {})

            while curr < end:
                for cam_tag in order:
                    if curr >= end: break

                    # Check for overlap with fixed narrative beats
                    overlap = next((b for b in fixed_beats if b["start"] <= curr < b["end"]), None)
                    if overlap:
                        curr = overlap["end"]
                        break

                    dur = durations.get(cam_tag, 60)
                    # Resolve tag to object (Ots -> Ots1)
                    cam_name = cam_tag if bpy.data.objects.get(cam_tag) else f"{cam_tag}1"
                    cam_obj = bpy.data.objects.get(cam_name)
                    if cam_obj:
                        m = scene.timeline_markers.new(f"Shot_{cam_name}", frame=curr)
                        m.camera = cam_obj
                    curr += dur

        # Apply Fixed Markers (ensure they exist regardless of cycle state)
        for beat in fixed_beats:
            m_name = f"Shot_{beat['camera']}" if "interaction" in beat["name"].lower() else beat["name"]
            m = scene.timeline_markers.new(m_name, frame=beat["start"])
            m.camera = bpy.data.objects.get(beat["camera"])

        # V10 Extended Cycle Support (5001-10000)
        v10_seq = seq_cfg.get("v10_extended_cycle", {})
        if v10_seq and v10_seq.get("cycle"):
            v10_cycle = v10_seq["cycle"]
            curr = v10_seq.get("start", 5001)
            end = v10_seq.get("end", 10000)
            order = v10_cycle.get("order", [])
            durations = v10_cycle.get("durations", {})

            while curr < end:
                for cam_tag in order:
                    if curr >= end: break
                    dur = durations.get(cam_tag, 60)
                    cam_obj = bpy.data.objects.get(cam_tag)
                    if cam_obj:
                        m = scene.timeline_markers.new(f"V10_Shot_{cam_tag}", frame=curr)
                        m.camera = cam_obj
                    curr += dur

    def apply_extended_scene(self, path):
        character_placement.load_extended_scene(path, self)

    # Required Shims for Test Compatibility
    def setup_cinematics(self): self.apply_sequencing()
    def setup_calligraphy(self):
        CalligraphyDirector(self.lc_cfg, mc.total_frames, M10_ROOT).apply()
        def _calligraphy_visibility(scene):
            obj = bpy.data.objects.get("GreenhouseMD_Calligraphy")
            if obj:
                visible = scene.frame_current <= 5 or scene.frame_current >= mc.total_frames - 4
                obj.hide_render = not visible
                obj.hide_viewport = not visible
        bpy.app.handlers.frame_change_post[:] = [
            h for h in bpy.app.handlers.frame_change_post
            if getattr(h, "__name__", "") != "_calligraphy_visibility"
        ]
        bpy.app.handlers.frame_change_post.append(_calligraphy_visibility)
    def initialize_entities(self):
        for ent in self.scene_cfg.get("entities", []):
            obj = bpy.data.objects.get(f"{ent['id']}.Rig") or bpy.data.objects.get(ent['id'])
            if obj:
                obj.location, obj.rotation_euler = ent.get("pos", (0,0,0)), ent.get("rot", (0,0,0))
                character_placement.ground_to_zero(obj)
    def compose_ensemble(self):
        spirits = [o for o in bpy.data.objects if ".Rig" in o.name and not o.get("is_protagonist")]
        character_placement.compose_ensemble(spirits, mc.get("ensemble.entities", []))
    def apply_scene_animations(self):
        from animation.patrol import apply_patrol
        for ent in mc.get("ensemble.entities", []):
            p = ent.get("patrol")
            if p and p.get("enabled"):
                rig = bpy.data.objects.get(f"{ent['id']}.Rig")
                if rig: apply_patrol(rig, p, mc.total_frames)
    def apply_storyline(self):
        beats = self.scene_cfg.get("storyline", mc.get("ensemble.storyline", []))
        for beat in beats:
            for event in beat.get("events", []):
                character_placement.execute_event(event, context_director=self)
    def setup_lighting(self): self.lighting_manager.setup_lights()
    def apply_context_constraints(self, name): pass
