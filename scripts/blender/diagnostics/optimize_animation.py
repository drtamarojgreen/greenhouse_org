
import bpy
try:
    from optimizer_base import BaseOptimizer
except ImportError:
    import sys
    import os
    sys.path.append(os.path.dirname(__file__))
    from optimizer_base import BaseOptimizer

class AnimationOptimizer(BaseOptimizer):
    """
    Optimizes animation data by simplifying F-curves and scaling to target duration.
    """
    def post_process(self, context):
        simplify_threshold = self.config.get('simplify_fcurves_threshold', 0.01)
        target_frames = self.config.get('target_frames', 20)
        target_fps = self.config.get('fps', 2)

        if simplify_threshold > 0:
            print("Optimizing animation data (Simplification)...")
            original_fcurves = 0
            for action in bpy.data.actions:
                original_fcurves += len(action.fcurves)
                for fcurve in action.fcurves:
                    self.simplify_fcurve(fcurve, simplify_threshold)
            simplified_fcurves = sum(len(a.fcurves) for a in bpy.data.actions)
            print(f" - Simplified F-curves from {original_fcurves} to {simplified_fcurves}")

        # Scale to Target Frames
        print(f"Scaling animations to {target_frames} frames...")
        
        # Update Scene Settings
        context.scene.frame_start = 1
        context.scene.frame_end = target_frames
        context.scene.render.fps = target_fps
        
        for action in bpy.data.actions:
            if not action.fcurves:
                continue
                
            # Determine current range
            min_frame, max_frame = action.frame_range
            current_duration = max_frame - min_frame
            
            if current_duration <= 0:
                continue
                
            scale_factor = (target_frames - 1) / current_duration
            
            # Scale keyframes
            for fcurve in action.fcurves:
                for kp in fcurve.keyframe_points:
                    # Scale time (x-axis)
                    kp.co[0] = (kp.co[0] - min_frame) * scale_factor + 1
                    kp.handle_left[0] = (kp.handle_left[0] - min_frame) * scale_factor + 1
                    kp.handle_right[0] = (kp.handle_right[0] - min_frame) * scale_factor + 1

        print("Animation scaling complete.")

    def simplify_fcurve(self, fcurve, threshold):
        """
        Simplifies an F-Curve by removing redundant keyframes.
        """
        points = fcurve.keyframe_points
        if len(points) < 3:
            return

        i = 1
        while i < len(points) - 1:
            prev = points[i-1]
            curr = points[i]
            next = points[i+1]
            
            dx = next.co[0] - prev.co[0]
            dy = next.co[1] - prev.co[1]
            
            if abs(dx) < 0.0001:
                i += 1
                continue
                
            t = (curr.co[0] - prev.co[0]) / dx
            interp_y = prev.co[1] + t * dy
            
            if abs(curr.co[1] - interp_y) < threshold:
                points.remove(curr)
            else:
                i += 1

if __name__ == '__main__':
    # Example usage (for testing)
    config = {'simplify_fcurves_threshold': 0.01}
    anim_optimizer = AnimationOptimizer(config)
    # This would need a loaded blend file to run
    # anim_optimizer.post_process(bpy.context)
    print("AnimationOptimizer script loaded.")
