import bpy
import math

def setup_scene(master):
    """The Exchange of Knowledge and Stoic Forge."""
    master.create_intertitle("The Exchange of\nKnowledge", 951, 1050)
    master.create_intertitle("The Forge of\nFortitude", 1251, 1350)

    # Forge pulsing is handled in master currently, but we can keep it there
    pass
