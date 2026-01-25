/**
 * @file emotion_theories.js
 * @description Advanced Theories on Emotional Regulation and Resilience from World Philosophy.
 * Part of the 100 enhancements project, mapping theories to mental health wellness and resilience factors.
 */

(function () {
    'use strict';

    const advancedTheories = [
        { id: 76, name: 'Stoic Pre-meditation of Evils', description: 'Praemeditatio Malorum: Mentally rehearsing potential challenges to diminish their emotional impact and build resilience.', regions: ['prefrontalCortex', 'amygdala'], wellnessFocus: 'Proactive Resilience', conditionMapping: 'Anticipatory Anxiety' },
        { id: 77, name: 'Aristotelian Tripartite Soul', description: 'The hierarchy of Nutritive, Sensitive, and Rational souls, modeling the transition from instinct to reason.', regions: ['brainstem', 'hypothalamus', 'prefrontalCortex'], wellnessFocus: 'Hierarchical Regulation', conditionMapping: 'Developmental Trauma' },
        { id: 78, name: 'Epicurean Ataraxia', description: 'The state of robust tranquility and freedom from distress achieved by understanding the nature of desire.', regions: ['prefrontalCortex'], wellnessFocus: 'Tranquility', conditionMapping: 'Chronic Dissatisfaction / Stress' },
        { id: 79, name: 'Nietzschean Amor Fati', description: '"Love of Fate": The radical acceptance of all life’s experiences, including suffering, as necessary and good.', regions: ['prefrontalCortex', 'hippocampus'], wellnessFocus: 'Radical Acceptance', conditionMapping: 'Resentment and Adjustment Disorders' },
        { id: 80, name: 'Taoist Principle of Wu Wei', description: '"Effortless Action": Modeling the optimal state of flow where internal resistance is minimized through alignment with nature.', regions: ['hypothalamus'], wellnessFocus: 'State of Flow', conditionMapping: 'Burnout and Performance Anxiety' },
        { id: 81, name: 'Spinoza’s Affects', description: 'The transition between Ratio (reason) and Intuition to transform passive passions into active emotions.', regions: ['prefrontalCortex', 'amygdala'], wellnessFocus: 'Emotional Transformation', conditionMapping: 'Passive Affectivity' },
        { id: 82, name: 'Platonic Chariot Allegory', description: 'Visualization of the Charioteer (Reason) guiding the two horses of Spirit and Appetite.', regions: ['amygdala', 'prefrontalCortex'], wellnessFocus: 'Self-Governance', conditionMapping: 'Dysregulated Impulses' },
        { id: 83, name: 'Ubuntu Philosophy', description: '"I am because we are": Modeling the reduced neurological cost of regulation through communal connection.', regions: ['hypothalamus', 'amygdala'], wellnessFocus: 'Communal Support', conditionMapping: 'Loneliness and Depression' },
        { id: 84, name: 'Confucian Ren', description: 'The cultivation of Benevolence and Humaneness as a core regulatory "shield" for social resilience.', regions: ['prefrontalCortex'], wellnessFocus: 'Altruistic Resilience', conditionMapping: 'Social Antagonism' },
        { id: 85, name: 'Heraclitean Panta Rhei', description: '"Everything Flows": Linking the belief in constant change (Flux) to increased PFC flexibility during challenges.', regions: ['prefrontalCortex'], wellnessFocus: 'Cognitive Flexibility', conditionMapping: 'Rigid Thinking' },
        { id: 86, name: 'Hume’s Passions and Reason', description: 'Exploring the idea that "Reason is a slave to the passions," and its implications for emotional labeling.', regions: ['hypothalamus', 'prefrontalCortex'], wellnessFocus: 'Affective Self-Awareness', conditionMapping: 'Emotional Blindness' },
        { id: 87, name: 'Buddhist Mindfulness (Sati)', description: 'Simulating the reduction of "Mental Proliferation" (Papanca) through bare, non-judgmental awareness.', regions: ['prefrontalCortex'], wellnessFocus: 'Present-Moment Awareness', conditionMapping: 'Generalized Anxiety / Worry' },
        { id: 88, name: 'Existentialist Authenticity', description: 'Mapping the drive for Autonomy and radical responsibility to Dopamine and Oxytocin pathways.', regions: ['thalamus', 'hypothalamus'], wellnessFocus: 'Self-Determination', conditionMapping: 'Anomie / Purposefulness' },
        { id: 89, name: 'Kantian Categorical Imperative', description: 'Modeling the neurological conflict between universal moral laws and impulsive emotional actions.', regions: ['prefrontalCortex', 'amygdala'], wellnessFocus: 'Moral Integrity', conditionMapping: 'Impulsivity' },
        { id: 90, name: 'Stoic Dichotomy of Control', description: 'Visualizing the "Giving Up" of what is outside our control vs focused resilient action on what is within.', regions: ['brainstem', 'prefrontalCortex'], wellnessFocus: 'Internal Locus of Control', conditionMapping: 'Helplessness and Frustration' },
        { id: 91, name: 'Zen Non-Attachment', description: 'The PFC’s role in predicting future states while remaining detached from the "Impact Bias" of desire.', regions: ['prefrontalCortex'], wellnessFocus: 'Equanimity', conditionMapping: 'Craving and Addiction' },
        { id: 92, name: 'Zoroastrian Dualism', description: 'Modeling the mental interaction between Asha (Order/Truth) and Druj (Deceit/Chaos).', regions: ['prefrontalCortex', 'amygdala'], wellnessFocus: 'Ethical Resilience', conditionMapping: 'Moral Dissonance' },
        { id: 93, name: 'Buddhist Sunyata', description: '"Emptiness": Showing the brain predicting emotion as "Empty" constructs rather than fixed realities.', regions: ['prefrontalCortex', 'hippocampus'], wellnessFocus: 'Constructivist Insight', conditionMapping: 'Emotional Essentialism' },
        { id: 94, name: 'The Middle Way', description: 'Madhyamaka: A visual "gauge" showing the path between the extremes of self-indulgence and self-mortification.', regions: ['hypothalamus'], wellnessFocus: 'Moderation', conditionMapping: 'Binge-Purge Cycles' },
        { id: 95, name: 'Seven Generations Principle', description: 'Indigenous North American philosophy modeling biological sensitivity across deep time and ancestry.', regions: ['amygdala', 'prefrontalCortex'], wellnessFocus: 'Intergenerational Resilience', conditionMapping: 'Ancestral / Epigenetic Trauma' },
        { id: 96, name: 'Socratic Eudaimonia', description: 'The neurological signature of "Meaning-based" flourishing vs "Pleasure-based" transient happiness.', regions: ['prefrontalCortex', 'thalamus'], wellnessFocus: 'Eudaimonic Wellness', conditionMapping: 'Anhedonia' },
        { id: 97, name: 'Buber’s I-Thou Relationship', description: 'Modeling the "Secure Base" and its effect on internal regulatory working models through dialogue.', regions: ['amygdala', 'hypothalamus'], wellnessFocus: 'Relational Safety', conditionMapping: 'Attachment Disorders' },
        { id: 98, name: 'Hegelian Dialectic', description: 'The brain’s attempt to resolve contradiction through the synthesis of stability and change.', regions: ['prefrontalCortex'], wellnessFocus: 'Synthesis of Opposites', conditionMapping: 'Ambivalence' },
        { id: 99, name: 'Schopenhauer’s Compassion', description: 'Modeling the Mirror Neuron System’s role in recognizing the "Oneness of Will" in others.', regions: ['prefrontalCortex', 'amygdala'], wellnessFocus: 'Empathy', conditionMapping: 'Narcissistic traits' },
        { id: 100, name: 'Taoist Yin and Yang', description: 'Visualizing how managed exposure to opposing forces (Stress/Rest) strengthens the whole system.', regions: ['prefrontalCortex', 'amygdala'], wellnessFocus: 'Antifragility', conditionMapping: 'Fragility under Stress' }
    ];

    if (window.GreenhouseEmotionConfig) {
        window.GreenhouseEmotionConfig.advancedTheories = advancedTheories;
    }
})();
