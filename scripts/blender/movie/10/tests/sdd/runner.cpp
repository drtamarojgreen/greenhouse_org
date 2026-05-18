#include <iostream>
#include <vector>
#include <string>
#include <cstdlib>

/**
 * Movie 10 SDD Runner
 * Executes Cards and reports observability.
 */

int main() {
    std::vector<std::pair<std::string, std::string>> cards = {
        {"ArchitectureIntegrity", "./scripts/blender/movie/10/tests/sdd/cards/arch_check"},
        {"HFStandards", "./scripts/blender/movie/10/tests/sdd/cards/hf_check"}
    };

    std::cout << "--- Sorrel System Runner (Movie 10) ---" << std::endl;
    bool all_passed = true;

    for (const auto& [name, path] : cards) {
        int result = std::system(path.c_str());
        std::cout << "[" << (result == 0 ? "FACT" : "VIOLATION") << "] " << name << std::endl;
        if (result != 0) all_passed = false;
    }

    return all_passed ? 0 : 1;
}
