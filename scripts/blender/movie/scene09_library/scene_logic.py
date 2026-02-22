import bpy
import mathutils

def setup_scene(master):
    """
    The Records of Reason - Library scene.
    Shot ID: S09
    Intent: Seeking wisdom/information from ancient sources.
    """
    # MUSIC CUE: Warm, echoing library atmosphere (soft woodwinds).
    master.create_intertitle("Consulting the\nRecords of Reason", 2501, 2600)

    # Props for this scene
    book = master.book
    pedestal = master.pedestal

    if book and pedestal:
        # Visibility
        for obj in [book, pedestal]:
            import style_utilities as style
            style.set_obj_visibility(obj, False, 2600)
            style.set_obj_visibility(obj, True, 2601)
            style.set_obj_visibility(obj, False, 2801)

        # Character placement
        if master.h1:
            master.h1.location = (0, -1, 0)
            master.h1.keyframe_insert(data_path="location", frame=2601)
            master.h1.rotation_euler = (0, 0, 0)
            master.h1.keyframe_insert(data_path="rotation_euler", frame=2601)

        # Point 142: Pull CamTarget to pedestal focus
        target = bpy.data.objects.get("CamTarget")
        if target:
            target.location = (0, 0, 1.3) # Height of the book
            target.keyframe_insert(data_path="location", frame=2601)
