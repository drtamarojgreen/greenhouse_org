// docs/js/synapse_actions.js
// User interaction, hit detection, and dynamic UI for the Synapse Visualization

(function () {
    'use strict';

    const SynapseActions = {

        // --- Event Handlers ---

        handleMouseMove(app, e) {
            const rect = app.canvas.getBoundingClientRect();
            app.mouse.x = e.clientX - rect.left;
            app.mouse.y = e.clientY - rect.top;
        },

        handleClick(app, e) {
            const w = app.canvas.width;
            // Check if EN button was clicked
            if (app.mouse.x > w - 70 && app.mouse.x < w - 40 && app.mouse.y > 10 && app.mouse.y < 30) {
                app.currentLanguage = 'en';
            }
            // Check if ES button was clicked
            if (app.mouse.x > w - 35 && app.mouse.x < w - 5 && app.mouse.y > 10 && app.mouse.y < 30) {
                app.currentLanguage = 'es';
            }
        },

        // --- Dynamic UI Drawing ---

        drawLanguageSwitcher(app, ctx) {
            const w = app.canvas.width;
            ctx.save();
            ctx.font = 'bold 14px "Courier New", Courier, monospace';

            // EN button
            ctx.fillStyle = app.currentLanguage === 'en' ? '#FFFFFF' : '#888888';
            ctx.fillText('EN', w - 60, 25);

            // Separator
            ctx.fillStyle = '#555555';
            ctx.fillText('|', w - 40, 25);

            // ES button
            ctx.fillStyle = app.currentLanguage === 'es' ? '#FFFFFF' : '#888888';
            ctx.fillText('ES', w - 25, 25);

            ctx.restore();
        },

        drawTooltip(app, ctx) {
            if (!app.hoveredItem) return;

            const text = SynapseElements.config.translations[app.hoveredItem][app.currentLanguage];
            if (!text) return;

            const x = app.mouse.x + 15;
            const y = app.mouse.y + 15;

            ctx.font = SynapseElements.config.labelFont;
            const textWidth = ctx.measureText(text).width;

            ctx.fillStyle = SynapseElements.config.tooltipBg;
            ctx.fillRect(x - 5, y - 15, textWidth + 10, 20);

            ctx.fillStyle = SynapseElements.config.tooltipColor;
            ctx.fillText(text, x, y);
        },

        // --- Hit Detection Logic ---

        performHitDetection(app, ctx, w, h, offsets, scale) {
            app.hoveredItem = null; // Reset on each frame

            // Order matters: check foreground items first
            if (this.isMouseOverVesicles(app, ctx, w, h, offsets.midLayerX, offsets.midLayerY, scale)) return;
            if (this.isMouseOverCalciumBlockers(app, ctx, w, h, offsets.bgLayerX, offsets.bgLayerY)) return;
            if (this.isMouseOverGPCRs(app, ctx, w, h, offsets.bgLayerX, offsets.bgLayerY)) return;
            if (this.isMouseOverIonChannels(app, ctx, w, h, offsets.bgLayerX, offsets.bgLayerY)) return;
            if (this.isMouseOverPreSynapticTerminal(app, ctx, w, h, offsets.midLayerX, offsets.midLayerY)) return;
            if (this.isMouseOverPostSynapticTerminal(app, ctx, w, h, offsets.bgLayerX, offsets.bgLayerY)) return;
        },

        isMouseOverCalciumBlockers(app, ctx, w, h, offsetX, offsetY) {
            for (const x of SynapseElements.config.calciumBlockers) {
                const path = this.getCalciumBlockerPath(x, w, h);
                ctx.save();
                ctx.translate(offsetX, offsetY);
                if (ctx.isPointInPath(path, app.mouse.x, app.mouse.y)) {
                    app.hoveredItem = 'calciumBlocker';
                    ctx.restore();
                    return true;
                }
                ctx.restore();
            }
            return false;
        },

        isMouseOverPreSynapticTerminal(app, ctx, w, h, offsetX, offsetY) {
            const path = this.getPreSynapticTerminalPath(w, h);
            ctx.save();
            ctx.translate(offsetX, offsetY);
            if (ctx.isPointInPath(path, app.mouse.x, app.mouse.y)) {
                app.hoveredItem = 'preSynapticTerminal';
                ctx.restore();
                return true;
            }
            ctx.restore();
            return false;
        },

        isMouseOverPostSynapticTerminal(app, ctx, w, h, offsetX, offsetY) {
            const path = this.getPostSynapticTerminalPath(w, h);
            ctx.save();
            ctx.translate(offsetX, offsetY);
            if (ctx.isPointInPath(path, app.mouse.x, app.mouse.y)) {
                app.hoveredItem = 'postSynapticTerminal';
                ctx.restore();
                return true;
            }
            ctx.restore();
            return false;
        },

        isMouseOverVesicles(app, ctx, w, h, offsetX, offsetY, scale) {
            for (const v of SynapseElements.config.vesicles) {
                const path = this.getVesiclePath(v, w, h, scale);
                ctx.save();
                ctx.translate(offsetX, offsetY);
                if (ctx.isPointInPath(path, app.mouse.x, app.mouse.y)) {
                    app.hoveredItem = v.id || 'vesicle'; // Use specific ID if available
                    ctx.restore();
                    return true;
                }
                ctx.restore();
            }
            return false;
        },

        isMouseOverIonChannels(app, ctx, w, h, offsetX, offsetY) {
            for (const x of SynapseElements.config.ionChannels) {
                const path = this.getIonChannelPath(x, w, h);
                ctx.save();
                ctx.translate(offsetX, offsetY);
                if (ctx.isPointInPath(path, app.mouse.x, app.mouse.y)) {
                    app.hoveredItem = 'ionChannel';
                    ctx.restore();
                    return true;
                }
                ctx.restore();
            }
            return false;
        },

        isMouseOverGPCRs(app, ctx, w, h, offsetX, offsetY) {
             for (const x of SynapseElements.config.gpcrs) {
                const path = new Path2D();
                const rectX = w * x - 15;
                const rectY = h * 0.6 - 15;
                const rectW = 30;
                const rectH = 20;
                path.rect(rectX, rectY, rectW, rectH);

                ctx.save();
                ctx.translate(offsetX, offsetY);
                if (ctx.isPointInPath(path, app.mouse.x, app.mouse.y)) {
                    app.hoveredItem = 'gpcr';
                    ctx.restore();
                    return true;
                }
                ctx.restore();
            }
            return false;
        },

        // --- Path Definitions for Hit Detection ---

        getPreSynapticTerminalPath(w, h) {
            const path = new Path2D();
            path.moveTo(0, h * 0.4);
            path.bezierCurveTo(w * 0.25, h * 0.3, w * 0.75, h * 0.3, w, h * 0.4);
            path.lineTo(w, 0);
            path.lineTo(0, 0);
            path.closePath();
            return path;
        },

        getPostSynapticTerminalPath(w, h) {
            const path = new Path2D();
            path.moveTo(0, h * 0.6);
            path.bezierCurveTo(w * 0.25, h * 0.7, w * 0.75, h * 0.7, w, h * 0.6);
            path.lineTo(w, h);
            path.lineTo(0, h);
            path.closePath();
            return path;
        },

        getVesiclePath(vesicle, w, h, scale) {
            const path = new Path2D();
            path.arc(w * vesicle.x, h * vesicle.y, vesicle.r * scale, 0, Math.PI * 2);
            return path;
        },

        getIonChannelPath(x, w, h) {
            const path = new Path2D();
            path.rect(w * x - 10, h * 0.6 - 15, 20, 15);
            return path;
        },

        getCalciumBlockerPath(x, w, h) {
            const path = new Path2D();
            const centerX = w * x;
            const centerY = h * 0.6 - 15;
            path.moveTo(centerX, centerY - 8);
            path.lineTo(centerX + 8, centerY + 8);
            path.lineTo(centerX - 8, centerY + 8);
            path.closePath();
            return path;
        },

        // --- Particle Simulation ---

        // --- Guided Tour ---

        drawTour(app, ctx, w, h) {
            if (!app.tour.active) return;

            const tourStepDuration = 300; // frames per step
            app.tour.progress++;

            let text = '';
            let highlightPath = null;
            const config = SynapseElements.config;

            if (app.tour.step === 0) {
                text = config.translations.tourStep1[app.currentLanguage];
                highlightPath = this.getPreSynapticTerminalPath(w, h);
            } else if (app.tour.step === 1) {
                text = config.translations.tourStep2[app.currentLanguage];
                // No specific path for the cleft, we just show the text
            } else if (app.tour.step === 2) {
                text = config.translations.tourStep3[app.currentLanguage];
                highlightPath = this.getPostSynapticTerminalPath(w, h);
            } else {
                text = config.translations.tourEnd[app.currentLanguage];
            }

            // --- Draw Highlight ---
            if (highlightPath) {
                ctx.save();
                ctx.fillStyle = 'rgba(255, 235, 59, 0.3)'; // Yellow highlight
                ctx.fill(highlightPath);
                ctx.strokeStyle = '#FFEB3B';
                ctx.lineWidth = 2;
                ctx.stroke(highlightPath);
                ctx.restore();
            }

            // --- Draw Text Box ---
            const alpha = Math.min(1, app.tour.progress / 60, (tourStepDuration - app.tour.progress) / 60);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = config.tooltipBg;
            ctx.fillRect(w / 2 - 200, h - 70, 400, 50);

            ctx.font = '16px "Helvetica Neue", Arial, sans-serif';
            ctx.fillStyle = config.tooltipColor;
            ctx.textAlign = 'center';
            ctx.fillText(text, w / 2, h - 40);
            ctx.restore();

            // --- Advance Tour ---
            if (app.tour.progress >= tourStepDuration) {
                app.tour.progress = 0;
                app.tour.step++;
                if (app.tour.step > 3) {
                    app.tour.active = false;
                }
            }
        },

        updateParticles(app, w, h) {
            // Disable particle spawning during the tour
            if (app.tour.active) return;

            // 1. Spawn new particles periodically
            if (Math.random() < 0.1) {
                const isModulator = Math.random() < 0.2;
                app.particles.push({
                    startX: Math.random() * w,
                    y: h * 0.4,
                    r: isModulator ? 5 : 3,
                    waveOffset: Math.random() * Math.PI * 2,
                    vy: (Math.random() * 0.5) + 0.5,
                    life: 1.0,
                    isModulator: isModulator,
                    color: isModulator ? SynapseElements.config.neuromodulatorColor : SynapseElements.config.neurotransmitterColor
                });
            }

            // 2. Update and draw existing particles
            for (let i = app.particles.length - 1; i >= 0; i--) {
                const p = app.particles[i];

                // Update position with organic sine wave motion
                p.y += p.vy;
                p.x = p.startX + Math.sin(p.y * 0.1 + p.waveOffset) * 10;
                p.life -= 0.005;

                // Remove dead particles
                if (p.life <= 0) {
                    app.particles.splice(i, 1);
                    continue;
                }

                // 3. Check for binding or neuromodulation
                if (!p.isModulator) {
                    // Standard Neurotransmitter: Check for binding
                    if (p.y > h * 0.6) {
                        const isOverBlockedChannel = SynapseElements.config.calciumBlockers.some(b => Math.abs(p.x - w * b.x) < 20);
                        if (isOverBlockedChannel) {
                            // Particle bounces off if channel is blocked
                            p.vy *= -0.5;
                        } else {
                            // Simple distance check for binding to any receptor
                            const isOverReceptor = SynapseElements.config.ionChannels.some(c => Math.abs(p.x - w * c.x) < 20) || SynapseElements.config.gpcrs.some(g => Math.abs(p.x - w * g.x) < 20);
                            if (isOverReceptor) {
                                app.particles.splice(i, 1); // Remove on binding
                            }
                        }
                    }
                } else {
                    // Neuromodulator: Triggers a wave effect
                    if (p.y > h * 0.7 && !p.waveTriggered) {
                        p.waveTriggered = true;
                        app.neuromodulationWave = { x: p.x, y: p.y, radius: 0 };
                    }
                }
            }
        }
    };

    window.SynapseActions = SynapseActions;
})();
