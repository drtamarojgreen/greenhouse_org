# Canonical SCENE_MAP for Greenhouse Movie Production
# (start_frame, end_frame)
SCENE_MAP = {
    'scene00_branding': (1, 100),
    'scene01_intro': (101, 200),
    'scene_brain': (201, 400),
    'scene02_garden': (401, 650),
    'scene03_socratic': (651, 950),
    'scene04_knowledge': (951, 1250), # The Exchange of Knowledge
    'scene04_forge': (1251, 1500),    # The Forge of Fortitude
    'scene05_bridge': (1501, 1800),
    'scene07_shadow': (1801, 2500),
    'scene09_library': (2501, 2800),
    'scene06_resonance': (2801, 3500),
    'scene10_lab': (3501, 3800),
    'scene11_sanctuary': (3801, 4100),
    'scene_finale': (4101, 4500),
    'scene15_interaction': (4501, 9500),
    'interaction': (4501, 9500), # Alias for test
    'scene16_dialogue': (9501, 10200),
    'scene17_dialogue': (10201, 10900),
    'scene18_dialogue': (10901, 11600),
    'scene19_dialogue': (11601, 12300),
    'scene20_dialogue': (12301, 13000),
    'scene21_dialogue': (13001, 13700),
    'scene22_retreat': (13701, 14500),
    'scene12_credits': (14501, 15000)
}

# Quality Presets
QUALITY_PRESETS = {
    'test': {'samples': 32, 'denoising': True},
    'preview': {'samples': 64, 'denoising': True},
    'final': {'samples': 128, 'denoising': True}
}
