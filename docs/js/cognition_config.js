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
            }
        },
        theories: [
            { name: 'Information Processing', description: 'Views the mind as a computer, where information is input, processed, stored, and retrieved.' },
            { name: 'Dual Process', description: 'Postulates that thought can arise in two different ways: System 1 (fast, automatic) and System 2 (slow, effortful).' },
            { name: 'Cognitive Load', description: 'Relates to the amount of information that working memory can hold at one time.' }
        ]
    };

    window.GreenhouseCognitionConfig = GreenhouseCognitionConfig;
})();
