try:
    import bpy
    import bmesh
    import mathutils
except ImportError:
    bpy = None
    bmesh = None
    mathutils = None

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
M10_ROOT = os.path.dirname(TEST_DIR)

modules = {
    'AssetManager': 'asset_manager',
    'Director': 'director',
    'build_scene': 'render',
    'AnimationHandler': 'animation_handler',
    'CharacterBuilder': 'character_builder'
}

for filename in os.listdir(TEST_DIR):
    if filename.startswith('test_') and filename.endswith('.py'):
        path = os.path.join(TEST_DIR, filename)
        with open(path, 'r') as f:
            lines = f.readlines()

        new_lines = []
        for line in lines:
            # Skip any existing try/except/from blocks for these modules
            if 'import' in line and any(m in line for m in modules.values()):
                if 'movie_configuration' in line:
                    new_lines.append(line)
                continue
            if line.strip() in ['try:', 'except ImportError:', 'except (ImportError, ModuleNotFoundError):']:
                continue
            if 'from ..' in line or 'from ...' in line:
                continue
            new_lines.append(line)

        # Re-insert clean imports at the top, after path setup
        insert_idx = 0
        for i, line in enumerate(new_lines):
            if 'import movie_configuration' in line:
                insert_idx = i + 1
                break

        import_blocks = []
        for cls, mod in modules.items():
            block = f"try:\n    from {mod} import {cls}\nexcept ImportError:\n    try:\n        from ..{mod} import {cls}\n    except ImportError:\n        {cls} = None\n"
            import_blocks.append(block)

        for block in reversed(import_blocks):
            new_lines.insert(insert_idx, block)

        with open(path, 'w') as f:
            f.writelines(new_lines)
