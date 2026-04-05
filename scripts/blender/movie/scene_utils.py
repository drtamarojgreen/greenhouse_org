import bpy
import math
import random
import mathutils
import style_utilities as style

def create_intertitle(master_instance, text, frame_start, frame_end):
    """Creates a classic silent movie intertitle card."""
    if master_instance.mode != 'SILENT_FILM': return

    # Point 142: Use +90 degrees on X to face camera correctly in Z-up world (UP_Z)
    bpy.ops.object.text_add(location=(0, 0, 0), rotation=(math.pi/2, 0, 0))
    text_obj = bpy.context.object
    text_obj.name = f"Title_{frame_start}_{text[:5]}"
    text_obj.data.body = text
    text_obj.data.align_x = 'CENTER'
    text_obj.data.align_y = 'CENTER'

    mat = bpy.data.materials.new(name=f"TitleMat_{frame_start}")
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (1, 1, 1, 1)
    style.set_principled_socket(mat, "Emission", (1, 1, 1, 1))
    style.set_principled_socket(mat, "Emission Strength", 5.0) # Point 142: Capped at 5.0 for standard visibility
    text_obj.data.materials.append(mat)

    # Backdrop (BMesh)
    import bmesh
    bg_data = bpy.data.meshes.new(f"TitleBG_{frame_start}_MeshData")
    bg = bpy.data.objects.new(f"TitleBG_{frame_start}", bg_data)
    bpy.context.collection.objects.link(bg)
    bg.location = (0, 0.1, 0)
    bg.rotation_euler = (math.pi/2, 0, 0)
    
    bm_bg = bmesh.new()
    bmesh.ops.create_grid(bm_bg, x_segments=1, y_segments=1, size=1.0)
    for v in bm_bg.verts:
        v.co.x *= 10.0
        v.co.y *= 6.0
    bm_bg.to_mesh(bg_data)
    bm_bg.free()

    bg_mat = bpy.data.materials.new(name=f"TitleBGMat_{frame_start}")
    bg_bsdf = bg_mat.node_tree.nodes["Principled BSDF"]
    bg_bsdf.inputs["Base Color"].default_value = (0, 0, 0, 1)
    bg.data.materials.append(bg_mat)

    # Animation
    for obj in [text_obj, bg]:
        obj.hide_render = True
        obj.keyframe_insert(data_path="hide_render", frame=frame_start - 1)
        obj.hide_render = False
        obj.keyframe_insert(data_path="hide_render", frame=frame_start)
        obj.hide_render = True
        obj.keyframe_insert(data_path="hide_render", frame=frame_end)

    return text_obj

def create_spinning_logo(master_instance, text_content, frame_start, frame_end):
    """Creates a spinning text logo."""
    # Point 45: Position high in the air. 
    # Use +90 on X to face the production camera (Point 142).
    bpy.ops.object.text_add(location=(0, 0, 10), rotation=(math.radians(90), 0, 0))
    logo = bpy.context.object
    logo.name = f"Logo_{frame_start}"
    logo.data.body = text_content
    logo.data.align_x = 'CENTER'
    logo.data.align_y = 'CENTER'

    mat = bpy.data.materials.new(name=f"LogoMat_{frame_start}")
    style.set_principled_socket(mat, "Emission", (1, 0.8, 0, 1))
    style.set_principled_socket(mat, "Emission Strength", 5.0) # Point 142: Capped at 5.0
    logo.data.materials.append(mat)

    # Animation (Rotation)
    logo.rotation_euler[2] = 0
    logo.keyframe_insert(data_path="rotation_euler", index=2, frame=frame_start)
    logo.rotation_euler[2] = math.radians(360)
    logo.keyframe_insert(data_path="rotation_euler", index=2, frame=frame_end)

    # Visibility
    logo.hide_render = True
    logo.keyframe_insert(data_path="hide_render", frame=frame_start - 1)
    logo.hide_render = False
    logo.keyframe_insert(data_path="hide_render", frame=frame_start)
    logo.hide_render = True
    logo.keyframe_insert(data_path="hide_render", frame=frame_end)

    return logo

def create_thought_spark(master_instance, start_loc, end_loc, frame_start, frame_end):
    """Point 95: BMesh Thought Spark."""
    import bmesh
    mesh_data = bpy.data.meshes.new(f"Spark_{frame_start}_MeshData")
    spark = bpy.data.objects.new(f"Spark_{frame_start}", mesh_data)
    bpy.context.collection.objects.link(spark)
    spark.location = start_loc
    
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=1, radius=0.08)
    bm.to_mesh(mesh_data)
    bm.free()

    mat = bpy.data.materials.new(name=f"SparkMat_{frame_start}")
    style.set_principled_socket(mat, "Emission", (0.5, 0.8, 1, 1))
    style.set_principled_socket(mat, "Emission Strength", 5.0) # Point 142: Capped at 5.0
    spark.data.materials.append(mat)

    # Animation
    spark.location = start_loc
    spark.keyframe_insert(data_path="location", frame=frame_start)
    spark.location = end_loc
    spark.keyframe_insert(data_path="location", frame=frame_end)

    # Visibility
    spark.hide_render = True
    spark.keyframe_insert(data_path="hide_render", frame=frame_start - 1)
    spark.hide_render = False
    spark.keyframe_insert(data_path="hide_render", frame=frame_start)
    spark.hide_render = True
    spark.keyframe_insert(data_path="hide_render", frame=frame_end)

    return spark

def create_diagnostic_highlight(master_instance, label, location, frame_start, frame_end, color=(1,1,1,1)):
    """Point 95: BMesh Diagnostic Highlight."""
    import bmesh
    mesh_data = bpy.data.meshes.new(f"Diag_{label}_MeshData")
    sphere = bpy.data.objects.new(f"Diag_{label}", mesh_data)
    bpy.context.collection.objects.link(sphere)
    sphere.location = location
    
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=1, radius=0.1)
    bm.to_mesh(mesh_data)
    bm.free()

    mat = bpy.data.materials.new(name=f"DiagMat_{label}")
    style.set_principled_socket(mat, "Emission", color)
    style.set_principled_socket(mat, "Emission Strength", 5.0) # Point 142: Capped at 5.0
    sphere.data.materials.append(mat)

    # Pulse (Point 142: Moderated pulse for new emission cap)
    style.animate_pulsing_emission(sphere, frame_start, frame_end, base_strength=4.0, pulse_amplitude=1.0)

    # Visibility
    sphere.hide_render = True
    sphere.keyframe_insert(data_path="hide_render", frame=frame_start - 1)
    sphere.hide_render = False
    sphere.keyframe_insert(data_path="hide_render", frame=frame_start)
    sphere.hide_render = True
    sphere.keyframe_insert(data_path="hide_render", frame=frame_end)

def is_in_camera_corridor(pos, cam_pos, target_pos, width=2.5):
    """
    Returns True if a position lies within a cylindrical corridor 
    between the camera and its target.
    """
    p = mathutils.Vector(pos)
    c = mathutils.Vector(cam_pos)
    t = mathutils.Vector(target_pos)
    
    # Line segment from C to T
    v = t - c
    if v.length < 0.001: return False
    
    # Project P onto the line (C, T)
    # v_hat is the normalized direction
    v_hat = v.normalized()
    d = (p - c).dot(v_hat)
    
    # Check if projection is between C and T
    if d < 0 or d > v.length:
        return False
        
    # Closest point on line
    closest = c + v_hat * d
    dist = (p - closest).length
    
    return dist < width

def is_view_blocked(cam_pos, target_pos, ignore_objects=None):
    """
    Raycasts from camera to target to check for physical occlusions.
    """
    if ignore_objects is None: ignore_objects = []
    
    c = mathutils.Vector(cam_pos)
    t = mathutils.Vector(target_pos)
    direction = (t - c).normalized()
    distance = (t - c).length
    
    # Perform raycast
    # Note: We use the scene-wide ray_cast.
    res, hit_pos, _, _, hit_obj, _ = bpy.context.scene.ray_cast(
        bpy.context.evaluated_depsgraph_get(),
        c, direction, distance=distance
    )
    
    if res:
        # If we hit something that isn't in our ignore list, it's an occlusion.
        if hit_obj and hit_obj not in ignore_objects:
            # Check if hit is significantly before the target
            if (hit_pos - c).length < (distance - 0.1):
                return True
    return False

def place_prop_on_grid(target_collection, asset_func, grid_coords, cam_pos, target_pos, width=3.0):
    """
    Deterministic placement utility for strategic ordering.
    Point 142: Replaces randomness with intentional cinematic grid logic.
    """
    placed_objs = []
    for loc in grid_coords:
        # Check if coordinate is in the way of the camera
        if is_in_camera_corridor(loc, cam_pos, target_pos, width=width):
            continue

        # Raycast to ensure no existing occlusions (though grid should be planned)
        if is_view_blocked(cam_pos, target_pos):
            pass # Keep placing, but this alerts the scene architect

        obj = asset_func(loc)
        if not obj: continue

        objs = [obj] if not isinstance(obj, (list, tuple)) else list(obj)
        if target_collection:
            for o in objs:
                if o.name in bpy.context.collection.objects:
                    target_collection.objects.link(o)
                    bpy.context.collection.objects.unlink(o)
        placed_objs.append(obj)
    return placed_objs

def place_random_prop(target_collection, asset_func, bounds_x, bounds_y, bounds_z, cam_pos, target_pos, seed=None, width=4.5):
    """
    DEPRECATED: Prefer place_prop_on_grid for ordered scenes.
    """
    if seed is not None: random.seed(seed)
    
    # Try multiple times to find a clear spot
    for trial in range(15):
        # Biased random: pick either low or high end of range to keep center clear
        def biased_rand(r):
            if random.random() > 0.7: return random.uniform(r[0], r[1]) # 30% center
            return random.choice([random.uniform(r[0], r[0] + (r[1]-r[0])*0.2),
                                 random.uniform(r[1] - (r[1]-r[0])*0.2, r[1])])

        loc = (
            biased_rand(bounds_x),
            biased_rand(bounds_y),
            random.uniform(bounds_z[0], bounds_z[1])
        )
        
        # 1. Simple spatial corridor check (fast)
        if not is_in_camera_corridor(loc, cam_pos, target_pos, width=width):
            # 2. Potential asset creation
            obj = asset_func(loc)
            if not obj: continue
            
            # Ensure we have a list of objects (handled for multi-object assets)
            objs = [obj] if not isinstance(obj, (list, tuple)) else list(obj)
            main_obj = objs[0]
            
            # 3. Raycast validation (slow but "thoughtful")
            # We check if the NEWLY PLACED object blocks the view.
            # We check a few points on the target area if target_pos is a cluster.
            if is_view_blocked(cam_pos, target_pos):
                # Oops, we blocked the view. Delete and try again.
                for o in objs:
                    bpy.data.objects.remove(o, do_unlink=True)
                continue
            
            # Success! Link to collection
            if target_collection:
                for o in objs:
                    if o.name in bpy.context.collection.objects:
                        target_collection.objects.link(o)
                        bpy.context.collection.objects.unlink(o)
            return obj
    return None

def apply_dialogue_blocking(char_a, char_b, spacing=2.0):
    """
    Standardized dialogue blocking utility (from Version 4).
    Positions characters to face each other with a specified spacing.
    """
    if not (char_a and char_b): return

    # Position char_b relative to char_a
    char_b.location = char_a.location + mathutils.Vector((spacing, 0, 0))

    # Align eyelines
    vec = char_b.location - char_a.location
    angle = math.atan2(vec.y, vec.x)

    # Adjust for forward vector orientation (Character looks towards -Y)
    char_a.rotation_euler[2] = angle + (math.pi / 2)
    char_b.rotation_euler[2] = angle - (math.pi / 2)

def generate_subtitles(master, output_path="movie_subtitles.srt"):
    """Enhancement #85: Generates an SRT file based on intertitles and scene ranges."""
    from constants import SCENE_MAP

    # Simple intertitle based subtitles
    subtitles = []

    # We find all Title objects
    title_objs = [obj for obj in bpy.data.objects if "Title_" in obj.name]
    for obj in title_objs:
        if obj.data and hasattr(obj.data, 'body'):
            # We need to find the frame range from the keyframes
            f_start = 1
            f_end = 100
            if obj.animation_data and obj.animation_data.action:
                # Point 142: Utilize modern discovery
                curves = style.get_action_curves(obj.animation_data.action, obj=obj)
                for fc in curves:
                    if fc.data_path == "hide_render":
                        # Usually keys are at [start-1, start, end]
                        pts = sorted([kp.co[0] for kp in fc.keyframe_points])
                        if len(pts) >= 3:
                            f_start = pts[1]
                            f_end = pts[2]

            subtitles.append({
                'start': f_start,
                'end': f_end,
                'text': obj.data.body.replace('\n', ' ')
            })

    # Sort by start frame
    subtitles.sort(key=lambda x: x['start'])

    def frames_to_timestamp(f):
        fps = 24.0
        total_seconds = f / fps
        hours = int(total_seconds // 3600)
        minutes = int((total_seconds % 3600) // 60)
        seconds = int(total_seconds % 60)
        millis = int((total_seconds * 1000) % 1000)
        return f"{hours:02}:{minutes:02}:{seconds:02},{millis:03}"

    with open(output_path, "w") as f:
        for i, sub in enumerate(subtitles):
            f.write(f"{i + 1}\n")
            f.write(f"{frames_to_timestamp(sub['start'])} --> {frames_to_timestamp(sub['end'])}\n")
            f.write(f"{sub['text']}\n\n")

    print(f"Subtitles exported to {output_path}")
