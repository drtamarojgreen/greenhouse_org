import bpy
import random
import math
import style_utilities as style
import config
from camera_manager_v4 import setup_dialogue_camera_switching

class DialogueSceneV4:
    def __init__(self, characters, dialogue_lines):
        self.characters = characters
        self.dialogue_lines = dialogue_lines

    def setup_scene(self, cameras):
        """Assembles the scene with V4 animations and camera switching."""
        frame_end = 600
        
        # 1. Apply baseline 'Life' animations
        for char_id, props in self.characters.items():
            # Use provided rig_name or fallback to the char_id string
            rig_name = props.get("rig_name") if props.get("rig_name") else char_id
            arm_obj = bpy.data.objects.get(rig_name)
            if not arm_obj: continue
            
            action = style.ensure_action(arm_obj, action_name_prefix="Scene4")
            
            # Breathing & Shoulder Shrugs
            torso = arm_obj.pose.bones.get("Torso")
            if torso:
                style.animate_breathing(torso, 1, frame_end, amplitude=0.06)
                style.animate_shoulder_shrug(torso, 1, frame_end)
            
            # Eyelid Blinking & Pupil Jitter (V4 specific)
            for side in ["L", "R"]:
                lid_u = arm_obj.pose.bones.get(f"Eyelid.Upper.{side}")
                lid_l = arm_obj.pose.bones.get(f"Eyelid.Lower.{side}")
                if lid_u and lid_l:
                    self._animate_eyelid_blink(arm_obj, lid_u, lid_l, 1, frame_end)
                
                # Pupil movement via shader nodes
                self._animate_pupil_movement(char_id, lid_u, 1, frame_end)

        # 2. Apply Dialogue & Camera Switching
        setup_dialogue_camera_switching(self.dialogue_lines, cameras)
        
        for line in self.dialogue_lines:
            speaker = line["speaker_id"]
            self._animate_dual_lip_dialogue(speaker, line["start_frame"], line["end_frame"])

    def _animate_eyelid_blink(self, arm_obj, lid_u, lid_l, start, end):
        """V4 procedural blink using organic location offsets that hug the spherical eyeball."""
        for f in range(start, end, random.randint(70, 150)):
            # Close (Move towards center Z, but also push slightly outward +Y to clear eye equator)
            lid_u.location[2] = -0.04
            lid_u.location[1] = 0.015 # Push outward (+Y) to slide over the convex eyeball
            lid_l.location[2] = 0.04
            lid_l.location[1] = 0.015
            arm_obj.keyframe_insert(data_path=f'pose.bones["{lid_u.name}"].location', index=2, frame=f)
            arm_obj.keyframe_insert(data_path=f'pose.bones["{lid_l.name}"].location', index=2, frame=f)
            arm_obj.keyframe_insert(data_path=f'pose.bones["{lid_u.name}"].location', index=1, frame=f)
            arm_obj.keyframe_insert(data_path=f'pose.bones["{lid_l.name}"].location', index=1, frame=f)
            # Open (Reset)
            lid_u.location[2] = 0
            lid_u.location[1] = 0
            lid_l.location[2] = 0
            lid_l.location[1] = 0
            arm_obj.keyframe_insert(data_path=f'pose.bones["{lid_u.name}"].location', index=2, frame=f+3)
            arm_obj.keyframe_insert(data_path=f'pose.bones["{lid_l.name}"].location', index=2, frame=f+3)
            arm_obj.keyframe_insert(data_path=f'pose.bones["{lid_u.name}"].location', index=1, frame=f+3)
            arm_obj.keyframe_insert(data_path=f'pose.bones["{lid_l.name}"].location', index=1, frame=f+3)

    def _animate_pupil_movement(self, char_id, lid_u, start, end):
        """Animates iris shader mapping for 'shifty' plant eyes."""
        # Note: char_id is HERBACEOUS or ARBOR
        mat_name = f"Iris_{char_id}"
        mat = bpy.data.materials.get(mat_name)
        if not mat or not mat.use_nodes: return
        
        mapping = mat.node_tree.nodes.get("PupilMapping")
        if not mapping: return
        
        for f in range(start, end, 15):
            # Slow shifty look (X,Y offsets in UV mapping space)
            off_x = random.uniform(-0.15, 0.15)
            off_y = random.uniform(-0.15, 0.15)
            mapping.inputs['Location'].default_value[0] = 0.5 + off_x
            mapping.inputs['Location'].default_value[1] = 0.5 + off_y
            mapping.inputs['Location'].keyframe_insert(data_path="default_value", frame=f)

    def _animate_dual_lip_dialogue(self, speaker_id, start, end):
        """V4 dual-lip speech animation binding poses to the spherical head surface."""
        arm = bpy.data.objects.get(speaker_id)
        if not arm: return
        
        lip_u = arm.pose.bones.get("Lip.Upper")
        lip_l = arm.pose.bones.get("Lip.Lower")
        if not (lip_u and lip_l): return
        
        for f in range(start, end, 4):
            val = random.uniform(0.05, 0.15)
            # Upper lip moves UP (+Z) and sinks INTO head (-Y)
            lip_u.location[2] = val
            lip_u.location[1] = -abs(val) * 0.8
            # Lower lip moves DOWN (-Z) and sinks INTO head (-Y)
            lip_l.location[2] = -val
            lip_l.location[1] = -abs(val) * 0.8
            
            arm.keyframe_insert(data_path=f'pose.bones["{lip_u.name}"].location', index=2, frame=f)
            arm.keyframe_insert(data_path=f'pose.bones["{lip_l.name}"].location', index=2, frame=f)
            arm.keyframe_insert(data_path=f'pose.bones["{lip_u.name}"].location', index=1, frame=f)
            arm.keyframe_insert(data_path=f'pose.bones["{lip_l.name}"].location', index=1, frame=f)
            
            # Reset after 2 frames
            lip_u.location[2] = 0
            lip_u.location[1] = 0
            lip_l.location[2] = 0
            lip_l.location[1] = 0
            arm.keyframe_insert(data_path=f'pose.bones["{lip_u.name}"].location', index=2, frame=f+2)
            arm.keyframe_insert(data_path=f'pose.bones["{lip_l.name}"].location', index=2, frame=f+2)
            arm.keyframe_insert(data_path=f'pose.bones["{lip_u.name}"].location', index=1, frame=f+2)
            arm.keyframe_insert(data_path=f'pose.bones["{lip_l.name}"].location', index=1, frame=f+2)
