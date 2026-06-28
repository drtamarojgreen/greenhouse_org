/**
 * @file emotion_theories.js
 * @description Advanced Theories on Emotional Regulation and Resilience.
 * Part of the 100 enhancements project, mapping theories to mental health wellness and resilience factors.
 */

(function () {
    'use strict';

    const advancedTheories = [
        { id: 76, name: 'emotion_enh_76_name', description: 'emotion_enh_76_desc', regions: ['prefrontalCortex', 'amygdala'], wellnessFocus: 'emotion_enh_76_wellness', conditionMapping: 'emotion_enh_76_cond' },
        { id: 77, name: 'emotion_enh_77_name', description: 'emotion_enh_77_desc', regions: ['brainstem', 'hypothalamus', 'prefrontalCortex'], wellnessFocus: 'emotion_enh_77_wellness', conditionMapping: 'emotion_enh_77_cond' },
        { id: 78, name: 'emotion_enh_78_name', description: 'emotion_enh_78_desc', regions: ['prefrontalCortex'], wellnessFocus: 'emotion_enh_78_wellness', conditionMapping: 'emotion_enh_78_cond' },
        { id: 79, name: 'emotion_enh_79_name', description: 'emotion_enh_79_desc', regions: ['prefrontalCortex', 'hippocampus'], wellnessFocus: 'emotion_enh_79_wellness', conditionMapping: 'emotion_enh_79_cond' },
        { id: 80, name: 'emotion_enh_80_name', description: 'emotion_enh_80_desc', regions: ['hypothalamus'], wellnessFocus: 'emotion_enh_80_wellness', conditionMapping: 'emotion_enh_80_cond' },
        { id: 81, name: 'emotion_enh_81_name', description: 'emotion_enh_81_desc', regions: ['prefrontalCortex', 'amygdala'], wellnessFocus: 'emotion_enh_81_wellness', conditionMapping: 'emotion_enh_81_cond' },
        { id: 82, name: 'emotion_enh_82_name', description: 'emotion_enh_82_desc', regions: ['amygdala', 'prefrontalCortex'], wellnessFocus: 'emotion_enh_82_wellness', conditionMapping: 'emotion_enh_82_cond' },
        { id: 83, name: 'emotion_enh_83_name', description: 'emotion_enh_83_desc', regions: ['hypothalamus', 'amygdala'], wellnessFocus: 'emotion_enh_83_wellness', conditionMapping: 'emotion_enh_83_cond' },
        { id: 84, name: 'emotion_enh_84_name', description: 'emotion_enh_84_desc', regions: ['prefrontalCortex'], wellnessFocus: 'emotion_enh_84_wellness', conditionMapping: 'emotion_enh_84_cond' },
        { id: 85, name: 'emotion_enh_85_name', description: 'emotion_enh_85_desc', regions: ['prefrontalCortex'], wellnessFocus: 'emotion_enh_85_wellness', conditionMapping: 'emotion_enh_85_cond' },
        { id: 86, name: 'emotion_enh_86_name', description: 'emotion_enh_86_desc', regions: ['hypothalamus', 'prefrontalCortex'], wellnessFocus: 'emotion_enh_86_wellness', conditionMapping: 'emotion_enh_86_cond' },
        { id: 87, name: 'emotion_enh_87_name', description: 'emotion_enh_87_desc', regions: ['prefrontalCortex'], wellnessFocus: 'emotion_enh_87_wellness', conditionMapping: 'emotion_enh_87_cond' },
        { id: 88, name: 'emotion_enh_88_name', description: 'emotion_enh_88_desc', regions: ['thalamus', 'hypothalamus'], wellnessFocus: 'emotion_enh_88_wellness', conditionMapping: 'emotion_enh_88_cond' },
        { id: 89, name: 'emotion_enh_89_name', description: 'emotion_enh_89_desc', regions: ['prefrontalCortex', 'amygdala'], wellnessFocus: 'emotion_enh_89_wellness', conditionMapping: 'emotion_enh_89_cond' },
        { id: 90, name: 'emotion_enh_90_name', description: 'emotion_enh_90_desc', regions: ['brainstem', 'prefrontalCortex'], wellnessFocus: 'emotion_enh_90_wellness', conditionMapping: 'emotion_enh_90_cond' },
        { id: 91, name: 'emotion_enh_91_name', description: 'emotion_enh_91_desc', regions: ['prefrontalCortex'], wellnessFocus: 'emotion_enh_91_wellness', conditionMapping: 'emotion_enh_91_cond' },
        { id: 92, name: 'emotion_enh_92_name', description: 'emotion_enh_92_desc', regions: ['prefrontalCortex', 'amygdala'], wellnessFocus: 'emotion_enh_92_wellness', conditionMapping: 'emotion_enh_92_cond' },
        { id: 93, name: 'emotion_enh_93_name', description: 'emotion_enh_93_desc', regions: ['prefrontalCortex', 'hippocampus'], wellnessFocus: 'emotion_enh_93_wellness', conditionMapping: 'emotion_enh_93_cond' },
        { id: 94, name: 'emotion_enh_94_name', description: 'emotion_enh_94_desc', regions: ['hypothalamus'], wellnessFocus: 'emotion_enh_94_wellness', conditionMapping: 'emotion_enh_94_cond' },
        { id: 95, name: 'emotion_enh_95_name', description: 'emotion_enh_95_desc', regions: ['amygdala', 'prefrontalCortex'], wellnessFocus: 'emotion_enh_95_wellness', conditionMapping: 'emotion_enh_95_cond' },
        { id: 96, name: 'emotion_enh_96_name', description: 'emotion_enh_96_desc', regions: ['prefrontalCortex', 'thalamus'], wellnessFocus: 'emotion_enh_96_wellness', conditionMapping: 'emotion_enh_96_cond' },
        { id: 97, name: 'emotion_enh_97_name', description: 'emotion_enh_97_desc', regions: ['amygdala', 'hypothalamus'], wellnessFocus: 'emotion_enh_97_wellness', conditionMapping: 'emotion_enh_97_cond' },
        { id: 98, name: 'emotion_enh_98_name', description: 'emotion_enh_98_desc', regions: ['prefrontalCortex'], wellnessFocus: 'emotion_enh_98_wellness', conditionMapping: 'emotion_enh_98_cond' },
        { id: 99, name: 'emotion_enh_99_name', description: 'emotion_enh_99_desc', regions: ['prefrontalCortex', 'amygdala'], wellnessFocus: 'emotion_enh_99_wellness', conditionMapping: 'emotion_enh_99_cond' },
        { id: 100, name: 'emotion_enh_100_name', description: 'emotion_enh_100_desc', regions: ['prefrontalCortex', 'amygdala'], wellnessFocus: 'emotion_enh_100_wellness', conditionMapping: 'emotion_enh_100_cond' }
    ];

    if (window.GreenhouseEmotionConfig) {
        window.GreenhouseEmotionConfig.advancedTheories = advancedTheories;
    }
})();
