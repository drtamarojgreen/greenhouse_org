
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

        _renderGeneExpression(ctx, node, x, y, scaleX, scaleY) {
            // Phase 3: DNA/Gene Expression Glow
            // Simulate gene expression (DNA) inside the soma
            // We use a simple glow effect or icon in the center

            // Only render if node has gene expression level > 0 (or we can simulate it based on activation history)
            // For now, let's say it's linked to `node.activation` or a specific state property
            // In the plan, we added `geneExpressionLevel` to node.

            const expression = node.geneExpressionLevel || (node.activation > 0.8 ? 1.0 : 0.0);

            if (expression > 0.1) {
                ctx.save();
                ctx.translate(x, y);

                // Pulsing core
                const pulse = Math.sin(Date.now() / 500) * 0.2 + 0.8;
                ctx.fillStyle = `rgba(100, 255, 218, ${expression * 0.6 * pulse})`;
                ctx.shadowColor = '#64ffda';
                ctx.shadowBlur = 10 * expression;

                // Draw a simple double helix representation (abstract: two intertwined sine waves or just a glowing nucleus)
                // Let's draw a glowing nucleus circle for simplicity at this scale
                ctx.beginPath();
                ctx.arc(0, 0, 5, 0, Math.PI * 2);
                ctx.fill();

                ctx.restore();
            }
        },

        _renderTranscriptionFactors(ctx, node, x, y) {
            // Phase 3: Transcription Factors
            // Particles moving towards the soma (retrograde transport)

            if (node.transcriptionFactors && node.transcriptionFactors > 0) {
                 // We would need to track particle positions.
                 // For now, let's just draw some static/jittering particles around the soma
                 ctx.save();
                 ctx.translate(x, y);
                 ctx.fillStyle = '#ff4081'; // Pinkish

                 for(let i=0; i < 3; i++) { // Arbitrary small number
                     const angle = Date.now() / 1000 + i * (Math.PI * 2 / 3);
                     const dist = 10 + Math.sin(Date.now() / 300 + i) * 2;

                     ctx.beginPath();
                     ctx.arc(Math.cos(angle) * dist, Math.sin(angle) * dist, 2, 0, Math.PI * 2);
                     ctx.fill();
                 }
                 ctx.restore();
            }
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
            // Add subtle grid texture for scientific aesthetic
            ctx.save();
            ctx.strokeStyle = this.state.darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
            ctx.lineWidth = 0.5;
            ctx.setLineDash([2, 2]); // Dashed lines for subtlety
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
                    // Add smooth, wave-like distortion to active connections instead of random jitter
                    if (fromNode.activation > 0.3) {
                         // Use time-based sine wave for organic pulsing/shimmer
                         const time = Date.now() / 300;
                         const wave = Math.sin(time + startX * 0.01) * 3 * fromNode.activation;
                         ctx.quadraticCurveTo(cx + wave, cy + wave, endX, endY);
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
                ctx.fillStyle = this.state.darkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)';
                // Centered, soft shadow
                ctx.arc(node.x * scaleX, node.y * scaleY + 2, 14, 0, Math.PI * 2);
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

                    // Phase 3: Render Gene Expression (DNA Glow)
                    this._renderGeneExpression(ctx, node, node.x * scaleX, node.y * scaleY);

                    // Phase 3: Render Transcription Factors
                    // For demo, we just trigger it if activation is high
                    if (node.activation > 0.5) {
                        node.transcriptionFactors = 1;
                    } else if (node.activation < 0.2) {
                        node.transcriptionFactors = 0;
                    }
                    this._renderTranscriptionFactors(ctx, node, node.x * scaleX, node.y * scaleY);


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

            });
        }
    };

    window.GreenhouseModelsUIBrain = GreenhouseModelsUIBrain;
})();
