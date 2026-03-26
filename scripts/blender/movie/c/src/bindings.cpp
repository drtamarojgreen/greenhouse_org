#include <pybind11/pybind11.h>
#include <pybind11/stl.h>
#include "mesh_math.cpp"
#include "status.h"

namespace py = pybind11;

// Stable ABI Boundary Design
// Encapsulate and validate Blender-facing glue logic
namespace Movie {
    class PythonBridge {
    public:
        static py::dict get_status_info(const Status& status) {
            py::dict d;
            d["ok"] = status.ok();
            d["code"] = (int)status.code;
            d["message"] = status.message;
            return d;
        }
    };
}

PYBIND11_MODULE(movie_accel, m) {
    m.doc() = "High-Reliability C++ Acceleration for Greenhouse Blender Movie Pipeline";

    py::class_<Movie::Vector3>(m, "Vector3")
        .def(py::init<float, float, float>())
        .def_readwrite("x", &Movie::Vector3::x)
        .def_readwrite("y", &Movie::Vector3::y)
        .def_readwrite("z", &Movie::Vector3::z);

    py::class_<Movie::MeshData>(m, "MeshData")
        .def(py::init<>())
        .def_readwrite("vertices", &Movie::MeshData::vertices)
        .def_readwrite("indices", &Movie::MeshData::indices);

    // Robust Parameter Marshaling
    py::class_<Movie::MeshMath>(m, "MeshMath")
        .def_static("generate_tree_geometry", [](int branches, float height, float radius) {
            if (branches <= 0 || height <= 0 || radius <= 0) {
                throw py::value_error("Invalid tree geometry parameters: must be positive");
            }
            return Movie::MeshMath::generate_tree_geometry(branches, height, radius);
        })
        .def_static("calculate_vein_intensities", [](int point_count, float time) {
            if (point_count < 0) {
                throw py::value_error("point_count cannot be negative");
            }
            return Movie::MeshMath::calculate_vein_intensities(point_count, time);
        });

    py::enum_<Movie::StatusCode>(m, "StatusCode")
        .value("OK", Movie::StatusCode::OK)
        .value("ERROR", Movie::StatusCode::ERROR)
        .export_values();
}
