"""
Configuration for the GNN model, training, and data.
"""

def get_region_config():
    """
    Returns a dictionary mapping region indices to names.
    """
    import os
    import json
    
    mapping_path = os.path.join(os.path.dirname(__file__), "region_map.json")
    if os.path.exists(mapping_path):
        with open(mapping_path, 'r') as f:
            mapping = json.load(f)
        # The stored map is NewID_str -> Name. We want IntID -> Name
        return {int(k): v for k, v in mapping.items()}
        
    return {
        0: "background",
        1: "left_amygdala",
        2: "right_amygdala",
        3: "left_hippocampus",
        4: "right_hippocampus",
        # Add more regions as needed
    }

def get_train_config():
    """
    Returns a dictionary with training hyperparameters.
    """
    return {
        "learning_rate": 0.01,
        "epochs": 400,
        "gnn_depth": 4,
        "hidden_size": 256,
        "batch_size": 32,
        "random_seed": 42,
        "test_split": 0.2,
        "dropout": 0.5
    }
