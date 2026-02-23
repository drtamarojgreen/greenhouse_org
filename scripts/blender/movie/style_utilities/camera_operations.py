"""
Camera operations for Greenhouse Movie Production.
"""
import bpy
from .fcurves_operations import insert_looping_noise

def camera_push_in(cam, target, frame_start, frame_end, distance=5):
    """Animates camera moving towards target."""
    direction = (target.location - cam.location).normalized()
    cam.keyframe_insert(data_path="location", frame=frame_start)
    cam.location += direction * distance
    cam.keyframe_insert(data_path="location", frame=frame_end)

def camera_pull_out(cam, target, frame_start, frame_end, distance=5):
    """Animates camera moving away from target."""
    camera_push_in(cam, target, frame_start, frame_end, distance=-distance)

def apply_camera_shake(cam, frame_start, frame_end, strength=0.1):
    """Adds noise-based camera shake."""
    insert_looping_noise(cam, "location", strength=strength, scale=1.0, frame_start=frame_start, frame_end=frame_end)
