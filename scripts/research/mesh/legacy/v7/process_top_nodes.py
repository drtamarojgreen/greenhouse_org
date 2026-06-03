import json
import os

def read_and_print_top_nodes(file_path):
    """
    Reads a JSON file containing top nodes and prints its contents.
    """
    if not os.path.exists(file_path):
        print(f"Error: File not found at {file_path}")
        return

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            top_nodes = json.load(f)
            print(f"Successfully read top nodes from {file_path}:\n")
            for node_data in top_nodes:
                print(f"Node: {node_data['node']}, Degree: {node_data['degree']}")
    except json.JSONDecodeError:
        print(f"Error: Could not decode JSON from {file_path}. Is it a valid JSON file?")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

if __name__ == "__main__":
    # Path to the JSON file, assuming it's in the same directory as this script
    script_dir = os.path.dirname(__file__)
    json_file_path = os.path.join(script_dir, "top_50_nodes.json")
    read_and_print_top_nodes(json_file_path)