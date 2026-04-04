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
