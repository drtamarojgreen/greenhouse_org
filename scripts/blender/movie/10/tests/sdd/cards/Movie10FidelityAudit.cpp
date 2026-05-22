#include <iostream>
#include <fstream>
#include <sstream>
#include <string>
#include <vector>
#include <set>
#include <regex>
#include "../cpp/util/fact_utils.h"
#include "../cpp/util/decorator.h"

using namespace Sorrel::Sdd::Util;

// @Card: movie10_fidelity_audit
// @Results missing_standards, foliage_check, status

int main() {
    auto arch_facts = FactReader::readFacts("movie10_architecture.facts");
    auto hf_facts = FactReader::readFacts("movie10_fidelity.facts");

    std::string root = arch_facts["movie10_root"];
    std::vector<std::string> missing;

    // Check Modeler Logic
    std::ifstream mod_file(root + "modelers.py");
    std::string mod_content((std::istreambuf_iterator<char>(mod_file)), (std::istreambuf_iterator<char>()));
    std::stringstream ssm(hf_facts["modeling_standards"]);
    std::string std_str;
    while (std::getline(ssm, std_str, ',')) {
        if (mod_content.find(std_str) == std::string::npos) missing.push_back(std_str);
    }

    // Check Rigger Logic
    std::ifstream rig_file(root + "riggers.py");
    std::string rig_content((std::istreambuf_iterator<char>(rig_file)), (std::istreambuf_iterator<char>()));
    std::stringstream ssr(hf_facts["rigging_standards"]);
    while (std::getline(ssr, std_str, ',')) {
        if (rig_content.find(std_str) == std::string::npos) missing.push_back(std_str);
    }

    // Check Foliage Density
    bool foliage_ok = false;
    std::ifstream plant_json(root + "modeling/plant.json");
    if (plant_json.is_open()) {
        std::string json_content((std::istreambuf_iterator<char>(plant_json)), (std::istreambuf_iterator<char>()));
        std::regex foliage_reg("\"limb_foliage_density\":\\s*([1-9][0-9]|[6-9])");
        if (std::regex_search(json_content, foliage_reg)) foliage_ok = true;
    }

    std::cout << "status = " << (missing.empty() && foliage_ok ? "PASSED" : "FAILED") << std::endl;
    std::cout << "missing_standards = "; for (const auto& m : missing) std::cout << m << " "; std::cout << std::endl;
    std::cout << "foliage_check = " << (foliage_ok ? "OK" : "INSUFFICIENT") << std::endl;

    return (missing.empty() && foliage_ok) ? 0 : 1;
}
