"""
Dialogue Scene Module
Handles scene assembly, timing, and camera logic.
"""

try:
    import bpy
    import mathutils
except ImportError:
    # Headless mode for testing
    bpy = None
    mathutils = None

import os
import sys
try:
    from . import config
except (ImportError, ValueError):
    import config

try:
    from .dialogue_blocking import reposition_characters
except (ImportError, ValueError):
    from dialogue_blocking import reposition_characters

# Ensure movie root and style_utilities are accessible
MOVIE_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if MOVIE_ROOT not in sys.path:
    sys.path.append(MOVIE_ROOT)

import style_utilities as style

class DialogueScene:
    def __init__(self, dialogue_lines=None, characters=None):
        """
        dialogue_lines: List of dicts {speaker_id, text, start_frame, duration, camera_mode}
        characters: Dict of {speaker_id: {rig_name, ...}}
        """
        self.characters = characters or self._get_default_characters()
        self.dialogue_lines = dialogue_lines or self._get_default_dialogue()

    def _get_default_characters(self):
        return {
            config.CHAR_HERBACEOUS: {
                "rig_name": config.CHAR_HERBACEOUS,
                "location": (-1.75, -0.3, 0),
                "rotation": (0, 0, -1.4) # Facing Arbor
            },
            config.CHAR_ARBOR: {
                "rig_name": config.CHAR_ARBOR,
                "location": (1.75, 0.3, 0),
                "rotation": (0, 0, 1.7) # Facing Herbaceous
            }
        }

    def _get_default_dialogue(self):
        # Modelled after Scene 16 timing
        start_frame = bpy.context.scene.frame_current if bpy else 1
        return [
            {
                "speaker_id": config.CHAR_HERBACEOUS,
                "text": "Intellectual debate continues.",
                "start_frame": start_frame + config.S16_HERB_START_OFFSET,
                "end_frame": start_frame + config.S16_HERB_END_OFFSET,
                "intensity": 1.1
            },
            {
                "speaker_id": config.CHAR_ARBOR,
                "text": "Arbor responds.",
                "start_frame": start_frame + config.S16_ARBOR_START_OFFSET,
                "end_frame": start_frame + config.S16_ARBOR_END_OFFSET,
                "intensity": 0.9
            }
        ]

    def _setup_camera(self):
        """Creates and positions a camera to frame both characters."""
        if not bpy: return
        
        cam_name = "Scene3_Camera"
        if cam_name in bpy.data.cameras:
            cam_data = bpy.data.cameras[cam_name]
            cam_obj = bpy.data.objects.get(cam_name)
        else:
            cam_data = bpy.data.cameras.new(cam_name)
            cam_obj = bpy.data.objects.new(cam_name, cam_data)
            bpy.context.collection.objects.link(cam_obj)
        
        # Position camera for a medium-wide shot of both characters
        # Characters are at +/- 1.75 X. Z=1.2 is roughly head height.
        cam_obj.location = (0, -7.5, 1.5)
        cam_obj.rotation_euler = (1.52, 0, 0) # Slightly tilted down
        
        bpy.context.scene.camera = cam_obj
        print(f"Camera '{cam_name}' configured for Scene 3.")

    def setup_scene(self):
        """
        Assembles the scene with unified animation actions and eye-line alignment.
        """
        reposition_characters(self.characters)
        
        # Ensure characters face each other precisely
        from dialogue_blocking import set_eyeline_alignment
        herb = bpy.data.objects.get(config.CHAR_HERBACEOUS)
        arbor = bpy.data.objects.get(config.CHAR_ARBOR)
        if herb and arbor:
            set_eyeline_alignment(herb, arbor)
            set_eyeline_alignment(arbor, herb)

        self._setup_camera()
        
        frame_end = bpy.context.scene.frame_end if bpy else 600
        
        # 1. Unify Actions & Apply baseline 'Life' animations
        for char_id, props in self.characters.items():
            rig_name = props.get("rig_name")
            arm_obj = bpy.data.objects.get(rig_name)
            if not arm_obj: continue
            
            # CRITICAL: Pre-create a single action for the entire scene session
            # This prevents subsequent animate_x calls from overwriting the active action.
            # Use style.ensure_action from fcurves_operations (via style)
            action = style.ensure_action(arm_obj, action_name_prefix="Scene3")
            
            # 1. Breathing (Target Torso bone if available, else armature)
            torso = arm_obj.pose.bones.get("Torso") or arm_obj
            style.animate_breathing(torso, 1, frame_end, amplitude=0.05)
            
            # 2. Shoulder Shrugs (Target Torso or Arm bones)
            style.animate_shoulder_shrug(torso, 1, frame_end)
            
            # 3. Head Micro-movements (Target Head bone)
            head = arm_obj.pose.bones.get("Head")
            if head:
                # Add slight random drift to head
                style.insert_looping_noise(head, "rotation_euler", index=0, strength=0.02, scale=120, frame_start=1, frame_end=frame_end)
                style.insert_looping_noise(head, "rotation_euler", index=2, strength=0.02, scale=150, frame_start=1, frame_end=frame_end)
            
            # 4. Facial Life (Blink & Saccades)
            eye_l = arm_obj.pose.bones.get("Eye.L")
            if eye_l:
                style.animate_blink(eye_l, 1, frame_end)
                style.animate_saccadic_movement(eye_l, None, 1, frame_end)
            
            eye_r = arm_obj.pose.bones.get("Eye.R")
            if eye_r:
                style.animate_blink(eye_r, 1, frame_end)
                style.animate_saccadic_movement(eye_r, None, 1, frame_end)
            
            print(f"Unified 'Life' animations applied to {rig_name} in action '{action.name}'.")

        # 2. Apply Dialogue Animation (Turn-taking)
        # These will now append to the same 'Scene3' action
        for line in self.dialogue_lines:
            speaker = line["speaker_id"]
            other = config.CHAR_ARBOR if speaker == config.CHAR_HERBACEOUS else config.CHAR_HERBACEOUS
            
            # Apply dialogue animation
            style.animate_dialogue_v2(speaker, line["start_frame"], line["end_frame"], intensity=line.get("intensity", 1.0))
            
            # Apply reaction shot (slight head/eye shifts)
            style.animate_reaction_shot(other, line["start_frame"], line["end_frame"])

def build_scene3_dialogue(dialogue_lines=None, characters=None):
    scene = DialogueScene(dialogue_lines, characters)
    scene.setup_scene()
    return scene
