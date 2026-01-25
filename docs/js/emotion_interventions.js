/**
 * @file emotion_interventions.js
 * @description Philosophical and Pharmacological enhancements for the Emotion Simulation.
 * Part of the 100 enhancements project.
 */

(function () {
    'use strict';

    const therapeuticInterventions = [
        { id: 26, name: 'Stoic Socratic Questioning', description: 'Elenchus: Interrogating "Automatic Thoughts" through logic to reveal underlying philosophical errors.', regions: ['prefrontalCortex'] },
        { id: 27, name: 'Aristotelian Phronesis', description: 'Practical Wisdom: The synthesis of the "Sensitive" and "Rational" minds to find the virtuous mean.', regions: ['prefrontalCortex', 'amygdala'] },
        { id: 28, name: 'Zen Breath Counting', description: 'Anapanasati: Synchronizing focus with the breath to stabilize the autonomic nervous system.', regions: ['hypothalamus'] },
        { id: 29, name: 'Buddhist Non-Attachment', description: 'Anatta: Visualization of "detaching" from a fixed self-concept, moving thoughts to the mental periphery.', regions: ['prefrontalCortex'] },
        { id: 30, name: 'Heraclitean Sensory Integration', description: 'Panta Rhei: Modeling the bilateral flow of information to process trauma through sensory rhythm.', regions: ['amygdala', 'hippocampus'] },
        { id: 31, name: 'Stoic Hardship Training', description: 'Voluntary Discomfort: A progressive hierarchy of challenges to build fear extinction and resilience.', regions: ['amygdala', 'prefrontalCortex'] },
        { id: 32, name: 'Pythagorean Temperance', description: 'The use of harmony and proportion to regulate physiological arousal and autonomic balance.', regions: ['hypothalamus'] },
        { id: 33, name: 'Buddhist Metta Module', description: 'Cultivating Loving-Kindness to activate the "Soothe System" and counter threat-based responses.', regions: ['hypothalamus', 'amygdala'] },
        { id: 34, name: 'Confucian Li Scripts', description: 'Linking social propriety and ritual harmony to stress reduction and communal stability.', regions: ['hypothalamus'] },
        { id: 35, name: 'Seneca’s Reflection Practice', description: 'Morning and evening gratitude reviews to activate Dopamine and Serotonin pathways.', regions: ['thalamus', 'prefrontalCortex'] },
        { id: 36, name: 'Epicurean Hedonic Calculus', description: 'Modeling the shift from transient "Negativity Bias" to stable "Katasthēmatikē" pleasure.', regions: ['amygdala', 'thalamus'] },
        { id: 37, name: 'Spinoza’s Conatus Striving', description: 'Visualizing the "Striving to Persist" as a safe harbor amidst distressing bodily sensations.', regions: ['thalamus'] },
        { id: 38, name: 'Platonic Tripartite Soul', description: 'Representing the Reason, Spirit, and Appetite as distinct but integrated sub-circuits.', regions: ['prefrontalCortex'] },
        { id: 39, name: 'Nietzschean Self-Affirmation', description: 'Activating the vmPFC through the "Will to Power" over one’s own internal narratives.', regions: ['prefrontalCortex'] },
        { id: 40, name: 'Yoga Sutra Mastery', description: 'Integration of breath and posture to drive the model’s internal physiological state.', regions: ['hypothalamus'] },
        { id: 41, name: 'Epictetus’ Prohairesis', description: 'The "Moral Choice": Visual shift in blood flow during the appraisal of "Challenge vs Threat."', regions: ['prefrontalCortex'] },
        { id: 42, name: 'Ahimsa Compassion Logic', description: 'Modeling how non-harming intent reduces defensive Amygdala activity.', regions: ['amygdala'] },
        { id: 43, name: 'Taoist Stillness Practice', description: 'Reducing peripheral tension and HPA axis firing through the principle of non-contention.', regions: ['brainstem', 'hypothalamus'] },
        { id: 44, name: 'Platonic Poiesis Flow', description: 'Modeling the reduction in DMN activity during the "Creative Act" and task-positive focus.', regions: ['prefrontalCortex'] },
        { id: 45, name: 'Aristotelian Catharsis', description: 'Visualizing the externalization of the "Problem" through dramatic storytelling.', regions: ['prefrontalCortex'] },
        { id: 46, name: 'Archetypal Integration', description: 'Toggling between "Shadow" and "Integrated" neurological states of the psyche.', regions: ['prefrontalCortex', 'amygdala'] },
        { id: 47, name: 'Socratic Aporia Resolution', description: 'Showing the conflict and eventual resolution between competing motivation pathways.', regions: ['thalamus'] },
        { id: 48, name: 'Aristotelian Habituation', description: 'The "Upward Spiral" where repeated virtuous action increases neural efficiency.', regions: ['thalamus'] },
        { id: 49, name: 'Existential Meaning Anchor', description: 'Highlighting the role of higher centers in modulating the dread of non-existence.', regions: ['prefrontalCortex'] },
        { id: 50, name: 'Enchiridion Safety Plan', description: 'A "Handbook" of principles that triggers safety protocols in the model during high arousal.', regions: ['prefrontalCortex'] }
    ];

    const medicationTreatments = [
        { id: 51, name: 'SSRI Synaptic Simulation', description: 'Zoom-in view of the synapse showing Fluoxetine blocking Serotonin reuptake pumps.', regions: ['amygdala', 'hippocampus'] },
        { id: 52, name: 'SNRI Dual-Action Model', description: 'Demonstrating simultaneous effects on Serotonin and Norepinephrine in the locus coeruleus.', regions: ['brainstem'] },
        { id: 53, name: 'Benzodiazepine GABA-A Augmentation', description: 'Visualizing how medications like Alprazolam increase GABA channel opening frequency.', regions: ['amygdala'] },
        { id: 54, name: 'MAOI Enzyme Inhibition', description: 'Showing the inhibition of Monoamine Oxidase to prevent the breakdown of neurotransmitters.', regions: ['thalamus', 'brainstem'] },
        { id: 55, name: 'TCA Receptor Binding', description: 'Modeling the complex receptor profile and antihistaminic effects of Tricyclic Antidepressants.', regions: ['thalamus'] },
        { id: 56, name: 'Beta-Blocker Peripheral Blockade', description: 'Showing Propranolol blocking adrenaline receptors in the "body" to reduce physical anxiety.', regions: ['brainstem', 'hypothalamus'] },
        { id: 57, name: 'Lithium Signal Transduction', description: 'Visualizing Lithium\'s effect on intracellular signaling pathways such as GSK-3.', regions: ['hippocampus', 'prefrontalCortex'] },
        { id: 58, name: 'Antipsychotic D2 Antagonism', description: 'Showing the blocking of Dopamine receptors in the Mesolimbic pathway to reduce emotional intensity.', regions: ['thalamus'] },
        { id: 59, name: 'Ketamine Glutamate Burst', description: 'Modeling the rapid increase in Glutamate and synaptogenesis following ketamine administration.', regions: ['prefrontalCortex', 'hippocampus'] },
        { id: 60, name: 'Lamotrigine Glutamate Inhibition', description: 'Visualizing the stabilization of neuronal membranes to prevent extreme mood shifts.', regions: ['thalamus'] },
        { id: 61, name: 'Buspirone 5-HT1A Partial Agonism', description: 'Showing how it modulates serotonin to reduce anxiety without sedation.', regions: ['amygdala'] },
        { id: 62, name: 'Prazosin for Nightmares', description: 'Modeling the blocking of alpha-1 adrenergic receptors to reduce Amygdala over-activity during sleep.', regions: ['amygdala'] },
        { id: 63, name: 'St. John’s Wort Phytochemicals', description: 'Simulating the broad-spectrum herbal effect on multiple monoamines.', regions: ['thalamus'] },
        { id: 64, name: 'Omega-3 Membrane Fluidity', description: 'Showing how fatty acids improve the structural integrity of neuronal membranes for better signaling.', regions: ['prefrontalCortex'] },
        { id: 65, name: 'Melatonin Circadian Reset', description: 'Modeling the Pineal gland signal for sleep-dependent emotional regulation.', regions: ['hypothalamus'] },
        { id: 66, name: 'Vagus Nerve Stimulation (VNS)', description: 'Interactive visualization of electrical pulses sent to the brainstem via the Vagus nerve.', regions: ['brainstem'] },
        { id: 67, name: 'Transcranial Magnetic Stimulation (TMS)', description: 'Modeling focal magnetic pulses to the Left Dorsolateral PFC for depression treatment.', regions: ['prefrontalCortex'] },
        { id: 68, name: 'Deep Brain Stimulation (DBS)', description: 'Highlighting electrode placement in the Subgenual Cingulate (Area 25).', regions: ['prefrontalCortex'] },
        { id: 69, name: 'Placebo Effect Modeling', description: 'Showing how "expectation" (PFC) releases endogenous opioids to reduce perceived distress.', regions: ['prefrontalCortex', 'thalamus'] },
        { id: 70, name: 'Pharmacogenomic Marker Indicator', description: 'Showing how different CYP450 enzyme variants affect medication metabolism rates.', regions: ['thalamus'] },
        { id: 71, name: 'Withdrawal/Discontinuation Simulation', description: 'Visualizing "Rebound Anxiety" when medication levels drop abruptly.', regions: ['amygdala'] },
        { id: 72, name: 'Side Effect "Blunting" System', description: 'Modeling reduced Nucleus Accumbens activity associated with emotional blunting.', regions: ['thalamus'] },
        { id: 73, name: 'Dose-Response Curve Slider', description: 'Interactive tool to see how different dosages affect neurotransmitter saturation levels.', regions: ['thalamus'] },
        { id: 74, name: 'Polypharmacy Interaction Checker', description: 'Visualizing potential risks like Serotonin Syndrome when multiple medications are combined.', regions: ['thalamus'] },
        { id: 75, name: 'Naltrexone Reward Blockade', description: 'Showing how blocking opioid receptors reduces the "urge" in addictive emotional behaviors.', regions: ['thalamus'] }
    ];

    if (window.GreenhouseEmotionConfig) {
        window.GreenhouseEmotionConfig.therapeuticInterventions = therapeuticInterventions;
        window.GreenhouseEmotionConfig.medicationTreatments = medicationTreatments;
    }
})();
