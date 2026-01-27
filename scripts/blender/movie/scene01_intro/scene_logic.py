import bpy
import math

def setup_scene(master):
    """Intro and Stoic Reason titles."""
    # Intro
    master.create_intertitle("GreenhouseMD\nPresents", 1, 100)
    # Intertitle: Stoic Reason
    master.create_intertitle("The Seat of\nStoic Reason", 101, 200)

    # Camera keyframes (handled by master typically but we can add specific ones here)
    # The master will call this for scene-specific object setups.
    pass
