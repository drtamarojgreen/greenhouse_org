try:
    import bpy
    import bmesh
    import mathutils
except ImportError:
    bpy = None
    bmesh = None
    mathutils = None

import os
import re

TEST_DIR = os.path.dirname(os.path.abspath(__file__))

# Modules that were causing issues
target_modules = ['asset_manager', 'director', 'render', 'animation_handler', 'character_builder', 'components']

for filename in os.listdir(TEST_DIR):
    if filename.startswith('test_') and filename.endswith('.py'):
        path = os.path.join(TEST_DIR, filename)
        with open(path, 'r') as f:
            lines = f.readlines()

        new_lines = []
        for line in lines:
            # Strip all problematic lines
            if any(f'from {m}' in line for m in target_modules) or                any(f'import {m}' in line for m in target_modules) or                line.strip() in ['try:', 'except ImportError:', 'except (ImportError, ModuleNotFoundError):'] or                'from ..' in line or 'from ...' in line:
                continue
            new_lines.append(line)

        # Find where to insert new clean imports (after movie_configuration)
        insert_idx = 0
        for i, line in enumerate(new_lines):
            if 'import movie_configuration' in line:
                insert_idx = i + 1
                break

        clean_imports = [
            "try:\n",
            "    from asset_manager import AssetManager\n",
            "    from director import Director\n",
            "    from render import build_scene\n",
            "    from animation_handler import AnimationHandler\n",
            "    from character_builder import CharacterBuilder\n",
            "    import components\n",
            "except ImportError:\n",
            "    from ..asset_manager import AssetManager\n",
            "    from ..director import Director\n",
            "    from ..render import build_scene\n",
            "    from ..animation_handler import AnimationHandler\n",
            "    from ..character_builder import CharacterBuilder\n",
            "    from .. import components\n"
        ]

        for line in reversed(clean_imports):
            new_lines.insert(insert_idx, line)

        with open(path, 'w') as f:
            f.writelines(new_lines)
