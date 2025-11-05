
(function() {
    'use strict';

    const GreenhouseModelsUIEnvironment = {
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

        _drawProfileAndBrain(ctx, width, height) {
            // --- Draw Profile Silhouette ---
            ctx.strokeStyle = 'rgba(45, 62, 45, 0.8)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(width * 0.45, height * 0.95); // Base of neck
            ctx.bezierCurveTo(width * 0.3, height * 0.9, width * 0.15, height * 0.6, width * 0.4, height * 0.2); // Neck to crown
            ctx.bezierCurveTo(width * 0.5, height * 0.05, width * 0.75, height * 0.1, width * 0.8, height * 0.3); // Forehead
            ctx.bezierCurveTo(width * 0.82, height * 0.4, width * 0.8, height * 0.45, width * 0.75, height * 0.5); // Nose
            ctx.lineTo(width * 0.7, height * 0.6); // Philtrum
            ctx.bezierCurveTo(width * 0.72, height * 0.65, width * 0.68, height * 0.7, width * 0.6, height * 0.75); // Chin
            ctx.lineTo(width * 0.55, height * 0.9); // Jawline
            ctx.closePath();
            ctx.stroke();

            // --- Draw Brain Shape ---
            ctx.fillStyle = 'rgba(214, 204, 224, 0.3)';
            ctx.beginPath();
            ctx.moveTo(width * 0.4, height * 0.25);
            ctx.bezierCurveTo(width * 0.3, height * 0.3, width * 0.35, height * 0.7, width * 0.5, height * 0.75); // Posterior
            ctx.bezierCurveTo(width * 0.7, height * 0.7, width * 0.8, height * 0.5, width * 0.7, height * 0.3); // Anterior
            ctx.closePath();
            ctx.fill();

            // --- Draw Brain Texture (Gyri/Sulci) ---
            ctx.strokeStyle = 'rgba(128, 118, 138, 0.4)';
            ctx.lineWidth = 1.5;
            for (let i = 0; i < 10; i++) {
                ctx.beginPath();
                const startY = height * 0.3 + i * 20;
                const startX = width * 0.4 + (i % 2) * 15;
                ctx.moveTo(startX, startY);
                const cp1x = startX + 30 + Math.sin(i) * 15;
                const cp1y = startY - 10;
                const cp2x = startX + 60 - Math.cos(i) * 20;
                const cp2y = startY + 15;
                const endX = startX + 90;
                ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, startY);
                ctx.stroke();
            }
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
            const ctx = this.contexts.environment;
            const { width, height } = this.canvases.environment;
            if (!ctx) return;
            ctx.clearRect(0, 0, width, height);

            this._drawEnvironmentBackground(ctx, width, height);
            this._drawProfileAndBrain(ctx, width, height);
            this._drawFactorVisuals(ctx, width, height);
        }
    };

    window.GreenhouseModelsUIEnvironment = GreenhouseModelsUIEnvironment;
})();
