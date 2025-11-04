
(function() {
    'use strict';

    const GreenhouseModelsUISynapse = {
        _drawMitochondrion(ctx, x, y) {
            ctx.fillStyle = 'rgba(255, 182, 193, 0.4)';
            ctx.strokeStyle = 'rgba(255, 105, 180, 0.6)';
            ctx.lineWidth = 1;
            // Outer membrane
            ctx.beginPath();
            ctx.ellipse(x, y, 25, 12, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            // Inner membrane (cristae)
            ctx.beginPath();
            ctx.moveTo(x - 20, y);
            ctx.bezierCurveTo(x - 10, y - 10, x, y + 10, x + 20, y);
            ctx.stroke();
        },

        _drawAstrocyte(ctx, width, height) {
            ctx.fillStyle = 'rgba(200, 200, 200, 0.2)';
            ctx.strokeStyle = 'rgba(150, 150, 150, 0.4)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-10, height);
            ctx.bezierCurveTo(width * 0.2, height - 50, width * 0.8, height - 60, width + 10, height);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        },

        drawSynapticView() {
            const ctx = this.contexts.synaptic;
            const canvas = this.canvases.synaptic;
            if (!ctx) return;
            const { width, height } = canvas;
            ctx.clearRect(0, 0, width, height);

            this._drawAstrocyte(ctx, width, height);

            const preSynapticY = height / 2 - 40;
            const postSynapticY = height / 2 + 40;
            const terminalWidth = width / 2.5;

            // Pre-synaptic terminal
            ctx.fillStyle = 'rgba(115, 39, 81, 0.7)';
            ctx.strokeStyle = 'rgba(85, 9, 51, 0.9)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(width / 2 - terminalWidth, preSynapticY - 60);
            ctx.quadraticCurveTo(width / 2, preSynapticY + 20, width / 2 + terminalWidth, preSynapticY - 60);
            ctx.stroke();
            ctx.fill();

            this._drawMitochondrion(ctx, width / 2 + terminalWidth - 50, preSynapticY - 40);

            // Synaptic vesicles
            this.state.synaptic.vesicles.forEach(vesicle => {
                const x = width / 2 + (vesicle.x - 0.5) * terminalWidth * 1.5;
                let y = preSynapticY - 25 - vesicle.y * 40;

                if (vesicle.state === 'FUSING') {
                    vesicle.fuseProgress += 0.05;
                    y = preSynapticY - 20 + vesicle.fuseProgress * 15;
                    if (vesicle.fuseProgress >= 1) {
                        vesicle.state = 'IDLE';
                        vesicle.fuseProgress = 0;
                    }
                }

                ctx.fillStyle = 'rgba(255, 220, 150, 0.8)';
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fill();
            });

            // Post-synaptic terminal
            ctx.fillStyle = 'rgba(53, 116, 56, 0.7)';
            ctx.strokeStyle = 'rgba(23, 86, 26, 0.9)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(width / 2 - terminalWidth, postSynapticY);
            ctx.quadraticCurveTo(width / 2, postSynapticY - 120, width / 2 + terminalWidth, postSynapticY);
            ctx.stroke();
            ctx.fill();

            // Receptors
            this.state.synaptic.receptors.forEach((receptor, i) => {
                const x = width / 2 + (i - this.state.synaptic.receptors.length / 2) * (terminalWidth * 1.2 / this.state.synaptic.receptors.length);
                const y = postSynapticY - 75;
                ctx.fillStyle = receptor.isBound ? 'rgba(255, 255, 100, 0.9)' : 'rgba(70, 150, 255, 0.9)';
                ctx.fillRect(x, y, 3, 8);
            });

            this.updateParticles();
        },

        updateParticles() {
            const ctx = this.contexts.synaptic;
            const canvas = this.canvases.synaptic;
            const { width, height } = canvas;
            const releaseZoneY = height / 2 - 55;
            const receptorZoneY = height / 2 - 5;
            const terminalWidth = width / 2.5;

            this.state.synaptic.particles.forEach((p, index) => {
                p.y += p.vy;
                p.x += p.vx;
                p.opacity -= 0.01;

                if (p.y > receptorZoneY || p.opacity <= 0) {
                    this.state.synaptic.particles.splice(index, 1);
                    const receptorIndex = Math.floor(Math.random() * this.state.synaptic.receptors.length);
                    const receptor = this.state.synaptic.receptors[receptorIndex];
                    if (receptor) {
                        receptor.isBound = true;
                        receptor.boundUntil = Date.now() + 200;
                    }
                } else {
                    ctx.fillStyle = `rgba(0, 123, 255, ${p.opacity})`;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                    ctx.fill();
                }
            });

            // Unbind receptors
            const now = Date.now();
            this.state.synaptic.receptors.forEach(receptor => {
                if (receptor.isBound && now > receptor.boundUntil) {
                    receptor.isBound = false;
                }
            });

            if (this.state.synaptic.isRunning) {
                const newParticles = this.state.synaptic.neurotransmitters / 25;
                for (let i = 0; i < newParticles; i++) {
                    this.state.synaptic.particles.push({
                        x: width / 2 + (Math.random() - 0.5) * terminalWidth,
                        y: releaseZoneY + (Math.random() * 20),
                        vx: (Math.random() - 0.5) * 0.5,
                        vy: 0.8 + Math.random() * 0.5,
                        radius: 2 + Math.random() * 1,
                        opacity: 0.8 + Math.random() * 0.2
                    });
                }
            }
        }
    };

    window.GreenhouseModelsUISynapse = GreenhouseModelsUISynapse;
})();
