#include <iostream>
#include <map>
#include <string>
#include <cmath>
#include "../cpp/util/FactReader.hpp"
#include "../../include/SceneNodes.hpp"

// @Card: validate_cinematography
void validate_camera(const std::map<std::string, std::string>& facts) {
    int f = std::stoi(facts.at("frame"));

    // Simulate camera logic
    CameraNode cam(
        std::stof(facts.at("expected_lx")),
        std::stof(facts.at("expected_ly")),
        std::stof(facts.at("expected_lz")),
        std::stof(facts.at("expected_rx")),
        std::stof(facts.at("expected_ry")),
        std::stof(facts.at("expected_rz")),
        std::stof(facts.at("expected_fov"))
    );

    std::map<std::string, float> states;
    cam.animate(f, states);

    float lx = states["Camera_lx"];
    float ly = states["Camera_ly"];
    float lz = states["Camera_lz"];
    float rx = states["Camera_rx"];
    float ry = states["Camera_ry"];
    float rz = states["Camera_rz"];
    float fov = states["Camera_fov"];

    bool pos_ok = (std::abs(lx - std::stof(facts.at("expected_lx"))) < 0.001f &&
                   std::abs(ly - std::stof(facts.at("expected_ly"))) < 0.001f &&
                   std::abs(lz - std::stof(facts.at("expected_lz"))) < 0.001f);

    bool rot_ok = (std::abs(rx - std::stof(facts.at("expected_rx"))) < 0.001f &&
                   std::abs(ry - std::stof(facts.at("expected_ry"))) < 0.001f &&
                   std::abs(rz - std::stof(facts.at("expected_rz"))) < 0.001f);

    bool fov_ok = (std::abs(fov - std::stof(facts.at("expected_fov"))) < 0.001f);

    std::cout << "camera_pos_valid = " << (pos_ok ? "true" : "false") << std::endl;
    std::cout << "camera_rot_valid = " << (rot_ok ? "true" : "false") << std::endl;
    std::cout << "camera_fov_valid = " << (fov_ok ? "true" : "false") << std::endl;
    std::cout << "fov_val = " << fov << std::endl;
}

int main(int argc, char* argv[]) {
    if (argc < 2) return 1;
    auto facts = FactReader::read_facts(argv[1]);
    validate_camera(facts);
    return 0;
}
