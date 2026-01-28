// docs/js/emotion_config.js
/**
 * @file emotion_config.js
 * @description Configuration for the Emotion Simulation Model.
 * Focuses on the Limbic System and its role in emotional processing.
 */

(function () {
    'use strict';

    const GreenhouseEmotionConfig = {
        camera: {
            initial: {
                x: 0,
                y: 0,
                z: -600,
                rotationX: 0,
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
        // Focused regions for the Emotion model
        regions: {
            prefrontalCortex: {
                name: 'Prefrontal Cortex',
                color: 'rgba(200, 200, 200, 0.4)',
                description: 'The PFC regulates emotional responses through cognitive control and reappraisal.',
                subRegions: ['dlPFC', 'vmPFC', 'OFC'],
                primaryNTs: ['Glutamate', 'Dopamine', 'Serotonin'],
                networks: ['CEN', 'DMN'],
                clinicalSignificance: 'PFC-Limbic uncoupling is a hallmark of emotional dysregulation disorders.'
            },
            dlPFC: {
                name: 'Dorsolateral PFC',
                color: 'rgba(100, 180, 255, 0.7)',
                description: 'The dlPFC is the "cool" executive brain, responsible for working memory, goal maintenance, and top-down inhibition of emotional impulses.',
                subRegions: ['Brodmann Area 9/46'],
                primaryNTs: ['Dopamine', 'Glutamate'],
                networks: ['Central Executive Network (CEN)'],
                clinicalSignificance: 'Target for TMS in depression; hypoactivity linked to impaired emotional regulation.'
            },
            vmPFC: {
                name: 'Ventromedial PFC',
                color: 'rgba(120, 160, 255, 0.7)',
                description: 'The vmPFC is the "warm" executive brain, integrating emotion and cognition to guide social behavior and value-based decisions.',
                subRegions: ['Brodmann Area 10/11/32'],
                primaryNTs: ['Serotonin', 'Glutamate'],
                networks: ['Default Mode Network (DMN)'],
                clinicalSignificance: 'Damage results in "acquired sociopathy" and inability to use emotions for decision-making.'
            },
            ofc: {
                name: 'Orbitofrontal Cortex',
                color: 'rgba(80, 140, 255, 0.7)',
                description: 'The OFC evaluates the value of rewards and punishments, helping to inhibit inappropriate emotional responses.',
                subRegions: ['Brodmann Area 11/12'],
                primaryNTs: ['Dopamine', 'Serotonin'],
                networks: ['Reward Circuit'],
                clinicalSignificance: 'Linked to impulse control disorders and addiction.'
            },
            amygdala: {
                name: 'Amygdala',
                color: 'rgba(255, 50, 50, 0.8)',
                description: 'The amygdala is the brain\'s primary center for threat detection and emotional processing, particularly fear and aggression.',
                subRegions: ['Basolateral (BLA)', 'Centromedial (CeA)'],
                primaryNTs: ['Glutamate', 'GABA', 'CRH'],
                networks: ['Salience', 'Threat-Detection'],
                clinicalSignificance: 'Overactivity linked to GAD and Panic Disorder; underactivity in some psychopathy types.'
            },
            hippocampus: {
                name: 'Hippocampus',
                color: 'rgba(50, 255, 50, 0.8)',
                description: 'The hippocampus provides emotional context by linking current experiences with past memories.',
                subRegions: ['Anterior', 'Posterior'],
                primaryNTs: ['Glutamate', 'GABA', 'Acetylcholine'],
                networks: ['Default Mode Network (DMN)', 'Limbic'],
                clinicalSignificance: 'Atrophy observed in chronic stress and Alzheimer\'s Disease; key in PTSD flashback triggers.'
            },
            hypothalamus: {
                name: 'Hypothalamus',
                color: 'rgba(255, 255, 50, 0.8)',
                description: 'The hypothalamus triggers physiological responses to emotions, such as increased heart rate or stress hormone release.',
                subRegions: ['Paraventricular Nucleus (PVN)', 'Suprachiasmatic Nucleus (SCN)'],
                primaryNTs: ['Oxytocin', 'Vasopressin', 'Dopamine'],
                networks: ['HPA Axis', 'Autonomic Nervous System'],
                clinicalSignificance: 'Dysfunction causes allostatic load imbalance and metabolic disorders.'
            },
            thalamus: {
                name: 'Thalamus',
                color: 'rgba(50, 150, 255, 0.8)',
                description: 'The thalamus acts as a relay station, sending sensory information to the amygdala and cortex for emotional appraisal.',
                subRegions: ['Mediodorsal', 'Pulvinar'],
                primaryNTs: ['Glutamate', 'GABA'],
                networks: ['Sensory-Motor', 'Thalamocortical Loop'],
                clinicalSignificance: 'Sensory gating deficits linked to Schizophrenia and sensory processing sensitivity.'
            },
            brainstem: {
                name: 'Brainstem',
                color: 'rgba(150, 100, 255, 0.8)',
                description: 'The brainstem regulates fundamental autonomic functions and serves as the conduit for the Vagus nerve and major monoamine projections.',
                subRegions: ['Locus Coeruleus', 'Dorsal Raphe', 'VTA'],
                primaryNTs: ['Norepinephrine', 'Serotonin', 'Dopamine'],
                networks: ['Ascending Reticular Activating System (ARAS)'],
                clinicalSignificance: 'Primary target for antidepressants (SSRIs/SNRIs).'
            },
            insula: {
                name: 'Insula',
                color: 'rgba(255, 100, 255, 0.8)',
                description: 'The insula is involved in interoceptive awareness, sensing internal bodily states and mapping them to emotional feelings.',
                subRegions: ['Anterior Insula', 'Posterior Insula'],
                primaryNTs: ['Glutamate', 'GABA'],
                networks: ['Salience Network'],
                clinicalSignificance: 'Overactive in anxiety (hyper-awareness of heart rate); underactive in alexithymia.'
            },
            acc: {
                name: 'Anterior Cingulate Cortex',
                color: 'rgba(100, 255, 255, 0.8)',
                description: 'The ACC monitors conflict between emotional impulses and cognitive goals, and is a target for deep brain stimulation.',
                subRegions: ['dorsal ACC', 'subgenual ACC'],
                primaryNTs: ['Glutamate', 'Serotonin'],
                networks: ['Salience Network', 'CEN'],
                clinicalSignificance: 'Hyperactivity in Area 25 is a marker for Treatment-Resistant Depression.'
            },
            subgenualACC: {
                name: 'Subgenual ACC (Area 25)',
                color: 'rgba(80, 220, 220, 0.7)',
                description: 'Area 25 is specifically linked to sadness and mood regulation, acting as a bridge between the thinking brain and the emotional brain.',
                subRegions: ['Brodmann Area 25'],
                primaryNTs: ['Serotonin'],
                networks: ['Limbic', 'DMN'],
                clinicalSignificance: 'Primary target for Deep Brain Stimulation (DBS) in Treatment-Resistant Depression.'
            },
            striatum: {
                name: 'Striatum',
                color: 'rgba(200, 100, 255, 0.8)',
                description: 'The striatum, including the nucleus accumbens, is the core of the brain\'s reward system and mediates motivation and pleasure.',
                subRegions: ['Caudate', 'Putamen', 'Nucleus Accumbens'],
                primaryNTs: ['Dopamine', 'GABA'],
                networks: ['Reward Circuit', 'Basal Ganglia Loop'],
                clinicalSignificance: 'Dysfunction linked to addiction, habit formation, and OCD.'
            },
            nucleusAccumbens: {
                name: 'Nucleus Accumbens',
                color: 'rgba(180, 80, 255, 0.8)',
                description: 'The "pleasure center" of the brain, the Nucleus Accumbens mediates the rewarding effects of stimuli and the anticipation of pleasure.',
                subRegions: ['NAc Core', 'NAc Shell'],
                primaryNTs: ['Dopamine', 'Opioids'],
                networks: ['Mesolimbic Reward Pathway'],
                clinicalSignificance: 'Central to addiction and the "anhedonia" symptom of depression.'
            }
        },
        philosophies: [
            { id: 'p1', name: 'Stoicism', description: 'Focus on rational control and the dichotomy of control to regulate emotional impulses.', regions: ['dlPFC', 'amygdala'], wellnessFocus: 'Rationality', conditionMapping: 'Emotional Volatility' },
            { id: 'p2', name: 'Buddhism', description: 'Mindfulness and detachment from craving to reduce suffering and calm the mind.', regions: ['insula', 'vmPFC', 'hippocampus'], wellnessFocus: 'Equanimity', conditionMapping: 'Craving/Attachment' },
            { id: 'p3', name: 'Existentialism', description: 'Creating individual meaning and exercising radical freedom in an indifferent universe.', regions: ['ofc', 'acc'], wellnessFocus: 'Agency', conditionMapping: 'Existential Dread' },
            { id: 'p4', name: 'Taoism', description: 'Harmony with the natural flow of the universe (Wu Wei) through balance and non-action.', regions: ['thalamus', 'hypothalamus'], wellnessFocus: 'Harmony', conditionMapping: 'Hyper-striving' },
            { id: 'p5', name: 'Nihilism', description: 'Recognizing the lack of intrinsic meaning as a form of detachment and freedom from social pressure.', regions: ['striatum', 'prefrontalCortex'], wellnessFocus: 'Detachment', conditionMapping: 'Social Pressure' },
            { id: 'p6', name: 'Epicureanism', description: 'Pursuit of modest, sustainable pleasures and the complete absence of physical and mental pain.', regions: ['nucleusAccumbens', 'striatum'], wellnessFocus: 'Tranquility', conditionMapping: 'Hedonic Treadmill' }
        ]
    };

    window.GreenhouseEmotionConfig = GreenhouseEmotionConfig;
})();
