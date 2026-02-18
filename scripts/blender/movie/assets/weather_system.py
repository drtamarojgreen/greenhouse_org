import bpy
import math
import mathutils
import random
import style

def create_rain_material():
    """Translucent streak material for raindrops."""
    mat = bpy.data.materials.get("RainMat")
    if mat: return mat

    mat = bpy.data.materials.new(name="RainMat")
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    nodes.clear()

    node_out = nodes.new(type='ShaderNodeOutputMaterial')
    node_bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')

    # Rain is nearly invisible - very pale blue, highly transparent
    node_bsdf.inputs['Base Color'].default_value = (0.75, 0.85, 0.95, 1)
    node_bsdf.inputs['Roughness'].default_value = 0.0
    node_bsdf.inputs['Alpha'].default_value = 0.15

    # Transmission for glass-like quality
    style.set_principled_socket(node_bsdf, 'Transmission', 0.9)

    style.set_blend_method(mat, 'BLEND')

    links.new(node_bsdf.outputs['BSDF'], node_out.inputs['Surface'])
    return mat

def create_rain_system(scene, frame_start, frame_end, intensity='MEDIUM', area_size=80):
    """
    Creates a particle-based rain system above the greenhouse.
    intensity: 'LIGHT', 'MEDIUM', 'HEAVY', 'STORM'
    """
    intensity_settings = {
        'LIGHT':  {'count': 2000,  'velocity': 18, 'size': 0.015},
        'MEDIUM': {'count': 6000,  'velocity': 22, 'size': 0.012},
        'HEAVY':  {'count': 15000, 'velocity': 28, 'size': 0.010},
        'STORM':  {'count': 30000, 'velocity': 35, 'size': 0.008},
    }
    settings = intensity_settings.get(intensity, intensity_settings['MEDIUM'])

    # Emitter plane high above scene
    bpy.ops.mesh.primitive_plane_add(
        size=area_size,
        location=(0, 0, 35)
    )
    emitter = bpy.context.object
    emitter.name = f"RainEmitter_{frame_start}"
    emitter.hide_render = True  # emitter itself invisible
    emitter.hide_viewport = True

    # Particle system
    emitter.modifiers.new(name="RainParticles", type='PARTICLE_SYSTEM')
    psys = emitter.particle_systems[0]
    settings_ps = psys.settings

    settings_ps.name = f"RainSettings_{frame_start}"
    settings_ps.type = 'EMITTER'
    settings_ps.count = settings['count']
    settings_ps.frame_start = frame_start
    settings_ps.frame_end = frame_end
    settings_ps.lifetime = 60           # frames to fall from 35 to ground
    settings_ps.lifetime_random = 0.2

    # Velocity - mostly downward with slight wind drift
    settings_ps.normal_factor = 0.0
    settings_ps.object_align_factor[2] = -settings['velocity']  # downward
    settings_ps.object_align_factor[1] = 2.0    # slight wind drift
    settings_ps.factor_random = 0.3

    # Size of each raindrop
    settings_ps.particle_size = settings['size']
    settings_ps.size_random = 0.3

    # Render as streaks (elongated along velocity)
    settings_ps.render_type = 'LINE'
    settings_ps.line_length_tail = 0.8
    settings_ps.line_length_head = 0.05

    # Physics
    settings_ps.use_dynamic_rotation = True
    settings_ps.brownian_factor = 0.1   # slight turbulence

    return emitter

def create_puddle_material():
    """Wet ground material - darker, more reflective than dry marble."""
    mat = bpy.data.materials.get("WetMarble")
    if mat: return mat

    mat = bpy.data.materials.new(name="WetMarble")
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    nodes.clear()

    node_out = nodes.new(type='ShaderNodeOutputMaterial')
    node_bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')

    # Same checker as main floor but darker and very glossy
    node_checker = nodes.new(type='ShaderNodeTexChecker')
    node_checker.inputs['Scale'].default_value = 10.0
    node_checker.inputs['Color1'].default_value = (0.04, 0.12, 0.05, 1)
    node_checker.inputs['Color2'].default_value = (0.30, 0.33, 0.28, 1)

    # Ripple normal map using animated noise
    node_ripple = nodes.new(type='ShaderNodeTexNoise')
    node_ripple.inputs['Scale'].default_value = 8.0
    node_ripple.inputs['Detail'].default_value = 12.0

    node_bump = nodes.new(type='ShaderNodeBump')
    node_bump.inputs['Strength'].default_value = 0.15

    links.new(node_checker.outputs['Color'], node_bsdf.inputs['Base Color'])
    links.new(node_ripple.outputs['Fac'], node_bump.inputs['Height'])
    links.new(node_bump.outputs['Normal'], node_bsdf.inputs['Normal'])

    node_bsdf.inputs['Roughness'].default_value = 0.02  # very wet/glossy
    node_bsdf.inputs['Metallic'].default_value = 0.0

    style.set_principled_socket(node_bsdf, 'Specular', 1.0)

    links.new(node_bsdf.outputs['BSDF'], node_out.inputs['Surface'])
    mat.cycles.displacement_method = 'BOTH'
    return mat

def create_rain_splashes(location, count=20, frame_start=1, frame_end=15000):
    """
    Ripple planes on the floor simulating splash impact.
    Uses animated scale to grow outward like real ripples.
    """
    splash_mat = bpy.data.materials.get("SplashMat")
    if not splash_mat:
        splash_mat = bpy.data.materials.new(name="SplashMat")
        splash_mat.use_nodes = True
        bsdf = splash_mat.node_tree.nodes["Principled BSDF"]
        bsdf.inputs['Alpha'].default_value = 0.3
        bsdf.inputs['Roughness'].default_value = 0.0
        style.set_blend_method(splash_mat, 'BLEND')

    splashes = []
    for i in range(count):
        offset = mathutils.Vector((
            random.uniform(-20, 20),
            random.uniform(-15, 15),
            -0.98  # just above floor
        ))
        bpy.ops.mesh.primitive_circle_add(
            radius=0.05,
            fill_type='NOTHING',  # ring, not disc
            location=location + offset
        )
        splash = bpy.context.object
        splash.name = f"RainSplash_{frame_start}_{i}"
        splash.data.materials.append(splash_mat)

        # Stagger splash timing so they don't all pulse together
        phase_offset = random.randint(0, 30)
        cycle = random.randint(12, 24)

        for f in range(frame_start + phase_offset,
                       frame_end, cycle):
            splash.scale = (0.1, 0.1, 1)
            splash.keyframe_insert(data_path="scale", frame=f)
            splash.scale = (1.5, 1.5, 1)
            splash.keyframe_insert(data_path="scale", frame=f + cycle - 2)

        splashes.append(splash)
    return splashes

def setup_wet_lens_compositor(scene, frame_start, frame_end):
    """
    Adds water droplet distortion to compositor during rain scenes.
    """
    tree = style.get_compositor_node_tree(scene)
    if not tree: return

    # Lens distortion increases during rain
    distort = tree.nodes.get("ChromaticAberration")
    if distort:
        distort.inputs['Dispersion'].default_value = 0.02
        distort.inputs['Dispersion'].keyframe_insert(
            data_path="default_value", frame=frame_start - 24)
        distort.inputs['Dispersion'].default_value = 0.06
        distort.inputs['Dispersion'].keyframe_insert(
            data_path="default_value", frame=frame_start + 24)
        distort.inputs['Dispersion'].default_value = 0.06
        distort.inputs['Dispersion'].keyframe_insert(
            data_path="default_value", frame=frame_end - 24)
        distort.inputs['Dispersion'].default_value = 0.02
        distort.inputs['Dispersion'].keyframe_insert(
            data_path="default_value", frame=frame_end)
