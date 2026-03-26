#include <vector>
#include <fstream>
#include <string>
#include "GeometryCore.hpp"
#include "Shaders.hpp"

class Renderer {
    int width, height;
    std::vector<float> z_buffer;
    std::vector<unsigned char> frame_buffer;
    MovieMath::vec3 light_pos = {5.0f, 10.0f, 5.0f};

public:
    Renderer(int w, int h) : width(w), height(h) {
        z_buffer.assign(w * h, 1e10f);
        frame_buffer.assign(w * h * 3, 0);
    }
    
    void set_light(float x, float y, float z) { light_pos = {x, y, z}; }

    void clear() {
        z_buffer.assign(width * height, 1e10f);
        frame_buffer.assign(width * height * 3, 30); // Dark grey background
    }

    // Simplistic Software Rasterizer (Placeholder for full Gouraud shader)
    void render_mesh(const BModeler::Mesh& mesh) {
        // Point 160: Software rasterization logic goes here
        // For now, we mock vertex projection
        for (const auto& v : mesh.vertices) {
            int px = (int)((v.co.x + 5.0f) * (width / 10.0f));
            int py = (int)((v.co.z + 5.0f) * (height / 10.0f));
            if (px >= 0 && px < width && py >= 0 && py < height) {
                int idx = (py * width + px) * 3;
                frame_buffer[idx] = 255;   // Red point
                frame_buffer[idx+1] = 200;
                frame_buffer[idx+2] = 150;
            }
        }
    }

    void save_ppm(const std::string& filename) {
        std::ofstream ofs(filename, std::ios::binary);
        ofs << "P6\n" << width << " " << height << "\n255\n";
        ofs.write((char*)frame_buffer.data(), frame_buffer.size());
    }
};

#endif
