
(function() {
    'use strict';

    const GreenhouseModelsUIBrain = {
        drawNeuron(ctx, x, y, radius, activation = 0) {
            // Soma (cell body)
            const somaGradient = ctx.createRadialGradient(x - radius * 0.2, y - radius * 0.2, radius * 0.1, x, y, radius);
            somaGradient.addColorStop(0, 'rgba(150, 255, 150, 0.9)'); // Lighter center for 3D effect
            somaGradient.addColorStop(1, `rgba(53, 116, 56, ${0.8 + activation * 0.2})`); // Base color, brighter with activation

            ctx.fillStyle = somaGradient;
            ctx.shadowColor = `rgba(180, 255, 180, ${activation * 0.7})`;
            ctx.shadowBlur = 15 * activation;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0; // Reset shadow

            // Axon
            ctx.strokeStyle = `rgba(45, 62, 45, ${0.6 + activation * 0.3})`;
            ctx.lineWidth = 2 + activation * 2;
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.bezierCurveTo(x + radius * 2, y, x + radius * 2.5, y + radius * 1.5, x + radius * 3, y + radius * 3);
            ctx.stroke();

            // Dendrites
            const dendriteCount = 6;
            ctx.strokeStyle = `rgba(45, 62, 45, ${0.5 + activation * 0.2})`;
            ctx.lineWidth = 1.5;

            for (let i = 0; i < dendriteCount; i++) {
                const angle = (i / dendriteCount) * Math.PI * 1.5 - Math.PI * 0.75; // Only on one side
                const startLength = radius * (1.1 + Math.random() * 0.2);
                const endLength = radius * (1.5 + Math.random() * 0.5);

                const startX = x + Math.cos(angle) * startLength;
                const startY = y + Math.sin(angle) * startLength;
                const endX = x + Math.cos(angle - 0.1 + Math.random() * 0.2) * endLength;
                const endY = y + Math.sin(angle - 0.1 + Math.random() * 0.2) * endLength;

                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.quadraticCurveTo(
                    (startX + endX) / 2 + (Math.random() - 0.5) * 20,
                    (startY + endY) / 2 + (Math.random() - 0.5) * 20,
                    endX, endY
                );
                ctx.stroke();

                // Smaller branches
                const branchAngle = angle + (Math.random() - 0.5) * 0.5;
                const branchLength = endLength * 0.5;
                ctx.beginPath();
                ctx.moveTo(endX, endY);
                ctx.lineTo(
                    endX + Math.cos(branchAngle) * branchLength,
                    endY + Math.sin(branchAngle) * branchLength
                );
                ctx.stroke();
            }
        },

        drawNetworkView() {
            const ctx = this.contexts.network;
            const canvas = this.canvases.network;
            if (!ctx) return;
            const { width, height } = canvas;
            ctx.clearRect(0, 0, width, height);

            const scaleX = width / 650;
            const scaleY = height / 350;

            // Draw base connections
            ctx.strokeStyle = 'rgba(45, 62, 45, 0.3)'; // Dimmed base connections
            ctx.lineWidth = 1;
            for (let i = 0; i < this.state.networkLayout.length; i++) {
                for (let j = i + 1; j < this.state.networkLayout.length; j++) {
                    ctx.beginPath();
                    ctx.moveTo(this.state.networkLayout[i].x * scaleX, this.state.networkLayout[i].y * scaleY);
                    ctx.lineTo(this.state.networkLayout[j].x * scaleX, this.state.networkLayout[j].y * scaleY);
                    ctx.stroke();
                }
            }

            // Draw action potentials
            if (this.state.network.actionPotentials) {
                this.state.network.actionPotentials.forEach(ap => {
                    const fromNode = this.state.networkLayout[ap.from];
                    const toNode = this.state.networkLayout[ap.to];
                    const startX = fromNode.x * scaleX;
                    const startY = fromNode.y * scaleY;
                    const endX = toNode.x * scaleX;
                    const endY = toNode.y * scaleY;

                    const currentX = startX + (endX - startX) * ap.progress;
                    const currentY = startY + (endY - startY) * ap.progress;

                    ctx.fillStyle = 'rgba(255, 255, 150, 0.9)';
                    ctx.shadowColor = 'rgba(255, 255, 0, 1)';
                    ctx.shadowBlur = 15;
                    ctx.beginPath();
                    ctx.arc(currentX, currentY, 4, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                });
            }

            // Draw neurons
            this.state.networkLayout.forEach(node => {
                this.drawNeuron(ctx, node.x * scaleX, node.y * scaleY, 12, node.activation || 0);
            });
        }
    };

    window.GreenhouseModelsUIBrain = GreenhouseModelsUIBrain;
})();
