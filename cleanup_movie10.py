import os

root = 'scripts/blender/movie/10/'
for dirpath, dirnames, filenames in os.walk(root):
    for f in filenames:
        if f.endswith('.py'):
            path = os.path.join(dirpath, f)
            with open(path, 'r') as file:
                lines = file.readlines()

            # Remove all the "try: import bpy..." junk we added repeatedly
            new_lines = []
            in_shim = False
            for line in lines:
                if line.startswith('try:') and ('import bpy' in line or 'import bmesh' in line or 'import mathutils' in line):
                    in_shim = True
                    continue
                if in_shim and ('except ImportError:' in line or 'bpy = None' in line or 'bmesh = None' in line or 'mathutils = None' in line):
                    if 'mathutils = None' in line: in_shim = False
                    continue
                if line.strip() == 'try:': # Catch remaining single try lines
                    continue
                new_lines.append(line)

            # Prepend a single clean shim
            shim = [
                "try:\n",
                "    import bpy\n",
                "    import bmesh\n",
                "    import mathutils\n",
                "except ImportError:\n",
                "    bpy = None\n",
                "    bmesh = None\n",
                "    mathutils = None\n"
            ]

            with open(path, 'w') as file:
                file.writelines(shim + new_lines)
