/**
 * @file emotion_interventions.js
 * @description Therapeutic and Pharmacological enhancements for the Emotion Simulation.
 * Part of the 100 enhancements project, mapping interventions to mental health wellness and conditions.
 */

(function () {
    'use strict';

    const therapeuticInterventions = [
        { id: 26, name: 'emotion_enh_26_name', description: 'emotion_enh_26_desc', regions: ['prefrontalCortex'], wellnessFocus: 'emotion_enh_26_wellness', conditionMapping: 'emotion_enh_26_cond' },
        { id: 27, name: 'emotion_enh_27_name', description: 'emotion_enh_27_desc', regions: ['prefrontalCortex', 'amygdala'], wellnessFocus: 'emotion_enh_27_wellness', conditionMapping: 'emotion_enh_27_cond' },
        { id: 28, name: 'emotion_enh_28_name', description: 'emotion_enh_28_desc', regions: ['hypothalamus'], wellnessFocus: 'emotion_enh_28_wellness', conditionMapping: 'emotion_enh_28_cond' },
        { id: 29, name: 'emotion_enh_29_name', description: 'emotion_enh_29_desc', regions: ['prefrontalCortex'], wellnessFocus: 'emotion_enh_29_wellness', conditionMapping: 'emotion_enh_29_cond' },
        { id: 30, name: 'emotion_enh_30_name', description: 'emotion_enh_30_desc', regions: ['amygdala', 'hippocampus'], wellnessFocus: 'emotion_enh_30_wellness', conditionMapping: 'emotion_enh_30_cond' },
        { id: 31, name: 'emotion_enh_31_name', description: 'emotion_enh_31_desc', regions: ['amygdala', 'prefrontalCortex'], wellnessFocus: 'emotion_enh_31_wellness', conditionMapping: 'emotion_enh_31_cond' },
        { id: 32, name: 'emotion_enh_32_name', description: 'emotion_enh_32_desc', regions: ['hypothalamus'], wellnessFocus: 'emotion_enh_32_wellness', conditionMapping: 'emotion_enh_32_cond' },
        { id: 33, name: 'emotion_enh_33_name', description: 'emotion_enh_33_desc', regions: ['hypothalamus', 'amygdala'], wellnessFocus: 'emotion_enh_33_wellness', conditionMapping: 'emotion_enh_33_cond' },
        { id: 34, name: 'emotion_enh_34_name', description: 'emotion_enh_34_desc', regions: ['hypothalamus'], wellnessFocus: 'emotion_enh_34_wellness', conditionMapping: 'emotion_enh_34_cond' },
        { id: 35, name: 'emotion_enh_35_name', description: 'emotion_enh_35_desc', regions: ['thalamus', 'prefrontalCortex'], wellnessFocus: 'emotion_enh_35_wellness', conditionMapping: 'emotion_enh_35_cond' },
        { id: 36, name: 'emotion_enh_36_name', description: 'emotion_enh_36_desc', regions: ['amygdala', 'thalamus'], wellnessFocus: 'emotion_enh_36_wellness', conditionMapping: 'emotion_enh_36_cond' },
        { id: 37, name: 'emotion_enh_37_name', description: 'emotion_enh_37_desc', regions: ['thalamus'], wellnessFocus: 'emotion_enh_37_wellness', conditionMapping: 'emotion_enh_37_cond' },
        { id: 38, name: 'emotion_enh_38_name', description: 'emotion_enh_38_desc', regions: ['prefrontalCortex'], wellnessFocus: 'emotion_enh_38_wellness', conditionMapping: 'emotion_enh_38_cond' },
        { id: 39, name: 'emotion_enh_39_name', description: 'emotion_enh_39_desc', regions: ['prefrontalCortex'], wellnessFocus: 'emotion_enh_39_wellness', conditionMapping: 'emotion_enh_39_cond' },
        { id: 40, name: 'emotion_enh_40_name', description: 'emotion_enh_40_desc', regions: ['hypothalamus'], wellnessFocus: 'emotion_enh_40_wellness', conditionMapping: 'emotion_enh_40_cond' },
        { id: 41, name: 'emotion_enh_41_name', description: 'emotion_enh_41_desc', regions: ['prefrontalCortex'], wellnessFocus: 'emotion_enh_41_wellness', conditionMapping: 'emotion_enh_41_cond' },
        { id: 42, name: 'emotion_enh_42_name', description: 'emotion_enh_42_desc', regions: ['amygdala'], wellnessFocus: 'emotion_enh_42_wellness', conditionMapping: 'emotion_enh_42_cond' },
        { id: 43, name: 'emotion_enh_43_name', description: 'emotion_enh_43_desc', regions: ['brainstem', 'hypothalamus'], wellnessFocus: 'emotion_enh_43_wellness', conditionMapping: 'emotion_enh_43_cond' },
        { id: 44, name: 'emotion_enh_44_name', description: 'emotion_enh_44_desc', regions: ['prefrontalCortex'], wellnessFocus: 'emotion_enh_44_wellness', conditionMapping: 'emotion_enh_44_cond' },
        { id: 45, name: 'emotion_enh_45_name', description: 'emotion_enh_45_desc', regions: ['prefrontalCortex'], wellnessFocus: 'emotion_enh_45_wellness', conditionMapping: 'emotion_enh_45_cond' },
        { id: 46, name: 'emotion_enh_46_name', description: 'emotion_enh_46_desc', regions: ['prefrontalCortex', 'amygdala'], wellnessFocus: 'emotion_enh_46_wellness', conditionMapping: 'emotion_enh_46_cond' },
        { id: 47, name: 'emotion_enh_47_name', description: 'emotion_enh_47_desc', regions: ['thalamus'], wellnessFocus: 'emotion_enh_47_wellness', conditionMapping: 'emotion_enh_47_cond' },
        { id: 48, name: 'emotion_enh_48_name', description: 'emotion_enh_48_desc', regions: ['thalamus'], wellnessFocus: 'emotion_enh_48_wellness', conditionMapping: 'emotion_enh_48_cond' },
        { id: 49, name: 'emotion_enh_49_name', description: 'emotion_enh_49_desc', regions: ['prefrontalCortex'], wellnessFocus: 'emotion_enh_49_wellness', conditionMapping: 'emotion_enh_49_cond' },
        { id: 50, name: 'emotion_enh_50_name', description: 'emotion_enh_50_desc', regions: ['prefrontalCortex'], wellnessFocus: 'emotion_enh_50_wellness', conditionMapping: 'emotion_enh_50_cond' }
    ];

    const medicationTreatments = [
        { id: 51, name: 'emotion_enh_51_name', description: 'emotion_enh_51_desc', regions: ['amygdala', 'hippocampus'], wellnessFocus: 'emotion_enh_51_wellness', conditionMapping: 'emotion_enh_51_cond' },
        { id: 52, name: 'emotion_enh_52_name', description: 'emotion_enh_52_desc', regions: ['brainstem'], wellnessFocus: 'emotion_enh_52_wellness', conditionMapping: 'emotion_enh_52_cond' },
        { id: 53, name: 'emotion_enh_53_name', description: 'emotion_enh_53_desc', regions: ['amygdala'], wellnessFocus: 'emotion_enh_53_wellness', conditionMapping: 'emotion_enh_53_cond' },
        { id: 54, name: 'emotion_enh_54_name', description: 'emotion_enh_54_desc', regions: ['thalamus', 'brainstem'], wellnessFocus: 'emotion_enh_54_wellness', conditionMapping: 'emotion_enh_54_cond' },
        { id: 55, name: 'emotion_enh_55_name', description: 'emotion_enh_55_desc', regions: ['thalamus'], wellnessFocus: 'emotion_enh_55_wellness', conditionMapping: 'emotion_enh_55_cond' },
        { id: 56, name: 'emotion_enh_56_name', description: 'emotion_enh_56_desc', regions: ['brainstem', 'hypothalamus'], wellnessFocus: 'emotion_enh_56_wellness', conditionMapping: 'emotion_enh_56_cond' },
        { id: 57, name: 'emotion_enh_57_name', description: 'emotion_enh_57_desc', regions: ['hippocampus', 'prefrontalCortex'], wellnessFocus: 'emotion_enh_57_wellness', conditionMapping: 'emotion_enh_57_cond' },
        { id: 58, name: 'emotion_enh_58_name', description: 'emotion_enh_58_desc', regions: ['thalamus'], wellnessFocus: 'emotion_enh_58_wellness', conditionMapping: 'emotion_enh_58_cond' },
        { id: 59, name: 'emotion_enh_59_name', description: 'emotion_enh_59_desc', regions: ['prefrontalCortex', 'hippocampus'], wellnessFocus: 'emotion_enh_59_wellness', conditionMapping: 'emotion_enh_59_cond' },
        { id: 60, name: 'emotion_enh_60_name', description: 'emotion_enh_60_desc', regions: ['thalamus'], wellnessFocus: 'emotion_enh_60_wellness', conditionMapping: 'emotion_enh_60_cond' },
        { id: 61, name: 'emotion_enh_61_name', description: 'emotion_enh_61_desc', regions: ['amygdala'], wellnessFocus: 'emotion_enh_61_wellness', conditionMapping: 'emotion_enh_61_cond' },
        { id: 62, name: 'emotion_enh_62_name', description: 'emotion_enh_62_desc', regions: ['amygdala'], wellnessFocus: 'emotion_enh_62_wellness', conditionMapping: 'emotion_enh_62_cond' },
        { id: 63, name: 'emotion_enh_63_name', description: 'emotion_enh_63_desc', regions: ['thalamus'], wellnessFocus: 'emotion_enh_63_wellness', conditionMapping: 'emotion_enh_63_cond' },
        { id: 64, name: 'emotion_enh_64_name', description: 'emotion_enh_64_desc', regions: ['prefrontalCortex'], wellnessFocus: 'emotion_enh_64_wellness', conditionMapping: 'emotion_enh_64_cond' },
        { id: 65, name: 'emotion_enh_65_name', description: 'emotion_enh_65_desc', regions: ['hypothalamus'], wellnessFocus: 'emotion_enh_65_wellness', conditionMapping: 'emotion_enh_65_cond' },
        { id: 66, name: 'emotion_enh_66_name', description: 'emotion_enh_66_desc', regions: ['brainstem'], wellnessFocus: 'emotion_enh_66_wellness', conditionMapping: 'emotion_enh_66_cond' },
        { id: 67, name: 'emotion_enh_67_name', description: 'emotion_enh_67_desc', regions: ['prefrontalCortex'], wellnessFocus: 'emotion_enh_67_wellness', conditionMapping: 'emotion_enh_67_cond' },
        { id: 68, name: 'emotion_enh_68_name', description: 'emotion_enh_68_desc', regions: ['acc'], wellnessFocus: 'emotion_enh_68_wellness', conditionMapping: 'emotion_enh_68_cond' },
        { id: 69, name: 'emotion_enh_69_name', description: 'emotion_enh_69_desc', regions: ['prefrontalCortex', 'thalamus'], wellnessFocus: 'emotion_enh_69_wellness', conditionMapping: 'emotion_enh_69_cond' },
        { id: 70, name: 'emotion_enh_70_name', description: 'emotion_enh_70_desc', regions: ['thalamus'], wellnessFocus: 'emotion_enh_70_wellness', conditionMapping: 'emotion_enh_70_cond' },
        { id: 71, name: 'emotion_enh_71_name', description: 'emotion_enh_71_desc', regions: ['amygdala'], wellnessFocus: 'emotion_enh_71_wellness', conditionMapping: 'emotion_enh_71_cond' },
        { id: 72, name: 'emotion_enh_72_name', description: 'emotion_enh_72_desc', regions: ['striatum'], wellnessFocus: 'emotion_enh_72_wellness', conditionMapping: 'emotion_enh_72_cond' },
        { id: 73, name: 'emotion_enh_73_name', description: 'emotion_enh_73_desc', regions: ['thalamus'], wellnessFocus: 'emotion_enh_73_wellness', conditionMapping: 'emotion_enh_73_cond' },
        { id: 74, name: 'emotion_enh_74_name', description: 'emotion_enh_74_desc', regions: ['thalamus'], wellnessFocus: 'emotion_enh_74_wellness', conditionMapping: 'emotion_enh_74_cond' },
        { id: 75, name: 'emotion_enh_75_name', description: 'emotion_enh_75_desc', regions: ['thalamus'], wellnessFocus: 'emotion_enh_75_wellness', conditionMapping: 'emotion_enh_75_cond' }
    ];

    if (window.GreenhouseEmotionConfig) {
        window.GreenhouseEmotionConfig.therapeuticInterventions = therapeuticInterventions;
        window.GreenhouseEmotionConfig.medicationTreatments = medicationTreatments;
    }
})();
