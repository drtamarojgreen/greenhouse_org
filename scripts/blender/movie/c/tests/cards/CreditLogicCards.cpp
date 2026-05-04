#include <iostream>
#include <map>
#include <string>
#include "../cpp/util/FactReader.hpp"
#include "../../include/SceneNodes.hpp"

// @Card: validate_credits_scroll
void validate_credits_scroll_card(const std::map<std::string, std::string>& facts) {
    int f = std::stoi(facts.at("frame"));
    std::map<std::string, float> states;
    CreditsScene s; s.animate(f, states);
    
    float pos = states["Credits_lz"];
    std::cout << "scroll_pos = " << pos << std::endl;
}

int main(int argc, char* argv[]) {
    if (argc < 2) return 1;
    auto facts = FactReader::read_facts(argv[1]);
    std::string card = facts.at("target_card");
    
    if (card == "scroll") validate_credits_scroll_card(facts);
    
    return 0;
}
