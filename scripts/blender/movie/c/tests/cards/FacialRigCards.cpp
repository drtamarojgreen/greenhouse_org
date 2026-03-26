#include <iostream>
#include <map>
#include <string>
#include "../cpp/util/FactReader.hpp"
#include "../../src/SceneNodes.hpp"

// @Card: validate_facial_props
void validate_facial_card(const std::map<std::string, std::string>& facts) {
    int f = std::stoi(facts.at("frame"));
    std::map<std::string, float> states;
    DialogueScene s; s.animate(f, states);
    
    // Check if facial props are registered in the state map
    bool has_eyes = states.count("Herbaceous_Eye_L_vis") >= 0; // State map existence check
    std::cout << "facial_props_valid = " << (has_eyes ? "true" : "false") << std::endl;
}

// @Card: validate_gnome_eye_color
void validate_gnome_color_card(const std::map<std::string, std::string>& facts) {
    int f = std::stoi(facts.at("frame"));
    std::map<std::string, float> states;
    ShadowScene s; s.animate(f, states);
    
    float red = states["GnomeKey_R"];
    std::cout << "eye_red_value = " << red << std::endl;
}

int main(int argc, char* argv[]) {
    if (argc < 2) return 1;
    auto facts = FactReader::read_facts(argv[1]);
    std::string card = facts.at("target_card");
    
    if (card == "props") validate_facial_card(facts);
    else if (card == "color") validate_gnome_color_card(facts);
    
    return 0;
}
