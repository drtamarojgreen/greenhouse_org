import bpy
import math
import mathutils
import random
from . import core

def apply_scene_grade(master, scene_name, frame_start, frame_end):
    """Applies scene mood presets: world tint, light energy/color ratios."""
    scene = master.scene
    world = scene.world
    nodes = world.node_tree.nodes
    bg = nodes.get("Background")

    # Default values (Reset)
    bg_color = (0, 0, 0, 1)
    sun_energy = 1.0
    sun_color = (1, 1, 1, 1)
    rim_energy = 5000
    rim_color = (1, 1, 1, 1)
    fill_energy = 5000
    fill_color = (1, 1, 1, 1)
    spot_energy = 10000
    spot_color = (1, 1, 1, 1)

    if scene_name == 'garden': # Scenes 1-4
        bg_color = (0.01, 0.02, 0.01, 1) # Dark mossy green
        sun_color = (1, 0.9, 0.7, 1) # Warm amber
        rim_color = (0.8, 1, 0.8, 1) # Soft green
    elif scene_name == 'resonance': # Scenes 5-6
        bg_color = (0, 0.01, 0.02, 1) # Dark cyan
        sun_color = (0.7, 0.9, 1, 1) # Electric cyan
        rim_color = (0.5, 0.8, 1, 1) # Teal
    elif scene_name == 'shadow': # Scenes 7-8
        bg_color = (0.02, 0, 0.03, 1) # Dark violet
        sun_energy = 1.0 # Dimmer
        sun_color = (0.8, 0.7, 1, 1) # Pale violet
        rim_energy = 8000 # Stronger rim to separate from dark
        rim_color = (0.6, 0.4, 1, 1) # Violet rim
        spot_energy = 5000
        spot_color = (0.7, 0.5, 1, 1)
    elif scene_name == 'sanctuary': # Scenes 9-11
        bg_color = (0.02, 0.02, 0, 1) # Dark gold/olive
        sun_color = (1, 0.95, 0.8, 1) # Rich gold
        rim_color = (1, 1, 0.9, 1) # Warm white

    # Apply to world
    if bg:
        bg.inputs[0].default_value = bg_color
        bg.inputs[0].keyframe_insert(data_path="default_value", frame=frame_start)

    # Apply to lights
    lights = {
        "Sun": (sun_energy, sun_color),
        "RimLight": (rim_energy, rim_color),
        "FillLight": (fill_energy, fill_color),
        "Spot": (spot_energy, spot_color)
    }

    # Enhancement #142: Map legacy names to new character key light rig
    light_mapping = {
        "RimLight": ["HerbaceousKeyLight", "ArborKeyLight", "GnomeKeyLight"],
        "FillLight": ["DomeFill"],
        "Spot": ["LightShaftBeam"],
        "Sun": ["Sun"]
    }

    for legacy_name, (energy, color) in lights.items():
        target_names = light_mapping.get(legacy_name, [legacy_name])
        for name in target_names:
            light_obj = bpy.data.objects.get(name)
            if light_obj and hasattr(light_obj, "data"):
                light_obj.data.energy = energy
                light_obj.data.keyframe_insert(data_path="energy", frame=frame_start)
                if hasattr(light_obj.data, "color"):
                    light_obj.data.color = color[:3]
                    light_obj.data.keyframe_insert(data_path="color", frame=frame_start)

def animate_foliage_wind(objects, strength=0.05, frame_start=1, frame_end=15000):
    """Adds subtle sway to foliage objects within a specific frame range."""
    for obj in objects:
        if obj.type != 'MESH': continue
        core.insert_looping_noise(obj, "rotation_euler", strength=strength, frame_start=frame_start, frame_end=frame_end)

def animate_dust_particles(center, volume_size=(5, 5, 5), density=20, color=(1, 1, 1, 1), frame_start=1, frame_end=15000):
    """Point 22 & 80: Optimized dust particles. Reuses existing motes if available."""
    color_hex = f"{int(color[0]*255):02x}{int(color[1]*255):02x}{int(color[2]*255):02x}"
    container_name = f"DustParticles_{color_hex}"
    
    container = bpy.data.collections.get(container_name)
    if not container:
        container = bpy.data.collections.new(container_name)
        bpy.context.scene.collection.children.link(container)

    mat_name = f"DustMat_{color_hex}"
    mat = bpy.data.materials.get(mat_name)
    if not mat:
        mat = bpy.data.materials.new(name=mat_name)
        bsdf = mat.node_tree.nodes["Principled BSDF"]
        bsdf.inputs["Base Color"].default_value = color
        bsdf.inputs["Emission Strength"].default_value = 2.0
        core.set_blend_method(mat, 'BLEND')

    existing_motes = list(container.objects)
    needed = density - len(existing_motes)
    
    if needed > 0:
        mesh_name = f"DustMoteMesh_{color_hex}"
        mesh = bpy.data.meshes.get(mesh_name)
        if not mesh:
            bpy.ops.mesh.primitive_ico_sphere_add(radius=0.01, location=(0,0,0))
            mesh = bpy.context.object.data
            mesh.name = mesh_name
            bpy.data.objects.remove(bpy.context.object, do_unlink=True)

        for i in range(needed):
            mote = bpy.data.objects.new(f"DustMote_{color_hex}_{len(existing_motes)+i}", mesh)
            container.objects.link(mote)
            mote.data.materials.append(mat)
            existing_motes.append(mote)

    current_motes = existing_motes[:density]
    
    for i, mote in enumerate(current_motes):
        loc = center + mathutils.Vector((
            random.uniform(-volume_size[0], volume_size[0]),
            random.uniform(-volume_size[1], volume_size[1]),
            random.uniform(0, volume_size[2])
        ))
        
        mote.location = loc
        mote.keyframe_insert(data_path="location", frame=frame_start)
        if mote.animation_data and mote.animation_data.action:
            fc = core.get_or_create_fcurve(mote.animation_data.action, "location", 0, ref_obj=mote)
            if fc:
                 for kp in fc.keyframe_points:
                     if int(kp.co[0]) == frame_start: kp.interpolation = 'CONSTANT'

        core.insert_looping_noise(mote, "location", strength=0.2, scale=20.0, frame_start=frame_start, frame_end=frame_end)

        mote.hide_render = True
        mote.keyframe_insert(data_path="hide_render", frame=frame_start - 1)
        mote.hide_render = False
        mote.keyframe_insert(data_path="hide_render", frame=frame_start)
        mote.hide_render = True
        mote.keyframe_insert(data_path="hide_render", frame=frame_end)

def apply_fade_transition(objs, frame_start, frame_end, mode='IN', duration=12):
    """Fixed: use hide_render instead of emission for fading."""
    for obj in objs:
        if mode == 'IN':
            obj.hide_render = True
            obj.keyframe_insert(data_path="hide_render", frame=frame_start)
            obj.hide_render = False
            obj.keyframe_insert(data_path="hide_render", frame=frame_start + duration)
            if obj.animation_data and obj.animation_data.action:
                for fc in core.get_action_curves(obj.animation_data.action, obj=obj):
                    if fc.data_path == "hide_render":
                        for kp in fc.keyframe_points:
                            if int(kp.co[0]) in [frame_start, frame_start + duration]:
                                kp.interpolation = 'CONSTANT'
        else:
            obj.hide_render = False
            obj.keyframe_insert(data_path="hide_render", frame=frame_end - duration)
            obj.hide_render = True
            obj.keyframe_insert(data_path="hide_render", frame=frame_end)
            if obj.animation_data and obj.animation_data.action:
                for fc in core.get_action_curves(obj.animation_data.action, obj=obj):
                    if fc.data_path == "hide_render":
                        for kp in fc.keyframe_points:
                            if int(kp.co[0]) in [frame_end - duration, frame_end]:
                                kp.interpolation = 'CONSTANT'

def apply_reactive_foliage(foliage_objs, trigger_obj, frame_start, frame_end, threshold=3.0):
    """Increases foliage sway intensity when a trigger object is nearby."""
    for obj in foliage_objs:
        if not obj.animation_data or not obj.animation_data.action: continue
        for fcurve in core.get_action_curves(obj.animation_data.action, obj=obj):
            for mod in fcurve.modifiers:
                if mod.type == 'NOISE':
                    mod.strength = 0.05
                    for f in range(frame_start, frame_end, 24):
                        dist = (obj.location - trigger_obj.location).length
                        if dist < threshold:
                            mod.strength = 0.15
                            break

def animate_leaf_twitches(leaf_objs, frame_start, frame_end):
    """Adds randomized 'ear-like' twitches to head-leaves."""
    for leaf in leaf_objs:
        core.insert_looping_noise(leaf, "rotation_euler", index=1, strength=0.1, scale=5.0, frame_start=frame_start, frame_end=frame_end)

def apply_thermal_transition(master, frame_start, frame_end, color_start=(0.5, 0, 1), color_end=(1, 0.5, 0)):
    """Transitions world background color between two thermal-inspired colors."""
    bg = master.scene.world.node_tree.nodes.get("Background")
    if bg:
        core.set_socket_value(bg.inputs[0], (*color_start, 1), frame=frame_start)
        core.set_socket_value(bg.inputs[0], (*color_end, 1), frame=frame_end)

def animate_mood_fog(scene, frame, density=0.01):
    """Adjusts volumetric haze density."""
    world = scene.world
    if not world: return
    vol = world.node_tree.nodes.get("Volume Scatter")
    if vol:
        vol.inputs['Density'].default_value = density
        vol.inputs['Density'].keyframe_insert(data_path="default_value", frame=frame)

def apply_film_flicker(scene, frame_start, frame_end, strength=0.05):
    """Adds brightness flicker using Noise modifier on input socket (5.x)."""
    tree = core.get_compositor_node_tree(scene)
    bright = tree.nodes.get("Bright/Contrast") or tree.nodes.new('CompositorNodeBrightContrast')
    bright.name = "Bright/Contrast"

    if not tree.animation_data: tree.animation_data_create()
    if not tree.animation_data.action:
        tree.animation_data.action = bpy.data.actions.new(name="CompositorAction")

    target = bright.inputs.get('Bright') or bright.inputs[0]
    data_path = f'nodes["{bright.name}"].inputs["{target.identifier}"].default_value'
    fcurve = core.get_or_create_fcurve(tree.animation_data.action, data_path, ref_obj=tree)

    if fcurve:
        mod = fcurve.modifiers.new(type='NOISE')
        mod.strength = strength
        mod.scale = 1.0
        mod.use_restricted_range = True
        mod.frame_start = frame_start
        mod.frame_end = frame_end

def apply_glow_trails(scene):
    """Ghosting/Trail effect (simplified via Vector Blur)."""
    tree = core.get_compositor_node_tree(scene)
    if not tree: return None
    blur = tree.nodes.get("GlowTrail") or tree.nodes.new(type='CompositorNodeVecBlur')
    blur.name = "GlowTrail"
    core.set_node_input(blur, 'Factor', 0.8)
    core.set_node_input(blur, 'Samples', 16)
    return blur

def apply_desaturation_beat(scene, frame_start, frame_end, saturation=0.2):
    """Drops saturation for a specific range."""
    tree = core.get_compositor_node_tree(scene)
    if not tree: return
    huesat = tree.nodes.get("GlobalSaturation")
    if huesat:
        core.set_node_input(huesat, 'Saturation', 1.0, frame=frame_start - 5)
        core.set_node_input(huesat, 'Saturation', saturation, frame=frame_start)
        core.set_node_input(huesat, 'Saturation', saturation, frame=frame_end)
        core.set_node_input(huesat, 'Saturation', 1.0, frame=frame_end + 5)

def animate_plant_advance(master, frame_start, frame_end):
    """Plants move toward the gnome as their argument intensifies (Point 142)."""
    if not master.h1 or not master.h2 or not master.gnome: return

    move_start = frame_start
    move_peak = (frame_start + frame_end) // 2
    
    # Herbaceous (h1) advance
    master.place_character(master.h1, (-1, 0, 0), (0, 0, 0), move_start)
    master.place_character(master.h1, (1.5, 2.5, 0), (0, 0, 0), move_peak)

    # Arbor (h2) advance
    master.place_character(master.h2, (1, 0, 0), (0, 0, 0), move_start)
    master.place_character(master.h2, (2.5, 2.5, 0), (0, 0, 0), move_peak)

    # Phase 2: Plants loom over gnome
    for char in [master.h1, master.h2]:
        char.scale = (1, 1, 1)
        char.keyframe_insert(data_path="scale", frame=move_start + 100)
        char.scale = (1.2, 1.2, 1.2)
        char.keyframe_insert(data_path="scale", frame=move_peak)

    # Phase 3: Gnome shrinks as he's overwhelmed
    master.gnome.scale = (0.6, 0.6, 0.6)
    master.gnome.keyframe_insert(data_path="scale", frame=move_start + 100)
    master.gnome.scale = (0.3, 0.3, 0.3)
    master.gnome.keyframe_insert(data_path="scale", frame=move_peak)

def add_scene_markers(master):
    """Enhancement #74: Timeline Bookmark System."""
    master.scene.timeline_markers.clear()
    from constants import SCENE_MAP
    for name, (start, end) in SCENE_MAP.items():
        master.scene.timeline_markers.new(name.replace("scene", "S"), frame=start)

def setup_caustic_patterns(floor_obj):
    """Enhancement #24: Caustic Light Patterns on Floor."""
    if not floor_obj: return
    for slot in floor_obj.material_slots:
        mat = slot.material
        if not mat: continue
        nodes, links = mat.node_tree.nodes, mat.node_tree.links

        node_tex = nodes.new(type='ShaderNodeTexVoronoi')
        node_tex.voronoi_dimensions = '4D'
        node_tex.inputs['Scale'].default_value = 10.0

        node_math = nodes.new(type='ShaderNodeMath')
        node_math.operation = 'POWER'
        node_math.inputs[1].default_value = 5.0
        links.new(node_tex.outputs['Distance'], node_math.inputs[0])

        bsdf = nodes.get("Principled BSDF")
        if bsdf:
            mix = core.create_mix_node(mat.node_tree, blend_type='ADD', data_type='RGBA')
            fac, in1, in2 = core.get_mix_sockets(mix)
            if fac: fac.default_value = 0.2
            
            old_link = next((l for l in links if l.to_socket == bsdf.inputs['Base Color']), None)
            if old_link:
                links.new(old_link.from_socket, in1)
                links.remove(old_link)
            links.new(node_math.outputs[0], in2)
            links.new(core.get_mix_output(mix), bsdf.inputs['Base Color'])

        node_tex.inputs['W'].default_value = 0
        node_tex.inputs['W'].keyframe_insert(data_path="default_value", frame=1)
        node_tex.inputs['W'].default_value = 10.0
        node_tex.inputs['W'].keyframe_insert(data_path="default_value", frame=15000)

def animate_hdri_rotation(scene):
    """Enhancement #30: Animated HDRI Sky Rotation."""
    world = scene.world
    if not world or not world.node_tree: return
    nodes = world.node_tree.nodes
    mapping = next((n for n in nodes if n.type == 'MAPPING'), None)
    if not mapping:
        tex = next((n for n in nodes if n.type == 'TEX_ENVIRONMENT'), None)
        if tex:
            mapping = nodes.new(type='ShaderNodeMapping')
            coord = nodes.new(type='ShaderNodeTexCoord')
            world.node_tree.links.new(coord.outputs['Generated'], mapping.inputs['Vector'])
            world.node_tree.links.new(mapping.outputs['Vector'], tex.inputs['Vector'])
    if mapping:
        import math
        mapping.inputs['Rotation'].default_value[2] = 0
        mapping.inputs['Rotation'].keyframe_insert(data_path="default_value", index=2, frame=1)
        mapping.inputs['Rotation'].default_value[2] = 2 * math.pi
        mapping.inputs['Rotation'].keyframe_insert(data_path="default_value", index=2, frame=15000)

def animate_vignette(scene, frame_start, frame_end, start_val=0.0, end_val=0.0):
    """Animates the factor of the 'Vignette' node in the compositor."""
    tree = core.get_compositor_node_tree(scene)
    if not tree: return
    vig = tree.nodes.get("Vignette")
    if not vig: return
    target = vig.inputs.get('Factor') or vig.inputs[0]
    core.set_socket_value(target, start_val, frame=frame_start)
    core.set_socket_value(target, end_val, frame=frame_end)

def animate_vignette_breathing(scene, frame_start, frame_end, strength=0.05, cycle=120):
    """Adds a pulsing 'breath' effect to the vignette factor."""
    tree = core.get_compositor_node_tree(scene)
    if not tree: return
    vig = tree.nodes.get("Vignette")
    if not vig: return
    if not tree.animation_data: tree.animation_data_create()
    if not tree.animation_data.action: tree.animation_data.action = bpy.data.actions.new(name="CompositorAction")
    target = vig.inputs.get('Factor') or vig.inputs[0]
    data_path = f'nodes["{vig.name}"].inputs["{target.identifier}"].default_value'
    fcurve = core.get_or_create_fcurve(tree.animation_data.action, data_path, ref_obj=tree)
    if fcurve:
        mod = fcurve.modifiers.new(type='NOISE')
        mod.strength, mod.scale = strength, cycle / 2
        mod.use_restricted_range = True
        mod.frame_start, mod.frame_end = frame_start, frame_end

def animate_floating_spores(center, volume_size=(10, 10, 5), density=50, frame_start=1, frame_end=15000):
    """Enhancement #33: Drifting bioluminescent spores in the sanctuary."""
    container_name = "SanctuarySpores"
    container = bpy.data.collections.get(container_name) or bpy.data.collections.new(container_name)
    if container_name not in bpy.context.scene.collection.children: bpy.context.scene.collection.children.link(container)
    mat = bpy.data.materials.get("SporeMat") or bpy.data.materials.new(name="SporeMat")
    if not mat.use_nodes: mat.use_nodes = True
    core.set_principled_socket(mat, "Base Color", (0.2, 1.0, 0.5, 1))
    core.set_principled_socket(mat, "Emission Color", (0.2, 1.0, 0.5, 1))
    core.set_principled_socket(mat, "Emission Strength", 5.0)
    core.set_blend_method(mat, 'BLEND')
    for i in range(density):
        loc = center + mathutils.Vector((random.uniform(-volume_size[0], volume_size[0]), random.uniform(-volume_size[1], volume_size[1]), random.uniform(0, volume_size[2])))
        bpy.ops.mesh.primitive_ico_sphere_add(radius=0.015, location=loc)
        spore = bpy.context.object; spore.name = f"Spore_{i}"
        container.objects.link(spore)
        if spore.name in bpy.context.scene.collection.objects: bpy.context.scene.collection.objects.unlink(spore)
        spore.data.materials.append(mat)
        core.insert_looping_noise(spore, "location", strength=0.8, scale=60.0, frame_start=frame_start, frame_end=frame_end)
        from . import style_lighting
        style_lighting.animate_pulsing_emission(spore, frame_start, frame_end, base_strength=1.0, pulse_amplitude=4.0, cycle=random.randint(40, 100))
        spore.hide_render = True; spore.keyframe_insert(data_path="hide_render", frame=frame_start - 1)
        spore.hide_render = False; spore.keyframe_insert(data_path="hide_render", frame=frame_start)
        spore.hide_render = True; spore.keyframe_insert(data_path="hide_render", frame=frame_end)

def apply_neuron_color_coding(neuron_mat, frame, color=(1, 0, 0)):
    """Shifts neuron emission color."""
    if not neuron_mat or not neuron_mat.node_tree: return
    core.set_principled_socket(neuron_mat, "Emission Color", (*color, 1), frame=frame)

def create_noise_based_material(name, colors=None, noise_type='NOISE', noise_scale=5.0, roughness=0.5, color_ramp_colors=None):
    """Exclusive 5.0+ noise-based material helper."""
    if colors is None: colors = color_ramp_colors or [(0,0,0,1), (1,1,1,1)]
    mat = bpy.data.materials.new(name=name); mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links; nodes.clear()
    node_out = nodes.new(type='ShaderNodeOutputMaterial')
    node_bsdf = nodes.new(type='ShaderNodeBsdfPrincipled'); node_bsdf.inputs['Roughness'].default_value = roughness
    if noise_type == 'WAVE': node_noise = nodes.new(type='ShaderNodeTexWave')
    elif noise_type == 'VORONOI': node_noise = nodes.new(type='ShaderNodeTexVoronoi')
    else: node_noise = nodes.new(type='ShaderNodeTexNoise')
    node_noise.inputs['Scale'].default_value = noise_scale
    node_ramp = nodes.new(type='ShaderNodeValToRGB'); node_ramp.name = "VAL_TO_RGB"
    elems = node_ramp.color_ramp.elements
    for i, color in enumerate(colors):
        if i < len(elems): elems[i].color = color
        else: elems.new(i / max(1, len(colors)-1)).color = color
    links.new(node_noise.outputs[0], node_ramp.inputs['Fac'])
    links.new(node_ramp.outputs['Color'], node_bsdf.inputs['Base Color'])
    links.new(node_bsdf.outputs['BSDF'], node_out.inputs['Surface'])
    return mat
