#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <filesystem>
#include <algorithm>
#include "../cpp/util/fact_utils.h"
#include "../cpp/util/decorator.h"

namespace fs = std::filesystem;
using namespace Sorrel::Sdd::Util;

// @Card: apis_spec_audit
// @Results client_exists, urls_structured, fallbacks_healthy, apis_passed

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

    fs::path client_path = fs::path(root_dir) / "infrastructure" / "api_clients.py";

    bool client_exists = false;
    bool urls_structured = false;
    bool fallbacks_healthy = false;

    if (fs::exists(client_path)) {
        client_exists = true;
        std::ifstream file(client_path);
        std::string line;

        bool has_pubmed_url = false;
        bool has_fda_url = false;
        bool has_ct_url = false;
        bool has_urllib = false;
        bool has_fallback_drug = false;
        bool has_fallback_pub = false;

        while (std::getline(file, line)) {
            std::string uncommented = strip_python_comments(line);
            if (uncommented.find("eutils.ncbi.nlm.nih.gov") != std::string::npos) has_pubmed_url = true;
            if (uncommented.find("api.fda.gov") != std::string::npos) has_fda_url = true;
            if (uncommented.find("clinicaltrials.gov") != std::string::npos) has_ct_url = true;
            if (uncommented.find("urllib.request") != std::string::npos) has_urllib = true;
            if (uncommented.find("active_ingredient") != std::string::npos && uncommented.find("warnings") != std::string::npos) has_fallback_drug = true;
            if (uncommented.find("pmid") != std::string::npos && uncommented.find("title") != std::string::npos && uncommented.find("journal") != std::string::npos) has_fallback_pub = true;
        }

        if (has_pubmed_url && has_fda_url && has_ct_url && has_urllib) {
            urls_structured = true;
        } else {
            std::cerr << "[COMPLIANCE FAILED] api_clients.py has invalid URL definitions or is missing urllib libraries: "
                      << "pubmed=" << has_pubmed_url 
                      << ", fda=" << has_fda_url 
                      << ", ct=" << has_ct_url 
                      << ", urllib=" << has_urllib << std::endl;
        }

        if (has_fallback_drug && has_fallback_pub) {
            fallbacks_healthy = true;
        } else {
            std::cerr << "[COMPLIANCE FAILED] api_clients.py does not define robust fallback schemas: "
                      << "drug_fallback=" << has_fallback_drug 
                      << ", pub_fallback=" << has_fallback_pub << std::endl;
        }
    } else {
        std::cerr << "[ERROR] api_clients.py not found!" << std::endl;
    }

    bool apis_passed = (client_exists && urls_structured && fallbacks_healthy);

    std::cout << "client_exists = " << (client_exists ? "true" : "false") << std::endl;
    std::cout << "urls_structured = " << (urls_structured ? "true" : "false") << std::endl;
    std::cout << "fallbacks_healthy = " << (fallbacks_healthy ? "true" : "false") << std::endl;
    std::cout << "apis_passed = " << (apis_passed ? "true" : "false") << std::endl;

    return apis_passed ? 0 : 1;
}
