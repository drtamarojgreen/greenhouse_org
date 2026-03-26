#include <iostream>
#include <map>
#include <string>
#include "../cpp/util/FactReader.hpp"
#include "../../src/SceneNodes.hpp"

// @Card: validate_frame_contiguity
void validate_contiguity_card(const std::map<std::string, std::string>& facts) {
    // Check if frames across boundaries have valid scene handlers
    int f1 = std::stoi(facts.at("frame_end_retreat"));
    int f2 = std::stoi(facts.at("frame_start_credits"));
    
    std::cout << "contiguity_gap = " << (f2 - f1) << std::endl;
}

// @Card: validate_critical_visibility
void validate_visibility_gate_card(const std::map<std::string, std::string>& facts) {
    int f = std::stoi(facts.at("frame"));
    std::map<std::string, float> states;
    DialogueScene s; s.animate(f, states);
    
    bool h_vis = states["Herbaceous_vis"] > 0.5f;
    bool g_vis = states["GloomGnome_vis"] > 0.5f;
    std::cout << "release_visibility = " << (h_vis && g_vis ? "PASS" : "FAIL") << std::endl;
}

int main(int argc, char* argv[]) {
    if (argc < 2) return 1;
    auto facts = FactReader::read_facts(argv[1]);
    std::string card = facts.at("target_card");
    
    if (card == "contiguity") validate_contiguity_card(facts);
    else if (card == "visibility") validate_visibility_gate_card(facts);
    
    return 0;
}
