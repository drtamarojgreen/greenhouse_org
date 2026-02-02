/**
 * @file emotion_regions.js
 * @description Enhancements for Modeling Emotional Regulation in the Emotion Simulation.
 * Part of the 100 enhancements project, mapping regulation strategies to mental health wellness and neuroscience.
 */

(function () {
    'use strict';

    const emotionalRegulationEnhancements = [
        { id: 1, name: 'emotion_enh_1_name', description: 'emotion_enh_1_desc', regions: ['prefrontalCortex', 'amygdala'], wellnessFocus: 'emotion_enh_1_wellness', conditionMapping: 'emotion_enh_1_cond' },
        { id: 2, name: 'emotion_enh_2_name', description: 'emotion_enh_2_desc', regions: ['hypothalamus'], wellnessFocus: 'emotion_enh_2_wellness', conditionMapping: 'emotion_enh_2_cond' },
        { id: 3, name: 'emotion_enh_3_name', description: 'emotion_enh_3_desc', regions: ['amygdala'], wellnessFocus: 'emotion_enh_3_wellness', conditionMapping: 'emotion_enh_3_cond' },
        { id: 4, name: 'emotion_enh_4_name', description: 'emotion_enh_4_desc', regions: ['hippocampus', 'amygdala'], wellnessFocus: 'emotion_enh_4_wellness', conditionMapping: 'emotion_enh_4_cond' },
        { id: 5, name: 'emotion_enh_5_name', description: 'emotion_enh_5_desc', regions: ['hypothalamus'], wellnessFocus: 'emotion_enh_5_wellness', conditionMapping: 'emotion_enh_5_cond' },
        { id: 6, name: 'emotion_enh_6_name', description: 'emotion_enh_6_desc', regions: ['hypothalamus', 'brainstem'], wellnessFocus: 'emotion_enh_6_wellness', conditionMapping: 'emotion_enh_6_cond' },
        { id: 7, name: 'emotion_enh_7_name', description: 'emotion_enh_7_desc', regions: ['prefrontalCortex'], wellnessFocus: 'emotion_enh_7_wellness', conditionMapping: 'emotion_enh_7_cond' },
        { id: 8, name: 'emotion_enh_8_name', description: 'emotion_enh_8_desc', regions: ['thalamus'], wellnessFocus: 'emotion_enh_8_wellness', conditionMapping: 'emotion_enh_8_cond' },
        { id: 9, name: 'emotion_enh_9_name', description: 'emotion_enh_9_desc', regions: ['hypothalamus', 'hippocampus'], wellnessFocus: 'emotion_enh_9_wellness', conditionMapping: 'emotion_enh_9_cond' },
        { id: 10, name: 'emotion_enh_10_name', description: 'emotion_enh_10_desc', regions: ['hypothalamus', 'amygdala'], wellnessFocus: 'emotion_enh_10_wellness', conditionMapping: 'emotion_enh_10_cond' },
        { id: 11, name: 'emotion_enh_11_name', description: 'emotion_enh_11_desc', regions: ['prefrontalCortex', 'amygdala'], wellnessFocus: 'emotion_enh_11_wellness', conditionMapping: 'emotion_enh_11_cond' },
        { id: 12, name: 'emotion_enh_12_name', description: 'emotion_enh_12_desc', regions: ['insula'], wellnessFocus: 'emotion_enh_12_wellness', conditionMapping: 'emotion_enh_12_cond' },
        { id: 13, name: 'emotion_enh_13_name', description: 'emotion_enh_13_desc', regions: ['prefrontalCortex'], wellnessFocus: 'emotion_enh_13_wellness', conditionMapping: 'emotion_enh_13_cond' },
        { id: 14, name: 'emotion_enh_14_name', description: 'emotion_enh_14_desc', regions: ['amygdala'], wellnessFocus: 'emotion_enh_14_wellness', conditionMapping: 'emotion_enh_14_cond' },
        { id: 15, name: 'emotion_enh_15_name', description: 'emotion_enh_15_desc', regions: ['prefrontalCortex'], wellnessFocus: 'emotion_enh_15_wellness', conditionMapping: 'emotion_enh_15_cond' },
        { id: 16, name: 'emotion_enh_16_name', description: 'emotion_enh_16_desc', regions: ['thalamus'], wellnessFocus: 'emotion_enh_16_wellness', conditionMapping: 'emotion_enh_16_cond' },
        { id: 17, name: 'emotion_enh_17_name', description: 'emotion_enh_17_desc', regions: ['prefrontalCortex', 'amygdala'], wellnessFocus: 'emotion_enh_17_wellness', conditionMapping: 'emotion_enh_17_cond' },
        { id: 18, name: 'emotion_enh_18_name', description: 'emotion_enh_18_desc', regions: ['thalamus', 'amygdala'], wellnessFocus: 'emotion_enh_18_wellness', conditionMapping: 'emotion_enh_18_cond' },
        { id: 19, name: 'emotion_enh_19_name', description: 'emotion_enh_19_desc', regions: ['prefrontalCortex'], wellnessFocus: 'emotion_enh_19_wellness', conditionMapping: 'emotion_enh_19_cond' },
        { id: 20, name: 'emotion_enh_20_name', description: 'emotion_enh_20_desc', regions: ['amygdala', 'prefrontalCortex'], wellnessFocus: 'emotion_enh_20_wellness', conditionMapping: 'emotion_enh_20_cond' },
        { id: 21, name: 'emotion_enh_21_name', description: 'emotion_enh_21_desc', regions: ['acc'], wellnessFocus: 'emotion_enh_21_wellness', conditionMapping: 'emotion_enh_21_cond' },
        { id: 22, name: 'emotion_enh_22_name', description: 'emotion_enh_22_desc', regions: ['striatum'], wellnessFocus: 'emotion_enh_22_wellness', conditionMapping: 'emotion_enh_22_cond' },
        { id: 23, name: 'emotion_enh_23_name', description: 'emotion_enh_23_desc', regions: ['brainstem'], wellnessFocus: 'emotion_enh_23_wellness', conditionMapping: 'emotion_enh_23_cond' },
        { id: 24, name: 'emotion_enh_24_name', description: 'emotion_enh_24_desc', regions: ['hypothalamus'], wellnessFocus: 'emotion_enh_24_wellness', conditionMapping: 'emotion_enh_24_cond' },
        { id: 25, name: 'emotion_enh_25_name', description: 'emotion_enh_25_desc', regions: ['hypothalamus', 'hippocampus'], wellnessFocus: 'emotion_enh_25_wellness', conditionMapping: 'emotion_enh_25_cond' }
    ];

    if (window.GreenhouseEmotionConfig) {
        window.GreenhouseEmotionConfig.regulations = emotionalRegulationEnhancements;
    }
})();
