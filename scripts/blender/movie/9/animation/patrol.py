import bpy
import math
import mathutils
import config

def apply_patrol(rig, patrol_cfg, total_frames):
    """Applies path-following patrol animation to a rig."""
    paths = config.config.get("patrol_paths", {})
    waypts = paths.get(patrol_cfg["path"], {}).get("waypoints", [])
    if not waypts: return

    speed = patrol_cfg.get("speed_frames_per_unit", 8)
    offset = patrol_cfg.get("start_offset", 0.0)
    h = patrol_cfg.get("height", 0.0)
    loop = patrol_cfg.get("loop", True)

    segments = []
    total_dist = 0
    for i in range(len(waypts)-1):
        d = (mathutils.Vector(waypts[i+1]) - mathutils.Vector(waypts[i])).length
        segments.append(d); total_dist += d

    if total_dist == 0: return

    start_dist = offset * total_dist
    curr_dist = 0
    frame = 1
    
    # Simple linear path follow for now (can be improved with Bezier later)
    while frame <= total_frames:
        target_d = (curr_dist + start_dist)
        if loop:
            target_d %= total_dist
        else:
            target_d = min(target_d, total_dist)

        # Find current segment
        seg_accum = 0
        seg_idx = 0
        for i, d in enumerate(segments):
            if seg_accum + d >= target_d:
                seg_idx = i
                break
            seg_accum += d
        
        # Interpolate within segment
        p1 = mathutils.Vector(waypts[seg_idx])
        p2 = mathutils.Vector(waypts[seg_idx+1])
        factor = (target_d - seg_accum) / segments[seg_idx] if segments[seg_idx] > 0 else 0
        pos = p1.lerp(p2, factor)
        pos.z += h
        
        rig.location = pos
        rig.keyframe_insert(data_path="location", frame=frame)
        
        # Orient to path
        if factor < 0.9:
            vec = p2 - p1
            rig.rotation_euler[2] = math.atan2(vec.y, vec.x) + (math.pi / 2)
            rig.keyframe_insert(data_path="rotation_euler", index=2, frame=frame)

        frame += 5 # Key every 5 frames for performance
        curr_dist += (5 / speed)
        
        if not loop and target_d >= total_dist:
            break
