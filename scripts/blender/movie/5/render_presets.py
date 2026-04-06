"""
Render Presets Module
Shared quality profiles for preview, review, and final production.
"""

PRESETS = {
    "preview": {
        "engine": "BLENDER_EEVEE",
        "samples": 32,
        "motion_blur": False,
        "format": "PNG",
        "color_mode": "RGB"
    },
    "review": {
        "engine": "BLENDER_EEVEE",
        "samples": 32, # High-quality review mode
        "motion_blur": True,
        "format": "PNG",
        "color_mode": "RGB"
    },
    "final": {
        "engine": "CYCLES",
        "samples": 128, # Professional quality but optimized
        "motion_blur": True,
        "format": "PNG",
        "color_mode": "RGBA" # Alpha for compositing
    }
}

def GET_PRESET(name):
    return PRESETS.get(name, PRESETS["preview"])

def apply_render_preset(name):
    """Applies the selected quality preset to the Blender scene."""
    import bpy
    preset = GET_PRESET(name)
    scene = bpy.context.scene
    
    scene.render.engine = preset["engine"]
    if preset["engine"] == 'CYCLES':
        scene.cycles.samples = preset["samples"]
    elif preset["engine"] == 'BLENDER_EEVEE':
        scene.eevee.taa_render_samples = preset["samples"]
        
    scene.render.use_motion_blur = preset["motion_blur"]
    scene.render.image_settings.file_format = preset["format"]
    scene.render.image_settings.color_mode = preset["color_mode"]
    
    print(f"Render preset '{name}' applied ({preset['engine']}).")
