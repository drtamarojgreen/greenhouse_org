#ifndef SCENE_NODES_HPP
#define SCENE_NODES_HPP

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
            val = params.intensity * cos(angle);
        }

        states[params.actor + "_" + params.prop] = val;
    }
};

// Concrete Scene Implementations for Testing Functional Parity
class InteractionScene : public SceneNode {
public:
    void animate(int f, std::map<std::string, float>& states) override {
        // Mock Interaction Logic: Influence pulses when talking
        if (f >= 100 && f <= 200) {
            states["Interaction_Influence"] = 1.0f + MovieMath::looping_noise(f, 5.0f, 0.2f);
        } else {
            states["Interaction_Influence"] = 0.0f;
        }
    }
};

class DialogueScene : public SceneNode {
public:
    void animate(int f, std::map<std::string, float>& states) override {
        // Mock Dialogue Logic: Head nods on periodic beats
        if (f >= 300 && f <= 500) {
            states["Dialogue_HeadNod"] = std::abs(std::sin(f * 0.1f));
        } else {
            states["Dialogue_HeadNod"] = 0.0f;
        }
    }
};

class BrandingScene : public SceneNode {
public:
    void animate(int f, std::map<std::string, float>& states) override {
        // Mock Branding Logic: Logo visibility during intro
        if (f >= 1 && f <= 100) {
            states["GreenhouseLogo_vis"] = 1.0f;
            states["GreenhouseLogo_alpha"] = (f < 20) ? f / 20.0f : 1.0f;
        } else {
            states["GreenhouseLogo_vis"] = 0.0f;
        }
    }
};

#endif
