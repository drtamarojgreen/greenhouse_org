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

// @Card: imports_spec_audit
// @Results files_audited, import_violations, imports_passed

int main() {
    auto env = FactReader::readFacts("environment.facts");
    auto spec = FactReader::readFacts("pipeline_spec.facts");

    if (!require_fact(spec, "enforce_zero_stubs", "true")) {
        std::cerr << "[DECORATOR REJECT] enforce_zero_stubs is not true. Aborting." << std::endl;
        return 1;
    }

    std::string root_dir = ".";
    if (env.count("v10_root_dir")) {
        root_dir = env.at("v10_root_dir");
    }

    std::vector<std::string> sub_dirs = {
        "core", "advocacy", "education", "roadmapping", "cross_version", "ui"
    };

    int files_audited = 0;
    int import_violations = 0;

    // Common standard library objects to audit
    std::vector<std::string> std_libs = {
        "json", "math", "time", "sys", "os", "re", "yaml", "urllib"
    };

    for (const auto& sub : sub_dirs) {
        fs::path target_path = fs::path(root_dir) / sub;
        if (!fs::exists(target_path)) continue;

        for (const auto& entry : fs::recursive_directory_iterator(target_path)) {
            if (entry.path().extension() == ".py") {
                files_audited++;
                std::ifstream file(entry.path());
                if (!file.is_open()) continue;

                std::string line;
                bool has_json_import = false;
                bool has_math_import = false;
                bool has_time_import = false;
                bool has_sys_import = false;
                bool has_os_import = false;
                bool has_re_import = false;
                bool has_yaml_import = false;
                bool has_urllib_import = false;

                bool uses_json = false;
                bool uses_math = false;
                bool uses_time = false;
                bool uses_sys = false;
                bool uses_os = false;
                bool uses_re = false;
                bool uses_yaml = false;
                bool uses_urllib = false;

                int line_num = 0;
                while (std::getline(file, line)) {
                    line_num++;
                    std::string uncommented = strip_python_comments(line);
                    
                    // Detect imports
                    if (uncommented.find("import json") != std::string::npos) has_json_import = true;
                    if (uncommented.find("import math") != std::string::npos) has_math_import = true;
                    if (uncommented.find("import time") != std::string::npos) has_time_import = true;
                    if (uncommented.find("import sys") != std::string::npos) has_sys_import = true;
                    if (uncommented.find("import os") != std::string::npos) has_os_import = true;
                    if (uncommented.find("import re") != std::string::npos) has_re_import = true;
                    if (uncommented.find("import yaml") != std::string::npos) has_yaml_import = true;
                    if (uncommented.find("urllib") != std::string::npos && uncommented.find("import") != std::string::npos) has_urllib_import = true;

                    // Detect actual usage (avoiding import statements themselves)
                    if (uncommented.find("import ") == std::string::npos && uncommented.find("from ") == std::string::npos) {
                        if (uncommented.find("json.") != std::string::npos) uses_json = true;
                        if (uncommented.find("math.") != std::string::npos) uses_math = true;
                        if (uncommented.find("time.") != std::string::npos || uncommented.find("time.time()") != std::string::npos) uses_time = true;
                        if (uncommented.find("sys.") != std::string::npos) uses_sys = true;
                        if (uncommented.find("os.") != std::string::npos) uses_os = true;
                        if (uncommented.find("re.") != std::string::npos) uses_re = true;
                        if (uncommented.find("yaml.") != std::string::npos) uses_yaml = true;
                        if (uncommented.find("urllib.") != std::string::npos) uses_urllib = true;
                    }
                }

                // Check violations
                if (uses_json && !has_json_import) {
                    std::cerr << "[IMPORT VIOLATION] File utilizes 'json' module but does not import it: " 
                              << entry.path().filename().string() << std::endl;
                    import_violations++;
                }
                if (uses_math && !has_math_import) {
                    std::cerr << "[IMPORT VIOLATION] File utilizes 'math' module but does not import it: " 
                              << entry.path().filename().string() << std::endl;
                    import_violations++;
                }
                if (uses_time && !has_time_import) {
                    std::cerr << "[IMPORT VIOLATION] File utilizes 'time' module but does not import it: " 
                              << entry.path().filename().string() << std::endl;
                    import_violations++;
                }
                if (uses_sys && !has_sys_import) {
                    std::cerr << "[IMPORT VIOLATION] File utilizes 'sys' module but does not import it: " 
                              << entry.path().filename().string() << std::endl;
                    import_violations++;
                }
                if (uses_os && !has_os_import) {
                    std::cerr << "[IMPORT VIOLATION] File utilizes 'os' module but does not import it: " 
                              << entry.path().filename().string() << std::endl;
                    import_violations++;
                }
                if (uses_re && !has_re_import) {
                    std::cerr << "[IMPORT VIOLATION] File utilizes 're' module but does not import it: " 
                              << entry.path().filename().string() << std::endl;
                    import_violations++;
                }
                if (uses_yaml && !has_yaml_import) {
                    std::cerr << "[IMPORT VIOLATION] File utilizes 'yaml' module but does not import it: " 
                              << entry.path().filename().string() << std::endl;
                    import_violations++;
                }
                if (uses_urllib && !has_urllib_import) {
                    std::cerr << "[IMPORT VIOLATION] File utilizes 'urllib' module but does not import it: " 
                              << entry.path().filename().string() << std::endl;
                    import_violations++;
                }
            }
        }
    }

    bool imports_passed = (import_violations == 0);

    std::cout << "files_audited = " << files_audited << std::endl;
    std::cout << "import_violations = " << import_violations << std::endl;
    std::cout << "imports_passed = " << (imports_passed ? "true" : "false") << std::endl;

    return imports_passed ? 0 : 1;
}
