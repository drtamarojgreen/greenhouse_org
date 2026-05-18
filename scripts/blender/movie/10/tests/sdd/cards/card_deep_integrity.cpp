#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <regex>
#include <map>

/**
 * Card: DeepIntegrity
 * Action: Performs deep structural analysis of Python modules and JSON configurations.
 */

bool validate_json_field(const std::string& content, const std::string& field) {
    return content.find("\"" + field + "\"") != std::string::npos;
}

bool check_python_module(const std::string& path, const std::string& class_name, const std::vector<std::string>& methods) {
    std::ifstream file(path);
    if (!file.is_open()) return false;
    std::string content((std::istreambuf_iterator<char>(file)), (std::istreambuf_iterator<char>()));

    // Check Class and Localized Inheritance
    std::regex class_reg("class\\s+" + class_name + "\\((Modeler|Rigger|Shader)\\):");
    if (!std::regex_search(content, class_reg)) {
        std::cerr << "Integrity Error: Class " << class_name << " invalid or missing localized inheritance in " << path << std::endl;
        return false;
    }

    // Check Methods
    for (const auto& method : methods) {
        if (content.find("def " + method) == std::string::npos) {
            std::cerr << "Integrity Error: Missing method " << method << " in " << path << std::endl;
            return false;
        }
    }
    return true;
}

int main() {
    bool stability = true;

    // 1. Module Integrity
    if (!check_python_module("scripts/blender/movie/10/modelers.py", "PlantModeler", {"build_mesh", "_add_organic_part"})) stability = false;
    if (!check_python_module("scripts/blender/movie/10/riggers.py", "PlantRigger", {"build_rig"})) stability = false;
    if (!check_python_module("scripts/blender/movie/10/shaders.py", "UniversalShader", {"apply_materials", "_create_material"})) stability = false;

    // 2. JSON Integrity (Deep Field Check)
    std::ifstream p_file("scripts/blender/movie/10/modeling/plant.json");
    std::string p_json((std::istreambuf_iterator<char>(p_file)), (std::istreambuf_iterator<char>()));
    std::vector<std::string> p_fields = {"proportions", "torso_h", "head_r", "neck_h", "limbs", "foliage", "head_count", "limb_foliage_density", "modifiers"};
    for (const auto& f : p_fields) {
        if (!validate_json_field(p_json, f)) {
            std::cerr << "Stability Error: Missing JSON field '" << f << "' in plant.json" << std::endl;
            stability = false;
        }
    }

    std::ifstream c_file("scripts/blender/movie/10/movie_config.json");
    std::string c_json((std::istreambuf_iterator<char>(c_file)), (std::istreambuf_iterator<char>()));
    std::vector<std::string> c_fields = {"production", "title", "total_frames", "paths", "output_dir", "ensemble", "entities", "is_protagonist", "storyline", "beat", "events"};
    for (const auto& f : c_fields) {
        if (!validate_json_field(c_json, f)) {
            std::cerr << "Stability Error: Missing JSON field '" << f << "' in movie_config.json" << std::endl;
            stability = false;
        }
    }

    return stability ? 0 : 1;
}
