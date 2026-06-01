#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <filesystem>
#include <map>
#include <regex>
#include "../cpp/util/fact_utils.h"

namespace fs = std::filesystem;
using namespace Sorrel::Sdd::Util;

// @Card: movie_redundancy_audit
// @Results repeated_functions, total_functions_scanned

int main() {
    auto env = FactReader::readFacts("environment.facts");
    std::string base_dir = env.count("blender_movie_dir") ? env.at("blender_movie_dir") : "";
    if (base_dir.empty()) return 1;

    std::map<std::string, int> function_signatures;
    std::regex func_regex("def\\s+([a-zA-Z_0-9]+)\\s*\\(");
    int total_funcs = 0;

    for (const auto& entry : fs::recursive_directory_iterator(base_dir)) {
        if (entry.is_regular_file() && entry.path().extension() == ".py") {
            std::ifstream file(entry.path());
            std::string line;
            while (std::getline(file, line)) {
                std::smatch match;
                if (std::regex_search(line, match, func_regex)) {
                    std::string sig = match[1].str();
                    // Ignore common internal/init methods
                    if (sig.find("__") == 0) continue;
                    function_signatures[sig]++;
                    total_funcs++;
                }
            }
        }
    }

    int repeated = 0;
    for (auto const& [sig, count] : function_signatures) {
        if (count > 1) repeated++;
    }

    std::cout << "repeated_functions = " << repeated << std::endl;
    std::cout << "total_functions_scanned = " << total_funcs << std::endl;

    return 0;
}
