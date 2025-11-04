
(function() {
    'use strict';

    const GreenhouseModelsUIBrain = {
        _drawBranch(ctx, startX, startY, angle, length, depth) {
            if (depth < 0) return;
            const endX = startX + Math.cos(angle) * length;
            const endY = startY + Math.sin(angle) * length;
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            this._drawBranch(ctx, endX, endY, angle - 0.5, length * 0.8, depth - 1);
            this._drawBranch(ctx, endX, endY, angle + 0.5, length * 0.8, depth - 1);
        },

        _drawPyramidalNeuron(ctx, node) {
            const { x, y, activation } = node;
            const radius = 12;

            // Soma
            ctx.fillStyle = `rgba(53, 116, 56, ${0.8 + activation * 0.2})`;
            ctx.beginPath();
            ctx.moveTo(x - radius, y + radius);
            ctx.lineTo(x + radius, y + radius);
            ctx.lineTo(x, y - radius * 1.5);
            ctx.closePath();
            ctx.fill();

            // Dendrites
            ctx.strokeStyle = `rgba(45, 62, 45, ${0.5 + activation * 0.2})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            this._drawBranch(ctx, x, y - radius * 1.5, -Math.PI / 2, 20, 2); // Apical
            this._drawBranch(ctx, x - radius, y + radius, Math.PI * 1.2, 15, 2); // Basal
            this._drawBranch(ctx, x + radius, y + radius, -Math.PI * 0.2, 15, 2); // Basal
            ctx.stroke();
        },

        _drawOligodendrocyte(ctx, node, allNodes) {
            const { x, y } = node;
            const radius = 8;

            // Soma
            ctx.fillStyle = 'rgba(100, 100, 150, 0.7)';
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();

            // Processes to nearby axons
            ctx.strokeStyle = 'rgba(100, 100, 150, 0.5)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            allNodes.forEach(targetNode => {
                if (targetNode.type === 'PYRAMIDAL') {
                    const dist = Math.hypot(x - targetNode.x, y - targetNode.y);
                    if (dist > 0 && dist < 100) {
                        ctx.moveTo(x, y);
                        ctx.lineTo(targetNode.x + 15, targetNode.y + 15);

                        // Myelin sheath
                        ctx.strokeStyle = 'rgba(100, 100, 150, 0.8)';
                        ctx.lineWidth = 4;
                        ctx.beginPath();
                        ctx.arc(targetNode.x + 20, targetNode.y + 20, 5, 0, Math.PI * 2);
                        ctx.stroke();
                        ctx.lineWidth = 1;
                        ctx.strokeStyle = 'rgba(100, 100, 150, 0.5)';
                    }
                }
            });
            ctx.stroke();
        },

        drawNetworkView() {
            const ctx = this.contexts.network;
            const canvas = this.canvases.network;
            if (!ctx) return;
            const { width, height } = canvas;
            ctx.clearRect(0, 0, width, height);

            const scaleX = width / 650;
            const scaleY = height / 350;

            // Draw connections
            ctx.strokeStyle = 'rgba(45, 62, 45, 0.3)';
            ctx.lineWidth = 1;
            this.state.synapses.forEach(synapse => {
                const fromNode = this.state.networkLayout[synapse.from];
                const toNode = this.state.networkLayout[synapse.to];
                ctx.beginPath();
                ctx.moveTo(fromNode.x * scaleX, fromNode.y * scaleY);
                ctx.lineTo(toNode.x * scaleX, toNode.y * scaleY);
                ctx.stroke();
            });

            // Draw action potentials
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

            // Draw neurons
            this.state.networkLayout.forEach(node => {
                const scaledNode = { ...node, x: node.x * scaleX, y: node.y * scaleY };
                switch (scaledNode.type) {
                    case 'PYRAMIDAL':
                        this._drawPyramidalNeuron(ctx, scaledNode);
                        break;
                    case 'OLIGODENDROCYTE':
                        this._drawOligodendrocyte(ctx, scaledNode, this.state.networkLayout.map(n => ({...n, x: n.x * scaleX, y: n.y * scaleY})));
                        break;
                    default:
                        // Default drawing for unknown types
                        ctx.fillStyle = 'rgba(150, 150, 150, 0.7)';
                        ctx.beginPath();
                        ctx.arc(scaledNode.x, scaledNode.y, 10, 0, Math.PI * 2);
                        ctx.fill();
                        break;
                }
            });
        }
    };

    window.GreenhouseModelsUIBrain = GreenhouseModelsUIBrain;
})();
