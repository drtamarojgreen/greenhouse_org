/**
 * @file stress_config.js
 * @description Enhanced Configuration for the Stress Dynamics Simulation.
 * Includes 100 scientifically & philosophically verified systemic factors.
 */

(function () {
    'use strict';

    const GreenhouseStressConfig = {
        factors: [
            {
                id: 'viewMode', label: 'label_view_mode', defaultValue: 0, options: [
                    { value: 0, label: 'REGULATORY (MACRO)' },
                    { value: 1, label: 'PATHWAY (HPA)' },
                    { value: 2, label: 'SYSTEMIC (ADAPTIVE)' }
                ], type: 'button'
            },
            {
                id: 'activePathway', label: 'Select Specialized Pathway', defaultValue: 'hpa', options: [
                    { value: 'hpa', label: 'HPA Axis' },
                    { value: 'tryptophan', label: 'Tryptophan-Kynurenine' },
                    { value: 'dopaminergic', label: 'Dopaminergic System' },
                    { value: 'serotonergeric', label: 'Serotonergic System' }
                ], type: 'select'
            },

            // I. ENVIRONMENTAL FACTORS (Stressors)
            { id: 'env_noise', label: 'Noise Pollution', category: 'env', type: 'checkbox', defaultValue: 1 },
            { id: 'env_air', label: 'Air Quality (PM2.5)', category: 'env', type: 'checkbox', defaultValue: 0 },
            { id: 'env_heat', label: 'Heat Stress', category: 'env', type: 'checkbox', defaultValue: 0 },
            { id: 'env_light', label: 'Light Pollution', category: 'env', type: 'checkbox', defaultValue: 0 },
            { id: 'env_crowd', label: 'Social Density', category: 'env', type: 'checkbox', defaultValue: 0 },
            { id: 'env_biophil', label: 'Biophilic Deficiency', category: 'env', type: 'checkbox', defaultValue: 0 },
            { id: 'env_lead', label: 'Lead Contamination', category: 'env', type: 'checkbox', defaultValue: 0 },
            { id: 'env_pest', label: 'Pesticide Exposure', category: 'env', type: 'checkbox', defaultValue: 0 },
            { id: 'env_food', label: 'Food Deserts', category: 'env', type: 'checkbox', defaultValue: 0 },
            { id: 'env_housing', label: 'Housing Instability', category: 'env', type: 'checkbox', defaultValue: 0 },
            { id: 'env_occup', label: 'Occupational Hazards', category: 'env', type: 'checkbox', defaultValue: 0 },
            { id: 'env_disaster', label: 'Natural Disasters', category: 'env', type: 'checkbox', defaultValue: 0 },
            { id: 'env_commute', label: 'Commute Duration', category: 'env', type: 'checkbox', defaultValue: 1 },
            { id: 'env_chaos', label: 'Visual Chaos', category: 'env', type: 'checkbox', defaultValue: 0 },
            { id: 'env_sun', label: 'Natural Light Lack', category: 'env', type: 'checkbox', defaultValue: 0 },
            { id: 'env_violence', label: 'Neighborhood Violence', category: 'env', type: 'checkbox', defaultValue: 0 },
            { id: 'env_emf', label: 'EMF Exposure', category: 'env', type: 'checkbox', defaultValue: 0 },
            { id: 'env_urban', label: 'Urbanicity', category: 'env', type: 'checkbox', defaultValue: 1 },
            { id: 'env_blue', label: 'Blue Space Access', category: 'env', type: 'checkbox', defaultValue: 0 },
            { id: 'env_bio', label: 'Biodiversity Loss', category: 'env', type: 'checkbox', defaultValue: 0 },
            { id: 'env_voc', label: 'Indoor VOCs', category: 'env', type: 'checkbox', defaultValue: 0 },
            { id: 'env_acoustic', label: 'Acoustic Privacy', category: 'env', type: 'checkbox', defaultValue: 0 },
            { id: 'env_ergo', label: 'Ergonomic Stress', category: 'env', type: 'checkbox', defaultValue: 1 },
            { id: 'env_odor', label: 'Malodors', category: 'env', type: 'checkbox', defaultValue: 0 },
            { id: 'env_walk', label: 'Poor Walkability', category: 'env', type: 'checkbox', defaultValue: 0 },

            // II. PSYCHOLOGICAL THEORIES (Buffers/Modulators)
            { id: 'psych_trans', label: 'Transactional Model', category: 'psych', type: 'checkbox', defaultValue: 1 },
            { id: 'psych_cor', label: 'Conservation of Resources', category: 'psych', type: 'checkbox', defaultValue: 0 },
            { id: 'psych_gas', label: 'Gen. Adaptation Syndrome', category: 'psych', type: 'checkbox', defaultValue: 0 },
            { id: 'psych_appraisal', label: 'Cognitive Appraisal', category: 'psych', type: 'checkbox', defaultValue: 1 },
            { id: 'psych_broaden', label: 'Broaden-and-Build', category: 'psych', type: 'checkbox', defaultValue: 0 },
            { id: 'psych_sdt', label: 'Self-Determination', category: 'psych', type: 'checkbox', defaultValue: 0 },
            { id: 'psych_jdc', label: 'Job Demand-Control', category: 'psych', type: 'checkbox', defaultValue: 0 },
            { id: 'psych_eri', label: 'Effort-Reward Imbal.', category: 'psych', type: 'checkbox', defaultValue: 0 },
            { id: 'psych_eco', label: 'Ecological Systems', category: 'psych', type: 'checkbox', defaultValue: 0 },
            { id: 'psych_resil', label: 'Resilience Framework', category: 'psych', type: 'checkbox', defaultValue: 1 },
            { id: 'psych_help', label: 'Learned Helplessness', category: 'psych', type: 'checkbox', defaultValue: 0 },
            { id: 'psych_hardy', label: 'Hardiness Theory', category: 'psych', type: 'checkbox', defaultValue: 0 },
            { id: 'psych_soc', label: 'Sense of Coherence', category: 'psych', type: 'checkbox', defaultValue: 0 },
            { id: 'psych_tend', label: 'Tend-and-Befriend', category: 'psych', type: 'checkbox', defaultValue: 0 },
            { id: 'psych_poly', label: 'Polyvagal Theory', category: 'psych', type: 'checkbox', defaultValue: 1 },
            { id: 'psych_support', label: 'Social Support', category: 'psych', type: 'checkbox', defaultValue: 1 },
            { id: 'psych_attach', label: 'Attachment Security', category: 'psych', type: 'checkbox', defaultValue: 0 },
            { id: 'psych_contagion', label: 'Stress Contagion', category: 'psych', type: 'checkbox', defaultValue: 0 },
            { id: 'psych_growth', label: 'Growth Mindset', category: 'psych', type: 'checkbox', defaultValue: 1 },
            { id: 'psych_eq', label: 'Emotional Intelligence', category: 'psych', type: 'checkbox', defaultValue: 0 },
            { id: 'psych_mbsr', label: 'MBSR', category: 'psych', type: 'checkbox', defaultValue: 1 },
            { id: 'psych_act', label: 'ACT (Flexibility)', category: 'psych', type: 'checkbox', defaultValue: 0 },
            { id: 'psych_perse', label: 'Perseverative Cognition', category: 'psych', type: 'checkbox', defaultValue: 0 },
            { id: 'psych_alo', label: 'Allostatic Load', category: 'psych', type: 'checkbox', defaultValue: 1 },
            { id: 'psych_cbt', label: 'CBT Management', category: 'psych', type: 'checkbox', defaultValue: 1 },

            // III. PHILOSOPHICAL VIEWS (Perspective Shifts)
            { id: 'philo_stoic', label: 'Stoic Dichotomy', category: 'philo', type: 'checkbox', defaultValue: 1 },
            { id: 'philo_meaning', label: 'Will to Meaning', category: 'philo', type: 'checkbox', defaultValue: 0 },
            { id: 'philo_dukkha', label: 'Concept of Dukkha', category: 'philo', type: 'checkbox', defaultValue: 0 },
            { id: 'philo_wuwei', label: 'Wu Wei (Effortless)', category: 'philo', type: 'checkbox', defaultValue: 0 },
            { id: 'philo_ata', label: 'Ataraxia (Tranquility)', category: 'philo', type: 'checkbox', defaultValue: 0 },
            { id: 'philo_dasein', label: 'Dasein & Care', category: 'philo', type: 'checkbox', defaultValue: 0 },
            { id: 'philo_nihil', label: 'Optimistic Nihilism', category: 'philo', type: 'checkbox', defaultValue: 0 },
            { id: 'philo_care', label: 'Ethics of Care', category: 'philo', type: 'checkbox', defaultValue: 0 },
            { id: 'philo_phron', label: 'Phronesis', category: 'philo', type: 'checkbox', defaultValue: 0 },
            { id: 'philo_con', label: 'Conatus', category: 'philo', type: 'checkbox', defaultValue: 0 },
            { id: 'philo_amor', label: 'Amor Fati', category: 'philo', type: 'checkbox', defaultValue: 0 },
            { id: 'philo_eud', label: 'Eudaimonia', category: 'philo', type: 'checkbox', defaultValue: 1 },
            { id: 'philo_ubuntu', label: 'Ubuntu', category: 'philo', type: 'checkbox', defaultValue: 0 },
            { id: 'philo_cynic', label: 'Cynic Detachment', category: 'philo', type: 'checkbox', defaultValue: 0 },
            { id: 'philo_hed', label: 'Hedonic Adaptation', category: 'philo', type: 'checkbox', defaultValue: 0 },
            { id: 'philo_kant', label: 'Kantian Duty', category: 'philo', type: 'checkbox', defaultValue: 0 },
            { id: 'philo_util', label: 'Utilitarian Burden', category: 'philo', type: 'checkbox', defaultValue: 0 },
            { id: 'philo_will', label: 'Will to Believe', category: 'philo', type: 'checkbox', defaultValue: 0 },
            { id: 'philo_solip', label: 'Solipsism', category: 'philo', type: 'checkbox', defaultValue: 0 },
            { id: 'philo_det', label: 'Determinism', category: 'philo', type: 'checkbox', defaultValue: 0 },
            { id: 'philo_soc', label: 'Socratic Inquiry', category: 'philo', type: 'checkbox', defaultValue: 0 },
            { id: 'philo_abs', label: 'Absurdist Revolt', category: 'philo', type: 'checkbox', defaultValue: 0 },
            { id: 'philo_trans', label: 'Transhumanism', category: 'philo', type: 'checkbox', defaultValue: 0 },
            { id: 'philo_self', label: 'Self-Actualization', category: 'philo', type: 'checkbox', defaultValue: 1 },
            { id: 'philo_asc', label: 'Ascetic Mastery', category: 'philo', type: 'checkbox', defaultValue: 0 },

            // IV. EMERGING RESEARCH (Biological Modifiers)
            { id: 'res_epi', label: 'Transgen. Epigenetics', category: 'research', type: 'checkbox', defaultValue: 0 },
            { id: 'res_bio', label: 'Psychobiotics', category: 'research', type: 'checkbox', defaultValue: 1 },
            { id: 'res_hrv', label: 'HRV Biofeedback', category: 'research', type: 'checkbox', defaultValue: 1 },
            { id: 'res_telo', label: 'Telomere Shortening', category: 'research', type: 'checkbox', defaultValue: 0 },
            { id: 'res_opto', label: 'Optogenetics', category: 'research', type: 'checkbox', defaultValue: 0 },
            { id: 'res_car', label: 'Cortisol Awakening', category: 'research', type: 'checkbox', defaultValue: 1 },
            { id: 'res_dig', label: 'Digital Phenotyping', category: 'research', type: 'checkbox', defaultValue: 0 },
            { id: 'res_vr', label: 'VR Stress Inoc.', category: 'research', type: 'checkbox', defaultValue: 0 },
            { id: 'res_plast', label: 'Struct. Plasticity', category: 'research', type: 'checkbox', defaultValue: 1 },
            { id: 'res_immuno', label: 'Immunopsychiatry', category: 'research', type: 'checkbox', defaultValue: 0 },
            { id: 'res_ai', label: 'AI Coping', category: 'research', type: 'checkbox', defaultValue: 0 },
            { id: 'res_pat', label: 'Paternal Epigenetics', category: 'research', type: 'checkbox', defaultValue: 0 },
            { id: 'res_glym', label: 'Glymphatic System', category: 'research', type: 'checkbox', defaultValue: 1 },
            { id: 'res_forest', label: 'Forest Bathing', category: 'research', type: 'checkbox', defaultValue: 1 },
            { id: 'res_oxy', label: 'Oxytocin Balance', category: 'research', type: 'checkbox', defaultValue: 0 },
            { id: 'res_exc', label: 'Excitotoxicity', category: 'research', type: 'checkbox', defaultValue: 0 },
            { id: 'res_tdcs', label: 'tDCS Resilience', category: 'research', type: 'checkbox', defaultValue: 0 },
            { id: 'res_ket', label: 'Ketamine Resilience', category: 'research', type: 'checkbox', defaultValue: 0 },
            { id: 'res_psych', label: 'Psychedelic Plasticity', category: 'research', type: 'checkbox', defaultValue: 0 },
            { id: 'res_sweat', label: 'Sweat Sensing', category: 'research', type: 'checkbox', defaultValue: 0 },
            { id: 'res_dbs', label: 'DBS Area 25', category: 'research', type: 'checkbox', defaultValue: 0 },
            { id: 'res_cit', label: 'Citizen Mapping', category: 'research', type: 'checkbox', defaultValue: 0 },
            { id: 'res_pred', label: 'Predictive Processing', category: 'research', type: 'checkbox', defaultValue: 0 },
            { id: 'res_meta', label: 'Metabolic Psych', category: 'research', type: 'checkbox', defaultValue: 0 },
            { id: 'res_quant', label: 'Quantum Cognition', category: 'research', type: 'checkbox', defaultValue: 0 },

            // Legacy/Mandatory Factors
            { id: 'gutHealth', label: 'Gut-Brain Integrity', type: 'checkbox', defaultValue: 1 },
            { id: 'comtValMet', label: 'COMT Gene', category: 'gen', type: 'checkbox', defaultValue: 0 },
            { id: 'serotoninTransporter', label: '5-HTTLPR Gene', category: 'gen', type: 'checkbox', defaultValue: 0 },
            { id: 'fkbp5Variant', label: 'FKBP5 Gene', category: 'gen', type: 'checkbox', defaultValue: 0 }
        ],
        metrics: [
            { id: 'allostaticLoad', label: 'metric_allostatic_load', unit: '%' },
            { id: 'autonomicBalance', label: 'metric_autonomic_balance', unit: '' },
            { id: 'resilienceReserve', label: 'metric_resilience_reserve', unit: '%' },
            { id: 'hpaSensitivity', label: 'HPA Sensitivity', unit: '' },
            { id: 'hrv', label: 'Heart Rate Variability', unit: 'ms' },
            { id: 'vagalTone', label: 'Vagal Tone (Parasym.)', unit: '%' },
            { id: 'serotoninLevels', label: 'Serotonin Level', unit: '%' },
            { id: 'dopamineLevels', label: 'Dopamine Level', unit: '%' },
            { id: 'cortisolLevels', label: 'Cortisol Concentration', unit: 'ug/dL' }
        ],
        visual: {
            maxHistory: 200,
            colors: {
                biologic: '#ff4d4d',
                pharma: '#64d2ff',
                psych: '#ffcc00',
                philo: '#a18cd1',
                reserve: '#4ca1af'
            }
        }
    };

    window.GreenhouseStressConfig = GreenhouseStressConfig;
})();
