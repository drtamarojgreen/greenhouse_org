import bpy
import ctypes
import os

# Point 155: C++ Plugin Loader for Blender
# This addon exposes the high-performance C++ Movie Engine to Blender.

class ActorState(ctypes.Structure):
    _fields_ = [
        ("lx", ctypes.c_float), ("ly", ctypes.c_float), ("lz", ctypes.c_float),
        ("rx", ctypes.c_float), ("ry", ctypes.c_float), ("rz", ctypes.c_float),
        ("sx", ctypes.c_float), ("sy", ctypes.c_float), ("sz", ctypes.c_float),
        ("visible", ctypes.c_bool)
    ]

# Global pointer to the C++ shared library
LIB = None

def load_native_plugin():
    global LIB
    lib_path = os.path.join(os.path.dirname(__file__), "libmovie_plugin.so")
    if not os.path.exists(lib_path):
        # Fallback to root if called from script
        lib_path = "../libmovie_plugin.so"
    
    try:
        LIB = ctypes.CDLL(lib_path)
        LIB.calculate_frame_acting.argtypes = [ctypes.c_int, ctypes.c_char_p, ctypes.POINTER(ActorState)]
        LIB.calculate_frame_acting.restype = None
        print(f"Movie Engine: Successfully loaded C++ Plugin from {lib_path}")
    except Exception as e:
        print(f"Movie Engine: FAILED to load C++ Plugin. Error: {e}")

class MOVIE_OT_RenderNative(bpy.types.Operator):
    bl_idname = "movie.render_native"
    bl_label = "Render with C++ Engine"
    
    def execute(self, context):
        if not LIB: load_native_plugin()
        if not LIB: return {'CANCELLED'}
        
        scene = context.scene
        actors = ["Herbaceous", "GloomGnome", "GreenhouseLogo"]
        
        for f in range(scene.frame_start, scene.frame_end + 1):
            scene.frame_set(f)
            for actor_name in actors:
                obj = bpy.data.objects.get(actor_name)
                if not obj: continue
                
                state = ActorState()
                LIB.calculate_frame_acting(f, actor_name.encode('utf-8'), ctypes.byref(state))
                
                obj.location = (state.lx, state.ly, state.lz)
                obj.rotation_euler = (state.rx, state.ry, state.rz)
                obj.scale = (state.sx, state.sy, state.sz)
                obj.hide_render = not state.visible
                
                # Point 155: Zero-overhead keyframing
                obj.keyframe_insert(data_path="location", frame=f)
                obj.keyframe_insert(data_path="scale", frame=f)
                obj.keyframe_insert(data_path="hide_render", frame=f)
                
        return {'FINISHED'}

def register():
    bpy.utils.register_class(MOVIE_OT_RenderNative)
    load_native_plugin()

def unregister():
    bpy.utils.unregister_class(MOVIE_OT_RenderNative)

if __name__ == "__main__":
    register()
    # Trigger acting calculation if run as script
    bpy.ops.movie.render_native()
