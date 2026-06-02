#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <filesystem>
#include <regex>
#include "../cpp/util/fact_utils.h"

namespace fs = std::filesystem;
using namespace Sorrel::Sdd::Util;

// @Card: movie_blender_logic_audit
// @Results files_audited, ops_usage_count, mathutils_presence_ratio

int main() {
    auto env = FactReader::readFacts("environment.facts");
    std::string base_dir = env.count("blender_movie_dir") ? env.at("blender_movie_dir") : "";

    if (base_dir.empty()) return 1;

    int files_audited = 0;
    int ops_count = 0;
    int mathutils_count = 0;

    std::regex ops_regex("bpy\\.ops\\.");
    std::regex mathutils_regex("import\\s+mathutils|from\\s+mathutils");

    for (const auto& entry : fs::recursive_directory_iterator(base_dir)) {
        if (entry.is_regular_file() && entry.path().extension() == ".py") {
            files_audited++;
            std::ifstream file(entry.path());
            std::string content((std::istreambuf_iterator<char>(file)), std::istreambuf_iterator<char>());

            auto ops_begin = std::sregex_iterator(content.begin(), content.end(), ops_regex);
            auto ops_end = std::sregex_iterator();
            ops_count += std::distance(ops_begin, ops_end);

            if (std::regex_search(content, mathutils_regex)) {
                mathutils_count++;
            }
        }
    }

    double math_ratio = files_audited > 0 ? (double)mathutils_count / files_audited : 0.0;

    std::cout << "files_audited = " << files_audited << std::endl;
    std::cout << "ops_usage_count = " << ops_count << std::endl;
    std::cout << "mathutils_presence_ratio = " << math_ratio << std::endl;

    return 0;
}
