import bpy
import math
import style

def create_intertitle(master_instance, text, frame_start, frame_end):
    """Creates a classic silent movie intertitle card."""
    if master_instance.mode != 'SILENT_FILM': return

    bpy.ops.object.text_add(location=(0, 0, 0), rotation=(-math.pi/2, 0, 0))
    text_obj = bpy.context.object
    text_obj.name = f"Title_{frame_start}_{text[:5]}"
    text_obj.data.body = text
    text_obj.data.align_x = 'CENTER'
    text_obj.data.align_y = 'CENTER'

    mat = bpy.data.materials.new(name=f"TitleMat_{frame_start}")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (1, 1, 1, 1)
    style.set_principled_socket(mat, "Emission", (1, 1, 1, 1))
    style.set_principled_socket(mat, "Emission Strength", 5.0)
    text_obj.data.materials.append(mat)

    # Backdrop
    bpy.ops.mesh.primitive_plane_add(location=(0, 0.1, 0), rotation=(-math.pi/2, 0, 0))
    bg = bpy.context.object
    bg.name = f"TitleBG_{frame_start}"
    bg.scale = (10, 6, 1)

    bg_mat = bpy.data.materials.new(name=f"TitleBGMat_{frame_start}")
    bg_mat.use_nodes = True
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

def create_diagnostic_highlight(master_instance, label, location, frame_start, frame_end, color=(1,1,1,1)):
    """Creates a scientific call-out marker."""
    bpy.ops.mesh.primitive_ico_sphere_add(radius=0.1, location=location)
    sphere = bpy.context.object
    sphere.name = f"Diag_{label}"

    mat = bpy.data.materials.new(name=f"DiagMat_{label}")
    mat.use_nodes = True
    style.set_principled_socket(mat, "Emission", color)
    style.set_principled_socket(mat, "Emission Strength", 10.0)
    sphere.data.materials.append(mat)

    # Pulse
    style.animate_pulsing_emission(sphere, frame_start, frame_end, base_strength=5.0, pulse_amplitude=15.0)

    # Visibility
    sphere.hide_render = True
    sphere.keyframe_insert(data_path="hide_render", frame=frame_start - 1)
    sphere.hide_render = False
    sphere.keyframe_insert(data_path="hide_render", frame=frame_start)
    sphere.hide_render = True
    sphere.keyframe_insert(data_path="hide_render", frame=frame_end)

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
                for fc in obj.animation_data.action.fcurves:
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
