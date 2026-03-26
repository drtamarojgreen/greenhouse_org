import bpy
import struct
import sys
import os

def apply_binary_logic(bin_path):
    # Fixed actor order matching C++ struct serialization
    ACTORS = ["Herbaceous", "GloomGnome"]
    
    with open(bin_path, 'rb') as f:
        # Read header
        frame_count = struct.unpack('i', f.read(4))[0]
        
        for i in range(frame_count):
            # Frame setup is handled by Blender loop, but we set data per frame
            for actor_name in ACTORS:
                # Read Vector3 loc (3f), rot (3f), scale (3f), bool vis (1b)
                data = f.read(37) # 9*4 + 1
                if not data: break
                
                lx, ly, lz, rx, ry, rz, sx, sy, sz, vis = struct.unpack('fffffffff?', data)
                
                obj = bpy.data.objects.get(actor_name)
                if obj:
                    obj.location = (lx, ly, lz)
                    obj.rotation_euler = (rx, ry, rz)
                    obj.scale = (sx, sy, sz)
                    obj.hide_render = not vis
                    # Insert keyframes for this frame (very fast with pre-processed math)
                    # Note: C++ has already determined the exact value.
                    frame = i + 1 # Simple 1-based offset for chunk
                    obj.keyframe_insert(data_path="location", frame=frame)
                    obj.keyframe_insert(data_path="scale", frame=frame)
                    obj.keyframe_insert(data_path="hide_render", frame=frame)

if __name__ == "__main__":
    # Point 155: Logic-Free Binary Execution Bridge
    if "--data" in sys.argv:
        bin_path = sys.argv[sys.argv.index("--data") + 1]
        apply_binary_logic(bin_path)
