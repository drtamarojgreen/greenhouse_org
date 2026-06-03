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

// @Card: json_naming_spec_audit
// @Results files_scanned, camel_case_violations, json_passed

int main() {
    auto env = FactReader::readFacts("environment.facts");
    auto spec = FactReader::readFacts("pipeline_spec.facts");

    if (!require_fact(spec, "enforce_zero_stubs", "true")) {
        std::cerr << "[DECORATOR REJECT] enforce_zero_stubs is not true. Aborting." << std::endl;
        return 1;
    }

    std::string root_dir = ".";
    if (env.count("v10_root_dir")) {
        root_dir = env.at("v10_root_dir");
    }

    std::vector<std::string> sub_dirs = {
        "core", "advocacy", "education", "roadmapping", "cross_version"
    };

    int files_scanned = 0;
    int camel_case_violations = 0;

    // Matches dict brackets with camelCase string literals, e.g. s["camelCaseWord"]
    // Checks for uppercase letters inside single/double quotes within square brackets or get()
    std::regex dict_camel_regex("\\[\\s*['\"]([a-z]+[A-Z][a-zA-Z0-9]*)['\"]\\s*\\]");
    std::regex get_camel_regex("\\.get\\(\\s*['\"]([a-z]+[A-Z][a-zA-Z0-9]*)['\"]");

    for (const auto& sub : sub_dirs) {
        fs::path target_path = fs::path(root_dir) / sub;
        if (!fs::exists(target_path)) continue;

        for (const auto& entry : fs::recursive_directory_iterator(target_path)) {
            if (entry.path().extension() == ".py") {
                files_scanned++;
                std::ifstream file(entry.path());
                if (!file.is_open()) continue;

                std::string line;
                int line_num = 0;
                while (std::getline(file, line)) {
                    line_num++;
                    std::string uncommented = strip_python_comments(line);
                    std::smatch match;
                    
                    if (std::regex_search(uncommented, match, dict_camel_regex)) {
                        std::cerr << "[NAMING CONVENTION VIOLATION] camelCase dictionary key access found in: "
                                  << entry.path().filename().string() << ":" << line_num 
                                  << " -> '" << match[1] << "' (Expected snake_case)" << std::endl;
                        camel_case_violations++;
                    }

                    if (std::regex_search(uncommented, match, get_camel_regex)) {
                        std::cerr << "[NAMING CONVENTION VIOLATION] camelCase .get() key access found in: "
                                  << entry.path().filename().string() << ":" << line_num 
                                  << " -> '" << match[1] << "' (Expected snake_case)" << std::endl;
                        camel_case_violations++;
                    }
                }
            }
        }
    }

    bool json_passed = (camel_case_violations == 0);

    std::cout << "files_scanned = " << files_scanned << std::endl;
    std::cout << "camel_case_violations = " << camel_case_violations << std::endl;
    std::cout << "json_passed = " << (json_passed ? "true" : "false") << std::endl;

    return json_passed ? 0 : 1;
}
