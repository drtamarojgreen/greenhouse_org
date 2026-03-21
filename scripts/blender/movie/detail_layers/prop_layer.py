"""
Prop Reactivity Detail Layer.
Handles flowers blooming, books opening, and reactive set pieces.
(Point 155)
"""
import bpy
import style_utilities as style
import math

class PropLayer:
    def init(self, master, scene_name, profile):
        self.master = master
        self.scene_name = scene_name
        self.config = profile.layers.get('prop', {})

    def apply(self, frame_start, frame_end):
        reactive_intensity = self.config.get('reactive_intensity', 'medium')

        # Reactive Blooms
        if hasattr(self.master, 'flower') and self.master.flower and self.master.flower.name in bpy.data.objects:
            # Flower scales up
            self.master.flower.scale = (0.5, 0.5, 0.5)
            self.master.flower.keyframe_insert(data_path="scale", frame=frame_start)
            self.master.flower.scale = (1.5, 1.5, 1.5)
            self.master.flower.keyframe_insert(data_path="scale", frame=(frame_start + frame_end) // 2)
            self.master.flower.scale = (1.0, 1.0, 1.0)
            self.master.flower.keyframe_insert(data_path="scale", frame=frame_end)

        # Book and Pedestal Focus
        if self.config.get('book_glow') and hasattr(self.master, 'book') and self.master.book and self.master.book.name in bpy.data.objects:
            style.animate_pulsing_emission(self.master.book, frame_start, frame_end, base_strength=5.0, pulse_amplitude=10.0)

    def validate(self):
        return True
