#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <filesystem>
#include <algorithm>
#include "../cpp/util/fact_utils.h"

namespace fs = std::filesystem;
using namespace Sorrel::Sdd::Util;

// @Card: v12_pattern_audit
// @Results files_checked, stub_violations, total_violations

int main() {
    auto env = FactReader::readFacts("v12.facts");
    std::string v12_root = env.count("v12_root") ? env.at("v12_root") : "scripts/research/mesh/v12";

    int files_checked = 0;
    int stub_violations = 0;

    if (!fs::exists(v12_root)) {
        std::cerr << "Root not found: " << v12_root << std::endl;
        return 1;
    }

    for (const auto& entry : fs::recursive_directory_iterator(v12_root)) {
        if (entry.path().extension() == ".py") {
            // Skip abstract base classes and tests for stub checks
            std::string filename = entry.path().filename().string();
            if (filename == "base.py" || entry.path().string().find("/tests/") != std::string::npos) {
                continue;
            }

            files_checked++;
            std::ifstream file(entry.path());
            std::string line;
            while (std::getline(file, line)) {
                // Heuristic for stubs in non-base files
                // Look for NotImplementedError as a raised exception, not just text in comments
                if (line.find("raise NotImplementedError") != std::string::npos) {
                    stub_violations++;
                    std::cout << "Violation: raise NotImplementedError found in " << entry.path() << std::endl;
                }
                // Look for 'pass' as a statement, typically on its own line or following a colon
                // This is a naive check but better than just finding 'pass' in comments
                size_t pass_pos = line.find("pass");
                if (pass_pos != std::string::npos) {
                     bool is_comment = false;
                     size_t hash_pos = line.find('#');
                     if (hash_pos != std::string::npos && hash_pos < pass_pos) {
                         is_comment = true;
                     }
                     if (!is_comment) {
                         // Check if it's likely a statement
                         std::string trimmed = trim(line);
                         if (trimmed == "pass" || (trimmed.find(": pass") != std::string::npos)) {
                             stub_violations++;
                             std::cout << "Violation: pass statement found in " << entry.path() << std::endl;
                         }
                     }
                }
            }
        }
    }

    std::cout << "files_checked = " << files_checked << std::endl;
    std::cout << "stub_violations = " << stub_violations << std::endl;
    std::cout << "total_violations = " << stub_violations << std::endl;

    return 0;
}
