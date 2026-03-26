#include <iostream>
#include <map>
#include <string>
#include <vector>
#include "../cpp/util/FactReader.hpp"
#include "../../include/AssetManager.hpp"

// @Card: validate_resource_budget
void validate_resource_budget(const std::map<std::string, std::string>& facts) {
    size_t vert_count = std::stoull(facts.at("vertex_count"));
    size_t max_budget = std::stoull(facts.at("max_vertex_budget"));

    bool within_budget = vert_count <= max_budget;
    std::cout << "within_budget = " << (within_budget ? "true" : "false") << std::endl;
}

int main(int argc, char* argv[]) {
    if (argc < 2) return 1;
    auto facts = FactReader::read_facts(argv[1]);
    validate_resource_budget(facts);
    return 0;
}
