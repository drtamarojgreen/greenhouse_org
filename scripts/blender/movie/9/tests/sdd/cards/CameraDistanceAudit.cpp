#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <map>
#include <cmath>
#include <iomanip>
#include "../cpp/util/fact_utils.h"

using namespace Sorrel::Sdd::Util;

struct Vec3 {
    double x, y, z;
    double dist(const Vec3& v) const {
        return std::sqrt(std::pow(x-v.x, 2) + std::pow(y-v.y, 2) + std::pow(z-v.z, 2));
    }
};

struct Camera {
    std::string id;
    Vec3 pos;
};

int main() {
    auto env = FactReader::readFacts("environment.facts");
    std::string lc_path = env.at("lights_camera_path");
    std::string mc_path = env.at("config_path");

    // Simplified extraction of camera positions
    std::ifstream lc_file(lc_path);
    std::string lc_content((std::istreambuf_iterator<char>(lc_file)), std::istreambuf_iterator<char>());

    // Character default positions
    std::map<std::string, Vec3> characters;
    characters["Herbaceous"] = {-1.2, 0.5, 0.0};
    characters["Arbor"] = {1.2, 0.5, 0.0};

    std::cout << std::fixed << std::setprecision(2);
    std::cout << "--- Camera-to-Character Distance Report ---" << std::endl;

    size_t pos = 0;
    while ((pos = lc_content.find("\"id\":", pos)) != std::string::npos) {
        size_t id_start = lc_content.find("\"", pos + 5) + 1;
        size_t id_end = lc_content.find("\"", id_start);
        std::string cam_id = lc_content.substr(id_start, id_end - id_start);

        // Find pos
        size_t pos_key = lc_content.find("\"pos\":", id_end);
        if (pos_key != std::string::npos && pos_key < lc_content.find("}", id_end)) {
            size_t b_start = lc_content.find("[", pos_key);
            size_t b_end = lc_content.find("]", b_start);
            std::string pos_str = lc_content.substr(b_start + 1, b_end - b_start - 1);

            try {
                double x = std::stod(pos_str.substr(0, pos_str.find(',')));
                size_t second = pos_str.find(',') + 1;
                double y = std::stod(pos_str.substr(second, pos_str.find(',', second) - second));
                double z = std::stod(pos_str.substr(pos_str.find_last_of(',') + 1));

                Vec3 cam_pos = {x, y, z};
                std::cout << "Camera: " << cam_id << " at (" << x << ", " << y << ", " << z << ")" << std::endl;
                for (auto const& [name, char_pos] : characters) {
                    std::cout << "  Distance to " << name << ": " << cam_pos.dist(char_pos) << " units" << std::endl;
                }
            } catch(...) {}
        }
        pos = id_end;
    }

    std::cout << "--- End of Distance Report ---" << std::endl;
    return 0;
}
