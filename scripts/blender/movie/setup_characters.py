import bpy
import math
from assets import plant_humanoid, gnome_antagonist, library_props
import style

def setup_all_characters(master):
    """Loads and initializes characters."""
    # Protagonists
    master.h1 = plant_humanoid.create_plant_humanoid(name="Herbaceous", location=(-2, 0, 0))
    master.h2 = plant_humanoid.create_plant_humanoid(name="Arbor", location=(2, 0, 0))

    # Antagonist
    master.gnome = gnome_antagonist.create_gnome(name="GloomGnome", location=(5, 5, 0))

    # Setup practical lights for characters (#25, #28)
    setup_character_practical_lights(master)

def setup_character_practical_lights(master):
    """Enhancement #25, #28: Rim and Practical lights parented to characters."""
    # Gloom Gnome practical orb light (#28)
    if master.gnome:
        staff = bpy.data.objects.get("GloomGnome_Staff")
        if staff:
            bpy.ops.object.light_add(type='POINT', location=(0, 0, 1.2))
            orb_light = bpy.context.object
            orb_light.name = "GloomOrbLight"
            orb_light.data.energy = 500
            orb_light.data.color = (0.5, 0, 1.0) # Purple
            orb_light.parent = staff
            style.animate_light_flicker("GloomOrbLight", 1, 15000, strength=0.3)

    # Character tinted rim lights (#25)
    chars = [('Herbaceous', (0.7, 1.0, 0.7)), ('Arbor', (0.7, 0.7, 1.0))]
    for name, color in chars:
        torso = bpy.data.objects.get(f"{name}_Torso")
        if torso:
            bpy.ops.object.light_add(type='SPOT', location=(0, -2, 2))
            rim = bpy.context.object
            rim.name = f"{name}_Rim"
            rim.data.energy = 2000
            rim.data.color = color
            rim.parent = torso
            # Aim at character
            con = rim.constraints.new(type='TRACK_TO')
            con.target = torso

def setup_gaze_system(master):
    """Sets up the procedural eye tracking."""
    # Simple gaze setup: characters look at each other
    if master.h1 and master.h2:
        for char, target in [(master.h1, master.h2), (master.h2, master.h1)]:
            head = bpy.data.objects.get(f"{char.name.split('_')[0]}_Head")
            if head:
                con = head.constraints.new(type='TRACK_TO')
                con.target = target
                con.track_axis = 'TRACK_NEGATIVE_Z'
                con.up_axis = 'UP_Y'
                con.influence = 0.6
