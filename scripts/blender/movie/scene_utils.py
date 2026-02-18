import bpy
import math
import random
import style

def create_intertitle(master, text, frame_start, frame_end):
    """Creates a classic silent movie intertitle card."""
    if master.mode != 'SILENT_FILM': return

    # Point 103: Fixed rotation for credits/intertitles
    bpy.ops.object.text_add(location=(0, 0, 0), rotation=(-math.pi/2, 0, 0))
    text_obj = bpy.context.object
    text_obj.name = f"Title_{frame_start}_{text[:5]}"
    text_obj.data.body = text
    text_obj.data.align_x = 'CENTER'
    text_obj.data.align_y = 'CENTER'
    text_obj.data.size = 1.0
    text_obj.data.extrude = 0.05

    mat = bpy.data.materials.new(name=f"TextMat_{frame_start}")
    mat.use_nodes = True
    style.set_principled_socket(mat, "Base Color", (0.439, 0.259, 0.078, 1)) # #704214
    style.set_principled_socket(mat, "Emission Strength", 5.0)
    text_obj.data.materials.append(mat)

    # Absolute values for rotation
    text_obj.rotation_euler[1] = 0
    text_obj.keyframe_insert(data_path="rotation_euler", index=1, frame=frame_start)
    text_obj.rotation_euler[1] = math.radians(360)
    text_obj.keyframe_insert(data_path="rotation_euler", index=1, frame=frame_start + 24)

    master._set_visibility([text_obj], [(frame_start, frame_end)])
    return text_obj

def create_spinning_logo(master, text_content, frame_start, frame_end):
    """Creates ELASTIC spinning 3D letters for branding."""
    mat = bpy.data.materials.new(name="GH_Logo_Mat")
    mat.use_nodes = True
    style.set_principled_socket(mat, "Base Color", (1, 1, 1, 1))
    style.set_principled_socket(mat, "Emission Strength", 15.0)

    char_spacing = 0.8
    start_x = -((len(text_content) - 1) * char_spacing) / 2

    objs = []
    for i, char in enumerate(text_content):
        bpy.ops.object.text_add(location=(start_x + i * char_spacing, 0, 0))
        text_obj = bpy.context.object
        text_obj.name = f"LogoChar_{i}_{char}"
        text_obj.data.body = char
        text_obj.data.extrude = 0.1
        text_obj.data.align_x = 'CENTER'
        text_obj.data.align_y = 'CENTER'
        text_obj.data.materials.append(mat)
        text_obj.rotation_euler[0] = math.radians(90)

        rot_axis = 2
        num_rotations = random.uniform(1, 2)
        total_angle = math.radians(360 * num_rotations)

        text_obj.keyframe_insert(data_path="rotation_euler", index=rot_axis, frame=frame_start)
        text_obj.rotation_euler[rot_axis] += total_angle
        text_obj.keyframe_insert(data_path="rotation_euler", index=rot_axis, frame=frame_end)

        if text_obj.animation_data and text_obj.animation_data.action:
            for fcurve in style.get_action_curves(text_obj.animation_data.action):
                if fcurve.data_path == "rotation_euler" and fcurve.array_index == rot_axis:
                    for kp in fcurve.keyframe_points:
                        kp.interpolation = 'ELASTIC'
                        kp.easing = 'EASE_OUT'

        master._set_visibility([text_obj], [(frame_start, frame_end)])
        objs.append(text_obj)
    return objs

def create_diagnostic_highlight(master, name, location, frame_start, frame_end, color=(1, 0.5, 0, 1)):
    """Creates a diagnostic highlight sphere."""
    bpy.ops.mesh.primitive_ico_sphere_add(radius=0.2, location=location)
    highlight = bpy.context.object
    highlight.name = f"Highlight_{name}"

    mat = bpy.data.materials.new(name=f"HighlightMat_{name}")
    mat.use_nodes = True
    style.set_principled_socket(mat, "Base Color", color)
    style.set_principled_socket(mat, "Emission", color)
    style.set_principled_socket(mat, "Emission Strength", 10.0)
    highlight.data.materials.append(mat)

    master._set_visibility([highlight], [(frame_start, frame_end)])
    return highlight

def create_thought_spark(master, start_loc, end_loc, frame_start, frame_end):
    """Creates a line between two points representing a spark of thought."""
    mid = (start_loc + end_loc) / 2
    dist = (end_loc - start_loc).length

    bpy.ops.mesh.primitive_cylinder_add(radius=0.02, depth=dist, location=mid)
    spark = bpy.context.object
    spark.name = f"Spark_{frame_start}"

    # Orient
    direction = (end_loc - start_loc).normalized()
    spark.rotation_euler = direction.to_track_quat('Z', 'Y').to_euler()

    mat = bpy.data.materials.new(name=f"SparkMat_{frame_start}")
    mat.use_nodes = True
    color = (0.2, 0.6, 1.0, 1.0)
    style.set_principled_socket(mat, "Base Color", color)
    style.set_principled_socket(mat, "Emission", color)
    style.set_principled_socket(mat, "Emission Strength", 50.0)
    spark.data.materials.append(mat)

    master._set_visibility([spark], [(frame_start, frame_end)])
    return spark
