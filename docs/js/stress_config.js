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
                    { value: 0, label: 'stress_ui_regulatory' },
                    { value: 1, label: 'stress_ui_pathway' },
                    { value: 2, label: 'stress_ui_systemic' }
                ], type: 'button'
            },
            {
                id: 'activePathway', label: 'stress_ui_select_pathway', defaultValue: 'hpa', options: [
                    { value: 'hpa', label: 'stress_path_hpa' },
                    { value: 'tryptophan', label: 'stress_path_tryptophan' },
                    { value: 'dopaminergic', label: 'stress_path_dopaminergic' },
                    { value: 'serotonergic', label: 'stress_path_serotonergic' },
                    { value: 'nitric_oxide', label: 'stress_path_nitric_oxide' }
                ], type: 'select'
            },
            {
                id: 'showGraphView', label: 'Show Topic Graph', defaultValue: 0, type: 'hidden'
            },

            // I. ENVIRONMENTAL FACTORS (Stressors)
            { id: 'env_noise', label: 'stress_env_noise', category: 'env', type: 'checkbox', defaultValue: 1 },
            { id: 'env_air', label: 'stress_env_air', category: 'env', type: 'checkbox', defaultValue: 0 },
            { id: 'env_heat', label: 'stress_env_heat', category: 'env', type: 'checkbox', defaultValue: 0 },
            { id: 'env_light', label: 'stress_env_light', category: 'env', type: 'checkbox', defaultValue: 0 },
            { id: 'env_crowd', label: 'stress_env_crowd', category: 'env', type: 'checkbox', defaultValue: 0 },
            { id: 'env_biophil', label: 'stress_env_biophil', category: 'env', type: 'checkbox', defaultValue: 0 },
            { id: 'env_lead', label: 'stress_env_lead', category: 'env', type: 'checkbox', defaultValue: 0 },
            { id: 'env_pest', label: 'stress_env_pest', category: 'env', type: 'checkbox', defaultValue: 0 },
            { id: 'env_food', label: 'stress_env_food', category: 'env', type: 'checkbox', defaultValue: 0 },
            { id: 'env_housing', label: 'stress_env_housing', category: 'env', type: 'checkbox', defaultValue: 0 },
            { id: 'env_occup', label: 'stress_env_occup', category: 'env', type: 'checkbox', defaultValue: 0 },
            { id: 'env_disaster', label: 'stress_env_disaster', category: 'env', type: 'checkbox', defaultValue: 0 },
            { id: 'env_commute', label: 'stress_env_commute', category: 'env', type: 'checkbox', defaultValue: 1 },
            { id: 'env_chaos', label: 'stress_env_chaos', category: 'env', type: 'checkbox', defaultValue: 0 },
            { id: 'env_sun', label: 'stress_env_sun', category: 'env', type: 'checkbox', defaultValue: 0 },
            { id: 'env_violence', label: 'stress_env_violence', category: 'env', type: 'checkbox', defaultValue: 0 },
            { id: 'env_emf', label: 'stress_env_emf', category: 'env', type: 'checkbox', defaultValue: 0 },
            { id: 'env_urban', label: 'stress_env_urban', category: 'env', type: 'checkbox', defaultValue: 1 },
            { id: 'env_blue', label: 'stress_env_blue', category: 'env', type: 'checkbox', defaultValue: 0 },
            { id: 'env_bio', label: 'stress_env_bio', category: 'env', type: 'checkbox', defaultValue: 0 },
            { id: 'env_voc', label: 'stress_env_voc', category: 'env', type: 'checkbox', defaultValue: 0 },
            { id: 'env_acoustic', label: 'stress_env_acoustic', category: 'env', type: 'checkbox', defaultValue: 0 },
            { id: 'env_ergo', label: 'stress_env_ergo', category: 'env', type: 'checkbox', defaultValue: 1 },
            { id: 'env_odor', label: 'stress_env_odor', category: 'env', type: 'checkbox', defaultValue: 0 },
            { id: 'env_walk', label: 'stress_env_walk', category: 'env', type: 'checkbox', defaultValue: 0 },
            { id: 'sleepDeprivation', label: 'stress_env_sleep', category: 'env', type: 'checkbox', defaultValue: 0 },

            // II. PSYCHOLOGICAL THEORIES (Buffers/Modulators)
            { id: 'psych_trans', label: 'stress_psych_trans', category: 'psych', type: 'checkbox', defaultValue: 1 },
            { id: 'psych_cor', label: 'stress_psych_cor', category: 'psych', type: 'checkbox', defaultValue: 0 },
            { id: 'psych_gas', label: 'stress_psych_gas', category: 'psych', type: 'checkbox', defaultValue: 0 },
            { id: 'psych_appraisal', label: 'stress_psych_appraisal', category: 'psych', type: 'checkbox', defaultValue: 1 },
            { id: 'psych_broaden', label: 'stress_psych_broaden', category: 'psych', type: 'checkbox', defaultValue: 0 },
            { id: 'psych_sdt', label: 'stress_psych_sdt', category: 'psych', type: 'checkbox', defaultValue: 0 },
            { id: 'psych_jdc', label: 'stress_psych_jdc', category: 'psych', type: 'checkbox', defaultValue: 0 },
            { id: 'psych_eri', label: 'stress_psych_eri', category: 'psych', type: 'checkbox', defaultValue: 0 },
            { id: 'psych_eco', label: 'stress_psych_eco', category: 'psych', type: 'checkbox', defaultValue: 0 },
            { id: 'psych_resil', label: 'stress_psych_resil', category: 'psych', type: 'checkbox', defaultValue: 1 },
            { id: 'psych_help', label: 'stress_psych_help', category: 'psych', type: 'checkbox', defaultValue: 0 },
            { id: 'psych_hardy', label: 'stress_psych_hardy', category: 'psych', type: 'checkbox', defaultValue: 0 },
            { id: 'psych_soc', label: 'stress_psych_soc', category: 'psych', type: 'checkbox', defaultValue: 0 },
            { id: 'psych_tend', label: 'stress_psych_tend', category: 'psych', type: 'checkbox', defaultValue: 0 },
            { id: 'psych_poly', label: 'stress_psych_poly', category: 'psych', type: 'checkbox', defaultValue: 1 },
            { id: 'psych_support', label: 'stress_psych_support', category: 'psych', type: 'checkbox', defaultValue: 1 },
            { id: 'psych_attach', label: 'stress_psych_attach', category: 'psych', type: 'checkbox', defaultValue: 0 },
            { id: 'psych_contagion', label: 'stress_psych_contagion', category: 'psych', type: 'checkbox', defaultValue: 0 },
            { id: 'psych_growth', label: 'stress_psych_growth', category: 'psych', type: 'checkbox', defaultValue: 1 },
            { id: 'psych_eq', label: 'stress_psych_eq', category: 'psych', type: 'checkbox', defaultValue: 0 },
            { id: 'psych_mbsr', label: 'stress_psych_mbsr', category: 'psych', type: 'checkbox', defaultValue: 1 },
            { id: 'psych_act', label: 'stress_psych_act', category: 'psych', type: 'checkbox', defaultValue: 0 },
            { id: 'psych_perse', label: 'stress_psych_perse', category: 'psych', type: 'checkbox', defaultValue: 0 },
            { id: 'psych_alo', label: 'stress_psych_alo', category: 'psych', type: 'checkbox', defaultValue: 1 },
            { id: 'psych_cbt', label: 'stress_psych_cbt', category: 'psych', type: 'checkbox', defaultValue: 1 },

            // III. PHILOSOPHICAL VIEWS (Perspective Shifts)
            { id: 'philo_stoic', label: 'stress_philo_stoic', category: 'philo', type: 'checkbox', defaultValue: 1 },
            { id: 'philo_meaning', label: 'stress_philo_meaning', category: 'philo', type: 'checkbox', defaultValue: 0 },
            { id: 'philo_dukkha', label: 'stress_philo_dukkha', category: 'philo', type: 'checkbox', defaultValue: 0 },
            { id: 'philo_wuwei', label: 'stress_philo_wuwei', category: 'philo', type: 'checkbox', defaultValue: 0 },
            { id: 'philo_ata', label: 'stress_philo_ata', category: 'philo', type: 'checkbox', defaultValue: 0 },
            { id: 'philo_dasein', label: 'stress_philo_dasein', category: 'philo', type: 'checkbox', defaultValue: 0 },
            { id: 'philo_nihil', label: 'stress_philo_nihil', category: 'philo', type: 'checkbox', defaultValue: 0 },
            { id: 'philo_care', label: 'stress_philo_care', category: 'philo', type: 'checkbox', defaultValue: 0 },
            { id: 'philo_phron', label: 'stress_philo_phron', category: 'philo', type: 'checkbox', defaultValue: 0 },
            { id: 'philo_con', label: 'stress_philo_con', category: 'philo', type: 'checkbox', defaultValue: 0 },
            { id: 'philo_amor', label: 'stress_philo_amor', category: 'philo', type: 'checkbox', defaultValue: 0 },
            { id: 'philo_eud', label: 'stress_philo_eud', category: 'philo', type: 'checkbox', defaultValue: 1 },
            { id: 'philo_ubuntu', label: 'stress_philo_ubuntu', category: 'philo', type: 'checkbox', defaultValue: 0 },
            { id: 'philo_cynic', label: 'stress_philo_cynic', category: 'philo', type: 'checkbox', defaultValue: 0 },
            { id: 'philo_hed', label: 'stress_philo_hed', category: 'philo', type: 'checkbox', defaultValue: 0 },
            { id: 'philo_kant', label: 'stress_philo_kant', category: 'philo', type: 'checkbox', defaultValue: 0 },
            { id: 'philo_util', label: 'stress_philo_util', category: 'philo', type: 'checkbox', defaultValue: 0 },
            { id: 'philo_will', label: 'stress_philo_will', category: 'philo', type: 'checkbox', defaultValue: 0 },
            { id: 'philo_solip', label: 'stress_philo_solip', category: 'philo', type: 'checkbox', defaultValue: 0 },
            { id: 'philo_det', label: 'stress_philo_det', category: 'philo', type: 'checkbox', defaultValue: 0 },
            { id: 'philo_soc', label: 'stress_philo_soc', category: 'philo', type: 'checkbox', defaultValue: 0 },
            { id: 'philo_abs', label: 'stress_philo_abs', category: 'philo', type: 'checkbox', defaultValue: 0 },
            { id: 'philo_trans', label: 'stress_philo_trans', category: 'philo', type: 'checkbox', defaultValue: 0 },
            { id: 'philo_self', label: 'stress_philo_self', category: 'philo', type: 'checkbox', defaultValue: 1 },
            { id: 'philo_asc', label: 'stress_philo_asc', category: 'philo', type: 'checkbox', defaultValue: 0 },

            // IV. EMERGING RESEARCH (Biological Modifiers)
            { id: 'res_epi', label: 'stress_res_epi', category: 'research', type: 'checkbox', defaultValue: 0 },
            { id: 'res_bio', label: 'stress_res_bio', category: 'research', type: 'checkbox', defaultValue: 1 },
            { id: 'res_hrv', label: 'stress_res_hrv', category: 'research', type: 'checkbox', defaultValue: 1 },
            { id: 'res_telo', label: 'stress_res_telo', category: 'research', type: 'checkbox', defaultValue: 0 },
            { id: 'res_opto', label: 'stress_res_opto', category: 'research', type: 'checkbox', defaultValue: 0 },
            { id: 'res_car', label: 'stress_res_car', category: 'research', type: 'checkbox', defaultValue: 1 },
            { id: 'res_dig', label: 'stress_res_dig', category: 'research', type: 'checkbox', defaultValue: 0 },
            { id: 'res_vr', label: 'stress_res_vr', category: 'research', type: 'checkbox', defaultValue: 0 },
            { id: 'res_plast', label: 'stress_res_plast', category: 'research', type: 'checkbox', defaultValue: 1 },
            { id: 'res_immuno', label: 'stress_res_immuno', category: 'research', type: 'checkbox', defaultValue: 0 },
            { id: 'res_ai', label: 'stress_res_ai', category: 'research', type: 'checkbox', defaultValue: 0 },
            { id: 'res_pat', label: 'stress_res_pat', category: 'research', type: 'checkbox', defaultValue: 0 },
            { id: 'res_glym', label: 'stress_res_glym', category: 'research', type: 'checkbox', defaultValue: 1 },
            { id: 'res_forest', label: 'stress_res_forest', category: 'research', type: 'checkbox', defaultValue: 1 },
            { id: 'res_oxy', label: 'stress_res_oxy', category: 'research', type: 'checkbox', defaultValue: 0 },
            { id: 'res_exc', label: 'stress_res_exc', category: 'research', type: 'checkbox', defaultValue: 0 },
            { id: 'res_tdcs', label: 'stress_res_tdcs', category: 'research', type: 'checkbox', defaultValue: 0 },
            { id: 'res_ket', label: 'stress_res_ket', category: 'research', type: 'checkbox', defaultValue: 0 },
            { id: 'res_psych', label: 'stress_res_psych', category: 'research', type: 'checkbox', defaultValue: 0 },
            { id: 'res_sweat', label: 'stress_res_sweat', category: 'research', type: 'checkbox', defaultValue: 0 },
            { id: 'res_dbs', label: 'stress_res_dbs', category: 'research', type: 'checkbox', defaultValue: 0 },
            { id: 'res_cit', label: 'stress_res_cit', category: 'research', type: 'checkbox', defaultValue: 0 },
            { id: 'res_pred', label: 'stress_res_pred', category: 'research', type: 'checkbox', defaultValue: 0 },
            { id: 'res_meta', label: 'stress_res_meta', category: 'research', type: 'checkbox', defaultValue: 0 },
            { id: 'res_quant', label: 'stress_res_quant', category: 'research', type: 'checkbox', defaultValue: 0 },

            // Legacy/Mandatory Factors
            { id: 'gutHealth', label: 'factor_gut_health', type: 'checkbox', defaultValue: 1 },
            { id: 'comtValMet', label: 'comtValMet', category: 'gen', type: 'checkbox', defaultValue: 0 },
            { id: 'serotoninTransporter', label: 'serotoninTransporter', category: 'gen', type: 'checkbox', defaultValue: 0 },
            { id: 'fkbp5Variant', label: 'fkbp5Variant', category: 'gen', type: 'checkbox', defaultValue: 0 },

            // V. BIOLOGICAL & PHYSIOLOGICAL MARKERS (Items 21-50)
            { id: 'bio_crh', label: 'stress_bio_crh', category: 'hpa', type: 'checkbox', defaultValue: 0 },
            { id: 'bio_acth', label: 'stress_bio_acth', category: 'hpa', type: 'checkbox', defaultValue: 0 },
            { id: 'bio_cortisol', label: 'stress_bio_cortisol', category: 'hpa', type: 'checkbox', defaultValue: 1 },
            { id: 'bio_dhea', label: 'stress_bio_dhea', category: 'hpa', type: 'checkbox', defaultValue: 0 },
            { id: 'bio_epi', label: 'stress_bio_epi', category: 'brainstem', type: 'checkbox', defaultValue: 0 },
            { id: 'bio_norepi', label: 'stress_bio_norepi', category: 'brainstem', type: 'checkbox', defaultValue: 0 },
            { id: 'bio_il6', label: 'stress_bio_il6', category: 'limbic', type: 'checkbox', defaultValue: 0 },
            { id: 'bio_tnf', label: 'stress_bio_tnf', category: 'limbic', type: 'checkbox', defaultValue: 0 },
            { id: 'bio_crp', label: 'stress_bio_crp', category: 'limbic', type: 'checkbox', defaultValue: 0 },
            { id: 'bio_bdnf', label: 'stress_bio_bdnf', category: 'cortical', type: 'checkbox', defaultValue: 1 },
            { id: 'bio_glu', label: 'stress_bio_glu', category: 'cortical', type: 'checkbox', defaultValue: 0 },
            { id: 'bio_gaba', label: 'stress_bio_gaba', category: 'cortical', type: 'checkbox', defaultValue: 1 },
            { id: 'bio_dopa', label: 'stress_bio_dopa', category: 'limbic', type: 'checkbox', defaultValue: 0 },
            { id: 'bio_sero', label: 'stress_bio_sero', category: 'limbic', type: 'checkbox', defaultValue: 0 },
            { id: 'bio_oxy', label: 'stress_bio_oxy', category: 'psych', type: 'checkbox', defaultValue: 0 },
            { id: 'bio_hrv', label: 'stress_bio_hrv', category: 'brainstem', type: 'checkbox', defaultValue: 1 },
            { id: 'bio_bp', label: 'stress_bio_bp', category: 'brainstem', type: 'checkbox', defaultValue: 0 },
            { id: 'bio_rhr', label: 'stress_bio_rhr', category: 'brainstem', type: 'checkbox', defaultValue: 0 },
            { id: 'bio_amy', label: 'stress_bio_amy', category: 'brainstem', type: 'checkbox', defaultValue: 0 },
            { id: 'bio_npy', label: 'stress_bio_npy', category: 'hpa', type: 'checkbox', defaultValue: 0 },
            { id: 'bio_can', label: 'stress_bio_can', category: 'limbic', type: 'checkbox', defaultValue: 0 },
            { id: 'bio_pyy', label: 'stress_bio_pyy', category: 'brainstem', type: 'checkbox', defaultValue: 0 },
            { id: 'bio_lep', label: 'stress_bio_lep', category: 'brainstem', type: 'checkbox', defaultValue: 0 },
            { id: 'bio_ghr', label: 'stress_bio_ghr', category: 'brainstem', type: 'checkbox', defaultValue: 0 },
            { id: 'bio_telo', label: 'stress_bio_telo', category: 'research', type: 'checkbox', defaultValue: 0 },
            { id: 'bio_meth', label: 'stress_bio_meth', category: 'research', type: 'checkbox', defaultValue: 0 },
            { id: 'bio_ali', label: 'stress_bio_ali', category: 'research', type: 'checkbox', defaultValue: 1 },
            { id: 'bio_mtdna', label: 'stress_bio_mtdna', category: 'research', type: 'checkbox', defaultValue: 0 },
            { id: 'bio_ros', label: 'stress_bio_ros', category: 'research', type: 'checkbox', defaultValue: 0 },
            { id: 'bio_hrr', label: 'stress_bio_hrr', category: 'brainstem', type: 'checkbox', defaultValue: 0 },

            // VI. INTERVENTIONS & THERAPY (Items 73-85)
            { id: 'stress_interv_adherence', label: 'stress_interv_adherence', category: 'interv', type: 'checkbox', defaultValue: 1 },
            { id: 'stress_interv_persistence', label: 'stress_interv_persistence', category: 'interv', type: 'checkbox', defaultValue: 1 },
            { id: 'stress_therapy_cbt', label: 'stress_therapy_cbt', category: 'therapy', type: 'checkbox', defaultValue: 0 },
            { id: 'stress_therapy_dbt', label: 'stress_therapy_dbt', category: 'therapy', type: 'checkbox', defaultValue: 0 },
            { id: 'stress_therapy_act', label: 'stress_therapy_act', category: 'therapy', type: 'checkbox', defaultValue: 0 },
            { id: 'stress_therapy_ipt', label: 'stress_therapy_ipt', category: 'therapy', type: 'checkbox', defaultValue: 0 },
            { id: 'stress_therapy_psychodynamic', label: 'stress_therapy_psychodynamic', category: 'therapy', type: 'checkbox', defaultValue: 0 },
            { id: 'stress_therapy_exposure', label: 'stress_therapy_exposure', category: 'therapy', type: 'checkbox', defaultValue: 0 },
            { id: 'stress_therapy_alliance', label: 'stress_therapy_alliance', category: 'therapy', type: 'checkbox', defaultValue: 1 },
            { id: 'stress_therapy_homework', label: 'stress_therapy_homework', category: 'therapy', type: 'checkbox', defaultValue: 1 },
            { id: 'stress_lifestyle_exercise', label: 'stress_lifestyle_exercise', category: 'lifestyle', type: 'checkbox', defaultValue: 0 },
            { id: 'stress_lifestyle_nutrition', label: 'stress_lifestyle_nutrition', category: 'lifestyle', type: 'checkbox', defaultValue: 0 },
            { id: 'stress_lifestyle_sleep', label: 'stress_lifestyle_sleep', category: 'lifestyle', type: 'checkbox', defaultValue: 1 },
            { id: 'stress_lifestyle_substance', label: 'stress_lifestyle_substance', category: 'lifestyle', type: 'checkbox', defaultValue: 0 },
            { id: 'stress_social_peer_family', label: 'stress_social_peer_family', category: 'lifestyle', type: 'checkbox', defaultValue: 1 },
            { id: 'stress_social_caregiver', label: 'stress_social_caregiver', category: 'lifestyle', type: 'checkbox', defaultValue: 0 },
            { id: 'stress_socio_interv', label: 'stress_socio_interv', category: 'lifestyle', type: 'checkbox', defaultValue: 0 },
            { id: 'stress_interv_relapse_prev', label: 'stress_interv_relapse_prev', category: 'interv', type: 'checkbox', defaultValue: 0 },
            { id: 'stress_interv_multimodal', label: 'stress_interv_multimodal', category: 'interv', type: 'checkbox', defaultValue: 0 },
            { id: 'stress_system_stepped_care', label: 'stress_system_stepped_care', category: 'system', type: 'checkbox', defaultValue: 0 },
            { id: 'stress_system_crisis_plan', label: 'stress_system_crisis_plan', category: 'system', type: 'checkbox', defaultValue: 0 },
            { id: 'stress_system_access', label: 'stress_system_access', category: 'system', type: 'checkbox', defaultValue: 1 },
            { id: 'stress_system_wait_times', label: 'stress_system_wait_times', category: 'system', type: 'checkbox', defaultValue: 0 },
            { id: 'stress_system_capacity', label: 'stress_system_capacity', category: 'system', type: 'checkbox', defaultValue: 1 },
            { id: 'stress_system_risk_monitor', label: 'stress_system_risk_monitor', category: 'system', type: 'checkbox', defaultValue: 0 }
        ],
        metrics: [
            { id: 'allostaticLoad', label: 'metric_allostatic_load', unit: '%' },
            { id: 'autonomicBalance', label: 'metric_autonomic_balance', unit: '' },
            { id: 'resilienceReserve', label: 'metric_resilience_reserve', unit: '%' },
            { id: 'hpaSensitivity', label: 'stress_metric_hpa_sens', unit: '' },
            { id: 'hrv', label: 'stress_metric_hrv', unit: 'ms' },
            { id: 'vagalTone', label: 'stress_metric_vagal_tone', unit: '%' },
            { id: 'serotoninLevels', label: 'stress_metric_serotonin', unit: '%' },
            { id: 'dopamineLevels', label: 'stress_metric_dopamine', unit: '%' },
            { id: 'cortisolLevels', label: 'stress_metric_cortisol', unit: 'ug/dL' }
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
