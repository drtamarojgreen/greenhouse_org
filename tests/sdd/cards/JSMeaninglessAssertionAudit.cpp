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
// @Results files_checked, meaningless_assertion_count, meaningless_assertions

int main() {
    auto env = FactReader::readFacts("environment.facts");
    if (env.count("genetic_js_dir") == 0) { std::cerr << "error = fact missing genetic_js_dir" << std::endl; return 1; }
    std::string js_dir = env.at("genetic_js_dir");

    int files_checked = 0;
    std::vector<std::string> violations;

    if (!fs::exists(js_dir)) { std::cerr << "error = directory missing " << js_dir << std::endl; return 1; }

    for (const auto& entry : fs::directory_iterator(js_dir)) {
        if (entry.path().extension() == ".js") {
            files_checked++;
            std::ifstream file(entry.path());
            std::string line;
            int line_num = 0;

            while (std::getline(file, line)) {
                line_num++;
                if ((line.find("Assert.true(true)") != std::string::npos) ||
                    (line.find("Assert.equal(1, 1)") != std::string::npos) ||
                    (line.find("expect(true).toBe(true)") != std::string::npos)) {
                    violations.push_back(entry.path().filename().string() + ":" + std::to_string(line_num));
                }
            }
        }
    }

    std::cout << "files_checked = " << files_checked << std::endl;
    std::cout << "meaningless_assertion_count = " << violations.size() << std::endl;
    std::cout << "meaningless_assertion_locations = "; for (const auto& v : violations) std::cout << v << " "; std::cout << std::endl;

    return 0;
}
