#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <filesystem>
#include <map>
#include "../cpp/util/fact_utils.h"
#include "../cpp/util/decorator.h"

namespace fs = std::filesystem;
using namespace Sorrel::Sdd::Util;

// @Card: js_code_duplication_audit
// @Results files_checked, duplication_instances

int main() {
    auto env = FactReader::readFacts("environment.facts");
    std::string js_dir = env.count("genetic_js_dir") ? env.at("genetic_js_dir") : "docs/js/genetic/";

    std::map<std::string, std::vector<std::pair<std::string, int>>> chunks;
    int files_checked = 0;
    int duplications = 0;

    for (const auto& entry : fs::directory_iterator(js_dir)) {
        if (entry.path().extension() == ".js") {
            files_checked++;
            std::vector<std::string> lines;
            std::ifstream file(entry.path());
            std::string line;
            while (std::getline(file, line)) {
                std::string trimmed = trim(line);
                if (trimmed.length() > 20) lines.push_back(trimmed);
            }

            if (lines.size() >= 5) {
                for (size_t i = 0; i <= lines.size() - 5; ++i) {
                    std::string chunk = "";
                    for (int k = 0; k < 5; ++k) chunk += lines[i + k];
                    chunks[chunk].push_back({entry.path().filename().string(), (int)i});
                }
            }
        }
    }

    for (auto const& [chunk, locations] : chunks) {
        if (locations.size() > 1) {
            std::string first_file = locations[0].first;
            bool cross_file = false;
            for (const auto& loc : locations) if (loc.first != first_file) cross_file = true;

            if (cross_file) {
                duplications++;
            }
        }
    }

    std::cout << "files_checked = " << files_checked << std::endl;
    std::cout << "duplication_instances = " << duplications << std::endl;

    return 0;
}
