#include <iostream>
#include <fstream>
#include <sstream>
#include <string>
#include <vector>
#include <set>
#include <filesystem>
#include "../cpp/util/fact_utils.h"
#include "../cpp/util/decorator.h"

using namespace Sorrel::Sdd::Util;

// @Card: movie10_architecture_audit
// @Results missing_files, missing_imports, passed_count, total_count

int main() {
    auto arch_facts = FactReader::readFacts("movie10_architecture.facts");

    std::string root = arch_facts["movie10_root"];
    std::string req_files_raw = arch_facts["required_files"];
    std::string req_imports_raw = arch_facts["localized_imports"];

    std::vector<std::string> missing_files;
    std::stringstream ssf(req_files_raw);
    std::string file;
    int total = 0;
    while (std::getline(ssf, file, ',')) {
        total++;
        if (!std::filesystem::exists(root + file)) {
            missing_files.push_back(file);
        }
    }

    std::vector<std::string> missing_imports;
    std::ifstream master_file(root + "master.py");
    if (master_file.is_open()) {
        std::string content((std::istreambuf_iterator<char>(master_file)), (std::istreambuf_iterator<char>()));
        std::stringstream ssi(req_imports_raw);
        std::string imp;
        while (std::getline(ssi, imp, ',')) {
            total++;
            if (content.find(imp) == std::string::npos) {
                missing_imports.push_back(imp);
            }
        }
    } else {
        missing_imports.push_back("master.py (not open)");
    }

    int missing_count = missing_files.size() + missing_imports.size();
    std::cout << "passed_count = " << (total - missing_count) << std::endl;
    std::cout << "total_count = " << total << std::endl;
    std::cout << "missing_files = "; for (const auto& f : missing_files) std::cout << f << " "; std::cout << std::endl;
    std::cout << "missing_imports = "; for (const auto& i : missing_imports) std::cout << i << " "; std::cout << std::endl;

    return missing_count == 0 ? 0 : 1;
}
