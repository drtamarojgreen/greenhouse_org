import bpy
import style
from constants import SCENE_MAP

def animate_all_characters(master):
    """Orchestrates procedural animation and visibility with Enhancements #11-20."""

    # 1. Gnome Animation
    if master.gnome:
        style.animate_breathing(master.gnome, 1, 15000, cycle=80, amplitude=0.01)
        style.animate_gnome_stumble(master.gnome, 2200)

        # Enhancement #14: Gnome Limping Retreat Gait
        retreat_start = SCENE_MAP['scene22_retreat'][0]
        style.animate_limp(master.gnome, retreat_start, 15000)

        # Enhancement #20: Gnome Defensive Crouch
        advance_start = SCENE_MAP['scene18_dialogue'][0]
        advance_end = SCENE_MAP['scene21_dialogue'][1]
        style.animate_defensive_crouch(master.gnome, advance_start, advance_end)

        # Enhancement #17: Fear Micro-Expressions on Gnome
        mouth = bpy.data.objects.get("GloomGnome_Mouth")
        if mouth:
            style.animate_dialogue_v2(mouth, advance_start, advance_end, intensity=1.5, speed=2.0)

        cloak = bpy.data.objects.get("GloomGnome_Cloak")
        if cloak:
            style.animate_cloak_sway(cloak, 1, 15000)

        # Initial presence/movement
        master.gnome.location = (2, 2, 0)
        master.gnome.keyframe_insert(data_path="location", frame=2600)
        master.gnome.location = (10, 10, 0)
        master.gnome.keyframe_insert(data_path="location", frame=2800)

    # 2. Plant Humanoids (Herbaceous and Arbor)
    for char in [master.h1, master.h2]:
        if not char: continue

        # Determine gait based on character scale/type
        gait_mode = 'HEAVY' if "Arbor" in char.name else 'LIGHT'
        style.animate_gait(char, mode=gait_mode, frame_start=3901, frame_end=4100)

        # Enhancement #15: Secondary Torso Twist During Walk
        style.insert_looping_noise(char, "rotation_euler", index=0, strength=0.05, scale=10.0, frame_start=3901, frame_end=4100)

        style.animate_breathing(char, 1, 15000, cycle=64, amplitude=0.02)
        style.insert_looping_noise(char, "rotation_euler", index=2, strength=0.02, scale=15.0)
        style.animate_shoulder_shrug(char, 1, 15000)

        # Enhancement #11: Weight-Shifted Idle Stance for Herbaceous
        if "Herbaceous" in char.name:
            style.animate_weight_shift(char, 1, 15000)

            # Enhancement #19: Hand-to-Head Thinking Gesture
            think_f = SCENE_MAP['scene03_socratic'][0] + 50
            arm = bpy.data.objects.get("Herbaceous_Arm_R")
            if arm: style.animate_thinking_gesture(arm, think_f)

        # Enhancement #18: Proud Chin-Raise for Arbor
        if "Arbor" in char.name:
            head = bpy.data.objects.get("Arbor_Head")
            if head:
                climax_f = SCENE_MAP['scene21_dialogue'][1] - 100
                head.rotation_euler[0] = 0
                head.keyframe_insert(data_path="rotation_euler", index=0, frame=climax_f)
                head.rotation_euler[0] = math.radians(-15) # Tilt up
                head.keyframe_insert(data_path="rotation_euler", index=0, frame=climax_f + 50)

        # Character sub-parts
        char_name = char.name.split('_')[0]
        head = bpy.data.objects.get(f"{char_name}_Head")
        if head:
            # Head foliage twitches
            leaves = [c for c in head.children if "Leaf" in c.name]
            style.animate_leaf_twitches(leaves, 1, 15000)

            # Enhancement #13: Overlapping Action on Leaf Hair
            for i, leaf in enumerate(leaves):
                # Offset noise phase for each leaf
                style.insert_looping_noise(leaf, "rotation_euler", index=0, strength=0.02, scale=10.0, phase=i*5.0)

            for child in head.children:
                # Eye/Face animation
                if "Eye" in child.name:
                    style.animate_blink(child, 1, 15000)
                if "Pupil" in child.name:
                    style.animate_dynamic_pupils([child], None, 1, 15000)

        # Arbor-specific finger tapping
        if "Arbor" in char.name:
            fingers = [c for c in char.children if "Finger" in c.name or "Vine" in c.name]
            style.animate_finger_tapping(fingers, 1, 15000)

        # Staff sway
        staff = bpy.data.objects.get(f"{char_name}_ReasonStaff")
        if staff:
            style.insert_looping_noise(staff, "rotation_euler", index=0, strength=0.02, scale=10.0, frame_start=1, frame_end=15000)

        # Mouth 'breathing' (slight scale pulse)
        mouth = bpy.data.objects.get(f"{char_name}_Mouth")
        if mouth:
            style.animate_breathing(mouth, 1, 15000, cycle=8, amplitude=0.5)

    # 3. Character Visibility Logic
    _setup_visibility_ranges(master)

def _setup_visibility_ranges(master):
    """Defines when characters are rendered in the film."""
    # Plant related objects
    plant_keywords = ["Herbaceous", "Arbor", "Scroll", "Bush", "Eye", "Mouth", "Pupil", "Brow", "ShoulderPlate"]
    plants = [obj for obj in bpy.context.scene.objects
              if any(k in obj.name for k in plant_keywords)
              and "GloomGnome" not in obj.name]

    p_ranges = [
        (501, 650), (751, 950), (1051, 1250), (1601, 1800),
        (2101, 2500), (2601, 2800), (2901, 3400), (3901, 4100), (4501, 14500)
    ]
    master._set_visibility(plants, p_ranges)

    # Gnome related objects
    gnomes = [obj for obj in bpy.context.scene.objects if "GloomGnome" in obj.name]
    g_ranges = [(1800, 1820), (1950, 1970), (2101, 2500), (2601, 2800), (10901, 14500)]
    master._set_visibility(gnomes, g_ranges)
