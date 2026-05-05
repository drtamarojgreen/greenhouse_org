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
from camera.controls import CameraControls
from camera.lighting import LightingManager
from environment import character_placement
from registry import registry

# Ensure Movie 9 root is in sys.path
M9_ROOT = os.path.dirname(os.path.abspath(__file__))
if M9_ROOT not in sys.path:
    sys.path.insert(0, M9_ROOT)

class Director:
    """
    Generic Data-Driven Director for Movie 9.
    Orchestrates cinematic production by loading per-scene configurations.
    """

    def __init__(self, lc_config_path=None):
        if not lc_config_path:
            lc_config_path = os.path.join(M9_ROOT, "lights_camera.json")
        with open(lc_config_path, 'r') as f:
            self.lc_cfg = json.load(f)
        
        self.coll_cameras = config.config.coll_cameras
        self.coll_env = config.config.coll_environment
        self.scene_cfg = {}
        self.camera_controls = CameraControls(self.lc_cfg)
        self.lighting_manager = LightingManager(self.lc_cfg)

    def load_scene(self, scene_id):
        """Loads a specific scene configuration from JSON."""
        path = os.path.join(M9_ROOT, "scene_configs", f"{scene_id}.json")
        if not os.path.exists(path):
            print(f"ERROR: Scene configuration not found: {path}")
            return False
        with open(path, 'r') as f:
            self.scene_cfg = json.load(f)
        print(f"Scene '{scene_id}' loaded successfully.")
        return True

    def setup_cinematics(self):
        """Delegates to modular camera controls and lighting."""
        total_f = self.scene_cfg.get("total_frames", config.config.total_frames)
        self.camera_controls.setup_cinematics(total_f)
        
        # Setup lighting for the scene
        lighting_override = self.scene_cfg.get("environment", {}).get("lighting_override")
        self.lighting_manager.setup_lights(override_type=lighting_override)

    def setup_calligraphy(self):
        """Sets up intro/outro calligraphy branding."""
        total_f = self.scene_cfg.get("total_frames", config.config.total_frames)
        CalligraphyDirector(self.lc_cfg, total_f, M9_ROOT).apply()

    def setup_environment(self, force=False, start_f=None, end_f=None):
        """Builds static and dynamic environment assets from configuration."""
        is_global = (start_f is None and end_f is None)
        
        # Only purge if it's the root/global setup call
        if is_global:
            env_coll = bpy.data.collections.get(config.config.coll_environment)
            if env_coll:
                def purge_coll(c):
                    for sub in list(c.children): purge_coll(sub)
                    for obj in list(c.objects): bpy.data.objects.remove(obj, do_unlink=True)
                purge_coll(env_coll)

        env_cfg = self.scene_cfg.get("environment", config.config.get("environment", {}))
        if not env_cfg:
            print("Warning: No environment configuration found in scene JSON.")
            return

        # Determine frame range
        if start_f is None: start_f = self.scene_cfg.get("start_frame", 1)
        if end_f is None: end_f = self.scene_cfg.get("end_frame", config.config.total_frames)

        e_type = env_cfg.get("type", "exterior")
        context_name = "greenhouse" if e_type == "interior" else e_type

        # Build appropriate environment
        modeler_id = "ExteriorModeler" if e_type in ["exterior", "interior"] else ("ForestRoadModeler" if e_type == "forest_road" else "MountainBaseModeler")
        modeler_cls = registry.get_modeling(modeler_id)
        
        env_root = None
        if modeler_cls:
            # Pass start_f to modeler to create unique object names if needed
            modeler_cls().build_mesh(f"Env_{e_type}_{start_f}", env_cfg)
            env_root = bpy.data.objects.get(f"Env_{e_type}_{start_f}")

        # Interior
        interior_cfg = self.scene_cfg.get("interior", config.config.get("interior", {}))
        int_cls = registry.get_modeling("InteriorModeler")
        if int_cls and (interior_cfg or e_type == "interior"):
            int_cls().build_mesh(f"Interior_{start_f}", interior_cfg)
            if not env_root: env_root = bpy.data.objects.get(f"Interior_{start_f}")

        # Apply visibility keyframing for this environment block
        # If no root returned, look for generic 'Env' or 'Interior'
        if not env_root:
            env_root = bpy.data.objects.get("Env") or bpy.data.objects.get("Interior")

        if env_root:
            # Hide everywhere else, show only in range
            def set_visibility_recursive(obj, hidden):
                obj.hide_render = hidden; obj.hide_viewport = hidden
                obj.keyframe_insert(data_path="hide_render", frame=bpy.context.scene.frame_current)
                obj.keyframe_insert(data_path="hide_viewport", frame=bpy.context.scene.frame_current)
                for child in obj.children: set_visibility_recursive(child, hidden)

            current_f = bpy.context.scene.frame_current
            
            # 1. Start of movie: Hidden
            bpy.context.scene.frame_set(1)
            set_visibility_recursive(env_root, True)
            
            # 2. Start of scene: Visible
            bpy.context.scene.frame_set(start_f)
            set_visibility_recursive(env_root, False)
            
            # 3. End of scene: Hidden
            if end_f < config.config.total_frames:
                bpy.context.scene.frame_set(end_f + 1)
                set_visibility_recursive(env_root, True)
            
            bpy.context.scene.frame_set(current_f)

        self.apply_context_constraints(context_name, start_f, end_f)

        # Backdrop
        from environment.backdrop import BackdropModeler
        chroma_cfg = config.config.get("chroma", {})
        if chroma_cfg:
            BackdropModeler().build_mesh("Chroma", chroma_cfg)

    def initialize_entities(self):
        """Data-driven initialization of scene entities (protagonists, vehicles, etc)."""
        entities = self.scene_cfg.get("entities", [])
        for ent in entities:
            e_id = ent["id"]
            e_type = ent["type"]
            
            print(f"Initializing entity: {e_id} ({e_type})")
            
            # Position and Scale
            obj = bpy.data.objects.get(f"{e_id}.Rig") or bpy.data.objects.get(e_id)
            if obj:
                obj.location = ent.get("pos", (0,0,0))
                obj.rotation_euler = ent.get("rot", (0,0,0))
                obj.scale = [ent.get("scale", 1.0)] * 3
                if ent.get("is_protagonist"):
                    obj["is_protagonist"] = True
                character_placement.ground_to_zero(obj)

    def position_protagonists(self):
        """Faces protagonists toward each other if configured in the scene."""
        protag_objs = [o for o in bpy.data.objects if o.get("is_protagonist")]
        if len(protag_objs) >= 2:
            bpy.context.view_layer.update()
            character_placement.set_eyeline_alignment(protag_objs[0], protag_objs[1])
            character_placement.set_eyeline_alignment(protag_objs[1], protag_objs[0])


    def apply_sequencing(self):
        """
        Orchestrates timeline markers based on sequencing rules.
        Professional-Grade Pacing: Handles rapid camera cuts and a wide variety of focal lengths.
        """
        scene = bpy.context.scene; scene.timeline_markers.clear()
        seq = self.lc_cfg.get("sequencing", {})

        # 1. Apply named sequence blocks (including custom therapeutic beats)
        for key, cfg_s in seq.items():
            if key == "cycle": continue
            if "camera" in cfg_s and "start" in cfg_s:
                m = scene.timeline_markers.new(key.capitalize(), frame=cfg_s["start"])
                m.camera = bpy.data.objects.get(cfg_s["camera"])

        # 2. Apply the procedural cycle (respecting existing named markers)
        cycle = seq.get("cycle")
        if cycle:
            # Gather frames occupied by named sequence blocks to avoid overlap
            occupied_frames = []
            for key, cfg_s in seq.items():
                if key == "cycle": continue
                if "start" in cfg_s and "end" in cfg_s:
                    occupied_frames.append((cfg_s["start"], cfg_s["end"]))

            frame, end, order, durs, c_idx = cycle["start"], cycle["end"], cycle["order"], cycle["durations"], 0
            while frame < end:
                skip = False
                for start_occ, end_occ in occupied_frames:
                    if start_occ <= frame < end_occ:
                        frame = end_occ # Jump to end of named sequence
                        skip = True; break
                if skip: continue

                c_type = order[c_idx % len(order)]; cam_name = c_type
                if c_type == "Ots": cam_name = "Ots1" if (c_idx // len(order)) % 2 == 0 else "Ots2"
                if c_type == "Antag": cam_name = f"Antag{(c_idx // len(order)) % 4 + 1}"

                cam_obj = bpy.data.objects.get(cam_name)
                if cam_obj:
                    m = scene.timeline_markers.new(f"Shot_{cam_name}_{frame}", frame=frame); m.camera = cam_obj

                # Pacing: Increment frame based on duration configuration (defaults to 60 for professional cuts)
                frame += durs.get(c_type, 60); c_idx += 1

    def compose_ensemble(self):
        """Delegates ensemble composition to character_placement module."""
        spirits = sorted([o for o in bpy.data.objects if ".Rig" in o.name and not o.get("is_protagonist")], key=lambda o: o.name)
        ensemble_cfg = config.config.get("ensemble.entities", [])
        character_placement.compose_ensemble(spirits, ensemble_cfg)

    def apply_scene_animations(self):
        """Orchestrates all procedural and storyline animations."""
        self.apply_patrol_animations()
        # Any additional per-scene animation logic can go here.

    def apply_patrol_animations(self):
        """Data-driven patrol logic using modular animation sub-package."""
        from animation.patrol import apply_patrol
        total_f = self.scene_cfg.get("total_frames", config.config.total_frames)
        for entity in config.config.get("ensemble.entities", []):
            patrol = entity.get("patrol")
            if not patrol or not patrol.get("enabled"): continue
            rig = bpy.data.objects.get(f"{entity['id']}.Rig") or bpy.data.objects.get(entity['id'])
            if rig:
                apply_patrol(rig, patrol, total_f)

    def apply_extended_scene(self, scene_path):
        """Swaps the entire environmental context for sub-beats (boarding, driving)."""
        character_placement.load_extended_scene(scene_path, self)
        # Re-apply context constraints for the new environment
        env_cfg = self.scene_cfg.get("environment", {})
        start_f = self.scene_cfg.get("start_frame", 1)
        end_f = self.scene_cfg.get("end_frame", config.config.total_frames)
        self.apply_context_constraints(env_cfg.get("type", "exterior"), start_f, end_f)

    def _ensure_collection(self, name):
        coll = bpy.data.collections.get(name) or bpy.data.collections.new(name)
        if coll.name not in bpy.context.scene.collection.children:
            bpy.context.scene.collection.children.link(coll)
        return coll

    # --- Compatibility Wrappers for Legacy Tests ---
    def setup_lighting(self):
        """Orchestrates lighting across all scenes, applying overrides where specified."""
        # 1. Base/Global Lighting
        self.lighting_manager.setup_lights()
        
        # 2. Scene-specific Overrides (Keyframed)
        beats = self.scene_cfg.get("story_beats", config.config.get("storyline", []))
        extended = config.config.get("extended_scenes", [])
        
        all_scene_configs = []
        for path in extended:
            full_path = os.path.join(M9_ROOT, path)
            if os.path.exists(full_path):
                with open(full_path, 'r') as f: all_scene_configs.append(json.load(f))
        
        # Add clinical if not in extended but present in configs
        clin_path = os.path.join(M9_ROOT, "scene_configs/scene_03_clinical.json")
        if os.path.exists(clin_path):
            with open(clin_path, 'r') as f:
                c_cfg = json.load(f)
                if c_cfg not in all_scene_configs: all_scene_configs.append(c_cfg)

        for sc in all_scene_configs:
            override = sc.get("environment", {}).get("lighting_override")
            if override:
                start = sc.get("start_frame", 1)
                self.lighting_manager.setup_lights(override_type=override, start_f=start)

    def apply_context_constraints(self, context_name, start_f=1, end_f=None):
        """Hides disallowed assets based on context constraints in movie_config using keyframes."""
        if end_f is None: end_f = config.config.total_frames
        constraints = config.config.get("context_constraints", {}).get(context_name, {})
        disallowed = constraints.get("disallowed_assets", [])
        
        # We need to consider ALL assets that COULD be disallowed in OTHER contexts too,
        # to ensure they are visible when they ARE allowed.
        all_contexts = config.config.get("context_constraints", {})
        all_possibly_disallowed = set()
        for ctx in all_contexts.values():
            all_possibly_disallowed.update(ctx.get("disallowed_assets", []))

        for asset_id in all_possibly_disallowed:
            obj = bpy.data.objects.get(asset_id)
            if obj:
                is_disallowed = asset_id in disallowed
                
                # Set visibility for this scene range
                obj.hide_render = is_disallowed
                obj.hide_viewport = is_disallowed
                obj.keyframe_insert(data_path="hide_render", frame=start_f)
                obj.keyframe_insert(data_path="hide_viewport", frame=start_f)
                
                for child in obj.children_recursive:
                    child.hide_render = is_disallowed
                    child.hide_viewport = is_disallowed
                    child.keyframe_insert(data_path="hide_render", frame=start_f)
                    child.keyframe_insert(data_path="hide_viewport", frame=start_f)

    def apply_storyline(self):
        """Compatibility wrapper for modular event execution."""
        # Storyline logic is now strictly data-driven via per-scene JSON
        # Supports both 'storyline' (config) and 'story_beats' (per-scene) schemas.
        beats = self.scene_cfg.get("storyline", self.scene_cfg.get("story_beats"))
        if beats is None:
            # Fallback to ensemble-level storyline in master config
            beats = config.config.get("ensemble", {}).get("storyline", config.config.get("storyline", []))
            
        for beat in beats:
            for event in beat.get("events", []):
                character_placement.execute_event(event, context_director=self)
