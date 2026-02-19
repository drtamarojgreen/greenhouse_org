import bpy
import os
import mathutils
import style

def load_brain(base_path):
    """Point 95: Optimized BMesh/Join for Brain loading."""
    brain_path = os.path.join(base_path, "brain.fbx")
    if not os.path.exists(brain_path): return None

    style.patch_fbx_importer()
    bpy.ops.import_scene.fbx(filepath=brain_path)
    imported = [o for o in bpy.context.selected_objects if o.type == 'MESH']

    if not imported: return None

    # Merge all brain parts into one
    if len(imported) > 1:
        bpy.ops.object.select_all(action='DESELECT')
        for o in imported: o.select_set(True)
        bpy.context.view_layer.objects.active = imported[0]
        bpy.ops.object.join()

    brain_obj = imported[0]
    brain_obj.name = "BrainGroup"
    bpy.ops.object.shade_smooth()

    # Shared Material
    mat = bpy.data.materials.get("BrainMat") or bpy.data.materials.new(name="BrainMat")
    if not mat.use_nodes: mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    subsurf_attr = "Subsurface Weight" if "Subsurface Weight" in bsdf.inputs else "Subsurface"
    bsdf.inputs[subsurf_attr].default_value = 0.1

    # Simple color if not already setup
    if not any(n.type == 'TEX_NOISE' for n in mat.node_tree.nodes):
        node_veins = mat.node_tree.nodes.new(type='ShaderNodeTexNoise')
        node_veins_color = mat.node_tree.nodes.new(type='ShaderNodeValToRGB')
        elements = node_veins_color.color_ramp.elements
        elements[0].color = (1, 0.8, 0.8, 1)
        elements[1].color = (1, 0, 0, 1)
        mat.node_tree.links.new(node_veins.outputs['Fac'], node_veins_color.inputs['Fac'])
        mat.node_tree.links.new(node_veins_color.outputs['Color'], bsdf.inputs['Base Color'])

    brain_obj.data.materials.clear()
    brain_obj.data.materials.append(mat)

    return brain_obj

def load_neuron(base_path):
    """Point 95: Optimized Neuron loading."""
    neuron_path = os.path.join(base_path, "neuron.fbx")
    if not os.path.exists(neuron_path): return None

    bpy.ops.import_scene.fbx(filepath=neuron_path)
    imported = [o for o in bpy.context.selected_objects if o.type == 'MESH']
    if not imported: return None

    if len(imported) > 1:
        bpy.ops.object.select_all(action='DESELECT')
        for o in imported: o.select_set(True)
        bpy.context.view_layer.objects.active = imported[0]
        bpy.ops.object.join()

    neuron_obj = imported[0]
    neuron_obj.name = "NeuronGroup"
    bpy.ops.object.shade_smooth()

    mat = bpy.data.materials.get("NeuronMat") or bpy.data.materials.new(name="NeuronMat")
    neuron_obj.data.materials.clear()
    neuron_obj.data.materials.append(mat)

    return neuron_obj

def animate_brain_neuron(master_instance):
    """Animates brain and neuron props."""
    if master_instance.neuron:
        master_instance._set_visibility([master_instance.neuron], [(1251, 1500), (1601, 1800), (1901, 2000), (3001, 3500)])
        master_instance.neuron.scale = (1, 1, 1)
        master_instance.neuron.keyframe_insert(data_path="scale", frame=1251)
        master_instance.neuron.scale = (3, 3, 3)
        master_instance.neuron.keyframe_insert(data_path="scale", frame=1425)
        master_instance.neuron.scale = (1, 1, 1)
        master_instance.neuron.keyframe_insert(data_path="scale", frame=1500)

    if master_instance.brain:
        # Problem 3: Reduced pulsing emission (0.1, 0.3)
        style.animate_pulsing_emission(master_instance.brain, 1, 15000, base_strength=0.1, pulse_amplitude=0.3)
        style.insert_looping_noise(master_instance.brain, "location", index=2, strength=0.1, scale=50.0, frame_start=1, frame_end=15000)
        master_instance._set_visibility([master_instance.brain], [(201, 400), (751, 950), (1351, 1500), (1601, 1800), (3001, 3500)])
