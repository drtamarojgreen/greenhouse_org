#include <iostream>
#include <fstream>
#include <vector>
#include <string>
#include <filesystem>

/**
 * Card: ArchitectureIntegrity
 * Action: Verifies the existence of localized Movie 10 core files.
 * Output: Boolean success.
 */

int main() {
    std::vector<std::string> required = {"base.py", "registry.py", "modelers.py", "riggers.py", "shaders.py", "master.py"};
    std::string root = "scripts/blender/movie/10/";
    bool all_exist = true;

    for (const auto& file : required) {
        if (!std::filesystem::exists(root + file)) {
            std::cerr << "Fact Violation: Missing " << file << std::endl;
            all_exist = false;
        }
    }
    return all_exist ? 0 : 1;
}
