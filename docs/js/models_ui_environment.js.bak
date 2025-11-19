
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
            this._drawGrid(ctx, width, height);
            this._drawSociety(ctx, width, height);
            this._drawGenomes(ctx, width, height);
            this._drawCommunity(ctx, width, height);
            this._drawInfluencePaths(ctx, width, height); // Draw the new paths

            if (this._brainPath) {
                this._drawBrainPath(ctx, width, height);
                this._drawHeatmaps(ctx, width, height);
            } else {
                this._loadBrainPath(() => {
                    this._drawBrainPath(ctx, width, height);
                    this._drawHeatmaps(ctx, width, height);
                });
            }

            this.drawTree(ctx, this.canvases.environment);
            this._drawLabels(ctx, width, height);
            this._drawLegend(ctx, width, height);
            this._drawTitle(ctx, width, height);
            this._drawMedication(ctx, width, height);
            this._drawTherapy(ctx, width, height);
            this._drawTooltip(ctx);

            // Signal to automated testing frameworks that the canvas has been rendered.
            window.renderingComplete = true;
        },

        _drawTherapy(ctx, width, height) {
            ctx.save();
            const therapyIcon = {
                x: width / 2 + 150,
                y: height / 2 + 100,
                radius: 20
            };

            // Two stylized figures in conversation
            const person1 = { x: therapyIcon.x - 10, y: therapyIcon.y };
            const person2 = { x: therapyIcon.x + 10, y: therapyIcon.y };

            ctx.fillStyle = 'rgba(150, 220, 150, 0.9)';
            ctx.strokeStyle = 'rgba(0, 100, 0, 1.0)';
            ctx.lineWidth = 2;

            // Person 1
            ctx.beginPath();
            ctx.arc(person1.x, person1.y - 5, 5, 0, Math.PI * 2); // Head
            ctx.moveTo(person1.x, person1.y);
            ctx.lineTo(person1.x, person1.y + 15); // Body
            ctx.stroke();

            // Person 2
            ctx.beginPath();
            ctx.arc(person2.x, person2.y - 5, 5, 0, Math.PI * 2); // Head
            ctx.moveTo(person2.x, person2.y);
            ctx.lineTo(person2.x, person2.y + 15); // Body
            ctx.stroke();

            const bgColor = this._getBackgroundColorComponents();
            ctx.fillStyle = this._getContrastingTextColor(bgColor);
            ctx.font = '12px "Helvetica Neue", Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Therapy', therapyIcon.x, therapyIcon.y + 35);

            ctx.restore();
        },

        _getBackgroundColorComponents() {
            const stress = this.state.environment.stress;
            let calmColor, stressColor;

            if (this.state.darkMode) {
                calmColor = { r: 25, g: 25, b: 112 };
                stressColor = { r: 139, g: 0, b: 0 };
            } else {
                calmColor = { r: 173, g: 216, b: 230 };
                stressColor = { r: 255, g: 99, b: 71 };
            }

            const r = calmColor.r + (stressColor.r - calmColor.r) * stress;
            const g = calmColor.g + (stressColor.g - calmColor.g) * stress;
            const b = calmColor.b + (stressColor.b - calmColor.b) * stress;

            return { r: r - 25, g: g - 25, b: b - 25 };
        },

        _getContrastingTextColor(backgroundColor) {
            const luminance = 0.299 * backgroundColor.r + 0.587 * backgroundColor.g + 0.114 * backgroundColor.b;
            return luminance > 128 ? 'rgba(0, 0, 0, 0.85)' : 'rgba(255, 255, 255, 0.9)';
        },

        _drawLabels(ctx, width, height) {
            ctx.save();
            const bgColor = this._getBackgroundColorComponents();
            ctx.fillStyle = this._getContrastingTextColor(bgColor);
            ctx.font = '16px "Helvetica Neue", Arial, sans-serif'; // Larger font
            ctx.textAlign = 'center';

            const gridX = width / 12;
            const gridY = height / 10;

            // Environmental Stress & Genetic Factors
            ctx.fillText('Environmental Stress', gridX * 6, gridY * 0.5);
            ctx.fillText('Genetic Factors', gridX * 6, gridY * 1);

            // Paths Labels
            const familyIcon = new Path2D('M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z');
            ctx.save();
            ctx.translate(gridX * 3 - 12, gridY * 3 - 12);
            ctx.fill(familyIcon);
            ctx.restore();

            const societyIcon = new Path2D('M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V18h14v-1.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V18h6v-1.5c0-2.33-4.67-3.5-7-3.5z');
            ctx.save();
            ctx.translate(gridX * 6 - 12, gridY * 4 - 12);
            ctx.fill(societyIcon);
            ctx.restore();

            ctx.fillText('Community', gridX * 9, gridY * 3);

            // Personal Growth
            ctx.fillText('Personal Growth', gridX * 6, gridY * 9);

            ctx.restore();
        },

        _drawTitle(ctx, width, height) {
            ctx.save();
            const bgColor = this._getBackgroundColorComponents();
            ctx.fillStyle = this._getContrastingTextColor(bgColor);
            ctx.textAlign = 'center';

            ctx.font = '24px "Helvetica Neue", Arial, sans-serif';
            ctx.fillText('Mental Health Environment', width / 2, 30);

            ctx.font = '14px "Helvetica Neue", Arial, sans-serif';
            const subtitle = 'An interactive model of influencing factors';
            const maxWidth = width * 0.9;
            const words = subtitle.split(' ');
            let line = '';
            let y = 50;

            for (let n = 0; n < words.length; n++) {
                const testLine = line + words[n] + ' ';
                const metrics = ctx.measureText(testLine);
                const testWidth = metrics.width;
                if (testWidth > maxWidth && n > 0) {
                    ctx.fillText(line, width / 2, y);
                    line = words[n] + ' ';
                    y += 18; // Line height
                } else {
                    line = testLine;
                }
            }
            ctx.fillText(line, width / 2, y);

            ctx.restore();
        },

        _drawLegend(ctx, width, height) {
            const legendItems = [
                { color: 'rgba(255, 159, 64, 0.8)', text: 'Family Influence' },
                { color: 'rgba(54, 162, 235, 0.8)', text: 'Societal Influence' },
                { color: 'rgba(75, 192, 192, 0.8)', text: 'Community Influence' }
            ];

            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(10, height - 80, 200, 70);

            ctx.fillStyle = 'white';
            ctx.font = '12px "Helvetica Neue", Arial, sans-serif';

            legendItems.forEach((item, index) => {
                ctx.fillStyle = item.color;
                ctx.fillRect(20, height - 70 + index * 20, 15, 15);
                ctx.fillStyle = 'white';
                ctx.fillText(item.text, 45, height - 58 + index * 20);
            });

            ctx.restore();
        },

        _drawGrid(ctx, width, height) {
            ctx.save();
            ctx.strokeStyle = 'rgba(0, 0, 255, 0.1)';
            ctx.lineWidth = 1;

            for (let x = 0; x < width; x += 20) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, height);
                ctx.stroke();
            }

            for (let y = 0; y < height; y += 20) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(width, y);
                ctx.stroke();
            }

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
            drawPath(width * 0.25, height * 0.35, width / 2, height * 0.6, 'rgba(255, 159, 64, 0.8)', 4);
            drawPath(width * 0.5, height * 0.45, width / 2, height * 0.6, 'rgba(54, 162, 235, 0.8)', 4);
            drawPath(width * 0.75, height * 0.35, width / 2, height * 0.6, 'rgba(75, 192, 192, 0.8)', 4);
        },

        _drawMedication(ctx, width, height) {
            ctx.save();
            const capsule = {
                x: width / 2 - 150,
                y: height / 2 + 100,
                width: 40,
                height: 20,
                radius: 10
            };

            ctx.beginPath();
            ctx.moveTo(capsule.x + capsule.radius, capsule.y);
            ctx.lineTo(capsule.x + capsule.width - capsule.radius, capsule.y);
            ctx.arc(capsule.x + capsule.width - capsule.radius, capsule.y + capsule.radius, capsule.radius, Math.PI * 1.5, Math.PI * 0.5, false);
            ctx.lineTo(capsule.x + capsule.radius, capsule.y + capsule.height);
            ctx.arc(capsule.x + capsule.radius, capsule.y + capsule.radius, capsule.radius, Math.PI * 0.5, Math.PI * 1.5, false);
            ctx.closePath();

            ctx.fillStyle = 'rgba(200, 200, 255, 0.9)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(0, 0, 100, 1.0)';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Add a highlight
            ctx.beginPath();
            ctx.moveTo(capsule.x + capsule.radius, capsule.y + 5);
            ctx.lineTo(capsule.x + capsule.width - capsule.radius, capsule.y + 5);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.lineWidth = 1;
            ctx.stroke();

            const bgColor = this._getBackgroundColorComponents();
            ctx.fillStyle = this._getContrastingTextColor(bgColor);
            ctx.font = '12px "Helvetica Neue", Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Medication', capsule.x + capsule.width / 2, capsule.y + capsule.height + 15);

            ctx.restore();
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

            ctx.fillStyle = 'rgba(150, 130, 110, 0.5)';
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
            let calmColor, stressColor;

            if (this.state.darkMode) {
                calmColor = { r: 25, g: 25, b: 112 }; // Midnight Blue
                stressColor = { r: 139, g: 0, b: 0 }; // Dark Red
            } else {
                calmColor = { r: 173, g: 216, b: 230 }; // Light Blue
                stressColor = { r: 255, g: 99, b: 71 }; // Tomato Red
            }

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
            const time = Date.now() / 500;
            const bases = ['A', 'T', 'C', 'G'];
            const numHelixes = 5;

            for (let i = 0; i < numHelixes; i++) {
                ctx.save();
                const x = width * (0.2 + i * 0.15);
                const y = height * 0.25;
                ctx.translate(x, y);

                const rotation = Math.sin(time + i) * 0.2;
                ctx.rotate(rotation);

                const activation = (genetics - 0.5) * 2;
                const color = `rgba(180, 180, 220, ${0.8 + activation * 0.2})`;
                ctx.strokeStyle = color;
                ctx.fillStyle = color;
                ctx.lineWidth = 3;

                // Draw double helix
                const helixWidth = 20;
                const helixHeight = 80;
                ctx.beginPath();
                for (let j = 0; j <= helixHeight; j++) {
                    const angle = j * 0.2 + time;
                    const hx1 = Math.cos(angle) * helixWidth;
                    const hy = j;
                    const hx2 = Math.cos(angle + Math.PI) * helixWidth;
                    if (j === 0) {
                        ctx.moveTo(hx1, hy);
                    } else {
                        ctx.lineTo(hx1, hy);
                    }
                }
                ctx.stroke();

                ctx.beginPath();
                for (let j = 0; j <= helixHeight; j++) {
                    const angle = j * 0.2 + time;
                    const hx = Math.cos(angle + Math.PI) * helixWidth;
                    const hy = j;
                    if (j === 0) {
                        ctx.moveTo(hx, hy);
                    } else {
                        ctx.lineTo(hx, hy);
                    }
                }
                ctx.stroke();

                // Draw rungs and bases
                ctx.lineWidth = 1.5;
                const contrastingColor = this.state.darkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)';
                ctx.fillStyle = contrastingColor;
                ctx.font = '10px Arial';
                ctx.textAlign = 'center';

                for (let j = 5; j < helixHeight; j += 10) {
                    const angle = j * 0.2 + time;
                    const x1 = Math.cos(angle) * helixWidth;
                    const x2 = Math.cos(angle + Math.PI) * helixWidth;
                    ctx.beginPath();
                    ctx.moveTo(x1, j);
                    ctx.lineTo(x2, j);
                    ctx.stroke();

                    const base = bases[(i + Math.floor(j / 10)) % bases.length];
                    ctx.save();
                    ctx.translate((x1 + x2) / 2, j);
                    ctx.rotate(-rotation);
                    ctx.fillText(base, 0, 3);
                    ctx.restore();
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
                { name: 'Emotional', icon: 'M12,2C6.5,2,2,6.5,2,12s4.5,10,10,10s10-4.5,10-10S17.5,2,12,2z M10.5,8h3c0.8,0,1.5,0.7,1.5,1.5S14.3,11,13.5,11h-3 c-0.8,0-1.5-0.7-1.5-1.5S9.7,8,10.5,8z M12,17.5c-3,0-5.5-2.5-5.5-5.5s2.5-5.5,5.5-5.5s5.5,2.5,5.5,5.5S15,17.5,12,17.5z' },
                { name: 'Spiritual', icon: 'M12,2l2.2,4.5L19,7.7l-4.5,4.4l1,4.9L12,14.5l-3.5,2.5l1-4.9l-4.5-4.4l4.8-1.2L12,2z' },
                { name: 'Intellectual', icon: 'M12,2C9.2,2,7,4.2,7,7c0,2.1,0.8,3.9,2.2,5.3L7,14.6V17h10v-2.4l-2.2-2.3C16.2,10.9,17,9.1,17,7C17,4.2,14.8,2,12,2z M9,19v-2h6v2H9z' },
                { name: 'Physical', icon: 'M12,5c1.7,0,3,1.3,3,3s-1.3,3-3,3s-3-1.3-3-3S10.3,5,12,5z M12,13c-3.3,0-6,2.7-6,6v1h12v-1C18,15.7,15.3,13,12,13z' },
                { name: 'Environmental', icon: 'M12,2c5.5,0,10,4.5,10,10s-4.5,10-10,10S2,17.5,2,12S6.5,2,12,2z M15.5,14h-7c-0.3,0-0.5-0.2-0.5-0.5v-7 C8,6.2,8.2,6,8.5,6h7C15.8,6,16,6.2,16,6.5v7C16,13.8,15.8,14,15.5,14z' },
                { name: 'Financial', icon: 'M12,2c5.5,0,10,4.5,10,10s-4.5,10-10,10S2,17.5,2,12S6.5,2,12,2z M12,16c-0.6,0-1-0.4-1-1v-1.5c-0.6,0-1,0.4-1,1 V15c0,1.7,1.3,3,3,3s3-1.3,3-3v-1.5c0-0.6-0.4-1-1-1V15C13,15.6,12.6,16,12,16z M11,10.5c-0.6,0-1,0.4-1,1V10c0-0.6,0.4-1,1-1s1,0.4,1,1v0.5 C12,10.1,11.6,10.5,11,10.5z' },
                { name: 'Occupational', icon: 'M10,2H4v16h16V8h-6V2z M8,8h8v2H8V8z M8,12h8v2H8v-2z M8,16h5v2H8v-2z' },
                { name: 'Social', icon: 'M17,7c1.1,0,2-0.9,2-2s-0.9-2-2-2s-2,0.9-2,2S15.9,7,17,7z M7,7c1.1,0,2-0.9,2-2s-0.9-2-2-2S5,5.9,5,7S5.9,7,7,7z M12,12 c1.7,0,3-1.3,3-3s-1.3-3-3-3s-3,1.3-3,3S10.3,12,12,12z M17,12c1.7,0,3-1.3,3-3s-1.3-3-3-3s-3,1.3-3,3S15.3,12,17,12z' }
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
                const scale = 3.0;
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

            let hoveredRegionKey = null;
            for (const key in this._brainRegions) {
                const region = this._brainRegions[key];

                const scale = Math.min(canvas.width / 1536, canvas.height / 1024) * 0.8;
                const offsetX = (canvas.width - (1536 * scale)) / 2;
                const offsetY = (canvas.height - (1024 * scale)) / 2;

                const transformedX = (x - offsetX) / scale;
                const transformedY = (y - offsetY) / scale;

                if (region.path && this.contexts.environment.isPointInPath(region.path, transformedX, transformedY)) {
                    hoveredRegionKey = key;
                    break;
                }
            }

            if (hoveredRegionKey) {
                const region = this._brainRegions[hoveredRegionKey];
                const activation = this.state.environment.regions[hoveredRegionKey].activation;
                this.state.environment.tooltip.visible = true;
                this.state.environment.tooltip.title = region.name;
                this.state.environment.tooltip.activation = `Activation: ${(activation * 100).toFixed(0)}%`;
                this.state.environment.tooltip.description = this.util.getRegionDescription(hoveredRegionKey);
                this.state.environment.tooltip.x = x;
                this.state.environment.tooltip.y = y;
            } else {
                this.state.environment.tooltip.visible = false;
            }
        },

        _drawTooltip(ctx) {
            const tooltip = this.state.environment.tooltip;
            if (tooltip.visible) {
                const { x, y, title, activation, description } = tooltip;
                const width = 220;
                const height = 100;
                const padding = 12;

                ctx.save();
                ctx.fillStyle = 'rgba(25, 25, 25, 0.85)';
                ctx.strokeStyle = 'rgba(200, 200, 200, 1)';
                ctx.lineWidth = 1;
                ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                ctx.shadowBlur = 8;
                ctx.shadowOffsetY = 4;

                ctx.beginPath();
                ctx.roundRect(x + 15, y + 15, width, height, 8);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = '#FFFFFF';
                ctx.font = 'bold 16px "Helvetica Neue", Arial, sans-serif';
                ctx.fillText(title, x + 15 + padding, y + 15 + padding + 8);

                ctx.font = '14px "Helvetica Neue", Arial, sans-serif';
                ctx.fillStyle = '#B0B0B0';
                ctx.fillText(activation, x + 15 + padding, y + 15 + padding + 32);

                ctx.fillStyle = '#E0E0E0';
                this.util.wrapText(ctx, description, x + 15 + padding, y + 15 + padding + 56, 196, 18);
                ctx.restore();
            }
        },

        TREE_BRANCH_DATA: [
            { cp1x: -7.5, cp1y: -2.5, cp2x: -22.5, cp2y: -7.5, angle: 0.35, length: 0.9 },
            { cp1x: 7.5, cp1y: -2.5, cp2x: 22.5, cp2y: -7.5, angle: -0.35, length: 0.9 },
            { cp1x: -6, cp1y: -2, cp2x: -18, cp2y: -6, angle: 0.3, length: 0.9 },
            { cp1x: 6, cp1y: -2, cp2x: 18, cp2y: -6, angle: -0.3, length: 0.9 },
            { cp1x: -4.5, cp1y: -1.5, cp2x: -13.5, cp2y: -4.5, angle: 0.25, length: 0.9 },
            { cp1x: 4.5, cp1y: -1.5, cp2x: 13.5, cp2y: -4.5, angle: -0.25, length: 0.9 },
            { cp1x: -3, cp1y: -1, cp2x: -9, cp2y: -3, angle: 0.2, length: 0.9 },
            { cp1x: 3, cp1y: -1, cp2x: 9, cp2y: -3, angle: -0.2, length: 0.9 }
        ],

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

            let branchDataIndex = 0;
            // Recursive function to draw branches
            const drawBranch = (x, y, width, length, angle) => {
                ctx.beginPath();
                ctx.moveTo(x, y);

                // Calculate the end point of the branch
                const endX = x + length * Math.cos(angle);
                const endY = y + length * Math.sin(angle);

                const data = this.TREE_BRANCH_DATA[branchDataIndex % this.TREE_BRANCH_DATA.length];
                branchDataIndex++;

                // Use static data for the curve for a consistent look
                const cp1x = x + (endX - x) * 0.25 + data.cp1x;
                const cp1y = y + (endY - y) * 0.25 + data.cp1y;
                const cp2x = x + (endX - x) * 0.75 + data.cp2x;
                const cp2y = y + (endY - y) * 0.75 + data.cp2y;

                ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
                ctx.lineWidth = width;
                ctx.stroke();

                // If the branch is thick enough, create more branches from it
                if (width > 2) {
                    const data1 = this.TREE_BRANCH_DATA[branchDataIndex % this.TREE_BRANCH_DATA.length];
                    branchDataIndex++;
                    const data2 = this.TREE_BRANCH_DATA[branchDataIndex % this.TREE_BRANCH_DATA.length];
                    branchDataIndex++;
                    // Create two new branches, spreading wider
                    drawBranch(endX, endY, width * 0.75, length * data1.length, angle + data1.angle);
                    drawBranch(endX, endY, width * 0.75, length * data2.length, angle - data2.angle);
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
