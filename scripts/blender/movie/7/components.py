import os
import sys

# Ensure Movie 7 root is in sys.path
M7_DIR = os.path.dirname(os.path.abspath(__file__))
if M7_DIR not in sys.path:
    sys.path.insert(0, M7_DIR)

# Trigger registration
import modeling.plant
import rigging.plant
import shading.plant
import animation.plant

def initialize_registry(): pass
