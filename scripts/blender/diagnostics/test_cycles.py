
import bpy
import os

def test_cycles_render():
    print("\n--- Cycles CPU Render Test ---")
    
    # 1. Clear Scene
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    
    # 2. Add Primitive Cube
    bpy.ops.mesh.primitive_cube_add(size=2, location=(0, 0, 0))
    cube = bpy.context.active_object
    
    # 3. Add Material with Emission (to verify shader processing)
    mat = bpy.data.materials.new(name="TestMat")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()
    
    node_emission = nodes.new(type='ShaderNodeEmission')
    node_emission.inputs['Color'].default_value = (0.1, 0.8, 1.0, 1.0)
    node_emission.inputs['Strength'].default_value = 5.0
    
    node_output = nodes.new(type='ShaderNodeOutputMaterial')
    mat.node_tree.links.new(node_emission.outputs[0], node_output.inputs[0])
    cube.data.materials.append(mat)
    
    # 4. Camera & Light
    bpy.ops.object.camera_add(location=(5, -5, 5))
    camera = bpy.context.active_object
    bpy.context.scene.camera = camera
    
    # Cycles doesn't strictly need lights if there's emission, but let's add one anyway
    bpy.ops.object.light_add(type='POINT', location=(5, 5, 5))
    
    # 5. Render Settings
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    
    # Force CPU Device
    scene.cycles.device = 'CPU'
    
    # Low samples for speed
    scene.cycles.samples = 4
    scene.cycles.use_denoising = False
    
    output_path = "/home/tamarojgreen/development/LLM/greenhouse_org/scripts/blender/cycles_test.png"
    scene.render.filepath = output_path
    
    print("Attempting to render 1 frame with Cycles CPU...")
    bpy.ops.render.render(write_still=True)
    
    if os.path.exists(output_path):
        print(f"SUCCESS: Cycles CPU render saved to {output_path}")
    else:
        print("FAILURE: Cycles CPU render failed to produce file.")

if __name__ == "__main__":
    test_cycles_render()
