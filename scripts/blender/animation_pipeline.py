
import bpy
import os
import sys

script_dir = os.path.dirname(os.path.abspath(__file__))
if script_dir not in sys.path:
    sys.path.append(script_dir)

from animate_assets import AssetAnimator
from verify_armature_ml import ArmatureVerifier

def run_animation_pipeline(target_dir, animation_dir, logo_path):
    """
    Orchestrates the loading, animating, verifying, and saving of optimized assets.
    """
    animator = AssetAnimator(logo_path, animation_dir)
    verifier = ArmatureVerifier()

    files = [f for f in os.listdir(target_dir) if f.lower().endswith('.blend')]
    print(f"Processing {len(files)} files for animation...")

    for filename in files:
        source_path = os.path.join(target_dir, filename)
        print(f"\n--- Animating: {filename} ---")
        
        # 1. Load optimized file
        bpy.ops.wm.open_mainfile(filepath=source_path)
        
        # 2. Integrate Logo
        animator.integrate_logo(bpy.context)
        
        # 3. Setup Timeline & Animate
        animator.setup_timeline(bpy.context)
        animator.animate_armatures(bpy.context)
        
        # 4. ML Verification
        # Check all meshes against their armatures
        meshes = [o for o in bpy.data.objects if o.type == 'MESH']
        armatures = [o for o in bpy.data.objects if o.type == 'ARMATURE']
        
        for mesh in meshes:
            # Find the armature that deforms this mesh (usually a modifier)
            for mod in [m for m in mesh.modifiers if m.type == 'ARMATURE']:
                if mod.object:
                    success = verifier.verify_skinning(mesh, mod.object)
                    if not success:
                        print(f" - ! Verification failed for {mesh.name}")

        # 5. Save Final Animation File
        animator.save_result(filename)

def main():
    target_dir = os.path.join(script_dir, "target")
    animation_dir = os.path.join(script_dir, "animations")
    logo_path = os.path.join(script_dir, "..", "..", "docs", "images", "Greenhouse_Logo.png")
    
    run_animation_pipeline(target_dir, animation_dir, logo_path)

if __name__ == "__main__":
    main()
