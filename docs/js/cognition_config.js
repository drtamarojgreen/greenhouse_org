/**
 * @file cognition_config.js
 * @description Configuration for the Cognition Simulation Model.
 * Focuses on the Cerebral Cortex and Executive Functions.
 */

(function () {
    'use strict';

    const GreenhouseCognitionConfig = {
        camera: {
            initial: {
                x: 0,
                y: 0,
                z: -600,
                rotationX: 0.2,
                rotationY: 0,
                rotationZ: 0,
                fov: 600
            }
        },
        projection: {
            width: 800,
            height: 600,
            near: 10,
            far: 5000,
            fov: 600
        },
        // Focused regions for the Cognition model
        regions: {
            prefrontalCortex: {
                name: 'Prefrontal Cortex',
                color: 'rgba(50, 150, 255, 0.8)',
                description: 'The PFC is the seat of executive function, responsible for planning, decision-making, and moderating social behavior.'
            },
            parietalLobe: {
                name: 'Parietal Lobe',
                color: 'rgba(150, 50, 255, 0.8)',
                description: 'The parietal lobe integrates sensory information from different modalities, particularly determining spatial sense and navigation.'
            },
            temporalLobe: {
                name: 'Temporal Lobe',
                color: 'rgba(50, 255, 150, 0.8)',
                description: 'The temporal lobe is involved in processing sensory input into derived meanings for the appropriate retention of visual memory, language comprehension, and emotion association.'
            },
            occipitalLobe: {
                name: 'Occipital Lobe',
                color: 'rgba(255, 50, 150, 0.8)',
                description: 'The occipital lobe is the visual processing center of the mammalian brain.'
            },
            motorCortex: {
                name: 'Motor Cortex',
                color: 'rgba(255, 150, 100, 0.8)',
                description: 'Responsible for the planning, control, and execution of voluntary movements.'
            },
            somatosensoryCortex: {
                name: 'Somatosensory Cortex',
                color: 'rgba(150, 255, 150, 0.8)',
                description: 'Processes sensory input from various parts of the body.'
            },
            cerebellum: {
                name: 'Cerebellum',
                color: 'rgba(64, 224, 208, 0.8)',
                description: 'Coordinates voluntary movements such as posture, balance, coordination, and speech.'
            },
            brainstem: {
                name: 'Brainstem',
                color: 'rgba(255, 215, 0, 0.8)',
                description: 'Controls fundamental body functions such as breathing, heart rate, and blood pressure.'
            },
            amygdala: {
                name: 'Amygdala',
                color: 'rgba(255, 100, 100, 0.8)',
                description: 'Plays a key role in the processing of emotions and memory of emotional reactions.'
            },
            hippocampus: {
                name: 'Hippocampus',
                color: 'rgba(100, 255, 150, 0.8)',
                description: 'Crucial for the formation of new memories and associated with learning and emotions.'
            },
            thalamus: {
                name: 'Thalamus',
                color: 'rgba(100, 150, 255, 0.8)',
                description: 'Relays sensory and motor signals to the cerebral cortex.'
            },
            hypothalamus: {
                name: 'Hypothalamus',
                color: 'rgba(255, 200, 100, 0.8)',
                description: 'Coordinates both the autonomic nervous system and the activity of the pituitary.'
            }
        },
        theories: [
            { name: 'Information Processing', description: 'Views the mind as a computer, where information is input, processed, stored, and retrieved.' },
            { name: 'Dual Process', description: 'Postulates that thought can arise in two different ways: System 1 (fast, automatic) and System 2 (slow, effortful).' },
            { name: 'Cognitive Load', description: 'Relates to the amount of information that working memory can hold at one time.' }
        ],
        enhancements: [
            // Core Visual & Analytical Features
            { id: 1, category: 'Analytical', name: 'Cortical Layer View', description: 'An exploded view showing the six layers of the cerebral cortex.', region: 'prefrontalCortex' },
            { id: 2, category: 'Analytical', name: 'Signal Propagation Arrows', description: 'Directional vectors showing the path of cognitive processing.', region: 'prefrontalCortex' },
            { id: 3, category: 'Analytical', name: 'System 1 vs. System 2 Split', description: 'Side-by-side comparison of automatic vs. effortful processing.', region: 'prefrontalCortex' },
            { id: 4, category: 'Analytical', name: 'Anatomical Tooltips', description: 'Detailed labels appearing when hovering over specific gyri or sulci.', region: 'parietalLobe' },
            { id: 5, category: 'Analytical', name: 'Lesion Study Mode', description: 'Simulation showing how damage to specific regions affects cognition.', region: 'temporalLobe' },
            { id: 6, category: 'Analytical', name: 'MeSH Data Linkage', description: 'Integration with the repository\'s MeSH research findings.', region: 'prefrontalCortex' },

            // Modeling Theory to Brain Regions
            { id: 7, category: 'Theory', name: 'Executive Function Mapping', description: 'Highlighting the Prefrontal Cortex (PFC) during planning simulations.', region: 'prefrontalCortex' },
            { id: 8, category: 'Theory', name: 'Working Memory Loops', description: 'Visualizing the reciprocal connections between the PFC and the Parietal Lobe.', region: 'parietalLobe' },
            { id: 9, category: 'Theory', name: 'Reward Processing Circuitry', description: 'Mapping the Ventral Striatum\'s role in the Mesolimbic Dopamine Pathway.', region: 'thalamus' },
            { id: 10, category: 'Theory', name: 'Social Cognition Hubs', description: 'Identifying the Temporoparietal Junction (TPJ) and Medial PFC.', region: 'temporalLobe' },
            { id: 11, category: 'Theory', name: 'Salience Network Visualization', description: 'Highlighting the Anterior Insula and Anterior Cingulate Cortex.', region: 'amygdala' },
            { id: 12, category: 'Theory', name: 'Default Mode Network (DMN) Toggle', description: 'Visualizing brain activity during rest vs. task-oriented focus.', region: 'prefrontalCortex' },
            { id: 13, category: 'Theory', name: 'Mirror Neuron System', description: 'Mapping the Premotor Cortex and Inferior Parietal Lobule during action observation.', region: 'motorCortex' },
            { id: 14, category: 'Theory', name: 'Error Monitoring Simulation', description: 'Highlighting the ACC during task errors.', region: 'prefrontalCortex' },
            { id: 15, category: 'Theory', name: 'Moral Reasoning Circuits', description: 'Mapping the interplay between the VMPFC and the Amygdala.', region: 'amygdala' },
            { id: 16, category: 'Theory', name: 'Threat Detection Mapping', description: 'Visualizing the fast path from the Thalamus to the Amygdala.', region: 'thalamus' },
            { id: 17, category: 'Theory', name: 'Language Processing (Broca\'s)', description: 'Highlighting the left Inferior Frontal Gyrus during speech production.', region: 'prefrontalCortex' },
            { id: 18, category: 'Theory', name: 'Language Comprehension (Wernicke\'s)', description: 'Highlighting the Superior Temporal Gyrus.', region: 'temporalLobe' },
            { id: 19, category: 'Theory', name: 'Visual Stream Separation', description: 'Visualizing the "What" (Ventral) and "Where" (Dorsal) processing streams.', region: 'occipitalLobe' },
            { id: 20, category: 'Theory', name: 'Facial Recognition Mapping', description: 'Highlighting the Fusiform Face Area (FFA).', region: 'temporalLobe' },
            { id: 21, category: 'Theory', name: 'Episodic Memory Encoding', description: 'Visualizing the Hippocampus and Entorhinal Cortex during data storage.', region: 'hippocampus' },
            { id: 22, category: 'Theory', name: 'Procedural Memory Hubs', description: 'Highlighting the Basal Ganglia and Cerebellum during motor learning.', region: 'cerebellum' },
            { id: 23, category: 'Theory', name: 'Selective Attention Filter', description: 'Mapping the Thalamic Reticular Nucleus (TRN).', region: 'thalamus' },
            { id: 24, category: 'Theory', name: 'Mental Rotation Visualization', description: 'Highlighting the Posterior Parietal Cortex during spatial tasks.', region: 'parietalLobe' },
            { id: 25, category: 'Theory', name: 'Mathematical Logic Mapping', description: 'Visualizing the Intraparietal Sulcus during numerical processing.', region: 'parietalLobe' },
            { id: 26, category: 'Theory', name: 'Auditory Processing Hierarchy', description: 'Highlighting Primary vs. Secondary Auditory Cortex.', region: 'temporalLobe' },
            { id: 27, category: 'Theory', name: 'Olfactory Cognition', description: 'Mapping the direct link between the Olfactory Bulb and the Limbic System.', region: 'amygdala' },
            { id: 28, category: 'Theory', name: 'Risk/Reward Decision Tree', description: 'Visualizing the Orbitofrontal Cortex during valuation.', region: 'prefrontalCortex' },
            { id: 29, category: 'Theory', name: 'Inhibition Control Circuits', description: 'Highlighting the Right Inferior Frontal Gyrus.', region: 'prefrontalCortex' },
            { id: 30, category: 'Theory', name: 'Cognitive Flexibility Mapping', description: 'Visualizing the Lateral PFC during task-switching.', region: 'prefrontalCortex' },

            // Cognitive Development
            { id: 31, category: 'Development', name: 'Synaptogenesis Animation', description: 'Rapid growth of neural connections in the early childhood phase.', region: 'prefrontalCortex' },
            { id: 32, category: 'Development', name: 'Adolescent Neural Pruning', description: 'Visualizing the elimination of redundant synapses.', region: 'prefrontalCortex' },
            { id: 33, category: 'Development', name: 'Myelination Timeline', description: 'Progressive insulation of axons across the lifespan.', region: 'brainstem' },
            { id: 34, category: 'Development', name: 'Prefrontal Cortex Maturation', description: 'Showing the delayed development of executive centers into the mid-20s.', region: 'prefrontalCortex' },
            { id: 35, category: 'Development', name: 'Piagetian Stage Correlates', description: 'Mapping neurological changes to cognitive developmental stages.', region: 'prefrontalCortex' },
            { id: 36, category: 'Development', name: 'Critical Period for Language', description: 'Visualizing phoneme sensitivity in the infant brain.', region: 'temporalLobe' },
            { id: 37, category: 'Development', name: 'Development of Self-Awareness', description: 'Mapping the maturation of the Medial Prefrontal Cortex.', region: 'prefrontalCortex' },
            { id: 38, category: 'Development', name: 'Adolescent Reward Hyper-reactivity', description: 'Visualizing the peak sensitivity of the Striatum.', region: 'thalamus' },
            { id: 39, category: 'Development', name: 'Cognitive Aging Trajectories', description: 'Normal volume changes in the Hippocampus and PFC over time.', region: 'hippocampus' },
            { id: 40, category: 'Development', name: 'Plasticity Comparative View', description: 'Side-by-side view of child vs. adult brain adaptability.', region: 'prefrontalCortex' },
            { id: 41, category: 'Development', name: 'White Matter Integrity (DTI)', description: 'Simulating the strengthening of long-range tracts over development.', region: 'parietalLobe' },
            { id: 42, category: 'Development', name: 'Lateralization Progress', description: 'Visualizing the specialization of the left and right hemispheres.', region: 'parietalLobe' },
            { id: 43, category: 'Development', name: 'Environmental Enrichment Simulation', description: 'Impact of stimulation on dendritic branching.', region: 'hippocampus' },
            { id: 44, category: 'Development', name: 'Early Life Stress Impact', description: 'Visualizing HPA axis sensitivity and hippocampal development.', region: 'hypothalamus' },
            { id: 45, category: 'Development', name: 'Emergence of Executive Function', description: 'Mapping the development of inhibitory control in toddlers.', region: 'prefrontalCortex' },
            { id: 46, category: 'Development', name: 'Theory of Mind Development', description: 'Visualizing the maturation of the TPJ in early childhood.', region: 'temporalLobe' },
            { id: 47, category: 'Development', name: 'Literacy Acquisition', description: 'Development of the "Visual Word Form Area" (VWFA) during reading.', region: 'occipitalLobe' },
            { id: 48, category: 'Development', name: 'Numerical Sense Maturation', description: 'Growth and specialization of the Intraparietal Sulcus.', region: 'parietalLobe' },
            { id: 49, category: 'Development', name: 'Working Memory Capacity Growth', description: 'Visualizing the increase in PFC-Parietal bandwidth over age.', region: 'prefrontalCortex' },
            { id: 50, category: 'Development', name: 'Cognitive Reserve Simulation', description: 'How education and mental activity impact brain resilience.', region: 'prefrontalCortex' },
            { id: 51, category: 'Development', name: 'Adult Neurogenesis', description: 'Visualizing new neuron birth in the Dentate Gyrus.', region: 'hippocampus' },
            { id: 52, category: 'Development', name: 'Sensory Critical Periods', description: 'Visualizing the windows for visual and auditory development.', region: 'occipitalLobe' },
            { id: 53, category: 'Development', name: 'Trajectory of Fluid Intelligence', description: 'Mapping the rise and gradual decline of processing speed.', region: 'prefrontalCortex' },
            { id: 54, category: 'Development', name: 'Crystallized Intelligence Accumulation', description: 'Visualizing the growth of semantic networks over decades.', region: 'temporalLobe' },
            { id: 55, category: 'Development', name: 'Social Brain Maturation', description: 'Development of the circuits responsible for empathy and social cues.', region: 'prefrontalCortex' },

            // Therapeutic Intervention
            { id: 56, category: 'Intervention', name: 'CBT Regulation Strengthening', description: 'Visualizing the PFC\'s increased control over the Amygdala.', region: 'prefrontalCortex' },
            { id: 57, category: 'Intervention', name: 'Mindfulness Meditation Effects', description: 'Increased activation in the ACC and Insula.', region: 'amygdala' },
            { id: 58, category: 'Intervention', name: 'Deep Brain Stimulation (DBS) Targets', description: 'Visualizing electrode placement for depression (Area 25).', region: 'prefrontalCortex' },
            { id: 59, category: 'Intervention', name: 'TMS Stimulation Mapping', description: 'Simulating Transcranial Magnetic Stimulation on the DLPFC.', region: 'prefrontalCortex' },
            { id: 60, category: 'Intervention', name: 'Exposure Therapy Mechanics', description: 'Visualizing extinction learning and amygdala habituation.', region: 'amygdala' },
            { id: 61, category: 'Intervention', name: 'Biofeedback Simulation', description: 'Real-time visual representation of simulated EEG states.', region: 'prefrontalCortex' },
            { id: 62, category: 'Intervention', name: 'Cognitive Remediation Exercises', description: 'Targeted stimulation of executive circuits.', region: 'prefrontalCortex' },
            { id: 63, category: 'Intervention', name: 'EMDR Visualization', description: 'Mapping the impact of bilateral stimulation on trauma processing.', region: 'occipitalLobe' },
            { id: 64, category: 'Intervention', name: 'Exercise-Induced BDNF', description: 'Visualizing the release of growth factors in the Hippocampus.', region: 'hippocampus' },
            { id: 65, category: 'Intervention', name: 'Sleep Hygiene Benefits', description: 'Simulating Glymphatic system clearance of metabolic waste.', region: 'brainstem' },
            { id: 66, category: 'Intervention', name: 'Social Skills Training', description: 'Strengthening the Mirror Neuron and TPJ systems.', region: 'motorCortex' },
            { id: 67, category: 'Intervention', name: 'ACT Psychological Flexibility', description: 'Mapping the acceptance and value-based action circuits.', region: 'prefrontalCortex' },
            { id: 68, category: 'Intervention', name: 'Dialectical Behavior Therapy (DBT)', description: 'Visualizing distress tolerance and emotion regulation.', region: 'amygdala' },
            { id: 69, category: 'Intervention', name: 'Art Therapy Activation', description: 'Mapping creative processing and emotional release.', region: 'parietalLobe' },
            { id: 70, category: 'Intervention', name: 'Music Therapy Resonance', description: 'Multi-sensory integration and reward pathway activation.', region: 'temporalLobe' },
            { id: 71, category: 'Intervention', name: 'ADHD Neurofeedback', description: 'Targeting the reduction of Theta/Beta wave ratios.', region: 'prefrontalCortex' },
            { id: 72, category: 'Intervention', name: 'VR Phobia Exposure', description: 'Controlled activation and desensitization of the fear circuit.', region: 'amygdala' },
            { id: 73, category: 'Intervention', name: 'Breathing Control', description: 'Impact of slow breathing on Vagus Nerve and Insula.', region: 'brainstem' },
            { id: 74, category: 'Intervention', name: 'Narrative Therapy Mapping', description: 'Re-authoring self-schemas in the Temporal and Frontal lobes.', region: 'temporalLobe' },
            { id: 75, category: 'Intervention', name: 'Vagus Nerve Stimulation (VNS)', description: 'Visualizing the path from the neck to the brainstem.', region: 'brainstem' },
            { id: 76, category: 'Intervention', name: 'Social Interaction Therapy', description: 'Mapping the oxytocin system during group therapy.', region: 'hypothalamus' },
            { id: 77, category: 'Intervention', name: 'Trauma-Informed Care', description: 'Visualizing the impact of safety on the Limbic system.', region: 'amygdala' },
            { id: 78, category: 'Intervention', name: 'Motivational Interviewing', description: 'Mapping the activation of change-talk in the PFC.', region: 'prefrontalCortex' },
            { id: 79, category: 'Intervention', name: 'Light Therapy for SAD', description: 'Visualizing the SCN\'s response to light.', region: 'hypothalamus' },
            { id: 80, category: 'Intervention', name: 'Play Therapy', description: 'Activation of the reward and social circuits in children.', region: 'thalamus' },

            // Medication Management
            { id: 81, category: 'Medication', name: 'SSRI Synaptic Mechanism', description: 'Visualizing the inhibition of Serotonin reuptake.', region: 'thalamus' },
            { id: 82, category: 'Medication', name: 'Dopamine Blockade', description: 'Blocking D2 receptors in the Mesolimbic pathway (Antipsychotics).', region: 'thalamus' },
            { id: 83, category: 'Medication', name: 'ADHD Stimulant Action', description: 'Increasing Norepinephrine and Dopamine in the PFC.', region: 'prefrontalCortex' },
            { id: 84, category: 'Medication', name: 'GABAergic Potentiation', description: 'The mechanism of Benzodiazepines on inhibitory signals.', region: 'brainstem' },
            { id: 85, category: 'Medication', name: 'Lithium Neuroprotection', description: 'Visualizing the stabilization of intracellular signaling.', region: 'prefrontalCortex' },
            { id: 86, category: 'Medication', name: 'SNRI Dual-Action', description: 'Mapping the impact on both Serotonin and Norepinephrine.', region: 'thalamus' },
            { id: 87, category: 'Medication', name: 'Ketamine Rapid Synaptogenesis', description: 'Visualizing the burst of new connections post-administration.', region: 'prefrontalCortex' },
            { id: 88, category: 'Medication', name: 'MAOI Enzyme Inhibition', description: 'Preventing the breakdown of monoamines.', region: 'thalamus' },
            { id: 89, category: 'Medication', name: 'Acetylcholinesterase Inhibition', description: 'Enhancing signals for Alzheimer\'s management.', region: 'hippocampus' },
            { id: 90, category: 'Medication', name: 'Extrapyramidal Side Effects', description: 'Mapping the impact of medications on the Basal Ganglia.', region: 'thalamus' },
            { id: 91, category: 'Medication', name: 'Blood-Brain Barrier (BBB) Permeability', description: 'Simulating medication entry into the CNS.', region: 'brainstem' },
            { id: 92, category: 'Medication', name: 'Receptor Occupancy Visualization', description: 'Real-time mapping of drug binding levels.', region: 'thalamus' },
            { id: 93, category: 'Medication', name: 'Tolerance and Down-regulation', description: 'Simulating the decrease in receptor sensitivity.', region: 'thalamus' },
            { id: 94, category: 'Medication', name: 'Medication Withdrawal Rebound', description: 'Visualizing the system\'s reaction to drug cessation.', region: 'brainstem' },
            { id: 95, category: 'Medication', name: 'Pharmacogenomic Variation', description: 'How genetics impact drug metabolism (link to Genetic model).', region: 'hypothalamus' },
            { id: 96, category: 'Medication', name: 'Steady-State Concentration', description: 'Visualizing the impact of consistent vs. inconsistent dosing.', region: 'brainstem' },
            { id: 97, category: 'Medication', name: 'Polypharmacy Interactions', description: 'Visualizing the complex interplay of multiple medications.', region: 'thalamus' },
            { id: 98, category: 'Medication', name: 'Novel Drug Targets', description: 'Mapping future research like orphan receptors.', region: 'prefrontalCortex' },
            { id: 99, category: 'Medication', name: 'Metabolic Impact on Cognition', description: 'How systemic health affects brain medication efficacy.', region: 'hypothalamus' },
            { id: 100, category: 'Medication', name: 'PWA Offline Access', description: 'Ensuring the cognition enhancements are available without connectivity.', region: 'prefrontalCortex' }
        ]
    };

    window.GreenhouseCognitionConfig = GreenhouseCognitionConfig;
})();
