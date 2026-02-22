import bpy
import mathutils

def print_header(title):
    print("\n" + "=" * 60)
    print(title)
    print("=" * 60)

def world_to_camera_view(scene, camera, coord):
    co_local = camera.matrix_world.inverted() @ coord
    z = -co_local.z
    return z

def diagnose():
    scene = bpy.context.scene

    print_header("RENDER SETTINGS")

    print(f"Render Engine: {scene.render.engine}")

    if scene.render.engine == 'BLENDER_EEVEE':
        print("Eevee detected")

    print(f"Film Transparent: {scene.render.film_transparent}")
    print(f"Frame Range: {scene.frame_start} → {scene.frame_end}")

    print_header("CAMERA")

    cam = scene.camera
    if not cam:
        print("❌ No active camera assigned to scene.")
    else:
        print(f"Active Camera: {cam.name}")
        cam_data = cam.data
        print(f"Clipping Start: {cam_data.clip_start}")
        print(f"Clipping End: {cam_data.clip_end}")
        print(f"Location: {cam.location}")
        print(f"Rotation (Euler): {cam.rotation_euler}")

        if cam.constraints:
            print("Camera Constraints:")
            for c in cam.constraints:
                print(f" - {c.type} (Target: {getattr(c.target, 'name', None)})")
        else:
            print("No camera constraints.")

    print_header("VIEW LAYERS")

    for layer in scene.view_layers:
        print(f"View Layer: {layer.name}")
        print(f"  Use: {layer.use}")

    print_header("COLLECTION RENDER VISIBILITY")

    def check_collection(coll, indent=0):
        prefix = " " * indent
        print(f"{prefix}- {coll.name} | hide_render: {coll.hide_render}")
        for child in coll.children:
            check_collection(child, indent + 2)

    check_collection(scene.collection)

    print_header("OBJECT RENDER VISIBILITY")

    renderable_objects = []
    for obj in scene.objects:
        if obj.type in {'MESH', 'CURVE', 'SURFACE', 'META', 'FONT'}:
            print(f"{obj.name} | hide_render: {obj.hide_render}")
            if not obj.hide_render:
                renderable_objects.append(obj)

    if not renderable_objects:
        print("❌ No renderable geometry objects found.")

    print_header("LIGHTS")

    lights = [o for o in scene.objects if o.type == 'LIGHT']
    if not lights:
        print("❌ No lights in scene.")
    else:
        for light in lights:
            print(f"{light.name} | Energy: {light.data.energy} | hide_render: {light.hide_render}")

    print_header("COMPOSITOR")

    print(f"Use Nodes: {scene.use_nodes}")
    if scene.use_nodes and scene.node_tree:
        nodes = scene.node_tree.nodes
        links = scene.node_tree.links

        composite_nodes = [n for n in nodes if n.type == 'COMPOSITE']
        render_layer_nodes = [n for n in nodes if n.type == 'R_LAYERS']

        print(f"Composite Nodes: {len(composite_nodes)}")
        print(f"Render Layer Nodes: {len(render_layer_nodes)}")
        print(f"Total Links: {len(links)}")

        if not composite_nodes:
            print("❌ No Composite node found.")

        if not render_layer_nodes:
            print("❌ No Render Layers node found.")

    print_header("CAMERA VISIBILITY TEST")

    if cam and renderable_objects:
        visible_count = 0
        for obj in renderable_objects:
            bbox = [obj.matrix_world @ mathutils.Vector(corner) for corner in obj.bound_box]
            for corner in bbox:
                z = world_to_camera_view(scene, cam, corner)
                if cam.data.clip_start < z < cam.data.clip_end:
                    visible_count += 1
                    break

        if visible_count == 0:
            print("❌ Camera does not appear to see any renderable object.")
        else:
            print(f"Camera potentially sees {visible_count} object(s).")

    print_header("DIAGNOSTIC COMPLETE")

if __name__ == "__main__":
    diagnose()
