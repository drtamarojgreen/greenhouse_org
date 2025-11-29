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
                metaphor: 'dna_structure_metaphor',
                concept: 'dna_structure_concept',
                text: 'dna_structure_text'
            },
            histones: {
                id: 'histones',
                metaphor: 'histones_metaphor',
                concept: 'histones_concept',
                text: 'histones_text'
            },
            acetylation: {
                id: 'acetylation',
                metaphor: 'acetylation_metaphor',
                concept: 'acetylation_concept',
                text: 'acetylation_text'
            },
            methylation: {
                id: 'methylation',
                metaphor: 'methylation_metaphor',
                concept: 'methylation_concept',
                text: 'methylation_text'
            },
            cityscape: {
                id: 'cityscape',
                metaphor: 'cityscape_metaphor',
                concept: 'cityscape_concept',
                text: 'cityscape_text'
            },
            pfc: {
                id: 'pfc',
                metaphor: 'pfc_metaphor',
                concept: 'pfc_concept',
                text: 'pfc_text',
                targetRegion: 'pfc'
            },
            amygdala: {
                id: 'amygdala',
                metaphor: 'amygdala_metaphor',
                concept: 'amygdala_concept',
                text: 'amygdala_text',
                targetRegion: 'amygdala'
            },
            stress: {
                id: 'stress',
                metaphor: 'stress_metaphor',
                concept: 'stress_concept',
                text: 'stress_text'
            },
            therapy: {
                id: 'therapy',
                metaphor: 'therapy_metaphor',
                concept: 'therapy_concept',
                text: 'therapy_text'
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
                ctx.fillText(window.GreenhouseModelsUtil.t('label_ceo'), x + 8, y + 25);
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
                dna_structure: { x: 100, y: 250 },
                histones: { x: 200, y: 250 },
                acetylation: { x: 300, y: 250 },
                methylation: { x: 400, y: 250 },
                cityscape: { x: 600, y: 250 },
                stress: { x: 700, y: 250 },
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
                    // Draw target circle indicator
                    ctx.beginPath();
                    ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
                    ctx.lineWidth = 3;
                    ctx.arc(item.x, item.y, 40, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.restore();
                }
            }

            const t = (k) => window.GreenhouseModelsUtil.t(k);
            const metaphor = t(item.metaphor);
            const concept = t(item.concept);
            const text = t(item.text);
            // console.log(`Drawing overlay ${item.id}: text=${text}`); // Debug log

            const boxX = item.x + 60;
            const boxY = item.y;
            const boxWidth = 280;
            const padding = 15;
            const iconSpace = 60; // Space for the icon on the left
            const textWidth = boxWidth - iconSpace - padding * 2;

            // Calculate dynamic heights
            ctx.font = 'bold 14px "Helvetica Neue", Arial, sans-serif';
            const metaphorHeight = this._measureTextHeight(ctx, metaphor, textWidth, 18);

            ctx.font = 'italic 12px "Helvetica Neue", Arial, sans-serif';
            const conceptHeight = this._measureTextHeight(ctx, `(${concept})`, textWidth, 16);

            ctx.font = '12px "Helvetica Neue", Arial, sans-serif';
            const bodyHeight = this._measureTextHeight(ctx, text, boxWidth - padding * 2, 16); // Body uses full width minus padding

            // Total height calculation
            // Top padding + Metaphor + Concept + Gap + Body + Bottom padding
            // Note: Metaphor and Concept are indented by iconSpace
            // Body is below the icon, so it can take full width? 
            // Actually, let's keep the design simple: Icon is top-left. Metaphor/Concept are to its right.
            // Body text starts BELOW the icon/header section.

            const headerHeight = Math.max(60, padding + metaphorHeight + conceptHeight + padding); // Ensure enough height for icon (approx 50px)
            const boxHeight = headerHeight + bodyHeight + padding;

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
            ctx.roundRect(boxX, boxY, boxWidth, boxHeight, cornerRadius);
            ctx.fill();
            ctx.stroke();

            // 4. Render Custom Graphic (Icon)
            if (this.renderers[item.id]) {
                ctx.save();
                this.renderers[item.id](ctx, boxX + 20, boxY + 25);
                ctx.restore();
            }

            // 5. Draw Text
            let currentY = boxY + padding + 10; // Start a bit down

            // Metaphor (Title)
            ctx.fillStyle = '#357438';
            ctx.font = 'bold 14px "Helvetica Neue", Arial, sans-serif';
            this._wrapText(ctx, metaphor, boxX + iconSpace + padding, currentY, textWidth, 18);
            currentY += metaphorHeight;

            // Concept (Subtitle)
            ctx.fillStyle = '#666';
            ctx.font = 'italic 12px "Helvetica Neue", Arial, sans-serif';
            this._wrapText(ctx, `(${concept})`, boxX + iconSpace + padding, currentY, textWidth, 16);

            // Move Y past the header section
            currentY = boxY + headerHeight;

            // Body Text
            ctx.fillStyle = '#333';
            ctx.font = '12px "Helvetica Neue", Arial, sans-serif';
            this._wrapText(ctx, text, boxX + padding, currentY, boxWidth - padding * 2, 16);

            ctx.restore();
        },

        _measureTextHeight(ctx, text, maxWidth, lineHeight) {
            const words = text.split(' ');
            let line = '';
            let height = lineHeight; // Start with one line
            // If text is empty, return 0
            if (!text) return 0;

            for (let n = 0; n < words.length; n++) {
                const testLine = line + words[n] + ' ';
                const metrics = ctx.measureText(testLine);
                if (metrics.width > maxWidth && n > 0) {
                    line = words[n] + ' ';
                    height += lineHeight;
                } else {
                    line = testLine;
                }
            }
            return height;
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
