
(function() {
    'use strict';

    const GreenhouseModelsUIEnvironment = {
        _brainSVGUrl: 'https://drtamarojgreen.github.io/greenhouse_org/images/brain.svg',
        _brainPath: null,

        drawEnvironmentView() {
            const ctx = this.contexts.environment;
            const { width, height } = this.canvases.environment;
            if (!ctx) return;

            ctx.clearRect(0, 0, width, height);

            this._drawEnvironmentBackground(ctx, width, height);
            this._drawSociety(ctx, width, height);
            this._drawGenomes(ctx, width, height);
            this._drawCommunity(ctx, width, height);

            if (this._brainPath) {
                this._drawBrainPath(ctx, width, height);
                this._drawHeatmaps(ctx, width, height);
            } else {
                this._loadBrainPath(() => {
                    this._drawBrainPath(ctx, width, height);
                    this._drawHeatmaps(ctx, width, height);
                });
            }
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
            const regions = {
                pfc: { x: width * 0.65, y: height * 0.35, radius: 60, color: 'rgba(0, 100, 255, 0.7)' },
                amygdala: { x: width * 0.5, y: height * 0.55, radius: 30, color: 'rgba(255, 0, 0, 0.7)' },
                hippocampus: { x: width * 0.55, y: height * 0.5, radius: 40, color: 'rgba(0, 255, 100, 0.7)' }
            };

            for (const key in regions) {
                if (this.state.environment.regions[key].activation > 0.1) {
                    const region = regions[key];
                    const activation = this.state.environment.regions[key].activation;

                    ctx.save();
                    ctx.globalAlpha = activation;
                    ctx.fillStyle = region.color;
                    ctx.beginPath();
                    ctx.arc(region.x, region.y, region.radius, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            }
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
        }
    };

    window.GreenhouseModelsUIEnvironment = GreenhouseModelsUIEnvironment;
})();
