
import bpy
import random
import math

def create_neuron_cloud(count=50, radius=5.0):
    """
    Spawns a cloud of 'neurons' with physics enabled.
    """
    print(f"Creating neuron cloud with {count} particles...")
    
    # Create a collection for neurons
    if "Neurons" not in bpy.data.collections:
        neuron_col = bpy.data.collections.new("Neurons")
        bpy.context.scene.collection.children.link(neuron_col)
    else:
        neuron_col = bpy.data.collections["Neurons"]

    for i in range(count):
        # Random position within a sphere
        phi = random.random() * 2 * math.pi
        costheta = random.random() * 2 - 1
        u = random.random()
        
        theta = math.acos(costheta)
        r = radius * (u ** (1/3))
        
        x = r * math.sin(theta) * math.cos(phi)
        y = r * math.sin(theta) * math.sin(phi)
        z = r * math.cos(theta)
        
        # Create a small UV sphere for the neuron
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.1, location=(x, y, z))
        neuron = bpy.context.active_object
        neuron.name = f"Neuron_{i}"
        
        # Move to collection
        for col in neuron.users_collection:
            col.objects.unlink(neuron)
        neuron_col.objects.link(neuron)
        
        # Add physics (Rigid Body)
        bpy.ops.rigidbody.object_add()
        neuron.rigid_body.type = 'ACTIVE'
        neuron.rigid_body.mass = 0.1
        neuron.rigid_body.linear_damping = 0.5
        neuron.rigid_body.angular_damping = 0.5
        neuron.rigid_body.use_margin = True
        neuron.rigid_body.collision_margin = 0.01

    # Add a spherical force field to keep them clustered
    bpy.ops.object.effector_add(type='FORCE', location=(0, 0, 0))
    force = bpy.context.active_object
    force.name = "NeuronClusteringForce"
    force.field.strength = -5.0 # Negative is attractive
    
    # Add a turbulent force for 'organic' movement
    bpy.ops.object.effector_add(type='TURBULENCE', location=(0, 0, 0))
    turb = bpy.context.active_object
    turb.name = "NeuronTurbulence"
    turb.field.strength = 10.0
    turb.field.size = 2.0

def setup_neuron_materials():
    """
    Applies glowing materials to the neurons.
    """
    mat = bpy.data.materials.new(name="NeuronMat")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()
    
    output = nodes.new(type='ShaderNodeOutputMaterial')
    emission = nodes.new(type='ShaderNodeEmission')
    
    emission.inputs['Color'].default_value = (0.2, 0.6, 1.0, 1) # Neural Blue
    emission.inputs['Strength'].default_value = 15.0
    
    mat.node_tree.links.new(emission.outputs['Emission'], output.inputs['Surface'])
    
    if "Neurons" in bpy.data.collections:
        for obj in bpy.data.collections["Neurons"].objects:
            if obj.type == 'MESH':
                obj.data.materials.append(mat)

if __name__ == "__main__":
    create_neuron_cloud(count=100, radius=4.0)
    setup_neuron_materials()
