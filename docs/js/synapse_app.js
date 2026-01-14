// docs/js/synapse_app.js
// Main application logic for the Synapse Visualization

(function () {
    'use strict';

    console.log("Synapse App: Module loaded.");

    const config = {
        backgroundColor: '#F8F9FA',
        preSynapticColor: '#A1887F',
        postSynapticColor: '#795548',
        vesicleColor: '#FFAB91',
        neurotransmitterColor: '#FF8A65',
        ionChannelColor: '#4DB6AC',
        gpcrColor: '#7986CB',
        highlightColor: 'rgba(255, 235, 59, 0.5)',
        tooltipBg: 'rgba(33, 37, 41, 0.85)',
        tooltipColor: '#FFFFFF',
        font: '"Helvetica Neue", Arial, sans-serif',

        translations: {
            preSynapticTerminal: { en: 'Pre-Synaptic Terminal', es: 'Terminal Presináptica' },
            postSynapticTerminal: { en: 'Post-Synaptic Terminal', es: 'Terminal Postsináptica' },
            vesicle: { en: 'Vesicle', es: 'Vesícula' },
            ionChannel: { en: 'Ion Channel', es: 'Canal Iónico' },
            gpcr: { en: 'G-protein Coupled Receptor', es: 'Receptor acoplado a proteína G' },
            legendTitle: { en: 'Legend', es: 'Leyenda' }
        },

        elements: {
            preSynapticTerminal: { id: 'preSynapticTerminal', label: 'preSynapticTerminal' },
            postSynapticTerminal: { id: 'postSynapticTerminal', label: 'postSynapticTerminal' },
            vesicles: [
                { id: 'vesicle1', label: 'vesicle', x: 0.45, y: 0.25, r: 8 },
                { id: 'vesicle2', label: 'vesicle', x: 0.5, y: 0.2, r: 10 },
                { id: 'vesicle3', label: 'vesicle', x: 0.55, y: 0.28, r: 9 }
            ],
            ionChannels: [
                { id: 'ionChannel1', label: 'ionChannel', x: 0.45 },
                { id: 'ionChannel2', label: 'ionChannel', x: 0.55 }
            ],
            gpcrs: [
                { id: 'gpcr1', label: 'gpcr', x: 0.4 },
                { id: 'gpcr2', label: 'gpcr', x: 0.6 }
            ]
        }
    };

    const GreenhouseSynapseApp = {
        canvas: null,
        ctx: null,
        container: null,
        frame: 0,
        particles: [],
        mouse: { x: 0, y: 0 },
        currentLanguage: 'en',
        hoveredId: null,

        init(targetSelector, baseUrl) {
            console.log(`Synapse App: Initializing in container: ${targetSelector}`);
            this.baseUrl = baseUrl || '';

            this.container = document.querySelector(targetSelector);
            if (!this.container) {
                console.error(`Synapse App: Target container with selector "${targetSelector}" not found.`);
                return;
            }

            // Clear the container
            this.container.innerHTML = '';
            this.container.style.position = 'relative';

            this.setupDOM();
            this.animate();
        },

        setupDOM() {
            this.container.innerHTML = '';
            this.container.style.cssText = 'display: flex; flex-direction: row; gap: 20px; padding: 20px; background-color: #F8F9FA; border-radius: 12px;';

            const sidebar = document.createElement('div');
            sidebar.style.cssText = 'flex: 1; max-width: 30%; color: #212529; font-family: ' + config.font + ';';
            sidebar.innerHTML = `
                <h1 style="font-size: 28px; margin-bottom: 15px;">Synaptic Cleft</h1>
                <p style="font-size: 16px; line-height: 1.6;">
                    This model shows the process of neurotransmission. Move your mouse over the elements to learn their names.
                </p>
                <div id="legend-container"></div>
            `;
            this.container.appendChild(sidebar);

            const canvasWrapper = document.createElement('div');
            canvasWrapper.style.cssText = 'flex: 2; height: 600px; position: relative; border: 1px solid #DEE2E6; border-radius: 8px; overflow: hidden;';
            this.canvas = document.createElement('canvas');
            this.canvas.style.cssText = 'width: 100%; height: 100%;';
            this.ctx = this.canvas.getContext('2d');
            canvasWrapper.appendChild(this.canvas);
            this.container.appendChild(canvasWrapper);

            this.tooltip = document.createElement('div');
            this.tooltip.style.cssText = 'position: absolute; display: none; padding: 8px 12px; background-color: ' + config.tooltipBg + '; color: ' + config.tooltipColor + '; border-radius: 4px; font-family: ' + config.font + '; pointer-events: none;';
            canvasWrapper.appendChild(this.tooltip);

            this.resize();
            window.addEventListener('resize', () => this.resize());
            this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        },

        handleMouseMove(e) {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        },

        drawLegend() {
            const legendContainer = document.getElementById('legend-container');
            if (!legendContainer) return;

            if (!document.getElementById('lang-switcher')) {
                const switcher = document.createElement('div');
                switcher.id = 'lang-switcher';
                switcher.style.marginBottom = '10px';
                switcher.innerHTML = `<button id="lang-en">EN</button> <button id="lang-es">ES</button>`;
                legendContainer.before(switcher);
                document.getElementById('lang-en').addEventListener('click', () => this.currentLanguage = 'en');
                document.getElementById('lang-es').addEventListener('click', () => this.currentLanguage = 'es');
            }

            const lang = this.currentLanguage || 'en';
            const legendItems = [
                { label: config.translations.preSynapticTerminal[lang], color: config.preSynapticColor },
                { label: config.translations.postSynapticTerminal[lang], color: config.postSynapticColor },
                { label: config.translations.vesicle[lang], color: config.vesicleColor },
                { label: config.translations.ionChannel[lang], color: config.ionChannelColor },
                { label: config.translations.gpcr[lang], color: config.gpcrColor },
            ];

            let html = `<h3 style="font-size: 20px; margin-top: 20px; margin-bottom: 10px;">${config.translations.legendTitle[lang]}</h3><ul style="list-style: none; padding: 0; margin: 0;">`;
            legendItems.forEach(item => {
                html += `<li style="display: flex; align-items: center; margin-bottom: 8px;">
                    <span style="width: 20px; height: 20px; background-color: ${item.color}; border-radius: 4px; margin-right: 10px; border: 1px solid #CCC;"></span>
                    <span>${item.label}</span>
                </li>`;
            });
            html += `</ul>`;

            legendContainer.innerHTML = html;
        },

        resize() {
            if (!this.canvas) return;
            this.canvas.width = this.canvas.offsetWidth;
            this.canvas.height = this.canvas.offsetHeight;
        },

        animate() {
            requestAnimationFrame(() => this.animate());
            this.render();
        },

        render() {
            if (!this.ctx) return;
            this.frame++;
            const ctx = this.ctx;
            const w = this.canvas.width;
            const h = this.canvas.height;

            ctx.fillStyle = config.backgroundColor;
            ctx.fillRect(0, 0, w, h);

            this.drawLegend();
            this.drawPreSynapticTerminal(ctx, w, h);
            this.drawPostSynapticTerminal(ctx, w, h);
            this.drawVesicles(ctx, w, h);
            this.drawIonChannels(ctx, w, h);
            this.drawGPCRs(ctx, w, h);

            this.checkHover(w, h);
            this.drawHighlight(ctx, w, h);
            this.updateTooltip();

            this.updateAndDrawParticles(ctx, w, h);
        },

        checkHover(w, h) {
            this.hoveredId = null;
            const mx = this.mouse.x;
            const my = this.mouse.y;

            // Pre-synaptic terminal hitbox
            if (my < h * 0.4 && Math.abs(mx - w * 0.5) < w * 0.15) {
                this.hoveredId = config.elements.preSynapticTerminal.id;
            }
            // Post-synaptic terminal hitbox
            else if (my > h * 0.4 && my < h * 0.9 && Math.abs(mx - w * 0.5) < w * 0.2) {
                this.hoveredId = config.elements.postSynapticTerminal.id;
            }

            config.elements.vesicles.forEach(v => {
                const dx = mx - w * v.x;
                const dy = my - h * v.y;
                if (dx * dx + dy * dy < v.r * v.r) {
                    this.hoveredId = v.id;
                }
            });

            // Re-calculate positions for channels and receptors to match rendering
            const centerX = w * 0.5;
            const cupRadius = w * 0.1;
            const cupCenterY = h * 0.35;

            config.elements.ionChannels.forEach(c => {
                const cx = w * c.x;
                const dx = cx - centerX;
                const dy = Math.sqrt(Math.max(0, cupRadius * cupRadius - dx * dx));
                const cy = cupCenterY + dy;
                if (mx > cx - 10 && mx < cx + 10 && my > cy - 10 && my < cy + 10) {
                    this.hoveredId = c.id;
                }
            });

            config.elements.gpcrs.forEach(g => {
                const gx = w * g.x;
                const dx = gx - centerX;
                const dy = Math.sqrt(Math.max(0, cupRadius * cupRadius - dx * dx));
                const gy = cupCenterY + dy;
                if (mx > gx - 15 && mx < gx + 15 && my > gy - 15 && my < gy + 15) {
                    this.hoveredId = g.id;
                }
            });
        },

        updateTooltip() {
            if (this.hoveredId) {
                let labelKey;
                if (this.hoveredId.startsWith('vesicle')) labelKey = 'vesicle';
                else if (this.hoveredId.startsWith('ionChannel')) labelKey = 'ionChannel';
                else if (this.hoveredId.startsWith('gpcr')) labelKey = 'gpcr';
                else labelKey = this.hoveredId;

                const label = config.translations[labelKey][this.currentLanguage];
                this.tooltip.style.display = 'block';
                this.tooltip.innerHTML = label;
                this.tooltip.style.left = `${this.mouse.x + 15}px`;
                this.tooltip.style.top = `${this.mouse.y}px`;
            } else {
                this.tooltip.style.display = 'none';
            }
        },

        drawHighlight(ctx, w, h) {
            if (!this.hoveredId) return;
            ctx.save();
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = config.highlightColor;

            if (this.hoveredId === config.elements.preSynapticTerminal.id) {
                ctx.fillRect(w * 0.4, 0, w * 0.2, h * 0.4);
            } else if (this.hoveredId === config.elements.postSynapticTerminal.id) {
                ctx.fillRect(0, h * 0.65, w, h * 0.35);
            }
            ctx.restore();
        },

        updateAndDrawParticles(ctx, w, h) {
            if (this.frame % 10 === 0) {
                this.particles.push({
                    x: w * (0.45 + Math.random() * 0.1),
                    y: h * 0.25, // Start from the bottom of the pre-synaptic bulb
                    r: Math.random() * 2 + 1,
                    vy: Math.random() * 1.5 + 1.0,
                    life: 1.0
                });
            }

            ctx.save();
            ctx.fillStyle = config.neurotransmitterColor;
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                p.y += p.vy;
                p.life -= 0.01;

                if (p.life <= 0) {
                    this.particles.splice(i, 1);
                } else {
                    ctx.globalAlpha = p.life;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            ctx.restore();
        },

        drawPreSynapticTerminal(ctx, w, h) {
            ctx.save();
            ctx.fillStyle = config.preSynapticColor;

            const centerX = w * 0.5;
            const bulbRadius = w * 0.12;
            const stemWidth = w * 0.15;

            // Pre-synaptic terminal (stem)
            ctx.fillRect(centerX - stemWidth / 2, 0, stemWidth, h * 0.25);

            // Pre-synaptic bulb
            ctx.beginPath();
            ctx.arc(centerX, h * 0.25, bulbRadius, 0, Math.PI, false);
            ctx.fill();

            ctx.restore();
        },

        drawPostSynapticTerminal(ctx, w, h) {
            ctx.save();
            ctx.fillStyle = config.postSynapticColor;

            // Post-synaptic base
            ctx.fillRect(0, h * 0.8, w, h * 0.2);

            const centerX = w * 0.5;
            const spineBaseY = h * 0.8;
            const cupCenterY = h * 0.35;
            const cupRadius = w * 0.1;
            const neckWidth = 40;

            // Draw the dendritic spine (neck and cup)
            ctx.beginPath();
            // Neck base
            ctx.moveTo(centerX - neckWidth / 2, spineBaseY);
            // Up towards cup
            ctx.lineTo(centerX - neckWidth / 2, cupCenterY + cupRadius * 0.5);
            // The cup surface (concave)
            ctx.arc(centerX, cupCenterY, cupRadius, 0.8 * Math.PI, 0.2 * Math.PI, true);
            // Back down to base
            ctx.lineTo(centerX + neckWidth / 2, cupCenterY + cupRadius * 0.5);
            ctx.lineTo(centerX + neckWidth / 2, spineBaseY);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        },

        drawVesicles(ctx, w, h) {
            ctx.save();
            ctx.fillStyle = config.vesicleColor;
            config.elements.vesicles.forEach(v => {
                ctx.beginPath();
                ctx.arc(w * v.x, h * v.y, v.r, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.restore();
        },

        drawIonChannels(ctx, w, h) {
            const centerX = w * 0.5;
            const cupCenterY = h * 0.35;
            const cupRadius = w * 0.1;

            ctx.save();
            ctx.fillStyle = config.ionChannelColor;
            config.elements.ionChannels.forEach(c => {
                const x = w * c.x;
                const dx = x - centerX;
                const dy = Math.sqrt(Math.max(0, cupRadius * cupRadius - dx * dx));
                const y = cupCenterY + dy;
                ctx.fillRect(x - 5, y - 5, 10, 10);
            });
            ctx.restore();
        },

        drawGPCRs(ctx, w, h) {
            const centerX = w * 0.5;
            const cupCenterY = h * 0.35;
            const cupRadius = w * 0.1;

            ctx.save();
            config.elements.gpcrs.forEach(g => {
                const x = w * g.x;
                const dx = x - centerX;
                const dy = Math.sqrt(Math.max(0, cupRadius * cupRadius - dx * dx));
                const y = cupCenterY + dy;

                ctx.strokeStyle = config.gpcrColor;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(x - 10, y);
                ctx.bezierCurveTo(x - 5, y - 5, x + 5, y - 5, x + 10, y);
                ctx.stroke();
            });
            ctx.restore();
        }
    };

    window.GreenhouseSynapseApp = GreenhouseSynapseApp;

})();
