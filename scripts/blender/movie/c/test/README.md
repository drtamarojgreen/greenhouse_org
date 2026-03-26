# Greenhouse Chai Training: The Verification Truth

## The Core Concept
We use **Chai-Driven Development (CDD)** to prove the code isn't lying about its state. If a fact says "Frame 50: Actor X is at Z=10," these tests prove it.

## The Honest Truth
- **Logic ONLY**: These tests verify math, not art. You can have a "PASS" on every card while the character is a mangled mess of vertices, as long as the *origin point* is correct.
- **Blind to "Glitches"**: Our tests cannot see texture flickering, lighting artifacts, or z-fighting. 
- **The "Facts" are Hardcoded**: If the production requirements change in Blender, these facts become lies until a human updates them. They are a *snapshot of truth*, not a dynamic oracle.
- **No Performance Testing**: We check if the math is right, but not if it's slow. A 100ms logic loop passes the same as a 1ns template.

## The Aspiration
To bridge the gap between "Math Truth" and "Visual Truth" via automated pixel-comparisons and automated fact-generation from the Blender master file.

---
*Verification without the Bullshit.*
