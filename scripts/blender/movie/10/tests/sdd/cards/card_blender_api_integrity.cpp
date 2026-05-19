#include <iostream>
#include <fstream>
#include <string>
#include <vector>

/**
 * Card: BlenderAPIIntegrity
 * Action: Ensures Python scripts use correct Blender 5.1 API calls and conventions.
 */

int main() {
    std::vector<std::string> scripts = {
        "scripts/blender/movie/10/modelers.py",
        "scripts/blender/movie/10/riggers.py",
        "scripts/blender/movie/10/shaders.py"
    };

    bool passed = true;
    for (const auto& script : scripts) {
        std::ifstream ifs(script);
        std::string content((std::istreambuf_iterator<char>(ifs)), (std::istreambuf_iterator<char>()));

        // Check for common correct API usage
        if (content.find("bpy.data.") == std::string::npos) {
            std::cerr << "API Error: No bpy.data references in " << script << std::endl;
            passed = false;
        }
        if (script.find("riggers.py") != std::string::npos && content.find("mode_set(mode='EDIT')") == std::string::npos) {
             std::cerr << "Convention Error: Rigger does not use EDIT mode for bone creation in " << script << std::endl;
             passed = false;
        }
    }

    return passed ? 0 : 1;
}
