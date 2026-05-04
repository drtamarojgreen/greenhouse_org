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
// @Requires genetic_ui_methods_valid = true
// @Requires required_methods = <comma-separated list>
// @Results found_methods, missing_methods, genetic_ui_methods_valid

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
    if (!require_fact(facts, "genetic_ui_methods_valid", "true")) return 1;

    std::string js_dir = env.count("genetic_js_dir") ? env.at("genetic_js_dir") : "docs/js/genetic/";
    std::string file_path = js_dir + "genetic_ui_3d.js";
    std::ifstream file(file_path);
    if (!file.is_open()) { std::cerr << "[ERROR] Cannot open " << file_path << std::endl; return 1; }

    std::set<std::string> required;
    if (facts.count("required_methods")) required = parse_required_methods(facts.at("required_methods"));

    std::set<std::string> found;
    std::string line;

    while (std::getline(file, line)) {
        for (const auto& method : required) {
            // Simple search for method definition like "init(container, algo" or "render() {"
            if (line.find(method + "(") != std::string::npos || line.find(method + ":") != std::string::npos) {
                found.insert(method);
            }
        }
    }

    std::vector<std::string> missing;
    for (const auto& method : required) {
        if (found.find(method) == found.end()) {
            missing.push_back(method);
            std::cerr << "[FAIL] Missing required method: '" << method << "'" << std::endl;
        }
    }

    bool valid = missing.empty();
    std::cout << "found_methods_count = " << found.size() << std::endl;
    std::cout << "missing_methods_count = " << missing.size() << std::endl;
    if (!missing.empty()) {
        std::cout << "missing_methods = ";
        for (const auto& m : missing) std::cout << m << " ";
        std::cout << std::endl;
    }
    std::cout << "genetic_ui_methods_valid = " << (valid ? "true" : "false") << std::endl;

    return valid ? 0 : 1;
}
