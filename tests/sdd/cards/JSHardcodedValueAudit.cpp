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
// @Results files_checked, magic_number_count, unparameterized_string_count

int main() {
    auto env = FactReader::readFacts("environment.facts");
    std::string js_dir = env.count("genetic_js_dir") ? env.at("genetic_js_dir") : "docs/js/genetic/";

    std::regex magic_number_regex("\\b([1-9][0-9]{2,})\\b"); // 3+ digits
    std::regex unparam_string_regex("\"([^\"]{20,})\""); // Long strings often need translation

    int files_checked = 0;
    int magic_numbers = 0;
    int long_strings = 0;

    for (const auto& entry : fs::directory_iterator(js_dir)) {
        if (entry.path().extension() == ".js") {
            files_checked++;
            std::ifstream file(entry.path());
            std::string line;
            while (std::getline(file, line)) {
                if (line.find("//") != std::string::npos) continue; // Skip comments

                std::smatch match;
                std::string temp = line;
                while (std::regex_search(temp, match, magic_number_regex)) {
                    magic_numbers++;
                    temp = match.suffix().str();
                }

                temp = line;
                while (std::regex_search(temp, match, unparam_string_regex)) {
                    if (line.find("t(") == std::string::npos && match[1].str().find("/") == std::string::npos) {
                        long_strings++;
                    }
                    temp = match.suffix().str();
                }
            }
        }
    }

    std::cout << "files_checked = " << files_checked << std::endl;
    std::cout << "magic_number_count = " << magic_numbers << std::endl;
    std::cout << "unparameterized_string_count = " << long_strings << std::endl;

    return 0;
}
