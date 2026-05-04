#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <filesystem>
#include "../cpp/util/fact_utils.h"
#include "../cpp/util/decorator.h"

namespace fs = std::filesystem;
using namespace Sorrel::Sdd::Util;

// @Card: js_meaningless_assertion_audit
// @Requires meaningful_assertions_required = true
// @Results files_checked, violations_count, assertion_integrity

int main() {
    auto facts = FactReader::readFacts("js_quality.facts");
    auto env = FactReader::readFacts("environment.facts");
    if (!require_fact(facts, "meaningful_assertions_required", "true")) return 1;

    std::string js_dir = env.count("genetic_js_dir") ? env.at("genetic_js_dir") : "docs/js/genetic/";

    int files_checked = 0;
    int violations = 0;

    for (const auto& entry : fs::directory_iterator(js_dir)) {
        if (entry.path().extension() == ".js") {
            files_checked++;
            std::ifstream file(entry.path());
            std::string line;

            while (std::getline(file, line)) {
                // Check for Assert.true(true), expect(1).toBe(1), etc.
                if ((line.find("Assert.true(true)") != std::string::npos) ||
                    (line.find("Assert.equal(1, 1)") != std::string::npos) ||
                    (line.find("expect(true).toBe(true)") != std::string::npos)) {
                    violations++;
                    std::cerr << "[FAIL] Meaningless assertion in " << entry.path().filename() << ": " << trim(line) << std::endl;
                }
            }
        }
    }

    bool ok = (violations == 0);
    std::cout << "files_checked = " << files_checked << std::endl;
    std::cout << "violations_count = " << violations << std::endl;
    std::cout << "assertion_integrity = " << (ok ? "true" : "false") << std::endl;

    return ok ? 0 : 1;
}
