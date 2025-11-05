
(function() {
    'use strict';

    const GreenhouseModelsUIEnvironment = {
        _renderElement(ctx, element, { w, h }) {
            console.log('Rendering element:', element);
            if (!element) return;

            ctx.save();

            if (element.style) {
                for (const [key, value] of Object.entries(element.style)) {
                    ctx[key] = value;
                }
            }

            if (element.type === 'path') {
                const path = new Path2D(GreenhouseModelsUtil.parseDynamicPath(element.path, { w, h }));
                if(ctx.fillStyle) ctx.fill(path);
                if(ctx.strokeStyle) ctx.stroke(path);
            } else if (element.type === 'texture') {
                for (let i = 0; i < 10; i++) {
                    ctx.beginPath();
                    const startY = h * 0.3 + i * 20;
                    const startX = w * 0.4 + (i % 2) * 15;
                    ctx.moveTo(startX, startY);
                    const cp1x = startX + 30 + Math.sin(i) * 15;
                    const cp1y = startY - 10;
                    const cp2x = startX + 60 - Math.cos(i) * 20;
                    const cp2y = startY + 15;
                    const endX = startX + 90;
                    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, startY);
                    ctx.stroke();
                }
            }

            if (element.children) {
                element.children.forEach(child => this._renderElement(ctx, child, { w, h }));
            }

            ctx.restore();
        },

        _drawEnvironmentBackground(ctx, width, height) {
            let color = 'rgba(240, 240, 240, 0.5)'; // Neutral
            if (this.state.environment.type === 'POSITIVE') {
                color = 'rgba(230, 245, 230, 0.5)'; // Positive state
            } else if (this.state.environment.type === 'NEGATIVE') {
                color = 'rgba(235, 232, 240, 0.5)'; // Negative state
            }
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, width, height);
        },

        _drawFactorVisuals(ctx, width, height) {
            // --- Genetics (DNA Helix) ---
            const geneticsVal = this.state.environment.genetics;
            ctx.save();
            ctx.translate(width * 0.48, height * 0.7); // Position at brainstem
            ctx.lineWidth = 2;
            ctx.strokeStyle = `rgba(100, 180, 255, ${0.4 + geneticsVal * 0.6})`;

            for (let i = 0; i < 20; i++) {
                const angle = i * 0.5;
                const x = Math.sin(angle) * 10;
                const y = -i * 5;
                const x2 = Math.sin(angle + Math.PI) * 10;

                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x2, y);
                ctx.stroke();
            }
            ctx.restore();

            // --- Community/Society (Incoming Pulse) ---
            const communityVal = this.state.environment.community;
            if (communityVal > 0.1) {
                const pulseProgress = (Date.now() % 2000) / 2000;
                const radius = pulseProgress * 50;
                const alpha = (1 - pulseProgress) * communityVal;
                ctx.strokeStyle = `rgba(255, 255, 150, ${alpha})`;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(width * 0.85, height * 0.35, radius, Math.PI * 0.5, Math.PI * 1.5);
                ctx.stroke();
            }
        },

        drawEnvironmentView() {
            console.log('drawEnvironmentView called');
            const ctx = this.contexts.environment;
            const { width, height } = this.canvases.environment;
            if (!ctx || !this.state.environmentData || !this.state.environmentData.elements) {
                console.log('drawEnvironmentView returned early');
                return;
            }

            ctx.clearRect(0, 0, width, height);

            this._drawEnvironmentBackground(ctx, width, height);

            const renderContext = { w: width, h: height };
            this.state.environmentData.elements.forEach(element => {
                this._renderElement(ctx, element, renderContext);
            });

            this._drawFactorVisuals(ctx, width, height);
        }
    };

    window.GreenhouseModelsUIEnvironment = GreenhouseModelsUIEnvironment;
})();
