import csv
import json
import os
import ast

def bridge_v8_to_v7(input_csv="docs/endpoints/graph.csv", output_csv="scripts/research/mesh/v7/graph_v7.csv"):
    """
    Bridges v8 graph output to v7 analyzer format by mapping string IDs to integers.
    """
    if not os.path.exists(input_csv):
        print(f"Input v8 graph not found: {input_csv}")
        return

    nodes = []
    id_map = {} # StringID -> IntID
    next_id = 1

    # Read v8 nodes
    with open(input_csv, 'r', newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            string_id = row['NodeID']
            if string_id not in id_map:
                id_map[string_id] = next_id
                next_id += 1

            row['IntID'] = id_map[string_id]
            nodes.append(row)

    # Ensure output directory exists
    os.makedirs(os.path.dirname(output_csv), exist_ok=True)

    # Write v7 compatible CSV
    # v7 format: "NodeLabel,NodeID,[ListOfConnectedNodeIDs],Weight,Group"
    # where NodeID and connections are integers.
    with open(output_csv, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        for node in nodes:
            string_connections = json.loads(node['Connections'])
            int_connections = []
            for conn in string_connections:
                if conn in id_map:
                    int_connections.append(id_map[conn])
                else:
                    # If it's a connection to a node not in the primary list,
                    # we'd ideally have it, but for bridge consistency:
                    id_map[conn] = next_id
                    int_connections.append(next_id)
                    next_id += 1

            writer.writerow([
                node['NodeLabel'],
                node['IntID'],
                int_connections,
                node['Weight'],
                node['Group']
            ])

    print(f"Successfully bridged {len(nodes)} nodes to v7 format at {output_csv}")
    print(f"ID Mapping saved (implicitly in {output_csv})")

if __name__ == "__main__":
    # If run as a script, try to bridge the default locations
    bridge_v8_to_v7()
