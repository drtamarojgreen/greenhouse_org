import bpy
import math

def setup_scene(master):
    """
    The Exchange of Knowledge and Stoic Forge.
    Shot ID: S04
    Intent: Staging the forge metaphor with props and character interaction. (Point 43)
    """
    # MUSIC CUE: Rhythmic industrial banging (softened for piano).
    master.create_intertitle("The Exchange of\nKnowledge", 951, 1050)
    master.create_intertitle("The Forge of\nFortitude", 1251, 1350)

    # Point 43: Add simple anvil prop for the forge scene (BMesh)
    import bmesh
    anvil_data = bpy.data.meshes.new("Anvil_MeshData")
    anvil = bpy.data.objects.new("StoicAnvil", anvil_data)
    bpy.context.collection.objects.link(anvil)
    anvil.location = (0, 0, 0.25)

    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=0.5)
    bm.to_mesh(anvil_data)
    bm.free()

    mat = bpy.data.materials.new(name="AnvilMat")
    mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.05, 0.05, 0.05, 1)
    anvil.data.materials.append(mat)

    master._set_visibility([anvil], [(1351, 1500)])

    if master.h1 and master.h1.type == 'ARMATURE':
        # Point 43: Hammering motion (Bone-based)
        torso = master.h1.pose.bones.get("Torso")
        if torso:
            for f in range(1351, 1500, 20):
                torso.rotation_euler[0] = 0
                torso.keyframe_insert(data_path="rotation_euler", index=0, frame=f)
                torso.rotation_euler[0] = math.radians(20)
                torso.keyframe_insert(data_path="rotation_euler", index=0, frame=f + 10)
