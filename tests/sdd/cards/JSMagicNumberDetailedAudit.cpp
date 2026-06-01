#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <filesystem>
#include <regex>
#include "../cpp/util/fact_utils.h"

namespace fs = std::filesystem;
using namespace Sorrel::Sdd::Util;

// @Card: js_magic_number_detailed_audit
// @Results files_checked, magic_number_violations, violation_details

int main() {
    auto env = FactReader::readFacts("environment.facts");
    std::vector<std::string> scan_dirs;
    if (env.count("js_source_dir")) scan_dirs.push_back(env.at("js_source_dir"));
    if (env.count("research_mesh_dir")) scan_dirs.push_back(env.at("research_mesh_dir"));
    if (env.count("blender_movie_dir")) scan_dirs.push_back(env.at("blender_movie_dir"));

    int files_checked = 0;
    std::vector<std::string> violations;
    std::regex magic_number_regex("=\\s*(42|123|999|0xDEADBEEF|0xCAFEBABE)\\b");

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
                    if (std::regex_search(line, magic_number_regex)) {
                        violations.push_back(entry.path().filename().string() + ":" + std::to_string(line_num));
                    }
                }
            }
        }
    }

    std::cout << "files_checked = " << files_checked << std::endl;
    std::cout << "magic_number_violations = " << violations.size() << std::endl;
    std::cout << "violation_details = ";
    for (size_t i = 0; i < violations.size(); ++i) {
        std::cout << violations[i] << (i == violations.size() - 1 ? "" : ", ");
    }
    std::cout << std::endl;

    return 0;
}
