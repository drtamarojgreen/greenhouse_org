"""
Canonical detail profiles for the Greenhouse Movie Pipeline.
Mirrors the modular state-driven architecture of the models pages.
(Point 155)
"""

class DetailProfile:
    def __init__(self, name, layers=None):
        self.name = name
        self.layers = layers or {}

DETAIL_PROFILES = {
    'scene02_garden': DetailProfile('scene02_garden', {
        'environment': {
            'fog_density': 0.01,
            'dust_density': 20,
            'pollen_density': 30,
            'wind_strength': 0.03,
            'fauna_count': 5
        },
        'biology': {
            'motif_strength': 'medium',
            'activation_glow': 0.5
        },
        'character': {
            'micro_performance': 'light',
            'idle_variation': 0.2
        }
    }),
    'scene09_library': DetailProfile('scene09_library', {
        'environment': {
            'fog_density': 0.005,
            'ambient_motion': 'static'
        },
        'prop': {
            'reactive_intensity': 'heavy',
            'book_glow': True
        },
        'symbolic': {
            'motif_strength': 'medium',
            'thought_resonance': 0.6
        }
    }),
    'scene15_interaction': DetailProfile('scene15_interaction', {
        'environment': {
            'fog_density': 0.005
        },
        'character': {
            'micro_performance': 'heavy',
            'breathing_amplitude': 0.04,
            'gaze_transitions': True,
            'expression_arc': True
        },
        'symbolic': {
            'motif_strength': 'medium'
        }
    })
}

def get_detail_profile(scene_name):
    """Returns the detail profile for a given scene, or a default profile."""
    return DETAIL_PROFILES.get(scene_name, DetailProfile(scene_name))
