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
                { id: 'vesicle1', label: 'vesicle', x: 0.2, y: 0.2, r: 15 },
                { id: 'vesicle2', label: 'vesicle', x: 0.5, y: 0.15, r: 20 },
                { id: 'vesicle3', label: 'vesicle', x: 0.8, y: 0.25, r: 18 }
            ],
            ionChannels: [
                { id: 'ionChannel1', label: 'ionChannel', x: 0.2 },
                { id: 'ionChannel2', label: 'ionChannel', x: 0.6 }
            ],
            gpcrs: [
                { id: 'gpcr1', label: 'gpcr', x: 0.4 },
                { id: 'gpcr2', label: 'gpcr', x: 0.8 }
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
            this.container.style.position = 'relative'; // Needed for absolute positioning inside

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
            canvasWrapper.style.cssText = 'flex: 2; height: 500px; position: relative; border: 1px solid #DEE2E6; border-radius: 8px; overflow: hidden;';
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

            // Simple language switcher - to be improved later
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

            // Clear background
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

            // Check Pre-Synaptic Terminal
            if (my < h * 0.4) {
                this.hoveredId = config.elements.preSynapticTerminal.id;
            }
            // Check Post-Synaptic Terminal
            else if (my > h * 0.6) {
                this.hoveredId = config.elements.postSynapticTerminal.id;
            }

            // Check Vesicles
            config.elements.vesicles.forEach(v => {
                const dx = mx - w * v.x;
                const dy = my - h * v.y;
                if (dx * dx + dy * dy < v.r * v.r) {
                    this.hoveredId = v.id;
                }
            });

            // Check Ion Channels
            config.elements.ionChannels.forEach(c => {
                const cx = w * c.x - 10;
                const cy = h * 0.6 - 15;
                if (mx > cx && mx < cx + 20 && my > cy && my < cy + 15) {
                    this.hoveredId = c.id;
                }
            });

            // Check GPCRs
            config.elements.gpcrs.forEach(g => {
                // Simplified hit-box for the curve
                if (mx > w * g.x - 15 && mx < w * g.x + 15 && my > h * 0.6 - 15 && my < h * 0.6) {
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

                const label = config.translations[labelKey] ? config.translations[labelKey][this.currentLanguage] : 'Unknown';
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

            // This is a simplified highlight logic. It can be improved.
            if (this.hoveredId === config.elements.preSynapticTerminal.id) {
                ctx.fillRect(0, 0, w, h * 0.4);
            } else if (this.hoveredId === config.elements.postSynapticTerminal.id) {
                ctx.fillRect(0, h * 0.6, w, h * 0.4);
            }
            // Add more specific highlights for other elements if needed
            ctx.restore();
        },

        updateAndDrawParticles(ctx, w, h) {
            // Spawn new particles
            if (this.frame % 10 === 0) {
                this.particles.push({
                    x: w * (0.2 + Math.random() * 0.6),
                    y: h * 0.4,
                    r: Math.random() * 2 + 1,
                    vy: Math.random() * 0.5 + 0.5,
                    life: 1.0
                });
            }

            // Update and draw particles
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
            const breath = Math.sin(this.frame * 0.02) * 2;
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(0, h * 0.4);
            ctx.bezierCurveTo(w * 0.25, h * 0.3 + breath, w * 0.75, h * 0.3 + breath, w, h * 0.4);
            ctx.lineTo(w, 0);
            ctx.lineTo(0, 0);
            ctx.closePath();
            ctx.fillStyle = config.preSynapticColor;
            ctx.fill();

            ctx.strokeStyle = config.postSynapticColor;
            ctx.lineWidth = 4;
            ctx.stroke();
            ctx.restore();
        },

        drawPostSynapticTerminal(ctx, w, h) {
            const breath = Math.sin(this.frame * 0.02) * 2;
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(0, h * 0.6);
            ctx.bezierCurveTo(w * 0.25, h * 0.7 - breath, w * 0.75, h * 0.7 - breath, w, h * 0.6);
            ctx.lineTo(w, h);
            ctx.lineTo(0, h);
            ctx.closePath();
            ctx.fillStyle = config.postSynapticColor;
            ctx.fill();

            ctx.strokeStyle = config.preSynapticColor;
            ctx.lineWidth = 4;
            ctx.stroke();
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
            ctx.save();
            ctx.fillStyle = config.ionChannelColor;
            config.elements.ionChannels.forEach(x => {
                ctx.fillRect(w * x - 10, h * 0.6 - 15, 20, 15);
            });
            ctx.restore();
        },

        drawGPCRs(ctx, w, h) {
            ctx.save();
            ctx.strokeStyle = config.gpcrColor;
            ctx.lineWidth = 4;
            config.elements.gpcrs.forEach(x => {
                ctx.beginPath();
                ctx.moveTo(w * x - 15, h * 0.6);
                ctx.bezierCurveTo(w * x - 5, h * 0.6 - 10, w * x + 5, h * 0.6 - 10, w * x + 15, h * 0.6);
                ctx.stroke();
            });
            ctx.restore();
        },

        drawLabels(ctx, w, h) {
            ctx.save();
            ctx.font = config.labelFont;
            ctx.fillStyle = config.labelColor;
            ctx.textAlign = 'center';

            for (const key in config.labels) {
                const label = config.labels[key];
                ctx.fillText(label.text, w * label.x, h * label.y);
            }

            ctx.restore();
        }
    };

    // Expose the app to the global window object
    window.GreenhouseSynapseApp = GreenhouseSynapseApp;

})();
