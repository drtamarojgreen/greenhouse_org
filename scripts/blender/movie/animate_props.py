import bpy
import style
import mathutils
from constants import SCENE_MAP

from assets import brain_neuron

def animate_props(master_instance):
    """Animates background props and environmental elements."""
    # Scientific assets
    brain_neuron.animate_brain_neuron(master_instance)

    # Pulsing Brain Core
    if master_instance.brain:
        style.animate_pulsing_emission(master_instance.brain, 1, 15000, base_strength=0.1, pulse_amplitude=0.3)

        # Diagnostic highlights
        import scene_utils
        b_loc = master_instance.brain.location
        scene_utils.create_diagnostic_highlight(master_instance, "Thalamus", b_loc + mathutils.Vector((0, 0.5, 0.5)), 3620, 3680, color=(0, 0.5, 1, 1))
        scene_utils.create_diagnostic_highlight(master_instance, "Prefrontal", b_loc + mathutils.Vector((0.5, -0.5, 0.8)), 3720, 3780, color=(1, 0.5, 0, 1))

    # Enhancement #22: Fireflies
    style.animate_fireflies(mathutils.Vector((0, 0, 2)), volume_size=(10, 10, 5), density=15, frame_start=401, frame_end=3800)

    # Enhancement #33: Floating Spores (Sanctuary)
    if 'scene11_nature_sanctuary' in SCENE_MAP:
        start, end = SCENE_MAP['scene11_nature_sanctuary']
        style.animate_floating_spores(mathutils.Vector((0, 0, 3)), volume_size=(12, 12, 6), density=60, frame_start=start, frame_end=end)

    # Weather System
    import weather_system
    # Rain during shadow scene
    master_instance.rain_emitter = weather_system.create_rain_system(
        master_instance.scene, frame_start=1801, frame_end=2500, intensity='MEDIUM'
    )
    weather_system.create_rain_splashes(mathutils.Vector((0, 0, 0)), count=30, frame_start=1801, frame_end=2500)

    # Storm during retreat
    master_instance.storm_emitter = weather_system.create_rain_system(
        master_instance.scene, frame_start=13701, frame_end=14200, intensity='STORM'
    )

    # Procedural Foliage Wind
    bushes = [obj for obj in bpy.context.scene.objects if "Bush" in obj.name]
    style.animate_foliage_wind(bushes, strength=0.08)

    # Indoor vs Outdoor contrast (#27)
    style.apply_interior_exterior_contrast(master_instance.sun, master_instance.scene.camera)

    # HDRI Rotation (#30)
    style.animate_hdri_rotation(master_instance.scene)
