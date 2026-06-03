#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <filesystem>
#include <algorithm>
#include "../cpp/util/fact_utils.h"
#include "../cpp/util/decorator.h"

namespace fs = std::filesystem;
using namespace Sorrel::Sdd::Util;

// @Card: config_spec_audit
// @Results config_audited, clinical_keys_found, config_passed

int main() {
    auto env = FactReader::readFacts("environment.facts");
    auto spec = FactReader::readFacts("pipeline_spec.facts");

    // Decorator-gate enforcement
    if (!require_fact(spec, "allow_hardcoded_guidelines", "false")) {
        std::cerr << "[DECORATOR REJECT] allow_hardcoded_guidelines is not false. Aborting." << std::endl;
        return 1;
    }

    std::string config_path = "config.yaml";
    if (env.count("config_file_path")) {
        config_path = env.at("config_file_path");
    }

    int clinical_keys_found = 0;
    bool config_audited = false;

    if (fs::exists(config_path)) {
        config_audited = true;
        std::ifstream file(config_path);
        std::string line;
        
        std::vector<std::string> prohibited_keys = {
            "peicot_schema:",
            "population:",
            "exposures:",
            "interventions:",
            "comparators:",
            "outcomes:",
            "confounder_catalog:",
            "sleep:",
            "anxiety:",
            "depression:",
            "trauma:",
            "ses:",
            "medication:"
        };

        int line_num = 0;
        while (std::getline(file, line)) {
            line_num++;
            std::string trimmed = trim(line);
            if (trimmed.empty() || trimmed[0] == '#') continue;

            std::string lower_line = trimmed;
            std::transform(lower_line.begin(), lower_line.end(), lower_line.begin(), ::tolower);

            for (const auto& key : prohibited_keys) {
                if (lower_line.find(key) != std::string::npos) {
                    std::cerr << "[COMPLIANCE VIOLATION] Prohibited clinical configuration category found: " 
                              << config_path << ":" << line_num << " -> '" << key << "'" << std::endl;
                    clinical_keys_found++;
                }
            }
        }
    } else {
        std::cerr << "[ERROR] Configuration file not found at path: " << config_path << std::endl;
    }

    bool config_passed = (clinical_keys_found == 0 && config_audited);

    std::cout << "config_audited = " << (config_audited ? "true" : "false") << std::endl;
    std::cout << "clinical_keys_found = " << clinical_keys_found << std::endl;
    std::cout << "config_passed = " << (config_passed ? "true" : "false") << std::endl;

    return config_passed ? 0 : 1;
}
