#include "MeshMath.hpp"
#include <cmath>
#include <iostream>
#include <algorithm>

namespace Movie {
    MeshData MeshMath::generate_tree_geometry(int branches, float height, float radius) {
        MeshData mesh;
        for (int i = 0; i < branches; ++i) {
            float angle = (2.0f * M_PI * i) / branches;
            mesh.vertices.push_back({
                radius * std::cos(angle),
                radius * std::sin(angle),
                height * (float(i) / branches)
            });
        }
        return mesh;
    }

    MeshData MeshMath::generate_complex_tree(int clusters, float height, float radius) {
        MeshData mesh;
        mesh.vertices.push_back({0, 0, 0});
        mesh.vertices.push_back({0, 0, height});

        for (int i = 0; i < clusters; ++i) {
            float angle = (2.0f * M_PI * i) / clusters;
            float dist = radius * (0.5f + (float)rand()/RAND_MAX);
            float x = std::cos(angle) * dist;
            float y = std::sin(angle) * dist;
            float z = height + ((float)rand()/RAND_MAX * 2.0f - 1.0f);
            mesh.vertices.push_back({x, y, z});
        }
        return mesh;
    }

    std::vector<float> MeshMath::calculate_vein_intensities(int point_count, float time) {
        std::vector<float> intensities;
        intensities.reserve(point_count);
        for (int i = 0; i < point_count; ++i) {
            intensities.push_back(std::sin(time + i * 0.1f) * 0.5f + 0.5f);
        }
        return intensities;
    }

    std::vector<float> MeshMath::generate_noise_sequence(int frame_start, int frame_end, float strength, float scale, float phase) {
        std::vector<float> sequence;
        sequence.reserve(frame_end - frame_start + 1);
        for (int f = frame_start; f <= frame_end; ++f) {
            sequence.push_back(std::sin((float)f / scale + phase) * strength);
        }
        return sequence;
    }
}

extern "C" {
    float* generate_tree_geometry_c(int branches, float height, float radius, int* out_count) {
        auto mesh = Movie::MeshMath::generate_complex_tree(branches, height, radius);
        *out_count = mesh.vertices.size();
        float* result = new float[mesh.vertices.size() * 3];
        for (size_t i = 0; i < mesh.vertices.size(); ++i) {
            result[i * 3 + 0] = mesh.vertices[i].x;
            result[i * 3 + 1] = mesh.vertices[i].y;
            result[i * 3 + 2] = mesh.vertices[i].z;
        }
        return result;
    }

    float* calculate_vein_intensities_c(int point_count, float time) {
        auto intensities = Movie::MeshMath::calculate_vein_intensities(point_count, time);
        float* result = new float[point_count];
        for (int i = 0; i < point_count; ++i) {
            result[i] = intensities[i];
        }
        return result;
    }

    float* generate_noise_sequence_c(int frame_start, int frame_end, float strength, float scale, float phase, int* out_count) {
        auto seq = Movie::MeshMath::generate_noise_sequence(frame_start, frame_end, strength, scale, phase);
        *out_count = seq.size();
        float* result = new float[seq.size()];
        std::copy(seq.begin(), seq.end(), result);
        return result;
    }

    void free_float_array(float* ptr) {
        delete[] ptr;
    }
}
