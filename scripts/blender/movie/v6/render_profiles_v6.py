import bpy
import os

def apply_render_profile_v6(scene, quality='test'):
    """Version 6 Render Profiles using EEVEE_NEXT (Blender 5.0)."""

    # Global V6 defaults
    scene.render.engine = 'BLENDER_EEVEE_NEXT'
    scene.eevee.taa_render_samples = 64
    scene.eevee.use_gtao = True
    scene.eevee.use_bloom = True
    scene.eevee.use_ssr = True

    profiles = {
        'test': {
            'samples': 16,
            'use_denoising': False,
            'resolution_percentage': 50
        },
        'draft': {
            'samples': 32,
            'use_denoising': True,
            'resolution_percentage': 75
        },
        'preview': {
            'samples': 64,
            'use_denoising': True,
            'resolution_percentage': 100
        },
        'final': {
            'samples': 128,
            'use_denoising': True,
            'resolution_percentage': 100
        }
    }

    config = profiles.get(quality, profiles['test'])
    scene.eevee.taa_render_samples = config['samples']
    scene.render.resolution_percentage = config['resolution_percentage']

    return config
