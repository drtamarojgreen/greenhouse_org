#include <iostream>
#include <fstream>
#include <string>
#include <filesystem>
#include <vector>

int main() {
    std::string root = "scripts/blender/movie/10/";
    std::vector<std::string> files = {"base.py", "registry.py", "modelers.py", "riggers.py", "shaders.py", "master.py"};

    bool all_exist = true;
    for (const auto& f : files) {
        if (!std::filesystem::exists(root + f)) {
            std::cout << "[FAIL] Missing file: " << f << std::endl;
            all_exist = false;
        } else {
            std::cout << "[PASS] File exists: " << f << std::endl;
        }
    }

    std::ifstream master(root + "master.py");
    std::string line;
    bool uses_local_registry = false;
    while (std::getline(master, line)) {
        if (line.find("from .registry import registry") != std::string::npos) {
            uses_local_registry = true;
            break;
        }
    }

    if (!uses_local_registry) {
        std::cout << "[FAIL] master.py does not use localized registry" << std::endl;
        all_exist = false;
    } else {
        std::cout << "[PASS] master.py uses localized registry" << std::endl;
    }

    return all_exist ? 0 : 1;
}
