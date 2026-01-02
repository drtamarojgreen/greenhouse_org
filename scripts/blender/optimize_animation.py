
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
    Optimizes animation data by simplifying F-curves.
    """
    def post_process(self, context):
        simplify_threshold = self.config.get('simplify_fcurves_threshold', 0.01)
        if simplify_threshold <= 0:
            return

        print("Optimizing animation data...")
        
        original_fcurves = 0
        
        for action in bpy.data.actions:
            original_fcurves += len(action.fcurves)
            for fcurve in action.fcurves:
                # Use the 'clean' operator to remove redundant keyframes
                bpy.ops.action.clean(
                    {'action': action, 'active_fcurve': fcurve},
                    channels=False,
                    threshold=simplify_threshold
                )
        
        simplified_fcurves = sum(len(a.fcurves) for a in bpy.data.actions)
        
        print(f" - Simplified F-curves from {original_fcurves} to {simplified_fcurves}")

if __name__ == '__main__':
    # Example usage (for testing)
    config = {'simplify_fcurves_threshold': 0.01}
    anim_optimizer = AnimationOptimizer(config)
    # This would need a loaded blend file to run
    # anim_optimizer.post_process(bpy.context)
    print("AnimationOptimizer script loaded.")
