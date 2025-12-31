
import bpy
def list_engines():
    print("\n--- AVAILABLE RENDER ENGINES ---")
    engines = [item.identifier for item in bpy.context.scene.bl_rna.properties['engine'].enum_items]
    for e in engines:
        print(f"Engine: {e}")

if __name__ == "__main__":
    list_engines()
