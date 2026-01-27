/**
 * @file emotion_interventions.js
 * @description Therapeutic and Pharmacological enhancements for the Emotion Simulation.
 * Part of the 100 enhancements project, mapping interventions to mental health wellness and conditions.
 */

(function () {
    'use strict';

    const therapeuticInterventions = [
        { id: 26, name: 'CBT Thought Records Integration', description: 'Interactive panel to input "Automatic Thoughts" and see their neurological "threat" mapping.', regions: ['prefrontalCortex'], wellnessFocus: 'Cognitive Clarity', conditionMapping: 'Cognitive Distortions' },
        { id: 27, name: 'DBT "Wise Mind" Visualization', description: 'A visual overlap area representing the synthesis of the "Emotional Brain" and "Rational Brain."', regions: ['prefrontalCortex', 'amygdala'], wellnessFocus: 'Balanced Judgment', conditionMapping: 'Emotional Dysregulation' },
        { id: 28, name: 'Mindfulness Breath Sync', description: 'Feature where the model\'s animation synchronizes with a breathing pacer, slowing Hypothalamus activity.', regions: ['hypothalamus'], wellnessFocus: 'Somatic Calm', conditionMapping: 'Panic and Anxiety' },
        { id: 29, name: 'ACT "Defusion" Tool', description: 'Visualization of "detaching" from a thought, moving it from the PFC center to the periphery.', regions: ['prefrontalCortex'], wellnessFocus: 'Self-Transcendence', conditionMapping: 'Fixed Thinking' },
        { id: 30, name: 'EMDR Bilateral Stimulation Simulation', description: 'A moving visual target that triggers alternating hemispheric activation for trauma processing.', regions: ['amygdala', 'hippocampus'], wellnessFocus: 'Trauma Processing', conditionMapping: 'PTSD' },
        { id: 31, name: 'Exposure Therapy Hierarchy', description: 'A progressive list of "stressors" to demonstrate the Fear Extinction process in the model.', regions: ['amygdala', 'prefrontalCortex'], wellnessFocus: 'Fortitude', conditionMapping: 'Phobias' },
        { id: 32, name: 'Distress Tolerance "TIPP" Mode', description: 'Simulates the effect of sudden temperature changes on the Autonomic Nervous System.', regions: ['hypothalamus'], wellnessFocus: 'Internal Harmony', conditionMapping: 'Acute Distress' },
        { id: 33, name: 'Compassion-Focused Therapy (CFT) Module', description: 'Activates the "Soothe System" (Oxytocin/Opiates) to counter the "Threat System."', regions: ['hypothalamus', 'amygdala'], wellnessFocus: 'Compassion', conditionMapping: 'Self-Criticism' },
        { id: 34, name: 'Interpersonal Effectiveness Scripts', description: 'Linking social communication patterns to Oxytocin release and stress reduction.', regions: ['hypothalamus'], wellnessFocus: 'Social Cohesion', conditionMapping: 'Interpersonal Conflict' },
        { id: 35, name: 'Gratitude Journal Neuromapping', description: 'Highlighting the Dopamine and Serotonin pathways activated during gratitude exercises.', regions: ['thalamus', 'prefrontalCortex'], wellnessFocus: 'Positive Affect', conditionMapping: 'Negativity Bias' },
        { id: 36, name: 'Positive Psychology "Three Good Things"', description: 'Modeling the shift from "Negativity Bias" (Amygdala) to "Positivity" (Nucleus Accumbens).', regions: ['amygdala', 'thalamus'], wellnessFocus: 'Sustainable Joy', conditionMapping: 'Depression' },
        { id: 37, name: 'Somatic Experiencing "Pendulation"', description: 'Visualizing the shifting of attention between "safe" and "distressing" bodily sensations.', regions: ['thalamus'], wellnessFocus: 'Vitality', conditionMapping: 'Somatic Distress' },
        { id: 38, name: 'IFS "Parts" Visualization', description: 'Representing different emotional "parts" (e.g., Manager, Firefighter) as distinct sub-circuits.', regions: ['prefrontalCortex'], wellnessFocus: 'Psychic Integration', conditionMapping: 'Internal Conflict' },
        { id: 39, name: 'Self-Affirmation PFC Activation', description: 'Showing how self-affirmation increases activity in the vmPFC, aiding resilience.', regions: ['prefrontalCortex'], wellnessFocus: 'Self-Mastery', conditionMapping: 'Low Resilience' },
        { id: 40, name: 'Biofeedback-Driven Animation', description: 'Integration of real-time heart rate data (via API) to drive the model\'s pulse and color.', regions: ['hypothalamus'], wellnessFocus: 'Mind-Body Unity', conditionMapping: 'Dysregulation' },
        { id: 41, name: 'Reframing "Challenge vs Threat"', description: 'Visual shift in simulated blood flow (Oxy-Hemoglobin) during different cognitive appraisals.', regions: ['prefrontalCortex'], wellnessFocus: 'Agency', conditionMapping: 'Stress Response' },
        { id: 42, name: 'Non-Violent Communication (NVC) Logic', description: 'Modeling how expressing "needs" reduces defensive Amygdala activity.', regions: ['amygdala'], wellnessFocus: 'Non-Violence', conditionMapping: 'Anger Management' },
        { id: 43, name: 'Progressive Muscle Relaxation (PMR)', description: 'Showing descending motor signals reducing peripheral tension and HPA axis firing.', regions: ['brainstem', 'hypothalamus'], wellnessFocus: 'Ease', conditionMapping: 'General Anxiety' },
        { id: 44, name: 'Art Therapy "Flow State"', description: 'Modeling the reduction in DMN activity and increase in task-positive network activation during creativity.', regions: ['prefrontalCortex'], wellnessFocus: 'Creative Flow', conditionMapping: 'Apathy' },
        { id: 45, name: 'Narrative Therapy "Externalization"', description: 'Visualizing the "problem" as a separate entity from the core brain model.', regions: ['prefrontalCortex'], wellnessFocus: 'Emotional Release', conditionMapping: 'Problem Saturation' },
        { id: 46, name: 'Schema Therapy "Mode" Switcher', description: 'Ability to toggle between "Vulnerable Child" and "Healthy Adult" neurological states.', regions: ['prefrontalCortex', 'amygdala'], wellnessFocus: 'Wholeness', conditionMapping: 'Personality traits' },
        { id: 47, name: 'Motivational Interviewing "Ambivalence"', description: 'Showing the conflict between two competing reward/motivation pathways.', regions: ['thalamus'], wellnessFocus: 'Honesty', conditionMapping: 'Ambivalence' },
        { id: 48, name: 'Behavioral Activation Loop', description: 'Modeling the "Upward Spiral" where increased activity leads to increased Dopamine availability.', regions: ['thalamus'], wellnessFocus: 'Activation', conditionMapping: 'Inactivity' },
        { id: 49, name: 'Logotherapy "Meaning" Anchor', description: 'Highlighting the role of higher Neocortex centers in modulating existential distress.', regions: ['prefrontalCortex'], wellnessFocus: 'Meaning', conditionMapping: 'Existential Crisis' },
        { id: 50, name: 'Wellness Recovery Action Plan (WRAP)', description: 'Interactive checklist that triggers "Safety Plans" in the model\'s UI during high arousal.', regions: ['prefrontalCortex'], wellnessFocus: 'Preparedness', conditionMapping: 'Crisis' }
    ];

    const medicationTreatments = [
        { id: 51, name: 'SSRI Synaptic Simulation', description: 'Zoom-in view of the synapse showing Fluoxetine blocking Serotonin reuptake pumps.', regions: ['amygdala', 'hippocampus'], wellnessFocus: 'Mood Stability', conditionMapping: 'MDD' },
        { id: 52, name: 'SNRI Dual-Action Model', description: 'Demonstrating simultaneous effects on Serotonin and Norepinephrine in the locus coeruleus.', regions: ['brainstem'], wellnessFocus: 'Energy', conditionMapping: 'TRD' },
        { id: 53, name: 'Benzodiazepine GABA-A Augmentation', description: 'Visualizing how medications like Alprazolam increase GABA channel opening frequency.', regions: ['amygdala'], wellnessFocus: 'Calm', conditionMapping: 'Panic' },
        { id: 54, name: 'MAOI Enzyme Inhibition', description: 'Showing the inhibition of Monoamine Oxidase to prevent the breakdown of neurotransmitters.', regions: ['thalamus', 'brainstem'], wellnessFocus: 'Neurotransmitter Density', conditionMapping: 'Atypical Depression' },
        { id: 55, name: 'TCA Receptor Binding', description: 'Modeling the complex receptor profile and antihistaminic effects of Tricyclic Antidepressants.', regions: ['thalamus'], wellnessFocus: 'Sleep and Mood', conditionMapping: 'Melancholic Depression' },
        { id: 56, name: 'Beta-Blocker Peripheral Blockade', description: 'Showing Propranolol blocking adrenaline receptors in the "body" to reduce physical anxiety.', regions: ['brainstem', 'hypothalamus'], wellnessFocus: 'Focus', conditionMapping: 'Performance Anxiety' },
        { id: 57, name: 'Lithium Signal Transduction', description: 'Visualizing Lithium\'s effect on intracellular signaling pathways such as GSK-3.', regions: ['hippocampus', 'prefrontalCortex'], wellnessFocus: 'Prevention', conditionMapping: 'Bipolar' },
        { id: 58, name: 'Antipsychotic D2 Antagonism', description: 'Showing the blocking of Dopamine receptors in the Mesolimbic pathway to reduce emotional intensity.', regions: ['thalamus'], wellnessFocus: 'Organization', conditionMapping: 'Psychosis' },
        { id: 59, name: 'Ketamine Glutamate Burst', description: 'Modeling the rapid increase in Glutamate and synaptogenesis following ketamine administration.', regions: ['prefrontalCortex', 'hippocampus'], wellnessFocus: 'Resilience', conditionMapping: 'Suicidal Ideation' },
        { id: 60, name: 'Lamotrigine Glutamate Inhibition', description: 'Visualizing the stabilization of neuronal membranes to prevent extreme mood shifts.', regions: ['thalamus'], wellnessFocus: 'Leveling', conditionMapping: 'Bipolar II' },
        { id: 61, name: 'Buspirone 5-HT1A Partial Agonism', description: 'Showing how it modulates serotonin to reduce anxiety without sedation.', regions: ['amygdala'], wellnessFocus: 'Calm', conditionMapping: 'GAD' },
        { id: 62, name: 'Prazosin for Nightmares', description: 'Modeling the blocking of alpha-1 adrenergic receptors to reduce Amygdala over-activity during sleep.', regions: ['amygdala'], wellnessFocus: 'Sleep Restoration', conditionMapping: 'Nightmares' },
        { id: 63, name: 'St. John’s Wort Phytochemicals', description: 'Simulating the broad-spectrum herbal effect on multiple monoamines.', regions: ['thalamus'], wellnessFocus: 'Herbal Balance', conditionMapping: 'Mild Depression' },
        { id: 64, name: 'Omega-3 Membrane Fluidity', description: 'Showing how fatty acids improve the structural integrity of neuronal membranes for better signaling.', regions: ['prefrontalCortex'], wellnessFocus: 'Neuroprotection', conditionMapping: 'Mood Swings' },
        { id: 65, name: 'Melatonin Circadian Reset', description: 'Modeling the Pineal gland signal for sleep-dependent emotional regulation.', regions: ['hypothalamus'], wellnessFocus: 'Balance', conditionMapping: 'Insomnia' },
        { id: 66, name: 'Vagus Nerve Stimulation (VNS)', description: 'Interactive visualization of electrical pulses sent to the brainstem via the Vagus nerve.', regions: ['brainstem'], wellnessFocus: 'Vagal Tone', conditionMapping: 'TRD' },
        { id: 67, name: 'Transcranial Magnetic Stimulation (TMS)', description: 'Modeling focal magnetic pulses to the Left Dorsolateral PFC for depression treatment.', regions: ['prefrontalCortex'], wellnessFocus: 'Reactivation', conditionMapping: 'Depression' },
        { id: 68, name: 'Deep Brain Stimulation (DBS)', description: 'Highlighting electrode placement in the Subgenual Cingulate (Area 25).', regions: ['acc'], wellnessFocus: 'Modulation', conditionMapping: 'Severe Depression' },
        { id: 69, name: 'Placebo Effect Modeling', description: 'Showing how "expectation" (PFC) releases endogenous opioids to reduce perceived distress.', regions: ['prefrontalCortex', 'thalamus'], wellnessFocus: 'Expectancy', conditionMapping: 'Pain' },
        { id: 70, name: 'Pharmacogenomic Marker Indicator', description: 'Showing how different CYP450 enzyme variants affect medication metabolism rates.', regions: ['thalamus'], wellnessFocus: 'Precision', conditionMapping: 'Polypharmacy' },
        { id: 71, name: 'Withdrawal/Discontinuation Simulation', description: 'Visualizing "Rebound Anxiety" when medication levels drop abruptly.', regions: ['amygdala'], wellnessFocus: 'Safety', conditionMapping: 'Withdrawal' },
        { id: 72, name: 'Side Effect "Blunting" System', description: 'Modeling reduced Nucleus Accumbens activity associated with emotional blunting.', regions: ['striatum'], wellnessFocus: 'Preservation', conditionMapping: 'Anhedonia' },
        { id: 73, name: 'Dose-Response Curve Slider', description: 'Interactive tool to see how different dosages affect neurotransmitter saturation levels.', regions: ['thalamus'], wellnessFocus: 'Dosing', conditionMapping: 'Efficacy' },
        { id: 74, name: 'Polypharmacy Interaction Checker', description: 'Visualizing potential risks like Serotonin Syndrome when multiple medications are combined.', regions: ['thalamus'], wellnessFocus: 'Drug Safety', conditionMapping: 'Interaction Risk' },
        { id: 75, name: 'Naltrexone Reward Blockade', description: 'Showing how blocking opioid receptors reduces the "urge" in addictive emotional behaviors.', regions: ['thalamus'], wellnessFocus: 'Urge Reduction', conditionMapping: 'Addiction' }
    ];

    if (window.GreenhouseEmotionConfig) {
        window.GreenhouseEmotionConfig.therapeuticInterventions = therapeuticInterventions;
        window.GreenhouseEmotionConfig.medicationTreatments = medicationTreatments;
    }
})();
