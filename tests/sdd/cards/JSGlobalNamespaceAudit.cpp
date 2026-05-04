#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <filesystem>
#include "../cpp/util/fact_utils.h"
#include "../cpp/util/decorator.h"

namespace fs = std::filesystem;
using namespace Sorrel::Sdd::Util;

// @Card: js_global_namespace_audit
// @Description Verifies JS files use IIFE and 'use strict'
// @Results files_scanned, violations_count, namespace_compliance

int main() {
    auto env = FactReader::readFacts("environment.facts");
    std::string js_dir = env.count("genetic_js_dir") ? env.at("genetic_js_dir") : "docs/js/genetic/";

    int files_scanned = 0;
    int violations = 0;

    if (!fs::exists(js_dir)) {
        std::cerr << "[ERROR] Directory does not exist: " << js_dir << std::endl;
        return 1;
    }

    for (const auto& entry : fs::directory_iterator(js_dir)) {
        if (entry.path().extension() == ".js") {
            files_scanned++;
            std::ifstream file(entry.path());
            std::string line;
            bool has_iife_start = false;
            bool has_strict = false;
            bool has_iife_end = false;

            while (std::getline(file, line)) {
                if (line.find("(function () {") != std::string::npos || line.find("(function() {") != std::string::npos) has_iife_start = true;
                if (line.find("'use strict';") != std::string::npos || line.find("\"use strict\";") != std::string::npos) has_strict = true;
                if (line.find("})();") != std::string::npos) has_iife_end = true;
            }

            if (!has_iife_start || !has_strict || !has_iife_end) {
                violations++;
                std::cerr << "[FAIL] JS Namespace violation in " << entry.path().filename() << ":"
                          << (has_iife_start ? "" : " Missing IIFE start;")
                          << (has_strict ? "" : " Missing 'use strict';")
                          << (has_iife_end ? "" : " Missing IIFE end;")
                          << std::endl;
            }
        }
    }

    bool ok = (violations == 0);
    std::cout << "files_scanned = " << files_scanned << std::endl;
    std::cout << "violations_count = " << violations << std::endl;
    std::cout << "namespace_compliance = " << (ok ? "true" : "false") << std::endl;

    return ok ? 0 : 1;
}
