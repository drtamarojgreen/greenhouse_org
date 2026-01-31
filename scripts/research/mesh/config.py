"""
Configuration settings for the MeSH Historical Analysis Pipeline.
"""
import os

# --- File Paths ---
DATA_DIR = os.getenv("MESH_DATA_DIR", "./data")
OUTPUT_DIR = os.path.join(DATA_DIR, "output")
MESH_DESC_XML = os.path.join(DATA_DIR, "desc2024.xml")  # Update year as needed
PUBMED_DIR = os.path.join(DATA_DIR, "pubmed_baseline")

# --- Tree Number Prefixes for Mental Health ---
# F03: Mental Disorders
# F01: Behavior and Behavior Mechanisms
# G11: Psychiatry and Psychology
# D: Selected Drugs (handled via logic, broad inclusion initially)
TARGET_TREE_PREFIXES = ["F03", "F01", "G11"]

# --- Pruning Thresholds (Pre-Step 0.5) ---
MIN_LIFETIME_MENTIONS = 200
MIN_ACTIVE_YEARS = 5
MIN_PEAK_ANNUAL_COUNT = 20

# --- Analysis Settings ---
START_YEAR = 1965
END_YEAR = 2025
NUM_WORKERS = 8  # Adjust based on available CPU cores