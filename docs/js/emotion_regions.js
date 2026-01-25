/**
 * @file emotion_regions.js
 * @description Enhancements for Modeling Emotional Regulation in the Emotion Simulation.
 * Part of the 100 enhancements project.
 */

(function () {
    'use strict';

    const emotionalRegulationEnhancements = [
        { id: 1, name: 'PFC-Amygdala Inhibitory Circuit', description: 'Visualization of descending inhibitory pathways from the Prefrontal Cortex to the Amygdala to model top-down regulation.', regions: ['prefrontalCortex', 'amygdala'] },
        { id: 2, name: 'Dynamic HRV Biofeedback Loop', description: 'A simulated Heart Rate Variability (HRV) monitor that influences the intensity of emotional "noise" in the model.', regions: ['hypothalamus'] },
        { id: 3, name: 'Attentional Deployment Filter', description: 'A slider to simulate shifting focus away from negative stimuli, reducing Amygdala activation.', regions: ['amygdala'] },
        { id: 4, name: 'Cognitive Reappraisal Toggle', description: 'Allows users to "re-label" a stimulus (e.g., "challenge" vs "threat"), altering the Hippocampus-to-Amygdala signaling.', regions: ['hippocampus', 'amygdala'] },
        { id: 5, name: 'Situation Modification Simulation', description: 'Interactive toggle to change the virtual "environment" to observe effects on physiological arousal.', regions: ['hypothalamus'] },
        { id: 6, name: 'Vagal Tone Indicator', description: 'Visual representation of the Vagus nerve\'s influence on the Hypothalamus and heart rate.', regions: ['hypothalamus', 'brainstem'] },
        { id: 7, name: 'DMN vs CEN Switching', description: 'Demonstration of switching from the Default Mode Network (rumination) to the Central Executive Network (task-focus).', regions: ['prefrontalCortex'] },
        { id: 8, name: 'Glutamate/GABA Balance Meter', description: 'A dashboard showing the ratio of excitatory (Glutamate) to inhibitory (GABA) neurotransmitters.', regions: ['thalamus'] },
        { id: 9, name: 'Cortisol Spike Visualization', description: 'Modeling the HPA axis release of cortisol and its feedback inhibition on the Hippocampus.', regions: ['hypothalamus', 'hippocampus'] },
        { id: 10, name: 'Oxytocin Social Buffering', description: 'Interactive "social support" button that triggers Oxytocin release to dampen the stress response.', regions: ['hypothalamus', 'amygdala'] },
        { id: 11, name: 'Sleep Deprivation Effect Mode', description: 'A mode that reduces PFC control efficiency, simulating the impact of fatigue on emotional regulation.', regions: ['prefrontalCortex', 'amygdala'] },
        { id: 12, name: 'Interoceptive Awareness Scale', description: 'Tool to simulate the Insula\'s role in sensing internal bodily states and its subsequent impact on emotion.', regions: ['thalamus'] },
        { id: 13, name: 'Extinction Learning Map', description: 'Visualization of the Ventromedial Prefrontal Cortex (vmPFC) facilitating new "safety" memories.', regions: ['prefrontalCortex'] },
        { id: 14, name: 'Amygdala Habituation Graph', description: 'Real-time tracking of the decrease in Amygdala response over repeated exposure to a stimulus.', regions: ['amygdala'] },
        { id: 15, name: 'Neuroplasticity Visualization', description: 'Displaying dendritic growth in the PFC resulting from repeated "regulation" exercises.', regions: ['prefrontalCortex'] },
        { id: 16, name: 'Thalamic Gating Control', description: 'Simulation of the Thalamus filtering sensory input before it reaches the emotional centers.', regions: ['thalamus'] },
        { id: 17, name: 'Top-Down vs Bottom-Up Toggle', description: 'Ability to switch between PFC-led (top-down) and sensory-led (bottom-up) emotional processing.', regions: ['prefrontalCortex', 'amygdala'] },
        { id: 18, name: 'Limbic-Somatosensory Integration', description: 'Modeling how physical "gut feelings" are mapped to specific emotional states in the brain.', regions: ['thalamus', 'amygdala'] },
        { id: 19, name: 'Response Modulation Delay', description: 'A "pause" mechanic between stimulus and response to model the "stop and think" regulation strategy.', regions: ['prefrontalCortex'] },
        { id: 20, name: 'Emotional Granularity Tool', description: 'A mapper showing how naming an emotion precisely (labeling) reduces Amygdala firing.', regions: ['amygdala', 'prefrontalCortex'] },
        { id: 21, name: 'Anterior Cingulate Cortex (ACC) Highlight', description: 'Visualization of the ACC\'s role in detecting conflicts between emotional impulses and goals.', regions: ['prefrontalCortex'] },
        { id: 22, name: 'Dopamine Reward Prediction Error', description: 'Visualization of how unexpected positive outcomes regulate mood via the Ventral Striatum.', regions: ['thalamus', 'hypothalamus'] },
        { id: 23, name: 'Serotonin Baseline Modulator', description: 'Slider to adjust overall serotonin levels to observe effects on emotional stability.', regions: ['brainstem'] },
        { id: 24, name: 'Circadian Rhythm Sync', description: 'Modeling how the Suprachiasmatic Nucleus influences emotional volatility over a 24-hour cycle.', regions: ['hypothalamus'] },
        { id: 25, name: 'Allostatic Load Tracker', description: 'A cumulative stress meter showing system wear and tear from repeated regulation failures.', regions: ['hypothalamus', 'hippocampus'] }
    ];

    if (window.GreenhouseEmotionConfig) {
        window.GreenhouseEmotionConfig.regulations = emotionalRegulationEnhancements;
    }
})();
