
import bpy
import random
import math
import bmesh
from mathutils import Vector
from mathutils.bvhtree import BVHTree
import visual_effects as vfx

def is_inside(point, bvh):
    """
    Uses a bmesh BVH tree to determine if a point is inside the mesh.
    """
    # Find the closest point on the mesh to the given point
    closest_point, normal, index, distance = bvh.find_nearest(point)

    # Check if the point is on the same side of the normal as the vector from the closest point to the point
    return (Vector(point) - closest_point).dot(normal) < 0

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

    brain_model = bpy.data.objects.get("BrainModel")
    if not brain_model:
        print("Error: BrainModel not found. Cannot create neuron cloud.")
        return

    # Create a BMesh object for faster ray casting
    bm = bmesh.new()
    bm.from_mesh(brain_model.data)
    bm.transform(brain_model.matrix_world)

    # Create a BVH tree from the bmesh for fast point-in-volume checks
    bvh = BVHTree.FromBMesh(bm)

    neurons_created = 0
    while neurons_created < count:
        # Generate a random point within a bounding box around the brain model
        x = random.uniform(brain_model.bound_box[0][0], brain_model.bound_box[6][0])
        y = random.uniform(brain_model.bound_box[0][1], brain_model.bound_box[6][1])
        z = random.uniform(brain_model.bound_box[0][2], brain_model.bound_box[6][2])
        point = (x, y, z)

        if is_inside(point, bvh):
            bpy.ops.mesh.primitive_uv_sphere_add(radius=0.1, location=point)
            neuron = bpy.context.active_object
            neuron.name = f"Neuron_{neurons_created}"
            vfx.apply_neuron_texture(neuron)

            for col in neuron.users_collection:
                col.objects.unlink(neuron)
            neuron_col.objects.link(neuron)
            neurons_created += 1

    bm.free()

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
