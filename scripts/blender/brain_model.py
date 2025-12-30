import bpy
import json
import urllib.request

def fetch_json_data(url):
    """Fetches JSON data from a URL."""
    try:
        with urllib.request.urlopen(url) as response:
            return json.loads(response.read().decode())
    except Exception as e:
        print(f"Error fetching data from {url}: {e}")
        return None

def create_mesh_from_verts(name, verts, faces):
    """Creates a mesh object from vertices and faces."""
    mesh = bpy.data.meshes.new(name)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    return obj

def create_material(name, color):
    """Creates a simple material with a given color."""
    mat = bpy.data.materials.new(name=name)
    mat.diffuse_color = color
    return mat

def process_brain_data(brain_data):
    """Processes the brain data to create Blender objects."""
    if not brain_data or 'elements' not in brain_data:
        print("No valid brain data to process.")
        return

    for element in brain_data['elements']:
        elem_id = element.get('id', 'unknown_brain_element')
        shape = element.get('shape')
        style = element.get('style', {})

        if shape == 'polygon':
            points = element.get('points', [])
            verts = [(p.get('x', 0), p.get('y', 0), 0) for p in points]
            if len(verts) > 2:
                faces = [list(range(len(verts)))]
                obj = create_mesh_from_verts(elem_id, verts, faces)
                if 'fillStyle' in style:
                    color_str = style['fillStyle'].replace('rgba(', '').replace(')', '').split(',')
                    if len(color_str) == 4:
                        color = (float(color_str[0])/255, float(color_str[1])/255, float(color_str[2])/255, float(color_str[3]))
                        mat = create_material(f"{elem_id}_mat", color)
                        obj.data.materials.append(mat)

def process_synapse_data(synapse_data):
    """Processes the synapse data to create Blender objects."""
    if not synapse_data or 'elements' not in synapse_data:
        print("No valid synapse data to process.")
        return

    for element in synapse_data['elements']:
        elem_id = element.get('id', 'unknown_synapse_element')
        elem_type = element.get('type')
        path_data = element.get('path', '')

        if elem_type == 'path':
            # BLOCKER: The SVG path data in the JSON is not self-contained.
            # It uses variables like 'w', 'h', 'tw', and 'psy' (e.g., "M(w/2-tw, psy-60)...").
            # These variables are defined in the original JavaScript environment where the
            # visualization runs, but they are not available in this Python script.
            # To make this functional, the JSON data would need to be provided with
            # absolute numerical values, or this script would need to be given the
            # values for these variables.
            print(f"Skipping SVG path element '{elem_id}': Path data '{path_data}' contains undefined variables.")

def main():
    """Main function to generate the model."""
    # --- Clear existing objects ---
    if bpy.context.mode != 'OBJECT':
        bpy.ops.object.mode_set(mode='OBJECT')
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

    # --- Define URLs ---
    brain_url = 'https://drtamarojgreen.github.io/greenhouse_org/endpoints/models_brain.json'
    synapse_url = 'https://drtamarojgreen.github.io/greenhouse_org/endpoints/models_synapses.json'

    # --- Load Data ---
    print(f"Fetching brain data from {brain_url}")
    brain_data = fetch_json_data(brain_url)

    print(f"Fetching synapse data from {synapse_url}")
    synapse_data = fetch_json_data(synapse_url)

    # --- Process Data ---
    if brain_data:
        process_brain_data(brain_data)
    if synapse_data:
        process_synapse_data(synapse_data)

    # --- Save the file ---
    # bpy.ops.wm.save_as_mainfile(filepath="brain_model.blend")
    print("Script finished. A .blend file would be saved here if uncommented.")

if __name__ == "__main__":
    main()
