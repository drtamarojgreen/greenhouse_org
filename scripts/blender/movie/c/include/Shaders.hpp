#ifndef SHADERS_HPP
#define SHADERS_HPP

#include "MathCore.hpp"

namespace Graphics {
    struct Color { unsigned char r, g, b; };

    class Shaders {
    public:
        // Gouraud Shading: Interpolates color across triangle based on vertex normals
        static Color calculate_lighting(MovieMath::vec3 pos, MovieMath::vec3 normal, MovieMath::vec3 light_pos) {
            float dist = sqrt((pos.x-light_pos.x)*(pos.x-light_pos.x) + (pos.y-light_pos.y)*(pos.y-light_pos.y) + (pos.z-light_pos.z)*(pos.z-light_pos.z));
            float dot = (normal.x*(light_pos.x-pos.x) + normal.y*(light_pos.y-pos.y) + normal.z*(light_pos.z-pos.z)) / dist;
            float intensity = std::max(0.1f, std::min(1.0f, dot));
            
            return { (unsigned char)(255 * intensity), (unsigned char)(200 * intensity), (unsigned char)(150 * intensity) };
        }
    };
}

#endif
