import bpy
import os
import sys

# central __init__.py
M7_DIR = os.path.dirname(os.path.abspath(__file__))
if M7_DIR not in sys.path: sys.path.insert(0, M7_DIR)

# No more sys.path hacking of subdirectories.
# Standard packages:
# import config, registry, character_builder, director, asset_manager...
