# Scene 5: The Glasshouse Grumble (Expanded)

## Technical Production Notes
- **Assets**: Characters are generated via `plant_humanoid_v5.py`.
- **Character Enhancements**:
    - **Herbaceous**: Features larger, vibrant lavender-hued leaves and a bright green stem.
    - **Arbor**: Features weathered mahogany bark and a distinct mole on the right side of the face.
    - **Facial Details**: Both characters now have simple white teeth visible within the mouth cavity during expressive speech and laughter.
- **Props**: A new `props_v5/` directory (adjacent to `assets_v5/`) contains procedural assets. 
    - **Watercan**: A classic blue watering can.
    - **Garden Hose**: A flexible green hose with a brass nozzle.
- **Animation Systems**:
    - **Bend Down & Grasp**: Procedural logic to align character torso and hand bones with prop origins.
    - **Prop Attachment**: Dynamic `Child-Of` constraints to synchronize prop movement with character hands.

### Act III: Celebration & The Verdant Dance (Frames 3600–4200)
- **Scene**: Both characters realize they are safe and healthy.
- **Action**:
    - **Frame 3600**: Herbaceous and Arbor turn simultaneously to face the front (the "audience"/WIDE camera).
    - **Frames 3605–4150**: The **Vegetative Groove**. Both characters perform a synchronized dance involving arm waving and rhythmic bobbing.
    - **Camera**: Fixed WIDE shot capturing the full height of both plants.
    - **Frame 4150**: The dance concludes.
    - **Frame 4150–4200**: Characters slowly turn back to face each other with peaceful smiles before the scene fades to black.

---

### Phase 1: The Sprouting Anxiety (0 - 1200 Frames)

**Herbaceous**: "Arbor, do you ever feel like your sap is just... running thin? No matter how much sunlight I get, my leaves still feel heavy."
*(Herbaceous droops their head slightly and shivers. Eyes darting nervously. (shiver, droop, worry). HERBACEOUS_V5)*

**Arbor**: "It happens to the best of us, little sprout. The seasons change, and sometimes the internal pressure drops. You’re not wilting; you’re just adjusting."
*(Arbor nods slowly and reaches out with an arm towards Herbaceous. (nod, reach_out, relief). ARBOR_V5)*

**Herbaceous**: "But the others... they look so vibrant. They’re branching out so quickly, and I’m just trying to keep my stem straight."
*(Herbaceous looks down, arms held close to torso. (look_down, worry). HERBACEOUS_V5)*

**Arbor**: "Wait, you're getting a bit pale. Let me help."
*(Arbor bends down (bend_down), grasps a nearby **Watercan** (grasp), and brings it closer.)*

---

### Phase 2: Rooted Wisdom (1200 - 2400 Frames)

**Arbor**: "Comparison is the parasite that kills the bloom. Remember, your roots are deeper than you think. Use this to find your strength again."
*(Arbor stands tall, offering the watercan. (stretch). ARBOR_V5)*

**Herbaceous**: "Connected... I forget that sometimes. When the soil gets dry, it feels like I’m in a pot by myself."
*(Herbaceous takes the watercan, their large lavender leaves fluttering. (joyful). HERBACEOUS_V5)*

**Arbor**: "Then reach out! Or better yet, I'll bring the source to you."
*(Arbor pulls out a **Garden Hose** (grasp). Both characters share a wide laugh, showing their **teeth**. (joyful, smile))*

---

### Phase 3: The Resilient Bloom (2400 - 3600 Frames)

**Herbaceous**: "I think I feel a bit more... turgid. Like the water is finally reaching my top-most leaves."
*(Herbaceous stretches upwards, arms reaching for the glass ceiling. (stretch, relief). HERBACEOUS_V5)*

**Arbor**: "There it is. That's the pulse. You just needed to remember that even the oldest oak was once a sprout who felt a bit unstable."
*(Arbor beams with pride, arms waving slowly in the air. His **mole** twitches with a smile. (smile, celebrate). ARBOR_V5)*

**Herbaceous**: "Thanks, Arbor. I might just make it to the next harvest after all."
*(Herbaceous does a small happy wiggle. (wiggle, joyful). HERBACEOUS_V5)*

---

### New Animation Definitions
- **shiver**: High-frequency, low-amplitude vibration of the torso and limbs.
- **droop**: Gradual lowering of the head and upper torso.
- **stretch**: An expansive movement raising the head and extending the arms.
- **wiggle**: A rhythmic, side-to-side torso and hip sway.
- **reach_out**: One arm extends supportively.
- **bend_down**: Torso pitches forward significantly to reach the ground.
- **grasp**: Hand fingers curl and a `Child-Of` constraint is applied to the target prop.

### New Facial Expressions
- **worry**: Eyebrows pulled together and up, lip corners slightly lowered.
- **relief**: Softening of the face, returning to neutral.
- **joyful**: High eyebrows, wide smile (teeth visible), and pupil dilation.
