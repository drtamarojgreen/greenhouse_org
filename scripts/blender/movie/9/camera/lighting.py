import bpy
import mathutils
import math

class LightingManager:
    """Modular lighting controller for Movie 9."""
    
    def __init__(self, lc_cfg):
        self.lc_cfg = lc_cfg

    def setup_lights(self, override_type=None, start_f=1):
        """Constructs/Updates lights based on config."""
        light_cfg = self.lc_cfg.get("lighting", {})
        if override_type:
            # Simple multiplier for overrides (e.g. 'Clinical' might be brighter)
            multiplier = 1.5 if "Clinical" in override_type else 1.0
        else:
            multiplier = 1.0

        # Only clear lights on the initial setup (start_f=1 and no override)
        if start_f == 1 and not override_type:
            coll = bpy.data.collections.get("9b.ENVIRONMENT")
            if coll:
                for obj in list(coll.objects):
                    if obj.type == 'LIGHT':
                        bpy.data.objects.remove(obj, do_unlink=True)

        # 1. Sun/Directional Light
        sun_cfg = light_cfg.get("Sun") or light_cfg.get("sun", {})
        if sun_cfg:
            self._create_light("Sun", 'SUN', sun_cfg, multiplier, start_f)

        # 2. Ambience/Fill
        for key in ["Key", "Rim", "Leg", "fills"]:
            val = light_cfg.get(key)
            if isinstance(val, list):
                for fill in val: self._create_light(fill["id"], 'AREA', fill, multiplier, start_f)
            elif isinstance(val, dict):
                self._create_light(key, val.get("type", 'AREA'), val, multiplier, start_f)

    def _create_light(self, name, l_type, cfg, multiplier=1.0, start_f=1):
        light_obj = bpy.data.objects.get(name)
        if not light_obj:
            light_data = bpy.data.lights.new(name=name, type=l_type)
            light_obj = bpy.data.objects.new(name=name, object_data=light_data)
            
            coll = bpy.data.collections.get("9b.ENVIRONMENT")
            if coll: coll.objects.link(light_obj)
            else: bpy.context.scene.collection.objects.link(light_obj)
        else:
            light_data = light_obj.data

        light_obj.location = cfg.get("pos", (0,0,10))
        if "rot" in cfg:
            light_obj.rotation_euler = [math.radians(r) for r in cfg["rot"]]
        
        energy = cfg.get("energy", 10.0) * multiplier
        light_data.energy = energy
        light_data.color = cfg.get("color", (1,1,1))
        
        # Explicitly keyframe at the start of the range to ensure visibility
        light_data.keyframe_insert(data_path="energy", frame=start_f)

        # Heartbeat Pulse (Ported from Movie 6 aesthetics)
        if name == "Key" or cfg.get("heartbeat"):
            # Ensure we are keyframing from the current base energy
            light_data.keyframe_insert(data_path="energy", frame=start_f)
            light_data.energy = energy * 1.2
            light_data.keyframe_insert(data_path="energy", frame=start_f + 30)
            light_data.energy = energy
            light_data.keyframe_insert(data_path="energy", frame=start_f + 60)
            # Cycle via modifiers if in Blender context
            if light_data.animation_data and light_data.animation_data.action:
                action = light_data.animation_data.action
                curves_container = action
                if hasattr(action, "slots") and len(action.slots) > 0:
                    curves_container = action.slots[0]
                
                curves = getattr(curves_container, "curves", getattr(curves_container, "fcurves", []))
                for fc in curves:
                    if fc.data_path == "energy":
                        fc.modifiers.new(type='CYCLES')
        
        if l_type == 'AREA':
            light_data.size = cfg.get("size", 5.0)
            
        return light_obj

    def setup_torches(self, t_cfg):
        """Creates procedural torches along a path."""
        # Logic moved from ExteriorModeler to here for modularity
        pass
