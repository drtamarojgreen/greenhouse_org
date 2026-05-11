#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <regex>
#include "../cpp/util/fact_utils.h"
#include "../cpp/util/decorator.h"

using namespace Sorrel::Sdd::Util;

// @Card: water_can_spout_audit
// @Requires water_can_spout_required = true
// @Results spout_found

int main() {
    auto env = FactReader::readFacts("environment.facts");
    auto facts = FactReader::readFacts("required_fields.facts");
    if (!require_fact(facts, "water_can_spout_required", "true")) return 1;

    std::string config_path = env.count("config_path") ? env.at("config_path") : "../../movie_config.json";
    std::ifstream file(config_path);
    if (!file.is_open()) { std::cerr << "[ERROR] Cannot open " << config_path << std::endl; return 1; }

    std::string line;
    bool in_watercan = false;
    bool spout_found = false;
    int brace_count = 0;

    while (std::getline(file, line)) {
        if (line.find("\"id\": \"WaterCan\"") != std::string::npos) {
            in_watercan = true;
            brace_count = 0;
        }
        if (in_watercan) {
            for (char c : line) {
                if (c == '{') brace_count++;
                if (c == '}') brace_count--;
            }
            if (line.find("\"name\": \"Spout\"") != std::string::npos) {
                spout_found = true;
            }
            if (brace_count < 0) in_watercan = false;
        }
    }

    std::cout << "spout_found = " << (spout_found ? "true" : "false") << std::endl;
    return spout_found ? 0 : 1;
}
