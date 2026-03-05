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
                name: 'emotion_reg_pfc_name',
                color: 'rgba(200, 200, 200, 0.4)',
                description: 'emotion_reg_pfc_desc',
                subRegions: ['dlPFC', 'vmPFC', 'OFC'],
                primaryNTs: ['Glutamate', 'Dopamine', 'Serotonin'],
                networks: ['CEN', 'DMN'],
                clinicalSignificance: 'emotion_reg_pfc_clin'
            },
            dlPFC: {
                name: 'emotion_reg_dlpfc_name',
                color: 'rgba(100, 180, 255, 0.7)',
                description: 'emotion_reg_dlpfc_desc',
                subRegions: ['Brodmann Area 9/46'],
                primaryNTs: ['Dopamine', 'Glutamate'],
                networks: ['Central Executive Network (CEN)'],
                clinicalSignificance: 'emotion_reg_dlpfc_clin'
            },
            vmPFC: {
                name: 'emotion_reg_vmpfc_name',
                color: 'rgba(120, 160, 255, 0.7)',
                description: 'emotion_reg_vmpfc_desc',
                subRegions: ['Brodmann Area 10/11/32'],
                primaryNTs: ['Serotonin', 'Glutamate'],
                networks: ['Default Mode Network (DMN)'],
                clinicalSignificance: 'emotion_reg_vmpfc_clin'
            },
            ofc: {
                name: 'emotion_reg_ofc_name',
                color: 'rgba(80, 140, 255, 0.7)',
                description: 'emotion_reg_ofc_desc',
                subRegions: ['Brodmann Area 11/12'],
                primaryNTs: ['Dopamine', 'Serotonin'],
                networks: ['Reward Circuit'],
                clinicalSignificance: 'emotion_reg_ofc_clin'
            },
            amygdala: {
                name: 'emotion_reg_amygdala_name',
                color: 'rgba(255, 50, 50, 0.8)',
                description: 'emotion_reg_amygdala_desc',
                subRegions: ['Basolateral (BLA)', 'Centromedial (CeA)'],
                primaryNTs: ['Glutamate', 'GABA', 'CRH'],
                networks: ['Salience', 'Threat-Detection'],
                clinicalSignificance: 'emotion_reg_amygdala_clin'
            },
            hippocampus: {
                name: 'emotion_reg_hippocampus_name',
                color: 'rgba(50, 255, 50, 0.8)',
                description: 'emotion_reg_hippocampus_desc',
                subRegions: ['Anterior', 'Posterior'],
                primaryNTs: ['Glutamate', 'GABA', 'Acetylcholine'],
                networks: ['Default Mode Network (DMN)', 'Limbic'],
                clinicalSignificance: 'emotion_reg_hippocampus_clin'
            },
            hypothalamus: {
                name: 'emotion_reg_hypothalamus_name',
                color: 'rgba(255, 255, 50, 0.8)',
                description: 'emotion_reg_hypothalamus_desc',
                subRegions: ['Paraventricular Nucleus (PVN)', 'Suprachiasmatic Nucleus (SCN)'],
                primaryNTs: ['Oxytocin', 'Vasopressin', 'Dopamine'],
                networks: ['HPA Axis', 'Autonomic Nervous System'],
                clinicalSignificance: 'emotion_reg_hypothalamus_clin'
            },
            thalamus: {
                name: 'emotion_reg_thalamus_name',
                color: 'rgba(50, 150, 255, 0.8)',
                description: 'emotion_reg_thalamus_desc',
                subRegions: ['Mediodorsal', 'Pulvinar'],
                primaryNTs: ['Glutamate', 'GABA'],
                networks: ['Sensory-Motor', 'Thalamocortical Loop'],
                clinicalSignificance: 'emotion_reg_thalamus_clin'
            },
            brainstem: {
                name: 'emotion_reg_brainstem_name',
                color: 'rgba(150, 100, 255, 0.8)',
                description: 'emotion_reg_brainstem_desc',
                subRegions: ['Locus Coeruleus', 'Dorsal Raphe', 'VTA'],
                primaryNTs: ['Norepinephrine', 'Serotonin', 'Dopamine'],
                networks: ['Ascending Reticular Activating System (ARAS)'],
                clinicalSignificance: 'emotion_reg_brainstem_clin'
            },
            insula: {
                name: 'emotion_reg_insula_name',
                color: 'rgba(255, 100, 255, 0.8)',
                description: 'emotion_reg_insula_desc',
                subRegions: ['Anterior Insula', 'Posterior Insula'],
                primaryNTs: ['Glutamate', 'GABA'],
                networks: ['Salience Network'],
                clinicalSignificance: 'emotion_reg_insula_clin'
            },
            acc: {
                name: 'emotion_reg_acc_name',
                color: 'rgba(100, 255, 255, 0.8)',
                description: 'emotion_reg_acc_desc',
                subRegions: ['dorsal ACC', 'subgenual ACC'],
                primaryNTs: ['Glutamate', 'Serotonin'],
                networks: ['Salience Network', 'CEN'],
                clinicalSignificance: 'emotion_reg_acc_clin'
            },
            subgenualACC: {
                name: 'emotion_reg_sacc_name',
                color: 'rgba(80, 220, 220, 0.7)',
                description: 'emotion_reg_sacc_desc',
                subRegions: ['Brodmann Area 25'],
                primaryNTs: ['Serotonin'],
                networks: ['Limbic', 'DMN'],
                clinicalSignificance: 'emotion_reg_sacc_clin'
            },
            striatum: {
                name: 'emotion_reg_striatum_name',
                color: 'rgba(200, 100, 255, 0.8)',
                description: 'emotion_reg_striatum_desc',
                subRegions: ['Caudate', 'Putamen', 'Nucleus Accumbens'],
                primaryNTs: ['Dopamine', 'GABA'],
                networks: ['Reward Circuit', 'Basal Ganglia Loop'],
                clinicalSignificance: 'emotion_reg_striatum_clin'
            },
            nucleusAccumbens: {
                name: 'emotion_reg_nacc_name',
                color: 'rgba(180, 80, 255, 0.8)',
                description: 'emotion_reg_nacc_desc',
                subRegions: ['NAc Core', 'NAc Shell'],
                primaryNTs: ['Dopamine', 'Opioids'],
                networks: ['Mesolimbic Reward Pathway'],
                clinicalSignificance: 'emotion_reg_nacc_clin'
            }
        },
        philosophies: [
            { id: 'p1', name: 'emotion_phil_stoicism_name', description: 'emotion_phil_stoicism_desc', regions: ['dlPFC', 'amygdala'], wellnessFocus: 'emotion_phil_stoicism_well', conditionMapping: 'emotion_phil_stoicism_cond' },
            { id: 'p2', name: 'emotion_phil_buddhism_name', description: 'emotion_phil_buddhism_desc', regions: ['insula', 'vmPFC', 'hippocampus'], wellnessFocus: 'emotion_phil_buddhism_well', conditionMapping: 'emotion_phil_buddhism_cond' },
            { id: 'p3', name: 'emotion_phil_existentialism_name', description: 'emotion_phil_existentialism_desc', regions: ['ofc', 'acc'], wellnessFocus: 'emotion_phil_existentialism_well', conditionMapping: 'emotion_phil_existentialism_cond' },
            { id: 'p4', name: 'emotion_phil_taoism_name', description: 'emotion_phil_taoism_desc', regions: ['thalamus', 'hypothalamus'], wellnessFocus: 'emotion_phil_taoism_well', conditionMapping: 'emotion_phil_taoism_cond' },
            { id: 'p5', name: 'emotion_phil_nihilism_name', description: 'emotion_phil_nihilism_desc', regions: ['striatum', 'prefrontalCortex'], wellnessFocus: 'emotion_phil_nihilism_well', conditionMapping: 'emotion_phil_nihilism_cond' },
            { id: 'p6', name: 'emotion_phil_epicureanism_name', description: 'emotion_phil_epicureanism_desc', regions: ['nucleusAccumbens', 'striatum'], wellnessFocus: 'emotion_phil_epicureanism_well', conditionMapping: 'emotion_phil_epicureanism_cond' }
        ]
    };

    window.GreenhouseEmotionConfig = GreenhouseEmotionConfig;
})();
