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

    class Mesh {
    public:
        std::vector<Vertex> vertices;
        std::vector<Face> faces;

        void add_vertex(float x, float y, float z) {
            vertices.push_back({{x, y, z}, (int)vertices.size()});
        }
        
        void add_quad(int v1, int v2, int v3, int v4) {
            faces.push_back({{v1, v2, v3, v4}});
        }

        // Modeler Operator: Transform
        void transform(float dx, float dy, float dz) {
            for (auto& v : vertices) {
                v.co.x += dx; v.co.y += dy; v.co.z += dz;
            }
        }
    };
}

#endif
