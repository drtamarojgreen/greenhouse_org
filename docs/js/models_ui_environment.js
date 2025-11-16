
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
            this._drawInfluencePaths(ctx, width, height); // Draw the new paths

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
            this._drawLabels(ctx, width, height);
            this._drawTooltip(ctx);
        },

        _drawLabels(ctx, width, height) {
            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.font = '16px "Helvetica Neue", Arial, sans-serif'; // Larger font
            ctx.textAlign = 'center';

            // Environmental Stress & Genetic Factors
            ctx.fillText('Environmental Stress', width / 2, 35);
            ctx.fillText('Genetic Factors', width / 2, 85);

            // Paths Labels
            ctx.fillText('Family', width * 0.25, height * 0.3);
            ctx.fillText('Society', width * 0.5, height * 0.4);
            ctx.fillText('Community', width * 0.75, height * 0.3);

            // Personal Growth
            ctx.fillText('Personal Growth', width / 2, height - 120);

            ctx.restore();
        },

        _drawInfluencePaths(ctx, width, height) {
            const drawPath = (startX, startY, endX, endY, color, lineWidth) => {
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.bezierCurveTo(
                    startX, startY + 50,
                    endX, endY - 80,
                    endX, endY
                );
                ctx.strokeStyle = color;
                ctx.lineWidth = lineWidth;
                ctx.stroke();
            };

            // Paths from environment elements to the brain/tree area
            drawPath(width * 0.25, height * 0.35, width / 2, height * 0.6, 'rgba(255, 159, 64, 0.8)', 3);
            drawPath(width * 0.5, height * 0.45, width / 2, height * 0.6, 'rgba(54, 162, 235, 0.8)', 3);
            drawPath(width * 0.75, height * 0.35, width / 2, height * 0.6, 'rgba(75, 192, 192, 0.8)', 3);
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
            const bases = ['A', 'U', 'C', 'G', 'C', 'G', 'A', 'U']; // Added DNA bases array
            const numHelixes = 5;
            const helixSpacing = width / (numHelixes + 1); // Dynamic spacing

            for (let i = 0; i < numHelixes; i++) {
                ctx.save();
                // Centered the helices by adjusting x and y coordinates
                const x = width * (0.2 + i * 0.15);
                const y = height * 0.3;

                // Added 3D rotation effect on the x-axis
                const rotationTime = time * 1.5 + i;
                const perspective = Math.cos(rotationTime) * 0.4 + 0.6; // Scale for 3D effect
                const shiftX = Math.sin(rotationTime) * 20;

                ctx.translate(x + shiftX, y);
                ctx.scale(1, perspective); // Apply perspective scaling on y-axis for x-axis rotation

                const activation = (genetics - 0.5) * 2;
                const color = activation > 0 ? `rgba(255, 255, 180, ${0.9 + activation * 0.1})` : `rgba(210, 210, 255, 0.9)`;

                ctx.globalAlpha = 0.85 + Math.abs(activation) * 0.15;
                ctx.fillStyle = color;

                // Draw the helix structure
                ctx.beginPath();
                ctx.moveTo(-12, -35);
                ctx.bezierCurveTo(35, -12, -35, 12, 12, 35);
                ctx.moveTo(12, -35);
                ctx.bezierCurveTo(-35, -12, 35, 12, -12, 35);
                ctx.lineWidth = 5; // Thicker lines
                ctx.strokeStyle = ctx.fillStyle;
                ctx.stroke();

                // Draw DNA bases and rungs
                if (perspective > 0.4) { // Only draw when not too flat
                    ctx.font = '12px Arial';
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 1.5;

                    const numRungs = 8;
                    for (let j = 0; j < numRungs; j++) {
                        const progress = (j + 0.5) / numRungs;
                        const yPos = -helixHeight + (progress * helixHeight * 2);

                        const curveX = Math.cos(progress * Math.PI - Math.PI / 2) * 10;

                        ctx.beginPath();
                        ctx.moveTo(-curveX, yPos);
                        ctx.lineTo(curveX, yPos);
                        ctx.stroke();

                        const base = bases[(i + j) % bases.length];
                        ctx.save();
                        ctx.scale(1, 1 / perspective); // un-scale the text on the y-axis
                        ctx.textAlign = 'center';
                        ctx.fillText(base, 0, yPos);
                        ctx.restore();
                    }
                }
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
            ctx.lineWidth = 1 + support * 2;

            const radius = Math.min(width, height) * 0.35; // a bit smaller to fit labels
            const nodes = 8;
            const distortion = (1 - support) * 10;
            const centerX = width / 2;
            const centerY = height / 2;

            const wellnessDimensions = [
                { name: 'Emotional', icon: 'M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1.5 6h3a1.5 1.5 0 010 3h-3a1.5 1.5 0 010-3zm1.5 10a5.5 5.5 0 110-11 5.5 5.5 0 010 11z' },
                { name: 'Spiritual', icon: 'M12 2l2.245 4.545L19 7.727l-4.5 4.382L15.49 17 12 14.545 8.51 17l.99-4.891L5 7.727l4.755-1.182L12 2z' },
                { name: 'Intellectual', icon: 'M12 2a5 5 0 00-5 5c0 2.08.847 3.963 2.209 5.291L7 14.582V17h10v-2.418l-2.209-2.291A4.992 4.992 0 0017 7a5 5 0 00-5-5zm-3 17v-2h6v2H9z' },
                { name: 'Physical', icon: 'M12 5a3 3 0 110 6 3 3 0 010-6zm0 8c-3.314 0-6 2.686-6 6v1h12v-1c0-3.314-2.686-6-6-6z' },
                { name: 'Environmental', icon: 'M12 2a10 10 0 00-10 10c0 5.523 4.477 10 10 10s10-4.477 10-10A10 10 0 0012 2zm3.5 12h-7a.5.5 0 01-.5-.5v-7a.5.5 0 01.5-.5h7a.5.5 0 01.5.5v7a.5.5 0 01-.5.5z' },
                { name: 'Financial', icon: 'M12 2a10 10 0 100 20 10 10 0 000-20zm0 14a1 1 0 01-1-1v-1.5a.5.5 0 00-1 0V15a3 3 0 106 0v-1.5a.5.5 0 00-1 0V15a1 1 0 01-1 1zm-1-5.5a.5.5 0 00-1 0V10a1 1 0 112 0v-.5a.5.5 0 00-1 0z' },
                { name: 'Occupational', icon: 'M10 2H4v16h16V8h-6V2zM8 8h8v2H8V8zm0 4h8v2H8v-2zm0 4h5v2H8v-2z' },
                { name: 'Social', icon: 'M17 7a2 2 0 10-4 0 2 2 0 004 0zM7 7a2 2 0 10-4 0 2 2 0 004 0zM12 12a3 3 0 10-6 0 3 3 0 006 0zM17 12a3 3 0 10-6 0 3 3 0 006 0z' }
            ];

            const vertices = [];
            for (let i = 0; i < nodes; i++) {
                const angle = (i / nodes) * 2 * Math.PI;
                const x = centerX + radius * Math.cos(angle) + (Math.random() - 0.5) * distortion;
                const y = centerY + radius * Math.sin(angle) + (Math.random() - 0.5) * distortion;
                vertices.push({ x, y });
            }

            // Draw the octagon
            ctx.beginPath();
            ctx.moveTo(vertices[0].x, vertices[0].y);
            for (let i = 1; i < nodes; i++) {
                ctx.lineTo(vertices[i].x, vertices[i].y);
            }
            ctx.closePath();
            ctx.stroke();

            // Draw labels and icons
            ctx.fillStyle = color;
            ctx.font = '12px "Helvetica Neue", Arial, sans-serif';
            for (let i = 0; i < nodes; i++) {
                const vertex = vertices[i];
                const dimension = wellnessDimensions[i];
                const angle = (i / nodes) * 2 * Math.PI;

                // Adjust label position to be outside the octagon
                const labelRadius = radius + 30;
                const labelX = centerX + labelRadius * Math.cos(angle);
                const labelY = centerY + labelRadius * Math.sin(angle);

                // Adjust text alignment based on position
                if (Math.abs(labelX - centerX) < radius * 0.3) {
                    ctx.textAlign = 'center';
                } else if (labelX < centerX) {
                    ctx.textAlign = 'right';
                } else {
                    ctx.textAlign = 'left';
                }

                // Vertical alignment
                if (Math.abs(labelY - centerY) < radius * 0.3) {
                    ctx.textBaseline = 'middle';
                } else if (labelY < centerY) {
                    ctx.textBaseline = 'bottom';
                } else {
                    ctx.textBaseline = 'top';
                }

                ctx.fillText(dimension.name, labelX, labelY);

                // Draw the icon
                const iconPath = new Path2D(dimension.icon);
                const iconSize = 24; // Icon viewport size
                const scale = 0.75;
                const scaledSize = iconSize * scale;
                const iconX = vertex.x - scaledSize / 2;
                const iconY = vertex.y - scaledSize / 2;

                ctx.save();
                ctx.translate(iconX, iconY);
                ctx.scale(scale, scale);
                ctx.fill(iconPath);
                ctx.restore();
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
            ctx.fillStyle = '#2e6b2e'; // Dark green for the tree
            ctx.strokeStyle = '#2e6b2e';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';

            const startX = width / 2;
            const startY = height;
            const trunkHeight = height * 0.3;
            const trunkWidth = 25; // A slightly thicker trunk

            // Draw the main trunk of the tree
            ctx.beginPath();
            ctx.moveTo(startX - trunkWidth / 2, startY);
            ctx.lineTo(startX - trunkWidth / 2, startY - trunkHeight);
            ctx.lineTo(startX + trunkWidth / 2, startY - trunkHeight);
            ctx.lineTo(startX + trunkWidth / 2, startY);
            ctx.fill();

            // Recursive function to draw branches
            const drawBranch = (x, y, width, length, angle) => {
                ctx.beginPath();
                ctx.moveTo(x, y);

                // Calculate the end point of the branch
                const endX = x + length * Math.cos(angle);
                const endY = y + length * Math.sin(angle);

                // Add some randomness to the curve for a more organic look
                const cp1x = x + (endX - x) * 0.25 + (Math.random() - 0.5) * 30;
                const cp1y = y + (endY - y) * 0.25 + (Math.random() - 0.5) * 30;
                const cp2x = x + (endX - x) * 0.75 + (Math.random() - 0.5) * 30;
                const cp2y = y + (endY - y) * 0.75 + (Math.random() - 0.5) * 30;

                ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
                ctx.lineWidth = width;
                ctx.stroke();

                // If the branch is thick enough, create more branches from it
                if (width > 2) {
                    // Create two new branches, spreading wider
                    drawBranch(endX, endY, width * 0.75, length * 0.9, angle + Math.random() * 0.8 - 0.4);
                    drawBranch(endX, endY, width * 0.75, length * 0.9, angle - Math.random() * 0.8 - 0.4);
                }
            };

            const branchStartY = startY - trunkHeight;
            // Initial branches starting from the top of the trunk
            drawBranch(startX, branchStartY, 12, 80, -Math.PI / 2); // Main upward branch
            drawBranch(startX, branchStartY, 9, 70, -Math.PI / 2 - 0.9); // Wider left branch
            drawBranch(startX, branchStartY, 9, 70, -Math.PI / 2 + 0.9); // Wider right branch
            drawBranch(startX, branchStartY - 25, 6, 60, -Math.PI / 2 - 1.5); // Far left branch
            drawBranch(startX, branchStartY - 25, 6, 60, -Math.PI / 2 + 1.5); // Far right branch

            ctx.restore();
        },
    };

    window.GreenhouseModelsUIEnvironment = GreenhouseModelsUIEnvironment;
})();
