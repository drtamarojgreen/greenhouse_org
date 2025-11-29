
(function () {
    'use strict';

    class BackgroundComponent {
        constructor(state, util) {
            this.state = state;
            this.util = util;
            this.layer = 0;
            this.active = true;
            this.system = null; // To store the reference to the GreenhouseSystem
        }
        init(system) {
            this.system = system; // Store the system reference when initialized
        }
        update() { }
        draw(ctx, width, height) {
            if (window.GreenhouseModelsUIEnvironmentBackground) {
                if (!window.GreenhouseModelsUIEnvironmentBackground.state) {
                    // Pass the stored system reference
                    window.GreenhouseModelsUIEnvironmentBackground.init(this.state, this.util, this.system);
                }
                window.GreenhouseModelsUIEnvironmentBackground.draw(ctx, width, height);
            }
        }
    }

    class InfluencePathsComponent {
        constructor(config) {
            this.config = config;
            this.layer = 1;
            this.active = true;
        }
        init(system) { }
        update() { }
        draw(ctx, width, height) {
            const scale = Math.min(width / 1536, height / 1024) * 0.95;
            const offsetX = (width - (1536 * scale)) / 2;
            const offsetY = (height - (1024 * scale)) / 2;

            ctx.save();
            ctx.translate(offsetX, offsetY);
            ctx.scale(scale, scale);

            const drawPath = (startX, startY, endX, endY, color, lineWidth) => {
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.bezierCurveTo(startX, startY + 50, endX, endY - 80, endX, endY);
                ctx.strokeStyle = color;
                ctx.lineWidth = lineWidth;
                ctx.stroke();
            };

            const config = window.GreenhouseEnvironmentConfig;
            if (config && config.influencePaths) {
                config.influencePaths.forEach(path => {
                    drawPath(path.startX, path.startY, path.endX, path.endY, path.color, path.width);
                });
            }
            ctx.restore();
        }
    }

    class HeatmapComponent {
        constructor(state, util) {
            this.state = state;
            this.util = util;
            this.layer = 2;
            this.active = true;
        }
        init(system) { }
        update(deltaTime) { }
        draw(ctx, width, height) {
            if (window.GreenhouseModelsUIEnvironmentHovers) {
                let allRegions = {};
                if (window.GreenhouseModelsUIEnvironmentBackground && window.GreenhouseModelsUIEnvironmentBackground.getBrainRegions) {
                    allRegions = { ...window.GreenhouseModelsUIEnvironmentBackground.getBrainRegions() };
                }
                if (window.GreenhouseModelsUIEnvironmentMedication && window.GreenhouseModelsUIEnvironmentMedication.regions) {
                    allRegions = { ...allRegions, ...window.GreenhouseModelsUIEnvironmentMedication.regions };
                }
                if (window.GreenhouseModelsUIEnvironmentTherapy && window.GreenhouseModelsUIEnvironmentTherapy.regions) {
                    allRegions = { ...allRegions, ...window.GreenhouseModelsUIEnvironmentTherapy.regions };
                }
                window.GreenhouseModelsUIEnvironmentHovers.drawHeatmaps(ctx, width, height, allRegions);
            }
        }
    }

    class MedicationComponent {
        constructor(state, util) {
            this.state = state;
            this.util = util;
            this.layer = 3;
            this.active = true;
        }
        init(system) {
            if (window.GreenhouseModelsUIEnvironmentMedication) {
                window.GreenhouseModelsUIEnvironmentMedication.init(this.state, this.util);
            }
        }
        update(deltaTime) { }
        draw(ctx, width, height) {
            if (window.GreenhouseModelsUIEnvironmentMedication) {
                if (!window.GreenhouseModelsUIEnvironmentMedication.state) {
                    window.GreenhouseModelsUIEnvironmentMedication.init(this.state, this.util);
                }
                window.GreenhouseModelsUIEnvironmentMedication.draw(ctx, width, height);
            } else {
                this._drawDefaultMedication(ctx, width, height);
            }
        }
        _drawDefaultMedication(ctx, width, height) {
            ctx.save();
            const capsule = { x: width / 2 - 150, y: height / 2 + 100, width: 40, height: 20, radius: 10 };
            ctx.beginPath();
            ctx.moveTo(capsule.x + capsule.radius, capsule.y);
            ctx.lineTo(capsule.x + capsule.width - capsule.radius, capsule.y);
            ctx.arc(capsule.x + capsule.width - capsule.radius, capsule.y + capsule.radius, capsule.radius, Math.PI * 1.5, Math.PI * 0.5, false);
            ctx.lineTo(capsule.x + capsule.radius, capsule.y + capsule.height);
            ctx.arc(capsule.x + capsule.radius, capsule.y + capsule.radius, capsule.radius, Math.PI * 0.5, Math.PI * 1.5, false);
            ctx.closePath();
            ctx.fillStyle = 'rgba(200, 200, 255, 0.9)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(0, 0, 100, 1.0)';
            ctx.lineWidth = 2;
            ctx.stroke();
            // Highlight
            ctx.beginPath();
            ctx.moveTo(capsule.x + capsule.radius, capsule.y + 5);
            ctx.lineTo(capsule.x + capsule.width - capsule.radius, capsule.y + 5);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.fillStyle = this.state.darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)';
            ctx.font = '12px "Helvetica Neue", Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(this.util.t('label_medication'), capsule.x + capsule.width / 2, capsule.y + capsule.height + 15);

            ctx.restore();
        }
    }

    class TherapyComponent {
        constructor(state, util) {
            this.state = state;
            this.util = util;
            this.layer = 4;
            this.active = true;
        }
        init(system) {
            if (window.GreenhouseModelsUIEnvironmentTherapy) {
                window.GreenhouseModelsUIEnvironmentTherapy.init(this.state, this.util);
            }
        }
        update(deltaTime) { }
        draw(ctx, width, height) {
            if (window.GreenhouseModelsUIEnvironmentTherapy) {
                if (!window.GreenhouseModelsUIEnvironmentTherapy.state) {
                    window.GreenhouseModelsUIEnvironmentTherapy.init(this.state, this.util);
                }
                window.GreenhouseModelsUIEnvironmentTherapy.draw(ctx, width, height);
            } else {
                this._drawDefaultTherapy(ctx, width, height);
            }
        }
        _drawDefaultTherapy(ctx, width, height) {
            ctx.save();
            const therapyIcon = { x: width / 2 + 150, y: height / 2 + 100, radius: 20 };
            const person1 = { x: therapyIcon.x - 10, y: therapyIcon.y };
            const person2 = { x: therapyIcon.x + 10, y: therapyIcon.y };
            ctx.fillStyle = 'rgba(150, 220, 150, 0.9)';
            ctx.strokeStyle = 'rgba(0, 100, 0, 1.0)';
            ctx.lineWidth = 2;
            // Person 1
            ctx.beginPath(); ctx.arc(person1.x, person1.y - 5, 5, 0, Math.PI * 2); ctx.moveTo(person1.x, person1.y); ctx.lineTo(person1.x, person1.y + 15); ctx.stroke();
            // Person 2
            ctx.beginPath(); ctx.arc(person2.x, person2.y - 5, 5, 0, Math.PI * 2); ctx.moveTo(person2.x, person2.y); ctx.lineTo(person2.x, person2.y + 15); ctx.stroke();
            ctx.fillStyle = this.state.darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)';
            ctx.font = '12px "Helvetica Neue", Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(this.util.t('label_therapy'), therapyIcon.x, therapyIcon.y + 35);
            ctx.restore();
        }
    }

    class LabelsComponent {
        constructor(state, util) {
            this.state = state;
            this.util = util;
            this.layer = 5;
            this.active = true;
        }
        init(system) { }
        update() { }
        draw(ctx, width, height) {
            const scale = Math.min(width / 1536, height / 1024) * 0.95;
            const offsetX = (width - (1536 * scale)) / 2;
            const offsetY = (height - (1024 * scale)) / 2;

            ctx.save();
            ctx.translate(offsetX, offsetY);
            ctx.scale(scale, scale);

            const drawLabelWithBackground = (text, x, y, fontSize = 16) => {
                const translatedText = this.util.t(text);
                ctx.font = `bold ${fontSize}px "Helvetica Neue", Arial, sans-serif`;
                ctx.textAlign = 'center';
                const metrics = ctx.measureText(text);
                const padding = 8;
                const bgWidth = metrics.width + padding * 2;
                const bgHeight = fontSize + padding * 1.5; // Increased vertical padding
                ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
                ctx.fillRect(x - bgWidth / 2, y - bgHeight / 2 - fontSize / 2, bgWidth, bgHeight);
                ctx.fillStyle = this.state.darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)';
                ctx.fillText(translatedText, x, y);
            };

            const config = window.GreenhouseEnvironmentConfig;
            if (config && config.labels) {
                config.labels.forEach(label => drawLabelWithBackground(label.text, label.x, label.y, label.fontSize || 20)); // #27 - Increased default font size
            }
            if (config && config.icons) {
                config.icons.forEach(icon => {
                    if (icon.type === 'path') {
                        const path = new Path2D(icon.pathData);
                        ctx.fillStyle = icon.color || (this.state.darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)');
                        ctx.save();
                        ctx.translate(icon.x, icon.y);
                        const scale = icon.scale || 1;
                        ctx.scale(scale, scale);
                        ctx.translate(-12, -12); // Center the icon (assuming 24x24 viewbox)
                        ctx.fill(path);
                        ctx.restore();

                        if (icon.label) {
                            const text = this.util.t(icon.label);
                            ctx.save();
                            ctx.fillStyle = icon.color || (this.state.darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)');
                            ctx.font = 'bold 24px "Helvetica Neue", Arial, sans-serif';
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'top';
                            // Position text below the scaled icon
                            // Icon center is (icon.x, icon.y). Scaled size is approx 24 * scale.
                            // Let's put it 20px below the bottom of the icon.
                            const textY = icon.y + (12 * scale) + 10;
                            ctx.fillText(text, icon.x, textY);
                            ctx.restore();
                        }
                    }
                });
            }
            ctx.restore();
        }
    }

    class LegendComponent {
        constructor(util) {
            this.util = util;
            this.layer = 6;
            this.active = true;
        }
        init(system) { }
        update() { }
        draw(ctx, width, height) {
            const t = (k) => this.util.t(k);
            const legendItems = [
                { color: 'rgba(255, 159, 64, 0.8)', text: t('legend_family') },
                { color: 'rgba(54, 162, 235, 0.8)', text: t('legend_society') },
                { color: 'rgba(75, 192, 192, 0.8)', text: t('legend_community') }
            ];
            ctx.save();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.lineWidth = 1;
            const legendWidth = 180;
            const legendHeight = 100; // #8, #86 - Increased height
            const legendX = width - legendWidth - 20; // Positioned to the right
            const legendY = height - legendHeight - 20; // Reverted to bottom right
            ctx.beginPath();
            ctx.roundRect(legendX, legendY, legendWidth, legendHeight, 8);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#357438';
            ctx.font = 'bold 14px "Helvetica Neue", Arial, sans-serif'; // #57 - Increased font size
            ctx.textAlign = 'left';
            ctx.fillText(t('legend_title'), legendX + 10, legendY + 20);
            ctx.font = '12px "Helvetica Neue", Arial, sans-serif'; // #55 - Increased font size
            legendItems.forEach((item, index) => {
                const itemY = legendY + 45 + index * 22; // Adjusted spacing
                ctx.fillStyle = item.color;
                ctx.fillRect(legendX + 10, itemY - 10, 14, 14); // #29, #55 - Larger color swatches
                ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                ctx.fillText(item.text, legendX + 28, itemY);
            });
            ctx.restore();
        }
    }

    class OverlayComponent {
        constructor(state) {
            this.state = state;
            this.layer = 7;
            this.active = true;
        }
        init(system) { }
        update(deltaTime) { }
        draw(ctx, width, height) {
            if (window.GreenhouseModelsUIEnvironmentOverlay && !window.GreenhouseModelsUIEnvironmentOverlay.state) {
                window.GreenhouseModelsUIEnvironmentOverlay.init(this.state);
            }
            if (window.GreenhouseModelsUIEnvironmentOverlay) {
                window.GreenhouseModelsUIEnvironmentOverlay.drawOverlays(ctx, width, height);
            }
        }
    }

    class TitleComponent {
        constructor(util) {
            this.util = util;
            this.layer = 9;
            this.active = true;
        }
        init(system) { }
        update() { }
        draw(ctx, width, height) {
            const t = (k) => this.util.t(k);
            ctx.save();
            const panelHeight = 60; // #34 - Reduced header bar height
            const gradient = ctx.createLinearGradient(0, 0, width, 0);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
            gradient.addColorStop(1, 'rgba(245, 250, 255, 0.95)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, panelHeight);
            ctx.strokeStyle = 'rgba(53, 116, 56, 0.3)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, panelHeight);
            ctx.lineTo(width, panelHeight);
            ctx.stroke();
            ctx.fillStyle = '#357438';
            ctx.textAlign = 'left'; // Align left for better balance
            ctx.font = 'bold 24px "Quicksand", "Helvetica Neue", Arial, sans-serif'; // #4 - Reduced font size
            ctx.fillText(t('env_title'), 20, 30);
            ctx.font = '13px "Helvetica Neue", Arial, sans-serif'; // #5, #93 - Reduced font size
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillText(t('env_subtitle'), 22, 48);
            ctx.restore();
        }
    }

    class TooltipComponent {
        constructor(state, util) {
            this.state = state;
            this.util = util;
            this.layer = 10;
            this.active = true;
        }
        init(system) { }
        update(deltaTime) { }
        draw(ctx, width, height) {
            if (window.GreenhouseModelsUIEnvironmentHovers && !window.GreenhouseModelsUIEnvironmentHovers.state) {
                window.GreenhouseModelsUIEnvironmentHovers.init(this.state, this.util);
            }
            if (window.GreenhouseModelsUIEnvironmentHovers) {
                window.GreenhouseModelsUIEnvironmentHovers.drawTooltip(ctx);
            }
        }
    }

    const GreenhouseModelsUIEnvironment = {
        environmentSystem: null,

        drawEnvironmentView() {
            if (!this.environmentSystem) {
                // Initialize the system and components
                this.environmentSystem = new window.GreenhouseModelsUtil.GreenhouseSystem(this.canvases.environment);

                // #91 - Refactor component initialization to be data-driven
                const components = [
                    { constructor: BackgroundComponent, args: [this.state, this.util, this.environmentSystem] },
                    { constructor: InfluencePathsComponent, args: [] },
                    { constructor: HeatmapComponent, args: [this.state, this.util] },
                    { constructor: MedicationComponent, args: [this.state, this.util] },
                    { constructor: TherapyComponent, args: [this.state, this.util] },
                    { constructor: LabelsComponent, args: [this.state, this.util] },
                    { constructor: LegendComponent, args: [this.util] },
                    { constructor: OverlayComponent, args: [this.state] },
                    { constructor: TitleComponent, args: [this.util] },
                    { constructor: TooltipComponent, args: [this.state, this.util] }
                ];

                components.forEach(comp => {
                    this.environmentSystem.addComponent(new comp.constructor(...comp.args));
                });
            }

            // Render the frame using the system
            this.environmentSystem.renderFrame();
        },

        _handleMouseMove(event) { // This function is called by models_ux.js
            // OPTIMIZATION: Calculate common values ONCE and share with all handlers
            const canvas = this.canvases.environment;
            const context = this.contexts.environment;
            const rect = canvas.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;

            const scale = Math.min(canvas.width / 1536, canvas.height / 1024) * 0.8;
            const offsetX = (canvas.width - (1536 * scale)) / 2;
            const offsetY = (canvas.height - (1024 * scale)) / 2;
            const logicalX = (mouseX - offsetX) / scale;
            const logicalY = (mouseY - offsetY) / scale;

            // Create shared hit test context with pre-calculated coordinates
            const hitContext = {
                mouseX, mouseY, logicalX, logicalY,
                canvas, context, scale, offsetX, offsetY
            };

            // Pass pre-calculated values to all handlers (eliminates redundant calculations)
            if (window.GreenhouseModelsUIEnvironmentHovers) {
                // Get brain regions from background module
                let brainRegions = {};
                if (window.GreenhouseModelsUIEnvironmentBackground && window.GreenhouseModelsUIEnvironmentBackground.getBrainRegions) {
                    brainRegions = window.GreenhouseModelsUIEnvironmentBackground.getBrainRegions();
                }

                window.GreenhouseModelsUIEnvironmentHovers.handleMouseMove(hitContext, brainRegions);
            }
            if (window.GreenhouseModelsUIEnvironmentMedication) {
                window.GreenhouseModelsUIEnvironmentMedication.handleMouseMove(hitContext);
            }
            if (window.GreenhouseModelsUIEnvironmentTherapy) {
                window.GreenhouseModelsUIEnvironmentTherapy.handleMouseMove(hitContext);
            }
        },

        _handleClick(event, canvas, ctx) { // This function is called by models_ux.js
            if (window.GreenhouseModelsUIEnvironmentMedication && window.GreenhouseModelsUIEnvironmentMedication.handleClick) {
                window.GreenhouseModelsUIEnvironmentMedication.handleClick(event, canvas, ctx);
            }
            if (window.GreenhouseModelsUIEnvironmentTherapy && window.GreenhouseModelsUIEnvironmentTherapy.handleClick) {
                window.GreenhouseModelsUIEnvironmentTherapy.handleClick(event, canvas, ctx);
            }
        },
    };

    window.GreenhouseModelsUIEnvironment = GreenhouseModelsUIEnvironment;
})();
