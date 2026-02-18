import bpy
import os
import mathutils
import style

def load_brain(base_path):
    """Loads and sets up the brain model."""
    brain_path = os.path.join(base_path, "brain.fbx")
    if not os.path.exists(brain_path):
        return None

    style.patch_fbx_importer()
    bpy.ops.import_scene.fbx(filepath=brain_path)
    imported = bpy.context.selected_objects

    brain_group = bpy.data.objects.new("BrainGroup", None)
    bpy.context.scene.collection.objects.link(brain_group)

    for o in imported:
        o.parent = brain_group
        o.matrix_parent_inverse = brain_group.matrix_world.inverted()
        if o.type == 'MESH':
            bpy.ops.object.select_all(action='DESELECT')
            o.select_set(True)
            bpy.context.view_layer.objects.active = o
            bpy.ops.object.shade_smooth()

            mat = bpy.data.materials.new(name="BrainMat")
            mat.use_nodes = True
            bsdf = mat.node_tree.nodes.get("Principled BSDF")

            # Subsurface Weight (Blender 5.0 compatibility)
            subsurf_attr = "Subsurface Weight" if "Subsurface Weight" in bsdf.inputs else "Subsurface"
            bsdf.inputs[subsurf_attr].default_value = 0.1

            node_veins = mat.node_tree.nodes.new(type='ShaderNodeTexNoise')
            node_veins.inputs['Scale'].default_value = 20.0

            node_veins_color = mat.node_tree.nodes.new(type='ShaderNodeValToRGB')
            # Point 4: version safe color ramp handling (min 2 elements)
            elements = node_veins_color.color_ramp.elements
            elements[0].color = (1, 0.8, 0.8, 1) # Tissue
            elements[1].color = (1, 0, 0, 1) # Veins

            mat.node_tree.links.new(node_veins.outputs['Fac'], node_veins_color.inputs['Fac'])
            mat.node_tree.links.new(node_veins_color.outputs['Color'], bsdf.inputs['Base Color'])

            o.data.materials.append(mat)

    return brain_group

def load_neuron(base_path):
    """Loads and sets up the neuron model."""
    neuron_path = os.path.join(base_path, "neuron.fbx")
    if not os.path.exists(neuron_path):
        return None

    bpy.ops.import_scene.fbx(filepath=neuron_path)
    imported = bpy.context.selected_objects

    neuron_group = bpy.data.objects.new("NeuronGroup", None)
    bpy.context.scene.collection.objects.link(neuron_group)

    for o in imported:
        o.parent = neuron_group
        o.matrix_parent_inverse = neuron_group.matrix_world.inverted()
        if o.type == 'MESH':
            bpy.ops.object.select_all(action='DESELECT')
            o.select_set(True)
            bpy.context.view_layer.objects.active = o
            bpy.ops.object.shade_smooth()

            mat = bpy.data.materials.new(name="NeuronMat")
            mat.use_nodes = True
            o.data.materials.append(mat)

    return neuron_group

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
