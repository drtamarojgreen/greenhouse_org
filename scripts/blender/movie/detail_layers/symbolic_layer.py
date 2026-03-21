"""
Symbolic Motif Detail Layer.
Handles glow motifs, thought sparks, and emotional resonance visuals.
(Point 155)
"""
import bpy
import style_utilities as style

class SymbolicLayer:
    def init(self, master, scene_name, profile):
        self.master = master
        self.scene_name = scene_name
        self.config = profile.layers.get('symbolic', {})

    def apply(self, frame_start, frame_end):
        motif_strength = self.config.get('motif_strength', 'medium')

        # Thought Sparks/Resonance
        resonance = self.config.get('thought_resonance', 0.5)
        if resonance > 0.7 and self.master.h1:
            style.apply_thought_motes(self.master.h1, frame_start, frame_end, count=int(resonance * 10))

        # Distance-Based Glow (from scene_orchestrator)
        if self.master.gnome:
            chars = [c for c in [self.master.h1, self.master.h2] if c]
            style.animate_distance_based_glow(self.master.gnome, chars, frame_start, frame_end)

    def validate(self):
        return True
