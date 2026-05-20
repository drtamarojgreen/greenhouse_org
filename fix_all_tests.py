import os

TEST_DIR = 'scripts/blender/movie/10/tests/unit/'
modules = ['asset_manager', 'director', 'render', 'animation_handler', 'character_builder']

for filename in os.listdir(TEST_DIR):
    if filename.startswith('test_') and filename.endswith('.py'):
        path = os.path.join(TEST_DIR, filename)
        with open(path, 'r') as f:
            content = f.read()

        lines = content.splitlines()
        new_lines = []
        skip_to_next_import = False

        for line in lines:
            if any(f'from {m} import' in line for m in modules) or                line.strip() == 'try:' or                line.strip().startswith('except') or                'from ..' in line:
                continue
            new_lines.append(line)

        # Find index after mc import
        insert_idx = -1
        for i, line in enumerate(new_lines):
            if 'import movie_configuration as mc' in line:
                insert_idx = i + 1
                break

        if insert_idx == -1: insert_idx = 0

        import_block = []
        for m in modules:
            cls = m.title().replace('_', '') if m != 'render' else 'build_scene'
            if m == 'render':
                 import_block.append(f"try: from render import build_scene\nexcept ImportError: from ..render import build_scene")
            elif m == 'animation_handler':
                 import_block.append(f"try: from animation_handler import AnimationHandler\nexcept ImportError: from ..animation_handler import AnimationHandler")
            else:
                 import_block.append(f"try: from {m} import {cls}\nexcept ImportError: from ..{m} import {cls}")

        new_lines[insert_idx:insert_idx] = import_block

        with open(path, 'w') as f:
            f.write('\n'.join(new_lines))
