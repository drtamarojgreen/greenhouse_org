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
            amygdala: {
                name: 'Amygdala',
                color: 'rgba(255, 50, 50, 0.8)',
                description: 'The amygdala is the brain\'s primary center for threat detection and emotional processing, particularly fear and aggression.'
            },
            hippocampus: {
                name: 'Hippocampus',
                color: 'rgba(50, 255, 50, 0.8)',
                description: 'The hippocampus provides emotional context by linking current experiences with past memories.'
            },
            hypothalamus: {
                name: 'Hypothalamus',
                color: 'rgba(255, 255, 50, 0.8)',
                description: 'The hypothalamus triggers physiological responses to emotions, such as increased heart rate or stress hormone release.'
            },
            thalamus: {
                name: 'Thalamus',
                color: 'rgba(50, 150, 255, 0.8)',
                description: 'The thalamus acts as a relay station, sending sensory information to the amygdala and cortex for emotional appraisal.'
            },
            prefrontalCortex: {
                name: 'Prefrontal Cortex',
                color: 'rgba(200, 200, 200, 0.2)', // Dimmed for focus on limbic system
                description: 'The PFC regulates emotional responses through cognitive control and reappraisal.'
            }
        },
        theories: [
            { name: 'James-Lange', description: 'Emotions are the result of physical changes in the body.' },
            { name: 'Cannon-Bard', description: 'Emotions and physical changes happen at the same time.' },
            { name: 'Schachter-Singer', description: 'Emotions depend on both physical changes and cognitive appraisal.' }
        ]
    };

    window.GreenhouseEmotionConfig = GreenhouseEmotionConfig;
})();
