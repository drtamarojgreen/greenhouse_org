#include <iostream>
#include <fstream>
#include <string>
#include <vector>

int main() {
    // Modelers check
    std::ifstream mod_file("scripts/blender/movie/10/modelers.py");
    std::string mod_content((std::istreambuf_iterator<char>(mod_file)), (std::istreambuf_iterator<char>()));

    // Riggers check
    std::ifstream rig_file("scripts/blender/movie/10/riggers.py");
    std::string rig_content((std::istreambuf_iterator<char>(rig_file)), (std::istreambuf_iterator<char>()));

    std::vector<std::string> mod_standards = {"Iris", "Pupil", "foliage", "limb_foliage_density"};
    std::vector<std::string> rig_standards = {"Lip", "Eyelid", "Ear"};

    bool all_passed = true;
    for (const auto& s : mod_standards) {
        if (mod_content.find(s) == std::string::npos) {
            std::cout << "[FAIL] Missing Modeler standard: " << s << std::endl;
            all_passed = false;
        } else {
            std::cout << "[PASS] Modeler standard found: " << s << std::endl;
        }
    }
    for (const auto& s : rig_standards) {
        if (rig_content.find(s) == std::string::npos) {
            std::cout << "[FAIL] Missing Rigger standard: " << s << std::endl;
            all_passed = false;
        } else {
            std::cout << "[PASS] Rigger standard found: " << s << std::endl;
        }
    }

    return all_passed ? 0 : 1;
}
