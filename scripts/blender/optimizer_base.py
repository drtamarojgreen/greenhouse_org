
import bpy

class BaseOptimizer:
    """
    Base class for all Blender optimization modules.
    Ensures a consistent interface for the orchestrator.
    """
    def __init__(self, config=None):
        self.config = config or {}

    def process(self, context, obj):
        """
        Main entry point for processing an individual object.
        """
        raise NotImplementedError("Optimization logic must be implemented in subclasses.")

    def post_process(self, context):
        """
        Optional hook for scene-wide cleanup or data management.
        """
        pass
