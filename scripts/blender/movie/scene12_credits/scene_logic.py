import bpy
import math

def setup_scene(master):
    """Scrolling Credits Scene."""
    # Frame range: 4501 - 5000
    start_frame = 4501
    end_frame = 5000

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

    bpy.ops.object.text_add(location=(0, 0, -5))
    text_obj = bpy.context.object
    text_obj.name = "CreditsText"
    text_obj.data.body = credits_text
    text_obj.data.align_x = 'CENTER'
    text_obj.data.align_y = 'TOP'
    text_obj.data.size = 0.6

    # Material
    mat = bpy.data.materials.new(name="CreditsMat")
    mat.use_nodes = True
    mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (1, 1, 1, 1)
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
