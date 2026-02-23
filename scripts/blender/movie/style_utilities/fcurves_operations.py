"""
F-Curve and animation action operations for Greenhouse Movie Production.
"""
import bpy
import random

class FCurveProxy:
    """Provides compatibility between Blender 5.0 Slotted Actions and legacy path-based tests."""
    def __init__(self, target, path):
        self._target = target
        self.data_path = path
        self.keyframe_points = getattr(target, "keyframe_points", [])
        self.modifiers = getattr(target, "modifiers", [])
        self.array_index = getattr(target, "array_index", 0)
    def __getattr__(self, name):
        return getattr(self._target, name)
    def evaluate(self, frame):
        try: return self._target.evaluate(frame)
        except: return 0.0
    def as_pointer(self):
        try:
            return self._target.as_pointer()
        except:
            return id(self._target)

def get_action_curves(action, create_if_missing=False):
    """(Point 91) Robust recursive F-curve collector for Blender 5.0 Slotted/Layered Actions."""
    if action is None: return []
    if create_if_missing and hasattr(action, "layers") and len(action.layers) == 0:
        action.layers.new(name="Main Layer")
    
    curves = []
    seen_ids = set()

    def get_bone_prefix(name):
        if not name: return ""
        bone_kws = (".L", ".R", "Torso", "Head", "Neck", "Jaw", "Mouth", "Leg.", "Arm.", "Eye", "Brow")
        if any(kw in name for kw in bone_kws):
            clean_name = str(name).split(":")[-1]
            return f'pose.bones["{clean_name}"].'
        return ""

    def wrap_fc(fc, prefix=""):
        if not fc or not hasattr(fc, "keyframe_points"): return
        
        # Use as_pointer if available for stable ID
        ptr = id(fc)
        try: ptr = fc.as_pointer()
        except: pass
        
        fid = f"{ptr}_{prefix}_{getattr(fc, 'array_index', 0)}"
        if fid in seen_ids: return
        seen_ids.add(fid)

        path = getattr(fc, "data_path", "")
        if not path:
             path = getattr(fc, "path_full", getattr(fc, "path", ""))
        
        # Point 142: Ensure path is valid string
        path = str(path)
        
        # If path is relative (no pose.bones), prepend prefix
        is_relative = not any(p in path for p in ("pose.bones", "modifiers", "nodes", "["))
        if is_relative and prefix:
            path = prefix + path
            
        curves.append(FCurveProxy(fc, path))

    # 1. Direct F-curves (Legacy and 5.0 Flat)
    if hasattr(action, "fcurves") and action.fcurves:
        for fc in action.fcurves: 
            # Point 142: Try to discover slot-based prefixes if not absolute
            prefix = ""
            if hasattr(fc, "slot"):
                prefix = get_bone_prefix(getattr(fc.slot, "name", ""))
            wrap_fc(fc, prefix)

    # 2. Blender 5.0 Layers & Channels (Recursively)
    def traverse_channels(channels, prefix=""):
        if not channels: return
        for chan in channels:
            # Check for slot name to update prefix
            curr_prefix = prefix
            slot = getattr(chan, "slot", None)
            if slot:
                slot_name = getattr(slot, "name", getattr(slot, "identifier", ""))
                new_p = get_bone_prefix(slot_name)
                if new_p: curr_prefix = new_p
            
            fc = getattr(chan, "fcurve", None)
            if not fc and hasattr(chan, "keyframe_points"): fc = chan
            if fc: wrap_fc(fc, curr_prefix)
            
            # Recurse into child channels (Point 142: handle potential Infinite recursion)
            if hasattr(chan, "channels") and chan.channels:
                if chan.channels != channels: # Safety
                    traverse_channels(chan.channels, curr_prefix)

    if hasattr(action, "layers"):
        for layer in action.layers:
            if hasattr(layer, "channels") and layer.channels: 
                traverse_channels(layer.channels)
            if hasattr(layer, "strips") and layer.strips:
                for strip in layer.strips:
                    if hasattr(strip, "channels") and strip.channels: 
                        traverse_channels(strip.channels)

    # 3. Blender 5.0 Slots & Bindings (Fallback discovery)
    if hasattr(action, "slots"):
        for slot in action.slots:
            slot_name = getattr(slot, "name", getattr(slot, "identifier", ""))
            prefix = get_bone_prefix(slot_name)
            if hasattr(slot, "bindings"):
                for binding in slot.bindings:
                    if hasattr(binding, "fcurves") and binding.fcurves:
                        for fc in binding.fcurves: wrap_fc(fc, prefix)
                    if hasattr(binding, "channels") and binding.channels:
                        traverse_channels(binding.channels, prefix)
                        
    # 4. Final aggressive fallback: check all datablocks for fcurves that might be hidden
    # This is a safety pass for weird 5.0 edge cases (Point 142)
    if hasattr(action, "fcurves") and not curves:
        for fc in action.fcurves:
            wrap_fc(fc)

    return curves

def ensure_action(obj, action_name_prefix="Anim"):
    """Ensure an animatable object has animation_data + action and return the action."""
    if obj is None:
        return None
    if not getattr(obj, "animation_data", None):
        obj.animation_data_create()
    action = obj.animation_data.action
    if not action:
        action = bpy.data.actions.new(name=f"{action_name_prefix}_{obj.name}")
        obj.animation_data.action = action
    if hasattr(action, "layers") and len(action.layers) == 0:
        action.layers.new(name="Main Layer")
    return action

def get_or_create_fcurve(action, data_path, index=0, ref_obj=None):
    """Retrieves or creates an F-Curve using the Blender 5.0+ Layered Action API."""
    if action is None or ref_obj is None: return None
    try:
        return action.fcurve_ensure_for_datablock(ref_obj, data_path=data_path, index=index)
    except:
        if not action.fcurves: return None
        return action.fcurves.find(data_path, index=index)

def insert_looping_noise(obj, data_path, index=-1, frame_start=1, frame_end=15000, strength=0.05, scale=10.0, phase=None):
    """Inserts noise modifier to a data path."""
    anim_target = obj
    path_prefix = ""
    if hasattr(obj, "id_data") and obj.rna_type.identifier == 'PoseBone':
        anim_target = obj.id_data; path_prefix = f'pose.bones["{obj.name}"].'
    elif hasattr(obj, "bone") and hasattr(obj, "id_data") and obj.id_data.type == 'ARMATURE':
        anim_target = obj.id_data; path_prefix = f'pose.bones["{obj.name}"].'
    action = ensure_action(anim_target, action_name_prefix="Noise")
    indices = [index] if index >= 0 else [0, 1, 2]
    full_path = path_prefix + data_path
    for idx in indices:
        fcurve = get_or_create_fcurve(action, full_path, idx, ref_obj=anim_target)
        if not fcurve: continue
        if not fcurve.keyframe_points: anim_target.keyframe_insert(data_path=full_path, index=idx, frame=frame_start)
        modifier = fcurve.modifiers.new(type='NOISE')
        modifier.strength = strength * (0.8 + random.random() * 0.4)
        modifier.scale = scale * (0.8 + random.random() * 0.4)
        modifier.phase = phase if phase is not None else random.random() * 100
        modifier.use_restricted_range = True
        modifier.frame_start = frame_start; modifier.frame_end = frame_end
        modifier.blend_in = 10; modifier.blend_out = 10

def ease_action(obj, data_path, index=-1, interpolation='BEZIER', easing='EASE_IN_OUT'):
    """Sets easing for all keyframes of a specific data path."""
    if not obj.animation_data or not obj.animation_data.action: return
    for fcurve in get_action_curves(obj.animation_data.action):
        if fcurve.data_path == data_path and (index == -1 or fcurve.array_index == index):
            for kp in fcurve.keyframe_points: kp.interpolation, kp.easing = interpolation, easing
