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

// @Card: clinical_decisions_spec_audit
// @Results files_audited, stub_violations, audit_passed

int main() {
    auto env = FactReader::readFacts("environment.facts");
    auto spec = FactReader::readFacts("pipeline_spec.facts");

    // Decorator-gate enforcement
    if (!require_fact(spec, "enforce_zero_stubs", "true")) {
        std::cerr << "[DECORATOR REJECT] enforce_zero_stubs is not true. Aborting." << std::endl;
        return 1;
    }

    std::string root_dir = ".";
    if (env.count("v10_root_dir")) {
        root_dir = env.at("v10_root_dir");
    }

    std::vector<std::string> sub_dirs = {
        "core", "advocacy", "education", "roadmapping", "cross_version"
    };

    std::vector<std::string> banned_keywords = {
        "provide sensory spaces and structured daily intervals",
        "provide asynchronous scheduling options to mitigate cognitive fatigue",
        "candidate correctly identifies concerta as active guanfacine",
        "preschoolers (adhd-stress)",
        "a patient is seeking guidance on concerta",
        "treatment of attention deficit hyperactivity disorder"
    };

    int files_audited = 0;
    int stub_violations = 0;

    for (const auto& sub : sub_dirs) {
        fs::path target_path = fs::path(root_dir) / sub;
        if (!fs::exists(target_path)) continue;

        for (const auto& entry : fs::recursive_directory_iterator(target_path)) {
            if (entry.path().extension() == ".py") {
                files_audited++;
                std::ifstream file(entry.path());
                if (!file.is_open()) continue;

                std::string line;
                int line_num = 0;
                while (std::getline(file, line)) {
                    line_num++;
                    std::string uncommented = strip_python_comments(line);
                    std::string lower_line = uncommented;
                    std::transform(lower_line.begin(), lower_line.end(), lower_line.begin(), ::tolower);

                    for (const auto& keyword : banned_keywords) {
                        if (lower_line.find(keyword) != std::string::npos) {
                            std::cerr << "[COMPLIANCE VIOLATION] Hardcoded stub found in: " 
                                      << entry.path().filename().string() 
                                      << ":" << line_num << " -> '" << keyword << "'" << std::endl;
                            stub_violations++;
                        }
                    }
                }
            }
        }
    }

    bool audit_passed = (stub_violations == 0);

    std::cout << "files_audited = " << files_audited << std::endl;
    std::cout << "stub_violations = " << stub_violations << std::endl;
    std::cout << "audit_passed = " << (audit_passed ? "true" : "false") << std::endl;

    return audit_passed ? 0 : 1;
}
