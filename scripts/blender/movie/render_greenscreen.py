import bpy
import os
import sys

# High-Fidelity Greenhouse Green-Screen Renderer
# Goal: 10 Frames meeting professional visual benchmarks

def setup_greenscreen():
    scene = bpy.context.scene
    
    # 1. CYCLES CINE-REALISTIC ENGINE
    scene.render.engine = 'CYCLES'
    cycles = scene.cycles
    cycles.device = 'GPU' if bpy.context.preferences.addons.get('cycles') else 'CPU'
    cycles.samples = 256 # High sampling for clarity
    cycles.use_adaptive_sampling = True
    cycles.use_denoising = True
    cycles.denoiser = 'OPENIMAGEDENOISE'

    # 2. PURE GREEN CHROMA KEY BACKGROUND
    scene.world.use_nodes = True
    nodes = scene.world.node_tree.nodes
    nodes.clear()
    bg = nodes.new('ShaderNodeBackground')
    bg.inputs['Color'].default_value = (0.0, 1.0, 0.0, 1.0) # Calibrated Green
    bg.inputs['Strength'].default_value = 1.0
    output = nodes.new('ShaderNodeOutputWorld')
    scene.world.node_tree.links.new(bg.outputs['Background'], output.inputs['Surface'])

    # 3. CINEMATIC COMPOSITING STACK
    scene.use_nodes = True
    c_nodes = scene.node_tree.nodes
    c_nodes.clear()
    
    rl = c_nodes.new('CompositorNodeRLayers')
    denoise = c_nodes.new('CompositorNodeDenoise')
    glare = c_nodes.new('CompositorNodeGlare')
    glare.glare_type = 'FOG_GLOW'
    glare.quality = 'HIGH'
    
    composite = c_nodes.new('CompositorNodeComposite')
    
    links = scene.node_tree.links
    links.new(rl.outputs['Image'], denoise.inputs['Image'])
    links.new(denoise.outputs['Image'], glare.inputs['Image'])
    links.new(glare.outputs['Image'], composite.inputs['Image'])

    # 4. CINEMATIC CAMERA (Subtle Handheld Motion)
    cam = scene.camera
    if cam:
        cam.data.lens = 50 # Cinematic focal length
        cam.data.use_dof = True
        cam.data.focus_distance = 5.0
        cam.data.aperture_fstop = 2.8 # Shallow depth of field

def render_sequence(start_frame, count):
    output_dir = os.path.join(os.getcwd(), "renders", "greenscreen")
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    bpy.context.scene.render.filepath = os.path.join(output_dir, "frame_")
    bpy.context.scene.render.image_settings.file_format = 'PNG'
    bpy.context.scene.render.image_settings.color_mode = 'RGB'

    print(f"[Greenhouse] Starting High-Quality Render of {count} frames...")
    for i in range(count):
        current_frame = start_frame + i
        bpy.context.scene.frame_set(current_frame)
        
        # Point 175: Final render trigger
        print(f"  Rendering frame {current_frame}...")
        bpy.ops.render.render(write_still=True)

if __name__ == "__main__":
    setup_greenscreen()
    # Rendering frames 500-510 (Garden sequence)
    render_sequence(500, 10)
