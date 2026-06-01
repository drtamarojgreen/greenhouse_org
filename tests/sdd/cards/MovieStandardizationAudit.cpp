#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <filesystem>
#include <sstream>
#include "../cpp/util/fact_utils.h"

namespace fs = std::filesystem;
using namespace Sorrel::Sdd::Util;

// @Card: movie_standardization_audit
// @Results projects_scanned, compliance_score, missing_components

int main() {
    auto env = FactReader::readFacts("environment.facts");
    std::string base_dir = env.count("blender_movie_dir") ? env.at("blender_movie_dir") : "";
    std::string active_ids_raw = env.count("active_movie_projects") ? env.at("active_movie_projects") : "";
    std::string req_modules_raw = env.count("movie_required_modules") ? env.at("movie_required_modules") : "";

    if (base_dir.empty()) {
        std::cerr << "Error: blender_movie_dir not found in facts." << std::endl;
        return 1;
    }

    std::vector<std::string> active_ids;
    std::stringstream ss_ids(active_ids_raw);
    std::string id;
    while (std::getline(ss_ids, id, ',')) active_ids.push_back(id);

    std::vector<std::string> req_modules;
    std::stringstream ss_mod(req_modules_raw);
    std::string mod;
    while (std::getline(ss_mod, mod, ',')) req_modules.push_back(mod);

    int total_checks = active_ids.size() * req_modules.size();
    int passed_checks = 0;
    std::vector<std::string> missing;

    for (const auto& pid : active_ids) {
        fs::path p_path = fs::path(base_dir) / pid;
        if (!fs::exists(p_path)) {
            missing.push_back(pid + ":DIR_MISSING");
            continue;
        }

        for (const auto& m : req_modules) {
            if (fs::exists(p_path / m)) {
                passed_checks++;
            } else {
                missing.push_back(pid + ":" + m);
            }
        }
    }

    double score = total_checks > 0 ? (double)passed_checks / total_checks : 1.0;

    std::cout << "projects_scanned = " << active_ids.size() << std::endl;
    std::cout << "compliance_score = " << score << std::endl;
    std::cout << "missing_components = ";
    for (size_t i = 0; i < missing.size(); ++i) {
        std::cout << missing[i] << (i == missing.size() - 1 ? "" : ", ");
    }
    std::cout << std::endl;

    return 0;
}
