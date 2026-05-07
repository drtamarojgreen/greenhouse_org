#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <filesystem>
#include <regex>
#include "../cpp/util/fact_utils.h"
#include "../cpp/util/decorator.h"

namespace fs = std::filesystem;
using namespace Sorrel::Sdd::Util;

// @Card: js_naming_convention_audit
// @Results files_checked, naming_violation_count, naming_violations

int main() {
    auto env = FactReader::readFacts("environment.facts");
    auto facts = FactReader::readFacts("js_quality.facts");

    std::vector<std::pair<std::string, std::string>> scan_targets;

    if (env.count("genetic_js_dir")) {
        scan_targets.push_back({
            env.at("genetic_js_dir"),
            facts.count("global_object_pattern") ? facts.at("global_object_pattern") : "^GreenhouseGenetic[A-Z][a-zA-Z0-9]*$"
        });
    }
    if (env.count("models_js_dir")) {
        scan_targets.push_back({
            env.at("models_js_dir"),
            facts.count("models_global_pattern") ? facts.at("models_global_pattern") : "^GreenhouseModels[A-Z][a-zA-Z0-9]*$"
        });
    }

    std::regex const_global_regex("^\\s*const\\s+([A-Z][a-zA-Z0-9]*)\\s*=\\s*\\{");

    int files_checked = 0;
    std::vector<std::string> violations;

    for (const auto& target : scan_targets) {
        std::string js_dir = target.first;
        std::regex global_regex(target.second);

        if (!fs::exists(js_dir)) continue;

        for (const auto& entry : fs::directory_iterator(js_dir)) {
            if (entry.path().extension() == ".js") {
                files_checked++;
                std::ifstream file(entry.path());
                std::string line;
                while (std::getline(file, line)) {
                    std::smatch match;
                    if (std::regex_search(line, match, const_global_regex)) {
                        std::string name = match[1];
                        // If it starts with Greenhouse, it should match the pattern for this directory
                        if (name.find("Greenhouse") == 0 && !std::regex_match(name, global_regex)) {
                            violations.push_back(entry.path().filename().string() + ":" + name);
                        }
                    }
                }
            }
        }
    }

    std::cout << "files_checked = " << files_checked << std::endl;
    std::cout << "naming_violation_count = " << violations.size() << std::endl;
    std::cout << "naming_violations = "; for (const auto& v : violations) std::cout << v << " "; std::cout << std::endl;

    return 0;
}
