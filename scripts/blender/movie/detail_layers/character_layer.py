"""
Character Micro-Performance Detail Layer.
Handles breathing, gaze, blinks, and subtle expression arcs.
(Point 155)
"""
import bpy
import style_utilities as style

class CharacterLayer:
    def init(self, master, scene_name, profile):
        self.master = master
        self.scene_name = scene_name
        self.config = profile.layers.get('character', {})

    def apply(self, frame_start, frame_end):
        micro_performance = self.config.get('micro_performance', 'light')
        chars = [self.master.h1, self.master.h2, self.master.gnome]
        chars = [c for c in chars if c and c.name in bpy.data.objects]

        # Breathing
        amplitude = self.config.get('breathing_amplitude', 0.02 if micro_performance == 'light' else 0.04)
        for char in chars:
            style.animate_breathing(char, frame_start, frame_end, amplitude=amplitude)

        # Shoulder Shrugs
        if micro_performance == 'heavy':
            for char in chars:
                torso = char.pose.bones.get("Torso") if char.type == 'ARMATURE' else char
                style.animate_shoulder_shrug(torso, frame_start, frame_end)

        # Blinking and Reactions
        if micro_performance == 'heavy':
            for char in chars:
                style.animate_reaction_shot(char.name, frame_start, frame_end)

        # Dialogue V2 (Procedural)
        if self.config.get('dialogue_v2'):
            for char in chars:
                style.animate_dialogue_v2(char, frame_start, frame_end)

    def validate(self):
        return True
