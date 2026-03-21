"""
Biology Cinematic Motif Detail Layer.
Translates models-page motifs (synaptic pulses, activation paths) into cinematic effects.
(Point 155)
"""
import bpy
import style_utilities as style

class BiologyLayer:
    def init(self, master, scene_name, profile):
        self.master = master
        self.scene_name = scene_name
        self.config = profile.layers.get('biology', {})

    def apply(self, frame_start, frame_end):
        motif_strength = self.config.get('motif_strength', 'medium')

        # Bioluminescent Veins (Always apply if biology layer is active)
        chars = [self.master.h1, self.master.h2, self.master.gnome]
        chars = [c for c in chars if c and c.name in bpy.data.objects]
        style.apply_bioluminescent_veins(chars, frame_start, frame_end)

        # Neuron Activation Pulses
        if hasattr(self.master, 'neuron') and self.master.neuron and self.master.neuron.name in bpy.data.objects:
            activation_glow = self.config.get('activation_glow', 0.5)
            style.animate_pulsing_emission(self.master.neuron, frame_start, frame_end, base_strength=1.0, pulse_amplitude=5.0 * activation_glow)

    def validate(self):
        return True
