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
    auto facts = FactReader::readFacts("js_quality.facts");
    auto env = FactReader::readFacts("environment.facts");

    std::string js_dir = env.count("genetic_js_dir") ? env.at("genetic_js_dir") : "docs/js/genetic/";
    std::string global_pattern = facts.count("global_object_pattern") ? facts.at("global_object_pattern") : "^GreenhouseGenetic[A-Z].*$";

    std::regex global_regex(global_pattern);
    std::regex const_global_regex("^\\s*const\\s+([A-Z][a-zA-Z0-9]*)\\s*=\\s*\\{");

    int files_checked = 0;
    std::vector<std::string> violations;

    for (const auto& entry : fs::directory_iterator(js_dir)) {
        if (entry.path().extension() == ".js") {
            files_checked++;
            std::ifstream file(entry.path());
            std::string line;
            while (std::getline(file, line)) {
                std::smatch match;
                if (std::regex_search(line, match, const_global_regex)) {
                    std::string name = match[1];
                    if (name.find("Greenhouse") != std::string::npos && !std::regex_match(name, global_regex)) {
                        violations.push_back(entry.path().filename().string() + ":" + name);
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
