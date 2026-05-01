#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <map>
#include <regex>
#include "../cpp/util/fact_utils.h"
#include "../cpp/util/decorator.h"

using namespace Chai::Cdd::Util;

// @Card: empty_naming_convention
// @Requires empty_naming_compliance = true
// @Results empty_naming_compliance = true|false
void verify_empty_naming(const std::string& lc_path) {
    std::ifstream file(lc_path);
    bool all_ok = true;
    std::vector<std::string> failing;
    std::regex lower_case_regex("^[a-z][a-z0-9_]*$");

    if (!file.is_open()) {
        std::cerr << "[ERROR] Cannot open " << lc_path << std::endl;
        std::cout << "empty_naming_compliance = false" << std::endl;
        return;
    }

    std::string line;
    bool in_focal = false;
    while (std::getline(file, line)) {
        if (line.find("\"focal_targets\":") != std::string::npos) in_focal = true;
        if (in_focal && line.find("\"cameras\":") != std::string::npos) in_focal = false;
        if (in_focal && line.find("\"id\":") != std::string::npos) {
            size_t open = line.find('\"', line.find(':')) + 1;
            size_t close = line.find('\"', open);
            std::string id = line.substr(open, close - open);
            if (!std::regex_match(id, lower_case_regex)) {
                all_ok = false;
                failing.push_back(id);
            }
        }
    }

    if (!all_ok) {
        std::cerr << "[FAIL] Empties must be lower_case. Failing IDs: ";
        for (const auto& f : failing) std::cerr << "'" << f << "' ";
        std::cerr << std::endl;
    }
    std::cout << "empty_naming_compliance = " << (all_ok ? "true" : "false") << std::endl;
}

int main() {
    auto env   = FactReader::readFacts("environment.facts");
    auto facts = FactReader::readFacts("empty_naming.facts");
    if (!require_fact(facts, "empty_naming_compliance", "true")) return 1;
    verify_empty_naming(env.at("lights_camera_path"));
    return 0;
}
