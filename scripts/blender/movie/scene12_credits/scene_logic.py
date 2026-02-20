import bpy
import math
import style

from constants import SCENE_MAP

def setup_scene(master):
    """
    Scrolling Credits Scene.
    Shot ID: S12
    Intent: Conclude the film with scrolling cast and crew info.
    """
    # MUSIC CUE: Somber yet hopeful piano finale.

    # Point 45: Guard object creation to prevent duplicates
    if "CreditsText" in bpy.data.objects:
        return

    # Point 31: Use SCENE_MAP
    start_frame, end_frame = SCENE_MAP['scene12_credits']

    credits_text = (
        "GreenhouseMD Silent Movie\n\n"
        "Cast:\n"
        "Herbaceous as Himself\n"
        "Arbor as The Elder\n"
        "Gloom Gnome as The Antagonist\n\n"
        "Environment:\n"
        "The Garden of the Mind\n"
        "The Digital Mirror Lab\n\n"
        "Technology:\n"
        "Blender & Unity Hybrid Pipeline\n\n"
        "Final Resolution of logos achieved."
    )

    # Point 142: Use 90 on X to face the production camera correctly.
    bpy.ops.object.text_add(location=(0, 0, -5), rotation=(math.radians(90), 0, 0))
    text_obj = bpy.context.object
    text_obj.name = "CreditsText"
    text_obj.data.body = credits_text
    text_obj.data.align_x = 'CENTER'
    text_obj.data.align_y = 'TOP'
    text_obj.data.size = 0.6

    # Material
    mat = bpy.data.materials.new(name="CreditsMat")
    style.set_principled_socket(mat, "Base Color", (1, 1, 1, 1))
    text_obj.data.materials.append(mat)

    # Visibility
    text_obj.hide_render = True
    text_obj.keyframe_insert(data_path="hide_render", frame=start_frame - 1)
    text_obj.hide_render = False
    text_obj.keyframe_insert(data_path="hide_render", frame=start_frame)

    # Scrolling animation
    text_obj.location.z = -5
    text_obj.keyframe_insert(data_path="location", frame=start_frame)
    text_obj.location.z = 15
    text_obj.keyframe_insert(data_path="location", frame=end_frame)

    # Camera for credits (static looking at origin)
    # This might conflict with master camera, but master setup_camera_keyframes will handle it.
    pass
