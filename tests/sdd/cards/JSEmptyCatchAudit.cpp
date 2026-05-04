#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <filesystem>
#include "../cpp/util/fact_utils.h"
#include "../cpp/util/decorator.h"

namespace fs = std::filesystem;
using namespace Sorrel::Sdd::Util;

// @Card: js_empty_catch_audit
// @Requires empty_catch_prohibited = true
// @Results files_checked, violations_count, catch_integrity

int main() {
    auto facts = FactReader::readFacts("js_quality.facts");
    auto env = FactReader::readFacts("environment.facts");
    if (!require_fact(facts, "empty_catch_prohibited", "true")) return 1;

    std::string js_dir = env.count("genetic_js_dir") ? env.at("genetic_js_dir") : "docs/js/genetic/";

    int files_checked = 0;
    int violations = 0;

    for (const auto& entry : fs::directory_iterator(js_dir)) {
        if (entry.path().extension() == ".js") {
            files_checked++;
            std::ifstream file(entry.path());
            std::string line;
            bool in_catch = false;
            std::string catch_block = "";

            while (std::getline(file, line)) {
                if (line.find("catch") != std::string::npos && line.find("{") != std::string::npos) {
                    in_catch = true;
                    catch_block = line.substr(line.find("{"));
                }
                if (in_catch) {
                    if (line.find("}") != std::string::npos) {
                        in_catch = false;
                        catch_block += line.substr(0, line.find("}") + 1);
                        // Basic check: is there anything other than whitespace/comments in the braces?
                        size_t first = catch_block.find("{") + 1;
                        size_t last = catch_block.find_last_of("}");
                        std::string content = catch_block.substr(first, last - first);
                        bool empty = true;
                        for(char c : content) if(!isspace(c)) { empty = false; break; }
                        if (empty) {
                            violations++;
                            std::cerr << "[FAIL] Empty catch block in " << entry.path().filename() << std::endl;
                        }
                    } else {
                        catch_block += line;
                    }
                }
            }
        }
    }

    bool ok = (violations == 0);
    std::cout << "files_checked = " << files_checked << std::endl;
    std::cout << "violations_count = " << violations << std::endl;
    std::cout << "catch_integrity = " << (ok ? "true" : "false") << std::endl;

    return ok ? 0 : 1;
}
