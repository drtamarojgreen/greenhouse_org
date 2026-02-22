"""
Shared animation, shading, and cinematography utilities for Greenhouse Movie Production.
Handles version-safe Blender API access (4.x/5.x), procedural acting, and filmic effects.
Refactored into sub-modules for better maintainability.
(Point 155)
"""

# Import all from sub-modules to maintain backward compatibility
from .core import *
from .animate_scenes import *
from .animate_characters import *
from .style_lighting import *

# Explicitly define __all__ to include everything from sub-modules
__all__ = [
    'get_action_curves', 'get_or_create_fcurve', 'get_eevee_engine_id',
    'get_compositor_node_tree', 'create_mix_node', 'get_mix_sockets',
    'get_mix_output', 'set_principled_socket', 'patch_fbx_importer',
    'get_socket_by_identifier', 'set_socket_value', 'clear_scene_selective', 'create_noise_based_material',
    'apply_scene_grade', 'animate_foliage_wind', 'animate_light_flicker',
    'insert_looping_noise', 'animate_breathing', 'animate_dust_particles',
    'apply_fade_transition', 'camera_push_in', 'camera_pull_out',
    'apply_camera_shake', 'ease_action', 'animate_blink',
    'animate_saccadic_movement', 'animate_finger_tapping',
    'apply_reactive_foliage', 'animate_leaf_twitches',
    'animate_pulsing_emission', 'animate_dynamic_pupils',
    'apply_thought_motes', 'animate_gait', 'animate_cloak_sway',
    'animate_shoulder_shrug', 'animate_gnome_stumble',
    'apply_reactive_bloom', 'apply_thermal_transition',
    'setup_chromatic_aberration', 'setup_god_rays', 'animate_vignette',
    'apply_neuron_color_coding', 'setup_bioluminescent_flora',
    'animate_mood_fog', 'apply_film_flicker', 'apply_glow_trails',
    'setup_saturation_control', 'apply_desaturation_beat',
    'animate_dialogue_v2', 'animate_expression_blend', 'animate_reaction_shot',
    'set_blend_method', 'animate_plant_advance', 'add_scene_markers',
    'animate_distance_based_glow', 'apply_bioluminescent_veins',
    'animate_weight_shift', 'apply_anticipation', 'animate_limp',
    'animate_thinking_gesture', 'animate_defensive_crouch',
    'setup_caustic_patterns', 'animate_dawn_progression',
    'apply_interior_exterior_contrast', 'replace_with_soft_boxes',
    'animate_hdri_rotation', 'apply_iris_wipe', 'animate_vignette_breathing',
    'animate_floating_spores', 'animate_fireflies', 'animate_finger_curl',
    'FCurveProxy', 'set_node_input', 'create_compositor_output', 'set_obj_visibility'
]
