import bpy
import mathutils
import random
import style_utilities as style
from assets.wilderness_assets import create_proc_terrain, create_proc_rock_formation
from assets.exterior_garden import create_procedural_tree

def setup_scene(master):
    """
    The Records of Reason - Library scene.
    Shot ID: S09
    Intent: Seeking wisdom/information from ancient sources.
    """
    # MUSIC CUE: Warm, echoing library atmosphere (soft woodwinds).
    master.create_intertitle("Consulting the\nRecords of Reason", 2501, 2600)

    # Ancient Redwood Grove environment
    if not bpy.data.objects.get("Terrain_Redwood"):
        grove_floor = create_proc_terrain((0, 0, -1), size=40.0, type="bowl")
        grove_floor.name = "Terrain_Redwood"
        bark_mat = bpy.data.materials.get("BarkMat_Herbaceous") or bpy.data.materials.new("BarkMat_Redwood")
        leaf_mat = bpy.data.materials.get("LeafMat_Herbaceous") or bpy.data.materials.new("LeafMat_Redwood")
        # Giant trees on a ring -- scaled way up
        import math
        for i in range(8):
            angle = (i / 8) * 2 * math.pi
            t = create_procedural_tree(
                (math.cos(angle) * 12, math.sin(angle) * 12, -1),
                bark_mat, leaf_mat)
            t.scale = (2.0, 2.0, 3.0)
            t.name = f"RedwoodTree_{i}"
        # Scattered boulders
        for i in range(5):
            r = create_proc_rock_formation(
                (random.uniform(-5, 5), random.uniform(-5, 5), -0.8),
                scale=random.uniform(0.5, 1.2), style_type="smooth")
            r.name = f"RedwoodBoulder_{i}"

    # Props for this scene
    book = master.book
    pedestal = master.pedestal

    if book and pedestal:
        # Visibility (delegated to prop_layer or handled here for timing)
        for obj in [book, pedestal]:
            style.set_obj_visibility(obj, False, 2600)
            style.set_obj_visibility(obj, True, 2601)
            style.set_obj_visibility(obj, False, 2801)

        # Character placement
        if master.h1:
            master.place_character(master.h1, (0, -1, 0), (0, 0, 0), 2501)
            master.hold_position(master.h1, 2501, 2800)
            master.hold_position(master.h2, 2501, 2800)

        # Point 142: Pull CamTarget to pedestal focus
        target = bpy.data.objects.get("CamTarget")
        if target:
            target.location = (0, 0, 1.3) # Height of the book
            target.keyframe_insert(data_path="location", frame=2601)
