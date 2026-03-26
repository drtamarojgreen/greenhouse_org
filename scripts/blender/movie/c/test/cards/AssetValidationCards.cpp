#include <iostream>
#include <map>
#include <string>
#include "../cpp/util/FactReader.hpp"
#include "../../src/SceneNodes.hpp"

// @Card: validate_asset_existence
void validate_asset_card(const std::map<std::string, std::string>& facts) {
    int f = std::stoi(facts.at("frame"));
    std::map<std::string, float> states;
    // We check if the node for this frame populates the asset list
    BrandingScene s; s.animate(f, states);
    
    bool exists = states.count("GreenhouseLogo_vis") > 0;
    std::cout << "asset_status = " << (exists ? "PASS" : "FAIL") << std::endl;
}

int main(int argc, char* argv[]) {
    if (argc < 2) return 1;
    auto facts = FactReader::read_facts(argv[1]);
    std::string card = facts.at("target_card");
    
    if (card == "existence") validate_asset_card(facts);
    
    return 0;
}
