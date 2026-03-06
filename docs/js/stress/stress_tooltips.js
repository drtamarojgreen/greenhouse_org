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
            hypothalamus: 'Hypothalamus: The command hub (PVN) that initiates the systemic hormonal cascade.',

            // Biological Markers (Items 21-50)
            bio_crh: 'Corticotropin-Releasing Hormone: Primary hypothalamic trigger for the HPA axis.',
            bio_acth: 'Adrenocorticotropic Hormone: Stimulates the adrenal cortex to release cortisol.',
            bio_cortisol: 'Glucocorticoid hormone; regulates metabolism, immune response, and stress adaptation.',
            bio_dhea: 'Neurosteroid that buffers the effects of cortisol and supports neuroprotection.',
            bio_epi: 'Adrenaline: Rapid sympathetic activator; increases heart rate and glucose mobilization.',
            bio_norepi: 'Noradrenaline: Mediates arousal and vigilance; narrows focus under threat.',
            bio_il6: 'Pro-inflammatory cytokine; mediates systemic inflammation and sickness behavior.',
            bio_tnf: 'Tumor Necrosis Factor: Critical inflammatory signaling molecule linked to chronic stress.',
            bio_crp: 'Acute-phase protein; systemic marker of underlying inflammatory activity.',
            bio_bdnf: 'Supports neuronal survival and synaptic plasticity; reduced by chronic stress.',
            bio_glu: 'Primary excitatory neurotransmitter; excess leads to neurotoxicity in chronic stress.',
            bio_gaba: 'Primary inhibitory neurotransmitter; provides the neurological "brakes" on stress.',
            bio_dopa: 'Mediates reward and motivation; downregulated in "burnout" or chronic stress.',
            bio_sero: 'Regulates mood and emotional stability; impacted by chronic cortisol elevation.',
            bio_oxy: 'Promotes social bonding and downregulates amygdala reactivity.',
            bio_hrv: 'Indicator of autonomic flexibility; high variability correlates with better health.',
            bio_bp: 'Systemic pressure; chronic elevation leads to cardiovascular wear and tear.',
            bio_rhr: 'Baseline metabolic demand; elevated heart rate reflects persistent sympathetic drive.',
            bio_amy: 'Biomarker of sympathetic nervous system activity and psychological arousal.',
            bio_npy: 'Neurochemical that promotes resilience and counteracts CRH effects.',
            bio_can: 'Regulate emotional memory and the termination of the stress response.',
            bio_pyy: 'Gut hormone involved in appetite regulation; sensitive to metabolic stress.',
            bio_lep: 'Adipose-derived hormone; influences the HPA axis and metabolic rate.',
            bio_ghr: 'Hunger hormone; increases during stress to drive calorie-seeking behavior.',
            bio_telo: 'Protective caps on chromosomes; accelerated shortening is a marker of cellular aging.',
            bio_meth: 'Epigenetic modification that alters gene expression in response to environment.',
            bio_ali: 'Composite measure of physiological dysregulation across multiple systems.',
            bio_mtdna: 'Marker of mitochondrial damage and cellular stress signaling.',
            bio_ros: 'Reactive Oxygen Species: Cause cellular damage if not neutralized by antioxidants.',
            bio_hrr: 'The speed at which the heart rate returns to baseline after a stressor.'
        },

        draw(ctx, app, x, y, isLocked = false) {
            const el = isLocked ? app.ui.lockedTooltip : app.ui.hoveredElement;
            if (!el) return;

            if (el.type === 'category_node') {
                this.drawCategoryTooltip(ctx, app, el, x, y);
                return;
            }


            const descKey = 'desc_' + el.id;
            let desc = t(descKey);
            if (desc === descKey) {
                desc = this.definitions[el.id] || el.description || t('stress_ui_biological_component');
            }

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
        },

        drawCategoryTooltip(ctx, app, el, x, y) {
            const catId = el.id.replace('cat_', '');
            const systemic = window.GreenhouseStressSystemic;
            const config = window.GreenhouseStressConfig;
            const state = app.engine.state;

            const catDef = systemic ? systemic.categories[catId] : null;
            const history = (systemic && systemic.scoreHistory) ? systemic.scoreHistory[catId] : [];

            const activeFactors = config.factors.filter(f => f.category === catId && state.factors[f.id] === 1);

            ctx.save();
            const w = 220;
            const h = 180 + (activeFactors.length > 0 ? 40 : 0);
            let tx = x + 15;
            let ty = y + 15;
            if (tx + w > app.canvas.width) tx = x - w - 15;
            if (ty + h > app.canvas.height) ty = y - h - 15;

            ctx.fillStyle = 'rgba(5, 10, 20, 0.95)';
            ctx.strokeStyle = catDef ? catDef.color : '#fff';
            ctx.lineWidth = 2;
            if (app.roundRect) app.roundRect(ctx, tx, ty, w, h, 10, true, true);

            // Header
            ctx.fillStyle = catDef ? catDef.color : '#fff';
            ctx.font = 'bold 12px Quicksand, sans-serif';
            ctx.fillText(el.label.toUpperCase(), tx + 15, ty + 25);

            // Item 20: Mini-Sparkline
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.lineWidth = 1;
            ctx.strokeRect(tx + 15, ty + 40, 190, 40);

            if (history && history.length > 1) {
                ctx.beginPath();
                ctx.strokeStyle = catDef ? catDef.color : '#fff';
                ctx.lineWidth = 2;
                const maxVal = Math.max(...history, 5);
                history.forEach((val, i) => {
                    const sx = tx + 15 + (i / (history.length - 1)) * 190;
                    const sy = ty + 80 - (val / maxVal) * 35;
                    if (i === 0) ctx.moveTo(sx, sy);
                    else ctx.lineTo(sx, sy);
                });
                ctx.stroke();
            }
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.font = '9px Arial';
            ctx.fillText(t('stress_ui_trend'), tx + 15, ty + 95);

            // Item 11: Contribution Breakdown
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px Quicksand, sans-serif';
            ctx.fillText(t('stress_ui_active_factors'), tx + 15, ty + 115);

            if (activeFactors.length > 0) {
                activeFactors.slice(0, 5).forEach((f, i) => {
                    ctx.fillStyle = 'rgba(255,255,255,0.8)';
                    ctx.font = '10px Quicksand, sans-serif';
                    ctx.fillText('• ' + t(f.label), tx + 20, ty + 130 + i * 14);
                });
                if (activeFactors.length > 5) {
                    ctx.fillText(`... and ${activeFactors.length - 5} more`, tx + 20, ty + 130 + 5 * 14);
                }
            } else {
                ctx.fillStyle = 'rgba(255,255,255,0.4)';
                ctx.fillText(t('stress_ui_none_active'), tx + 20, ty + 130);
            }

            // Item 13: Scientific Notation (if applicable)
            const score = activeFactors.length;
            const sciScore = score === 0 ? "0.00e+0" : score.toExponential(2);
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.font = '9px monospace';
            ctx.textAlign = 'right';
            ctx.fillText(`${t('stress_ui_raw_sensitivity')} ${sciScore}`, tx + 205, ty + 25);

            ctx.restore();
        }
    };

    window.GreenhouseStressTooltips = GreenhouseStressTooltips;
})();
