#include <iostream>
#include <map>
#include "../../src/mesh_math.cpp"
#include "../cpp/util/fact_utils.h"

using namespace Chai::Cdd::Util;

// @Card: validate_tree_generation
// @Is branches == 10
// @Results vertex_count == 10
void validate_tree_generation_card(const std::map<std::string, std::string>& facts) {
    int branches = std::stoi(facts.at("branches"));
    float height = std::stof(facts.at("height"));
    float radius = std::stof(facts.at("radius"));

    auto mesh = Movie::MeshMath::generate_tree_geometry(branches, height, radius);
    
    std::cout << "vertex_count = " << mesh.vertices.size() << std::endl;
}

// @Card: validate_vein_intensities
// @Is point_count == 100
// @Results point_count_match == true
void validate_vein_intensities_card(const std::map<std::string, std::string>& facts) {
    int point_count = std::stoi(facts.at("point_count"));
    float time = std::stof(facts.at("time"));

    auto intensities = Movie::MeshMath::calculate_vein_intensities(point_count, time);
    
    std::cout << "point_count_match = " << (intensities.size() == (size_t)point_count ? "true" : "false") << std::endl;
}

int main(int argc, char* argv[]) {
    auto facts = FactReader::readFacts("test/facts/mesh_math.facts");
    if (facts.empty()) {
        return 1;
    }

    if (argc > 1 && std::string(argv[1]) == "veins") {
        validate_vein_intensities_card(facts);
    } else {
        validate_tree_generation_card(facts);
    }
    return 0;
}
