#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <map>
#include <regex>
#include "../cpp/util/fact_utils.h"
#include "../cpp/util/decorator.h"

using namespace Chai::Cdd::Util;

// @Card: backdrop_naming_audit
// @Requires backdrop_naming_compliance = true
// @Results backdrop_count, backdrop_naming_compliance
int main() {
    auto env   = FactReader::readFacts("environment.facts");
    auto facts = FactReader::readFacts("backdrop_naming.facts");
    if (!require_fact(facts, "backdrop_naming_compliance", "true")) return 1;

    std::string config_path = env.count("config_path") ? env.at("config_path") : "../../movie_config.json";
    std::ifstream file(config_path);
    if (!file.is_open()) {
        std::cerr << "[ERROR] Cannot open " << config_path << std::endl;
        std::cout << "backdrop_naming_compliance = false" << std::endl;
        return 1;
    }

    std::regex lower_case_regex("^[a-z][a-z0-9_]*$");
    std::vector<std::string> failing;
    int backdrop_count = 0;
    bool in_chroma = false, in_walls = false;
    std::string line;

    while (std::getline(file, line)) {
        if (line.find("\"chroma\":") != std::string::npos) in_chroma = true;
        if (in_chroma && line.find("\"walls\":") != std::string::npos) in_walls = true;
        if (in_walls && line.find("]") != std::string::npos) { in_walls = false; in_chroma = false; }
        if (in_walls && line.find("\"id\":") != std::string::npos) {
            size_t open = line.find('\"', line.find(':')) + 1;
            size_t close = line.find('\"', open);
            std::string id = line.substr(open, close - open);
            backdrop_count++;
            if (!std::regex_match(id, lower_case_regex)) {
                failing.push_back(id);
                std::cerr << "[FAIL] Backdrop '" << id << "' does not follow lower_case." << std::endl;
            }
        }
    }

    bool ok = failing.empty();
    std::cout << "backdrop_count = " << backdrop_count << std::endl;
    std::cout << "backdrop_naming_compliance = " << (ok ? "true" : "false") << std::endl;
    return ok ? 0 : 1;
}
