import sys
import os
from unittest.mock import MagicMock

# Mock bpy and other blender-specific modules
mock_bpy = MagicMock()
sys.modules["bpy"] = mock_bpy
sys.modules["mathutils"] = MagicMock()
sys.modules["bmesh"] = MagicMock()

# Add paths to sys.path
MOVIE_DIR = os.path.abspath("scripts/blender/movie")
ASSETS_DIR = os.path.join(MOVIE_DIR, "assets")

if MOVIE_DIR not in sys.path:
    sys.path.append(MOVIE_DIR)
if ASSETS_DIR not in sys.path:
    sys.path.append(ASSETS_DIR)

# Mock modules for sequel_generator
sys.modules["unity_exporter"] = MagicMock()
sys.modules["gnome_antagonist"] = MagicMock()
sys.modules["greenhouse_structure"] = MagicMock()
sys.modules["environment_props"] = MagicMock()

# Mock scene modules
scenes = [
    "scene00_branding", "scene12_credits", "scene13_walking", "scene14_duel"
]
for s in scenes:
    sys.modules[s] = MagicMock()

try:
    import plant_humanoid
    print("Successfully imported plant_humanoid")

    # Check if new functions exist
    assert hasattr(plant_humanoid, 'animate_expression'), "animate_expression missing"
    assert hasattr(plant_humanoid, 'animate_walk'), "animate_walk missing"
    print("Verified plant_humanoid functions")

    import sequel_generator
    print("Successfully imported sequel_generator")

    # Test scene logic imports (re-importing to ensure they pick up changes)
    import scene13_walking.scene_logic as scene13
    import scene14_duel.scene_logic as scene14
    print("Successfully imported scenes")

    print("Verification complete.")
except Exception as e:
    print(f"Verification failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
