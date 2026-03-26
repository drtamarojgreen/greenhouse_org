#ifndef MATH_CORE_HPP
#define MATH_CORE_HPP

#include <cmath>
#include <string>

// Optimized Animation Core for C++ Movie Engine
namespace MovieMath {
    inline float looping_noise(int f, float scale, float str) { return sin(f / scale) * str; }
    
    inline float ease_in_out(float t) { 
        return (t < 0) ? 0 : (t > 1) ? 1 : t * t * (3.0f - 2.0f * t); 
    }

    // Quadratic Speed Ramp
    inline float quadratic_ramp(float t) { return t * t; }

    // Point-in-Corridor Geometry (for specialized culling tests)
    struct vec3 { float x, y, z; };
    inline float dist_line_point(vec3 p, vec3 a, vec3 b) {
        float l2 = (a.x-b.x)*(a.x-b.x) + (a.y-b.y)*(a.y-b.y) + (a.z-b.z)*(a.z-b.z);
        if (l2 == 0.0) return sqrt((p.x-a.x)*(p.x-a.x) + (p.y-a.y)*(p.y-a.y) + (p.z-a.z)*(p.z-a.z));
        float t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y) + (p.z - a.z) * (b.z - a.z)) / l2;
        t = std::max(0.0f, std::min(1.0f, t));
        vec3 projection = { a.x + t * (b.x - a.x), a.y + t * (b.y - a.y), a.z + t * (b.z - a.z) };
        return sqrt((p.x-projection.x)*(p.x-projection.x) + (p.y-projection.y)*(p.y-projection.y) + (p.z-projection.z)*(p.z-projection.z));
    }
}

#endif
