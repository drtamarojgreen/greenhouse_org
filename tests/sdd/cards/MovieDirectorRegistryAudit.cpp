#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <filesystem>
#include <regex>
#include "../cpp/util/fact_utils.h"

namespace fs = std::filesystem;
using namespace Sorrel::Sdd::Util;

// @Card: movie_director_registry_audit
// @Results directors_found, registry_mentions

int main() {
    auto env = FactReader::readFacts("environment.facts");
    std::string base_dir = env.count("blender_movie_dir") ? env.at("blender_movie_dir") : "";

    if (base_dir.empty()) return 1;

    int directors_found = 0;
    int registry_mentions = 0;

    std::regex director_class_regex("class\\s+Director");
    std::regex registry_import_regex("from\\s+registry\\s+import");

    for (const auto& entry : fs::recursive_directory_iterator(base_dir)) {
        if (entry.is_regular_file() && entry.path().extension() == ".py") {
            std::ifstream file(entry.path());
            std::string content((std::istreambuf_iterator<char>(file)), std::istreambuf_iterator<char>());

            if (std::regex_search(content, director_class_regex)) {
                directors_found++;
            }
            if (std::regex_search(content, registry_import_regex)) {
                registry_mentions++;
            }
        }
    }

    std::cout << "directors_found = " << directors_found << std::endl;
    std::cout << "registry_mentions = " << registry_mentions << std::endl;

    return 0;
}
