"""
Centralized lighting configuration for Greenhouse Movie Production.
Allows global tuning of intensities, colors, and scene-specific lighting presets.
"""

LIGHTING_DEFAULTS = {
    "HerbaceousKeyLight": {
        "energy": 15000,
        "color": (1.0, 0.92, 0.75),
        "spot_size": 25, # Degrees
        "spot_blend": 0.5,
    },
    "ArborKeyLight": {
        "energy": 15000,
        "color": (0.85, 0.95, 1.0),
        "spot_size": 25,
        "spot_blend": 0.5,
    },
    "GnomeKeyLight": {
        "energy": 8000,
        "color": (0.4, 0.8, 0.3),
        "spot_size": 30,
        "spot_blend": 0.7,
    },
    "DomeFill": {
        "energy": 3000,
        "color": (0.9, 1.0, 0.9),
        "size": 20.0,
    },
    "LightShaftBeam": {
        "energy": 80000,
        "spot_size": 20,
        "spot_blend": 1.0,
    }
}

# Dialogue scene brightness boost
DIALOGUE_BOOST = {
    "target_energy": 25000,
    "fade_duration": 12, # frames
}

# Gnome defeat dimming schedule
GNOME_DEFEAT_PRESETS = {
    "scene19_dialogue": 8000,
    "scene20_dialogue": 4000,
    "scene21_dialogue": 1500,
    "scene22_retreat": 500,
}

# Sun/Dawn progression presets
DAWN_COLORS = [
    (1, (0.1, 0.2, 0.5)),    # Pre-dawn
    (4000, (1.0, 0.6, 0.2)), # Golden hour
    (8000, (1.0, 0.9, 0.8)), # Midday
    (15000, (1.0, 1.0, 1.0)) # Bright
]
