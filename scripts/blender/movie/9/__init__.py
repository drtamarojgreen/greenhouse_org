import bpy
import os
import sys

# central __init__.py
M9_DIR = os.path.dirname(os.path.abspath(__file__))
if M9_DIR not in sys.path: sys.path.insert(0, M9_DIR)

# No more sys.path hacking of subdirectories.
# Standard packages:
# import config, registry, character_builder, director, asset_manager...
