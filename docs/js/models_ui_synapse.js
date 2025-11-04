
(function() {
    'use strict';

    const GreenhouseModelsUISynapse = {
        drawSynapticView() {
            const ctx = this.contexts.synaptic;
            const canvas = this.canvases.synaptic;
            if (!ctx) return;
            const { width, height } = canvas;
            ctx.clearRect(0, 0, width, height);

            const preSynapticY = height / 2 - 40;
            const postSynapticY = height / 2 + 40;
            const terminalWidth = width / 2.5;

            // Pre-synaptic terminal (more detailed)
            ctx.fillStyle = 'rgba(115, 39, 81, 0.7)';
            ctx.strokeStyle = 'rgba(85, 9, 51, 0.9)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(width / 2 - terminalWidth, preSynapticY - 60);
            ctx.quadraticCurveTo(width / 2, preSynapticY + 20, width / 2 + terminalWidth, preSynapticY - 60);
            ctx.stroke();
            ctx.fill();

            // Synaptic vesicles
            const vesicleCount = 15;
            const releaseZoneY = preSynapticY - 15;
            ctx.fillStyle = 'rgba(255, 220, 150, 0.8)';
            for (let i = 0; i < vesicleCount; i++) {
                const x = width / 2 + (Math.random() - 0.5) * terminalWidth * 1.5;
                // Position vesicles closer to the bottom edge of the terminal
                const y = releaseZoneY - 5 - Math.random() * 40;
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fill();
            }

            // Synaptic Cleft
            const cleftTop = preSynapticY - 10;
            const cleftBottom = postSynapticY - 70;
            const gradient = ctx.createLinearGradient(0, cleftTop, 0, cleftBottom);
            gradient.addColorStop(0, 'rgba(240, 240, 240, 0.1)');
            gradient.addColorStop(0.5, 'rgba(220, 220, 255, 0.3)');
            gradient.addColorStop(1, 'rgba(240, 240, 240, 0.1)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, cleftTop, width, cleftBottom - cleftTop);


            // Post-synaptic terminal (more detailed) with receptors
            ctx.fillStyle = 'rgba(53, 116, 56, 0.7)';
            ctx.strokeStyle = 'rgba(23, 86, 26, 0.9)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(width / 2 - terminalWidth, postSynapticY);
            ctx.quadraticCurveTo(width / 2, postSynapticY - 120, width / 2 + terminalWidth, postSynapticY);
            ctx.stroke();
            ctx.fill();

            // Receptors
            const receptorCount = 20;
            ctx.fillStyle = 'rgba(70, 150, 255, 0.9)';
            for (let i = 0; i < receptorCount; i++) {
                const x = width / 2 + (i - receptorCount / 2) * (terminalWidth * 1.2 / receptorCount);
                const y = postSynapticY - 75;
                ctx.fillRect(x, y, 3, 8);
            }

            this.updateParticles();

            // Synaptic strength indicator (more subtle)
            ctx.fillStyle = `rgba(255, 255, 100, ${this.state.synaptic.synapticWeight * 0.5})`;
            ctx.beginPath();
            const strengthRadius = this.state.synaptic.synapticWeight * 15;
            ctx.arc(width / 2, height / 2 - 25, strengthRadius, 0, Math.PI * 2);
            ctx.fill();
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
                p.opacity -= 0.01; // Fade out

                if (p.y > receptorZoneY || p.opacity <= 0) {
                    // Create a binding flash effect
                    if (p.y > receptorZoneY) {
                        ctx.fillStyle = `rgba(255, 255, 100, ${p.opacity * 2})`;
                        ctx.beginPath();
                        ctx.arc(p.x, receptorZoneY, 8, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    this.state.synaptic.particles.splice(index, 1);
                    return;
                }

                ctx.fillStyle = `rgba(0, 123, 255, ${p.opacity})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fill();
            });

            if (this.state.synaptic.isRunning) {
                const newParticles = this.state.synaptic.neurotransmitters / 25; // Adjusted density
                for (let i = 0; i < newParticles; i++) {
                    this.state.synaptic.particles.push({
                        x: width / 2 + (Math.random() - 0.5) * terminalWidth,
                        y: releaseZoneY + (Math.random() * 20), // Release from a zone
                        vx: (Math.random() - 0.5) * 0.5, // Slight horizontal drift
                        vy: 0.8 + Math.random() * 0.5, // Slower, more deliberate speed
                        radius: 2 + Math.random() * 1,
                        opacity: 0.8 + Math.random() * 0.2 // Initial opacity
                    });
                }
            }
        }
    };

    window.GreenhouseModelsUISynapse = GreenhouseModelsUISynapse;
})();
