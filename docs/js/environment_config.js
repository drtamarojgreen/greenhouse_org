(function () {
    'use strict';

    window.GreenhouseEnvironmentConfig = {
        canvas: {
            logicalWidth: 1536,
            logicalHeight: 1024
        },
        labels: [
            { text: 'Environmental Stress', x: 768, y: 100, fontSize: 26, type: 'header' },
            { text: 'Genetic Factors', x: 768, y: 250, fontSize: 20, type: 'subheader' },
            { text: 'Community', x: 1200, y: 512, fontSize: 20, type: 'label' },
            { text: 'Personal Growth', x: 768, y: 950, fontSize: 18, type: 'label' }
        ],
        icons: [
            {
                id: 'family',
                type: 'path',
                pathData: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
                x: 384,
                y: 320, // Adjusted position
                color: 'rgba(255, 159, 64, 0.8)'
            },
            {
                id: 'society',
                type: 'path',
                pathData: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V18h14v-1.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V18h6v-1.5c0-2.33-4.67-3.5-7-3.5z',
                x: 1152,
                y: 320, // Adjusted position
                color: 'rgba(54, 162, 235, 0.8)'
            }
        ],
        influencePaths: [
            { startX: 384, startY: 350, endX: 768, endY: 600, color: 'rgba(255, 159, 64, 0.7)', width: 6 }, // #21 - Thicker lines
            { startX: 768, startY: 450, endX: 768, endY: 600, color: 'rgba(54, 162, 235, 0.7)', width: 6 }, // #21 - Thicker lines
            { startX: 1152, startY: 350, endX: 768, endY: 600, color: 'rgba(75, 192, 192, 0.7)', width: 6 }  // #21 - Thicker lines
        ],
        interactiveElements: {
            medication: {
                id: 'medication_general',
                name: 'Medication',
                description: 'Loading...', // Will be replaced by data binding
                dataSource: 'health.active_medications',
                x: 570,
                y: 750,
                width: 60,
                height: 30,
                type: 'pill'
            },
            therapy: {
                id: 'therapy_general',
                name: 'Therapy',
                description: 'Loading...', // Will be replaced by data binding
                dataSource: 'health.therapy_sessions',
                x: 966,
                y: 750,
                radius: 25,
                type: 'node'
            }
        }
    };
})();
