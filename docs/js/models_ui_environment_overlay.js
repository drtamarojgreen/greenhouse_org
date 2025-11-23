(function () {
    'use strict';

    const GreenhouseModelsUIEnvironmentOverlay = {
        overlays: [],
        state: null,

        // Cycle State
        overlayKeys: [],
        currentIndex: 0,
        lastSwitchTime: 0,
        CYCLE_INTERVAL: 5000, // 5 seconds
        cycleTimer: null,
        animationFrameId: null,

        // Content Library
        library: {
            dna_structure: {
                id: 'dna_structure',
                metaphor: 'Spaghetti Noodle',
                concept: 'DNA Structure',
                text: 'DNA is like a super long, tightly packed spaghetti noodle wrapping around histone "spools".',
            },
            histones: {
                id: 'histones',
                metaphor: 'Spools',
                concept: 'Histones',
                text: 'Histones are spools that DNA wraps around. They determine if genes are accessible.',
            },
            acetylation: {
                id: 'acetylation',
                metaphor: 'Opening the Curtains',
                concept: 'Acetylation',
                text: 'Acetylation relaxes the chromatin, allowing genes to be read.',
            },
            methylation: {
                id: 'methylation',
                metaphor: 'Closing the Curtains',
                concept: 'Methylation',
                text: 'Methylation tightens the chromatin, silencing genes.',
            },
            cityscape: {
                id: 'cityscape',
                metaphor: 'Bustling City',
                concept: 'The Brain',
                text: 'Your brain is a bustling city with billions of neuron workers.',
            },
            pfc: {
                id: 'pfc',
                metaphor: 'Chief Decision-Maker',
                concept: 'Prefrontal Cortex',
                text: 'The CEO of the brain city, handling big decisions and planning.',
                targetRegion: 'pfc'
            },
            amygdala: {
                id: 'amygdala',
                metaphor: 'Alarm System',
                concept: 'Amygdala',
                text: 'The city\'s alarm system, constantly scanning for danger.',
                targetRegion: 'amygdala'
            },
            stress: {
                id: 'stress',
                metaphor: 'The Storm',
                concept: 'Chronic Stress',
                text: 'Stress is like a storm that weathers the city infrastructure.',
            },
            therapy: {
                id: 'therapy',
                metaphor: 'Rewiring',
                concept: 'Psychotherapy',
                text: 'Therapy helps rewire the brain\'s emotional circuits.',
            }
        },

        // Custom Renderers
        renderers: {
            dna_structure: (ctx, x, y) => {
                ctx.strokeStyle = '#FFD700';
                ctx.lineWidth = 4;
                ctx.beginPath();
                // Draw a chaotic noodle shape
                ctx.moveTo(x, y);
                ctx.bezierCurveTo(x + 20, y - 30, x + 40, y + 30, x + 60, y);
                ctx.bezierCurveTo(x + 80, y - 40, x + 20, y - 50, x + 40, y - 20);
                ctx.stroke();
            },
            histones: (ctx, x, y) => {
                ctx.fillStyle = '#8B4513';
                // Draw stylized spool
                ctx.fillRect(x, y - 15, 40, 30);
                ctx.fillStyle = '#D2691E';
                ctx.beginPath();
                ctx.ellipse(x, y, 5, 15, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.ellipse(x + 40, y, 5, 15, 0, 0, Math.PI * 2);
                ctx.fill();
                // Wrapped DNA thread
                ctx.strokeStyle = '#FFD700';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(x, y - 10);
                ctx.lineTo(x + 40, y - 10);
                ctx.moveTo(x, y + 10);
                ctx.lineTo(x + 40, y + 10);
                ctx.stroke();
            },
            acetylation: (ctx, x, y) => {
                // Draw open curtains
                ctx.fillStyle = '#90EE90';
                ctx.beginPath();
                ctx.moveTo(x, y - 30);
                ctx.quadraticCurveTo(x + 10, y, x - 20, y + 30);
                ctx.lineTo(x - 30, y + 30);
                ctx.lineTo(x - 30, y - 30);
                ctx.fill();

                ctx.beginPath();
                ctx.moveTo(x + 40, y - 30);
                ctx.quadraticCurveTo(x + 30, y, x + 60, y + 30);
                ctx.lineTo(x + 70, y + 30);
                ctx.lineTo(x + 70, y - 30);
                ctx.fill();

                // "Light" coming through
                ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
                ctx.fillRect(x - 10, y - 30, 60, 60);
            },
            methylation: (ctx, x, y) => {
                // Draw closed curtains
                ctx.fillStyle = '#CD5C5C';
                ctx.fillRect(x - 20, y - 30, 40, 60);
                ctx.fillRect(x + 20, y - 30, 40, 60);
                ctx.strokeStyle = '#333';
                ctx.beginPath();
                ctx.moveTo(x + 20, y - 30);
                ctx.lineTo(x + 20, y + 30);
                ctx.stroke();
            },
            cityscape: (ctx, x, y) => {
                ctx.fillStyle = '#708090';
                ctx.fillRect(x, y, 20, 40);
                ctx.fillRect(x + 25, y - 10, 15, 50);
                ctx.fillRect(x + 45, y + 10, 20, 30);
                // Windows
                ctx.fillStyle = '#FFF';
                ctx.fillRect(x + 5, y + 5, 5, 5);
                ctx.fillRect(x + 30, y + 5, 5, 5);
            },
            stress: (ctx, x, y) => {
                // Storm cloud
                ctx.fillStyle = '#555';
                ctx.beginPath();
                ctx.arc(x + 10, y, 15, 0, Math.PI * 2);
                ctx.arc(x + 30, y - 10, 20, 0, Math.PI * 2);
                ctx.arc(x + 50, y, 15, 0, Math.PI * 2);
                ctx.fill();
                // Lightning
                ctx.strokeStyle = '#FFD700';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(x + 30, y + 10);
                ctx.lineTo(x + 20, y + 30);
                ctx.lineTo(x + 35, y + 30);
                ctx.lineTo(x + 25, y + 50);
                ctx.stroke();
            },
            therapy: (ctx, x, y) => {
                // Rewiring arrows
                ctx.strokeStyle = '#32CD32';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(x + 30, y + 20, 20, 0, Math.PI * 1.5);
                ctx.stroke();
                // Arrowhead
                ctx.beginPath();
                ctx.moveTo(x + 50, y + 20);
                ctx.lineTo(x + 60, y + 15);
                ctx.lineTo(x + 50, y + 10);
                ctx.fill();
            },
            pfc: (ctx, x, y) => {
                // Badge icon
                ctx.fillStyle = '#4169E1';
                ctx.beginPath();
                ctx.moveTo(x + 20, y);
                ctx.lineTo(x + 40, y + 15);
                ctx.lineTo(x + 35, y + 40);
                ctx.lineTo(x + 5, y + 40);
                ctx.lineTo(x, y + 15);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = '#FFF';
                ctx.font = 'bold 12px Arial';
                ctx.fillText('CEO', x + 8, y + 25);
            },
            amygdala: (ctx, x, y) => {
                // Alarm bell
                ctx.fillStyle = '#FF4500';
                ctx.beginPath();
                ctx.arc(x + 25, y + 20, 20, Math.PI, 0);
                ctx.lineTo(x + 45, y + 20);
                ctx.lineTo(x + 5, y + 20);
                ctx.fill();
                ctx.beginPath(); // Clapper
                ctx.arc(x + 25, y + 20, 5, 0, Math.PI * 2);
                ctx.fill();
            }
        },

        init(state) {
            this.destroy();
            this.state = state;
            this.overlayKeys = Object.keys(this.library);
            this.lastSwitchTime = Date.now();
            this.currentIndex = 0;
            this._cycleOverlay();
            this.cycleTimer = setInterval(() => { this._updateCycle(); }, 1000);
        },

        destroy() {
            if (this.cycleTimer) { clearInterval(this.cycleTimer); this.cycleTimer = null; }
            if (this.animationFrameId) { cancelAnimationFrame(this.animationFrameId); this.animationFrameId = null; }
        },

        drawOverlays(ctx, width, height) {
            if (!this.state) return;
            this.overlays.forEach(overlay => {
                this._drawOverlayItem(ctx, overlay);
            });
        },

        _updateCycle() {
            const now = Date.now();
            if (now - this.lastSwitchTime > this.CYCLE_INTERVAL) {
                console.log('Cycling overlay...');
                this.currentIndex = (this.currentIndex + 1) % this.overlayKeys.length;
                this._cycleOverlay();
                this.lastSwitchTime = now;
            }
        },

        _cycleOverlay() {
            this.overlays = [];
            const nextId = this.overlayKeys[this.currentIndex];
            this.triggerOverlay(nextId);
            this._animateFadeIn();
        },

        _animateFadeIn() {
            if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
            const animate = () => {
                let needsRedraw = false;
                this.overlays.forEach(overlay => {
                    if (overlay.opacity < overlay.targetOpacity) {
                        overlay.opacity += 0.05;
                        if (overlay.opacity > overlay.targetOpacity) overlay.opacity = overlay.targetOpacity;
                        needsRedraw = true;
                    }
                });
                if (needsRedraw) {
                    if (window.GreenhouseModelsUI && window.GreenhouseModelsUI.drawEnvironmentView) {
                        window.GreenhouseModelsUI.drawEnvironmentView();
                    }
                    this.animationFrameId = requestAnimationFrame(animate);
                } else {
                    this.animationFrameId = null;
                }
            };
            animate();
        },

        triggerOverlay(id) {
            if (!this.library[id]) return;
            if (this.overlays.find(o => o.id === id)) return;

            const item = this.library[id];
            const position = this._getPositionForTarget(item.targetRegion || 'center', item.id);

            this.overlays.push({
                ...item,
                x: position.x,
                y: position.y,
                opacity: 0,
                targetOpacity: 1
            });
        },

        _getPositionForTarget(target, id) {
            const positions = {
                dna_structure: { x: 100, y: 150 },
                histones: { x: 200, y: 150 },
                acetylation: { x: 300, y: 150 },
                methylation: { x: 400, y: 150 },
                cityscape: { x: 600, y: 150 },
                stress: { x: 700, y: 150 },
                therapy: { x: 500, y: 350 },
                pfc: { x: 300, y: 300 },     // Approximate brain positions
                amygdala: { x: 400, y: 400 }
            };
            return positions[id] || { x: 500, y: 100 };
        },

        _drawOverlayItem(ctx, item) {
            ctx.save();
            ctx.globalAlpha = item.opacity;

            // 1. Draw Highlight on Brain Region if applicable
            if (item.targetRegion && window.GreenhouseModelsUIEnvironment && window.GreenhouseModelsUIEnvironment._brainRegions) {
                const region = window.GreenhouseModelsUIEnvironment._brainRegions[item.targetRegion];
                if (region && region.path) {
                    ctx.save();
                    // Re-apply the brain transform logic (hardcoded to match models_ui_environment.js)
                    // This is tricky because we need the exact transform state.
                    // Instead of trying to replicate the transform, we will rely on the position map being
                    // roughly correct and just draw a connecting line if possible, OR
                    // we assume the transform is complex and just draw the overlay graphic.
                    // Since we can't easily access the transform stack here, we'll skip the *exact* path highlight
                    // inside this overlay loop and instead draw a "Target" indicator at the coordinate.

                    // Draw target circle indicator
                    ctx.beginPath();
                    ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
                    ctx.lineWidth = 3;
                    ctx.arc(item.x, item.y, 40, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.restore();
                }
            }

            const boxX = item.x + 60;
            const boxY = item.y;
            const boxWidth = 280;
            const boxHeight = 140;
            const cornerRadius = 10;

            // 2. Draw Connecting Line
            ctx.beginPath();
            ctx.moveTo(item.x, item.y);
            ctx.lineTo(boxX, boxY + boxHeight / 2);
            ctx.strokeStyle = 'rgba(53, 116, 56, 0.5)';
            ctx.lineWidth = 2;
            ctx.stroke();

            // 3. Draw Bubble Background
            ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
            ctx.strokeStyle = '#357438';
            ctx.lineWidth = 2;
            ctx.shadowColor = 'rgba(0,0,0,0.2)';
            ctx.shadowBlur = 10;

            ctx.beginPath();
            ctx.moveTo(boxX + cornerRadius, boxY);
            ctx.lineTo(boxX + boxWidth - cornerRadius, boxY);
            ctx.arcTo(boxX + boxWidth, boxY, boxX + boxWidth, boxY + cornerRadius, cornerRadius);
            ctx.lineTo(boxX + boxWidth, boxY + boxHeight - cornerRadius);
            ctx.arcTo(boxX + boxWidth, boxY + boxHeight, boxX + boxWidth - cornerRadius, boxY + boxHeight, cornerRadius);
            ctx.lineTo(boxX + cornerRadius, boxY + boxHeight);
            ctx.arcTo(boxX, boxY + boxHeight, boxX, boxY + boxHeight - cornerRadius, cornerRadius);
            ctx.lineTo(boxX, boxY + cornerRadius);
            ctx.arcTo(boxX, boxY, boxX + cornerRadius, boxY, cornerRadius);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // 4. Render Custom Graphic
            if (this.renderers[item.id]) {
                ctx.save();
                this.renderers[item.id](ctx, boxX + 20, boxY + 25);
                ctx.restore();
            }

            // 5. Draw Text
            ctx.fillStyle = '#357438';
            ctx.font = 'bold 14px "Helvetica Neue", Arial, sans-serif';
            ctx.fillText(item.metaphor, boxX + 80, boxY + 25);

            ctx.fillStyle = '#666';
            ctx.font = 'italic 12px "Helvetica Neue", Arial, sans-serif';
            ctx.fillText(`(${item.concept})`, boxX + 80, boxY + 42);

            ctx.fillStyle = '#333';
            ctx.font = '12px "Helvetica Neue", Arial, sans-serif';
            this._wrapText(ctx, item.text, boxX + 15, boxY + 65, boxWidth - 30, 16);

            ctx.restore();
        },

        _wrapText(ctx, text, x, y, maxWidth, lineHeight) {
            const words = text.split(' ');
            let line = '';
            for (let n = 0; n < words.length; n++) {
                const testLine = line + words[n] + ' ';
                const metrics = ctx.measureText(testLine);
                if (metrics.width > maxWidth && n > 0) {
                    ctx.fillText(line, x, y);
                    line = words[n] + ' ';
                    y += lineHeight;
                } else {
                    line = testLine;
                }
            }
            ctx.fillText(line, x, y);
        }
    };

    window.GreenhouseModelsUIEnvironmentOverlay = GreenhouseModelsUIEnvironmentOverlay;
})();
