
import bpy
import random
import math

def create_neuron_cloud(count=30, radius=2.0):
    """
    Spawns a small cloud of 'neurons' inside the brain.
    Reduced count for maximum stability.
    """
    print(f"Creating internal neuron cloud with {count} static particles...")
    
    if "Neurons" not in bpy.data.collections:
        neuron_col = bpy.data.collections.new("Neurons")
        bpy.context.scene.collection.children.link(neuron_col)
    else:
        neuron_col = bpy.data.collections["Neurons"]

    for i in range(count):
        phi = random.random() * 2 * math.pi
        costheta = random.random() * 2 - 1
        u = random.random()
        theta = math.acos(costheta)
        r = radius * (u ** (1/3))
        
        x = r * math.sin(theta) * math.cos(phi)
        y = r * math.sin(theta) * math.sin(phi)
        z = r * math.cos(theta)
        
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.1, location=(x, y, z))
        neuron = bpy.context.active_object
        neuron.name = f"Neuron_{i}"
        
        for col in neuron.users_collection:
            col.objects.unlink(neuron)
        neuron_col.objects.link(neuron)

def setup_neuron_materials():
    mat = bpy.data.materials.new(name="NeuronMat")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()
    output = nodes.new(type='ShaderNodeOutputMaterial')
    emission = nodes.new(type='ShaderNodeEmission')
    emission.inputs['Color'].default_value = (0.2, 0.6, 1.0, 1)
    emission.inputs['Strength'].default_value = 20.0
    mat.node_tree.links.new(emission.outputs['Emission'], output.inputs['Surface'])
    
    if "Neurons" in bpy.data.collections:
        for obj in bpy.data.collections["Neurons"].objects:
            if obj.type == 'MESH':
                obj.data.materials.append(mat)
