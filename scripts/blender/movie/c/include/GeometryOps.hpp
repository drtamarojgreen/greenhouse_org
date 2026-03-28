#ifndef GEOMETRY_OPS_HPP
#define GEOMETRY_OPS_HPP

#include "GeometryCore.hpp"

namespace BModeler {
    // Advanced Modeling Operators
    class Operators {
    public:
        // Simple Extrusion: Extends a quad along its normal
        static void extrude_face(Mesh& mesh, int face_idx, float amount) {
            if (face_idx >= mesh.faces.size()) return;
            auto& f = mesh.faces[face_idx];
            
            // Create 4 new vertices
            int base_ptr = mesh.vertices.size();
            for (int vid : f.vert_ids) {
                auto v = mesh.vertices[vid];
                mesh.add_vertex(v.co.x, v.co.y + amount, v.co.z);
            }
            
            // Add side quads
            mesh.add_quad(f.vert_ids[0], f.vert_ids[1], base_ptr+1, base_ptr);
            mesh.add_quad(f.vert_ids[1], f.vert_ids[2], base_ptr+2, base_ptr+1);
            mesh.add_quad(f.vert_ids[2], f.vert_ids[3], base_ptr+3, base_ptr+2);
            mesh.add_quad(f.vert_ids[3], f.vert_ids[0], base_ptr, base_ptr+3);
            
            // Update original face to be 'top'
            f.vert_ids = {base_ptr, base_ptr+1, base_ptr+2, base_ptr+3};
        }
    };
}

#endif
