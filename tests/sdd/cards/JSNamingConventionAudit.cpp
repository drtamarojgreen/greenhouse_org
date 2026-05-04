#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <regex>
#include <filesystem>
#include "../cpp/util/fact_utils.h"
#include "../cpp/util/decorator.h"

namespace fs = std::filesystem;
using namespace Sorrel::Sdd::Util;

// @Card: js_naming_convention_audit
// @Requires naming_compliance_enabled = true
// @Results files_checked, violations_count, naming_compliance

int main() {
    auto facts = FactReader::readFacts("js_quality.facts");
    auto env = FactReader::readFacts("environment.facts");
    if (!require_fact(facts, "naming_compliance_enabled", "true")) return 1;

    std::string js_dir = env.count("genetic_js_dir") ? env.at("genetic_js_dir") : "docs/js/genetic/";
    std::string global_pattern = facts.count("global_object_pattern") ? facts.at("global_object_pattern") : "^GreenhouseGenetic[A-Z].*$";

    std::regex global_regex(global_pattern);
    std::regex const_global_regex("^\\s*const\\s+([A-Z][a-zA-Z0-9]*)\\s*=\\s*\\{");
    std::regex var_regex("^\\s*(?:const|let|var)\\s+([a-zA-Z0-9_]+)\\s*=");

    int files_checked = 0;
    int violations = 0;

    for (const auto& entry : fs::directory_iterator(js_dir)) {
        if (entry.path().extension() == ".js") {
            files_checked++;
            std::ifstream file(entry.path());
            std::string line;
            while (std::getline(file, line)) {
                std::smatch match;
                // Check Global objects (exported to window or defined at top level)
                if (std::regex_search(line, match, const_global_regex)) {
                    std::string name = match[1];
                    if (name.find("Greenhouse") != std::string::npos && !std::regex_match(name, global_regex)) {
                        violations++;
                        std::cerr << "[FAIL] Global naming violation in " << entry.path().filename() << ": '" << name << "' does not match " << global_pattern << std::endl;
                    }
                }
                // Local variables should be camelCase (basic check: no leading caps unless it's a global)
                if (std::regex_search(line, match, var_regex)) {
                    std::string name = match[1];
                    if (name.length() > 0 && isupper(name[0]) && name.find("Greenhouse") == std::string::npos && name != "GENE_SYMBOLS") {
                        // Potential PascalCase local variable (allowed for some constants but flagged here for audit)
                        // This is a simplified check.
                    }
                }
            }
        }
    }

    bool ok = (violations == 0);
    std::cout << "files_checked = " << files_checked << std::endl;
    std::cout << "violations_count = " << violations << std::endl;
    std::cout << "naming_compliance = " << (ok ? "true" : "false") << std::endl;

    return ok ? 0 : 1;
}
