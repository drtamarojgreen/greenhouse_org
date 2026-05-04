#include <iostream>
#include <map>
#include <string>
#include "../cpp/util/FactReader.hpp"
#include "../../include/MeshLoader.hpp"

// @Card: validate_gmesh_loader
void validate_gmesh_card(const std::map<std::string, std::string>& facts) {
    BModeler::Mesh m;
    // Check if loading a non-existent file fails gracefully
    bool success = BModeler::MeshLoader::load_gmesh(m, "test/non_existent.gmesh");
    std::cout << "load_status = " << (success ? "FAIL_TO_FAIL" : "PASS") << std::endl;
}

int main(int argc, char* argv[]) {
    if (argc < 2) return 1;
    auto facts = FactReader::read_facts(argv[1]);
    validate_gmesh_card(facts);
    return 0;
}
