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
// @Results files_checked, potential_unused_count, potential_unused_symbols

int main() {
    auto env = FactReader::readFacts("environment.facts");
    if (env.count("genetic_js_dir") == 0) { std::cerr << "error = fact missing genetic_js_dir" << std::endl; return 1; }
    std::string js_dir = env.at("genetic_js_dir");

    std::regex decl_regex("(?:const|let|var|function)\\s+([a-zA-Z0-9_]+)");

    int unused_count = 0;
    int files_checked = 0;
    std::vector<std::string> unused_list;

    if (!fs::exists(js_dir)) { std::cerr << "error = directory missing " << js_dir << std::endl; return 1; }

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
                    if (symbol == "t" || symbol == "ctx" || symbol == "i" || symbol == "j" || symbol == "k" || symbol == "n") continue;

                    std::regex usage_regex("\\b" + symbol + "\\b");
                    bool used = false;
                    for (size_t j = 0; j < lines.size(); ++j) {
                        if (i == j) {
                            std::string rest = lines[i].substr(match.position() + match.length());
                            if (std::regex_search(rest, usage_regex)) { used = true; break; }
                            continue;
                        }
                        if (std::regex_search(lines[j], usage_regex)) { used = true; break; }
                    }
                    if (!used) {
                        bool exported = false;
                        for (const auto& l : lines) {
                            if (l.find("window." + symbol) != std::string::npos) { exported = true; break; }
                        }
                        if (!exported) {
                            unused_count++;
                            unused_list.push_back(entry.path().filename().string() + ":" + symbol);
                        }
                    }
                }
            }
        }
    }

    std::cout << "files_checked = " << files_checked << std::endl;
    std::cout << "potential_unused_count = " << unused_count << std::endl;
    std::cout << "potential_unused_symbols = "; for (const auto& s : unused_list) std::cout << s << " "; std::cout << std::endl;

    return 0;
}
