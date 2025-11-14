
(function() {
    'use strict';

    const GreenhouseModelsUIBrain = {
        _renderElement(ctx, element, renderContext) {
            if (!element) return;

            const { x = 0, y = 0, activation = 0 } = renderContext;

            ctx.save();
            ctx.translate(x, y);

            if (element.style) {
                for (const [key, value] of Object.entries(element.style)) {
                    if (typeof value === 'string' && value.includes('rgba')) {
                        const parts = value.match(/(\d+(\.\d+)?)/g);
                        if (parts && parts.length === 4) {
                            const newAlpha = Math.min(1, parseFloat(parts[3]) + activation * 0.2);
                            ctx[key] = `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${newAlpha})`;
                        } else {
                            ctx[key] = value;
                        }
                    } else {
                        ctx[key] = value;
                    }
                }
            }

            switch (element.shape) {
                case 'polygon':
                    ctx.beginPath();
                    ctx.moveTo(element.points[0].x, element.points[0].y);
                    for (let i = 1; i < element.points.length; i++) {
                        ctx.lineTo(element.points[i].x, element.points[i].y);
                    }
                    ctx.closePath();
                    if (ctx.fillStyle) ctx.fill();
                    if (ctx.strokeStyle) ctx.stroke();
                    break;
                case 'circle':
                    ctx.beginPath();
                    ctx.arc(0, 0, element.radius, 0, Math.PI * 2);
                    if (ctx.fillStyle) ctx.fill();
                    if (ctx.strokeStyle) ctx.stroke();
                    break;
            }

            if (element.children) {
                ctx.beginPath();
                element.children.forEach(child => {
                    this._renderElement(ctx, child, { x: 0, y: 0, activation });
                });
                if (ctx.strokeStyle) ctx.stroke();
            }

            ctx.restore();
        },

        drawNetworkView() {
            const ctx = this.contexts.network;
            const canvas = this.canvases.network;
            if (!ctx || !this.state.brainData || !this.state.brainData.elements) return;

            const { width, height } = canvas;
            ctx.clearRect(0, 0, width, height);


            const scaleX = width / 650;
            const scaleY = height / 350;

            const elementDefs = {};
            this.state.brainData.elements.forEach(el => {
                if (el.type !== 'tree') {
                    elementDefs[el.type] = el;
                }
            });

            ctx.strokeStyle = 'rgba(45, 62, 45, 0.3)';
            ctx.lineWidth = 1;
            this.state.synapses.forEach(synapse => {
                const fromNode = this.state.networkLayout[synapse.from];
                const toNode = this.state.networkLayout[synapse.to];
                if (fromNode && toNode) {
                    ctx.beginPath();
                    ctx.moveTo(fromNode.x * scaleX, fromNode.y * scaleY);
                    ctx.lineTo(toNode.x * scaleX, toNode.y * scaleY);
                    ctx.stroke();
                }
            });

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

            this.state.networkLayout.forEach(node => {
                const elementDef = elementDefs[node.type];
                if (elementDef) {
                    const renderContext = {
                        x: node.x * scaleX,
                        y: node.y * scaleY,
                        activation: node.activation
                    };
                    this._renderElement(ctx, elementDef, renderContext);
                } else {
                    ctx.fillStyle = 'rgba(150, 150, 150, 0.7)';
                    ctx.beginPath();
                    ctx.arc(node.x * scaleX, node.y * scaleY, 10, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
        }
    };

    window.GreenhouseModelsUIBrain = GreenhouseModelsUIBrain;
})();
