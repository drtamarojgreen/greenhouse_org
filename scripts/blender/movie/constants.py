# Canonical SCENE_MAP for Greenhouse Movie Production
# (start_frame, end_frame)
# Point 142: Normalized Scene Map to match directory structure and avoid overlaps
SCENE_MAP = {
    'scene00_branding': (1, 100),
    'scene01_intro': (101, 200),
    'scene_brain': (201, 400),
    'scene02_garden': (401, 650),
    'scene03_socratic': (651, 950),
    'scene04_forge': (951, 1250),
    'scene05_bridge': (1251, 1500),
    'scene06_resonance': (1501, 1800),
    'scene07_shadow': (1801, 2100),
    'scene08_confrontation': (2101, 2500),
    'scene09_library': (2501, 2800),
    'scene10_futuristic_lab': (2801, 3300),
    'scene11_nature_sanctuary': (3301, 3800),
    'scene13_walking': (3801, 4100),
    'scene14_duel': (4101, 4500),
    'scene15_interaction': (4501, 9500),
    'scene16_dialogue': (9501, 10200),
    'scene17_dialogue': (10201, 10900),
    'scene18_dialogue': (10901, 11600),
    'scene19_dialogue': (11601, 12300),
    'scene20_dialogue': (12301, 13000),
    'scene21_dialogue': (13001, 13700),
    'scene22_retreat': (13701, 14500),
    'scene12_credits': (14501, 15000)
}

# Separate aliases to avoid breaking contiguity tests
SCENE_ALIASES = {
    'interaction': (4501, 9500),
    'scene22': (13701, 14500),
    'scene10_lab': (2801, 3300),
    'scene11_sanctuary': (3301, 3800),
    'scene04_knowledge': (951, 1250)
}

# Quality Presets
QUALITY_PRESETS = {
    'test': {'samples': 32, 'denoising': True},
    'preview': {'samples': 64, 'denoising': True},
    'final': {'samples': 128, 'denoising': True}
}
