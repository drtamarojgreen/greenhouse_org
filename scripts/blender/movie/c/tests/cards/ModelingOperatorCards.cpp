#include <iostream>
#include <map>
#include <string>
#include "../cpp/util/FactReader.hpp"
#include "../../include/GeometryOps.hpp"

// @Card: validate_extrude_operator
void validate_extrude_card(const std::map<std::string, std::string>& facts) {
    BModeler::Mesh m;
    m.add_vertex(0,0,0); m.add_vertex(1,0,0); m.add_vertex(1,0,1); m.add_vertex(0,0,1);
    m.add_quad(0, 1, 2, 3);
    
    int initial_v = m.vertices.size();
    BModeler::Operators::extrude_face(m, 0, 1.0f);
    
    bool correct = (m.vertices.size() == initial_v + 4);
    std::cout << "extrude_vertex_count = " << m.vertices.size() << std::endl;
    std::cout << "extrude_status = " << (correct ? "PASS" : "FAIL") << std::endl;
}

int main(int argc, char* argv[]) {
    if (argc < 2) return 1;
    auto facts = FactReader::read_facts(argv[1]);
    validate_extrude_card(facts);
    return 0;
}
