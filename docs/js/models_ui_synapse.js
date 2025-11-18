
(function() {
    'use strict';

    const GreenhouseModelsUISynapse = {
        _renderElement(ctx, element, { w, h, tw, psy }) {
            if (!element) return;

            ctx.save();

            if (element.style) {
                for (const [key, value] of Object.entries(element.style)) {
                    ctx[key] = value;
                }
            }

            let path;
            switch (element.type) {
                case 'path':
                    path = new Path2D(GreenhouseModelsUtil.parseDynamicPath(element.path, { w, h, tw, psy }));
                    if(ctx.fillStyle) ctx.fill(path);
                    if(ctx.strokeStyle) ctx.stroke(path);
                    break;
                case 'ellipse':
                    ctx.beginPath();
                    const cx = eval(GreenhouseModelsUtil.parseDynamicPath(element.cx, { w, h, tw, psy }));
                    const cy = eval(GreenhouseModelsUtil.parseDynamicPath(element.cy, { w, h, tw, psy }));
                    ctx.ellipse(cx, cy, element.rx, element.ry, 0, 0, Math.PI * 2);
                    if(ctx.fillStyle) ctx.fill();
                    if(ctx.strokeStyle) ctx.stroke();
                    break;
            }

            if (element.children) {
                element.children.forEach(child => this._renderElement(ctx, child, { w, h, tw, psy }));
            }

            ctx.restore();
        },

        drawSynapticView() {
            const ctx = this.contexts.synaptic;
            const canvas = this.canvases.synaptic;
            if (!ctx || !this.state.synapseData || !this.state.synapseData.elements) return;

            const { width, height } = canvas;
            ctx.clearRect(0, 0, width, height);
            if (this.state.darkMode) {
                ctx.fillStyle = '#1A1A1A';
                ctx.fillRect(0, 0, width, height);
            }

            const renderContext = {
                w: width,
                h: height,
                tw: width / 2.5,
                psy: height / 2 - 40
            };

            this.state.synapseData.elements.forEach(element => {
                this._renderElement(ctx, element, renderContext);
            });

            const preSynapticY = height / 2 - 40;
            const terminalWidth = width / 2.5;

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
                ctx.arc(x, y, 6, 0, Math.PI * 2);
                ctx.fill();
            });

            const postSynapticY = height / 2 + 40;
            // Receptors
            this.state.synaptic.receptors.forEach((receptor, i) => {
                const x = width / 2 + (i - this.state.synaptic.receptors.length / 2) * (terminalWidth * 1.2 / this.state.synaptic.receptors.length);
                const y = postSynapticY - 75;
                ctx.fillStyle = receptor.isBound ? 'rgba(255, 255, 100, 0.9)' : 'rgba(70, 150, 255, 0.9)';
                ctx.fillRect(x, y, 5, 10);
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
