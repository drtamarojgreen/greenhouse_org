#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <filesystem>
#include <algorithm>
#include "../cpp/util/fact_utils.h"

namespace fs = std::filesystem;
using namespace Sorrel::Sdd::Util;

// @Card: v12_config_audit
// @Results configs_found, valid_configs, total_records_mapped

int main() {
    auto env = FactReader::readFacts("v12.facts");
    std::string v12_root = env.count("v12_root") ? env.at("v12_root") : "scripts/research/mesh/v12";
    fs::path config_dir = fs::path(v12_root) / "configurations";

    int configs_found = 0;
    int valid_configs = 0;

    if (!fs::exists(config_dir)) {
        std::cerr << "Config directory not found: " << config_dir << std::endl;
        return 1;
    }

    std::vector<std::string> required_keys = {
        "experiment_name:",
        "data_collection:",
        "preprocessing:",
        "analysis:",
        "results:"
    };

    for (const auto& entry : fs::directory_iterator(config_dir)) {
        if (entry.path().extension() == ".yaml") {
            configs_found++;
            std::ifstream file(entry.path());
            std::string line;
            int keys_found = 0;
            std::vector<bool> found_mask(required_keys.size(), false);

            while (std::getline(file, line)) {
                for (size_t i = 0; i < required_keys.size(); ++i) {
                    if (line.find(required_keys[i]) != std::string::npos) {
                        found_mask[i] = true;
                    }
                }
            }

            bool is_valid = true;
            for (bool b : found_mask) if (!b) is_valid = false;

            if (is_valid) {
                valid_configs++;
            } else {
                std::cout << "Invalid config structure: " << entry.path() << std::endl;
            }
        }
    }

    std::cout << "configs_found = " << configs_found << std::endl;
    std::cout << "valid_configs = " << valid_configs << std::endl;

    return 0;
}
