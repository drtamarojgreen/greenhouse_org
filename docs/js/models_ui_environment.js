
(function() {
    'use strict';

    const GreenhouseModelsUIEnvironment = {
        _brainSVGUrl: 'https://drtamarojgreen.github.io/greenhouse_org/images/brain.svg',
        _brainPath: null,
        _brainRegions: {
            pfc: { path: null, name: 'Prefrontal Cortex', color: 'rgba(0, 100, 255, 0.7)' },
            amygdala: { path: null, name: 'Amygdala', color: 'rgba(255, 0, 0, 0.7)' },
            hippocampus: { path: null, name: 'Hippocampus', color: 'rgba(0, 255, 100, 0.7)' }
        },

        drawEnvironmentView() {
            const ctx = this.contexts.environment;
            const { width, height } = this.canvases.environment;
            if (!ctx) return;

            ctx.clearRect(0, 0, width, height);

            this._drawEnvironmentBackground(ctx, width, height);
            this._drawSociety(ctx, width, height);
            this._drawGenomes(ctx, width, height);
            this._drawCommunity(ctx, width, height);

            this.drawTree(ctx, this.canvases.environment);

            if (this._brainPath) {
                this._drawBrainPath(ctx, width, height);
                this._drawHeatmaps(ctx, width, height);
            } else {
                this._loadBrainPath(() => {
                    this._drawBrainPath(ctx, width, height);
                    this._drawHeatmaps(ctx, width, height);
                });
            }
            this._drawTooltip(ctx);
        },

        async _loadBrainPath(callback) {
            try {
                const response = await fetch(this._brainSVGUrl);
                const svgText = await response.text();

                // Use DOMParser for a more robust extraction
                const parser = new DOMParser();
                const svgDoc = parser.parseFromString(svgText, "image/svg+xml");
                const pathElement = svgDoc.querySelector('path');

                if (pathElement) {
                    const pathData = pathElement.getAttribute('d');
                    this._brainPath = new Path2D(pathData);

                    // Define and create Path2D objects for each brain region
                    this._brainRegions.pfc.path = new Path2D("M 900,300 a 150,150 0 0 1 0,300 h -50 a 100,100 0 0 0 0,-200 Z");
                    this._brainRegions.amygdala.path = new Path2D("M 700,500 a 50,30 0 0 1 0,60 a 50,30 0 0 1 0,-60 Z");
                    this._brainRegions.hippocampus.path = new Path2D("M 750,450 a 80,40 0 0 1 0,80 q -20,-40 0,-80 Z");

                    callback();
                } else {
                    throw new Error("No path element found in the SVG.");
                }
            } catch (error) {
                console.error('Error loading or parsing brain SVG:', error);
            }
        },

        _drawBrainPath(ctx, width, height) {
            const svgWidth = 1536;
            const svgHeight = 1024;
            const scale = Math.min(width / svgWidth, height / svgHeight) * 0.8;
            const offsetX = (width - (svgWidth * scale)) / 2;
            const offsetY = (height - (svgHeight * scale)) / 2;

            ctx.save();
            ctx.translate(offsetX, offsetY);
            ctx.scale(scale, scale);

            // Add drop shadow
            ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
            ctx.shadowBlur = 20;
            ctx.shadowOffsetX = 10;
            ctx.shadowOffsetY = 10;

            ctx.fillStyle = 'rgba(150, 130, 110, 0.9)';
            ctx.fill(this._brainPath);
            ctx.strokeStyle = 'rgba(40, 30, 20, 1.0)';
            ctx.lineWidth = 6 / scale; // Keep stroke width consistent
            ctx.stroke(this._brainPath);
            ctx.restore();
        },

        _drawHeatmaps(ctx, width, height) {
            const scale = Math.min(width / 1536, height / 1024) * 0.8;
            const offsetX = (width - (1536 * scale)) / 2;
            const offsetY = (height - (1024 * scale)) / 2;

            ctx.save();
            ctx.translate(offsetX, offsetY);
            ctx.scale(scale, scale);

            for (const key in this._brainRegions) {
                const region = this._brainRegions[key];
                const activation = this.state.environment.regions[key].activation;

                if (activation > 0.1 && region.path) {
                    ctx.save();
                    ctx.shadowColor = region.color;
                    ctx.shadowBlur = activation * 30;
                    ctx.fillStyle = region.color.replace('0.7', '0.3');
                    ctx.fill(region.path);
                    ctx.restore();
                }
            }
            ctx.restore();
        },

        _drawEnvironmentBackground(ctx, width, height) {
            const stress = this.state.environment.stress;
            const calmColor = { r: 173, g: 216, b: 230 }; // Light Blue
            const stressColor = { r: 255, g: 99, b: 71 }; // Tomato Red

            const r = calmColor.r + (stressColor.r - calmColor.r) * stress;
            const g = calmColor.g + (stressColor.g - calmColor.g) * stress;
            const b = calmColor.b + (stressColor.b - calmColor.b) * stress;

            const gradient = ctx.createLinearGradient(0, 0, width, height);
            gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.7)`);
            gradient.addColorStop(1, `rgba(${r - 50}, ${g - 50}, ${b - 50}, 0.8)`);

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
        },

        _drawGenomes(ctx, width, height) {
            const genetics = this.state.environment.genetics;
            const time = Date.now() / 1000;

            for (let i = 0; i < 5; i++) {
                ctx.save();
                const x = width * (0.1 + i * 0.15);
                const y = height * 0.1;
                ctx.translate(x, y);
                ctx.rotate(time * 0.5);

                const activation = (genetics - 0.5) * 2; // -1 to 1
                const color = activation > 0 ? `rgba(255, 255, 150, ${0.6 + activation * 0.3})` : `rgba(200, 200, 255, 0.6)`;

                ctx.globalAlpha = 0.6 + Math.abs(activation) * 0.3;
                ctx.fillStyle = color;

                ctx.beginPath();
                ctx.moveTo(-5, -15);
                ctx.bezierCurveTo(15, -5, -15, 5, 5, 15);
                ctx.moveTo(5, -15);
                ctx.bezierCurveTo(-15, -5, 15, 5, -5, 15);
                ctx.lineWidth = 2;
                ctx.strokeStyle = ctx.fillStyle;
                ctx.stroke();

                ctx.restore();
            }
        },

        _drawCommunity(ctx, width, height) {
            const support = this.state.environment.support;
            const stableColor = 'rgba(255, 255, 255, 0.9)';
            const unstableColor = 'rgba(255, 0, 0, 0.7)';
            const color = support > 0.5 ? stableColor : unstableColor;

            ctx.save();
            ctx.strokeStyle = color;
            ctx.lineWidth = 1 + support * 2; // Thicker lines for more support

            const radius = Math.min(width, height) * 0.45;
            const nodes = 8;
            const distortion = (1 - support) * 10; // More distortion for less support

            for (let i = 0; i < nodes; i++) {
                const angle1 = (i / nodes) * 2 * Math.PI;
                const x1 = (width / 2) + radius * Math.cos(angle1) + (Math.random() - 0.5) * distortion;
                const y1 = (height / 2) + radius * Math.sin(angle1) + (Math.random() - 0.5) * distortion;
                for (let j = i + 1; j < nodes; j++) {
                    const angle2 = (j / nodes) * 2 * Math.PI;
                    const x2 = (width / 2) + radius * Math.cos(angle2) + (Math.random() - 0.5) * distortion;
                    const y2 = (height / 2) + radius * Math.sin(angle2) + (Math.random() - 0.5) * distortion;
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.stroke();
                }
            }
            ctx.restore();
        },

        _drawSociety(ctx, width, height) {
            ctx.save();
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
            ctx.lineWidth = 1;
            const time = Date.now() / 1000;
            const patternSpeed = 5;
            const offset = (time * patternSpeed) % 40;

            for (let i = -offset; i < width; i += 20) {
                ctx.beginPath();
                ctx.moveTo(i, 0);
                ctx.lineTo(i, height);
                ctx.stroke();
            }
            ctx.restore();
        },

        _handleMouseMove(event) {
            const canvas = this.canvases.environment;
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            let hoveredRegion = null;
            for (const key in this._brainRegions) {
                const region = this._brainRegions[key];
                if (region.path && this.contexts.environment.isPointInPath(region.path, x, y)) {
                    hoveredRegion = region;
                    break;
                }
            }

            if (hoveredRegion) {
                this.state.environment.tooltip.visible = true;
                this.state.environment.tooltip.text = hoveredRegion.name;
                this.state.environment.tooltip.x = x;
                this.state.environment.tooltip.y = y;
            } else {
                this.state.environment.tooltip.visible = false;
            }
        },

        _drawTooltip(ctx) {
            const tooltip = this.state.environment.tooltip;
            if (tooltip.visible) {
                ctx.save();
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(tooltip.x + 10, tooltip.y + 10, 150, 30);
                ctx.fillStyle = 'white';
                ctx.font = '14px Arial';
                ctx.fillText(tooltip.text, tooltip.x + 20, tooltip.y + 30);
                ctx.restore();
            }
        },

        drawTree(ctx, canvas) {
            const { width, height } = canvas;
            ctx.save();
            ctx.fillStyle = '#2e6b2e';
            ctx.strokeStyle = '#2e6b2e';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';

            const startX = width / 2;
            const startY = height;
            const trunkHeight = height * 0.3;
            const trunkWidth = 20; // Increased trunk width

            // Draw trunk
            ctx.beginPath();
            ctx.moveTo(startX - trunkWidth / 2, startY);
            ctx.lineTo(startX - trunkWidth / 2, startY - trunkHeight);
            ctx.lineTo(startX + trunkWidth / 2, startY - trunkHeight);
            ctx.lineTo(startX + trunkWidth / 2, startY);
            ctx.fill();


            // Draw branches using bezier curves
            const drawBranch = (x, y, width, length, angle) => {
                ctx.beginPath();
                ctx.moveTo(x, y);

                const endX = x + length * Math.cos(angle);
                const endY = y + length * Math.sin(angle);

                const cp1x = x + (endX - x) * 0.25 + Math.random() * 20 - 10;
                const cp1y = y + (endY - y) * 0.25 + Math.random() * 20 - 10;
                const cp2x = x + (endX - x) * 0.75 + Math.random() * 20 - 10;
                const cp2y = y + (endY - y) * 0.75 + Math.random() * 20 - 10;

                ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
                ctx.lineWidth = width;
                ctx.stroke();

                if (width > 1.5) { // Adjusted condition for recursion
                    drawBranch(endX, endY, width * 0.7, length * 0.85, angle + Math.random() * 0.6 - 0.3);
                    drawBranch(endX, endY, width * 0.7, length * 0.85, angle - Math.random() * 0.6 - 0.3);
                }
            };

            const branchStartY = startY - trunkHeight;
            // Adjusted parameters for wider, more robust branches
            drawBranch(startX, branchStartY, 10, 70, -Math.PI / 2);
            drawBranch(startX, branchStartY, 7, 60, -Math.PI / 2 - 0.7);
            drawBranch(startX, branchStartY, 7, 60, -Math.PI / 2 + 0.7);
            drawBranch(startX, branchStartY - 20, 5, 50, -Math.PI / 2 - 1.2);
            drawBranch(startX, branchStartY - 20, 5, 50, -Math.PI / 2 + 1.2);


            ctx.restore();
        },
    };

    window.GreenhouseModelsUIEnvironment = GreenhouseModelsUIEnvironment;
})();
