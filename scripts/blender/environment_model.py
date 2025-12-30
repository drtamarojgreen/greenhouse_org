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

def create_material(name, color):
    """Creates a simple material with a given color."""
    mat = bpy.data.materials.new(name=name)
    mat.diffuse_color = color
    return mat

def process_environment_data(env_data):
    """Processes the environment data to create Blender objects."""
    if not env_data or 'elements' not in env_data:
        print("No valid environment data to process.")
        return

    for element in env_data['elements']:
        elem_id = element.get('id', 'unknown_env_element')
        elem_type = element.get('type')
        path_data = element.get('path', '')

        if elem_type == 'path':
            # BLOCKER: The SVG path data in the JSON is not self-contained.
            # It uses variables like 'w' and 'h' (e.g., "M(w*0.45, h*0.95)...").
            # These variables are defined in the original JavaScript environment where the
            # visualization runs, but they are not available in this Python script.
            # To make this functional, the JSON data would need to be provided with
            # absolute numerical values, or this script would need to be given the
            # values for these variables.
            print(f"Skipping SVG path element '{elem_id}': Path data '{path_data}' contains undefined variables.")

def main():
    """Main function to generate the environment model."""
    # --- Clear existing objects ---
    if bpy.context.mode != 'OBJECT':
        bpy.ops.object.mode_set(mode='OBJECT')
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

    # --- Define URL ---
    environment_url = 'https://drtamarojgreen.github.io/greenhouse_org/endpoints/models_environment.json'

    # --- Load Data ---
    print(f"Fetching environment data from {environment_url}")
    environment_data = fetch_json_data(environment_url)

    # --- Process Data ---
    if environment_data:
        process_environment_data(environment_data)

    # --- Save the file ---
    # bpy.ops.wm.save_as_mainfile(filepath="environment_model.blend")
    print("Script finished. A .blend file for the environment model would be saved here if uncommented.")

if __name__ == "__main__":
    main()
