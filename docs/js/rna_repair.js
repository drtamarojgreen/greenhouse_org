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
            this.proteins = []; // Enhancement 22: RNPs

            // Enhancement 66: ATP Currency (Modular)
            if (window.Greenhouse && window.Greenhouse.RNAAtpManager) {
                this.atpManager = new window.Greenhouse.RNAAtpManager();
            } else {
                // Fallback ATP
                this.atp = 100;
                this.atpConsumed = 0;
            }

            // Enhancement 23: Ribosome
            this.ribosome = {
                index: 0,
                progress: 0,
                stalled: false,
                stallTimer: 0, // Enhancement 14
                x: 0,
                y: 0
            };

            // Modular Physics
            if (window.Greenhouse && window.Greenhouse.RNAFoldingEngine) {
                this.foldingEngine = new window.Greenhouse.RNAFoldingEngine();
            }
            if (window.Greenhouse && window.Greenhouse.RNAEnvironmentManager) {
                this.environmentManager = new window.Greenhouse.RNAEnvironmentManager();
            }

            // Enhancement 36: Background particles
            this.bgParticles = [];
            for (let i = 0; i < 20; i++) {
                this.bgParticles.push({
                    x: Math.random() * this.width,
                    y: Math.random() * this.height,
                    size: 20 + Math.random() * 40,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5,
                    alpha: 0.05 + Math.random() * 0.1
                });
            }

            this.damageTypes = {
                BREAK: 'break',
                METHYLATION: 'methylation',
                DECAPPING: 'decapping',
                ABASIC: 'abasic',
                PSEUDOURIDINE: 'pseudouridine'
            };

            this.colors = {
                A: '#FF6B6B',
                U: '#4ECDC4',
                G: '#FFE66D',
                C: '#1A535C',
                PSI: '#818CF8', // Enhancement 7
                BACKBONE: '#A3BFFA',
                ENZYME: 'rgba(255, 255, 255, 0.2)',
                METHYL: '#FF0000',
                GLOW: '#667EEA',
                METAL: '#A5F3FC',
                PROTEIN: '#F472B6',
                RIBOSOME: '#9333EA',
                ATP: '#FBDF11',
                DECAY: '#EF4444'
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
            this.scheduleProteins(); // Enhancement 22
            this.setupInteraction();

            // Handle Language Change
            window.addEventListener('greenhouseLanguageChanged', () => {
                this.refreshUIText();
            });

            // Initialize tooltip if available
            if (window.GreenhouseRNATooltip && window.GreenhouseRNATooltip.initialize) {
                window.GreenhouseRNATooltip.initialize();
            }
        }

        refreshUIText() {
            // Redraw loop will handle language changes automatically via t()
            const langBtn = document.getElementById('rna-lang-toggle');
            if (langBtn && window.GreenhouseModelsUtil) {
                langBtn.textContent = window.GreenhouseModelsUtil.t('btn_language');
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

                // Check Enzymes
                if (!hit) {
                    for (const enzyme of this.enzymes) {
                        const dx = enzyme.x - worldX;
                        const dy = enzyme.y - worldY;
                        if (dx * dx + dy * dy < enzyme.size * enzyme.size) {
                            hit = { x: e.clientX, y: e.clientY, key: enzyme.name };
                            break;
                        }
                    }
                }

                // Check Ribosome
                if (!hit) {
                    const rdx = this.ribosome.x - worldX;
                    const rdy = this.ribosome.y - worldY;
                    if (rdx * rdx + rdy * rdy < 1600) {
                        hit = { x: e.clientX, y: e.clientY, key: 'Ribosome' };
                        if (this.ribosome.stalled) hit.key = 'Ribosome (Stalled)';
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
                    protected: false, // Enhancement 22
                    connected: i < baseCount - 1,
                    offset: Math.random() * Math.PI * 2,
                    flash: 0 // Enhancement 35: Reaction flash
                });
            }
        }

        /**
         * Periodic appearance of protective proteins.
         */
        scheduleProteins() {
            const nextProtein = () => {
                if (!this.isRunning) return;
                const delay = 10000 + Math.random() * 15000;
                setTimeout(() => {
                    this.spawnProtein();
                    nextProtein();
                }, delay);
            };
            nextProtein();
        }

        spawnProtein() {
            const index = Math.floor(Math.random() * (this.rnaStrand.length - 5));
            const protein = {
                startIndex: index,
                length: 3 + Math.floor(Math.random() * 3),
                life: 1,
                state: 'binding'
            };

            // Apply protection
            for (let i = 0; i < protein.length; i++) {
                if (this.rnaStrand[index + i]) this.rnaStrand[index + i].protected = true;
            }

            this.proteins.push(protein);
        }

        /**
         * Periodic introduction of damage.
         */
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
            const activeDamaged = this.rnaStrand.filter(b => b.damaged || !b.connected).length;

            // Enhancement 67: pH influence on damage rate
            const dmgLimit = this.environmentManager ? 8 * this.environmentManager.getDamageMultiplier() : 8;
            if (activeDamaged > dmgLimit) return;

            const roll = Math.random();
            let damageType;
            if (roll < 0.3) damageType = this.damageTypes.BREAK;
            else if (roll < 0.6) damageType = this.damageTypes.METHYLATION;
            else if (roll < 0.75) damageType = this.damageTypes.ABASIC; // Enhancement 9
            else if (roll < 0.9) damageType = this.damageTypes.PSEUDOURIDINE; // Enhancement 7
            else damageType = this.damageTypes.DECAPPING; // Enhancement 25

            const index = Math.floor(Math.random() * (this.rnaStrand.length - 2)) + 1;
            const base = this.rnaStrand[index];

            if (base.protected) return;

            if (damageType === this.damageTypes.BREAK) {
                if (base.connected) {
                    base.connected = false;
                    this.spawnEnzyme('Ligase', index);
                }
            } else if (damageType === this.damageTypes.METHYLATION) {
                if (!base.damaged) {
                    base.damaged = true;
                    base.damageType = this.damageTypes.METHYLATION;
                    this.spawnEnzyme('Demethylase', index);
                }
            } else if (damageType === this.damageTypes.ABASIC) {
                if (!base.damaged) {
                    base.damaged = true;
                    base.damageType = this.damageTypes.ABASIC;
                    this.spawnEnzyme('Polymerase', index);
                }
            } else if (damageType === this.damageTypes.PSEUDOURIDINE) {
                if (!base.damaged && base.type === 'U') {
                    base.damaged = true;
                    base.damageType = this.damageTypes.PSEUDOURIDINE;
                    this.spawnEnzyme('Pus1', index);
                }
            } else if (damageType === this.damageTypes.DECAPPING) {
                // Decapping only happens at the 5' end (index 0)
                const cap = this.rnaStrand[0];
                if (cap && !cap.damaged) {
                    cap.damaged = true;
                    cap.damageType = this.damageTypes.DECAPPING;
                    this.spawnEnzyme('Dcp2', 0);
                }
            }
        }

        spawnEnzyme(name, targetIndex) {
            const startX = Math.random() * this.width;
            const startY = Math.random() > 0.5 ? -50 : this.height + 50;

            if (window.Greenhouse && window.Greenhouse.RNAEnzymeFactory) {
                // Randomly upgrade to advanced enzymes if available
                let finalName = name;
                if (name === 'Ligase' && Math.random() > 0.7) finalName = 'RtcB';
                if (name === 'Demethylase' && Math.random() > 0.7) finalName = 'AlkB';

                const enzyme = window.Greenhouse.RNAEnzymeFactory.create(finalName, targetIndex, startX, startY);
                this.enzymes.push(enzyme);
            } else {
                // Fallback Enzyme Object
                const enzyme = {
                    name: name,
                    targetIndex: targetIndex,
                    x: startX,
                    y: startY,
                    size: 40,
                    speed: 3,
                    state: 'approaching',
                    progress: 0
                };
                this.enzymes.push(enzyme);
            }
        }

        /**
         * Enhancement 25: 5'-3' Exonuclease Decay
         */
        /**
         * Enhancement 14: Trigger Surveillance-Mediated Decay
         */
        triggerSurveillanceDecay(index) {
            console.log("NMD: Surveillance complex detected stall. Triggering decay.");
            // Spawn a specialized decay enzyme at the stall site
            const enzyme = {
                name: 'UPF1/Exosome',
                targetIndex: index,
                x: this.rnaStrand[index].x + 50,
                y: this.rnaStrand[index].y,
                size: 60,
                speed: 1,
                state: 'decaying',
                progress: 0
            };
            this.enzymes.push(enzyme);

            // Visual feedback
            this.rnaStrand[index].flash = 2.0;
        }

        spawnExonuclease(index) {
            const enzyme = {
                name: 'Xrn1',
                targetIndex: index,
                x: this.width / 2,
                y: -50,
                size: 50,
                speed: 1,
                state: 'decaying',
                progress: 0
            };
            this.enzymes.push(enzyme);
        }

        update(dt) {
            if (!dt) dt = 16; // Fallback for first frame
            this.simTime += dt * 0.002;

            // Modular Physics Updates
            if (this.foldingEngine) this.foldingEngine.update(dt);
            if (this.environmentManager) this.environmentManager.update(dt);

            // Enhancement 36: Update BG
            this.bgParticles.forEach(p => {
                p.x += p.vx * (dt / 16);
                p.y += p.vy * (dt / 16);
                if (p.x < -100) p.x = this.width + 100;
                if (p.x > this.width + 100) p.x = -100;
                if (p.y < -100) p.y = this.height + 100;
                if (p.y > this.height + 100) p.y = -100;
            });

            // Enhancement 66: ATP Regeneration
            if (this.atpManager) {
                this.atpManager.update(dt);
            } else if (this.atp < 100) {
                this.atp += 0.05 * (dt / 16);
            }

            // Update RNA strand movement
            this.rnaStrand.forEach((base, i) => {
                // Enhancement 32 & 33: Fluid Dynamics + Thermal Noise
                const fluidMotion = Math.sin(this.simTime + base.offset) * 15;

                // Enhancement 68: Temperature influence on noise
                const noiseScale = this.environmentManager ? this.environmentManager.getNoiseMultiplier() : 1.0;
                const thermalNoise = (Math.random() - 0.5) * 1.5 * noiseScale;

                base.x = base.targetX + fluidMotion + thermalNoise;

                // Enhancement 16: Structural Folding offsets
                if (this.foldingEngine) {
                    const fold = this.foldingEngine.getFoldingOffset(i, this.rnaStrand.length);
                    base.x += fold.x;
                }

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

            // Enhancement 23 & 14: Ribosome Movement + NMD logic
            const currentBase = this.rnaStrand[this.ribosome.index];
            if (currentBase) {
                this.ribosome.x = currentBase.x;
                this.ribosome.y = currentBase.y;

                // Stall at damage
                if (!currentBase.connected || currentBase.damaged) {
                    this.ribosome.stalled = true;
                    this.ribosome.stallTimer += dt;

                    // Enhancement 14: Nonsense-Mediated Decay (Surveillance)
                    if (this.ribosome.stallTimer > 15000) { // Stall for 15s
                        this.triggerSurveillanceDecay(this.ribosome.index);
                        this.ribosome.stallTimer = 0;
                    }
                } else {
                    this.ribosome.stalled = false;
                    this.ribosome.stallTimer = 0;
                    this.ribosome.progress += 0.01 * (dt / 16);
                    if (this.ribosome.progress >= 1) {
                        this.ribosome.progress = 0;
                        this.ribosome.index = (this.ribosome.index + 1) % this.rnaStrand.length;
                    }
                }
            }

            // Update enzymes
            this.enzymes.forEach((enzyme, index) => {
                const targetBase = this.rnaStrand[enzyme.targetIndex];
                if (!targetBase) return;

                // Modular Enzyme Update
                if (enzyme.update && typeof enzyme.update === 'function') {
                    enzyme.update(dt, targetBase, this.atpManager);
                    if (enzyme.state === 'leaving') {
                        if (enzyme.progress >= 1 && enzyme.progress < 1.01) {
                            this.spawnParticles(enzyme.x, enzyme.y);
                            enzyme.progress = 1.01; // Avoid multiple particle spawns
                        }
                        if (enzyme.y < -100 || enzyme.size < 1) {
                            this.enzymes.splice(index, 1);
                        }
                    }
                    return;
                }

                // Fallback Enzyme Logic
                if (enzyme.state === 'approaching') {
                    const dx = targetBase.x - enzyme.x;
                    const dy = targetBase.y - enzyme.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 5) {
                        enzyme.state = 'repairing';
                    } else {
                        enzyme.x += (dx / dist) * enzyme.speed * (dt / 16);
                        enzyme.y += (dy / dist) * enzyme.speed * (dt / 16);
                    }
                } else if (enzyme.state === 'decaying') {
                    // Enhancement 25: Exonuclease digestion
                    enzyme.x = targetBase.x;
                    enzyme.y = targetBase.y;
                    enzyme.progress += 0.005 * (dt / 16);

                    if (enzyme.progress >= 1) {
                        this.rnaStrand.shift();
                        enzyme.progress = 0;
                        if (this.rnaStrand.length === 0) {
                            enzyme.state = 'leaving';
                        }
                    }
                } else if (enzyme.state === 'repairing') {
                    enzyme.x = targetBase.x;
                    enzyme.y = targetBase.y;

                    const currentAtp = this.atpManager ? this.atpManager.atp : this.atp;
                    const atpFactor = Math.max(0.2, currentAtp / 100);
                    const kinetics = 0.01 * atpFactor * (dt / 16);
                    enzyme.progress += kinetics;

                    if (this.atpManager) {
                        this.atpManager.consume(0.1 * (dt / 16));
                    } else if (this.atp > 0) {
                        this.atp -= 0.1 * (dt / 16);
                        this.atpConsumed += 0.1 * (dt / 16);
                    }

                    if (enzyme.progress >= 1) {
                        if (enzyme.name === 'Ligase') {
                            targetBase.connected = true;
                        } else if (enzyme.name === 'Dcp2') {
                            targetBase.flash = 1.0;
                            this.spawnExonuclease(0);
                        } else {
                            targetBase.damaged = false;
                            targetBase.damageType = null;
                        }
                        targetBase.flash = 1.0;
                        enzyme.state = 'leaving';
                        this.spawnParticles(enzyme.x, enzyme.y);
                    }
                } else if (enzyme.state === 'leaving') {
                    enzyme.y -= enzyme.speed * (dt / 16);
                    enzyme.size *= 0.98;
                    if (enzyme.y < -100 || enzyme.size < 1) {
                        this.enzymes.splice(index, 1);
                    }
                }
            });

            // Enhancement 22: Protective Proteins
            this.proteins.forEach((protein, index) => {
                protein.life -= 0.001;
                if (protein.life <= 0) {
                    // Remove protection
                    for (let i = 0; i < protein.length; i++) {
                        if (this.rnaStrand[protein.startIndex + i]) {
                            this.rnaStrand[protein.startIndex + i].protected = false;
                        }
                    }
                    this.proteins.splice(index, 1);
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

            // Enhancement 36: Draw Nucleoplasmic Background
            this.bgParticles.forEach(p => {
                this.ctx.save();
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.ctx.fillStyle = this.colors.PROTEIN;
                this.ctx.globalAlpha = p.alpha;
                this.ctx.fill();
                this.ctx.restore();
            });

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

                // Enhancement 9: Abasic site (no letter)
                if (base.damageType === this.damageTypes.ABASIC) {
                    // Just draw backbone/glow, no letter
                } else {
                    this.ctx.fillStyle = 'white';
                    this.ctx.font = 'bold 11px Arial';
                    this.ctx.textAlign = 'center';
                    // Enhancement 7: Pseudouridine
                    const label = base.damageType === this.damageTypes.PSEUDOURIDINE ? 'Ψ' : base.type;
                    this.ctx.fillText(label, base.x, base.y + 4);
                }

                // Damage indicator
                if (base.damaged) {
                    this.ctx.fillStyle = this.colors.METHYL;
                    if (base.damageType === this.damageTypes.DECAPPING) this.ctx.fillStyle = this.colors.DECAY;
                    if (base.damageType === this.damageTypes.ABASIC) this.ctx.fillStyle = 'rgba(255,255,255,0.2)';
                    if (base.damageType === this.damageTypes.PSEUDOURIDINE) this.ctx.fillStyle = this.colors.PSI;

                    this.ctx.beginPath();
                    this.ctx.arc(base.x + 6, base.y - 6, 5, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            });

            // Enhancement 22: Protective Proteins
            this.proteins.forEach(protein => {
                const startBase = this.rnaStrand[protein.startIndex];
                const endBase = this.rnaStrand[protein.startIndex + protein.length - 1];
                if (startBase && endBase) {
                    this.ctx.save();
                    this.ctx.beginPath();
                    this.ctx.moveTo(startBase.x - 20, startBase.y);
                    this.ctx.lineTo(endBase.x - 20, endBase.y);
                    this.ctx.strokeStyle = this.colors.PROTEIN;
                    this.ctx.lineWidth = 10;
                    this.ctx.lineCap = 'round';
                    this.ctx.globalAlpha = protein.life * 0.5;
                    this.ctx.stroke();

                    this.ctx.fillStyle = 'white';
                    this.ctx.font = 'bold 10px Arial';
                    this.ctx.fillText("HnRNP", startBase.x - 45, (startBase.y + endBase.y) / 2);
                    this.ctx.restore();
                }
            });

            // Enhancement 23: Ribosome
            this.ctx.save();
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = this.colors.RIBOSOME;
            this.ctx.beginPath();
            this.ctx.ellipse(this.ribosome.x, this.ribosome.y, 30, 20, 0, 0, Math.PI * 2);
            this.ctx.fillStyle = this.colors.RIBOSOME;
            this.ctx.globalAlpha = 0.6;
            this.ctx.fill();
            if (this.ribosome.stalled) {
                this.ctx.strokeStyle = 'red';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
            }
            this.ctx.fillStyle = 'white';
            this.ctx.globalAlpha = 1;
            this.ctx.font = 'bold 12px Arial';
            this.ctx.fillText("RIBOSOME", this.ribosome.x, this.ribosome.y + 5);
            this.ctx.restore();

            // Draw Enzymes
            this.enzymes.forEach(enzyme => {
                this.ctx.save();

                // Enhancement 34: Conformational Change (Squeeze)
                let scaleX = 1;
                let scaleY = 1;
                if (enzyme.state === 'repairing') {
                    scaleX = 1 + Math.sin(this.simTime * 10) * 0.1;
                    scaleY = 1 - Math.sin(this.simTime * 10) * 0.1;
                }

                this.ctx.translate(enzyme.x, enzyme.y);
                this.ctx.scale(scaleX, scaleY);

                this.ctx.beginPath();
                this.ctx.arc(0, 0, enzyme.size, 0, Math.PI * 2);
                this.ctx.fillStyle = this.colors.ENZYME;
                this.ctx.fill();
                this.ctx.strokeStyle = this.colors.GLOW;
                this.ctx.setLineDash([5, 5]);
                this.ctx.stroke();

                this.ctx.restore();

                this.ctx.fillStyle = 'white';
                this.ctx.font = '12px Arial';
                this.ctx.fillText(enzyme.name, enzyme.x, enzyme.y - enzyme.size - 5);

                if (enzyme.state === 'repairing' || enzyme.state === 'decaying') {
                    this.ctx.beginPath();
                    this.ctx.rect(enzyme.x - 20, enzyme.y + enzyme.size + 10, 40 * enzyme.progress, 4);
                    this.ctx.fillStyle = enzyme.state === 'decaying' ? this.colors.DECAY : this.colors.GLOW;
                    this.ctx.fill();
                }
            });

            // Enhancement 66: ATP Display
            this.ctx.save();
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'right';

            const atpStatus = this.atpManager ? this.atpManager.getStatus() : {
                atp: Math.floor(this.atp),
                consumed: this.atpConsumed.toFixed(1)
            };

            const t = (k) => window.GreenhouseModelsUtil ? window.GreenhouseModelsUtil.t(k) : k;
            this.ctx.fillText(`ATP: ${atpStatus.atp}%`, this.width - 20, 30);
            this.ctx.fillText(`${t('used')}: ${atpStatus.consumed}`, this.width - 20, 50);

            // Enhancement 67/68: Environment Display
            if (this.environmentManager) {
                const env = this.environmentManager.getStatus();
                this.ctx.font = '12px Arial';
                this.ctx.fillText(`${t('ph')}: ${env.ph}`, this.width - 20, 75);
                this.ctx.fillText(`${t('temp')}: ${env.temp}°C`, this.width - 20, 95);
            }

            this.ctx.beginPath();
            this.ctx.rect(this.width - 120, 15, 100 * (atpStatus.atp / 100), 10);
            this.ctx.fillStyle = this.colors.ATP;
            this.ctx.fill();
            this.ctx.restore();

            // Draw Particles
            this.particles.forEach(p => {
                this.ctx.globalAlpha = p.life;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
                this.ctx.fillStyle = p.color;
                this.ctx.fill();
                this.ctx.globalAlpha = 1;
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
     * @description Entry point for initializing the simulation on a target element.
     */
    function initializeRNARepairSimulation(targetElement, selector = null) {
        if (!targetElement) {
            console.error('Target element for RNA repair simulation not found.');
            return;
        }

        const t = (k) => window.GreenhouseModelsUtil ? window.GreenhouseModelsUtil.t(k) : k;
        const isMobile = window.GreenhouseUtils && window.GreenhouseUtils.isMobileUser();

        if (typeof targetElement === 'string') {
            selector = targetElement;
            targetElement = document.querySelector(selector);
            if (!targetElement) return;
        }

        // Avoid double init/running
        if (targetElement.dataset.initialized === 'true' && window.Greenhouse.rnaSimulation && window.Greenhouse.rnaSimulation.isRunning) return;
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
        canvas.height = isMobile ? 500 : 600;
        canvas.style.display = 'block';
        canvas.style.cursor = 'grab';

        wrapper.appendChild(canvas);

        if (isMobile) {
            // Language toggle for RNA - Mobile Only
            const langBtn = document.createElement('button');
            langBtn.id = 'rna-lang-toggle';
            langBtn.textContent = t('btn_language');
            langBtn.style.cssText = `
                position: absolute; top: 10px; right: 10px; z-index: 100;
                background: #732751; color: white; border: none; padding: 5px 10px;
                border-radius: 20px; cursor: pointer; font-size: 14px; font-family: 'Quicksand', sans-serif;
            `;
            langBtn.onclick = () => {
                if (window.GreenhouseModelsUtil) window.GreenhouseModelsUtil.toggleLanguage();
            };
            wrapper.appendChild(langBtn);
        }

        if (isMobile) {
            const staticHeader = document.querySelector('.page-header');
            if (staticHeader) staticHeader.style.display = 'none';
        }

        const simulation = new RNARepairSimulation(canvas);

        window.Greenhouse = window.Greenhouse || {};
        window.Greenhouse.rnaSimulation = simulation;

        // Expose re-init function on the simulation instance for the utility to call
        // The utility calls appInstance[reinitFunctionName](container, selector)
        // Here, the 'appInstance' is essentially this module scope, but we need to map it.
        // Or we can attach the function to the existing global object used for re-init.
        window.Greenhouse.initializeRNARepairSimulation = initializeRNARepairSimulation;

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

        if (window.GreenhouseUtils) {
            // We pass 'window.Greenhouse' as the appInstance and 'initializeRNARepairSimulation' as the function name
            window.GreenhouseUtils.observeAndReinitializeApplication(targetElement, selector, window.Greenhouse, 'initializeRNARepairSimulation');
            window.GreenhouseUtils.startSentinel(targetElement, selector, window.Greenhouse, 'initializeRNARepairSimulation');

            // Render bottom navigation TOC via common utilities
            if (typeof window.GreenhouseUtils.renderModelsTOC === 'function') {
                window.GreenhouseUtils.renderModelsTOC(targetElement);
            }
        }
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
                await GreenhouseUtils.loadScript('models_util.js', baseUrl);
                await GreenhouseUtils.loadScript('rna_tooltip.js', baseUrl);
                await GreenhouseUtils.loadScript('rna_display.js', baseUrl);
                await GreenhouseUtils.loadScript('rna_legend.js', baseUrl);
            }

            if (targetSelector) {
                console.log('RNA Repair App: Waiting for container:', targetSelector);
                const container = await GreenhouseUtils.waitForElement(targetSelector);
                console.log('RNA Repair App: Auto-initializing...');
                initializeRNARepairSimulation(container, targetSelector);
            }
        } catch (error) {
            console.error('RNA Repair App: Initialization failed', error);
        }
    }

    // Execute main function
    main();
})();
