#include <iostream>
#include <vector>
#include <string>
#include <cmath>

// Point 155: C++ Plugin Core
// This library provides the high-performance acting logic for the Greenhouse Movie.

extern "C" {
    // Shared State Structure for Actor acting
    struct ActorState {
        float lx, ly, lz;
        float rx, ry, rz;
        float sx, sy, sz;
        bool visible;
    };

    // Main Engine Function
    void calculate_frame_acting(int frame, const char* actor_name, ActorState* out_state) {
        // Default Neutral State
        out_state->lx = out_state->ly = out_state->lz = 0.0f;
        out_state->rx = out_state->ry = out_state->rz = 0.0f;
        out_state->sx = out_state->sy = out_state->sz = 1.0f;
        out_state->visible = false;

        string name = string(actor_name);

        // Branding Scene (1-100)
        if (frame >= 1 && frame <= 100) {
            if (name == "GreenhouseLogo") {
                out_state->visible = true;
                out_state->sz = 1.0f + sin(frame * 0.1f) * 0.1f; // Logo pulse
            }
        }

        // Garden Scene (401-700)
        if (frame >= 401 && frame <= 700) {
            if (name == "Herbaceous") {
                out_state->visible = true;
                out_state->sz = 1.0f + sin(frame * 0.05f) * 0.03f; // Char breathing
            }
        }

        // Shadow Scene (4501-9500)
        if (frame >= 4501 && frame <= 9500) {
            if (name == "GloomGnome") {
                out_state->visible = true;
                out_state->ly = (frame - 4501) * 0.02f; // Approach
            }
        }
    }
}
