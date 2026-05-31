#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <filesystem>
#include <regex>
#include "../cpp/util/fact_utils.h"

namespace fs = std::filesystem;
using namespace Sorrel::Sdd::Util;

// @Card: js_raw_pattern_detailed_audit
// @Results files_checked, raw_pattern_violations, violation_details

int main() {
    auto env = FactReader::readFacts("environment.facts");
    std::vector<std::string> scan_dirs;
    if (env.count("js_source_dir")) scan_dirs.push_back(env.at("js_source_dir"));
    if (env.count("research_mesh_dir")) scan_dirs.push_back(env.at("research_mesh_dir"));
    if (env.count("blender_movie_dir")) scan_dirs.push_back(env.at("blender_movie_dir"));

    int files_checked = 0;
    std::vector<std::string> violations;
    // Look for 'new' and 'delete' patterns, but focus on object creation/manual management
    std::regex raw_regex("\\b(new\\s+[^\\(;]+|delete\\s+[^;]+)\\b");

    for (const auto& dir : scan_dirs) {
        if (!fs::exists(dir)) continue;

        for (const auto& entry : fs::recursive_directory_iterator(dir)) {
            if (entry.is_regular_file() && (entry.path().extension() == ".js" || entry.path().extension() == ".py")) {
                files_checked++;
                std::ifstream file(entry.path());
                std::string line;
                int line_num = 0;

                while (std::getline(file, line)) {
                    line_num++;
                    // Exclude comments to reduce noise in Python/JS
                    if (line.find("//") != std::string::npos || line.find("#") != std::string::npos) continue;

                    if (std::regex_search(line, raw_regex)) {
                        // Filter out common acceptable 'new' uses in JS like 'new Error' or 'new Date'
                        if (line.find("new Error") != std::string::npos || line.find("new Date") != std::string::npos) continue;

                        violations.push_back(entry.path().filename().string() + ":" + std::to_string(line_num));
                    }
                }
            }
        }
    }

    std::cout << "files_checked = " << files_checked << std::endl;
    std::cout << "raw_pattern_violations = " << violations.size() << std::endl;
    std::cout << "violation_details = ";
    for (size_t i = 0; i < violations.size(); ++i) {
        std::cout << violations[i] << (i == violations.size() - 1 ? "" : ", ");
        if (i > 100) { std::cout << "... (truncated)"; break; }
    }
    std::cout << std::endl;

    return 0;
}
