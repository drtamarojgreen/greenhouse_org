import bpy
import random
import math
import style_utilities as style
import config
from camera_manager_v5 import setup_dialogue_camera_switching

class DialogueSceneV5:
    def __init__(self, characters, dialogue_lines):
        self.characters = characters
        self.dialogue_lines = dialogue_lines

    def setup_scene(self, cameras):
        """Assembles the scene with V5 animations and camera switching."""
        # 1. Apply baseline 'Life' animations
        for char_id, props in self.characters.items():
            rig_name = props.get("rig_name") if props.get("rig_name") else char_id
            arm_obj = bpy.data.objects.get(rig_name)
            if not arm_obj: continue
            
            action = style.ensure_action(arm_obj, action_name_prefix="Scene5")
            
            # Breathing & Torso Shrugs
            torso = arm_obj.pose.bones.get("Torso")
            if torso:
                style.animate_breathing(torso, 1, config.TOTAL_FRAMES, amplitude=0.06)
                style.animate_shoulder_shrug(torso, 1, config.TOTAL_FRAMES)
            
            # Limb Movements (Hips, Shoulders, Arms)
            self._animate_body_limbs(arm_obj, 1, config.TOTAL_FRAMES)
            
            # Eyes and Eyebrow details
            for side in ["L", "R"]:
                lid_u = arm_obj.pose.bones.get(f"Eyelid.Upper.{side}")
                lid_l = arm_obj.pose.bones.get(f"Eyelid.Lower.{side}")
                if lid_u and lid_l:
                    self._animate_eyelid_blink(arm_obj, lid_u, lid_l, 1, config.TOTAL_FRAMES)
                
                # Pupil movement via shader nodes
                self._animate_pupil_movement(char_id, lid_u, 1, config.TOTAL_FRAMES)
                
            # Advanced eye details (Pupil dilation, Darting, Corner twitches)
            self._animate_advanced_eyes(arm_obj, 1, config.TOTAL_FRAMES)

        # 2. Apply Dialogue & Camera Switching
        setup_dialogue_camera_switching(self.dialogue_lines, cameras)
        
        from animation_library_v5 import apply_animation_by_tag, apply_talking_arms

        for line in self.dialogue_lines:
            speaker = line["speaker_id"]
            start_f = line["start_frame"]
            end_f = line["end_frame"]
            
            # Apply Lip Sync
            self._animate_dual_lip_dialogue(speaker, start_f, end_f)
            
            # Apply Expressive Arms
            arm_rig = bpy.data.objects.get(self.characters[speaker].get("rig_name", speaker))
            if arm_rig:
                apply_talking_arms(arm_rig, start_f, end_f - start_f)

            anim_tags = line.get("anim")
            if anim_tags:
                if isinstance(anim_tags, str):
                    anim_tags = [anim_tags]
                
                for tag in anim_tags:
                    prop_obj = None
                    if ":" in tag:
                        pname = tag.split(":")[1]
                        prop_obj = bpy.data.objects.get(pname)
                    
                    apply_animation_by_tag(arm_rig, tag, start_f, duration=end_f - start_f, prop_obj=prop_obj)

        # 3. FINAL DANCE SEQUENCE (3600 - 4200)
        self._setup_dance_finale(3600, 4200)

    def _setup_dance_finale(self, start_f, end_f):
        """Characters face the wide camera, dance, then face each other."""
        from animation_library_v5 import apply_dance
        
        # Camera is at -8Y. Facing camera means rotating Z to 0.
        # Initial: Herb faces right (+X), Arbor faces left (-X)
        for char_id in [config.CHAR_HERBACEOUS, config.CHAR_ARBOR]:
            arm_obj = bpy.data.objects.get(char_id)
            if not arm_obj: continue
            
            # Frame 3600: Rotate to face camera (Z=0)
            arm_obj.keyframe_insert(data_path="rotation_euler", index=2, frame=start_f - 10)
            arm_obj.rotation_euler[2] = 0 # Face -Y
            arm_obj.keyframe_insert(data_path="rotation_euler", index=2, frame=start_f)
            
            # Apply Dance
            apply_dance(arm_obj, start_f, duration=end_f - start_f - 50)
            
            # Frame 4150: Turn back (Restoring original euler[2])
            # Herb was at ~1.57 (pi/2), Arbor was at ~-1.4
            orig_rot = 1.74 if char_id == config.CHAR_HERBACEOUS else -1.4
            arm_obj.keyframe_insert(data_path="rotation_euler", index=2, frame=end_f - 50)
            arm_obj.rotation_euler[2] = orig_rot
            arm_obj.keyframe_insert(data_path="rotation_euler", index=2, frame=end_f)

    def _animate_body_limbs(self, arm_obj, start, end):
        """Procedural hip, shoulder, and arm animation."""
        hip_l = arm_obj.pose.bones.get("Hip.L")
        hip_r = arm_obj.pose.bones.get("Hip.R")
        shoulder_l = arm_obj.pose.bones.get("Shoulder.L")
        shoulder_r = arm_obj.pose.bones.get("Shoulder.R")
        arm_l = arm_obj.pose.bones.get("Arm.L")
        arm_r = arm_obj.pose.bones.get("Arm.R")
        
        for f in range(start, end, random.randint(45, 90)):
            if hip_l and hip_r:
                hip_sway = random.uniform(-0.02, 0.02)
                hip_l.location[0] = hip_sway
                hip_r.location[0] = hip_sway
                arm_obj.keyframe_insert(data_path=f'pose.bones["{hip_l.name}"].location', index=0, frame=f)
                arm_obj.keyframe_insert(data_path=f'pose.bones["{hip_r.name}"].location', index=0, frame=f)
            
            if shoulder_l and shoulder_r:
                sh_roll = random.uniform(-0.05, 0.05)
                shoulder_l.location[2] = sh_roll
                shoulder_r.location[2] = -sh_roll
                arm_obj.keyframe_insert(data_path=f'pose.bones["{shoulder_l.name}"].location', index=2, frame=f)
                arm_obj.keyframe_insert(data_path=f'pose.bones["{shoulder_r.name}"].location', index=2, frame=f)
                
            if arm_l and arm_r:
                base_rot = math.radians(-40)
                arm_swing = random.uniform(-0.1, 0.1)
                arm_l.rotation_euler[0] = base_rot + arm_swing
                arm_r.rotation_euler[0] = base_rot - arm_swing
                arm_obj.keyframe_insert(data_path=f'pose.bones["{arm_l.name}"].rotation_euler', index=0, frame=f)
                arm_obj.keyframe_insert(data_path=f'pose.bones["{arm_r.name}"].rotation_euler', index=0, frame=f)

    def _animate_advanced_eyes(self, arm_obj, start, end):
        """Darting, Pupil Dilation, and structural eye quirks."""
        pupil_ctrl_l = arm_obj.pose.bones.get("Pupil.Ctrl.L")
        pupil_ctrl_r = arm_obj.pose.bones.get("Pupil.Ctrl.R")
        
        for f in range(start, end, random.randint(30, 80)):
            if pupil_ctrl_l and pupil_ctrl_r:
                dilation = random.uniform(0.8, 1.4)
                pupil_ctrl_l.scale = (dilation, dilation, dilation)
                pupil_ctrl_r.scale = (dilation, dilation, dilation)
                arm_obj.keyframe_insert(data_path=f'pose.bones["{pupil_ctrl_l.name}"].scale', frame=f)
                arm_obj.keyframe_insert(data_path=f'pose.bones["{pupil_ctrl_r.name}"].scale', frame=f)

    def _animate_eyelid_blink(self, arm_obj, lid_u, lid_l, start, end):
        """V5 procedural blink using organic location offsets that hug the spherical eyeball."""
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
            # Slow shifty look (X,Z offsets in UV mapping space along the front hemisphere)
            off_x = random.uniform(-0.15, 0.15)
            off_z = random.uniform(-0.15, 0.15)
            mapping.inputs['Location'].default_value[0] = 0.5 + off_x # X
            mapping.inputs['Location'].default_value[2] = 0.5 + off_z # Z
            mapping.inputs['Location'].keyframe_insert(data_path="default_value", frame=f)

    def _animate_dual_lip_dialogue(self, speaker_id, start, end):
        """V5 dual-lip speech animation binding poses to the spherical head surface."""
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
