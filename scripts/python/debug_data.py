import numpy as np
import os
import json

data_dir = "scripts/python"
labels = np.load(os.path.join(data_dir, "labels.npy"))
features = np.load(os.path.join(data_dir, "features.npy"))
with open(os.path.join(data_dir, "region_map.json"), 'r') as f:
    region_map = json.load(f)

print(f"Labels shape: {labels.shape}")
print(f"Features shape: {features.shape}")
print(f"Number of classes in map: {len(region_map)}")
print(f"Unique labels in data: {len(np.unique(labels))}")
print(f"Label range: {labels.min()} to {labels.max()}")

print("\nFeature Stats:")
print(f"Mean: {features.mean():.4f}, Std: {features.std():.4f}")
print(f"Min: {features.min():.4f}, Max: {features.max():.4f}")

values, counts = np.unique(labels, return_counts=True)
print("\nTop 5 Classes by count:")
for v, c in sorted(zip(values, counts), key=lambda x: -x[1])[:5]:
    name = region_map.get(str(v), "Unknown")
    print(f"ID {v}: {c} ({name})")
