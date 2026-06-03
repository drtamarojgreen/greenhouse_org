"""
Utility functions for logging and file handling.
"""
import logging
import os
import json
import time
import numpy as np
from functools import wraps

class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return super(NumpyEncoder, self).default(obj)

def setup_logger(name, log_file=None, level=logging.INFO):
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    logger = logging.getLogger(name)
    logger.setLevel(level)

    # Console Handler
    ch = logging.StreamHandler()
    ch.setFormatter(formatter)
    logger.addHandler(ch)

    # File Handler
    if log_file:
        os.makedirs(os.path.dirname(log_file), exist_ok=True)
        fh = logging.FileHandler(log_file)
        fh.setFormatter(formatter)
        logger.addHandler(fh)

    return logger

def timer(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        end = time.time()
        print(f"[{func.__name__}] executed in {end - start:.2f} seconds")
        return result
    return wrapper

def save_json(data, filepath):
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=2, cls=NumpyEncoder)

def load_json(filepath):
    with open(filepath, 'r') as f:
        return json.load(f)