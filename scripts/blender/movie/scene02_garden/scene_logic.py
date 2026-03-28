import bpy
import math
import style_utilities as style
from assets import plant_humanoid
import mathutils
import random
from assets.wilderness_assets import create_proc_terrain, create_proc_fern
from scene_utils import place_random_prop

def setup_scene(master):
    """
    The Garden of the Mind setup.
    Shot ID: S02
    Intent: Establish a vibrant, peaceful environment.
    """
    import math
    # MUSIC CUE: Gentle birdsong and pastoral flute.
    master.create_intertitle("The Garden of\nThe Mind", 401, 500)

    # Apply scene grade
    style.apply_scene_grade(master, 'garden', 401, 650)

    # Initialize meadow terrain relative to origin (Master coordinates will translate it)
    terrain = bpy.data.objects.get("Terrain_Meadow")
    if not terrain:
        terrain = create_proc_terrain((0, 0, -1), size=40.0, type="flat")
        terrain.name = "Terrain_Meadow"
    
    # Point 142: Camera corridor clearance (establishing shot 401-650)
    cam_start = (10, -10, 4)
    target_pos = (0, 0, 1.5)
    
    from scene_utils import place_prop_on_grid

    # Point 142: Strategic Grid-Based Placement (Order vs Haphazard)
    fern_grid = [(-8, 8, -0.5), (8, 8, -0.5), (0, 12, -0.5)]
    ferns = place_prop_on_grid(
        None,
        lambda l: create_proc_fern(l, scale=1.1),
        fern_grid, cam_start, target_pos, width=5.0
    )

    bush_grid = [(-5, 6, 0), (5, 6, 0)]
    bushes = place_prop_on_grid(
        None,
        lambda l: plant_humanoid.create_procedural_bush(l, name=f"GardenBush_Grid", size=1.3),
        bush_grid, cam_start, target_pos, width=5.0
    )

    # Visibility and Transitions
    for b in bushes:
        # BMesh bushes are single objects
        objs_to_animate = [b]
        for obj in objs_to_animate:
            style.set_obj_visibility(obj, False, 500)
            style.set_obj_visibility(obj, True, 501)
            style.set_obj_visibility(obj, False, 651)

        style.apply_fade_transition(objs_to_animate, 501, 650, mode='IN', duration=12)

    # Atmospheric Fauna (Butterflies) - BMesh
    import bmesh
    butterfly_mesh = bpy.data.meshes.new("ButterflyMesh")
    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=0.05)
    bm.to_mesh(butterfly_mesh)
    bm.free()

    for i in range(5):
        butterfly = bpy.data.objects.new(f"Butterfly_{i}", butterfly_mesh)
        bpy.context.collection.objects.link(butterfly)
        butterfly.location = (random.uniform(-3, 3), random.uniform(0, 3), 2)
        style.insert_looping_noise(butterfly, "location", strength=1.0, scale=10.0, frame_start=501, frame_end=650)

    # Character movement: Walking through the garden
    if master.h1 and master.h2:
        # Point 142: Symmetrical and strategic movement path
        master.place_character(master.h1, (-4, 5, 0), (0, 0, math.radians(-30)), 401)
        master.place_character(master.h1, (-1.5, 0, 0), (0, 0, 0), 650)
        master.place_character(master.h2, (4, 5, 0), (0, 0, math.radians(30)), 401)
        master.place_character(master.h2, (1.5, 0, 0), (0, 0, 0), 650)

        # Point 142: Sharp arm gestures to indicate environment
        style.animate_arm_gesture(master.h1, side='L', frame_start=550, intensity=0.8)
        style.animate_arm_gesture(master.h2, side='R', frame_start=580, intensity=0.8)
