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

// @Card: movie_config_hygiene_audit
// @Results config_keys_defined, config_keys_referenced, unused_keys_count

int main() {
    auto env = FactReader::readFacts("environment.facts");
    auto quality = FactReader::readFacts("movie_quality.facts");
    std::string base_dir = env.count("blender_movie_dir") ? env.at("blender_movie_dir") : "";
    std::string prefix = quality.count("config_reference_prefix") ? quality.at("config_reference_prefix") : "mc.get";

    if (base_dir.empty()) return 1;

    std::set<std::string> defined_keys;
    std::set<std::string> referenced_keys;

    // 1. Discover defined keys in movie_config.json
    for (const auto& entry : fs::recursive_directory_iterator(base_dir)) {
        if (entry.is_regular_file() && entry.path().filename() == "movie_config.json") {
            std::ifstream file(entry.path());
            std::string line;
            std::regex key_regex("\"([a-zA-Z0-9_]+)\":");
            while (std::getline(file, line)) {
                auto keys_begin = std::sregex_iterator(line.begin(), line.end(), key_regex);
                auto keys_end = std::sregex_iterator();
                for (std::sregex_iterator i = keys_begin; i != keys_end; ++i) {
                    defined_keys.insert((*i)[1].str());
                }
            }
        }
    }

    // 2. Discover referenced keys in source
    std::regex ref_regex(prefix + "\\(\"([a-zA-Z0-9_\\.]+)\"");
    for (const auto& entry : fs::recursive_directory_iterator(base_dir)) {
        if (entry.is_regular_file() && entry.path().extension() == ".py") {
            std::ifstream file(entry.path());
            std::string line;
            while (std::getline(file, line)) {
                auto refs_begin = std::sregex_iterator(line.begin(), line.end(), ref_regex);
                auto refs_end = std::sregex_iterator();
                for (std::sregex_iterator i = refs_begin; i != refs_end; ++i) {
                    std::string full_ref = (*i)[1].str();
                    size_t last_dot = full_ref.find_last_of('.');
                    std::string leaf = (last_dot == std::string::npos) ? full_ref : full_ref.substr(last_dot + 1);
                    referenced_keys.insert(leaf);
                }
            }
        }
    }

    int unused = 0;
    for (const auto& key : defined_keys) {
        if (referenced_keys.find(key) == referenced_keys.end()) {
            // Ignore top-level sections
            if (key == "production" || key == "paths" || key == "ensemble" || key == "environment") continue;
            unused++;
        }
    }

    std::cout << "config_keys_defined = " << defined_keys.size() << std::endl;
    std::cout << "config_keys_referenced = " << referenced_keys.size() << std::endl;
    std::cout << "unused_keys_count = " << unused << std::endl;

    return 0;
}
