/**
 * @file stress_tooltips.js
 * @description Enhanced Tooltip definitions for Stress Dynamics.
 * Covers Environmental, Genetic, and Modulatory factors.
 */

(function () {
    'use strict';

    const t = (k) => window.GreenhouseModelsUtil ? window.GreenhouseModelsUtil.t(k) : k;

    const GreenhouseStressTooltips = {
        definitions: {
            // Environmental Stressors
            sleepDeprivation: 'Disrupts glympathic clearance and executive control; increases baseline cortisol.',
            noisePollution: 'Chronic auditory stress; activates the HPA axis via non-conscious pathways.',
            financialStrain: 'High-order cognitive stress; creates a constant background threat state.',
            socialIsolation: 'Deprives the system of oxytocin buffering; increases inflammatory markers.',
            workOverload: 'Cognitive demand exceeds processing capacity; triggers the catecholamine response.',
            nutrientDeficit: 'Metabolic stress; limits the biological substrate for resilience.',

            // Genetic Factors
            comtValMet: 'Affects the COMT enzyme efficiency; "Worriers" clear dopamine slower in the PFC, increasing stress sensitivity.',
            serotoninTransporter: '5-HTTLPR short allele; linked to increased amygdala reactivity to environmental signals.',
            fkbp5Variant: 'Polymorphism that alters the glucocorticoid receptor feedback loop, impeding stress recovery.',

            // Modulators
            cognitiveReframing: 'The active psychological process of reappraising a threat as a manageable challenge.',
            psych_support: 'Oxytocin-mediated regulation of the paraventricular nucleus (PVN) in the hypothalamus.',
            gabaMod: 'Chemical stabilization of the nervous system via inhibitory neurotransmission.',

            // Metrics
            metric_allostatic_load: 'The cumulative "wear and tear" on the body as it adapts to chronic stress.',
            metric_autonomic_balance: 'The dynamic tension between Sympathetic (Alert) and Parasympathetic (Rest) drive.',
            metric_resilience_reserve: 'The latent capacity for homeostatic recovery; buffers against systemic failure.',
            hpaSensitivity: 'The logical integrity of the HPA feedback loop; degrades with chronic load.',

            pfc: 'Prefrontal Cortex: Mediates top-down regulation and executive control over the stress response.',
            amygdala: 'Amygdala: Rapidly identifies threats and triggers the primary emotional stress response.',
            hippocampus: 'Hippocampus: Contextualizes stress and provides inhibitory feedback to the HPA axis.',
            hypothalamus: 'Hypothalamus: The command hub (PVN) that initiates the systemic hormonal cascade.'
        },

        draw(ctx, app, x, y) {
            const el = app.ui.hoveredElement;
            if (!el) return;

            const desc = this.definitions[el.id] || el.description || 'Biological component of the stress model.';
            const label = el.label || el.id;

            ctx.save();
            ctx.font = '11px Quicksand, sans-serif';
            const padding = 15;
            const maxWidth = 250;

            const words = desc.split(' ');
            let lines = [];
            let currentLine = words[0];

            for (let i = 1; i < words.length; i++) {
                let testLine = currentLine + " " + words[i];
                if (ctx.measureText(testLine).width > maxWidth) {
                    lines.push(currentLine);
                    currentLine = words[i];
                } else {
                    currentLine = testLine;
                }
            }
            lines.push(currentLine);

            const h = 45 + lines.length * 15;
            const w = maxWidth + padding * 2;

            let tx = x + 15;
            let ty = y + 15;
            if (tx + w > app.canvas.width) tx = x - w - 15;
            if (ty + h > app.canvas.height) ty = y - h - 15;

            ctx.fillStyle = 'rgba(10, 15, 25, 0.95)';
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            if (app.roundRect) app.roundRect(ctx, tx, ty, w, h, 10, true, false);

            ctx.fillStyle = '#4ca1af';
            ctx.font = 'bold 11px Quicksand, sans-serif';
            ctx.fillText(t(label).toUpperCase(), tx + padding, ty + 25);

            ctx.fillStyle = '#fff';
            ctx.font = '11px Quicksand, sans-serif';
            lines.forEach((line, i) => {
                ctx.fillText(line, tx + padding, ty + 45 + i * 15);
            });

            ctx.restore();
        }
    };

    window.GreenhouseStressTooltips = GreenhouseStressTooltips;
})();
