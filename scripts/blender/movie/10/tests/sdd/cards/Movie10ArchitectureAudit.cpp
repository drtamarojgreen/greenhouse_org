#include <iostream>
#include <fstream>
#include <sstream>
#include <string>
#include <vector>
#include <filesystem>
#include "../cpp/util/fact_utils.h"

using namespace Sorrel::Sdd::Util;

// @Card: movie10_architecture_audit
// @Results status, missing_files, missing_config_fields

bool check_file(const std::string& path) {
    return std::filesystem::exists(path);
}

int main() {
    auto arch_facts = FactReader::readFacts("movie10_architecture.facts");
    std::string root = arch_facts["movie10_root"];

    std::vector<std::string> required_files = {
        "master.py", "registry.py", "modelers.py", "riggers.py",
        "shaders.py", "movie_config.json", "movie_configuration.py", "components.py"
    };

    std::vector<std::string> missing_files;
    for (const auto& f : required_files) {
        if (!check_file(root + f)) missing_files.push_back(f);
    }

    // Manual string-based JSON Audit (no nlohmann)
    std::vector<std::string> missing_fields;
    std::ifstream config_file(root + "movie_config.json");
    if (config_file.is_open()) {
        std::string content((std::istreambuf_iterator<char>(config_file)), (std::istreambuf_iterator<char>()));

        std::vector<std::string> fields = {"production", "total_frames", "ensemble", "entities", "environment", "storyline"};
        for (const auto& f : fields) {
            if (content.find("\"" + f + "\"") == std::string::npos) {
                missing_fields.push_back(f);
            }
        }
    } else {
        missing_files.push_back("movie_config.json (READ_ERROR)");
    }

    bool success = missing_files.empty() && missing_fields.empty();

    std::cout << "status = " << (success ? "PASSED" : "FAILED") << std::endl;
    std::cout << "missing_files = "; for(auto& f : missing_files) std::cout << f << ","; std::cout << std::endl;
    std::cout << "missing_config_fields = "; for(auto& f : missing_fields) std::cout << f << ","; std::cout << std::endl;

    return success ? 0 : 1;
}
