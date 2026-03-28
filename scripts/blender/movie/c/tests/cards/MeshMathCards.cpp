#include <iostream>
#include <map>
#include <string>
#include <cmath>
#include "../cpp/util/FactReader.hpp"
#include "../../include/GeometryCore.hpp"

// @Card: validate_mesh_transform
void validate_mesh_transform(const std::map<std::string, std::string>& facts) {
    BModeler::Mesh mesh;
    float start_x = std::stof(facts.at("start_x"));
    float start_y = std::stof(facts.at("start_y"));
    float start_z = std::stof(facts.at("start_z"));
    mesh.add_vertex(start_x, start_y, start_z);

    float dx = std::stof(facts.at("dx"));
    float dy = std::stof(facts.at("dy"));
    float dz = std::stof(facts.at("dz"));

    mesh.transform(dx, dy, dz);

    std::cout << "result_x = " << mesh.soa.x[0] << std::endl;
    std::cout << "result_y = " << mesh.soa.y[0] << std::endl;
    std::cout << "result_z = " << mesh.soa.z[0] << std::endl;
}

int main(int argc, char* argv[]) {
    if (argc < 2) return 1;
    auto facts = FactReader::read_facts(argv[1]);
    validate_mesh_transform(facts);
    return 0;
}
