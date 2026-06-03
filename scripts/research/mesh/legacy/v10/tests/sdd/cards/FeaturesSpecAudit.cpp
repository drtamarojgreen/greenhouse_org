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

// @Card: features_spec_audit
// @Results schemas_verified, roadmaps_verified, strategist_verified, audit_passed

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

    // Paths to source files
    fs::path schemas_path = fs::path(root_dir) / "core" / "schemas.py";
    fs::path strategy_path = fs::path(root_dir) / "cross_version" / "strategy.py";
    fs::path planning_path = fs::path(root_dir) / "roadmapping" / "planning.py";

    bool schemas_verified = false;
    bool strategist_verified = false;
    bool roadmaps_verified = false;

    // 1. Audit core/schemas.py for Ingestion & Harmonization Enhancements (Features 21-27)
    if (fs::exists(schemas_path)) {
        std::ifstream file(schemas_path);
        std::string line;
        bool has_peicot = false;
        bool has_confounders = false;
        bool has_harmonizer = false;
        bool has_settings = false;
        bool has_attrition = false;

        while (std::getline(file, line)) {
            std::string uncommented = strip_python_comments(line);
            if (uncommented.find("class PEICOTSchema") != std::string::npos) has_peicot = true;
            if (uncommented.find("class ConfounderCatalog") != std::string::npos) has_confounders = true;
            if (uncommented.find("class ScaleHarmonizer") != std::string::npos) has_harmonizer = true;
            if (uncommented.find("school") != std::string::npos && uncommented.find("workplace") != std::string::npos) has_settings = true;
            if (uncommented.find("attrition_rate") != std::string::npos && uncommented.find("reporting_gaps") != std::string::npos) has_attrition = true;
        }

        if (has_peicot && has_confounders && has_harmonizer && has_settings && has_attrition) {
            schemas_verified = true;
        } else {
            std::cerr << "[COMPLIANCE FAILED] core/schemas.py is missing required features: "
                      << "peicot=" << has_peicot 
                      << ", confounders=" << has_confounders 
                      << ", harmonizer=" << has_harmonizer 
                      << ", settings=" << has_settings 
                      << ", attrition=" << has_attrition << std::endl;
        }
    } else {
        std::cerr << "[ERROR] core/schemas.py not found!" << std::endl;
    }

    // 2. Audit cross_version/strategy.py for Backwards Compatibility & Bridges (Features 161-180)
    if (fs::exists(strategy_path)) {
        std::ifstream file(strategy_path);
        std::string line;
        bool has_mapping = false;
        bool has_v7_bridge = false;
        bool has_v8_bridge = false;
        bool has_provenance = false;
        bool has_deprecation = false;

        while (std::getline(file, line)) {
            std::string uncommented = strip_python_comments(line);
            if (uncommented.find("def get_version_mapping_matrix") != std::string::npos) has_mapping = true;
            if (uncommented.find("def apply_v7_network_bridge") != std::string::npos) has_v7_bridge = true;
            if (uncommented.find("def apply_v8_enrichment_bridge") != std::string::npos) has_v8_bridge = true;
            if (uncommented.find("def tag_version_provenance") != std::string::npos) has_provenance = true;
            if (uncommented.find("def get_deprecation_and_risk_policy") != std::string::npos) has_deprecation = true;
        }

        if (has_mapping && has_v7_bridge && has_v8_bridge && has_provenance && has_deprecation) {
            strategist_verified = true;
        } else {
            std::cerr << "[COMPLIANCE FAILED] cross_version/strategy.py is missing required features: "
                      << "mapping=" << has_mapping 
                      << ", v7_bridge=" << has_v7_bridge 
                      << ", v8_bridge=" << has_v8_bridge 
                      << ", provenance=" << has_provenance 
                      << ", deprecation=" << has_deprecation << std::endl;
        }
    } else {
        std::cerr << "[ERROR] cross_version/strategy.py not found!" << std::endl;
    }

    // 3. Audit roadmapping/planning.py for Roadmaps, OKRs, & Governance (Features 181-200)
    if (fs::exists(planning_path)) {
        std::ifstream file(planning_path);
        std::string line;
        bool has_roadmap = false;
        bool has_okr = false;
        bool has_pilots = false;
        bool has_playbook = false;
        bool has_sunset = false;

        while (std::getline(file, line)) {
            std::string uncommented = strip_python_comments(line);
            if (uncommented.find("def get_12_month_roadmap") != std::string::npos) has_roadmap = true;
            if (uncommented.find("def get_quarterly_okrs") != std::string::npos) has_okr = true;
            if (uncommented.find("def get_pilot_projects") != std::string::npos) has_pilots = true;
            if (uncommented.find("def get_incident_response_playbook") != std::string::npos) has_playbook = true;
            if (uncommented.find("def get_sunset_and_triage_rules") != std::string::npos) has_sunset = true;
        }

        if (has_roadmap && has_okr && has_pilots && has_playbook && has_sunset) {
            roadmaps_verified = true;
        } else {
            std::cerr << "[COMPLIANCE FAILED] roadmapping/planning.py is missing required features: "
                      << "roadmap=" << has_roadmap 
                      << ", okr=" << has_okr 
                      << ", pilots=" << has_pilots 
                      << ", playbook=" << has_playbook 
                      << ", sunset=" << has_sunset << std::endl;
        }
    } else {
        std::cerr << "[ERROR] roadmapping/planning.py not found!" << std::endl;
    }

    bool audit_passed = (schemas_verified && strategist_verified && roadmaps_verified);

    std::cout << "schemas_verified = " << (schemas_verified ? "true" : "false") << std::endl;
    std::cout << "strategist_verified = " << (strategist_verified ? "true" : "false") << std::endl;
    std::cout << "roadmaps_verified = " << (roadmaps_verified ? "true" : "false") << std::endl;
    std::cout << "audit_passed = " << (audit_passed ? "true" : "false") << std::endl;

    return audit_passed ? 0 : 1;
}
