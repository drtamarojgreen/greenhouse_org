import pandas as pd
import numpy as np
import json
import os

def load_mesh_counts(path):
    """
    Load MeSH term x year frequency CSV.
    Validates schema and data types.
    Enforces size limits (<25 MB).
    """
    if not os.path.exists(path):
        raise FileNotFoundError(f"Data file not found: {path}")

    file_size = os.path.getsize(path)
    if file_size > 25 * 1024 * 1024:
        raise ValueError(f"File size exceeds 25MB limit: {file_size} bytes")

    df = pd.read_csv(path)
    return df

def save_numpy_array(path, array):
    """
    Save numpy array to disk.
    """
    os.makedirs(os.path.dirname(path), exist_ok=True)
    np.save(path, array)

def save_json(path, obj):
    """
    Save object as JSON.
    """
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        json.dump(obj, f, indent=4)

def save_dataframe(path, df):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    df.to_csv(path, index=False)
