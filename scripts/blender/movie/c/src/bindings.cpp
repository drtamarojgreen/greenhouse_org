#include <pybind11/pybind11.h>
#include <pybind11/stl.h>
#include "mesh_math.cpp"

namespace py = pybind11;

PYBIND11_MODULE(movie_accel, m) {
    m.doc() = "C++ Acceleration for Greenhouse Blender Movie Pipeline";

    py::class_<Movie::Vector3>(m, "Vector3")
        .def_readwrite("x", &Movie::Vector3::x)
        .def_readwrite("y", &Movie::Vector3::y)
        .def_readwrite("z", &Movie::Vector3::z);

    py::class_<Movie::MeshData>(m, "MeshData")
        .def_readwrite("vertices", &Movie::MeshData::vertices)
        .def_readwrite("indices", &Movie::MeshData::indices);

    py::class_<Movie::MeshMath>(m, "MeshMath")
        .def_static("generate_tree_geometry", &Movie::MeshMath::generate_tree_geometry)
        .def_static("calculate_vein_intensities", &Movie::MeshMath::calculate_vein_intensities);
}
