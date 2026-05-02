#include <iostream>
#include <fstream>
#include <sstream>
#include <string>
#include <vector>
#include <map>
#include <cmath>
#include <algorithm>
#include <filesystem>
#include "../cpp/util/fact_utils.h"
#include "../cpp/util/decorator.h"

namespace fs = std::filesystem;
using namespace Chai::Cdd::Util;

// @Card: diagnostic_scene_visibility_audit
// @Description: Per-scene diagnostic verifying character visibility based on code geometry.

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
};

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

std::vector<std::string> split(const std::string& s, char delimiter) {
    std::vector<std::string> tokens;
    std::string token;
    std::istringstream tokenStream(s);
    while (std::getline(tokenStream, token, delimiter)) tokens.push_back(trim(token));
    return tokens;
}

int main() {
    auto env   = FactReader::readFacts("environment.facts");
    auto facts = FactReader::readFacts("diagnostic_visibility.facts");
    if (!require_fact(facts, "diagnostic_visibility_active", "true")) return 1;

    std::string lc_path = env.count("lights_camera_path") ? env.at("lights_camera_path") : "../../lights_camera.json";
    std::string mc_path = env.count("config_path") ? env.at("config_path") : "../../movie_config.json";
    double threshold = std::stod(facts.count("visibility_threshold_dot") ? facts.at("visibility_threshold_dot") : "0.85");
    std::vector<std::string> protags = split(facts.at("protagonist_ids"), ',');
    std::string vehicle_id = facts.count("vehicle_id") ? facts.at("vehicle_id") : "";

    std::ifstream lc_file(lc_path);
    std::string lc_content((std::istreambuf_iterator<char>(lc_file)), std::istreambuf_iterator<char>());
    std::ifstream mc_file(mc_path);
    std::string mc_content((std::istreambuf_iterator<char>(mc_file)), std::istreambuf_iterator<char>());

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
                std::vector<std::string> parts = split(pos_str, ',');
                targets[id] = {std::stod(parts[0]), std::stod(parts[1]), std::stod(parts[2])};
            } catch(...) {}
            t_pos = b_end;
        }
    }

    std::map<std::string, Vec3> char_bases;
    for (const auto& name : protags) {
        size_t c_pos = mc_content.find("\"id\": \"" + name + "\"");
        if (c_pos != std::string::npos) {
            size_t p_pos = mc_content.find("\"default_pos\":", c_pos);
            if (p_pos != std::string::npos) {
                size_t b_start = mc_content.find("[", p_pos);
                size_t b_end = mc_content.find("]", b_start);
                std::string pos_str = mc_content.substr(b_start + 1, b_end - b_start - 1);
                try {
                    std::vector<std::string> parts = split(pos_str, ',');
                    char_bases[name] = {std::stod(parts[0]), std::stod(parts[1]), std::stod(parts[2])};
                } catch(...) {}
            }
        }
    }

    std::map<std::string, Camera> cameras;
    size_t cam_arr_start = lc_content.find("\"cameras\":");
    size_t cam_arr_end = lc_content.find("]", cam_arr_start);
    size_t cur = cam_arr_start;
    while ((cur = lc_content.find("{", cur)) != std::string::npos && cur < cam_arr_end) {
        Camera c;
        c.id = find_val(lc_content, "id", cur);
        std::string l_s = find_val(lc_content, "lens", cur);
        try { if (!l_s.empty()) c.lens = std::stod(l_s); } catch(...) {}
        c.target_id = find_val(lc_content, "target", cur);
        size_t p_pos = lc_content.find("\"pos\":", cur);
        if (p_pos != std::string::npos) {
            size_t b_start = lc_content.find("[", p_pos);
            size_t b_end = lc_content.find("]", b_start);
            std::string pos_str = lc_content.substr(b_start + 1, b_end - b_start - 1);
            try {
                std::vector<std::string> parts = split(pos_str, ',');
                c.pos = {std::stod(parts[0]), std::stod(parts[1]), std::stod(parts[2])};
            } catch(...) {}
        }
        cameras[c.id] = c;
        cur = lc_content.find("}", cur) + 1;
    }

    std::vector<std::string> scene_files;
    size_t es_pos = mc_content.find("\"extended_scenes\":");
    if (es_pos != std::string::npos) {
        size_t es_end = mc_content.find("]", es_pos);
        size_t c_s = es_pos;
        while ((c_s = mc_content.find("\"", c_s)) != std::string::npos && c_s < es_end) {
            size_t q_end = mc_content.find("\"", c_s + 1);
            std::string s_path = mc_content.substr(c_s + 1, q_end - c_s - 1);
            if (!s_path.empty()) scene_files.push_back(s_path);
            c_s = q_end + 1;
        }
    }

    fs::path m9_root = fs::path(mc_path).parent_path();

    for (const auto& s_file : scene_files) {
        std::ifstream sf(m9_root / s_file);
        if (!sf.is_open()) continue;
        std::string s_c((std::istreambuf_iterator<char>(sf)), std::istreambuf_iterator<char>());
        
        std::string s_id = find_val(s_c, "scene_id");
        int start = 0, end = 0;
        try {
            start = std::stoi(find_val(s_c, "start_frame"));
            end = std::stoi(find_val(s_c, "end_frame"));
        } catch(...) { continue; }
        
        std::string cam_id = "";
        size_t seq_pos = s_c.find("\"camera_sequence\":");
        if (seq_pos != std::string::npos) cam_id = find_val(s_c, "camera", seq_pos);

        if (cam_id.empty() || !cameras.count(cam_id)) {
            std::cout << s_id << "_error = missing_camera" << std::endl;
            continue;
        }

        Camera& cam = cameras[cam_id];
        int total = end - start + 1;

        auto get_vehicle_pos = [&](int f) {
            Vec3 p = char_bases[vehicle_id];
            if (s_id == "scene_07_forest_drive") {
                size_t d_pos = s_c.find("\"destination_pos\":");
                if (d_pos != std::string::npos) {
                    size_t b_s = s_c.find("[", d_pos);
                    size_t b_e = s_c.find("]", b_s);
                    std::string p_s = s_c.substr(b_s + 1, b_e - b_s - 1);
                    std::vector<std::string> parts = split(p_s, ',');
                    Vec3 dest = {std::stod(parts[0]), std::stod(parts[1]), std::stod(parts[2])};
                    double progress = (double)(f - start) / total;
                    p = p + (dest - p) * progress;
                }
            }
            return p;
        };

        Vec3 checkin_v = get_vehicle_pos(start);
        Vec3 checkout_v = get_vehicle_pos(end);

        std::cout << s_id << "_checkin_frame = " << start << std::endl;
        std::cout << s_id << "_checkout_frame = " << end << std::endl;
        std::cout << s_id << "_camera_id = " << cam_id << std::endl;
        std::cout << s_id << "_camera_checkin_pos = " << cam.pos.x << "," << cam.pos.y << "," << cam.pos.z << std::endl;
        std::cout << s_id << "_vehicle_checkin_pos = " << checkin_v.x << "," << checkin_v.y << "," << checkin_v.z << std::endl;
        std::cout << s_id << "_vehicle_checkout_pos = " << checkout_v.x << "," << checkout_v.y << "," << checkout_v.z << std::endl;

        int visible = 0;
        double min_d = 1.0;
        for (int f = start; f <= end; ++f) {
            Vec3 v_pos = get_vehicle_pos(f);
            Vec3 t_pos = {0,0,0};
            if (targets.count(cam.target_id)) t_pos = targets[cam.target_id];
            else if (cam.target_id == vehicle_id) t_pos = v_pos;
            else if (!protags.empty()) t_pos = char_bases[protags[0]];

            Vec3 look = (t_pos - cam.pos).normalized();
            Vec3 to_obj = (v_pos - cam.pos).normalized();
            double dot = look.dot(to_obj);
            if (dot < min_d) min_d = dot;
            if (dot > threshold) visible++;
        }
        std::cout << s_id << "_min_dot = " << min_d << std::endl;
        std::cout << s_id << "_visibility_ratio = " << (double)visible / total << std::endl;
    }

    return 0;
}
