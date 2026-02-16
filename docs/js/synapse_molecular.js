// docs/js/synapse_molecular.js

(function () {
    'use strict';

    const G = window.GreenhouseSynapseApp || {};
    window.GreenhouseSynapseApp = G;

    G.Molecular = {
        ecmParticles: [],
        cascades: [],
        retrogradeSignals: [],
        isoforms: [],

        drawSNARE(ctx, x, y, progress) {
            ctx.save();
            ctx.strokeStyle = '#ff9900';
            ctx.lineWidth = 2;
            ctx.setLineDash([2, 2]);
            ctx.beginPath();
            ctx.moveTo(x - 10, y);
            ctx.quadraticCurveTo(x, y - 20 * progress, x + 10, y);
            ctx.stroke();
            ctx.restore();
        },

        drawLipidBilayer(ctx, x, y, width, isPost, cholesterol = 1.0) {
            ctx.save();
            const headRadius = 3;
            const tailLength = 8;
            const spacing = 7;
            const count = Math.floor(width / spacing);

            const time = Date.now() / 1000;
            const fluidity = 1.0 / (cholesterol + 0.1);

            ctx.fillStyle = isPost ? '#2c3e50' : '#707870';
            ctx.strokeStyle = isPost ? 'rgba(44, 62, 80, 0.5)' : 'rgba(112, 120, 112, 0.5)';
            ctx.lineWidth = 1;

            for (let i = 0; i < count; i++) {
                const ox = x + i * spacing;
                const offset = Math.sin(time * 2 * fluidity + i * 0.5) * 2;
                const curY = y + offset;

                ctx.beginPath();
                ctx.arc(ox, curY - tailLength, headRadius, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(ox, curY - tailLength);
                ctx.lineTo(ox - 2, curY);
                ctx.moveTo(ox, curY - tailLength);
                ctx.lineTo(ox + 2, curY);
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(ox, curY + tailLength, headRadius, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(ox, curY + tailLength);
                ctx.lineTo(ox - 2, curY);
                ctx.moveTo(ox, curY + tailLength);
                ctx.lineTo(ox + 2, curY);
                ctx.stroke();
            }

            // Cell Membrane Label
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.font = 'italic 9px Arial';
            ctx.fillText(isPost ? 'POST-SYNAPTIC CELL MEMBRANE' : 'PRE-SYNAPTIC CELL MEMBRANE', x, y + 25);
            ctx.restore();
        },

        drawElectrochemicalGradient(ctx, x, y, direction = 1) {
            ctx.save();
            const time = Date.now() / 1000;
            const alpha = 0.3 + Math.sin(time * 3) * 0.2;
            ctx.strokeStyle = `rgba(0, 242, 255, ${alpha})`;
            ctx.lineWidth = 2;

            // Draw arrow indicating gradient
            const arrowY = y + (Math.sin(time * 5) * 10);
            ctx.beginPath();
            ctx.moveTo(x, arrowY);
            ctx.lineTo(x, arrowY + 20 * direction);
            ctx.lineTo(x - 5, arrowY + 15 * direction);
            ctx.moveTo(x, arrowY + 20 * direction);
            ctx.lineTo(x + 5, arrowY + 15 * direction);
            ctx.stroke();

            ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
            ctx.font = 'bold 8px Arial';
            ctx.fillText('ELECTROCHEMICAL GRADIENT', x + 10, arrowY + 10);
            ctx.restore();
        },

        drawPatchPipette(ctx, x, y) {
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 2;

            ctx.beginPath();
            ctx.moveTo(x - 40, y - 150);
            ctx.lineTo(x - 5, y - 10);
            ctx.lineTo(x + 5, y - 10);
            ctx.lineTo(x + 40, y - 150);
            ctx.closePath();
            ctx.stroke();
            ctx.fill();

            ctx.shadowBlur = 15;
            ctx.shadowColor = '#fff';
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(x, y - 5, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        },

        drawSolvationShell(ctx, x, y, radius, charge) {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';

            const gradient = ctx.createRadialGradient(x, y, 2, x, y, radius * 5);
            gradient.addColorStop(0, 'rgba(0, 242, 255, 0.3)');
            gradient.addColorStop(1, 'transparent');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, radius * 5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#fff';
            for(let i=0; i<4; i++) {
                const angle = (Date.now() / 500) + (i * Math.PI / 2);
                const wx = x + Math.cos(angle) * (radius * 3);
                const wy = y + Math.sin(angle) * (radius * 3);
                ctx.beginPath();
                ctx.arc(wx, wy, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        },

        drawPhosphorylation(ctx, x, y, frame) {
            // Enhancement #38: Phosphorylation state visualization
            ctx.save();
            const glow = (Math.sin(frame * 0.1) + 1) * 0.5;
            ctx.strokeStyle = `rgba(255, 255, 0, ${glow})`;
            ctx.lineWidth = 2;
            ctx.setLineDash([2, 2]);
            ctx.beginPath();
            ctx.arc(x, y, 15, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = '#FFFF00';
            ctx.font = 'bold 8px Arial';
            ctx.fillText('P', x + 10, y - 10);
            ctx.restore();
        },

        drawECM(ctx, w, h) {
            if (this.ecmParticles.length === 0) {
                for (let i = 0; i < 50; i++) {
                    this.ecmParticles.push({
                        x: Math.random() * w,
                        y: Math.random() * h,
                        r: Math.random() * 2 + 0.5,
                        alpha: Math.random() * 0.2 + 0.05,
                        speed: Math.random() * 0.2 + 0.1
                    });
                }
            }

            ctx.save();
            this.ecmParticles.forEach(p => {
                p.y += p.speed;
                if (p.y > h) p.y = 0;
                ctx.fillStyle = `rgba(150, 150, 150, ${p.alpha})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.restore();
        },

        drawAstrocyte(ctx, w, h) {
            const ax = w * 0.8;
            const ay = h * 0.5;

            ctx.save();
            ctx.strokeStyle = 'rgba(100, 150, 255, 0.4)';
            ctx.lineWidth = 2;
            ctx.beginPath();

            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const r = 30 + Math.sin(Date.now() / 500 + i) * 5;
                ctx.moveTo(ax, ay);
                ctx.lineTo(ax + Math.cos(angle) * r, ay + Math.sin(angle) * r);
            }
            ctx.stroke();

            ctx.fillStyle = 'rgba(100, 150, 255, 0.1)';
            ctx.beginPath();
            ctx.arc(ax, ay, 15, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        },

        drawMitochondria(ctx, x, y, atp) {
            ctx.save();
            const glow = atp / 100;
            ctx.shadowBlur = 10 * glow;
            ctx.shadowColor = '#FFD700';
            ctx.fillStyle = `rgba(100, 20, 20, 0.8)`;
            ctx.beginPath();
            ctx.ellipse(x, y, 20, 35, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = `rgba(255, 215, 0, ${0.2 + glow * 0.5})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            for(let i=0; i<5; i++) {
                const my = y - 25 + i * 12;
                ctx.moveTo(x - 12, my);
                ctx.lineTo(x + 12, my + 4);
            }
            ctx.stroke();
            ctx.restore();
        },

        drawScaffolding(ctx, w, h, plasticity, showIsoforms) {
            const surfaceY = h * 0.68;
            ctx.save();
            ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
            const scale = 40 * plasticity;
            ctx.beginPath();
            ctx.moveTo(w * 0.3, surfaceY + 5);
            ctx.lineTo(w * 0.7, surfaceY + 5);
            ctx.lineTo(w * 0.65, surfaceY + 5 + scale);
            ctx.lineTo(w * 0.35, surfaceY + 5 + scale);
            ctx.closePath();
            ctx.fill();

            if (showIsoforms) {
                if (this.isoforms.length === 0) {
                    for(let i=0; i<30; i++) {
                        this.isoforms.push({
                            x: w * (0.35 + Math.random() * 0.3),
                            y: surfaceY + 10 + Math.random() * 20,
                            type: Math.random() > 0.5 ? 'PSD-95α' : 'PSD-95β'
                        });
                    }
                }
                this.isoforms.forEach(f => {
                    ctx.fillStyle = f.type === 'PSD-95α' ? '#00F2FF' : '#FF1493';
                    ctx.beginPath();
                    ctx.arc(f.x, f.y, 2, 0, Math.PI * 2);
                    ctx.fill();
                });
            }

            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 9px Arial';
            ctx.fillText('POST-SYNAPTIC DENSITY (PSD-95)', w * 0.5 - 70, surfaceY + 15);
            ctx.restore();
        },

        drawGPCRTopology(ctx, x, y) {
            ctx.save();
            ctx.strokeStyle = '#D32F2F';
            ctx.lineWidth = 3;
            ctx.beginPath();
            for(let i=0; i<7; i++) {
                const tx = x - 12 + i * 4;
                ctx.moveTo(tx, y - 5);
                ctx.lineTo(tx, y + 15);
                if(i < 6) {
                    const nextX = tx + 4;
                    if(i % 2 === 0) {
                        ctx.bezierCurveTo(tx, y + 20, nextX, y + 20, nextX, y + 15);
                    } else {
                        ctx.bezierCurveTo(tx, y - 10, nextX, y - 10, nextX, y - 5);
                    }
                }
            }
            ctx.stroke();

            // Label Termini and transmembrane region
            ctx.fillStyle = '#fff';
            ctx.font = '7px Arial';
            ctx.fillText('N-term', x - 15, y - 15);
            ctx.fillText('C-term', x - 15, y + 35);
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.fillText('TRANSMEMBRANE HELICES', x + 20, y + 5);

            ctx.restore();
        },

        triggerCascade(x, y, color = 'rgba(255, 100, 255, ') {
            this.cascades.push({ x, y, r: 5, alpha: 1.0, color });
        },

        drawCascades(ctx) {
            ctx.save();
            for (let i = this.cascades.length - 1; i >= 0; i--) {
                const c = this.cascades[i];
                c.r += 2;
                c.alpha -= 0.02;
                c.y += 1;

                if (c.alpha <= 0) {
                    this.cascades.splice(i, 1);
                } else {
                    const colorStr = c.color.endsWith(',') ? `${c.color}${c.alpha})` : c.color;
                    ctx.strokeStyle = colorStr;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
                    ctx.stroke();
                }
            }
            ctx.restore();
        },

        triggerRetrograde(x, y) {
            this.retrogradeSignals.push({
                x, y, vx: (Math.random() - 0.5) * 1.5, vy: -2 - Math.random() * 2, life: 1.0
            });
        },

        drawRetrograde(ctx, w, h) {
            ctx.save();
            const chem = G.Chemistry.retrograde.endocannabinoid;
            for (let i = this.retrogradeSignals.length - 1; i >= 0; i--) {
                const s = this.retrogradeSignals[i];
                s.x += s.vx;
                s.y += s.vy;
                s.life -= 0.01;

                if (s.life <= 0 || s.y < h * 0.35) {
                    this.retrogradeSignals.splice(i, 1);
                } else {
                    ctx.fillStyle = chem.color;
                    ctx.globalAlpha = s.life;
                    ctx.beginPath();
                    ctx.arc(s.x, s.y, 4, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.shadowBlur = 10;
                    ctx.shadowColor = chem.color;
                    ctx.stroke();
                }
            }
            ctx.restore();
        }
    };
})();
