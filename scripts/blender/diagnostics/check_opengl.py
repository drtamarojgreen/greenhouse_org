
import gpu
import bpy

def check_gpu():
    print("\n--- GPU CAPABILITY CHECK ---")
    try:
        platform = gpu.platform.backend_type_get()
        device = gpu.platform.device_get()
        vendor = gpu.platform.vendor_get()
        renderer = gpu.platform.renderer_get()
        version = gpu.platform.version_get()
        
        print(f"BACKEND:  {platform}")
        print(f"DEVICE:   {device}")
        print(f"VENDOR:   {vendor}")
        print(f"RENDERER: {renderer}")
        print(f"VERSION:  {version}")
    except Exception as e:
        print(f"GPU MODULE ERROR: {e}")
        
    # Check if Eevee Next is actually functional in this context
    # Try to set it and see if it errors
    try:
        bpy.context.scene.render.engine = 'BLENDER_EEVEE_NEXT'
        print("EEVEE_NEXT engine: Assigned successfully")
    except Exception as e:
        print(f"EEVEE_NEXT engine: FAILED TO ASSIGN - {e}")

if __name__ == "__main__":
    check_gpu()
