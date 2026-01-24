import bpy
import math
import random
import os

def setup_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)

def create_soma(location, radius, neurite_start_points):
    """
    Creates a soma (icosphere) and deforms it slightly towards neurite starting points
    to simulate the principle in NeuroTessMesh article.
    """
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3, radius=radius, location=location)
    soma = bpy.context.object
    soma.name = "Soma"
    
    # Deform soma towards neurite starting points
    # In a real implementation we'd use FEM, here we'll pull vertices
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.object.mode_set(mode='OBJECT')
    
    for start_p in neurite_start_points:
        for vert in soma.data.vertices:
            dist = (vert.co - (start_p - soma.location)).length
            if dist < radius * 0.8:
                # Pull vertex towards the start point direction
                direction = (start_p - soma.location).normalized()
                influence = math.exp(-dist**2 / (2 * (radius*0.3)**2))
                vert.co += direction * influence * (radius * 0.2)
                
    return soma

def create_neurite_branch(start_pos, direction, length, radius, depth, max_depth):
    if depth > max_depth or radius < 0.05:
        return []

    # Create a segment using a curve
    curve_data = bpy.data.curves.new('NeuriteCurve', type='CURVE')
    curve_data.dimensions = '3D'
    curve_data.fill_mode = 'FULL'
    curve_data.bevel_depth = radius
    curve_data.bevel_resolution = 3
    
    polyline = curve_data.splines.new('POLY')
    
    # Randomize end position slightly for organic look
    end_pos = start_pos + direction * length
    end_pos += (random.random()-0.5) * length * 0.3 * direction.cross(start_pos.normalized()).normalized()
    
    polyline.points.add(1)
    polyline.points[0].co = (start_pos.x, start_pos.y, start_pos.z, 1)
    polyline.points[1].co = (end_pos.x, end_pos.y, end_pos.z, 1)
    
    # Tapering: set radius at end points if possible (Blender curves use radiuses on points)
    polyline.points[0].radius = 1.0
    polyline.points[1].radius = 0.8 # taper
    
    curve_obj = bpy.data.objects.new('NeuriteSegment', curve_data)
    bpy.context.collection.objects.link(curve_obj)
    
    segments = [curve_obj]
    
    # Branching
    if depth < max_depth:
        num_branches = 1 if random.random() > 0.3 else 2
        for i in range(num_branches):
            # Calculate new direction with some randomness and branching angle
            angle = math.radians(random.uniform(20, 45))
            axis = direction.cross(random.choice([bpy.types.Vector((1,0,0)), bpy.types.Vector((0,1,0))])).normalized()
            # Rotation
            new_dir = direction.copy()
            # Simplified rotation
            new_dir.rotate(bpy.types.Euler((random.uniform(-angle, angle), random.uniform(-angle, angle), random.uniform(-angle, angle))))
            new_dir.normalize()
            
            segments.extend(create_neurite_branch(end_pos, new_dir, length * 0.8, radius * 0.7, depth + 1, max_depth))
            
    return segments

def main():
    setup_scene()
    
    soma_loc = bpy.types.Vector((0, 0, 0))
    soma_radius = 1.0
    
    # Define insertion points for 3 neurites
    neurite_starts = [
        soma_loc + bpy.types.Vector((1, 0, 0)) * soma_radius,
        soma_loc + bpy.types.Vector((-0.5, 0.866, 0)) * soma_radius,
        soma_loc + bpy.types.Vector((-0.5, -0.866, 0)) * soma_radius,
    ]
    
    soma = create_soma(soma_loc, soma_radius, neurite_starts)
    
    all_neurites = []
    for start_p in neurite_starts:
        direction = start_p.normalized()
        all_neurites.extend(create_neurite_branch(start_p, direction, 2.0, 0.2, 0, 4))
        
    # Join everything
    bpy.ops.object.select_all(action='DESELECT')
    soma.select_set(True)
    for seg in all_neurites:
        seg.select_set(True)
    
    # Convert curves to mesh
    bpy.context.view_layer.objects.active = soma
    bpy.ops.object.convert(target='MESH')
    bpy.ops.object.join()
    
    neuron = bpy.context.active_object
    neuron.name = "GeneratedNeuron"
    
    # Export to FBX
    output_path = os.path.join(os.getcwd(), "scripts/blender/neuron.fbx")
    bpy.ops.export_scene.fbx(filepath=output_path, check_existing=False, use_selection=True)
    print(f"Neuron exported to {output_path}")

if __name__ == "__main__":
    # Needed to access Vector and Euler easily
    import mathutils
    bpy.types.Vector = mathutils.Vector
    bpy.types.Euler = mathutils.Euler
    main()
