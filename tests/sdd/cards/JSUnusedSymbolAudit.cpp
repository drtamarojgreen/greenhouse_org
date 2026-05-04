#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <filesystem>
#include <regex>
#include "../cpp/util/fact_utils.h"
#include "../cpp/util/decorator.h"

namespace fs = std::filesystem;
using namespace Sorrel::Sdd::Util;

// @Card: js_unused_symbol_audit
// @Requires unused_symbols_prohibited = true
// @Results files_checked, unused_count, unused_symbols_valid

int main() {
    auto facts = FactReader::readFacts("js_quality.facts");
    auto env = FactReader::readFacts("environment.facts");
    if (!require_fact(facts, "unused_symbols_prohibited", "true")) return 1;

    std::string js_dir = env.count("genetic_js_dir") ? env.at("genetic_js_dir") : "docs/js/genetic/";

    std::regex decl_regex("(?:const|let|var|function)\\s+([a-zA-Z0-9_]+)");

    int unused_count = 0;
    int files_checked = 0;

    for (const auto& entry : fs::directory_iterator(js_dir)) {
        if (entry.path().extension() == ".js") {
            files_checked++;
            std::vector<std::string> lines;
            std::ifstream file(entry.path());
            std::string line;
            while (std::getline(file, line)) lines.push_back(line);

            for (size_t i = 0; i < lines.size(); ++i) {
                std::smatch match;
                if (std::regex_search(lines[i], match, decl_regex)) {
                    std::string symbol = match[1];
                    if (symbol == "t" || symbol == "ctx" || symbol == "GreenhouseGeneticConfig") continue; // Skip common ones

                    bool used = false;
                    for (size_t j = 0; j < lines.size(); ++j) {
                        if (i == j) continue;
                        if (lines[j].find(symbol) != std::string::npos) {
                            used = true;
                            break;
                        }
                    }
                    if (!used) {
                        // Check if exported to window
                        bool exported = false;
                        for (const auto& l : lines) {
                            if (l.find("window." + symbol) != std::string::npos) { exported = true; break; }
                        }
                        if (!exported) {
                            unused_count++;
                            std::cerr << "[FAIL] Potentially unused symbol in " << entry.path().filename() << ": '" << symbol << "'" << std::endl;
                        }
                    }
                }
            }
        }
    }

    bool ok = (unused_count == 0);
    std::cout << "files_checked = " << files_checked << std::endl;
    std::cout << "unused_count = " << unused_count << std::endl;
    std::cout << "unused_symbols_valid = " << (ok ? "true" : "false") << std::endl;

    return 0; // Don't fail the build yet, just report
}
