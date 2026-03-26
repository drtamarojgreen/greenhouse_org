#ifndef GEOMETRY_CORE_HPP
#define GEOMETRY_CORE_HPP

#include <vector>
#include <map>
#include <string>
#include "MathCore.hpp"

// C++ Native 3D Modeler Component
namespace BModeler {
    struct Vertex { MovieMath::vec3 co; int id; };
    struct Face { std::vector<int> vert_ids; };

    // Optimized SoA (Structure of Arrays) Memory Layout
    struct MeshSoA {
        std::vector<float> x, y, z;
        std::vector<int> id;

        void resize(size_t n) {
            x.resize(n); y.resize(n); z.resize(n); id.resize(n);
        }
    };

    class Mesh {
    public:
        std::vector<Vertex> vertices;
        std::vector<Face> faces;
        MeshSoA soa;

        void add_vertex(float x, float y, float z) {
            vertices.push_back({{x, y, z}, (int)vertices.size()});
            soa.x.push_back(x);
            soa.y.push_back(y);
            soa.z.push_back(z);
            soa.id.push_back((int)soa.id.size());
        }

        void add_quad(int v1, int v2, int v3, int v4) {
            faces.push_back({{v1, v2, v3, v4}});
        }

        // Modeler Operator: Transform (Optimized for SoA)
        void transform(float dx, float dy, float dz) {
            for (size_t i = 0; i < soa.x.size(); ++i) {
                soa.x[i] += dx;
                soa.y[i] += dy;
                soa.z[i] += dz;
            }
            // Sync AoS for legacy support if needed
            for (size_t i = 0; i < vertices.size(); ++i) {
                vertices[i].co.x = soa.x[i];
                vertices[i].co.y = soa.y[i];
                vertices[i].co.z = soa.z[i];
            }
        }
    };
}

#endif
