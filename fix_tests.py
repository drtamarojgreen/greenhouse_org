import os
import re

TEST_DIR = 'scripts/blender/movie/10/tests/unit/'
modules_to_fix = ['asset_manager', 'director', 'render', 'animation_handler', 'character_builder']

for filename in os.listdir(TEST_DIR):
    if filename.startswith('test_') and filename.endswith('.py'):
        path = os.path.join(TEST_DIR, filename)
        with open(path, 'r') as f:
            lines = f.readlines()

        new_lines = []
        skip = False
        for line in lines:
            # Skip old broken try/except/from blocks
            if re.match(r'^\s*try:', line) or re.match(r'^\s*except.*:', line) or any(f'from {m}' in line for m in modules_to_fix):
                continue
            new_lines.append(line)

        # Find where to insert new imports (after mc)
        insert_idx = 0
        for i, line in enumerate(new_lines):
            if 'import movie_configuration as mc' in line:
                insert_idx = i + 1
                break

        import_block = """
try:
    from asset_manager import AssetManager
except ImportError:
    from ..asset_manager import AssetManager
try:
    from director import Director
except ImportError:
    from ..director import Director
try:
    from render import build_scene
except ImportError:
    from ..render import build_scene
try:
    from animation_handler import AnimationHandler
except ImportError:
    from ..animation_handler import AnimationHandler
try:
    from character_builder import CharacterBuilder
except ImportError:
    from ..character_builder import CharacterBuilder
"""
        new_lines.insert(insert_idx, import_block)

        with open(path, 'w') as f:
            f.writelines(new_lines)
