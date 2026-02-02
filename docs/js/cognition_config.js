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
                name: 'cog_reg_pfc_name',
                color: 'rgba(50, 150, 255, 0.8)',
                description: 'cog_reg_pfc_desc'
            },
            parietalLobe: {
                name: 'cog_reg_parietal_name',
                color: 'rgba(150, 50, 255, 0.8)',
                description: 'cog_reg_parietal_desc'
            },
            temporalLobe: {
                name: 'cog_reg_temporal_name',
                color: 'rgba(50, 255, 150, 0.8)',
                description: 'cog_reg_temporal_desc'
            },
            occipitalLobe: {
                name: 'cog_reg_occipital_name',
                color: 'rgba(255, 50, 150, 0.8)',
                description: 'cog_reg_occipital_desc'
            },
            motorCortex: {
                name: 'cog_reg_motor_name',
                color: 'rgba(255, 150, 100, 0.8)',
                description: 'cog_reg_motor_desc'
            },
            somatosensoryCortex: {
                name: 'cog_reg_somato_name',
                color: 'rgba(150, 255, 150, 0.8)',
                description: 'cog_reg_somato_desc'
            },
            cerebellum: {
                name: 'cog_reg_cerebellum_name',
                color: 'rgba(64, 224, 208, 0.8)',
                description: 'cog_reg_cerebellum_desc'
            },
            brainstem: {
                name: 'cog_reg_brainstem_name',
                color: 'rgba(255, 215, 0, 0.8)',
                description: 'cog_reg_brainstem_desc'
            },
            amygdala: {
                name: 'cog_reg_amygdala_name',
                color: 'rgba(255, 100, 100, 0.8)',
                description: 'cog_reg_amygdala_desc'
            },
            hippocampus: {
                name: 'cog_reg_hippocampus_name',
                color: 'rgba(100, 255, 150, 0.8)',
                description: 'cog_reg_hippocampus_desc'
            },
            thalamus: {
                name: 'cog_reg_thalamus_name',
                color: 'rgba(100, 150, 255, 0.8)',
                description: 'cog_reg_thalamus_desc'
            },
            hypothalamus: {
                name: 'cog_reg_hypothalamus_name',
                color: 'rgba(255, 200, 100, 0.8)',
                description: 'cog_reg_hypothalamus_desc'
            }
        },
        theories: [
            { name: 'cog_theory_infoproc_name', description: 'cog_theory_infoproc_desc' },
            { name: 'cog_theory_dualproc_name', description: 'cog_theory_dualproc_desc' },
            { name: 'cog_theory_load_name', description: 'cog_theory_load_desc' }
        ],
        enhancements: [
            // Core Visual & Analytical Features
            { id: 1, category: 'Analytical', name: 'cog_enh_1_name', description: 'cog_enh_1_desc', region: 'prefrontalCortex' },
            { id: 2, category: 'Analytical', name: 'cog_enh_2_name', description: 'cog_enh_2_desc', region: 'prefrontalCortex' },
            { id: 3, category: 'Analytical', name: 'cog_enh_3_name', description: 'cog_enh_3_desc', region: 'prefrontalCortex' },
            { id: 4, category: 'Analytical', name: 'cog_enh_4_name', description: 'cog_enh_4_desc', region: 'parietalLobe' },
            { id: 5, category: 'Analytical', name: 'cog_enh_5_name', description: 'cog_enh_5_desc', region: 'temporalLobe' },
            { id: 6, category: 'Analytical', name: 'cog_enh_6_name', description: 'cog_enh_6_desc', region: 'prefrontalCortex' },

            // Modeling Theory to Brain Regions
            { id: 7, category: 'Theory', name: 'cog_enh_7_name', description: 'cog_enh_7_desc', region: 'prefrontalCortex' },
            { id: 8, category: 'Theory', name: 'cog_enh_8_name', description: 'cog_enh_8_desc', region: 'parietalLobe' },
            { id: 9, category: 'Theory', name: 'cog_enh_9_name', description: 'cog_enh_9_desc', region: 'thalamus' },
            { id: 10, category: 'Theory', name: 'cog_enh_10_name', description: 'cog_enh_10_desc', region: 'temporalLobe' },
            { id: 11, category: 'Theory', name: 'cog_enh_11_name', description: 'cog_enh_11_desc', region: 'amygdala' },
            { id: 12, category: 'Theory', name: 'cog_enh_12_name', description: 'cog_enh_12_desc', region: 'prefrontalCortex' },
            { id: 13, category: 'Theory', name: 'cog_enh_13_name', description: 'cog_enh_13_desc', region: 'motorCortex' },
            { id: 14, category: 'Theory', name: 'cog_enh_14_name', description: 'cog_enh_14_desc', region: 'prefrontalCortex' },
            { id: 15, category: 'Theory', name: 'cog_enh_15_name', description: 'cog_enh_15_desc', region: 'amygdala' },
            { id: 16, category: 'Theory', name: 'cog_enh_16_name', description: 'cog_enh_16_desc', region: 'thalamus' },
            { id: 17, category: 'Theory', name: 'cog_enh_17_name', description: 'cog_enh_17_desc', region: 'prefrontalCortex' },
            { id: 18, category: 'Theory', name: 'cog_enh_18_name', description: 'cog_enh_18_desc', region: 'temporalLobe' },
            { id: 19, category: 'Theory', name: 'cog_enh_19_name', description: 'cog_enh_19_desc', region: 'occipitalLobe' },
            { id: 20, category: 'Theory', name: 'cog_enh_20_name', description: 'cog_enh_20_desc', region: 'temporalLobe' },
            { id: 21, category: 'Theory', name: 'cog_enh_21_name', description: 'cog_enh_21_desc', region: 'hippocampus' },
            { id: 22, category: 'Theory', name: 'cog_enh_22_name', description: 'cog_enh_22_desc', region: 'cerebellum' },
            { id: 23, category: 'Theory', name: 'cog_enh_23_name', description: 'cog_enh_23_desc', region: 'thalamus' },
            { id: 24, category: 'Theory', name: 'cog_enh_24_name', description: 'cog_enh_24_desc', region: 'parietalLobe' },
            { id: 25, category: 'Theory', name: 'cog_enh_25_name', description: 'cog_enh_25_desc', region: 'parietalLobe' },
            { id: 26, category: 'Theory', name: 'cog_enh_26_name', description: 'cog_enh_26_desc', region: 'temporalLobe' },
            { id: 27, category: 'Theory', name: 'cog_enh_27_name', description: 'cog_enh_27_desc', region: 'amygdala' },
            { id: 28, category: 'Theory', name: 'cog_enh_28_name', description: 'cog_enh_28_desc', region: 'prefrontalCortex' },
            { id: 29, category: 'Theory', name: 'cog_enh_29_name', description: 'cog_enh_29_desc', region: 'prefrontalCortex' },
            { id: 30, category: 'Theory', name: 'cog_enh_30_name', description: 'cog_enh_30_desc', region: 'prefrontalCortex' },

            // Cognitive Development
            { id: 31, category: 'Development', name: 'cog_enh_31_name', description: 'cog_enh_31_desc', region: 'prefrontalCortex' },
            { id: 32, category: 'Development', name: 'cog_enh_32_name', description: 'cog_enh_32_desc', region: 'prefrontalCortex' },
            { id: 33, category: 'Development', name: 'cog_enh_33_name', description: 'cog_enh_33_desc', region: 'brainstem' },
            { id: 34, category: 'Development', name: 'cog_enh_34_name', description: 'cog_enh_34_desc', region: 'prefrontalCortex' },
            { id: 35, category: 'Development', name: 'cog_enh_35_name', description: 'cog_enh_35_desc', region: 'prefrontalCortex' },
            { id: 36, category: 'Development', name: 'cog_enh_36_name', description: 'cog_enh_36_desc', region: 'temporalLobe' },
            { id: 37, category: 'Development', name: 'cog_enh_37_name', description: 'cog_enh_37_desc', region: 'prefrontalCortex' },
            { id: 38, category: 'Development', name: 'cog_enh_38_name', description: 'cog_enh_38_desc', region: 'thalamus' },
            { id: 39, category: 'Development', name: 'cog_enh_39_name', description: 'cog_enh_39_desc', region: 'hippocampus' },
            { id: 40, category: 'Development', name: 'cog_enh_40_name', description: 'cog_enh_40_desc', region: 'prefrontalCortex' },
            { id: 41, category: 'Development', name: 'cog_enh_41_name', description: 'cog_enh_41_desc', region: 'parietalLobe' },
            { id: 42, category: 'Development', name: 'cog_enh_42_name', description: 'cog_enh_42_desc', region: 'parietalLobe' },
            { id: 43, category: 'Development', name: 'cog_enh_43_name', description: 'cog_enh_43_desc', region: 'hippocampus' },
            { id: 44, category: 'Development', name: 'cog_enh_44_name', description: 'cog_enh_44_desc', region: 'hypothalamus' },
            { id: 45, category: 'Development', name: 'cog_enh_45_name', description: 'cog_enh_45_desc', region: 'prefrontalCortex' },
            { id: 46, category: 'Development', name: 'cog_enh_46_name', description: 'cog_enh_46_desc', region: 'temporalLobe' },
            { id: 47, category: 'Development', name: 'cog_enh_47_name', description: 'cog_enh_47_desc', region: 'occipitalLobe' },
            { id: 48, category: 'Development', name: 'cog_enh_48_name', description: 'cog_enh_48_desc', region: 'parietalLobe' },
            { id: 49, category: 'Development', name: 'cog_enh_49_name', description: 'cog_enh_49_desc', region: 'prefrontalCortex' },
            { id: 50, category: 'Development', name: 'cog_enh_50_name', description: 'cog_enh_50_desc', region: 'prefrontalCortex' },
            { id: 51, category: 'Development', name: 'cog_enh_51_name', description: 'cog_enh_51_desc', region: 'hippocampus' },
            { id: 52, category: 'Development', name: 'cog_enh_52_name', description: 'cog_enh_52_desc', region: 'occipitalLobe' },
            { id: 53, category: 'Development', name: 'cog_enh_53_name', description: 'cog_enh_53_desc', region: 'prefrontalCortex' },
            { id: 54, category: 'Development', name: 'cog_enh_54_name', description: 'cog_enh_54_desc', region: 'temporalLobe' },
            { id: 55, category: 'Development', name: 'cog_enh_55_name', description: 'cog_enh_55_desc', region: 'prefrontalCortex' },

            // Therapeutic Intervention
            { id: 56, category: 'Intervention', name: 'cog_enh_56_name', description: 'cog_enh_56_desc', region: 'prefrontalCortex' },
            { id: 57, category: 'Intervention', name: 'cog_enh_57_name', description: 'cog_enh_57_desc', region: 'amygdala' },
            { id: 58, category: 'Intervention', name: 'cog_enh_58_name', description: 'cog_enh_58_desc', region: 'prefrontalCortex' },
            { id: 59, category: 'Intervention', name: 'cog_enh_59_name', description: 'cog_enh_59_desc', region: 'prefrontalCortex' },
            { id: 60, category: 'Intervention', name: 'cog_enh_60_name', description: 'cog_enh_60_desc', region: 'amygdala' },
            { id: 61, category: 'Intervention', name: 'cog_enh_61_name', description: 'cog_enh_61_desc', region: 'prefrontalCortex' },
            { id: 62, category: 'Intervention', name: 'cog_enh_62_name', description: 'cog_enh_62_desc', region: 'prefrontalCortex' },
            { id: 63, category: 'Intervention', name: 'cog_enh_63_name', description: 'cog_enh_63_desc', region: 'occipitalLobe' },
            { id: 64, category: 'Intervention', name: 'cog_enh_64_name', description: 'cog_enh_64_desc', region: 'hippocampus' },
            { id: 65, category: 'Intervention', name: 'cog_enh_65_name', description: 'cog_enh_65_desc', region: 'brainstem' },
            { id: 66, category: 'Intervention', name: 'cog_enh_66_name', description: 'cog_enh_66_desc', region: 'motorCortex' },
            { id: 67, category: 'Intervention', name: 'cog_enh_67_name', description: 'cog_enh_67_desc', region: 'prefrontalCortex' },
            { id: 68, category: 'Intervention', name: 'cog_enh_68_name', description: 'cog_enh_68_desc', region: 'amygdala' },
            { id: 69, category: 'Intervention', name: 'cog_enh_69_name', description: 'cog_enh_69_desc', region: 'parietalLobe' },
            { id: 70, category: 'Intervention', name: 'cog_enh_70_name', description: 'cog_enh_70_desc', region: 'temporalLobe' },
            { id: 71, category: 'Intervention', name: 'cog_enh_71_name', description: 'cog_enh_71_desc', region: 'prefrontalCortex' },
            { id: 72, category: 'Intervention', name: 'cog_enh_72_name', description: 'cog_enh_72_desc', region: 'amygdala' },
            { id: 73, category: 'Intervention', name: 'cog_enh_73_name', description: 'cog_enh_73_desc', region: 'brainstem' },
            { id: 74, category: 'Intervention', name: 'cog_enh_74_name', description: 'cog_enh_74_desc', region: 'temporalLobe' },
            { id: 75, category: 'Intervention', name: 'cog_enh_75_name', description: 'cog_enh_75_desc', region: 'brainstem' },
            { id: 76, category: 'Intervention', name: 'cog_enh_76_name', description: 'cog_enh_76_desc', region: 'hypothalamus' },
            { id: 77, category: 'Intervention', name: 'cog_enh_77_name', description: 'cog_enh_77_desc', region: 'amygdala' },
            { id: 78, category: 'Intervention', name: 'cog_enh_78_name', description: 'cog_enh_78_desc', region: 'prefrontalCortex' },
            { id: 79, category: 'Intervention', name: 'cog_enh_79_name', description: 'cog_enh_79_desc', region: 'hypothalamus' },
            { id: 80, category: 'Intervention', name: 'cog_enh_80_name', description: 'cog_enh_80_desc', region: 'thalamus' },

            // Medication Management
            { id: 81, category: 'Medication', name: 'cog_enh_81_name', description: 'cog_enh_81_desc', region: 'thalamus' },
            { id: 82, category: 'Medication', name: 'cog_enh_82_name', description: 'cog_enh_82_desc', region: 'thalamus' },
            { id: 83, category: 'Medication', name: 'cog_enh_83_name', description: 'cog_enh_83_desc', region: 'prefrontalCortex' },
            { id: 84, category: 'Medication', name: 'cog_enh_84_name', description: 'cog_enh_84_desc', region: 'brainstem' },
            { id: 85, category: 'Medication', name: 'cog_enh_85_name', description: 'cog_enh_85_desc', region: 'prefrontalCortex' },
            { id: 86, category: 'Medication', name: 'cog_enh_86_name', description: 'cog_enh_86_desc', region: 'thalamus' },
            { id: 87, category: 'Medication', name: 'cog_enh_87_name', description: 'cog_enh_87_desc', region: 'prefrontalCortex' },
            { id: 88, category: 'Medication', name: 'cog_enh_88_name', description: 'cog_enh_88_desc', region: 'thalamus' },
            { id: 89, category: 'Medication', name: 'cog_enh_89_name', description: 'cog_enh_89_desc', region: 'hippocampus' },
            { id: 90, category: 'Medication', name: 'cog_enh_90_name', description: 'cog_enh_90_desc', region: 'thalamus' },
            { id: 91, category: 'Medication', name: 'cog_enh_91_name', description: 'cog_enh_91_desc', region: 'brainstem' },
            { id: 92, category: 'Medication', name: 'cog_enh_92_name', description: 'cog_enh_92_desc', region: 'thalamus' },
            { id: 93, category: 'Medication', name: 'cog_enh_93_name', description: 'cog_enh_93_desc', region: 'thalamus' },
            { id: 94, category: 'Medication', name: 'cog_enh_94_name', description: 'cog_enh_94_desc', region: 'brainstem' },
            { id: 95, category: 'Medication', name: 'cog_enh_95_name', description: 'cog_enh_95_desc', region: 'hypothalamus' },
            { id: 96, category: 'Medication', name: 'cog_enh_96_name', description: 'cog_enh_96_desc', region: 'brainstem' },
            { id: 97, category: 'Medication', name: 'cog_enh_97_name', description: 'cog_enh_97_desc', region: 'thalamus' },
            { id: 98, category: 'Medication', name: 'cog_enh_98_name', description: 'cog_enh_98_desc', region: 'prefrontalCortex' },
            { id: 99, category: 'Medication', name: 'cog_enh_99_name', description: 'cog_enh_99_desc', region: 'hypothalamus' },
            { id: 100, category: 'Medication', name: 'cog_enh_100_name', description: 'cog_enh_100_desc', region: 'prefrontalCortex' },

            // Visualization Enhancements (Set B)
            { id: 101, category: 'Visualization', name: 'cog_enh_101_name', description: 'cog_enh_101_desc', region: 'prefrontalCortex' },
            { id: 102, category: 'Visualization', name: 'cog_enh_102_name', description: 'cog_enh_102_desc', region: 'prefrontalCortex' },
            { id: 103, category: 'Visualization', name: 'cog_enh_103_name', description: 'cog_enh_103_desc', region: 'parietalLobe' },
            { id: 104, category: 'Visualization', name: 'cog_enh_104_name', description: 'cog_enh_104_desc', region: 'hippocampus' },
            { id: 105, category: 'Visualization', name: 'cog_enh_105_name', description: 'cog_enh_105_desc', region: 'parietalLobe' },
            { id: 106, category: 'Visualization', name: 'cog_enh_106_name', description: 'cog_enh_106_desc', region: 'temporalLobe' },
            { id: 107, category: 'Visualization', name: 'cog_enh_107_name', description: 'cog_enh_107_desc', region: 'prefrontalCortex' },
            { id: 108, category: 'Visualization', name: 'cog_enh_108_name', description: 'cog_enh_108_desc', region: 'temporalLobe' },
            { id: 109, category: 'Visualization', name: 'cog_enh_109_name', description: 'cog_enh_109_desc', region: 'prefrontalCortex' },
            { id: 110, category: 'Visualization', name: 'cog_enh_110_name', description: 'cog_enh_110_desc', region: 'prefrontalCortex' },
            { id: 111, category: 'Visualization', name: 'cog_enh_111_name', description: 'cog_enh_111_desc', region: 'parietalLobe' },
            { id: 112, category: 'Visualization', name: 'cog_enh_112_name', description: 'cog_enh_112_desc', region: 'occipitalLobe' },
            { id: 113, category: 'Visualization', name: 'cog_enh_113_name', description: 'cog_enh_113_desc', region: 'parietalLobe' },
            { id: 114, category: 'Visualization', name: 'cog_enh_114_name', description: 'cog_enh_114_desc', region: 'prefrontalCortex' },
            { id: 115, category: 'Visualization', name: 'cog_enh_115_name', description: 'cog_enh_115_desc', region: 'hippocampus' },
            { id: 116, category: 'Visualization', name: 'cog_enh_116_name', description: 'cog_enh_116_desc', region: 'temporalLobe' },
            { id: 117, category: 'Visualization', name: 'cog_enh_117_name', description: 'cog_enh_117_desc', region: 'motorCortex' },
            { id: 118, category: 'Visualization', name: 'cog_enh_118_name', description: 'cog_enh_118_desc', region: 'prefrontalCortex' },
            { id: 119, category: 'Visualization', name: 'cog_enh_119_name', description: 'cog_enh_119_desc', region: 'temporalLobe' },
            { id: 120, category: 'Visualization', name: 'cog_enh_120_name', description: 'cog_enh_120_desc', region: 'prefrontalCortex' },
            { id: 121, category: 'Visualization', name: 'cog_enh_121_name', description: 'cog_enh_121_desc', region: 'parietalLobe' },
            { id: 122, category: 'Visualization', name: 'cog_enh_122_name', description: 'cog_enh_122_desc', region: 'hippocampus' },
            { id: 123, category: 'Visualization', name: 'cog_enh_123_name', description: 'cog_enh_123_desc', region: 'temporalLobe' },
            { id: 124, category: 'Visualization', name: 'cog_enh_124_name', description: 'cog_enh_124_desc', region: 'occipitalLobe' },
            { id: 125, category: 'Visualization', name: 'cog_enh_125_name', description: 'cog_enh_125_desc', region: 'prefrontalCortex' },

            // Scientific Accuracy Enhancements
            { id: 126, category: 'Accuracy', name: 'cog_enh_126_name', description: 'cog_enh_126_desc', region: 'prefrontalCortex' },
            { id: 127, category: 'Accuracy', name: 'cog_enh_127_name', description: 'cog_enh_127_desc', region: 'prefrontalCortex' },
            { id: 128, category: 'Accuracy', name: 'cog_enh_128_name', description: 'cog_enh_128_desc', region: 'occipitalLobe' },
            { id: 129, category: 'Accuracy', name: 'cog_enh_129_name', description: 'cog_enh_129_desc', region: 'prefrontalCortex' },
            { id: 130, category: 'Accuracy', name: 'cog_enh_130_name', description: 'cog_enh_130_desc', region: 'temporalLobe' },
            { id: 131, category: 'Accuracy', name: 'cog_enh_131_name', description: 'cog_enh_131_desc', region: 'prefrontalCortex' },
            { id: 132, category: 'Accuracy', name: 'cog_enh_132_name', description: 'cog_enh_132_desc', region: 'prefrontalCortex' },
            { id: 133, category: 'Accuracy', name: 'cog_enh_133_name', description: 'cog_enh_133_desc', region: 'prefrontalCortex' },
            { id: 134, category: 'Accuracy', name: 'cog_enh_134_name', description: 'cog_enh_134_desc', region: 'parietalLobe' },
            { id: 135, category: 'Accuracy', name: 'cog_enh_135_name', description: 'cog_enh_135_desc', region: 'prefrontalCortex' },
            { id: 136, category: 'Accuracy', name: 'cog_enh_136_name', description: 'cog_enh_136_desc', region: 'prefrontalCortex' },
            { id: 137, category: 'Accuracy', name: 'cog_enh_137_name', description: 'cog_enh_137_desc', region: 'prefrontalCortex' },
            { id: 138, category: 'Accuracy', name: 'cog_enh_138_name', description: 'cog_enh_138_desc', region: 'prefrontalCortex' },
            { id: 139, category: 'Accuracy', name: 'cog_enh_139_name', description: 'cog_enh_139_desc', region: 'parietalLobe' },
            { id: 140, category: 'Accuracy', name: 'cog_enh_140_name', description: 'cog_enh_140_desc', region: 'prefrontalCortex' },
            { id: 141, category: 'Accuracy', name: 'cog_enh_141_name', description: 'cog_enh_141_desc', region: 'prefrontalCortex' },
            { id: 142, category: 'Accuracy', name: 'cog_enh_142_name', description: 'cog_enh_142_desc', region: 'temporalLobe' },
            { id: 143, category: 'Accuracy', name: 'cog_enh_143_name', description: 'cog_enh_143_desc', region: 'parietalLobe' },
            { id: 144, category: 'Accuracy', name: 'cog_enh_144_name', description: 'cog_enh_144_desc', region: 'prefrontalCortex' },
            { id: 145, category: 'Accuracy', name: 'cog_enh_145_name', description: 'cog_enh_145_desc', region: 'prefrontalCortex' },
            { id: 146, category: 'Accuracy', name: 'cog_enh_146_name', description: 'cog_enh_146_desc', region: 'temporalLobe' },
            { id: 147, category: 'Accuracy', name: 'cog_enh_147_name', description: 'cog_enh_147_desc', region: 'parietalLobe' },
            { id: 148, category: 'Accuracy', name: 'cog_enh_148_name', description: 'cog_enh_148_desc', region: 'prefrontalCortex' },
            { id: 149, category: 'Accuracy', name: 'cog_enh_149_name', description: 'cog_enh_149_desc', region: 'prefrontalCortex' },
            { id: 150, category: 'Accuracy', name: 'cog_enh_150_name', description: 'cog_enh_150_desc', region: 'prefrontalCortex' },

            // Research-Oriented Features
            { id: 151, category: 'Research', name: 'cog_enh_151_name', description: 'cog_enh_151_desc', region: 'prefrontalCortex' },
            { id: 152, category: 'Research', name: 'cog_enh_152_name', description: 'cog_enh_152_desc', region: 'parietalLobe' },
            { id: 153, category: 'Research', name: 'cog_enh_153_name', description: 'cog_enh_153_desc', region: 'prefrontalCortex' },
            { id: 154, category: 'Research', name: 'cog_enh_154_name', description: 'cog_enh_154_desc', region: 'prefrontalCortex' },
            { id: 155, category: 'Research', name: 'cog_enh_155_name', description: 'cog_enh_155_desc', region: 'prefrontalCortex' },
            { id: 156, category: 'Research', name: 'cog_enh_156_name', description: 'cog_enh_156_desc', region: 'prefrontalCortex' },
            { id: 157, category: 'Research', name: 'cog_enh_157_name', description: 'cog_enh_157_desc', region: 'prefrontalCortex' },
            { id: 158, category: 'Research', name: 'cog_enh_158_name', description: 'cog_enh_158_desc', region: 'prefrontalCortex' },
            { id: 159, category: 'Research', name: 'cog_enh_159_name', description: 'cog_enh_159_desc', region: 'prefrontalCortex' },
            { id: 160, category: 'Research', name: 'cog_enh_160_name', description: 'cog_enh_160_desc', region: 'prefrontalCortex' },
            { id: 161, category: 'Research', name: 'cog_enh_161_name', description: 'cog_enh_161_desc', region: 'prefrontalCortex' },
            { id: 162, category: 'Research', name: 'cog_enh_162_name', description: 'cog_enh_162_desc', region: 'prefrontalCortex' },
            { id: 163, category: 'Research', name: 'cog_enh_163_name', description: 'cog_enh_163_desc', region: 'parietalLobe' },
            { id: 164, category: 'Research', name: 'cog_enh_164_name', description: 'cog_enh_164_desc', region: 'prefrontalCortex' },
            { id: 165, category: 'Research', name: 'cog_enh_165_name', description: 'cog_enh_165_desc', region: 'prefrontalCortex' },
            { id: 166, category: 'Research', name: 'cog_enh_166_name', description: 'cog_enh_166_desc', region: 'prefrontalCortex' },
            { id: 167, category: 'Research', name: 'cog_enh_167_name', description: 'cog_enh_167_desc', region: 'prefrontalCortex' },
            { id: 168, category: 'Research', name: 'cog_enh_168_name', description: 'cog_enh_168_desc', region: 'prefrontalCortex' },
            { id: 169, category: 'Research', name: 'cog_enh_169_name', description: 'cog_enh_169_desc', region: 'prefrontalCortex' },
            { id: 170, category: 'Research', name: 'cog_enh_170_name', description: 'cog_enh_170_desc', region: 'prefrontalCortex' },
            { id: 171, category: 'Research', name: 'cog_enh_171_name', description: 'cog_enh_171_desc', region: 'prefrontalCortex' },
            { id: 172, category: 'Research', name: 'cog_enh_172_name', description: 'cog_enh_172_desc', region: 'prefrontalCortex' },
            { id: 173, category: 'Research', name: 'cog_enh_173_name', description: 'cog_enh_173_desc', region: 'prefrontalCortex' },
            { id: 174, category: 'Research', name: 'cog_enh_174_name', description: 'cog_enh_174_desc', region: 'prefrontalCortex' },
            { id: 175, category: 'Research', name: 'cog_enh_175_name', description: 'cog_enh_175_desc', region: 'prefrontalCortex' },

            // Educational Features
            { id: 176, category: 'Educational', name: 'cog_enh_176_name', description: 'cog_enh_176_desc', region: 'prefrontalCortex' },
            { id: 177, category: 'Educational', name: 'cog_enh_177_name', description: 'cog_enh_177_desc', region: 'prefrontalCortex' },
            { id: 178, category: 'Educational', name: 'cog_enh_178_name', description: 'cog_enh_178_desc', region: 'hippocampus' },
            { id: 179, category: 'Educational', name: 'cog_enh_179_name', description: 'cog_enh_179_desc', region: 'prefrontalCortex' },
            { id: 180, category: 'Educational', name: 'cog_enh_180_name', description: 'cog_enh_180_desc', region: 'prefrontalCortex' },
            { id: 181, category: 'Educational', name: 'cog_enh_181_name', description: 'cog_enh_181_desc', region: 'prefrontalCortex' },
            { id: 182, category: 'Educational', name: 'cog_enh_182_name', description: 'cog_enh_182_desc', region: 'prefrontalCortex' },
            { id: 183, category: 'Educational', name: 'cog_enh_183_name', description: 'cog_enh_183_desc', region: 'prefrontalCortex' },
            { id: 184, category: 'Educational', name: 'cog_enh_184_name', description: 'cog_enh_184_desc', region: 'prefrontalCortex' },
            { id: 185, category: 'Educational', name: 'cog_enh_185_name', description: 'cog_enh_185_desc', region: 'prefrontalCortex' },
            { id: 186, category: 'Educational', name: 'cog_enh_186_name', description: 'cog_enh_186_desc', region: 'prefrontalCortex' },
            { id: 187, category: 'Educational', name: 'cog_enh_187_name', description: 'cog_enh_187_desc', region: 'prefrontalCortex' },
            { id: 188, category: 'Educational', name: 'cog_enh_188_name', description: 'cog_enh_188_desc', region: 'prefrontalCortex' },
            { id: 189, category: 'Educational', name: 'cog_enh_189_name', description: 'cog_enh_189_desc', region: 'temporalLobe' },
            { id: 190, category: 'Educational', name: 'cog_enh_190_name', description: 'cog_enh_190_desc', region: 'hippocampus' },
            { id: 191, category: 'Educational', name: 'cog_enh_191_name', description: 'cog_enh_191_desc', region: 'prefrontalCortex' },
            { id: 192, category: 'Educational', name: 'cog_enh_192_name', description: 'cog_enh_192_desc', region: 'prefrontalCortex' },
            { id: 193, category: 'Educational', name: 'cog_enh_193_name', description: 'cog_enh_193_desc', region: 'prefrontalCortex' },
            { id: 194, category: 'Educational', name: 'cog_enh_194_name', description: 'cog_enh_194_desc', region: 'prefrontalCortex' },
            { id: 195, category: 'Educational', name: 'cog_enh_195_name', description: 'cog_enh_195_desc', region: 'prefrontalCortex' },
            { id: 196, category: 'Educational', name: 'cog_enh_196_name', description: 'cog_enh_196_desc', region: 'prefrontalCortex' },
            { id: 197, category: 'Educational', name: 'cog_enh_197_name', description: 'cog_enh_197_desc', region: 'prefrontalCortex' },
            { id: 198, category: 'Educational', name: 'cog_enh_198_name', description: 'cog_enh_198_desc', region: 'prefrontalCortex' },
            { id: 199, category: 'Educational', name: 'cog_enh_199_name', description: 'cog_enh_199_desc', region: 'temporalLobe' },
            { id: 200, category: 'Educational', name: 'cog_enh_200_name', description: 'cog_enh_200_desc', region: 'prefrontalCortex' }
        ]
    };

    window.GreenhouseCognitionConfig = GreenhouseCognitionConfig;
})();
