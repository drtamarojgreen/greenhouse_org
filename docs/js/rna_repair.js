/**
 * @file rna_repair.js
 * @description Interactive 2D simulation of various RNA repair mechanisms.
 * Supports visualization of RNA ligation and oxidative demethylation.
 * Refactored for vertical orientation and external display controls.
 */

(function() {
    'use strict';

    console.log("RNA Repair simulation script loaded.");

    /**
     * @class RNARepairSimulation
     * @description Manages the state and animation of the RNA repair simulation.
     */
    class RNARepairSimulation {
        constructor(canvas) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.width = canvas.width;
            this.height = canvas.height;

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
                GLOW: '#667EEA'
            };

            // Display state
            this.scale = 1.0;
            this.offsetX = 0;
            this.offsetY = 0;

            this.isRunning = true;
            this.init();
        }

        init() {
            this.createRnaStrand();
            this.scheduleDamage();
        }

        /**
         * Creates an initial RNA strand with bases arranged vertically.
         */
        createRnaStrand() {
            const baseCount = 30; // Increased for vertical scrolling
            const spacing = 40;
            const centerX = this.width / 2;
            const baseTypes = ['A', 'U', 'G', 'C'];

            for (let i = 0; i < baseCount; i++) {
                this.rnaStrand.push({
                    x: centerX,
                    targetX: centerX,
                    y: spacing * (i + 1),
                    type: baseTypes[Math.floor(Math.random() * baseTypes.length)],
                    damaged: false,
                    damageType: null,
                    connected: i < baseCount - 1,
                    offset: Math.random() * Math.PI * 2 // For wavy movement
                });
            }
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
                speed: 2,
                state: 'approaching',
                progress: 0
            };
            this.enzymes.push(enzyme);
        }

        update() {
            const time = Date.now() * 0.002;

            // Update RNA strand movement (Wavy in X direction)
            this.rnaStrand.forEach((base, i) => {
                base.x = base.targetX + Math.sin(time + base.offset) * 15;

                // If disconnected vertically, add a gap
                if (!base.connected && i < this.rnaStrand.length - 1) {
                    const idealY = base.y + 60; // Increased gap for break
                    this.rnaStrand[i+1].y += (idealY - this.rnaStrand[i+1].y) * 0.1;
                } else if (i < this.rnaStrand.length - 1) {
                    const idealY = base.y + 40;
                    this.rnaStrand[i+1].y += (idealY - this.rnaStrand[i+1].y) * 0.1;
                }
            });

            // Update enzymes
            this.enzymes.forEach((enzyme, index) => {
                const targetBase = this.rnaStrand[enzyme.targetIndex];

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
            for (let i = 0; i < 10; i++) {
                this.particles.push({
                    x: x,
                    y: y,
                    vx: (Math.random() - 0.5) * 4,
                    vy: (Math.random() - 0.5) * 4,
                    life: 1,
                    color: this.colors.GLOW
                });
            }
        }

        draw() {
            this.ctx.clearRect(0, 0, this.width, this.height);

            this.ctx.save();
            // Apply zoom and pan
            this.ctx.translate(this.offsetX, this.offsetY);
            this.ctx.scale(this.scale, this.scale);

            // Draw Backbone
            this.ctx.beginPath();
            this.ctx.strokeStyle = this.colors.BACKBONE;
            this.ctx.lineWidth = 4;
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

            // Draw Bases
            this.rnaStrand.forEach(base => {
                this.ctx.beginPath();
                this.ctx.arc(base.x, base.y, 8, 0, Math.PI * 2);
                this.ctx.fillStyle = this.colors[base.type];
                this.ctx.fill();

                if (base.damaged && base.damageType === this.damageTypes.METHYLATION) {
                    this.ctx.beginPath();
                    this.ctx.arc(base.x + 5, base.y - 5, 4, 0, Math.PI * 2);
                    this.ctx.fillStyle = this.colors.METHYL;
                    this.ctx.fill();
                    this.ctx.strokeStyle = 'white';
                    this.ctx.lineWidth = 1;
                    this.ctx.stroke();
                }

                this.ctx.fillStyle = 'white';
                this.ctx.font = 'bold 10px Arial';
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
                this.ctx.globalAlpha = p.life;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
                this.ctx.fillStyle = p.color;
                this.ctx.fill();
                this.ctx.globalAlpha = 1;
            });

            this.ctx.restore();
        }

        animate() {
            if (!this.isRunning) return;
            this.update();
            this.draw();

            // Notify legend if it exists
            if (window.Greenhouse.RNALegend && window.Greenhouse.RNALegend.update) {
                window.Greenhouse.RNALegend.update(this.ctx, this.width, this.height, this.colors);
            }

            requestAnimationFrame(() => this.animate());
        }

        stop() {
            this.isRunning = false;
        }
    }

    /**
     * @function initializeRNARepairSimulation
     * @description Entry point for initializing the simulation on a target element.
     */
    function initializeRNARepairSimulation(targetSelector) {
        const targetElement = document.querySelector(targetSelector);
        if (!targetElement) {
            console.error('Target element for RNA repair simulation not found:', targetSelector);
            return;
        }

        const canvas = document.createElement('canvas');
        canvas.id = 'rnaRepairCanvas';

        const rect = targetElement.getBoundingClientRect();
        canvas.width = rect.width || 800;
        canvas.height = 600; // Increased height

        canvas.style.display = 'block';
        canvas.style.cursor = 'grab';
        
        targetElement.innerHTML = '';
        targetElement.appendChild(canvas);

        const simulation = new RNARepairSimulation(canvas);

        // Expose simulation instance
        window.Greenhouse = window.Greenhouse || {};
        window.Greenhouse.rnaSimulation = simulation;

        // Initialize Display Controls if available
        if (window.Greenhouse.initializeRNADisplay) {
            window.Greenhouse.initializeRNADisplay(simulation);
        }

        simulation.animate();

        window.addEventListener('resize', () => {
            const newRect = targetElement.getBoundingClientRect();
            canvas.width = newRect.width;
            simulation.width = canvas.width;
        });

        console.log('RNA Repair simulation initialized (Vertical).');
    }

    window.Greenhouse = window.Greenhouse || {};
    window.Greenhouse.initializeRNARepairSimulation = initializeRNARepairSimulation;
    window.Greenhouse.RNARepairSimulation = RNARepairSimulation;

})();
