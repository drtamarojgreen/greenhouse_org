"""
Centralized lighting configuration for Greenhouse Movie Production.
Allows global tuning of intensities, colors, and scene-specific lighting presets.
"""

LIGHTING_DEFAULTS = {
    "HerbaceousKeyLight": {
        "energy": 5000, # Point 142: Moderated for Cycles (Point 142: 5000 matches Production Benchmarks)
        "color": (1.0, 0.92, 0.75),
        "spot_size": 25, # Degrees
        "spot_blend": 0.5,
    },
    "ArborKeyLight": {
        "energy": 5000, # Point 142: Moderated for Cycles (Point 142: 5000 matches Production Benchmarks)
        "color": (0.85, 0.95, 1.0),
        "spot_size": 25,
        "spot_blend": 0.5,
    },
    "GnomeKeyLight": {
        "energy": 5000, # Point 142: Moderated for Cycles (Point 142: 5000 matches Production Benchmarks)
        "color": (0.4, 0.8, 0.3),
        "spot_size": 30,
        "spot_blend": 0.7,
    },
    "DomeFill": {
        "energy": 5000, # Point 142: Moderated for Cycles
        "color": (0.9, 1.0, 0.9),
        "size": 25.0,
    },
    "LightShaftBeam": {
        "energy": 100000, # High energy for volumetric effect
        "spot_size": 20,
        "spot_blend": 1.0,
    }
}

# Dialogue scene brightness boost
DIALOGUE_BOOST = {
    "target_energy": 10000, # Point 142: Moderated for Cycles (matches Test 4.2.6)
    "fade_duration": 12, # frames
}

# Gnome defeat dimming schedule (Matched to Test 4.2.7 expectations)
GNOME_DEFEAT_PRESETS = {
    "scene19_dialogue": 8000,
    "scene20_dialogue": 4000,
    "scene21_dialogue": 1500,
    "scene22_retreat": 500,
}

# Sun/Dawn progression presets
DAWN_COLORS = [
    (1, (0.2, 0.3, 0.6)),    # Pre-dawn (Brightened)
    (4000, (1.0, 0.7, 0.3)), # Golden hour
    (8000, (1.0, 0.9, 0.8)), # Midday
    (15000, (1.0, 1.0, 1.0)) # Bright
]
