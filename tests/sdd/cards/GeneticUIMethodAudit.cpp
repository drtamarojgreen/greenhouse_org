#include <iostream>
#include <fstream>
#include <sstream>
#include <string>
#include <vector>
#include <set>
#include "../cpp/util/fact_utils.h"
#include "../cpp/util/decorator.h"

using namespace Sorrel::Sdd::Util;

// @Card: genetic_ui_method_audit
// @Results found_methods, missing_methods, found_count, missing_count

std::set<std::string> parse_required_methods(const std::string& raw) {
    std::set<std::string> methods;
    std::stringstream ss(raw);
    std::string token;
    while (std::getline(ss, token, ',')) methods.insert(trim(token));
    return methods;
}

int main() {
    auto env   = FactReader::readFacts("environment.facts");
    auto facts = FactReader::readFacts("genetic_ui.facts");

    if (env.count("genetic_ui_target_file") == 0) { std::cerr << "error = fact missing genetic_ui_target_file" << std::endl; return 1; }

    std::string file_path = env.at("genetic_ui_target_file");
    std::ifstream file(file_path);
    if (!file.is_open()) { std::cerr << "error = cannot open " << file_path << std::endl; return 1; }

    std::set<std::string> required;
    if (facts.count("required_methods")) required = parse_required_methods(facts.at("required_methods"));

    std::set<std::string> found;
    std::string line;

    while (std::getline(file, line)) {
        for (const auto& method : required) {
            if (line.find(method + "(") != std::string::npos || line.find(method + ":") != std::string::npos) {
                found.insert(method);
            }
        }
    }

    std::vector<std::string> missing;
    for (const auto& method : required) {
        if (found.find(method) == found.end()) {
            missing.push_back(method);
        }
    }

    std::cout << "found_count = " << found.size() << std::endl;
    std::cout << "found_methods = "; for (const auto& m : found) std::cout << m << " "; std::cout << std::endl;
    std::cout << "missing_count = " << missing.size() << std::endl;
    std::cout << "missing_methods = "; for (const auto& m : missing) std::cout << m << " "; std::cout << std::endl;

    return 0;
}
