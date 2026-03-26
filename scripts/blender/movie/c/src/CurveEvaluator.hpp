#ifndef CURVE_EVALUATOR_HPP
#define CURVE_EVALUATOR_HPP

#include <vector>
#include <algorithm>

// Native Keyframe Animation Evaluator
struct Keyframe {
    float frame;
    float value;
};

class CurveEvaluator {
    std::vector<Keyframe> keys;
public:
    void add_key(float f, float v) {
        keys.push_back({f, v});
        std::sort(keys.begin(), keys.end(), [](const Keyframe& a, const Keyframe& b){ return a.frame < b.frame; });
    }

    float evaluate(float f) {
        if (keys.empty()) return 0.0f;
        if (f <= keys.front().frame) return keys.front().value;
        if (f >= keys.back().frame) return keys.back().value;

        // Linear interpolation between keys
        auto it = std::lower_bound(keys.begin(), keys.end(), f, [](const Keyframe& k, float val){ return k.frame < val; });
        auto k2 = *it;
        auto k1 = *(it - 1);
        
        float t = (f - k1.frame) / (k2.frame - k1.frame);
        return k1.value + t * (k2.value - k1.value);
    }
};

#endif
