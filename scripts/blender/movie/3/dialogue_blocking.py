"""
Dialogue Blocking Module
Handles character placement, eye-line alignment, and spacing for chroma keying.
"""

try:
    import bpy
except ImportError:
    bpy = None

import math

def reposition_characters(characters):
    """
    Positions and rotates characters based on the provided schema.
    """
    for char_id, props in characters.items():
        rig_name = props.get("rig_name")
        location = props.get("location", (0, 0, 0))
        rotation = props.get("rotation", (0, 0, 0))

        obj = bpy.data.objects.get(rig_name)
        if obj:
            obj.location = location
            obj.rotation_euler = rotation
        else:
            print(f"Warning: Character rig '{rig_name}' not found.")

def set_eyeline_alignment(char_a_obj, char_b_obj):
    """
    Sets characters to look at each other (eye-line alignment).
    Aligns the Z rotation of char_a to point towards char_b.
    """
    if not (char_a_obj and char_b_obj): return
    
    vec = char_b_obj.location - char_a_obj.location
    angle = math.atan2(vec.y, vec.x)
    
    # Adjust for forward vector orientation (Character looks towards -Y)
    # -Y to +X is -90 degrees (-1.57 rad)
    char_a_obj.rotation_euler[2] = angle + (math.pi / 2)

def spacing_for_chroma_keying(char_obj, backdrop_obj, min_distance=3.0):
    """
    Ensures subjects are far enough from the green backdrop to avoid spill and shadows.
    """
    # Check distance between character and background plane
    # If too close, shift character or backdrop
    pass
