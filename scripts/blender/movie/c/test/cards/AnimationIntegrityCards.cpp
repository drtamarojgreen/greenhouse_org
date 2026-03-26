#include <iostream>
#include <map>
#include <string>
#include <cmath>
#include "../cpp/util/FactReader.hpp"
#include "../../src/SceneNodes.hpp"

// @Card: validate_rig_prerequisites
void validate_rig_card(const std::map<std::string, std::string>& facts) {
    // In C++, we check if the Actor/SceneNode produces the expected bones in the state map
    int f = std::stoi(facts.at("frame"));
    std::map<std::string, float> states;
    DialogueScene s; s.animate(f, states);
    
    bool has_head_nod = states.count("Dialogue_HeadNod") > 0;
    std::cout << "rig_valid = " << (has_head_nod ? "true" : "false") << std::endl;
}

// @Card: validate_binary_stream_integrity
void validate_binary_stream_card(const std::map<std::string, std::string>& facts) {
    int f = std::stoi(facts.at("frame"));
    std::map<std::string, float> states;
    BrandingScene s; s.animate(f, states);
    
    // Check if the logo pulshing is mathematically consistent
    float pulse = states["GreenhouseLogo_sx"];
    bool consistent = (pulse >= 0.95f && pulse <= 1.05f);
    std::cout << "pulse_integrity = " << (consistent ? "true" : "false") << std::endl;
}

int main(int argc, char* argv[]) {
    if (argc < 2) return 1;
    auto facts = FactReader::read_facts(argv[1]);
    std::string card = facts.at("target_card");
    
    if (card == "rig") validate_rig_card(facts);
    else if (card == "binary") validate_binary_stream_card(facts);
    
    return 0;
}
