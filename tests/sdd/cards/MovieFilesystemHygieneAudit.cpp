#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <filesystem>
#include <set>
#include <regex>
#include "../cpp/util/fact_utils.h"

namespace fs = std::filesystem;
using namespace Sorrel::Sdd::Util;

// @Card: movie_filesystem_hygiene_audit
// @Results files_scanned, inconsistent_naming_count, orphaned_files_count

int main() {
    auto env = FactReader::readFacts("environment.facts");
    auto quality = FactReader::readFacts("movie_quality.facts");
    std::string base_dir = env.count("blender_movie_dir") ? env.at("blender_movie_dir") : "";
    std::regex discouraged_regex(quality.count("discouraged_naming_pattern") ? quality.at("discouraged_naming_pattern") : "^(test_|temp_).*");

    if (base_dir.empty()) return 1;

    int files_scanned = 0;
    int naming_violations = 0;
    std::set<std::string> all_files;
    std::set<std::string> imported_files;

    for (const auto& entry : fs::recursive_directory_iterator(base_dir)) {
        if (entry.is_regular_file() && entry.path().extension() == ".py") {
            files_scanned++;
            std::string fname = entry.path().filename().string();
            std::string stem = entry.path().stem().string();
            all_files.insert(stem);

            if (std::regex_match(fname, discouraged_regex)) {
                naming_violations++;
            }

            // Check imports in this file
            std::ifstream file(entry.path());
            std::string line;
            std::regex import_regex("(?:import|from)\\s+([a-zA-Z0-9_]+)");
            while (std::getline(file, line)) {
                std::smatch match;
                if (std::regex_search(line, match, import_regex)) {
                    imported_files.insert(match[1].str());
                }
            }
        }
    }

    int orphaned = 0;
    for (const auto& stem : all_files) {
        if (imported_files.find(stem) == imported_files.end()) {
            // Ignore entry points and infrastructure
            if (stem == "master" || stem == "render" || stem == "director" || stem == "__init__") continue;
            orphaned++;
        }
    }

    std::cout << "files_scanned = " << files_scanned << std::endl;
    std::cout << "inconsistent_naming_count = " << naming_violations << std::endl;
    std::cout << "orphaned_files_count = " << orphaned << std::endl;

    return 0;
}
