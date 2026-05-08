#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include "../cpp/util/fact_utils.h"

using namespace Sorrel::Sdd::Util;

// @Card: animation_tags_audit
// @Requires tags_check_enabled = true
// @Results tags_missing_count

int main() {
    // Audit animation_handler.py for required tags
    std::string handler_path = "../animation_handler.py";
    std::ifstream file(handler_path);
    if (!file.is_open()) { std::cerr << "[ERROR] Cannot open " << handler_path << std::endl; return 1; }

    std::vector<std::string> required = {"grasp", "bend_down", "reach_out", "droop", "stretch", "wiggle"};
    std::vector<std::string> found;
    std::string line;
    while (std::getline(file, line)) {
        for (const auto& tag : required) {
            if (line.find("tag == \"" + tag + "\"") != std::string::npos) {
                found.push_back(tag);
            }
        }
    }

    int missing = required.size() - found.size();
    std::cout << "tags_missing_count = " << missing << std::endl;

    for (const auto& r : required) {
        bool f = false;
        for (const auto& found_tag : found) { if (r == found_tag) f = true; }
        if (!f) std::cerr << "[FAIL] Missing animation tag: " << r << std::endl;
    }

    return (missing == 0) ? 0 : 1;
}
