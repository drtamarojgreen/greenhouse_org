#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include "../cpp/util/fact_utils.h"

using namespace Sorrel::Sdd::Util;

// @Card: storyline_beats_audit
// @Requires storyline_check_enabled = true
// @Results joy_found, blessing_found, ascent_found, outro_found

int main() {
    auto env = FactReader::readFacts("environment.facts");
    std::string config_path = env.count("config_path") ? env.at("config_path") : "../../movie_config.json";
    std::ifstream file(config_path);
    if (!file.is_open()) { std::cerr << "[ERROR] Cannot open " << config_path << std::endl; return 1; }

    bool joy = false, blessing = false, ascent = false, outro = false;
    std::string line;
    while (std::getline(file, line)) {
        if (line.find("\"beat\": \"Rite of Joy\"") != std::string::npos) joy = true;
        if (line.find("\"beat\": \"Blessing\"") != std::string::npos) blessing = true;
        if (line.find("\"beat\": \"Final Ascent\"") != std::string::npos) ascent = true;
        if (line.find("\"beat\": \"Outro Gather\"") != std::string::npos) outro = true;
    }

    std::cout << "joy_found = " << (joy ? "true" : "false") << std::endl;
    std::cout << "blessing_found = " << (blessing ? "true" : "false") << std::endl;
    std::cout << "ascent_found = " << (ascent ? "true" : "false") << std::endl;
    std::cout << "outro_found = " << (outro ? "true" : "false") << std::endl;

    return (joy && blessing && ascent && outro) ? 0 : 1;
}
