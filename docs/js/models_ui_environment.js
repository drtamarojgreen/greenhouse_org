
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
            } else {
                this._loadBrainPath(() => {
                    this._drawBrainPath(ctx, width, height);
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

        _drawEnvironmentBackground(ctx, width, height) {
            const environmentState = this.state.environment.type;
            let gradient;
            if (environmentState === 'POSITIVE') {
                gradient = ctx.createLinearGradient(0, 0, width, height);
                gradient.addColorStop(0, 'rgba(173, 216, 230, 0.7)');
                gradient.addColorStop(1, 'rgba(144, 238, 144, 0.7)');
            } else {
                gradient = ctx.createLinearGradient(0, 0, width, height);
                gradient.addColorStop(0, 'rgba(128, 128, 128, 0.8)');
                gradient.addColorStop(1, 'rgba(255, 99, 71, 0.7)');
            }
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
        },

        _drawGenomes(ctx, width, height) {
            const geneticsActivation = this.state.environment.genetics > 0.5;
            const time = Date.now() / 1000;

            for (let i = 0; i < 5; i++) {
                ctx.save();
                const x = width * (0.1 + i * 0.15);
                const y = height * 0.1;
                ctx.translate(x, y);
                ctx.rotate(time * 0.5);

                ctx.globalAlpha = 0.6;
                ctx.fillStyle = geneticsActivation ? 'rgba(255, 255, 150, 0.9)' : 'rgba(200, 200, 255, 0.6)';

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
            const communitySupport = this.state.environment.community;
            const strongSupport = communitySupport > 0.6;
            ctx.save();
            ctx.strokeStyle = strongSupport ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 0, 0, 0.7)';
            ctx.lineWidth = strongSupport ? 2 : 0.5;

            const radius = Math.min(width, height) * 0.45;
            const nodes = 8;
            for (let i = 0; i < nodes; i++) {
                const angle1 = (i / nodes) * 2 * Math.PI;
                const x1 = (width / 2) + radius * Math.cos(angle1);
                const y1 = (height / 2) + radius * Math.sin(angle1);
                for (let j = i + 1; j < nodes; j++) {
                    const angle2 = (j / nodes) * 2 * Math.PI;
                    const x2 = (width / 2) + radius * Math.cos(angle2);
                    const y2 = (height / 2) + radius * Math.sin(angle2);
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
