import ctypes
import os
import sys

# Load the shared library
lib_path = os.path.join(os.path.dirname(__file__), "c", "libmovie_accel.so")
try:
    _lib = ctypes.CDLL(lib_path)
except OSError as e:
    _lib = None
    print(f"C_ACCEL: Could not load shared library from {lib_path}: {e}")

if _lib:
    # float* generate_tree_geometry_c(int branches, float height, float radius, int* out_count)
    _lib.generate_tree_geometry_c.argtypes = [ctypes.c_int, ctypes.c_float, ctypes.c_float, ctypes.POINTER(ctypes.c_int)]
    _lib.generate_tree_geometry_c.restype = ctypes.POINTER(ctypes.c_float)

    # float* calculate_vein_intensities_c(int point_count, float time)
    _lib.calculate_vein_intensities_c.argtypes = [ctypes.c_int, ctypes.c_float]
    _lib.calculate_vein_intensities_c.restype = ctypes.POINTER(ctypes.c_float)

    # float* generate_noise_sequence_c(int frame_start, int frame_end, float strength, float scale, float phase, int* out_count)
    _lib.generate_noise_sequence_c.argtypes = [ctypes.c_int, ctypes.c_int, ctypes.c_float, ctypes.c_float, ctypes.c_float, ctypes.POINTER(ctypes.c_int)]
    _lib.generate_noise_sequence_c.restype = ctypes.POINTER(ctypes.c_float)

    # void free_float_array(float* ptr)
    _lib.free_float_array.argtypes = [ctypes.POINTER(ctypes.c_float)]
    _lib.free_float_array.restype = None

def is_accel_available():
    return _lib is not None and os.environ.get("MOVIE_CPP_ACCEL") == "1"

def generate_tree_geometry(branches, height, radius):
    if not is_accel_available():
        return None
    
    out_count = ctypes.c_int()
    ptr = _lib.generate_tree_geometry_c(branches, height, radius, ctypes.byref(out_count))
    
    count = out_count.value
    # Convert pointer to list of (x, y, z) tuples
    data = []
    for i in range(count):
        data.append((ptr[i*3 + 0], ptr[i*3 + 1], ptr[i*3 + 2]))
    
    _lib.free_float_array(ptr)
    return data

def calculate_vein_intensities(point_count, time):
    if not is_accel_available():
        return None
    
    ptr = _lib.calculate_vein_intensities_c(point_count, time)
    data = [ptr[i] for i in range(point_count)]
    
    _lib.free_float_array(ptr)
    return data

def generate_noise_sequence(frame_start, frame_end, strength, scale, phase):
    if not is_accel_available():
        return None
    
    out_count = ctypes.c_int()
    ptr = _lib.generate_noise_sequence_c(frame_start, frame_end, strength, scale, phase, ctypes.byref(out_count))
    
    count = out_count.value
    data = [ptr[i] for i in range(count)]
    
    _lib.free_float_array(ptr)
    return data
