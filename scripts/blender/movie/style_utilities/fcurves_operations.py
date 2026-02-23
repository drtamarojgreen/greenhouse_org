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
        if hasattr(self._target, "evaluate"):
            try: return self._target.evaluate(frame)
            except: pass
        if not self.keyframe_points: return 0.0
        keys = sorted(self.keyframe_points, key=lambda k: k.co[0])
        if frame <= keys[0].co[0]: return keys[0].co[1]
        if frame >= keys[-1].co[0]: return keys[-1].co[1]
        for i in range(len(keys) - 1):
            k1, k2 = keys[i], keys[i+1]
            if k1.co[0] <= frame <= k2.co[0]:
                t = (frame - k1.co[0]) / (k2.co[0] - k1.co[0])
                return k1.co[1] + t * (k2.co[1] - k1.co[1])
        return 0.0
    def as_pointer(self):
        try: return self._target.as_pointer()
        except: return id(self._target)

def get_action_curves(action, create_if_missing=False):
    """(Point 91) Robust recursive F-curve collector for Blender 5.0 Slotted/Layered Actions."""
    if action is None: return []
    if create_if_missing and hasattr(action, "layers") and len(action.layers) == 0:
        action.layers.new(name="Main Layer")
    
    curves = []
    seen_ids = set()

    def get_bone_prefix(name):
        if not name: return ""
        bone_kws = (".L", ".R", "Torso", "Head", "Neck", "Jaw", "Mouth", "Leg", "Arm", "Eye", "Brow", "Hand", "Foot", "Spine", "Hip")
        name_str = str(name)
        if any(kw.lower() in name_str.lower() for kw in bone_kws):
            clean_name = name_str.split(":")[-1]
            return f'pose.bones["{clean_name}"].'
        return ""

    def wrap_fc(fc, prefix=""):
        if not fc: return
        if not hasattr(fc, "keyframe_points") and not hasattr(fc, "modifiers"): return
        try: ptr = fc.as_pointer()
        except: ptr = id(fc)
        fid = f"{ptr}_{prefix}_{getattr(fc, 'array_index', 0)}"
        if fid in seen_ids: return
        seen_ids.add(fid)
        path = str(getattr(fc, "data_path", getattr(fc, "path_full", getattr(fc, "path", ""))))
        is_relative = not any(p in path for p in ("pose.bones", "modifiers", "nodes", "["))
        if is_relative and prefix: path = prefix + path
        curves.append(FCurveProxy(fc, path))

    def traverse_channels(channels, prefix=""):
        if not channels: return
        for chan in channels:
            curr_prefix = prefix
            slot = getattr(chan, "slot", None)
            if slot:
                new_p = get_bone_prefix(getattr(slot, "name", getattr(slot, "identifier", "")))
                if new_p: curr_prefix = new_p
            fc = getattr(chan, "fcurve", None)
            if not fc and (hasattr(chan, "keyframe_points") or hasattr(chan, "modifiers")): fc = chan
            if fc: wrap_fc(fc, curr_prefix)
            if hasattr(chan, "channels") and chan.channels:
                try:
                    if chan.channels != channels: traverse_channels(chan.channels, curr_prefix)
                except: pass

    # 1. Direct F-curves
    if hasattr(action, "fcurves") and action.fcurves:
        for fc in action.fcurves:
            prefix = ""
            if hasattr(fc, "slot"): prefix = get_bone_prefix(getattr(fc.slot, "name", ""))
            wrap_fc(fc, prefix)

    # 2. Layers & Channels
    if hasattr(action, "layers"):
        for layer in action.layers:
            if hasattr(layer, "channels"): traverse_channels(layer.channels)
            if hasattr(layer, "strips"):
                for strip in layer.strips:
                    if hasattr(strip, "channels"): traverse_channels(strip.channels)

    # 3. Slots & Bindings
    if hasattr(action, "slots"):
        for slot in action.slots:
            prefix = get_bone_prefix(getattr(slot, "name", getattr(slot, "identifier", "")))
            if hasattr(slot, "bindings"):
                for binding in slot.bindings:
                    if hasattr(binding, "fcurves"):
                        for fc in binding.fcurves: wrap_fc(fc, prefix)
                    if hasattr(binding, "channels"): traverse_channels(binding.channels, prefix)
                        
    # 4. Global Bindings fallback
    if hasattr(action, "bindings"):
        for binding in action.bindings:
            if hasattr(binding, "fcurves"):
                for fc in binding.fcurves: wrap_fc(fc)
            if hasattr(binding, "channels"): traverse_channels(binding.channels)

    return curves

def ensure_action(obj, action_name_prefix="Anim"):
    if obj is None: return None
    if not getattr(obj, "animation_data", None): obj.animation_data_create()
    action = obj.animation_data.action
    if not action:
        action = bpy.data.actions.new(name=f"{action_name_prefix}_{obj.name}")
        obj.animation_data.action = action
    if hasattr(action, "layers") and len(action.layers) == 0: action.layers.new(name="Main Layer")
    return action

def get_or_create_fcurve(action, data_path, index=0, ref_obj=None):
    if action is None or ref_obj is None: return None
    try: return action.fcurve_ensure_for_datablock(ref_obj, data_path=data_path, index=index)
    except:
        if hasattr(action, "fcurves"): return action.fcurves.find(data_path, index=index)
        return None

def insert_looping_noise(obj, data_path, index=-1, frame_start=1, frame_end=15000, strength=0.05, scale=10.0, phase=None):
    anim_target = obj; path_prefix = ""
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
        modifier.frame_start, modifier.frame_end = frame_start, frame_end
        modifier.blend_in, modifier.blend_out = 10, 10

def ease_action(obj, data_path, index=-1, interpolation='BEZIER', easing='EASE_IN_OUT'):
    if not obj.animation_data or not obj.animation_data.action: return
    for fcurve in get_action_curves(obj.animation_data.action):
        if fcurve.data_path == data_path and (index == -1 or fcurve.array_index == index):
            for kp in fcurve.keyframe_points: kp.interpolation, kp.easing = interpolation, easing
