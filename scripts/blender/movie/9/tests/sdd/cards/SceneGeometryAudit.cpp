#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <map>
#include <cmath>
#include <algorithm>
#include "../cpp/util/fact_utils.h"
#include "../cpp/util/decorator.h"

using namespace Sorrel::Sdd::Util;

// @Card: scene_geometry_audit
// @Description: Performs geometric analysis of camera frustums vs character positions and verifies lighting/target presence.

struct Vec3 { 
    double x, y, z; 
    Vec3 operator-(const Vec3& v) const { return {x-v.x, y-v.y, z-v.z}; }
    Vec3 operator+(const Vec3& v) const { return {x+v.x, y+v.y, z+v.z}; }
    Vec3 operator*(double s) const { return {x*s, y*s, z*s}; }
    double length() const { return std::sqrt(x*x + y*y + z*z); }
    Vec3 normalized() const { double l = length(); if (l < 1e-6) return {0,0,0}; return {x/l, y/l, z/l}; }
    double dot(const Vec3& v) const { return x*v.x + y*v.y + z*v.z; }
};

struct Camera {
    std::string id;
    Vec3 pos; 
    std::string target_id;
    double lens = 35.0;
    std::vector<Vec3> anim_points;
};

// Improved JSON-like value extractor
std::string find_val(const std::string& content, const std::string& key, size_t start_pos = 0) {
    size_t pos = content.find("\"" + key + "\":", start_pos);
    if (pos == std::string::npos) return "";
    size_t val_start = content.find_first_not_of(" \t\n\r:", pos + key.length() + 2);
    if (val_start == std::string::npos) return "";
    size_t val_end;
    if (content[val_start] == '\"') {
        val_start++;
        val_end = content.find('\"', val_start);
    } else {
        val_end = content.find_first_of(" \t\n\r,]}\n", val_start);
    }
    if (val_end == std::string::npos) val_end = content.length();
    std::string val = content.substr(val_start, val_end - val_start);
    val.erase(std::remove_if(val.begin(), val.end(), [](char c){ 
        return c == '\"' || c == ',' || c == ']' || c == '}' || c == '\r' || c == '\n'; 
    }), val.end());
    return val;
}

int main() {
    auto env   = FactReader::readFacts("environment.facts");
    auto facts = FactReader::readFacts("scene_geometry.facts");
    if (!require_fact(facts, "scene_geometry_audited", "true")) return 1;

    std::string lc_path = env.count("lights_camera_path") ? env.at("lights_camera_path") : "../../lights_camera.json";
    std::string mc_path = env.count("config_path") ? env.at("config_path") : "../../movie_config.json";

    std::ifstream lc_file(lc_path);
    std::string lc_content((std::istreambuf_iterator<char>(lc_file)), std::istreambuf_iterator<char>());
    std::ifstream mc_file(mc_path);
    std::string mc_content((std::istreambuf_iterator<char>(mc_file)), std::istreambuf_iterator<char>());

    // 1. Extract focal targets
    std::map<std::string, Vec3> targets;
    size_t t_pos = lc_content.find("\"focal_targets\":");
    if (t_pos != std::string::npos) {
        size_t end_targets = lc_content.find("]", t_pos);
        while ((t_pos = lc_content.find("{", t_pos)) != std::string::npos && t_pos < end_targets) {
            std::string id = find_val(lc_content, "id", t_pos);
            size_t p_pos = lc_content.find("\"pos\":", t_pos);
            size_t b_start = lc_content.find("[", p_pos);
            size_t b_end = lc_content.find("]", b_start);
            std::string pos_str = lc_content.substr(b_start + 1, b_end - b_start - 1);
            try {
                double x = std::stod(pos_str.substr(0, pos_str.find(',')));
                size_t second = pos_str.find(',') + 1;
                double y = std::stod(pos_str.substr(second, pos_str.find(',', second) - second));
                double z = std::stod(pos_str.substr(pos_str.find_last_of(',') + 1));
                targets[id] = {x, y, z};
            } catch(...) {}
            t_pos = b_end;
        }
    }

    // 2. Extract character positions
    std::map<std::string, Vec3> chars;
    for (std::string name : {"Herbaceous", "Arbor"}) {
        size_t c_pos = mc_content.find("\"id\": \"" + name + "\"");
        if (c_pos != std::string::npos) {
            size_t p_pos = mc_content.find("\"default_pos\":", c_pos);
            if (p_pos != std::string::npos) {
                size_t b_start = mc_content.find("[", p_pos);
                size_t b_end = mc_content.find("]", b_start);
                std::string pos_str = mc_content.substr(b_start + 1, b_end - b_start - 1);
                try {
                    double x = std::stod(pos_str.substr(0, pos_str.find(',')));
                    size_t second = pos_str.find(',') + 1;
                    double y = std::stod(pos_str.substr(second, pos_str.find(',', second) - second));
                    double z = std::stod(pos_str.substr(pos_str.find_last_of(',') + 1));
                    chars[name] = {x, y, z};
                } catch(...) {}
            }
        }
    }

    // 3. Extract cameras
    std::map<std::string, Camera> cameras;
    size_t cam_arr_start = lc_content.find("\"cameras\":");
    size_t cam_arr_end = lc_content.find("]", cam_arr_start);
    size_t cur = cam_arr_start;
    while ((cur = lc_content.find("{", cur)) != std::string::npos && cur < cam_arr_end) {
        Camera c;
        c.id = find_val(lc_content, "id", cur);
        std::string lens_str = find_val(lc_content, "lens", cur);
        try { if (!lens_str.empty()) c.lens = std::stod(lens_str); } catch(...) {}
        c.target_id = find_val(lc_content, "target", cur);
        size_t p_pos = lc_content.find("\"pos\":", cur);
        if (p_pos != std::string::npos) {
            size_t b_start = lc_content.find("[", p_pos);
            size_t b_end = lc_content.find("]", b_start);
            std::string pos_str = lc_content.substr(b_start + 1, b_end - b_start - 1);
            try {
                c.pos.x = std::stod(pos_str.substr(0, pos_str.find(',')));
                size_t second = pos_str.find(',') + 1;
                c.pos.y = std::stod(pos_str.substr(second, pos_str.find(',', second) - second));
                c.pos.z = std::stod(pos_str.substr(pos_str.find_last_of(',') + 1));
            } catch(...) {}
        }
        cameras[c.id] = c;
        cur = lc_content.find("}", cur) + 1;
    }

    // 4. Verification Loop
    int frames_with_lighting = 0, frames_with_target = 0, frames_in_view = 0;
    for (int f = 1; f <= 4800; ++f) {
        bool lighting = (lc_content.find("\"Key\"") != std::string::npos || lc_content.find("\"Sun\"") != std::string::npos);
        if (f <= 3 && lc_content.find("\"Sun\"") == std::string::npos) lighting = false;
        if (lighting) frames_with_lighting++;

        std::string active_cam = (f <= 3) ? "Exterior" : (f <= 503 ? "Wide" : "Ots1");
        if (cameras.count(active_cam)) {
            Camera& cam = cameras[active_cam];
            bool has_target = (!cam.target_id.empty() && (targets.count(cam.target_id) || cam.target_id.find(".Rig") != std::string::npos));
            if (has_target) frames_with_target++;

            Vec3 target_pos = {0,0,0};
            if (targets.count(cam.target_id)) target_pos = targets[cam.target_id];
            else if (cam.target_id.find("Herbaceous") != std::string::npos) target_pos = chars["Herbaceous"] + (Vec3){0,0,1.5};

            Vec3 look_vec = (target_pos - cam.pos).normalized();
            bool in_view = false;
            for (auto const& [name, cpos] : chars) {
                Vec3 head_pos = cpos + (Vec3){0,0,2.0};
                double dot = look_vec.dot((head_pos - cam.pos).normalized());
                if (dot > 0.85) in_view = true;
            }
            if (in_view) frames_in_view++;
        }
    }

    std::cout << "total_frames = 4800" << std::endl;
    std::cout << "frames_with_lighting = " << frames_with_lighting << std::endl;
    std::cout << "frames_with_target = " << frames_with_target << std::endl;
    std::cout << "frames_in_view = " << frames_in_view << std::endl;
    return 0;
}
