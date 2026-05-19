#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <regex>

int main() {
    bool passed = true;
    std::string root = "scripts/blender/movie/10/";

    // 1. Naming Convention Check
    std::ifstream config_file(root + "movie_config.json");
    std::string config_content((std::istreambuf_iterator<char>(config_file)), (std::istreambuf_iterator<char>()));
    if (config_content.find("_HF") == std::string::npos) {
        std::cerr << "Logic Violation: No _HF protagonist suffix." << std::endl;
        passed = false;
    }

    // 2. High-Fidelity Infrastructure Check (Lights/Cameras)
    if (config_content.find("\"lights\"") == std::string::npos || config_content.find("\"cameras\"") == std::string::npos) {
        std::cerr << "Fidelity Violation: Missing lighting or camera infrastructure in config." << std::endl;
        passed = false;
    }

    // 3. Logic Implementation Check (Master script must implement setup methods)
    std::ifstream master_file(root + "master.py");
    std::string master_content((std::istreambuf_iterator<char>(master_file)), (std::istreambuf_iterator<char>()));
    std::vector<std::string> required_logic = {"def setup_lighting", "def setup_cameras", "def build_characters", "bpy.data.lights.new", "bpy.data.cameras.new"};
    for (const auto& logic : required_logic) {
        if (master_content.find(logic) == std::string::npos) {
            std::cerr << "Logic Violation: Master script missing implementation: " << logic << std::endl;
            passed = false;
        }
    }

    // 4. Registry Mapping Stability
    if (master_content.find("registry.modelers.get") == std::string::npos) {
        std::cerr << "Stability Violation: Master logic bypasses registry for model resolution." << std::endl;
        passed = false;
    }

    return passed ? 0 : 1;
}
