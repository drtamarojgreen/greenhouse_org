import networkx as nx
import ast # For safely evaluating string representations of Python literals
import csv # For robust CSV parsing

def analyze_graph_data(csv_file_path):
    """
    Analyzes graph data from a CSV file and prints a summary report.

    The CSV is expected to have a column for node IDs and a column
    containing a string representation of a list of connected node IDs.
    Example format: "NodeLabel,NodeID,[ListOfConnectedNodeIDs],Attribute1,Attribute2"
    """
    # Initialize a directed graph
    G = nx.DiGraph()

    try:
        with open(csv_file_path, 'r', newline='', encoding='utf-8') as file:
            reader = csv.reader(file)
            for index, row in enumerate(reader):
                if not row: # Skip empty rows
                    continue
                try:
                    # Assuming the second field (index 1) is the source node ID
                    # and the third field (index 2) is the list of connected target node IDs.
                    # Adjust column indices if your CSV structure is different.
                    source_node_col_index = 1
                    target_nodes_list_col_index = 2

                    source_node = int(row[source_node_col_index]) # Convert NodeID to int
                    
                    target_nodes_str = row[target_nodes_list_col_index]
                    # Safely evaluate the string representation of the list
                    if target_nodes_str.strip() == '[]':
                        target_nodes = []
                    else:
                        # ast.literal_eval expects valid Python literal.
                        # Some CSVs might have malformed list strings (e.g., missing quotes, extra spaces)
                        # We'll try to clean it up a bit if necessary, or let ast.literal_eval fail for truly bad ones.
                        target_nodes = ast.literal_eval(target_nodes_str)

                    # Ensure source_node is added even if it has no connections
                    G.add_node(source_node)

                    for target_node in target_nodes:
                        G.add_edge(source_node, int(target_node)) # Ensure target_node is int

                except (ValueError, SyntaxError) as e:
                    print(f"Warning: Could not parse row {index + 1}: {row}. Error: {e}")
                    continue
                except IndexError:
                    print(f"Warning: Row {index + 1} does not have expected number of columns ({len(row)} instead of at least 3): {row}")
                    continue
    except FileNotFoundError:
        print(f"Error: CSV file not found at {csv_file_path}")
        return
    except Exception as e:
        print(f"An unexpected error occurred while reading the CSV: {e}")
        return

    if not G.nodes():
        print("No nodes found in the graph. Cannot generate a report.")
        return

    print("--- Graph Analysis Report ---")
    print(f"Number of nodes: {G.number_of_nodes()}")
    print(f"Number of edges: {G.number_of_edges()}")

    if G.number_of_nodes() > 1:
        density = nx.density(G)
        print(f"Graph density: {density:.4f}")

        degrees = [degree for node, degree in G.degree()]
        if degrees:
            average_degree = sum(degrees) / len(degrees)
            print(f"Average degree: {average_degree:.2f}")

        # For directed graphs, connected components refer to weakly connected components
        num_weakly_connected_components = nx.number_weakly_connected_components(G)
        print(f"Number of weakly connected components: {num_weakly_connected_components}")

        if num_weakly_connected_components > 0:
            largest_wcc = max(nx.weakly_connected_components(G), key=len)
            print(f"Size of the largest weakly connected component: {len(largest_wcc)}")
    else:
        print("Graph has too few nodes to calculate density or average degree meaningfuly.")

    print("\n--- Top 50 Nodes by Degree (Incoming + Outgoing) ---")
    sorted_degrees = sorted(G.degree(), key=lambda item: item[1], reverse=True)
    top_nodes_data = []
    for node, degree in sorted_degrees[:50]:
        print(f"Node '{node}': Degree = {degree}")
        top_nodes_data.append({"node": node, "degree": degree})

    # Save top nodes to a JSON file
    import json
    output_json_path = "top_50_nodes.json"
    try:
        with open(output_json_path, 'w', encoding='utf-8') as json_file:
            json.dump(top_nodes_data, json_file, indent=4)
        print(f"\nSuccessfully saved top 50 nodes to {output_json_path}")
    except Exception as e:
        print(f"Error saving top nodes to JSON file: {e}")

if __name__ == "__main__":
    # Path to the graph CSV file relative to the greenhouse_org directory
    # The script will be in greenhouse_org/scripts/research/mesh/v7/
    # So we need to go up 4 levels to get to the root of LLM, then down to greenhouse_org/docs/endpoints/
    # Corrected path assuming the script is run from its own directory
    current_script_dir = "/home/tamarojgreen/development/LLM/greenhouse_org/scripts/research/mesh/v7/"
    base_path = "/home/tamarojgreen/development/LLM/"
    csv_file = base_path + "greenhouse_org/docs/endpoints/graph.csv"
    analyze_graph_data(csv_file)
