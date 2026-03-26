#include <iostream>
#include <vector>
#include <map>
#include <string>
#include <cmath>
#include "MathCore.hpp"

// C++17 Templated Data-Driven Architecture
enum class AnimType { LINEAR, PULSE, EASE, NOISE, RAMP, STEP, SPIRAL };

struct SceneParams {
    int start, end;
    std::string actor, prop;
    AnimType type;
    float intensity, scale, offset;
};

class SceneNode {
public:
    virtual void animate(int f, std::map<std::string, float>& states) = 0;
    virtual ~SceneNode() = default;
};

template <AnimType T>
class TemplatedScene : public SceneNode {
    SceneParams params;
public:
    TemplatedScene(SceneParams p) : params(p) {}

    void animate(int f, std::map<std::string, float>& states) override {
        if (f < params.start || f > params.end) return;

        states[params.actor + "_vis"] = 1.0f;
        float val = 0.0f;
        float progress = (f - params.start) / (float)(params.end - params.start);

        if constexpr (T == AnimType::LINEAR) {
            val = params.offset + progress * params.intensity;
        } else if constexpr (T == AnimType::PULSE) {
            val = 1.0f + MovieMath::looping_noise(f, params.scale, params.intensity);
        } else if constexpr (T == AnimType::EASE) {
            val = params.offset + MovieMath::ease_in_out(progress) * params.intensity;
        } else if constexpr (T == AnimType::NOISE) {
            val = MovieMath::looping_noise(f, params.scale, params.intensity);
        } else if constexpr (T == AnimType::RAMP) {
            val = params.offset + MovieMath::quadratic_ramp(progress) * params.intensity;
        } else if constexpr (T == AnimType::STEP) {
            val = (progress > 0.5f) ? params.intensity : params.offset;
        } else if constexpr (T == AnimType::SPIRAL) {
            float angle = progress * params.scale;
            val = params.intensity * cos(angle); // Simplified spiral component
        }

        states[params.actor + "_" + params.prop] = val;
    }
};
