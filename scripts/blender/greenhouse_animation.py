import bpy
import math

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
# Clear existing objects
if bpy.context.object:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)

# ------------------------------------------------------------
# 3. BACKGROUND SETUP
# ------------------------------------------------------------
bpy.context.scene.world.use_nodes = True
bg_nodes = bpy.context.scene.world.node_tree.nodes
# Ensure "Background" node exists, handle if not
if "Background" in bg_nodes:
    bg_nodes["Background"].inputs[0].default_value = (*PALE_BACKGROUND_SAGE[:3], 1)
else:
    # Add a background node if it's missing
    bg_node = bg_nodes.new(type='ShaderNodeBackground')
    bg_node.inputs[0].default_value = (*PALE_BACKGROUND_SAGE[:3], 1)
    node_tree = bpy.context.scene.world.node_tree
    node_tree.links.new(bg_node.outputs['Background'], node_tree.nodes['World Output'].inputs['Surface'])


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

# ------------------------------------------------------------
# 5. CREATE TEXT OBJECTS
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
    # Use a copy of the material for each object to allow independent animation
    obj.data.materials.append(mat_text.copy())
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
    """Animate a subtle scale pulse and color change."""
    # Animate Base Color
    mat = obj.active_material
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    color_input = bsdf.inputs["Base Color"]

    original_color = PRIMARY_BRAND_GREEN
    pulse_color = GROWTH_GREEN

    # Set color before pulse
    color_input.default_value = original_color
    color_input.keyframe_insert("default_value", frame=start - 1)

    # Change to accent color for the pulse
    color_input.default_value = pulse_color
    color_input.keyframe_insert("default_value", frame=start)

    # Return to original color after the pulse
    color_input.default_value = original_color
    color_input.keyframe_insert("default_value", frame=end + 1)

    # Animate Scale
    # Preserve original scale by capturing it before animating
    original_scale = obj.scale.x

    obj.scale = (original_scale, original_scale, original_scale)
    obj.keyframe_insert(data_path="scale", frame=start)

    obj.scale = (original_scale * 1.08, original_scale * 1.08, original_scale * 1.08)
    obj.keyframe_insert(data_path="scale", frame=(start + end) // 2)

    obj.scale = (original_scale, original_scale, original_scale)
    obj.keyframe_insert(data_path="scale", frame=end)


# Fade-in opacity animation
def animate_fade_in(obj, start, end):
    mat = obj.active_material
    # Ensure material is set to allow transparency
    mat.blend_method = 'BLEND'
    mat.shadow_method = 'NONE' # Optional: improve performance

    bsdf = mat.node_tree.nodes["Principled BSDF"]
    alpha_input = bsdf.inputs["Alpha"]

    # Start fully transparent
    alpha_input.default_value = 0.0
    alpha_input.keyframe_insert("default_value", frame=start)

    # End fully opaque
    alpha_input.default_value = 1.0
    alpha_input.keyframe_insert("default_value", frame=end)


# Apply animations
animate_fade_in(text1, start=1, end=30)
animate_growth_pulse(text1, start=40, end=70)

animate_fade_in(text2, start=20, end=50)
animate_growth_pulse(text2, start=60, end=90)

# ------------------------------------------------------------
# 7. CAMERA SETUP
# ------------------------------------------------------------
bpy.ops.object.camera_add(location=(0, -6, 0), rotation=(math.radians(90), 0, math.radians(180)))
camera = bpy.context.object
bpy.context.scene.camera = camera

# ------------------------------------------------------------
# 8. RENDER SETTINGS (30 FPS)
# ------------------------------------------------------------
scene = bpy.context.scene
scene.render.image_settings.file_format = 'PNG'
scene.render.filepath = "/tmp/frame.png"
scene.render.fps = 30
scene.frame_start = 1
scene.frame_end = 120
scene.render.engine = 'BLENDER_EEVEE'
# Add a render command
bpy.ops.render.render(animation=True)


print("GreenhouseMHD text animation setup complete.")
