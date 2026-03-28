#ifndef MOVIE_MESH_MATH_HPP
#define MOVIE_MESH_MATH_HPP

#include <vector>
#include "GeometryCore.hpp"

namespace Movie {
    struct Vector3 {
        float x, y, z;
    };

    struct MeshData {
        std::vector<Vector3> vertices;
        std::vector<int> indices;
    };

    class MeshMath {
    public:
        static MeshData generate_tree_geometry(int branches, float height, float radius);
        static MeshData generate_complex_tree(int clusters, float height, float radius);
        static std::vector<float> calculate_vein_intensities(int point_count, float time);
        static std::vector<float> generate_noise_sequence(int frame_start, int frame_end, float strength, float scale, float phase);
    };
}

extern "C" {
    float* generate_tree_geometry_c(int branches, float height, float radius, int* out_count);
    float* calculate_vein_intensities_c(int point_count, float time);
    float* generate_noise_sequence_c(int frame_start, int frame_end, float strength, float scale, float phase, int* out_count);
    void free_float_array(float* ptr);
}

#endif
