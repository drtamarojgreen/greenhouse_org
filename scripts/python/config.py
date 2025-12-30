"""
Configuration for the GNN model, training, and data.
"""

def get_region_config():
    """
    Returns a dictionary mapping region indices to names.
    """
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
        "learning_rate": 0.001,
        "epochs": 100,
        "gnn_depth": 3,
        "hidden_size": 128,
        "batch_size": 32,
        "random_seed": 42,
        "test_split": 0.2,
    }
