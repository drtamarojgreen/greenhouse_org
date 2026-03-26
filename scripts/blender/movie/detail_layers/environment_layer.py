"""
Environment Detail Layer.
Handles atmospheric effects like fog, dust, pollen, and wind.
(Point 155)
"""
import bpy
import mathutils
import style_utilities as style

class EnvironmentLayer:
    def init(self, master, scene_name, profile):
        self.master = master
        self.scene_name = scene_name
        self.config = profile.layers.get('environment', {})

    def apply(self, frame_start, frame_end):
        scene = self.master.scene

        # Fog
        fog_density = self.config.get('fog_density')
        if fog_density is not None:
            style.animate_mood_fog(scene, frame_start, density=fog_density)

        # Dust
        dust_density = self.config.get('dust_density')
        if dust_density:
            style.animate_dust_particles(
                mathutils.Vector((0, 0, 2)),
                density=dust_density,
                frame_start=frame_start,
                frame_end=frame_end
            )

        # Pollen
        pollen_density = self.config.get('pollen_density')
        if pollen_density:
            style.animate_dust_particles(
                mathutils.Vector((0, 0, 2)),
                density=pollen_density,
                color=(1, 0.9, 0.2, 1),
                frame_start=frame_start,
                frame_end=frame_end
            )

        # Wind
        wind_strength = self.config.get('wind_strength')
        if wind_strength:
            foliage = [obj for obj in bpy.data.objects if "Fern" in obj.name or "Bush" in obj.name or "Tree" in obj.name]
            style.animate_foliage_wind(foliage, strength=wind_strength, frame_start=frame_start, frame_end=frame_end)

    def validate(self):
        return True
