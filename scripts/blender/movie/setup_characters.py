import bpy
import mathutils
import style
from assets import plant_humanoid, gnome_antagonist

def setup_all_characters(master):
    """Initializes and positions all characters."""
    # Gnome Antagonist
    master.gnome = gnome_antagonist.create_gnome("GloomGnome", mathutils.Vector((5, 5, 0)))

    # Plant Humanoids
    master.h1 = plant_humanoid.create_plant_humanoid("Herbaceous", mathutils.Vector((-2, 0, 0)), height_scale=0.8, seed=42)
    master.h2 = plant_humanoid.create_plant_humanoid("Arbor", mathutils.Vector((2, 1, 0)), height_scale=1.3, seed=123)

    # Character-specific props
    master.scroll = plant_humanoid.create_scroll(mathutils.Vector((1.8, 1.0, 1.2)))
    master.flower = plant_humanoid.create_flower(master.h1.location + mathutils.Vector((0, 0, 2.2)))

    # Parent practical lights and setup rim tracking
    if hasattr(master, 'orb_light'):
        staff = bpy.data.objects.get("GloomGnome_ReasonStaff") or bpy.data.objects.get("GloomGnome_Staff")
        if staff:
            master.orb_light.parent = staff
            master.orb_light.location = (0, 0, 1.5) # Top of staff

    # Setup Rim Light Tracking (#25)
    for char, rim in [(master.h1, getattr(master, 'h1_rim', None)),
                      (master.h2, getattr(master, 'h2_rim', None)),
                      (master.gnome, getattr(master, 'gnome_rim', None))]:
        if char and rim:
            # Position relative to character
            rim.parent = char
            rim.location = (0, -3, 2)
            # Track to character for consistent rim effect
            con = rim.constraints.new(type='TRACK_TO')
            con.target = char
            con.track_axis = 'TRACK_NEGATIVE_Z'
            con.up_axis = 'UP_Y'

def setup_gaze_system(master):
    """Sets up the empty-based gaze tracking system for characters."""
    bpy.ops.object.empty_add(type='PLAIN_AXES')
    gaze = bpy.context.object
    gaze.name = "GazeTarget"

    for char_name in ["Herbaceous", "Arbor"]:
        head = bpy.data.objects.get(f"{char_name}_Head")
        if head:
            for eye in head.children:
                if "Eye" in eye.name:
                    plant_humanoid.add_tracking_constraint(eye, gaze)
                    style.animate_saccadic_movement(eye, gaze, 1, 15000)

    gaze.location = (0, 0, 5)
    gaze.keyframe_insert(data_path="location", frame=1)
    gaze.location = (2, 0, 2)
    gaze.keyframe_insert(data_path="location", frame=751)
    gaze.location = (-2, 0, 2)
    gaze.keyframe_insert(data_path="location", frame=1051)

    if master.gnome:
        gaze.location = master.gnome.location + mathutils.Vector((0,0,1))
        gaze.keyframe_insert(data_path="location", frame=2101)

    return gaze
