#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <filesystem>
#include <algorithm>
#include "../cpp/util/fact_utils.h"
#include "../cpp/util/decorator.h"

namespace fs = std::filesystem;
using namespace Sorrel::Sdd::Util;

// @Card: js_empty_catch_audit
// @Results files_checked, empty_catch_instances, empty_catch_locations

int main() {
    auto env = FactReader::readFacts("environment.facts");
    if (env.count("genetic_js_dir") == 0) { std::cerr << "error = fact missing genetic_js_dir" << std::endl; return 1; }
    std::string js_dir = env.at("genetic_js_dir");

    int files_checked = 0;
    std::vector<std::string> violations;

    if (!fs::exists(js_dir)) { std::cerr << "error = directory missing " << js_dir << std::endl; return 1; }

    for (const auto& entry : fs::directory_iterator(js_dir)) {
        if (entry.path().extension() == ".js") {
            files_checked++;
            std::ifstream file(entry.path());
            std::string line;
            int line_num = 0;
            bool in_catch = false;
            std::string catch_content = "";
            int brace_count = 0;
            int start_line = 0;

            while (std::getline(file, line)) {
                line_num++;
                if (!in_catch) {
                    size_t catch_pos = line.find("catch");
                    if (catch_pos != std::string::npos) {
                        in_catch = true;
                        start_line = line_num;
                        size_t brace_pos = line.find('{', catch_pos);
                        if (brace_pos != std::string::npos) {
                            brace_count = 1;
                            catch_content = line.substr(brace_pos + 1);

                            size_t close_pos = line.find('}', brace_pos);
                            if (close_pos != std::string::npos) {
                                brace_count = 0;
                                std::string content = line.substr(brace_pos + 1, close_pos - brace_pos - 1);
                                content.erase(std::remove_if(content.begin(), content.end(), ::isspace), content.end());
                                if (content.empty()) violations.push_back(entry.path().filename().string() + ":" + std::to_string(start_line));
                                in_catch = false;
                                catch_content = "";
                            }
                        }
                    }
                } else {
                    for (char c : line) {
                        if (c == '{') brace_count++;
                        else if (c == '}') brace_count--;

                        if (brace_count == 0) {
                            in_catch = false;
                            std::string trimmed = catch_content;
                            trimmed.erase(std::remove_if(trimmed.begin(), trimmed.end(), ::isspace), trimmed.end());
                            if (trimmed.find("//") == std::string::npos && trimmed.find("/*") == std::string::npos) {
                                if (trimmed.empty()) violations.push_back(entry.path().filename().string() + ":" + std::to_string(start_line));
                            }
                            catch_content = "";
                            break;
                        }
                        catch_content += c;
                    }
                }
            }
        }
    }

    std::cout << "files_checked = " << files_checked << std::endl;
    std::cout << "empty_catch_count = " << violations.size() << std::endl;
    std::cout << "empty_catch_locations = "; for (const auto& v : violations) std::cout << v << " "; std::cout << std::endl;

    return 0;
}
