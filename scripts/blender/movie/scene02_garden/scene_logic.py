import bpy
import math
import style_utilities as style
from assets import plant_humanoid
import mathutils
import random

def setup_scene(master):
    """
    The Garden of the Mind setup.
    Shot ID: S02
    Intent: Establish a vibrant, peaceful environment.
    """
    # MUSIC CUE: Gentle birdsong and pastoral flute.
    master.create_intertitle("The Garden of\nThe Mind", 401, 500)

    # Apply scene grade
    style.apply_scene_grade(master, 'garden', 401, 650)
    style.animate_dust_particles(mathutils.Vector((0, 0, 2)), density=20, frame_start=501, frame_end=650)
    # Pollen particles
    style.animate_dust_particles(mathutils.Vector((0, 0, 2)), density=30, color=(1, 0.9, 0.2, 1), frame_start=501, frame_end=650)

    # Add extra foliage for vibrancy
    bushes = []
    random.seed(42)
    for i in range(5):
        loc = mathutils.Vector((random.uniform(-5, 5), random.uniform(0, 5), 0))
        b = plant_humanoid.create_procedural_bush(loc, name=f"GardenBush_{i}", size=random.uniform(0.8, 1.5))
        bushes.append(b)

    # Visibility and Transitions
    for b in bushes:
        # BMesh bushes are single objects
        objs_to_animate = [b]
        for obj in objs_to_animate:
            style.set_obj_visibility(obj, False, 500)
            style.set_obj_visibility(obj, True, 501)
            style.set_obj_visibility(obj, False, 651)

        style.apply_fade_transition(objs_to_animate, 501, 650, mode='IN', duration=12)
        style.animate_foliage_wind(objs_to_animate, strength=0.03, frame_start=501, frame_end=650)

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

    # Reactive Blooms
    if master.flower:
        # Flower scales up when 'Herbaceous' passes by (simulated)
        master.flower.scale = (0.5, 0.5, 0.5)
        master.flower.keyframe_insert(data_path="scale", frame=501)
        master.flower.scale = (1.5, 1.5, 1.5)
        master.flower.keyframe_insert(data_path="scale", frame=580)
        master.flower.scale = (1.0, 1.0, 1.0)
        master.flower.keyframe_insert(data_path="scale", frame=650)

    # Character movement: Walking through the garden
    if master.h1 and master.h2:
        master.place_character(master.h1, (-3, 2, 0), (0, 0, math.radians(-30)), 401)
        master.place_character(master.h1, (-1, 0, 0), (0, 0, 0), 650)
        master.place_character(master.h2, (1, 2, 0), (0, 0, math.radians(30)), 401)
        master.place_character(master.h2, (1, 0, 0), (0, 0, 0), 650)
