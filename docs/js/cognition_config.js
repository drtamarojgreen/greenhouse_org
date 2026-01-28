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
            { id: 100, category: 'Medication', name: 'PWA Offline Access', description: 'Ensuring the cognition enhancements are available without connectivity.', region: 'prefrontalCortex' },

            // Visualization Enhancements (Set B)
            { id: 101, category: 'Visualization', name: 'Interactive 3D Brain for Cognition', description: 'A model focusing on cognitive networks (e.g., Default Mode, Fronto-parietal, Dorsal Attention).', region: 'prefrontalCortex' },
            { id: 102, category: 'Visualization', name: 'Cognitive Process Flow', description: 'Animate the flow of information for processes like decision-making, memory retrieval, and problem-solving.', region: 'prefrontalCortex' },
            { id: 103, category: 'Visualization', name: 'Working Memory Visualizer', description: 'A dynamic visualization showing items being held, manipulated, and dropped from working memory.', region: 'parietalLobe' },
            { id: 104, category: 'Visualization', name: 'Long-Term Memory Formation', description: 'Animation of synaptic plasticity, Long-Term Potentiation (LTP), and memory consolidation.', region: 'hippocampus' },
            { id: 105, category: 'Visualization', name: 'Attention Network Simulation', description: 'Visualize how the brain\'s attention networks (e.g., VAN, DAN) shift focus between stimuli.', region: 'parietalLobe' },
            { id: 106, category: 'Visualization', name: 'Language Processing Pathway', description: 'Animate the processing of spoken or written language through Broca\'s and Wernicke\'s areas.', region: 'temporalLobe' },
            { id: 107, category: 'Visualization', name: 'Executive Function Dashboard', description: 'An interactive dashboard showing the interplay of inhibition, cognitive flexibility, and working memory.', region: 'prefrontalCortex' },
            { id: 108, category: 'Visualization', name: 'Concept Mapping Tool', description: 'Visualize how concepts are semantically linked in the brain, forming a knowledge network.', region: 'temporalLobe' },
            { id: 109, category: 'Visualization', name: 'Neural Oscillation Visualizer', description: 'Show brainwaves (alpha, beta, gamma, theta) and how they change during different cognitive tasks.', region: 'prefrontalCortex' },
            { id: 110, category: 'Visualization', name: 'Timeline of Cognitive Development', description: 'An interactive timeline from infancy to old age, showing milestones in cognitive development.', region: 'prefrontalCortex' },
            { id: 111, category: 'Visualization', name: 'Cognitive Load Meter', description: 'A visual meter that increases as a simulated task becomes more complex, showing the strain on cognitive resources.', region: 'parietalLobe' },
            { id: 112, category: 'Visualization', name: 'VR/AR Cognitive Playground', description: 'A virtual environment with puzzles and tasks that test different cognitive functions.', region: 'occipitalLobe' },
            { id: 113, category: 'Visualization', name: 'Heatmap of Cognitive Task Activity', description: 'Display fMRI-style heatmaps on the brain model corresponding to tasks like mental arithmetic or spatial navigation.', region: 'parietalLobe' },
            { id: 114, category: 'Visualization', name: 'Comparative Cognition', description: 'Side-by-side comparison of brain structures for cognition in different species (e.g., humans, dolphins, crows).', region: 'prefrontalCortex' },
            { id: 115, category: 'Visualization', name: 'Cognitive Aging Simulation', description: 'Visualize typical changes in the brain and cognitive function associated with aging.', region: 'hippocampus' },
            { id: 116, category: 'Visualization', name: 'Cognitive Impairment Simulation', description: 'Show how conditions like Alzheimer\'s disease or stroke can impact brain networks and cognitive abilities.', region: 'temporalLobe' },
            { id: 117, category: 'Visualization', name: 'Brain Plasticity Demonstrator', description: 'An animation showing how learning a new skill (e.g., juggling, playing an instrument) changes brain structure.', region: 'motorCortex' },
            { id: 118, category: 'Visualization', name: 'Personalized Cognitive Map', description: '(Speculative) Users answer a cognitive style questionnaire to see a representation of their cognitive profile.', region: 'prefrontalCortex' },
            { id: 119, category: 'Visualization', name: 'Sound-driven Cognitive Task', description: 'A task where auditory cues influence a visual cognitive task, with brain activity visualized.', region: 'temporalLobe' },
            { id: 120, category: 'Visualization', name: 'Cognitive Bias Simulator', description: 'Interactive demos of common cognitive biases (e.g., confirmation bias, anchoring).', region: 'prefrontalCortex' },
            { id: 121, category: 'Visualization', name: 'EEG/ERP Data Overlay', description: 'Allow mock or real EEG data upload to show Event-Related Potentials (ERPs) during cognitive tasks.', region: 'parietalLobe' },
            { id: 122, category: 'Visualization', name: 'Cognitive Strategy Visualization', description: 'Show how different strategies (e.g., chunking, method of loci) improve memory performance.', region: 'hippocampus' },
            { id: 123, category: 'Visualization', name: 'Social Cognition Scenarios', description: 'Visualize brain activity during social cognition tasks like theory of mind or empathy.', region: 'temporalLobe' },
            { id: 124, category: 'Visualization', name: 'Art and Creativity', description: 'A gallery of creative works with an analysis of the cognitive processes involved (e.g., divergent thinking).', region: 'occipitalLobe' },
            { id: 125, category: 'Visualization', name: 'Customizable UI for Cognitive States', description: 'Allow users to switch themes based on cognitive states, like "Focus Mode" or "Creative Mode".', region: 'prefrontalCortex' },

            // Scientific Accuracy Enhancements
            { id: 126, category: 'Accuracy', name: 'Rigorous Sourcing', description: 'Every cognitive model and claim linked directly to a citable, peer-reviewed publication.', region: 'prefrontalCortex' },
            { id: 127, category: 'Accuracy', name: 'Cognitive Science Advisory Board', description: 'List a panel of consulting cognitive scientists, neuroscientists, and psychologists.', region: 'prefrontalCortex' },
            { id: 128, category: 'Accuracy', name: 'Clarify Brain Imaging Limits', description: 'Explicitly state that fMRI shows blood flow as a proxy for neural activity, not thought itself.', region: 'occipitalLobe' },
            { id: 129, category: 'Accuracy', name: 'Versioned Cognitive Models', description: 'A changelog for cognitive models on the site, noting updates from new research.', region: 'prefrontalCortex' },
            { id: 130, category: 'Accuracy', name: 'Comprehensive Cognitive Glossary', description: 'A searchable glossary for all technical terms (e.g., "phonological loop," "gist memory").', region: 'temporalLobe' },
            { id: 131, category: 'Accuracy', name: 'Represent Competing Theories', description: 'Present different models of cognitive functions (e.g., models of working memory by Baddeley vs. Cowan).', region: 'prefrontalCortex' },
            { id: 132, category: 'Accuracy', name: 'Regular Research Updates', description: 'A commitment to update content with major findings in cognitive science and neuroscience.', region: 'prefrontalCortex' },
            { id: 133, category: 'Accuracy', name: 'Data Source Transparency', description: 'Clearly state the origin of data for visualizations (e.g., "based on data from the Allen Brain Atlas").', region: 'prefrontalCortex' },
            { id: 134, category: 'Accuracy', name: 'Display Statistical Nuance', description: 'When showing data, include error bars, confidence intervals, and effect sizes.', region: 'parietalLobe' },
            { id: 135, category: 'Accuracy', name: 'Model Limitations Section', description: 'A clear disclaimer about the simplifications and limitations of the presented cognitive models.', region: 'prefrontalCortex' },
            { id: 136, category: 'Accuracy', name: 'Anatomical Precision', description: 'Ensure the 3D brain model uses a high-resolution, standard template (e.g., MNI or Talairach space).', region: 'prefrontalCortex' },
            { id: 137, category: 'Accuracy', name: 'Precise Regional Labeling', description: 'Use correct, current terminology and boundaries for all cortical and subcortical areas.', region: 'prefrontalCortex' },
            { id: 138, category: 'Accuracy', name: 'Explain Cognitive Testing Methods', description: 'A section on how cognitive functions are measured (e.g., Stroop test, fNIRS, eye-tracking).', region: 'prefrontalCortex' },
            { id: 139, category: 'Accuracy', name: 'Emphasize Network Dynamics', description: 'Avoid a purely modular view, emphasizing that cognition arises from distributed network interactions.', region: 'parietalLobe' },
            { id: 140, category: 'Accuracy', name: 'Peer-Review for New Content', description: 'A formal process for internal or external review of all new educational and visual content.', region: 'prefrontalCortex' },
            { id: 141, category: 'Accuracy', name: 'Fact-Checking Protocol', description: 'Cross-reference all statements against multiple high-quality scientific reviews and meta-analyses.', region: 'prefrontalCortex' },
            { id: 142, category: 'Accuracy', name: 'Historical Cognitive Science', description: 'Provide context on the cognitive revolution and the history of key ideas (e.g., Chomsky, Miller, Neisser).', region: 'temporalLobe' },
            { id: 143, category: 'Accuracy', name: 'Cross-Cultural Cognition', description: 'A section discussing how culture can shape cognitive processes like perception and memory.', region: 'parietalLobe' },
            { id: 144, category: 'Accuracy', name: 'Individual Cognitive Variation', description: 'Stress the wide range of individual differences in cognitive abilities and styles.', region: 'prefrontalCortex' },
            { id: 145, category: 'Accuracy', name: 'Ethical Considerations in Cognitive Research', description: 'Discuss ethics related to cognitive enhancement, brain data privacy, and animal research.', region: 'prefrontalCortex' },
            { id: 146, category: 'Accuracy', name: 'Disambiguate Cognitive Terms', description: 'Clearly differentiate related concepts (e.g., working memory vs. short-term memory, intelligence vs. expertise).', region: 'temporalLobe' },
            { id: 147, category: 'Accuracy', name: 'Quantitative Data Focus', description: 'Prefer quantitative data displays (e.g., "reaction time decreased by 80ms") over purely qualitative ones.', region: 'parietalLobe' },
            { id: 148, category: 'Accuracy', name: 'Interactive Citation Pop-ups', description: 'Make citations interactive, showing the paper\'s abstract on hover or click.', region: 'prefrontalCortex' },
            { id: 149, category: 'Accuracy', name: 'User-Submitted Correction System', description: 'A form for users to flag potential inaccuracies for review by the advisory board.', region: 'prefrontalCortex' },
            { id: 150, category: 'Accuracy', name: 'Content Creator Credentials', description: 'Biographies of the site\'s authors and their relevant scientific expertise.', region: 'prefrontalCortex' },

            // Research-Oriented Features
            { id: 151, category: 'Research', name: 'Hypothesis Sandbox', description: 'A tool to propose a cognitive hypothesis (e.g., "cognitive load impairs creativity") and see relevant evidence.', region: 'prefrontalCortex' },
            { id: 152, category: 'Research', name: 'Mock Cognitive Task Data Generator', description: 'Create mock datasets (e.g., reaction times, accuracy) for students to practice data analysis.', region: 'parietalLobe' },
            { id: 153, category: 'Research', name: 'Integrated Literature Search', description: 'A search bar connected to PubMed, PsycINFO, or Google Scholar, filtered for cognitive science.', region: 'prefrontalCortex' },
            { id: 154, category: 'Research', name: 'Data Export Functionality', description: 'Allow export of simulation parameters and results in CSV, JSON, or other standard formats.', region: 'prefrontalCortex' },
            { id: 155, category: 'Research', name: 'Virtual Collaboration Space', description: 'A feature for student or research groups to share notes and resources related to site content.', region: 'prefrontalCortex' },
            { id: 156, category: 'Research', name: 'Research Design Assistant', description: 'A tool that guides users through designing a basic cognitive psychology experiment.', region: 'prefrontalCortex' },
            { id: 157, category: 'Research', name: 'Grant and Funding Database', description: 'A list of funding opportunities for research in cognitive science and neuroscience.', region: 'prefrontalCortex' },
            { id: 158, category: 'Research', name: 'Open Cognitive Datasets', description: 'A curated list of open-access datasets for cognitive research (e.g., fMRI data, large-scale behavioral data).', region: 'prefrontalCortex' },
            { id: 159, category: 'Research', name: 'Cognitive Scientist Profiles', description: 'Profiles of leading researchers, highlighting their key contributions and linking to their labs.', region: 'prefrontalCortex' },
            { id: 160, category: 'Research', name: 'Cognitive Science Conference Calendar', description: 'A calendar of major upcoming conferences (e.g., Psychonomics, CogSci, CNS).', region: 'prefrontalCortex' },
            { id: 161, category: 'Research', name: 'Job and Internship Board', description: 'A curated list of academic and industry jobs in fields like UX research, data science, and cognitive engineering.', region: 'prefrontalCortex' },
            { id: 162, category: 'Research', name: 'Experimental Paradigm Builder', description: 'A simple block-based tool to design common experimental paradigms (e.g., flanker task, N-back).', region: 'prefrontalCortex' },
            { id: 163, category: 'Research', name: 'Statistics for Cognitive Science', description: 'A guide to statistical methods commonly used in the field (e.g., t-tests, ANOVA, mixed-effects models).', region: 'parietalLobe' },
            { id: 164, category: 'Research', name: 'Researcher Connect Program', description: 'An opt-in program to connect students with graduate students or researchers for mentorship.', region: 'prefrontalCortex' },
            { id: 165, category: 'Research', name: 'Citizen Science in Cognition', description: 'Host or link to online citizen science projects that measure cognitive abilities.', region: 'prefrontalCortex' },
            { id: 166, category: 'Research', name: 'Virtual Journal Club', description: 'A section for discussing and critiquing recent, high-impact papers in cognitive science.', region: 'prefrontalCortex' },
            { id: 167, category: 'Research', name: 'Computational Modeling Resources', description: 'Tutorials for learning computational modeling of cognition (e.g., using Python, ACT-R).', region: 'prefrontalCortex' },
            { id: 168, category: 'Research', name: 'Cognitive Science Software Directory', description: 'A directory of software for experiment building (PsychoPy), data analysis (R, JASP), and modeling.', region: 'prefrontalCortex' },
            { id: 169, category: 'Research', name: 'Research Ethics Simulation', description: 'An interactive simulation posing ethical dilemmas in cognitive research.', region: 'prefrontalCortex' },
            { id: 170, category: 'Research', name: '\"Future of Cognition\" Section', description: 'Highlighting cutting-edge and future directions, like brain-computer interfaces and AI integration.', region: 'prefrontalCortex' },
            { id: 171, category: 'Research', name: 'Lab Methods Explained', description: 'A wiki explaining techniques like TMS, tDCS, eye-tracking, and their applications in cognition.', region: 'prefrontalCortex' },
            { id: 172, category: 'Research', name: 'Cognitive Data Visualization Challenge', description: 'Host regular challenges to create the best visualization of a complex cognitive dataset.', region: 'prefrontalCortex' },
            { id: 173, category: 'Research', name: 'Mechanism for Content Contribution', description: 'A pathway for verified researchers to contribute or suggest updates to the platform.', region: 'prefrontalCortex' },
            { id: 174, category: 'Research', name: 'API for Cognitive Models', description: 'Provide API access to the parameters of the site\'s cognitive simulations for research use.', region: 'prefrontalCortex' },
            { id: 175, category: 'Research', name: 'Reference Manager Integration', description: 'One-click export of citations to Zotero, Mendeley, or EndNote.', region: 'prefrontalCortex' },

            // Educational Features
            { id: 176, category: 'Educational', name: 'Interactive Knowledge Checks', description: 'Quizzes and interactive challenges integrated within each learning module.', region: 'prefrontalCortex' },
            { id: 177, category: 'Educational', name: 'Curated Learning Pathways', description: 'Guided paths like \"Introduction to Memory\" or \"The Neuroscience of Decision Making.\"', region: 'prefrontalCortex' },
            { id: 178, category: 'Educational', name: 'Real-World Case Studies', description: 'Interactive case studies of cognitive phenomena (e.g., HM, Phineas Gage, expert memory).', region: 'hippocampus' },
            { id: 179, category: 'Educational', name: '\"For Teachers\" Portal', description: 'Downloadable lesson plans, student activities, and guides for classroom use.', region: 'prefrontalCortex' },
            { id: 180, category: 'Educational', name: 'Simplified Language Toggle', description: 'An option to switch to a version with less jargon and simpler explanations.', region: 'prefrontalCortex' },
            { id: 181, category: 'Educational', name: 'Personalized Learning Goals', description: 'Allow users to set a learning goal and receive recommended content.', region: 'prefrontalCortex' },
            { id: 182, category: 'Educational', name: 'Gamified Learning', description: 'A system of points and badges for mastering concepts and completing modules.', region: 'prefrontalCortex' },
            { id: 183, category: 'Educational', name: 'Interactive \"Choose Your Own Adventure\" for Problem Solving', description: 'A story-based game where choices demonstrate different cognitive strategies.', region: 'prefrontalCortex' },
            { id: 184, category: 'Educational', name: '\"Ask a Cognitive Scientist\" Forum', description: 'A moderated Q&A forum where users can ask questions to experts.', region: 'prefrontalCortex' },
            { id: 185, category: 'Educational', name: 'Downloadable Cognitive Guides', description: 'High-quality PDF infographics summarizing key cognitive models and theories.', region: 'prefrontalCortex' },
            { id: 186, category: 'Educational', name: 'Printable \"Brain Facts\" Sheets', description: 'One-page summaries of major topics for quick review.', region: 'prefrontalCortex' },
            { id: 187, category: 'Educational', name: 'Full Accessibility Support (Text-to-Speech)', description: 'Implement text-to-speech for all content to aid accessibility.', region: 'prefrontalCortex' },
            { id: 188, category: 'Educational', name: 'Multilingual Content', description: 'Offer translations of the page into several major languages.', region: 'prefrontalCortex' },
            { id: 189, category: 'Educational', name: 'Interactive Glossary Pop-ups', description: 'Click on any technical term to see its definition in a pop-up window.', region: 'temporalLobe' },
            { id: 190, category: 'Educational', name: 'Digital Flashcard Deck', description: 'A feature for creating and studying flashcards of key concepts.', region: 'hippocampus' },
            { id: 191, category: 'Educational', name: 'Flipped Classroom Modules', description: 'Self-contained modules designed for students to complete before a class discussion.', region: 'prefrontalCortex' },
            { id: 192, category: 'Educational', name: 'Student Project Gallery', description: 'A space to showcase exceptional student projects inspired by the site\'s content.', region: 'prefrontalCortex' },
            { id: 193, category: 'Educational', name: 'Careers in Cognitive Science', description: 'Information about careers in academia, industry (tech, AI), and clinical practice.', region: 'prefrontalCortex' },
            { id: 194, category: 'Educational', name: '\"Cognitive Myths\" Debunked', description: 'A section addressing common misconceptions (e.g., \"we only use 10% of our brain\").', region: 'prefrontalCortex' },
            { id: 195, category: 'Educational', name: 'Cognition in the News', description: 'A regularly updated section linking concepts to current events and new discoveries.', region: 'prefrontalCortex' },
            { id: 196, category: 'Educational', name: 'Personal Cognition Journal', description: 'A private, guided journal for users to notice and reflect on their own cognitive processes.', region: 'prefrontalCortex' },
            { id: 197, category: 'Educational', name: '\"Big Picture\" Concept Maps', description: 'At the end of each topic, a visual summary that maps out how the concepts interrelate.', region: 'prefrontalCortex' },
            { id: 198, category: 'Educational', name: 'Animated Explainer Videos', description: 'A library of short, engaging animated videos explaining core cognitive functions.', region: 'prefrontalCortex' },
            { id: 199, category: 'Educational', name: 'Interactive History of Cognitive Science', description: 'A timeline with key figures, discoveries, and paradigm shifts.', region: 'temporalLobe' },
            { id: 200, category: 'Educational', name: 'Full WCAG 2.1 AA Compliance', description: 'Ensure the page meets modern accessibility standards for all users.', region: 'prefrontalCortex' }
        ]
    };

    window.GreenhouseCognitionConfig = GreenhouseCognitionConfig;
})();
