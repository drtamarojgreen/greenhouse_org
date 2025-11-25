(function () {
    'use strict';

    const GreenhouseModelsUIEnvironmentTherapy = {
        state: null,
        util: null,
        regions: {},

        init(state, util) {
            this.state = state;
            this.util = util;
        },

        draw(ctx, width, height) {
            ctx.save();

            // Shared transform logic (must match hovers.js)
            const scale = Math.min(width / 1536, height / 1024) * 0.8;
            const offsetX = (width - (1536 * scale)) / 2;
            const offsetY = (height - (1024 * scale)) / 2;

            ctx.translate(offsetX, offsetY);
            ctx.scale(scale, scale);

            // Define positions in logical 1536x1024 space
            // Placing them below the brain, to the right
            const centerX = 1536 / 2 + 150;
            const centerY = 850;

            // Draw main label
            const darkMode = window.GreenhouseModelsUI && window.GreenhouseModelsUI.state && window.GreenhouseModelsUI.state.darkMode;
            ctx.fillStyle = darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)';
            ctx.font = '12px "Helvetica Neue", Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Therapy', centerX, centerY + 55);

            // Define therapies
            const therapies = [
                { id: 'cbt', label: 'CBT', name: 'Cognitive Behavioral Therapy' },
                { id: 'dbt', label: 'DBT', name: 'Dialectical Behavior Therapy' },
                { id: 'psychodynamic', label: 'PDT', name: 'Psychodynamic Therapy' },
                { id: 'mdt', label: 'MDT', name: 'Mode Deactivation Therapy' },
                { id: 'schema', label: 'ST', name: 'Schema Therapy' },
                { id: 'act', label: 'ACT', name: 'Acceptance and Commitment Therapy' }
            ];

            const radius = 35;

            therapies.forEach((therapy, index) => {
                const angle = (index / therapies.length) * Math.PI * 2 - Math.PI / 2;
                const x = centerX + Math.cos(angle) * radius;
                const y = centerY + Math.sin(angle) * radius;

                this._drawTherapyNode(ctx, x, y, therapy);
            });

            ctx.restore();
        },

        _drawTherapyNode(ctx, x, y, therapy) {
            const size = 14;

            const path = new Path2D();
            path.arc(x, y, size, 0, Math.PI * 2);

            // Store region
            this.regions[therapy.id] = {
                path: path,
                name: therapy.name,
                color: 'rgba(150, 220, 150, 0.9)',
                description: this._getDescription(therapy.id)
            };

            ctx.fillStyle = 'rgba(150, 220, 150, 0.9)';
            ctx.fill(path);
            ctx.strokeStyle = 'rgba(0, 100, 0, 0.8)';
            ctx.lineWidth = 1.5;
            ctx.stroke(path);

            // Label inside node
            ctx.fillStyle = 'rgba(0, 50, 0, 0.9)';
            ctx.font = 'bold 9px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(therapy.label, x, y);
        },

        _getDescription(id) {
            const descriptions = {
                'cbt': 'Cognitive Behavioral Therapy: A psycho-social intervention that aims to improve mental health. CBT focuses on challenging and changing unhelpful cognitive distortions and behaviors, improving emotional regulation, and the development of personal coping strategies that target solving current problems.',
                'dbt': 'Dialectical Behavior Therapy: A type of cognitive-behavioral therapy. Its main goals are to teach people how to live in the moment, develop healthy ways to cope with stress, regulate their emotions, and improve their relationships with others.',
                'psychodynamic': 'Psychodynamic Therapy: A form of depth psychology, the primary focus of which is to reveal the unconscious content of a client\'s psyche in an effort to alleviate psychic tension.',
                'mdt': 'Mode Deactivation Therapy: A theoretical and applied treatment methodology derived from cognitive behavioral therapy, incorporating elements of Acceptance and Commitment Therapy and Dialectical Behavior Therapy.',
                'schema': 'Schema Therapy: An integrative approach to treatment that combines the best aspects of cognitive-behavioral, experiential, interpersonal, and psychoanalytic therapies into one unified model.',
                'act': 'Acceptance and Commitment Therapy: A form of counseling and a branch of clinical behavior analysis. It is an empirically-based psychological intervention that uses acceptance and mindfulness strategies mixed in different ways with commitment and behavior-change strategies.'
            };
            return descriptions[id] || '';
        },

        handleMouseMove(event, canvas, context) {
            if (window.GreenhouseModelsUIEnvironmentHovers) {
                return window.GreenhouseModelsUIEnvironmentHovers.handleMouseMove(event, canvas, context, this.regions);
            }
        },

        drawTooltip(ctx) {
            // Delegated to GreenhouseModelsUIEnvironmentHovers
        }
    };

    window.GreenhouseModelsUIEnvironmentTherapy = GreenhouseModelsUIEnvironmentTherapy;
})();
