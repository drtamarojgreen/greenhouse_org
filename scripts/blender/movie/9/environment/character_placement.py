import bpy
import math
import mathutils
import os
import json

def ground_to_zero(rig):
    """Accurately grounds a rig to Z=0 based on evaluated mesh bounds."""
    bpy.context.view_layer.update()
    meshes = [m for m in rig.children_recursive if m.type == 'MESH']
    # Check for mesh modifiers (armature) pointing to this rig
    for obj in bpy.data.objects:
        if obj.type == 'MESH' and next((mod for mod in obj.modifiers if mod.type == 'ARMATURE' and mod.object == rig), None):
            if obj not in meshes: meshes.append(obj)
            
    if not meshes: return
    
    min_z = None
    for mesh in meshes:
        # Use evaluated mesh for accurate bounding box if animation/modifiers are active
        depsgraph = bpy.context.evaluated_depsgraph_get()
        eval_obj = mesh.evaluated_get(depsgraph)
        for corner in eval_obj.bound_box:
            z = (eval_obj.matrix_world @ mathutils.Vector(corner)).z
            min_z = z if min_z is None else min(min_z, z)
            
    if min_z is not None:
        rig.location.z -= min_z

def set_eyeline_alignment(char_a_obj, char_b_obj):
    """Rotates char_a to face char_b on the Z axis."""
    if char_a_obj and char_b_obj:
        vec = char_b_obj.location - char_a_obj.location
        # Using Y-Forward standard for character rigs
        char_a_obj.rotation_euler[2] = math.atan2(vec.y, vec.x) + (math.pi / 2)

def distribute_in_arc(objects, center, radius, start_angle, end_angle):
    """Generic distribution logic for character clusters."""
    count = len(objects)
    if count == 0: return
    if count == 1:
        objects[0].location = center
        return

    for i, obj in enumerate(objects):
        t = i / (count - 1)
        angle = start_angle + t * (end_angle - start_angle)
        offset = mathutils.Vector((math.cos(angle) * radius, math.sin(angle) * radius, 0))
        obj.location = center + offset

def execute_event(event, context_director=None):
    """
    Handles individual storyline events.
    Moved from Director for modularity.
    """
    target = event["target"]
    action = event["action"]
    params = event["params"]
    
    objs = []
    if target == "ALL":
        objs = [o for o in bpy.data.objects if ".Rig" in o.name]
    elif target == "ENSEMBLE":
        objs = [o for o in bpy.data.objects if ".Rig" in o.name and not o.get("is_protagonist")]
    else:
        objs = [bpy.data.objects.get(f"{target}.Rig") or bpy.data.objects.get(target)]

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
            from animation_handler import AnimationHandler
            AnimationHandler().apply_animation(obj, params["tag"], event.get("start", 1), params.get("duration", 100))
        elif action == "move_to":
            start_f = event.get("start", 1); duration = params.get("duration_frames", 60)
            dest = mathutils.Vector(params["destination_pos"])
            obj.keyframe_insert(data_path="location", frame=start_f)
            obj.location = dest; obj.keyframe_insert(data_path="location", frame=start_f + duration)
        elif action == "enter_vehicle":
            v_id = params["vehicle_id"]; vehicle = bpy.data.objects.get(v_id)
            if vehicle:
                stagger = params.get("stagger_frames", 0) * i
                start_f = event.get("start", 1) + stagger
                dest = mathutils.Vector(params.get("entry_pos", [0,0,0.5]))
                con = obj.constraints.get("ChildOf_Vehicle") or obj.constraints.new(type='CHILD_OF')
                con.name = "ChildOf_Vehicle"; con.target = vehicle
                con.influence = 0.0; con.keyframe_insert(data_path="influence", frame=start_f)
                con.influence = 1.0; con.keyframe_insert(data_path="influence", frame=start_f + 1)
                bpy.context.view_layer.update()
                con.inverse_matrix = vehicle.matrix_world.inverted()
                obj.location = dest; obj.keyframe_insert(data_path="location", frame=start_f + 30)

def load_extended_scene(scene_path, director_ref):
    """Loads and applies an extended scene configuration."""
    m9_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    full_path = os.path.join(m9_root, scene_path)
    if not os.path.exists(full_path):
        print(f"ERROR: Scene config not found: {full_path}")
        return
        
    with open(full_path, 'r') as f:
        cfg = json.load(f)

    # Apply environment if specified
    env = cfg.get("environment")
    if env and director_ref:
        director_ref.scene_cfg["environment"] = env
        director_ref.setup_environment(force=True)

    # Execute events
    for beat in cfg.get("story_beats", []):
        for event in beat.get("events", []):
            execute_event(event, context_director=director_ref)

    # Setup markers
    scene = bpy.context.scene
    for cam_cfg in cfg.get("camera_sequence", []):
        m = scene.timeline_markers.new(f"Shot_{cam_cfg['camera']}_{cam_cfg['start']}", frame=cam_cfg["start"])
        cam_obj = bpy.data.objects.get(cam_cfg["camera"])
        if cam_obj: m.camera = cam_obj

def compose_ensemble(spirits, ensemble_entities_cfg):
    """
    Algorithmically positions ensemble spirits in a cinematic fan.
    Moved from Director for modularity.
    """
    num = len(spirits)
    if num == 0: return
    
    entity_map = {e["id"]: e for e in ensemble_entities_cfg}
    fan_width, fan_dist, var_dist, center_y = 0.95, 12.0, 3.5, 15.0
    
    for i, rig in enumerate(spirits):
        entity = entity_map.get(rig.name.replace(".Rig", ""))
        if entity and "default_pos" in entity:
            rig.location = mathutils.Vector(entity["default_pos"])
        else:
            angle = (i / max(num-1, 1)) * math.pi * fan_width - math.pi * (fan_width/2)
            dist = fan_dist + (i % 2) * var_dist
            rig.location = (math.sin(angle)*dist, center_y + math.cos(angle)*4.0, 0.0)
        
        ground_to_zero(rig)
        rig.keyframe_insert(data_path="location", frame=1)
        rig.keyframe_insert(data_path="rotation_euler", index=2, frame=1)
