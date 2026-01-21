/**
 * @file serotonin_kinetics.js
 * @description Ligand kinetics and pharmacology for the Serotonin simulation.
 */

(function () {
    'use strict';

    const G = window.GreenhouseSerotonin || {};
    window.GreenhouseSerotonin = G;

    G.Kinetics = {
        ligandTypes: {
            'Serotonin': { affinity: 0.8, intrinsicActivity: 1.0, residenceTime: 100, color: '#00ffcc' },
            'Fluoxetine': { type: 'SSRI', target: 'SERT', affinity: 0.95, residenceTime: 500, color: '#ffffff' },
            'Venlafaxine': { type: 'SNRI', target: ['SERT', 'NET'], affinity: 0.85, residenceTime: 400, color: '#e0e0e0' },
            'LSD': { type: 'Psychedelic', target: '5-HT2A', affinity: 0.99, intrinsicActivity: 0.7, residenceTime: 1000, color: '#ff00ff', biased: true },
            'Psilocin': { type: 'Psychedelic', target: '5-HT2A', affinity: 0.95, intrinsicActivity: 0.8, residenceTime: 600, color: '#cc00ff' },
            'Buspirone': { type: 'Partial Agonist', target: '5-HT1A', affinity: 0.7, intrinsicActivity: 0.4, residenceTime: 150, color: '#ffff00' },
            'Sumatriptan': { type: 'Triptan', target: '5-HT1B/D', affinity: 0.9, intrinsicActivity: 0.8, residenceTime: 200, color: '#00ffff' },
            'Clozapine': { type: 'Antipsychotic', target: '5-HT2A', affinity: 0.9, intrinsicActivity: 0.0, residenceTime: 300, color: '#ff6600' },
            'Ondansetron': { type: 'Antiemetic', target: '5-HT3', affinity: 0.85, intrinsicActivity: 0.0, residenceTime: 250, color: '#00ff00' }
        },

        activeLigands: [],

        spawnLigand(name, x, y, z) {
            const proto = this.ligandTypes[name] || this.ligandTypes['Serotonin'];
            this.activeLigands.push({
                name,
                ...proto,
                x: (x !== undefined) ? x : (Math.random() - 0.5) * 200,
                y: (y !== undefined) ? y : -150,
                z: (z !== undefined) ? z : (Math.random() - 0.5) * 200,
                vx: (Math.random() - 0.5) * 2,
                vy: Math.random() * 2,
                vz: (Math.random() - 0.5) * 2,
                boundTo: null,
                bindingTimer: 0
            });
        },

        updateKinetics() {
            // Randomly spawn serotonin if few active
            if (this.activeLigands.length < 15 && Math.random() < 0.05) {
                this.spawnLigand('Serotonin');
            }

            this.activeLigands.forEach(l => {
                if (l.boundTo) {
                    l.bindingTimer--;
                    if (l.bindingTimer <= 0) {
                        // Dissociate
                        l.boundTo.state = 'Inactive';
                        l.boundTo = null;
                        l.vy = -1; // Bounce off
                    } else {
                        // Stay with receptor
                        l.x = l.boundTo.x;
                        l.y = l.boundTo.y - 10;
                        l.z = l.boundTo.z;
                    }
                    return;
                }

                // Brownian motion / Movement
                l.x += l.vx;
                l.y += l.vy;
                l.z += l.vz;

                // Boundary check
                if (Math.abs(l.x) > 300 || Math.abs(l.y) > 300 || Math.abs(l.z) > 300) {
                    l.y = -200; // Recycle
                }

                // Check for binding
                if (G.state.receptors) {
                    G.state.receptors.forEach(r => {
                        if (l.boundTo) return;
                        if (l.target && r.type !== l.target && !l.target.includes(r.type)) return;

                        const dx = l.x - r.x;
                        const dy = l.y - r.y;
                        const dz = l.z - r.z;
                        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);

                        if (dist < 30 && Math.random() < l.affinity * 0.1) {
                            l.boundTo = r;
                            l.bindingTimer = l.residenceTime;
                            r.state = l.intrinsicActivity > 0.5 ? 'Active' : (l.intrinsicActivity > 0 ? 'Intermediate' : 'Inactive');

                            // Biased Agonism implementation
                            if (l.biased) {
                                r.biasedLigand = true;
                            } else {
                                r.biasedLigand = false;
                            }

                            // Visual pulse for binding
                            if (G.Signaling) G.Signaling.triggerPulse(r.x, r.y, r.z);
                        }
                    });
                }
            });
        },

        renderKinetics(ctx, project, cam, w, h) {
            this.activeLigands.forEach(l => {
                const p = project(l.x, l.y, l.z, cam, { width: w, height: h, near: 10, far: 5000 });
                if (p.scale > 0) {
                    ctx.fillStyle = l.color;
                    ctx.shadowBlur = l.boundTo ? 15 : 5;
                    ctx.shadowColor = l.color;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 5 * p.scale, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.shadowBlur = 0;

                    if (l.boundTo && p.scale > 0.5) {
                        ctx.fillStyle = '#fff';
                        ctx.font = `${8 * p.scale}px Arial`;
                        ctx.textAlign = 'center';
                        ctx.fillText(l.name, p.x, p.y - 10 * p.scale);
                    }
                }
            });
        }
    };


    const oldRender = G.render;
    G.render = function() {
        if (oldRender) oldRender.call(G);

        const ctx = G.ctx;
        const w = G.width;
        const h = G.height;
        const cam = G.state.camera;
        if (!window.GreenhouseModels3DMath) return;
        const project = window.GreenhouseModels3DMath.project3DTo2D.bind(window.GreenhouseModels3DMath);

        G.Kinetics.renderKinetics(ctx, project, cam, w, h);
    };

})();
