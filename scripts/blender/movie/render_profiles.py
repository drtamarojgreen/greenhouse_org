"""
Unified Render Profiles Module
Merges legacy QUALITY_PRESETS and modern Version 4 presets.
"""

PROFILES = {
    "draft": {
        "engine": "BLENDER_EEVEE_NEXT",
        "samples": 4,
        "denoising": False,
        "resolution_scale": 50,
        "motion_blur": False,
        "format": "PNG",
        "color_mode": "RGB"
    },
    "test": {
        "engine": "BLENDER_EEVEE_NEXT",
        "samples": 32,
        "denoising": True,
        "resolution_scale": 100,
        "motion_blur": False,
        "format": "PNG",
        "color_mode": "RGB"
    },
    "preview": {
        "engine": "BLENDER_EEVEE_NEXT",
        "samples": 64,
        "denoising": True,
        "resolution_scale": 100,
        "motion_blur": False,
        "format": "PNG",
        "color_mode": "RGB"
    },
    "review": {
        "engine": "BLENDER_EEVEE_NEXT",
        "samples": 32,
        "denoising": True,
        "resolution_scale": 100,
        "motion_blur": True,
        "format": "PNG",
        "color_mode": "RGB"
    },
    "final": {
        "engine": "CYCLES",
        "samples": 128,
        "denoising": True,
        "resolution_scale": 100,
        "motion_blur": True,
        "format": "PNG",
        "color_mode": "RGBA"
    }
}

def get_profile(name):
    return PROFILES.get(name, PROFILES["test"])

def apply_render_profile(scene, name):
    """Applies a render profile to a Blender scene."""
    profile = get_profile(name)

    scene.render.engine = profile["engine"]
    if profile["engine"] == 'CYCLES':
        scene.cycles.samples = profile["samples"]
        scene.cycles.use_denoising = profile.get("denoising", True)
    else:
        # Eevee-Next uses taa_render_samples in Blender 5.0
        if hasattr(scene, "eevee"):
            scene.eevee.taa_render_samples = profile["samples"]

    scene.render.resolution_percentage = profile.get("resolution_scale", 100)
    scene.render.use_motion_blur = profile["motion_blur"]
    scene.render.image_settings.file_format = profile["format"]
    scene.render.image_settings.color_mode = profile["color_mode"]

    print(f"Render profile '{name}' applied ({profile['engine']}).")
    return profile
