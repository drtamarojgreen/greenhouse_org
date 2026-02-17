# Canonical SCENE_MAP for Greenhouse Movie Production
# (start_frame, end_frame)
SCENE_MAP = {
    'branding': (1, 100),
    'intro': (101, 200),
    'brain': (201, 400),
    'garden': (401, 650),
    'socratic': (651, 950),
    'exchange': (951, 1250),
    'forge': (1251, 1500),
    'bridge': (1501, 1800),
    'shadow': (1801, 2500),
    'library': (2501, 2800),
    'resonance': (2801, 3500),
    'lab': (3501, 3800),
    'sanctuary': (3801, 4100),
    'finale': (4101, 4500),
    'interaction': (4501, 9500),
    'scene16': (9501, 10200),
    'scene17': (10201, 10900),
    'scene18': (10901, 11600),
    'scene19': (11601, 12300),
    'scene20': (12301, 13000),
    'scene21': (13001, 13700),
    'scene22': (13701, 14500),
    'credits': (14501, 15000)
}

# Quality Presets
QUALITY_PRESETS = {
    'test': {'samples': 32, 'denoising': True},
    'preview': {'samples': 64, 'denoising': True},
    'final': {'samples': 128, 'denoising': True}
}
