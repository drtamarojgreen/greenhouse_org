import bpy

def header(title):
    print("
" + "="*70)
    print(title)
    print("="*70)

scene = bpy.context.scene

header("ENGINE")

print("Render Engine:", scene.render.engine)

# -------------------------------------------------
# COLOR MANAGEMENT
# -------------------------------------------------
header("COLOR MANAGEMENT")

vs = scene.view_settings
print("View Transform:", vs.view_transform)
print("Exposure:", vs.exposure)
print("Gamma:", vs.gamma)
print("Look:", vs.look)

# -------------------------------------------------
# FILM / TRANSPARENCY
# -------------------------------------------------
header("FILM")

if hasattr(scene.render, "film_transparent"):
    print("Film Transparent:", scene.render.film_transparent)
else:
    print("Film transparency property not found (API change).")

# -------------------------------------------------
# WORLD SETTINGS
# -------------------------------------------------
header("WORLD")

world = scene.world
if not world:
    print("No world assigned.")
else:
    print("World:", world.name)
    if world.use_nodes:
        for node in world.node_tree.nodes:
            print("Node:", node.type)
            if node.type == "BACKGROUND":
                print("  Strength:", node.inputs[1].default_value)
            if node.type in {"VOLUME_SCATTER", "VOLUME_ABSORPTION"}:
                print("  Density:", node.inputs.get("Density", None))
                print("  Anisotropy:", node.inputs.get("Anisotropy", None))
    else:
        print("World not using nodes.")

# -------------------------------------------------
# CAMERA
# -------------------------------------------------
header("CAMERA")

cam = scene.camera
if not cam:
    print("No active camera.")
else:
    print("Camera:", cam.name)
    data = cam.data
    print("Clip Start:", data.clip_start)
    print("Clip End:", data.clip_end)
    print("Location:", cam.location)
    print("Rotation:", cam.rotation_euler)

# -------------------------------------------------
# OBJECT VISIBILITY
# -------------------------------------------------
header("OBJECT VISIBILITY")

visible_meshes = []
for obj in scene.objects:
    if obj.type == "MESH":
        print(obj.name, "| hide_render:", obj.hide_render)
        if not obj.hide_render:
            visible_meshes.append(obj)

print("Renderable Mesh Count:", len(visible_meshes))

# -------------------------------------------------
# LIGHTS
# -------------------------------------------------
header("LIGHTS")

lights = [o for o in scene.objects if o.type == "LIGHT"]
if not lights:
    print("No lights found.")
else:
    for l in lights:
        print(l.name, "| Energy:", l.data.energy, "| hide_render:", l.hide_render)

# -------------------------------------------------
# COMPOSITOR
# -------------------------------------------------
header("COMPOSITOR")

print("Use Nodes:", scene.use_nodes)

if scene.use_nodes and scene.node_tree:
    for node in scene.node_tree.nodes:
        print("Node:", node.type)

# -------------------------------------------------
# ENGINE-SPECIFIC SETTINGS (SAFE INTROSPECTION)
# -------------------------------------------------
header("ENGINE-SPECIFIC PROPERTIES")

engine_settings = None

# Try common locations safely
if hasattr(scene, "eevee"):
    engine_settings = scene.eevee
elif hasattr(scene, "eevee_next"):
    engine_settings = scene.eevee_next
elif hasattr(scene.render, "engine_settings"):
    engine_settings = scene.render.engine_settings

if engine_settings:
    print("Engine settings found:", type(engine_settings))
    for prop in dir(engine_settings):
        if not prop.startswith("_"):
            try:
                value = getattr(engine_settings, prop)
                if isinstance(value, (int, float, bool, str)):
                    print(prop, "=", value)
            except:
                pass
else:
    print("No accessible engine-specific block found.")

header("DONE")
