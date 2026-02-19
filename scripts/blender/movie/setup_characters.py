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
        # Check for Armature (new) or legacy Staff object
        if master.gnome.type == 'ARMATURE':
            bpy.ops.object.light_add(type='POINT', location=(0.6, 0, 1.8))
            orb_light = bpy.context.object
            orb_light.name = "GloomOrbLight"
            orb_light.data.energy = 500
            orb_light.data.color = (0.5, 0, 1.0) # Purple
            orb_light.parent = master.gnome
            orb_light.parent_type = 'BONE'
            orb_light.parent_bone = "Arm.L"
            style.animate_light_flicker("GloomOrbLight", 1, 15000, strength=0.3)
        else:
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
    # Include Gnome in rim lights
    chars = [('Herbaceous', (0.7, 1.0, 0.7), master.h1),
             ('Arbor', (0.7, 0.7, 1.0), master.h2),
             ('GloomGnome', (0.6, 0.4, 1.0), master.gnome)]
    for name, color, char_obj in chars:
        if char_obj and char_obj.type == 'ARMATURE':
            bpy.ops.object.light_add(type='SPOT', location=(0, -2, 2))
            rim = bpy.context.object
            rim.name = f"{name}_Rim"
            rim.data.energy = 2000
            rim.data.color = color
            
            # Parent to Torso Bone
            rim.parent = char_obj
            rim.parent_type = 'BONE'
            rim.parent_bone = "Torso"
            
            # Aim at character Head Bone
            con = rim.constraints.new(type='TRACK_TO')
            con.target = char_obj
            con.subtarget = "Head"
        
        # Fallback for legacy or other objects
        elif char_obj:
             torso = bpy.data.objects.get(f"{name}_Torso")
             if torso:
                bpy.ops.object.light_add(type='SPOT', location=(0, -2, 2))
                rim = bpy.context.object
                rim.name = f"{name}_Rim"
                rim.data.energy = 2000
                rim.data.color = color
                rim.parent = torso
                con = rim.constraints.new(type='TRACK_TO')
                con.target = torso

def setup_gaze_system(master):
    """Sets up the procedural eye tracking."""
    # Simple gaze setup: characters look at each other
    if master.h1 and master.h2:
        for char, target in [(master.h1, master.h2), (master.h2, master.h1)]:
            # support both Armature (new) and Mesh (old/gnome)
            if char.type == 'ARMATURE':
                # Add constraint to HEAD BONE
                head_bone = char.pose.bones.get("Head")
                if head_bone:
                    # Clear existing track constraints to avoid buildup
                    for c in head_bone.constraints:
                        if c.type == 'TRACK_TO': head_bone.constraints.remove(c)
                        
                    con = head_bone.constraints.new(type='TRACK_TO')
                    con.target = target
                    if target.type == 'ARMATURE':
                        con.subtarget = "Head"
                    con.track_axis = 'TRACK_NEGATIVE_Y' # Bone Y is usually length, depends on rigging. 
                    # Standard Rigify/Blender bones: Y axis runs along bone. Head usually points up (Y) or forward (-Y) depending on rest pose. 
                    # In our custom rig: Head bone moves from Torso_Top -> Up. So Y is UP.
                    # We want the Face (typically -Y or +Y in local bone space?) to look at target.
                    # Actually, let's assume standard Front = -Y for now, check later.
                    con.track_axis = 'TRACK_NEGATIVE_Y' 
                    con.up_axis = 'UP_Z'
                    con.influence = 0.5
            else:
                # Old Mesh-based fallback
                head = bpy.data.objects.get(f"{char.name.split('_')[0]}_Head")
                if head:
                    con = head.constraints.new(type='TRACK_TO')
                    con.target = target
                    con.track_axis = 'TRACK_NEGATIVE_Z'
                    con.up_axis = 'UP_Y'
                    con.influence = 0.6
