/**
 * @file rna_repair.js
 * @description Interactive 2D simulation of various RNA repair mechanisms.
 * Supports visualization of RNA ligation and oxidative demethylation.
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

            this.isRunning = true;
            this.init();
        }

        init() {
            this.createRnaStrand();
            this.scheduleDamage();
        }

        /**
         * Creates an initial RNA strand with bases.
         */
        createRnaStrand() {
            const baseCount = 20;
            const spacing = this.width / (baseCount + 1);
            const centerY = this.height / 2;
            const baseTypes = ['A', 'U', 'G', 'C'];

            for (let i = 0; i < baseCount; i++) {
                this.rnaStrand.push({
                    x: spacing * (i + 1),
                    y: centerY,
                    targetY: centerY,
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
            // Only introduce damage if there isn't too much already
            const damagedCount = this.rnaStrand.filter(b => b.damaged || !b.connected).length;
            if (damagedCount > 3) return;

            const damageType = Math.random() > 0.5 ? this.damageTypes.BREAK : this.damageTypes.METHYLATION;
            const index = Math.floor(Math.random() * (this.rnaStrand.length - 2)) + 1;

            if (damageType === this.damageTypes.BREAK) {
                if (this.rnaStrand[index].connected) {
                    console.log(`RNA Damage: Break at index ${index}`);
                    this.rnaStrand[index].connected = false;
                    this.spawnEnzyme('Ligase', index);
                }
            } else {
                if (!this.rnaStrand[index].damaged) {
                    console.log(`RNA Damage: Methylation at index ${index}`);
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
                x: Math.random() > 0.5 ? -50 : this.width + 50,
                y: Math.random() * this.height,
                size: 40,
                speed: 2,
                state: 'approaching', // approaching, repairing, leaving
                progress: 0
            };
            this.enzymes.push(enzyme);
        }

        update() {
            const time = Date.now() * 0.002;

            // Update RNA strand movement
            this.rnaStrand.forEach((base, i) => {
                base.y = base.targetY + Math.sin(time + base.offset) * 15;

                // If disconnected, add a gap
                if (!base.connected && i < this.rnaStrand.length - 1) {
                    this.rnaStrand[i+1].x += ( (base.x + (this.width / (this.rnaStrand.length + 1)) + 20) - this.rnaStrand[i+1].x ) * 0.1;
                } else if (i < this.rnaStrand.length - 1) {
                    const idealX = base.x + (this.width / (this.rnaStrand.length + 1));
                    this.rnaStrand[i+1].x += (idealX - this.rnaStrand[i+1].x) * 0.1;
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
                        // Complete repair
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
                    if (enzyme.y < -50 || enzyme.size < 1) {
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

                // Draw damage (Methylation)
                if (base.damaged && base.damageType === this.damageTypes.METHYLATION) {
                    this.ctx.beginPath();
                    this.ctx.arc(base.x + 5, base.y - 5, 4, 0, Math.PI * 2);
                    this.ctx.fillStyle = this.colors.METHYL;
                    this.ctx.fill();
                    this.ctx.strokeStyle = 'white';
                    this.ctx.lineWidth = 1;
                    this.ctx.stroke();
                }

                // Draw Text
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

                // Progress bar
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

            // UI Legend
            this.drawLegend();
        }

        drawLegend() {
            const startX = 20;
            const startY = this.height - 100;
            const itemHeight = 25;

            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText('RNA Repair Mechanisms:', startX, startY - 10);

            const items = [
                { color: this.colors.METHYL, text: 'Methylation (Damage)' },
                { color: this.colors.BACKBONE, text: 'Phosphodiester Backbone' },
                { color: this.colors.ENZYME, text: 'Repair Enzymes (Ligase/AlkB)' }
            ];

            items.forEach((item, i) => {
                this.ctx.beginPath();
                this.ctx.arc(startX + 10, startY + i * itemHeight, 6, 0, Math.PI * 2);
                this.ctx.fillStyle = item.color;
                this.ctx.fill();
                if (item.color === this.colors.ENZYME) {
                    this.ctx.strokeStyle = this.colors.GLOW;
                    this.ctx.stroke();
                }
                this.ctx.fillStyle = '#cbd5e0';
                this.ctx.font = '12px Arial';
                this.ctx.fillText(item.text, startX + 25, startY + i * itemHeight + 5);
            });
        }

        animate() {
            if (!this.isRunning) return;
            this.update();
            this.draw();
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

        // Create a canvas element
        const canvas = document.createElement('canvas');
        canvas.id = 'rnaRepairCanvas';

        // Match container dimensions
        const rect = targetElement.getBoundingClientRect();
        canvas.width = rect.width || 800;
        canvas.height = 500;
        
        // Style the canvas
        canvas.style.display = 'block';
        canvas.style.cursor = 'crosshair';
        
        // Append canvas to the target element
        targetElement.innerHTML = '';
        targetElement.appendChild(canvas);

        const simulation = new RNARepairSimulation(canvas);
        simulation.animate();

        // Handle resize
        window.addEventListener('resize', () => {
            const newRect = targetElement.getBoundingClientRect();
            canvas.width = newRect.width;
            simulation.width = canvas.width;
        });

        console.log('RNA Repair simulation initialized.');

        // Expose simulation instance if needed
        window.Greenhouse.rnaSimulation = simulation;
    }

    // Expose the initialization function to the global scope to be called by greenhouse.js
    window.Greenhouse = window.Greenhouse || {};
    window.Greenhouse.initializeRNARepairSimulation = initializeRNARepairSimulation;

})();
