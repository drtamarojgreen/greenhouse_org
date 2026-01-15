
import bpy
import gpu
import bgl
import os

def diag_gpu_info():
    print("\n--- Diagnostic 01: GPU & Environment Info ---")
    
    # 1. Basic Version Info
    print(f"Blender Version: {bpy.app.version_string}")
    print(f"Build Hash: {bpy.app.build_hash}")
    
    # 2. GPU Module Info (If available in headless)
    try:
        print(f"GPU Device: {gpu.platform.device_get()}")
        print(f"GPU Vendor: {gpu.platform.vendor_get()}")
        print(f"GPU Renderer: {gpu.platform.renderer_get()}")
        print(f"GPU Version: {gpu.platform.version_get()}")
    except Exception as e:
        print(f"GPU Module Info Failed: {e}")
        
    # 3. BGL (OpenGL) Info
    try:
        vendor = bgl.glGetString(bgl.GL_VENDOR)
        renderer = bgl.glGetString(bgl.GL_RENDERER)
        version = bgl.glGetString(bgl.GL_VERSION)
        print(f"OpenGL Vendor: {vendor}")
        print(f"OpenGL Renderer: {renderer}")
        print(f"OpenGL Version: {version}")
    except Exception as e:
        print(f"BGL Info Failed: {e}")

    # 4. Check for Eevee Next Support
    print(f"Eevee Next Support (RNA check): {'BLENDER_EEVEE_NEXT' in dir(bpy.types.RenderSettings)}")
    
    # 5. Check Render Engine availability
    scene = bpy.context.scene
    print(f"Available Engines: {scene.bl_rna.properties['engine'].enum_items.keys()}")

if __name__ == "__main__":
    diag_gpu_info()
