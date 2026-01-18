/**
 * @file rna_repair.js
 * @description Interactive 2D simulation of various RNA repair mechanisms.
 * Supports visualization of RNA ligation and oxidative demethylation.
 * Refactored for vertical orientation and external display controls.
 */

(async function () {
    'use strict';

    console.log("RNA Repair simulation script loaded.");

    let GreenhouseUtils;
    let resilienceObserver = null;

    // Ensure GreenhouseUtils is loaded before proceeding
    const loadDependencies = async () => {
        await new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 240;
            const interval = setInterval(() => {
                if (window.GreenhouseUtils) {
                    clearInterval(interval);
                    GreenhouseUtils = window.GreenhouseUtils;
                    resolve();
                } else if (attempts++ >= maxAttempts) {
                    clearInterval(interval);
                    reject(new Error('GreenhouseUtils load timeout'));
                }
            }, 50);
        });
    };

    /**
     * @class RNARepairSimulation
     * @description Manages the state and animation of the RNA repair simulation.
     */
    class RNARepairSimulation {
        constructor(canvas) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');

            // Initialization with fallbacks to avoid NaN
            this.width = canvas.width || 800;
            this.height = canvas.height || 600;

            this.rnaStrand = [];
            this.enzymes = [];
            this.particles = [];

            this.damageTypes = {
                BREAK: 'break',
                METHYLATION: 'methylation'
            };

            this.colors = {
                A: '#FF6B6B',
                U: '#4ECDC4',
                G: '#FFE66D',
                C: '#1A535C',
                BACKBONE: '#A3BFFA',
                ENZYME: 'rgba(255, 255, 255, 0.2)',
                METHYL: '#FF0000',
                GLOW: '#667EEA',
                METAL: '#A5F3FC'
            };

            // Display state
            this.scale = 1.0;
            this.offsetX = 0;
            this.offsetY = 0;

            this.isRunning = true;
            this.firstFrame = false;
            this.simTime = 0;
            this.lastTime = 0;

            this.init();
        }

        init() {
            this.createRnaStrand();
            this.scheduleDamage();
            this.setupInteraction();

            // Initialize tooltip if available
            if (window.GreenhouseRNATooltip && window.GreenhouseRNATooltip.initialize) {
                window.GreenhouseRNATooltip.initialize();
            }
        }

        setupInteraction() {
            if (!this.canvas) return;
            this.canvas.addEventListener('mousemove', (e) => {
                if (!window.GreenhouseRNATooltip) return;

                const rect = this.canvas.getBoundingClientRect();
                const mx = e.clientX - rect.left;
                const my = e.clientY - rect.top;

                // Adjust for zoom/pan
                const worldX = (mx - this.offsetX) / this.scale;
                const worldY = (my - this.offsetY) / this.scale;

                let hit = null;

                // Check Bases
                for (const base of this.rnaStrand) {
                    const dx = base.x - worldX;
                    const dy = base.y - worldY;
                    if (dx * dx + dy * dy < 144) { // 12px radius squared
                        hit = { x: e.clientX, y: e.clientY, key: base.type };
                        if (base.damageType) hit.key = 'Methylation';
                        break;
                    }
                }

                if (hit) {
                    window.GreenhouseRNATooltip.show(hit.x, hit.y, hit.key);
                } else {
                    window.GreenhouseRNATooltip.hide();
                }
            });
        }

        /**
         * Creates an initial RNA strand with bases arranged vertically.
         */
        createRnaStrand() {
            const baseCount = 40;
            const spacing = 40;
            const centerX = this.width / 2;
            const baseTypes = ['A', 'U', 'G', 'C'];

            this.rnaStrand = [];
            for (let i = 0; i < baseCount; i++) {
                let type = baseTypes[Math.floor(Math.random() * baseTypes.length)];

                // Enhancement 25: 5' Cap (m7G)
                if (i === 0) type = 'G';

                // Enhancement 24: Poly-A Tail (last 10 bases)
                if (i >= baseCount - 10) type = 'A';

                this.rnaStrand.push({
                    x: centerX,
                    targetX: centerX,
                    y: spacing * (i + 1),
                    type: type,
                    damaged: false,
                    damageType: null,
                    connected: i < baseCount - 1,
                    offset: Math.random() * Math.PI * 2,
                    flash: 0 // Enhancement 35: Reaction flash
                });
            }
        }

        scheduleDamage() {
            const nextDamage = () => {
                if (!this.isRunning) return;
                const delay = 3000 + Math.random() * 5000;
                setTimeout(() => {
                    this.introduceDamage();
                    nextDamage();
                }, delay);
            };
            nextDamage();
        }

        introduceDamage() {
            const damagedCount = this.rnaStrand.filter(b => b.damaged || !b.connected).length;
            if (damagedCount > 5) return;

            const damageType = Math.random() > 0.5 ? this.damageTypes.BREAK : this.damageTypes.METHYLATION;
            const index = Math.floor(Math.random() * (this.rnaStrand.length - 2)) + 1;

            if (damageType === this.damageTypes.BREAK) {
                if (this.rnaStrand[index].connected) {
                    this.rnaStrand[index].connected = false;
                    this.spawnEnzyme('Ligase', index);
                }
            } else {
                if (!this.rnaStrand[index].damaged) {
                    this.rnaStrand[index].damaged = true;
                    this.rnaStrand[index].damageType = this.damageTypes.METHYLATION;
                    this.spawnEnzyme('Demethylase', index);
                }
            }
        }

        spawnEnzyme(name, targetIndex) {
            const enzyme = {
                name: name,
                targetIndex: targetIndex,
                x: Math.random() * this.width,
                y: Math.random() > 0.5 ? -50 : this.height + 50,
                size: 40,
                speed: 3,
                state: 'approaching',
                progress: 0
            };
            this.enzymes.push(enzyme);
        }

        update(dt) {
            if (!dt) dt = 16; // Fallback for first frame
            this.simTime += dt * 0.002;

            // Update RNA strand movement
            this.rnaStrand.forEach((base, i) => {
                // Enhancement 32 & 33: Fluid Dynamics + Thermal Noise
                const fluidMotion = Math.sin(this.simTime + base.offset) * 15;
                const thermalNoise = (Math.random() - 0.5) * 1.5;

                base.x = base.targetX + fluidMotion + thermalNoise;

                // Handle vertical spacing for breaks
                if (!base.connected && i < this.rnaStrand.length - 1) {
                    const idealY = base.y + 60;
                    this.rnaStrand[i + 1].y += (idealY - this.rnaStrand[i + 1].y) * 0.1;
                } else if (i < this.rnaStrand.length - 1) {
                    const idealY = base.y + 40;
                    this.rnaStrand[i + 1].y += (idealY - this.rnaStrand[i + 1].y) * 0.1;
                }

                // Decay flash
                if (base.flash > 0) base.flash -= 0.02;
            });

            // Update enzymes
            this.enzymes.forEach((enzyme, index) => {
                const targetBase = this.rnaStrand[enzyme.targetIndex];
                if (!targetBase) return;

                if (enzyme.state === 'approaching') {
                    const dx = targetBase.x - enzyme.x;
                    const dy = targetBase.y - enzyme.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 5) {
                        enzyme.state = 'repairing';
                    } else {
                        enzyme.x += (dx / dist) * enzyme.speed;
                        enzyme.y += (dy / dist) * enzyme.speed;
                    }
                } else if (enzyme.state === 'repairing') {
                    enzyme.x = targetBase.x;
                    enzyme.y = targetBase.y;
                    enzyme.progress += 0.01;

                    if (enzyme.progress >= 1) {
                        if (enzyme.name === 'Ligase') {
                            targetBase.connected = true;
                        } else {
                            targetBase.damaged = false;
                            targetBase.damageType = null;
                        }
                        targetBase.flash = 1.0; // Enhancement 35: Flash on repair
                        enzyme.state = 'leaving';
                        this.spawnParticles(enzyme.x, enzyme.y);
                    }
                } else if (enzyme.state === 'leaving') {
                    enzyme.y -= enzyme.speed;
                    enzyme.size *= 0.98;
                    if (enzyme.y < -100 || enzyme.size < 1) {
                        this.enzymes.splice(index, 1);
                    }
                }
            });

            // Update particles
            this.particles.forEach((p, i) => {
                p.x += p.vx;
                p.y += p.vy;
                p.life -= 0.02;
                if (p.life <= 0) this.particles.splice(i, 1);
            });
        }

        spawnParticles(x, y) {
            for (let i = 0; i < 15; i++) {
                this.particles.push({
                    x: x,
                    y: y,
                    vx: (Math.random() - 0.5) * 5,
                    vy: (Math.random() - 0.5) * 5,
                    life: 1,
                    color: this.colors.GLOW
                });
            }
        }

        draw() {
            if (!this.ctx) return;

            this.ctx.clearRect(0, 0, this.width, this.height);

            this.ctx.save();
            this.ctx.translate(this.offsetX, this.offsetY);
            this.ctx.scale(this.scale, this.scale);

            // Enhancement 31: Phosphorescence Backbone
            this.ctx.save();
            this.ctx.shadowBlur = 20;
            this.ctx.shadowColor = this.colors.GLOW;
            this.ctx.beginPath();
            this.ctx.strokeStyle = this.colors.BACKBONE;
            this.ctx.lineWidth = 6;
            let moved = false;
            for (let i = 0; i < this.rnaStrand.length; i++) {
                const base = this.rnaStrand[i];
                if (!moved) {
                    this.ctx.moveTo(base.x, base.y);
                    moved = true;
                } else {
                    this.ctx.lineTo(base.x, base.y);
                }
                if (!base.connected) {
                    this.ctx.stroke();
                    this.ctx.beginPath();
                    moved = false;
                }
            }
            this.ctx.stroke();
            this.ctx.restore();

            // Draw Bases
            this.rnaStrand.forEach((base, index) => {
                // Enhancement 30: Metal Ion Binding (Mg2+)
                if (index % 5 === 0) {
                    this.ctx.save();
                    this.ctx.beginPath();
                    this.ctx.arc(base.x - 15, base.y, 3, 0, Math.PI * 2);
                    this.ctx.fillStyle = this.colors.METAL;
                    this.ctx.shadowBlur = 5;
                    this.ctx.shadowColor = this.colors.METAL;
                    this.ctx.fill();
                    this.ctx.restore();
                }

                // Enhancement 25: 5' Cap visual
                if (index === 0) {
                    this.ctx.save();
                    this.ctx.beginPath();
                    this.ctx.arc(base.x, base.y, 16, 0, Math.PI * 2);
                    this.ctx.strokeStyle = '#FFD700';
                    this.ctx.lineWidth = 3;
                    this.ctx.shadowBlur = 15;
                    this.ctx.shadowColor = '#FFD700';
                    this.ctx.setLineDash([4, 4]);
                    this.ctx.stroke();
                    this.ctx.restore();
                }

                // Enhancement 21: Uracil visual distinction
                if (base.type === 'U') {
                    this.ctx.save();
                    this.ctx.beginPath();
                    this.ctx.arc(base.x, base.y, 13, 0, Math.PI * 2);
                    this.ctx.strokeStyle = 'white';
                    this.ctx.lineWidth = 1;
                    this.ctx.globalAlpha = 0.4;
                    this.ctx.stroke();
                    this.ctx.restore();
                }

                // Base Core with Glow (#31)
                this.ctx.save();
                this.ctx.shadowBlur = 15;
                this.ctx.shadowColor = this.colors[base.type];
                this.ctx.beginPath();
                this.ctx.arc(base.x, base.y, 9, 0, Math.PI * 2);
                this.ctx.fillStyle = this.colors[base.type];
                this.ctx.fill();

                // Enhancement 35: Reaction Flash Overlay
                if (base.flash > 0) {
                    this.ctx.globalAlpha = base.flash;
                    this.ctx.fillStyle = 'white';
                    this.ctx.beginPath();
                    this.ctx.arc(base.x, base.y, 15 * base.flash, 0, Math.PI * 2);
                    this.ctx.fill();
                }
                this.ctx.restore();

                // Damage indicator
                if (base.damaged) {
                    this.ctx.fillStyle = this.colors.METHYL;
                    this.ctx.beginPath();
                    this.ctx.arc(base.x + 6, base.y - 6, 5, 0, Math.PI * 2);
                    this.ctx.fill();
                }

                this.ctx.fillStyle = 'white';
                this.ctx.font = 'bold 11px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(base.type, base.x, base.y + 4);
            });

            // Draw Enzymes
            this.enzymes.forEach(enzyme => {
                this.ctx.save();
                this.ctx.beginPath();
                this.ctx.arc(enzyme.x, enzyme.y, enzyme.size, 0, Math.PI * 2);
                this.ctx.fillStyle = this.colors.ENZYME;
                this.ctx.fill();
                this.ctx.strokeStyle = this.colors.GLOW;
                this.ctx.setLineDash([5, 5]);
                this.ctx.lineWidth = 2;
                this.ctx.stroke();

                this.ctx.fillStyle = 'white';
                this.ctx.font = '12px Arial';
                this.ctx.fillText(enzyme.name, enzyme.x, enzyme.y - enzyme.size - 5);

                if (enzyme.state === 'repairing') {
                    this.ctx.beginPath();
                    this.ctx.rect(enzyme.x - 20, enzyme.y + enzyme.size + 10, 40 * enzyme.progress, 4);
                    this.ctx.fillStyle = this.colors.GLOW;
                    this.ctx.fill();
                }
                this.ctx.restore();
            });

            // Draw Particles
            this.particles.forEach(p => {
                this.ctx.save();
                this.ctx.globalAlpha = p.life;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
                this.ctx.fillStyle = p.color;
                this.ctx.fill();
                this.ctx.restore();
            });

            this.ctx.restore();
        }

        animate(timestamp) {
            if (!this.isRunning) return;

            if (!this.firstFrame) {
                console.log('RNA Simulation: Animation loop started.');
                this.firstFrame = true;
            }

            if (!this.lastTime) this.lastTime = timestamp;
            const dt = timestamp - this.lastTime;
            this.lastTime = timestamp;

            this.update(dt);
            this.draw();

            // Notify legend if it exists
            if (window.Greenhouse && window.Greenhouse.RNALegend && window.Greenhouse.RNALegend.update) {
                window.Greenhouse.RNALegend.update(this.ctx, this.width, this.height, this.colors);
            }

            requestAnimationFrame((ts) => this.animate(ts));
        }

        stop() {
            this.isRunning = false;
        }
    }

    /**
     * @function initializeRNARepairSimulation
     */
    function initializeRNARepairSimulation(targetElement) {
        if (!targetElement) {
            console.error('Target element for RNA repair simulation not found.');
            return;
        }

        if (typeof targetElement === 'string') {
            const selector = targetElement;
            targetElement = document.querySelector(selector);
            if (!targetElement) return;
        }

        if (targetElement.dataset.initialized === 'true') return;
        targetElement.dataset.initialized = 'true';

        targetElement.innerHTML = '';
        const wrapper = document.createElement('div');
        wrapper.className = 'rna-simulation-container';
        wrapper.style.width = '100%';
        wrapper.style.height = '100%';
        targetElement.appendChild(wrapper);

        const canvas = document.createElement('canvas');
        canvas.id = 'rnaRepairCanvas';

        const rect = targetElement.getBoundingClientRect();
        canvas.width = rect.width || 800;
        canvas.height = 600;
        canvas.style.display = 'block';
        canvas.style.cursor = 'grab';

        wrapper.appendChild(canvas);

        const simulation = new RNARepairSimulation(canvas);

        window.Greenhouse = window.Greenhouse || {};
        window.Greenhouse.rnaSimulation = simulation;

        if (window.Greenhouse.initializeRNADisplay) {
            window.Greenhouse.initializeRNADisplay(simulation);
        }

        simulation.animate();

        window.addEventListener('resize', () => {
            const newRect = targetElement.getBoundingClientRect();
            canvas.width = newRect.width;
            simulation.width = canvas.width;
            simulation.rnaStrand.forEach(base => {
                base.targetX = canvas.width / 2;
            });
        });

        console.log('RNA Repair simulation initialized (Vertical).');

        observeAndReinitializeApp(targetElement);
    }

    function observeAndReinitializeApp(container) {
        if (!container) return;

        if (resilienceObserver) {
            resilienceObserver.disconnect();
        }

        const observerCallback = (mutations) => {
            const wasRemoved = mutations.some(m =>
                Array.from(m.removedNodes).some(n =>
                    n.nodeType === 1 && n.classList.contains('rna-simulation-container')
                )
            );

            if (wasRemoved) {
                console.log('RNARepair: Simulation container removed. Re-initializing...');
                if (window.Greenhouse.rnaSimulation) {
                    window.Greenhouse.rnaSimulation.stop();
                }
                if (resilienceObserver) resilienceObserver.disconnect();

                setTimeout(() => {
                    initializeRNARepairSimulation(container);
                }, 1000);
            }
        };

        resilienceObserver = new MutationObserver(observerCallback);
        resilienceObserver.observe(container, { childList: true });
    }

    window.Greenhouse = window.Greenhouse || {};
    window.Greenhouse.initializeRNARepairSimulation = initializeRNARepairSimulation;
    window.Greenhouse.RNARepairSimulation = RNARepairSimulation;

    // --- Auto-Initialization Logic ---
    function captureAttributes() {
        if (window._greenhouseScriptAttributes) {
            return {
                targetSelector: window._greenhouseScriptAttributes['target-selector-left'],
                baseUrl: window._greenhouseScriptAttributes['base-url']
            };
        }
        const script = document.currentScript;
        if (script) {
            return {
                targetSelector: script.getAttribute('data-target-selector-left'),
                baseUrl: script.getAttribute('data-base-url')
            };
        }
        return { targetSelector: null, baseUrl: null };
    }

    async function main() {
        try {
            await loadDependencies();
            const { targetSelector, baseUrl } = captureAttributes();

            if (baseUrl) {
                if (!window.GreenhouseRNATooltip) await GreenhouseUtils.loadScript('rna_tooltip.js', baseUrl);
                if (!window.GreenhouseRNADisplay) await GreenhouseUtils.loadScript('rna_display.js', baseUrl);
                if (!document.querySelector('script[data-script-name="rna_legend.js"]')) {
                    await GreenhouseUtils.loadScript('rna_legend.js', baseUrl);
                }
            }
            
            if (targetSelector) {
                console.log('RNA Repair App: Waiting for container:', targetSelector);
                const container = await GreenhouseUtils.waitForElement(targetSelector);
                setTimeout(() => {
                    console.log('RNA Repair App: Auto-initializing...');
                    initializeRNARepairSimulation(container);
                }, 5000);
            }
        } catch (error) {
            console.error('RNA Repair App: Initialization failed', error);
        }
    }

    main();
})();
