#include <iostream>
#include <vector>
#include <string>
#include <cstdlib>

/**
 * Sorrel Runner (No Persistent Binaries)
 * This tool compiles and runs cards on-the-fly to avoid binary bloating in the repo.
 */

int main() {
    std::vector<std::pair<std::string, std::string>> card_sources = {
        {"ArchitectureConsistency", "scripts/blender/movie/10/tests/sdd/cards/check_consistency.cpp"},
        {"HFStandards", "scripts/blender/movie/10/tests/sdd/cards/check_hf_standards.cpp"},
        {"DeepIntegrity", "scripts/blender/movie/10/tests/sdd/cards/card_deep_integrity.cpp"},
        {"FeatureLogic", "scripts/blender/movie/10/tests/sdd/cards/card_feature_logic.cpp"},
        {"BlenderAPI", "scripts/blender/movie/10/tests/sdd/cards/card_blender_api_integrity.cpp"}
    };

    std::cout << "Starting Thorough Sorrel Structural Analysis..." << std::endl;
    bool success = true;

    for (const auto& [name, source] : card_sources) {
        std::string compile_cmd = "g++ -O3 " + source + " -o temp_card";
        if (std::system(compile_cmd.c_str()) != 0) {
            std::cerr << "COMPILATION FAILURE: " << name << std::endl;
            success = false;
            continue;
        }

        std::cout << "\n[EX] " << name << ":" << std::endl;
        int run_result = std::system("./temp_card");
        if (run_result != 0) {
            std::cout << " -> VIOLATION DETECTED" << std::endl;
            success = false;
        } else {
            std::cout << " -> STABLE" << std::endl;
        }
        std::system("rm temp_card");
    }

    return success ? 0 : 1;
}
