#include <iostream>
#include <map>
#include <string>
#include <cmath>
#include "../cpp/util/FactReader.hpp"
#include "../../src/SceneNodes.hpp"

// @Card: validate_lighting_boost
void validate_lighting_card(const std::map<std::string, std::string>& facts) {
    int f = std::stoi(facts.at("frame"));
    std::map<std::string, float> states;
    DialogueScene s; s.animate(f, states);
    
    float energy = states["HerbaceousKey_Energy"];
    std::cout << "light_energy = " << energy << std::endl;
}

// @Card: validate_gnome_dimming
void validate_dimming_card(const std::map<std::string, std::string>& facts) {
    int f = std::stoi(facts.at("frame"));
    std::map<std::string, float> states;
    DialogueScene s; s.animate(f, states);
    
    float energy = states["GnomeKey_Energy"];
    std::cout << "gnome_energy = " << energy << std::endl;
}

int main(int argc, char* argv[]) {
    if (argc < 2) return 1;
    auto facts = FactReader::read_facts(argv[1]);
    std::string card = facts.at("target_card");
    
    if (card == "boost") validate_lighting_card(facts);
    else if (card == "dim") validate_dimming_card(facts);
    
    return 0;
}
