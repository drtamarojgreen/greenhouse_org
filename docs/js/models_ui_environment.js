
(function () {
    'use strict';

    const GreenhouseModelsUIEnvironment = {

        drawEnvironmentView() {
            const ctx = this.contexts.environment;
            const { width, height } = this.canvases.environment;
            if (!ctx) return;

            ctx.clearRect(0, 0, width, height);

            // Initialize Background if needed
            if (window.GreenhouseModelsUIEnvironmentBackground) {
                if (!window.GreenhouseModelsUIEnvironmentBackground.state) {
                    window.GreenhouseModelsUIEnvironmentBackground.init(this.state, this.util);
                }
                window.GreenhouseModelsUIEnvironmentBackground.draw(ctx, width, height);
            }

            this._drawInfluencePaths(ctx, width, height); // Draw the new paths

            // Heatmaps
            if (window.GreenhouseModelsUIEnvironmentHovers) {
                // Collect all regions for heatmap rendering
                let allRegions = {};

                // Get brain regions from background module
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

            if (window.GreenhouseModelsUIEnvironmentMedication) {
                if (!window.GreenhouseModelsUIEnvironmentMedication.state) {
                    window.GreenhouseModelsUIEnvironmentMedication.init(this.state, this.util);
                }
                window.GreenhouseModelsUIEnvironmentMedication.draw(ctx, width, height);
            } else {
                this._drawMedication(ctx, width, height);
            }

            if (window.GreenhouseModelsUIEnvironmentTherapy) {
                if (!window.GreenhouseModelsUIEnvironmentTherapy.state) {
                    window.GreenhouseModelsUIEnvironmentTherapy.init(this.state, this.util);
                }
                window.GreenhouseModelsUIEnvironmentTherapy.draw(ctx, width, height);
            } else {
                this._drawTherapy(ctx, width, height); // Draw therapy AFTER brain (on top)
            }
            this._drawLabels(ctx, width, height);
            this._drawLegend(ctx, width, height);

            // Initialize overlays if not already done
            if (window.GreenhouseModelsUIEnvironmentOverlay && !window.GreenhouseModelsUIEnvironmentOverlay.state) {
                window.GreenhouseModelsUIEnvironmentOverlay.init(this.state);
            }

            // Draw overlays
            if (window.GreenhouseModelsUIEnvironmentOverlay) {
                window.GreenhouseModelsUIEnvironmentOverlay.drawOverlays(ctx, width, height);
            }

            // Initialize hovers if not already done
            if (window.GreenhouseModelsUIEnvironmentHovers && !window.GreenhouseModelsUIEnvironmentHovers.state) {
                window.GreenhouseModelsUIEnvironmentHovers.init(this.state, this.util);
            }

            this._drawTitle(ctx, width, height);

            if (window.GreenhouseModelsUIEnvironmentHovers) {
                window.GreenhouseModelsUIEnvironmentHovers.drawTooltip(ctx);
            }

            // Signal to automated testing frameworks that the canvas has been rendered.
            window.renderingComplete = true;
        },

        _drawTherapy(ctx, width, height) {
            ctx.save();
            const therapyIcon = {
                x: width / 2 + 150,
                y: height / 2 + 100,
                radius: 20
            };

            // Two stylized figures in conversation
            const person1 = { x: therapyIcon.x - 10, y: therapyIcon.y };
            const person2 = { x: therapyIcon.x + 10, y: therapyIcon.y };

            ctx.fillStyle = 'rgba(150, 220, 150, 0.9)';
            ctx.strokeStyle = 'rgba(0, 100, 0, 1.0)';
            ctx.lineWidth = 2;

            // Person 1
            ctx.beginPath();
            ctx.arc(person1.x, person1.y - 5, 5, 0, Math.PI * 2); // Head
            ctx.moveTo(person1.x, person1.y);
            ctx.lineTo(person1.x, person1.y + 15); // Body
            ctx.stroke();

            // Person 2
            ctx.beginPath();
            ctx.arc(person2.x, person2.y - 5, 5, 0, Math.PI * 2); // Head
            ctx.moveTo(person2.x, person2.y);
            ctx.lineTo(person2.x, person2.y + 15); // Body
            ctx.stroke();

            ctx.fillStyle = this.state.darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)';
            ctx.font = '12px "Helvetica Neue", Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Therapy', therapyIcon.x, therapyIcon.y + 35);

            ctx.restore();
        },

        _drawLabels(ctx, width, height) {
            const scale = Math.min(width / 1536, height / 1024) * 0.8;
            const offsetX = (width - (1536 * scale)) / 2;
            const offsetY = (height - (1024 * scale)) / 2;

            ctx.save();
            ctx.translate(offsetX, offsetY);
            ctx.scale(scale, scale);

            // Helper function to draw text with background
            const drawLabelWithBackground = (text, x, y, fontSize = 16) => {
                ctx.font = `${fontSize}px "Helvetica Neue", Arial, sans-serif`;
                ctx.textAlign = 'center';

                // Measure text for background
                const metrics = ctx.measureText(text);
                const padding = 8;
                const bgWidth = metrics.width + padding * 2;
                const bgHeight = fontSize + padding;

                // Draw semi-transparent background
                ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
                ctx.fillRect(
                    x - bgWidth / 2,
                    y - bgHeight / 2 - fontSize / 2,
                    bgWidth,
                    bgHeight
                );

                // Draw text
                ctx.fillStyle = this.state.darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)';
                ctx.fillText(text, x, y);
            };

            const config = window.GreenhouseEnvironmentConfig;
            if (config && config.labels) {
                config.labels.forEach(label => {
                    drawLabelWithBackground(label.text, label.x, label.y, label.fontSize);
                });
            }

            if (config && config.icons) {
                config.icons.forEach(icon => {
                    if (icon.type === 'path') {
                        const path = new Path2D(icon.pathData);
                        ctx.fillStyle = this.state.darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)';
                        ctx.save();
                        ctx.translate(icon.x - 12, icon.y - 12); // Center adjustment
                        ctx.fill(path);
                        ctx.restore();
                    }
                });
            }

            ctx.restore();
        },

        _drawTitle(ctx, width, height) {
            ctx.save();

            // Draw background panel for title
            const panelHeight = 70;
            const gradient = ctx.createLinearGradient(0, 0, width, 0);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
            gradient.addColorStop(1, 'rgba(245, 250, 255, 0.95)');

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, panelHeight);

            // Add subtle border
            ctx.strokeStyle = 'rgba(53, 116, 56, 0.3)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, panelHeight);
            ctx.lineTo(width, panelHeight);
            ctx.stroke();

            // Draw title
            ctx.fillStyle = '#357438'; // Brand color
            ctx.textAlign = 'center';
            ctx.font = 'bold 28px "Quicksand", "Helvetica Neue", Arial, sans-serif';
            ctx.fillText('Mental Health Environment', width / 2, 35);

            // Simplified subtitle
            ctx.font = '14px "Helvetica Neue", Arial, sans-serif';
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillText('Interactive Model', width / 2, 55);

            ctx.restore();
        },

        _drawLegend(ctx, width, height) {
            const legendItems = [
                { color: 'rgba(255, 159, 64, 0.8)', text: 'Family' },
                { color: 'rgba(54, 162, 235, 0.8)', text: 'Society' },
                { color: 'rgba(75, 192, 192, 0.8)', text: 'Community' }
            ];

            ctx.save();

            // Lighter, more transparent background
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.lineWidth = 1;

            const legendWidth = 180;
            const legendHeight = 90;
            const legendX = width - legendWidth - 20; // Right side
            const legendY = height - legendHeight - 20; // Bottom

            // Draw rounded rectangle
            ctx.beginPath();
            ctx.roundRect(legendX, legendY, legendWidth, legendHeight, 8);
            ctx.fill();
            ctx.stroke();

            // Title
            ctx.fillStyle = '#357438';
            ctx.font = 'bold 12px "Helvetica Neue", Arial, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('Influences', legendX + 10, legendY + 20);

            // Legend items
            ctx.font = '11px "Helvetica Neue", Arial, sans-serif';
            legendItems.forEach((item, index) => {
                const itemY = legendY + 40 + index * 20;

                // Color box
                ctx.fillStyle = item.color;
                ctx.fillRect(legendX + 10, itemY - 8, 12, 12);

                // Text
                ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                ctx.fillText(item.text, legendX + 28, itemY);
            });

            ctx.restore();
        },

        _drawInfluencePaths(ctx, width, height) {
            const scale = Math.min(width / 1536, height / 1024) * 0.8;
            const offsetX = (width - (1536 * scale)) / 2;
            const offsetY = (height - (1024 * scale)) / 2;

            ctx.save();
            ctx.translate(offsetX, offsetY);
            ctx.scale(scale, scale);

            const drawPath = (startX, startY, endX, endY, color, lineWidth) => {
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.bezierCurveTo(
                    startX, startY + 50,
                    endX, endY - 80,
                    endX, endY
                );
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
        },

        _drawMedication(ctx, width, height) {
            ctx.save();
            const capsule = {
                x: width / 2 - 150,
                y: height / 2 + 100,
                width: 40,
                height: 20,
                radius: 10
            };

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

            // Add a highlight
            ctx.beginPath();
            ctx.moveTo(capsule.x + capsule.radius, capsule.y + 5);
            ctx.lineTo(capsule.x + capsule.width - capsule.radius, capsule.y + 5);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.fillStyle = this.state.darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)';
            ctx.font = '12px "Helvetica Neue", Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Medication', capsule.x + capsule.width / 2, capsule.y + capsule.height + 15);

            ctx.restore();
        },

        _handleMouseMove(event) {
            if (window.GreenhouseModelsUIEnvironmentHovers) {
                // Get brain regions from background module
                let brainRegions = {};
                if (window.GreenhouseModelsUIEnvironmentBackground && window.GreenhouseModelsUIEnvironmentBackground.getBrainRegions) {
                    brainRegions = window.GreenhouseModelsUIEnvironmentBackground.getBrainRegions();
                }

                window.GreenhouseModelsUIEnvironmentHovers.handleMouseMove(
                    event,
                    this.canvases.environment,
                    this.contexts.environment,
                    brainRegions
                );
            }
            if (window.GreenhouseModelsUIEnvironmentMedication) {
                window.GreenhouseModelsUIEnvironmentMedication.handleMouseMove(
                    event,
                    this.canvases.environment,
                    this.contexts.environment
                );
            }
            if (window.GreenhouseModelsUIEnvironmentTherapy) {
                window.GreenhouseModelsUIEnvironmentTherapy.handleMouseMove(
                    event,
                    this.canvases.environment,
                    this.contexts.environment
                );
            }
        },

        handleClick(event, canvas, ctx) {
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

