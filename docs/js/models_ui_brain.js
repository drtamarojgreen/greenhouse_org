
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

            // Enhancement #1: Gradient Activation
            // Use radial gradient fill for neurons that shifts dynamically to represent activation levels
            if (activation > 0 && element.shape === 'circle') {
                const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, element.radius);
                const colorBase = this.state.darkMode ? '255, 255, 204' : '255, 200, 50';
                gradient.addColorStop(0, `rgba(${colorBase}, ${0.5 + activation * 0.5})`);
                gradient.addColorStop(1, `rgba(${colorBase}, 0)`);
                ctx.fillStyle = gradient;
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
                case 'branch':
                    this._renderBranch(ctx, element.startX, element.startY, element.angle, element.length, element.depth);
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

        _renderBranch(ctx, startX, startY, angle, length, depth) {
            if (depth < 0) return;
            const endX = startX + Math.cos(angle) * length;
            const endY = startY + Math.sin(angle) * length;
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            this._renderBranch(ctx, endX, endY, angle - 0.5, length * 0.8, depth - 1);
            this._renderBranch(ctx, endX, endY, angle + 0.5, length * 0.8, depth - 1);
        },

        drawNetworkView() {
            const ctx = this.contexts.network;
            const canvas = this.canvases.network;
            if (!ctx || !this.state.brainData || !this.state.brainData.elements) return;

            const { width, height } = canvas;
            ctx.clearRect(0, 0, width, height);
            if (this.state.darkMode) {
                ctx.fillStyle = '#1A1A1A';
                ctx.fillRect(0, 0, width, height);
            }

            // Enhancement #5: Textured Backgrounds
            // Add subtle noise/grid texture for scientific aesthetic
            ctx.save();
            ctx.strokeStyle = this.state.darkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)';
            ctx.lineWidth = 1;
            const gridSize = 40;
            ctx.beginPath();
            for (let x = 0; x < width; x += gridSize) {
                ctx.moveTo(x, 0);
                ctx.lineTo(x, height);
            }
            for (let y = 0; y < height; y += gridSize) {
                ctx.moveTo(0, y);
                ctx.lineTo(width, y);
            }
            ctx.stroke();
            ctx.restore();

            // --- Direct Rendering for Background Tree ---
            /*
            const treeElement = this.state.brainData.elements.find(el => el.type === 'tree');
            if (treeElement) {
                ctx.save();
                if (treeElement.style) {
                    for (const [key, value] of Object.entries(treeElement.style)) {
                        ctx[key] = value;
                    }
                }
                ctx.beginPath();
                // Use absolute coordinates, but scale them to fit the canvas dimensions
                const treeScaleX = width / 1600; // Adjusted for larger coordinate space
                const treeScaleY = height / 1000;
                ctx.moveTo(treeElement.points[0].x * treeScaleX, treeElement.points[0].y * treeScaleY);
                for (let i = 1; i < treeElement.points.length; i++) {
                    ctx.lineTo(treeElement.points[i].x * treeScaleX, treeElement.points[i].y * treeScaleY);
                }
                ctx.closePath();
                if (ctx.fillStyle) ctx.fill();
                if (ctx.strokeStyle) ctx.stroke();
                ctx.restore();
            }
            */
            // --- End Direct Rendering ---

            const scaleX = width / 650;
            const scaleY = height / 350;

            const elementDefs = {};
            this.state.brainData.elements.forEach(el => {
                elementDefs[el.type] = el;
            });

            ctx.strokeStyle = this.state.darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(45, 62, 45, 0.3)';

            this.state.synapses.forEach(synapse => {
                const fromNode = this.state.networkLayout[synapse.from];
                const toNode = this.state.networkLayout[synapse.to];
                if (fromNode && toNode) {
                    ctx.beginPath();

                    // Enhancement #10: Variable Axon Thickness
                    // Vary line thickness based on weight (simulating myelination/strength)
                    const weight = synapse.weight || 1;
                    ctx.lineWidth = 1 + weight * 2;

                    // Enhancement #3: Organic Connections
                    // Use Bezier curves for synaptic connections instead of straight lines
                    const startX = fromNode.x * scaleX;
                    const startY = fromNode.y * scaleY;
                    const endX = toNode.x * scaleX;
                    const endY = toNode.y * scaleY;

                    const cx = (startX + endX) / 2 + (endY - startY) * 0.2;
                    const cy = (startY + endY) / 2 + (startX - endX) * 0.2;

                    // Enhancement #8: Heat Haze (Simulated)
                    // Add subtle jitter to control points if synapse is highly active
                    // Note: Simplified implementation as we don't have per-synapse activity history here,
                    // using fromNode activation as proxy.
                    if (fromNode.activation > 0.5) {
                         const jitter = (Math.random() - 0.5) * 5;
                         ctx.quadraticCurveTo(cx + jitter, cy + jitter, endX, endY);
                    } else {
                         ctx.quadraticCurveTo(cx, cy, endX, endY);
                    }

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

                // Enhancement #3: Organic Connections (Action Potentials follow curve)
                const t = ap.progress;
                const cx = (startX + endX) / 2 + (endY - startY) * 0.2;
                const cy = (startY + endY) / 2 + (startX - endX) * 0.2;

                // Quadratic Bezier point calculation
                const currentX = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * cx + t * t * endX;
                const currentY = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * cy + t * t * endY;

                ctx.fillStyle = this.state.darkMode ? 'rgba(255, 255, 204, 0.9)' : 'rgba(255, 255, 150, 0.9)';

                // Enhancement #4: Action Potential Glow
                // Add outer glow effects for firing neurons
                ctx.shadowColor = this.state.darkMode ? 'rgba(255, 255, 204, 1)' : 'rgba(255, 255, 0, 1)';
                ctx.shadowBlur = 15;

                ctx.beginPath();
                ctx.arc(currentX, currentY, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            });

            this.state.networkLayout.forEach(node => {

                // Enhancement #9: Ambient Occlusion (Approximated)
                // Draw subtle shadow/dark circle under nodes to simulate 3D volume/clusters
                ctx.beginPath();
                ctx.fillStyle = 'rgba(0,0,0,0.2)';
                ctx.arc(node.x * scaleX + 2, node.y * scaleY + 2, 14, 0, Math.PI * 2);
                ctx.fill();

                const elementDef = elementDefs[node.type];
                if (elementDef) {
                    const renderContext = {
                        x: node.x * scaleX,
                        y: node.y * scaleY,
                        activation: node.activation
                    };

                    // Enhancement #2: Depth Shadows
                    // Give nodes a slight lift to separate them from the background connections
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
                    ctx.shadowBlur = 5;
                    ctx.shadowOffsetX = 3;
                    ctx.shadowOffsetY = 3;

                    // Enhancement #6: Membrane Ripples
                    // Simulate electrostatic field fluctuations around active neurons (realistic bio-feedback)
                    if (node.activation > 0.1 && elementDef.shape === 'circle') {
                        const rippleSize = Math.sin(Date.now() / 200) * 2 * node.activation;

                         ctx.save();
                         ctx.translate(renderContext.x, renderContext.y);
                         ctx.beginPath();
                         // Gold/Yellow color to represent electrical activity/ions
                         ctx.strokeStyle = `rgba(255, 200, 50, ${node.activation * 0.5})`;
                         ctx.lineWidth = 2;
                         ctx.arc(0, 0, elementDef.radius + 2 + rippleSize, 0, Math.PI * 2);
                         ctx.stroke();
                         ctx.restore();
                    }

                    this._renderElement(ctx, elementDef, renderContext);

                    // Reset shadow for future draws
                    ctx.shadowColor = 'transparent';
                    ctx.shadowBlur = 0;
                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = 0;

                } else {
                    ctx.fillStyle = 'rgba(150, 150, 150, 0.7)';
                    ctx.beginPath();
                    ctx.arc(node.x * scaleX, node.y * scaleY, 12, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Enhancement #33: Voltage Labels
                // Display numerical values of membrane potential (activation) on nodes
                if (node.activation > 0.1) {
                    ctx.fillStyle = this.state.darkMode ? '#FFF' : '#000';
                    ctx.font = '10px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(node.activation.toFixed(2), node.x * scaleX, node.y * scaleY + 20);
                }
            });
        }
    };

    window.GreenhouseModelsUIBrain = GreenhouseModelsUIBrain;
})();
