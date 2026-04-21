import bpy
import bmesh
import math
import mathutils

def create_glow_material(name, color=(0, 1, 0.5)):
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()

    node_out = nodes.new(type='ShaderNodeOutputMaterial')
    node_emit = nodes.new(type='ShaderNodeEmission')
    node_emit.inputs['Color'].default_value = (*color, 1)
    node_emit.inputs['Strength'].default_value = 1.0

    mat.node_tree.links.new(node_emit.outputs['Emission'], node_out.inputs['Surface'])
    return mat

def create_water_can_v6(name, location):
    mesh = bpy.data.meshes.new(name)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.location = location

    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=16, radius=0.4)
    # Stylized spout
    bmesh.ops.create_cone(bm, segments=8, radius1=0.05, radius2=0.12, depth=0.6,
                          matrix=mathutils.Matrix.Translation((0.4, 0, 0.2)) @
                                 mathutils.Euler((0, math.radians(45), 0)).to_matrix().to_4x4())

    bm.to_mesh(mesh)
    bm.free()

    mat = create_glow_material(f"{name}_Glow", (0.4, 0.1, 0.8))
    obj.data.materials.append(mat)
    return obj

def create_garden_hose_v6(name, location):
    mesh = bpy.data.meshes.new(name)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.location = location

    bm = bmesh.new()
    # Organic vine-like segment
    bmesh.ops.create_cone(bm, segments=12, radius1=0.1, radius2=0.1, depth=1.5,
                          matrix=mathutils.Matrix.Translation((0,0,0.75)))

    bm.to_mesh(mesh)
    bm.free()

    mat = create_glow_material(f"{name}_Glow", (0.1, 0.8, 0.2))
    obj.data.materials.append(mat)
    return obj

def animate_blessing(prop_obj, start_frame, end_frame):
    if not prop_obj or not prop_obj.data.materials: return
    mat = prop_obj.data.materials[0]
    nodes = mat.node_tree.nodes
    emit = next((n for n in nodes if n.type == 'EMISSION'), None)
    if not emit: return

    # Animate emission strength
    emit.inputs['Strength'].default_value = 1.0
    emit.inputs['Strength'].keyframe_insert(data_path="default_value", frame=start_frame)

    emit.inputs['Strength'].default_value = 20.0
    emit.inputs['Strength'].keyframe_insert(data_path="default_value", frame=(start_frame + end_frame)//2)

    emit.inputs['Strength'].default_value = 5.0
    emit.inputs['Strength'].keyframe_insert(data_path="default_value", frame=end_frame)
