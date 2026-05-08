#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include "../cpp/util/fact_utils.h"

using namespace Sorrel::Sdd::Util;

// @Card: environment_features_audit
// @Requires features_check_enabled = true
// @Results torches_found, lavender_found, statues_found, fog_found

int main() {
    auto env = FactReader::readFacts("environment.facts");
    std::string config_path = env.count("config_path") ? env.at("config_path") : "../../movie_config.json";
    std::ifstream file(config_path);
    if (!file.is_open()) { std::cerr << "[ERROR] Cannot open " << config_path << std::endl; return 1; }

    bool torches = false, lavender = false, statues = false, fog = false;
    std::string line;
    while (std::getline(file, line)) {
        if (line.find("\"torches\":") != std::string::npos) torches = true;
        if (line.find("\"lavender\":") != std::string::npos) lavender = true;
        if (line.find("\"pillars\":") != std::string::npos && line.find("\"height\": null") != std::string::npos) statues = true; // Placeholder for complex pillars/statues
        if (line.find("\"fog\":") != std::string::npos) fog = true;
    }

    std::cout << "torches_found = " << (torches ? "true" : "false") << std::endl;
    std::cout << "lavender_found = " << (lavender ? "true" : "false") << std::endl;
    std::cout << "statues_found = " << (statues ? "true" : "false") << std::endl;
    std::cout << "fog_found = " << (fog ? "true" : "false") << std::endl;

    return (torches && lavender && fog) ? 0 : 1;
}
