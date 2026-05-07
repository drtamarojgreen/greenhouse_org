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

// @Card: js_hardcoded_value_audit
// @Results files_checked, magic_number_count, hardcoded_string_count

int main() {
    auto env = FactReader::readFacts("environment.facts");
    auto facts = FactReader::readFacts("js_quality.facts");

    std::vector<std::string> scan_dirs;
    if (env.count("genetic_js_dir")) scan_dirs.push_back(env.at("genetic_js_dir"));
    if (env.count("models_js_dir")) scan_dirs.push_back(env.at("models_js_dir"));

    int threshold = facts.count("magic_number_threshold") ? std::stoi(facts.at("magic_number_threshold")) : 100;

    int files_checked = 0;
    int magic_numbers = 0;
    int hardcoded_strings = 0;

    // Use a simpler regex that matches sequences of digits not surrounded by other digits
    std::regex magic_num_regex("\\b([0-9]{2,})\\b");
    std::regex string_regex("\"[^\"]{20,}\"");

    for (const auto& js_dir : scan_dirs) {
        if (!fs::exists(js_dir)) continue;

        for (const auto& entry : fs::directory_iterator(js_dir)) {
            if (entry.path().extension() == ".js") {
                files_checked++;
                std::ifstream file(entry.path());
                std::string line;
                while (std::getline(file, line)) {
                    std::smatch match;
                    std::string search_line = line;
                    while (std::regex_search(search_line, match, magic_num_regex)) {
                        try {
                            int val = std::stoi(match[1]);
                            if (val > threshold) magic_numbers++;
                        } catch (...) {}
                        search_line = match.suffix().str();
                    }

                    search_line = line;
                    while (std::regex_search(search_line, match, string_regex)) {
                        hardcoded_strings++;
                        search_line = match.suffix().str();
                    }
                }
            }
        }
    }

    std::cout << "files_checked = " << files_checked << std::endl;
    std::cout << "magic_number_count = " << magic_numbers << std::endl;
    std::cout << "hardcoded_string_count = " << hardcoded_strings << std::endl;

    return 0;
}
