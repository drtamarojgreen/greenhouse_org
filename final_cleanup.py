import os

root_dir = 'scripts/blender/movie/10'

def clean_file(path):
    with open(path, 'r') as f:
        lines = f.readlines()

    new_lines = []
    # Remove any existing shims we might have messed up
    in_bad_shim = False
    for line in lines:
        if line.strip().startswith('try:') and ('import bpy' in line or 'import bmesh' in line or 'import mathutils' in line):
            in_bad_shim = True
            continue
        if in_bad_shim and ('except ImportError:' in line or 'bpy = None' in line or 'bmesh = None' in line or 'mathutils = None' in line):
            if 'mathutils = None' in line or 'None' in line:
                in_bad_shim = False
            continue
        if line.strip() == 'try:':
            continue
        new_lines.append(line)

    # Standard robust shim
    shim = [
        "try:\n",
        "    import bpy\n",
        "    import bmesh\n",
        "    import mathutils\n",
        "except ImportError:\n",
        "    bpy = None\n",
        "    bmesh = None\n",
        "    mathutils = None\n\n"
    ]

    with open(path, 'w') as f:
        f.writelines(shim + new_lines)

for dirpath, _, filenames in os.walk(root_dir):
    for f in filenames:
        if f.endswith('.py') and f != 'final_cleanup.py':
            clean_file(os.path.join(dirpath, f))
