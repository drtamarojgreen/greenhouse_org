
import bpy
import os
import sys

def render_optimized_files(target_dir, output_dir):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    files = [f for f in os.listdir(target_dir) if f.lower().endswith('.blend')]
    
    for filename in files:
        filepath = os.path.join(target_dir, filename)
        print(f"Rendering {filename}...")
        
        bpy.ops.wm.open_mainfile(filepath=filepath)
        
        scene = bpy.context.scene
        
        # Force Cycles CPU for stability
        scene.render.engine = 'CYCLES'
        scene.cycles.device = 'CPU'
        scene.cycles.samples = 32

        scene.frame_start = 1
        scene.frame_end = 20
        scene.render.fps = 2
        
        # Ensure output format
        scene.render.image_settings.file_format = 'FFMPEG'
        scene.render.ffmpeg.format = 'MPEG4'
        scene.render.ffmpeg.codec = 'H264'
        
        out_name = os.path.splitext(filename)[0] + ".mp4"
        scene.render.filepath = os.path.join(output_dir, out_name)
        
        try:
            bpy.ops.render.render(animation=True)
            print(f"Rendered to {scene.render.filepath}")
        except Exception as e:
            print(f"Failed to render {filename}: {e}")

if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    target_dir = os.path.join(script_dir, "target")
    output_dir = os.path.join(script_dir, "renders")
    
    render_optimized_files(target_dir, output_dir)