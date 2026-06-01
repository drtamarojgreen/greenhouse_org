#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <filesystem>
#include <regex>
#include "../cpp/util/fact_utils.h"

namespace fs = std::filesystem;
using namespace Sorrel::Sdd::Util;

// @Card: movie_source_quality_audit
// @Results hardcoded_values, casing_inconsistencies, bloated_files

int main() {
    auto env = FactReader::readFacts("environment.facts");
    auto quality = FactReader::readFacts("movie_quality.facts");
    std::string base_dir = env.count("blender_movie_dir") ? env.at("blender_movie_dir") : "";
    int max_lines = quality.count("max_file_lines") ? std::stoi(quality.at("max_file_lines")) : 500;

    if (base_dir.empty()) return 1;

    int hardcoded_count = 0;
    int casing_issues = 0;
    int bloated_count = 0;

    // Hardcoded numeric constants (excluding indices and small increments)
    std::regex hardcoded_regex("=\\s*([0-9]{2,}|[0-9]+\\.[0-9]+)");
    // Casing: mixed snake_case and camelCase variables (heuristic)
    std::regex snake_camel_regex("\\b([a-z]+[A-Z][a-z]+.*=.*_.*|.*_.*=.*[a-z]+[A-Z][a-z]+)\\b");

    for (const auto& entry : fs::recursive_directory_iterator(base_dir)) {
        if (entry.is_regular_file() && entry.path().extension() == ".py") {
            std::ifstream file(entry.path());
            std::string line;
            int line_num = 0;
            bool has_snake = false;
            bool has_camel = false;

            while (std::getline(file, line)) {
                line_num++;
                if (line.find("#") != std::string::npos) continue;

                if (std::regex_search(line, hardcoded_regex)) hardcoded_count++;
                if (std::regex_search(line, snake_camel_regex)) casing_issues++;
            }
            if (line_num > max_lines) bloated_count++;
        }
    }

    std::cout << "hardcoded_values = " << hardcoded_count << std::endl;
    std::cout << "casing_inconsistencies = " << casing_issues << std::endl;
    std::cout << "bloated_files = " << bloated_count << std::endl;

    return 0;
}
