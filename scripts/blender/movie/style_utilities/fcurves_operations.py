"""
F-Curve and animation action operations for Greenhouse Movie Production.
Exclusively utilizing Blender 5.0 Slotted Action / Channel Bag API.
"""
import bpy
import random
from bpy_extras import anim_utils

class FCurveProxy:
    """Provides compatibility and helper methods for modern F-Curves."""
    def __init__(self, target, path=None):
        self._target = target
        # Use provided path or the F-Curve's own data_path
        self.data_path = path if path is not None else getattr(target, "data_path", "")
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

def get_action_curves(action, obj=None):
    """
    Blender 5.0 Mandatory Channel Bag Approach.
    Retrieves F-Curves for a specific object's slot or all slots in an action.
    """
    if not action: return []
    
    curves = []
    seen_ids = set()

    def add_curves_from_bag(bag, prefix=""):
        if not bag or not hasattr(bag, "fcurves"): return
        for fc in bag.fcurves:
            try: ptr = fc.as_pointer()
            except: ptr = id(fc)
            if ptr in seen_ids: continue
            seen_ids.add(ptr)
            
            path = fc.data_path
            # Reconstruct absolute bone paths if necessary
            if prefix and not path.startswith("pose.bones"):
                path = prefix + path
            curves.append(FCurveProxy(fc, path))

    def get_bone_prefix(name):
        if not name: return ""
        bone_kws = (".L", ".R", "Torso", "Head", "Neck", "Jaw", "Mouth", "Leg", "Arm", "Eye", "Brow", "Hand", "Foot", "Spine", "Hip")
        name_str = str(name)
        if any(kw.lower() in name_str.lower() for kw in bone_kws):
            clean_name = name_str.split(":")[-1]
            return f'pose.bones["{clean_name}"].'
        return ""

    # 1. Primary: Targeted retrieval via anim_utils for a specific object
    if obj and hasattr(obj, "animation_data") and obj.animation_data:
        slot = getattr(obj.animation_data, "action_slot", None)
        if slot:
            try:
                bag = anim_utils.action_get_channelbag_for_slot(action, slot)
                if bag:
                    prefix = get_bone_prefix(getattr(slot, "name", ""))
                    add_curves_from_bag(bag, prefix)
                    return curves
            except Exception as e:
                print(f"Debug: anim_utils.action_get_channelbag_for_slot failed: {e}")

    # 2. Comprehensive: Iterate all slots in the action if no object or targeted search failed
    if hasattr(action, "slots"):
        for slot in action.slots:
            try:
                bag = anim_utils.action_get_channelbag_for_slot(action, slot)
                if bag:
                    prefix = get_bone_prefix(getattr(slot, "name", ""))
                    add_curves_from_bag(bag, prefix)
            except: pass

    return curves

def ensure_action(obj, action_name_prefix="Anim"):
    """Ensures object has animation_data and a modern 5.0 Action."""
    if obj is None: return None
    if not getattr(obj, "animation_data", None):
        obj.animation_data_create()
    
    action = obj.animation_data.action
    if not action:
        action = bpy.data.actions.new(name=f"{action_name_prefix}_{obj.name}")
        obj.animation_data.action = action
        
    # Mandatory for Slotted Actions: Ensure at least one layer exists
    if hasattr(action, "layers") and len(action.layers) == 0:
        action.layers.new(name="Main Layer")
        
    return action

def get_or_create_fcurve(action, data_path, index=0, ref_obj=None):
    """Retrieves or creates an F-Curve utilizing modern datablock binding."""
    if action is None or ref_obj is None: return None
    
    # Ensure layer exists
    if hasattr(action, "layers") and len(action.layers) == 0:
        action.layers.new(name="Main Layer")

    try:
        # Utilize 5.0 native datablock-aware discovery/creation
        return action.fcurve_ensure_for_datablock(ref_obj, data_path=data_path, index=index)
    except Exception as e:
        print(f"Debug: fcurve_ensure_for_datablock failed for {data_path}: {e}")
        return None

def insert_looping_noise(obj, data_path, index=-1, frame_start=1, frame_end=15000, strength=0.05, scale=10.0, phase=None):
    """Adds noise modifier to a data path, ensuring 5.0 slot/bag integrity."""
    anim_target = obj; path_prefix = ""
    # Resolve PoseBone to Armature + path
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
        
        # Ensure a keyframe exists so the modifier has a base to operate on
        if not fcurve.keyframe_points:
            anim_target.keyframe_insert(data_path=full_path, index=idx, frame=frame_start)
            
        modifier = fcurve.modifiers.new(type='NOISE')
        modifier.strength = strength * (0.8 + random.random() * 0.4)
        modifier.scale = scale * (0.8 + random.random() * 0.4)
        modifier.phase = phase if phase is not None else random.random() * 100
        modifier.use_restricted_range = True
        modifier.frame_start, modifier.frame_end = frame_start, frame_end
        modifier.blend_in, modifier.blend_out = 10, 10

def ease_action(obj, data_path, index=-1, interpolation='BEZIER', easing='EASE_IN_OUT'):
    """Sets easing for all keyframes of a specific data path in a 5.0 slot."""
    if not obj or not obj.animation_data or not obj.animation_data.action: return
    
    # Use targeted get_action_curves
    for fcurve in get_action_curves(obj.animation_data.action, obj=obj):
        if fcurve.data_path == data_path and (index == -1 or fcurve.array_index == index):
            for kp in fcurve.keyframe_points:
                kp.interpolation, kp.easing = interpolation, easing
