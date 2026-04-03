"""
Constants for the Verdant Pulse (Movie v2.0)
CLEAN SLATE: Zero legacy dependencies.
"""

TOTAL_FRAMES = 8500

SCENE_MAP = {
    'S01_the_seed': (1, 2000),      # Discovery
    'S02_infrastructure': (2001, 5500), # Navigation
    'S03_the_bloom': (5501, 8500)   # Transformation
}

# Cycles-Native Lighting Benchmarks
BRIGHT_INTENSITY = 10000
RIM_INTENSITY = 8000
FILL_INTENSITY = 5000
SUN_ENERGY = 15.0

# Professional Color Palettes
PALETTE_VAULT = (0.05, 0.08, 0.1, 1) # Cold Steel
PALETTE_BLOOM = (0.1, 0.3, 0.1, 1) # Rich Moss
PALETTE_BLIGHT = (0.02, 0.01, 0.03, 1) # Entropic Violet
