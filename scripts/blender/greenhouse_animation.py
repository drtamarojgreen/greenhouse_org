import bpy
import math
import os

# ------------------------------------------------------------
# 1. BRAND COLORS (RGBA)
# ------------------------------------------------------------
PRIMARY_BRAND_GREEN = (0.106, 0.302, 0.118, 1)   # Text color
SECONDARY_SAGE = (0.522, 0.631, 0.490, 1)
PALE_BACKGROUND_SAGE = (0.769, 0.812, 0.729, 1)

GROWTH_GREEN = (0.000, 0.741, 0.012, 1)          # Accent (animation only)
WARM_HIGHLIGHT = (0.988, 0.816, 0.035, 1)

# ------------------------------------------------------------
# 2. CLEAN SCENE
# ------------------------------------------------------------
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

# ------------------------------------------------------------
# 3. BACKGROUND SETUP
# ------------------------------------------------------------
bpy.context.scene.world.use_nodes = True
bg_nodes = bpy.context.scene.world.node_tree.nodes
bg_nodes["Background"].inputs[0].default_value = (*PALE_BACKGROUND_SAGE[:3], 1)

# ------------------------------------------------------------
# 4. CREATE MATERIALS
# ------------------------------------------------------------
def make_material(name, rgba):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = rgba
    return mat

mat_text = make_material("PrimaryBrandGreen", PRIMARY_BRAND_GREEN)
mat_accent = make_material("GrowthAccent", GROWTH_GREEN)

# ------------------------------------------------------------
# 5. CREATE LOGO PLANE
# ------------------------------------------------------------
def create_logo_plane():
    bpy.ops.mesh.primitive_plane_add(size=4, location=(0, 0, -1))
    plane = bpy.context.object
    plane.name = "LogoPlane"

    # Create material for the logo
    mat_logo = make_material("LogoMaterial", (1, 1, 1, 1))
    plane.data.materials.append(mat_logo)

    # Set up material nodes to use the logo image
    bsdf = mat_logo.node_tree.nodes["Principled BSDF"]
    tex_image = mat_logo.node_tree.nodes.new('ShaderNodeTexImage')
    tex_image.image = bpy.data.images.load("docs/images/Greenhouse_Logo.png")
    mat_logo.node_tree.links.new(bsdf.inputs['Base Color'], tex_image.outputs['Color'])
    return plane

logo_plane = create_logo_plane()


# ------------------------------------------------------------
# 6. CREATE TEXT OBJECTS
# ------------------------------------------------------------
def create_text(name, content, location, scale=1.0):
    bpy.ops.object.text_add(location=location)
    obj = bpy.context.object
    obj.name = name
    obj.data.body = content
    obj.data.extrude = 0.02
    obj.data.bevel_depth = 0.002
    obj.scale = (scale, scale, scale)
    obj.data.align_x = 'CENTER'
    obj.data.align_y = 'CENTER'
    obj.data.materials.append(mat_text)
    return obj

text1 = create_text(
    "GreenhouseTitle",
    "The Greenhouse for Mental Health Development",
    location=(0, 0, 0.5),
    scale=0.9
)

text2 = create_text(
    "GreenhouseTagline",
    "Bloom Into Your Better Self",
    location=(0, 0, -0.5),
    scale=0.7
)

# ------------------------------------------------------------
# 6. ANIMATION: FADE-IN + GROWTH ACCENT PULSE
# ------------------------------------------------------------
def animate_growth_pulse(obj, start, end):
    """Animate a subtle scale pulse using Growth Green accent."""
    # Add accent material temporarily
    obj.active_material = mat_accent

    # Keyframes for scale pulse
    obj.scale = (1.0, 1.0, 1.0)
    obj.keyframe_insert(data_path="scale", frame=start)

    obj.scale = (1.08, 1.08, 1.08)
    obj.keyframe_insert(data_path="scale", frame=(start + end) // 2)

    obj.scale = (1.0, 1.0, 1.0)
    obj.keyframe_insert(data_path="scale", frame=end)

    # Return to brand color after pulse
    obj.active_material = mat_text
    obj.active_material.keyframe_insert("diffuse_color", frame=end + 1)

# Fade-in opacity animation
def animate_fade_in(obj, start, end):
    mat = obj.active_material
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    alpha_input = bsdf.inputs["Alpha"]

    alpha_input.default_value = 0.0
    alpha_input.keyframe_insert("default_value", frame=start)

    alpha_input.default_value = 1.0
    alpha_input.keyframe_insert("default_value", frame=end)

    mat.blend_method = 'BLEND'

# Apply animations
# animate_fade_in(text1, start=1, end=30)
# animate_growth_pulse(text1, start=40, end=70)

# animate_fade_in(text2, start=20, end=50)
# animate_growth_pulse(text2, start=60, end=90)

# ------------------------------------------------------------
# 7. CAMERA SETUP
# ------------------------------------------------------------
bpy.ops.object.camera_add(location=(0, -8, 0), rotation=(math.radians(90), 0, math.radians(180)))
camera = bpy.context.object
bpy.context.scene.camera = camera

# ------------------------------------------------------------
# 8. RENDER SETTINGS (SINGLE FRAME)
# ------------------------------------------------------------
scene = bpy.context.scene
scene.render.fps = 30
scene.frame_start = 1
scene.frame_end = 1
scene.render.engine = 'CYCLES'
bpy.context.scene.cycles.use_denoising = False
scene.render.image_settings.file_format = 'PNG'
scene.render.filepath = "//greenhouse_logo_render.png"

# --- RENDER ---
bpy.ops.render.render(write_still=True)


print("GreenhouseMHD text animation setup complete.")
