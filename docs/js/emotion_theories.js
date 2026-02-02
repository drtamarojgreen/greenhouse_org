/**
 * @file emotion_theories.js
 * @description Advanced Theories on Emotional Regulation and Resilience.
 * Part of the 100 enhancements project, mapping theories to mental health wellness and resilience factors.
 */

(function () {
    'use strict';

    const advancedTheories = [
        { id: 76, name: 'emotion_theory_gross_name', description: 'emotion_theory_gross_desc', regions: ['prefrontalCortex', 'amygdala'], wellnessFocus: 'Proactive Resilience', conditionMapping: 'Dysregulation' },
        { id: 77, name: 'emotion_theory_polyvagal_name', description: 'emotion_theory_polyvagal_desc', regions: ['brainstem', 'hypothalamus', 'prefrontalCortex'], wellnessFocus: 'Hierarchical Regulation', conditionMapping: 'Trauma' },
        { id: 78, name: 'Broaden-and-Build Visualization', description: 'Showing how positive emotions expand the "Thought-Action Repertoire" in the Neocortex.', regions: ['prefrontalCortex'], wellnessFocus: 'Expansion', conditionMapping: 'Depression' },
        { id: 79, name: 'Post-Traumatic Growth Pillars', description: 'Modeling growth in areas like Strength, Relationships, and New Possibilities after adversity.', regions: ['prefrontalCortex', 'hippocampus'], wellnessFocus: 'Acceptance', conditionMapping: 'Adjustment' },
        { id: 80, name: 'Yerkes-Dodson Performance Curve', description: 'Interactive graph showing the optimal level of arousal for cognitive performance.', regions: ['hypothalamus'], wellnessFocus: 'Flow State', conditionMapping: 'Performance Anxiety' },
        { id: 81, name: 'Lazarus Cognitive Appraisal Model', description: 'Primary (Threat Assessment) and Secondary (Coping Resource Assessment) appraisal toggles.', regions: ['prefrontalCortex', 'amygdala'], wellnessFocus: 'Transformation', conditionMapping: 'Appraisal Bias' },
        { id: 82, name: 'Evolutionary "Fear Module"', description: 'Highlighting "Old Brain" structures (Amygdala/Hypothalamus) vs "New Brain" (Neocortex) evolution.', regions: ['amygdala', 'prefrontalCortex'], wellnessFocus: 'Governance', conditionMapping: 'Impulses' },
        { id: 83, name: 'Social Baseline Theory', description: 'Showing how the presence of social support reduces the "Neurological Cost" of regulation.', regions: ['hypothalamus', 'amygdala'], wellnessFocus: 'Support', conditionMapping: 'Isolation' },
        { id: 84, name: 'Resilience Portfolio Model', description: 'Visualizing "Protective Factors" (Social, Regulatory, Meaning-making) as a protective shield.', regions: ['prefrontalCortex'], wellnessFocus: 'Protection', conditionMapping: 'Fragility' },
        { id: 85, name: 'Dweck’s Growth Mindset', description: 'Linking the belief in "Changeability" to increased PFC activity during challenging tasks.', regions: ['prefrontalCortex'], wellnessFocus: 'Flexibility', conditionMapping: 'Rigidity' },
        { id: 86, name: 'Two-Factor Theory (Schachter-Singer)', description: 'Interactive "Arousal" + "Cognitive Label" = "Emotion" mixer.', regions: ['hypothalamus', 'prefrontalCortex'], wellnessFocus: 'Awareness', conditionMapping: 'Blindness' },
        { id: 87, name: 'Cognitive Load Theory', description: 'Demonstrating how high cognitive load (multitasking) impairs emotional regulation capacity.', regions: ['prefrontalCortex'], wellnessFocus: 'Moment Awareness', conditionMapping: 'Generalized Anxiety' },
        { id: 88, name: 'Self-Determination Theory (SDT)', description: 'Mapping Autonomy, Competence, and Relatedness to Dopamine and Oxytocin pathways.', regions: ['thalamus', 'hypothalamus'], wellnessFocus: 'Determination', conditionMapping: 'Purposefulness' },
        { id: 89, name: 'Moral Injury Modeling', description: 'Showing the neurological conflict between "Core Values" and "Compromising Actions.', regions: ['prefrontalCortex', 'amygdala'], wellnessFocus: 'Integrity', conditionMapping: 'Impulsivity' },
        { id: 90, name: 'Learned Helplessness vs Optimism', description: 'Modeling the "Giving Up" response in the Dorsal Raphe Nucleus vs resilient responses.', regions: ['brainstem', 'prefrontalCortex'], wellnessFocus: 'Control', conditionMapping: 'Helplessness' },
        { id: 91, name: 'Affective Forecasting', description: 'Showing the PFC\'s role in predicting future emotional states and the "Impact Bias" error.', regions: ['prefrontalCortex'], wellnessFocus: 'Equanimity', conditionMapping: 'Craving' },
        { id: 92, name: 'Dual-Process Theory', description: 'Modeling the interaction between System 1 (Intuitive/Emotional) and System 2 (Analytical/Regulatory).', regions: ['prefrontalCortex', 'amygdala'], wellnessFocus: 'Resilience', conditionMapping: 'Moral Dissonance' },
        { id: 93, name: 'Constructed Emotion Theory', description: 'Showing the brain "Predicting" emotion based on past concepts rather than just reacting.', regions: ['prefrontalCortex', 'hippocampus'], wellnessFocus: 'Insight', conditionMapping: 'Essentialism' },
        { id: 94, name: 'Windows of Tolerance', description: 'A visual "gauge" showing the zone of optimal arousal vs Hyper-arousal and Hypo-arousal.', regions: ['hypothalamus'], wellnessFocus: 'Moderation', conditionMapping: 'Binge-Purge' },
        { id: 95, name: 'Biological Sensitivity to Context', description: 'Modeling "Orchid" (High Sensitivity) vs "Dandelion" (High Resilience) genetic types.', regions: ['amygdala', 'prefrontalCortex'], wellnessFocus: 'Resilience', conditionMapping: 'Ancestral Trauma' },
        { id: 96, name: 'Eudaimonic vs Hedonic Wellbeing', description: 'Showing different neurological signatures for "Meaning-based" vs "Pleasure-based" happiness.', regions: ['prefrontalCortex', 'thalamus'], wellnessFocus: 'Wellness', conditionMapping: 'Anhedonia' },
        { id: 97, name: 'Attunement and Attachment Theory', description: 'Modeling the "Secure Base" and its effect on internal regulatory working models.', regions: ['amygdala', 'hypothalamus'], wellnessFocus: 'Safety', conditionMapping: 'Attachment Disorders' },
        { id: 98, name: 'Allostasis and Predictive Processing', description: 'Showing the brain\'s attempt to minimize "Prediction Error" through emotional regulation.', regions: ['prefrontalCortex'], wellnessFocus: 'Synthesis', conditionMapping: 'Ambivalence' },
        { id: 99, name: 'Emotional Contagion Mechanism', description: 'Modeling the Mirror Neuron System\'s role in synchronizing with others\' emotional states.', regions: ['prefrontalCortex', 'amygdala'], wellnessFocus: 'Empathy', conditionMapping: 'Narcissistic traits' },
        { id: 100, name: 'Antifragility Framework', description: 'Showing how managed exposure to stressors strengthens the regulatory system over time.', regions: ['prefrontalCortex', 'amygdala'], wellnessFocus: 'Antifragility', conditionMapping: 'Fragility' }
    ];

    if (window.GreenhouseEmotionConfig) {
        window.GreenhouseEmotionConfig.advancedTheories = advancedTheories;
    }
})();
