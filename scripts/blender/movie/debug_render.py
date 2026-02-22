import bpy
import os
import sys
import mathutils

# Add current dir to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from silent_movie_generator import MovieMaster

def debug_scene():
    master = MovieMaster(mode='SILENT_FILM')
    master.run()

    scene = bpy.context.scene
    print(f"\n--- SCENE DEBUG ---")
    print(f"Render Engine: {scene.render.engine}")
    print(f"Cycles Device: {scene.cycles.device}")
    print(f"Exposure: {scene.view_settings.exposure}")

    debug_frames = [50, 150, 450, 1000, 9600, 14000]

    targets = ["Herbaceous", "Arbor", "GloomGnome", "CreditsText"]

    for f in debug_frames:
        scene.frame_set(f)
        print(f"\nFrame {f}:")

        # Camera info
        cam = scene.camera
        if cam:
            print(f"  Camera Loc: {cam.location}")
            print(f"  Camera Clip: {cam.data.clip_start} to {cam.data.clip_end}")

        # Lights info
        lights = [o for o in scene.objects if o.type == 'LIGHT']
        print(f"  Lights Active ({len(lights)}):")
        for l in lights:
            # Check evaluated visibility
            dg = bpy.context.evaluated_depsgraph_get()
            l_eval = l.evaluated_get(dg)
            hidden = l_eval.hide_render
            print(f"    - {l.name}: Energy={l.data.energy}, Hidden={hidden}")

        # Object visibility
        for tname in targets:
            obj = bpy.data.objects.get(tname)
            if obj:
                dg = bpy.context.evaluated_depsgraph_get()
                obj_eval = obj.evaluated_get(dg)
                hidden = obj_eval.hide_render
                dist = (cam.location - obj.location).length if cam else -1
                print(f"    - {tname}: Hidden={hidden}, Dist={dist:.2f}, Loc={obj.location}")

                # Check children (meshes)
                for child in obj.children:
                    if child.type == 'MESH':
                        c_eval = child.evaluated_get(dg)
                        print(f"      * {child.name}: Hidden={c_eval.hide_render}")

if __name__ == "__main__":
    debug_scene()
