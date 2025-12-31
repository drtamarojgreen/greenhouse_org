
import bpy
import os

def test_eevee_legacy():
    scene = bpy.context.scene
    print("\n--- Testing Eevee Legacy Availability ---")
    
    try:
        scene.render.engine = 'BLENDER_EEVEE'
        print("SUCCESS: Engine set to 'BLENDER_EEVEE' (Legacy ID)")
    except Exception as e:
        print(f"FAILED: 'BLENDER_EEVEE' not found - {e}")
        
    try:
        scene.render.engine = 'BLENDER_EEVEE_NEXT'
        print("INFO: 'BLENDER_EEVEE_NEXT' is available")
    except:
        pass

if __name__ == "__main__":
    test_eevee_legacy()
