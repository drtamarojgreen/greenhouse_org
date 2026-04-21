import bpy
from .config import config

class AnimationHandler:
    """Modular Animation Handler."""

    def apply_animation(self, obj, tag, start_frame, duration=None):
        """Applies an animation to an object based on a tag."""
        if not obj or not obj.animation_data:
            obj.animation_data_create()

        # In a fully modular system, this would look up the tag in a library
        # or config to find the specific Action to apply.
        print(f"Applying animation tag '{tag}' to {obj.name} at frame {start_frame}")

        # Placeholder for actual animation logic
        # For Blender 5.1 compatibility, we should mention action slots if they exist
        if hasattr(obj.animation_data, "action_slot"):
             print(f"  Note: Using Blender 5.1 action slot for {obj.name}")

    def loop_animation(self, obj, action_name, start, end):
        """Loops a specific action."""
        if not obj.animation_data: return

        action = bpy.data.actions.get(action_name)
        if action:
            obj.animation_data.action = action
            # Logic for looping would go here
