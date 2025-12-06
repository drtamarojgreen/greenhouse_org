
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

        _renderCytoplasm(ctx, width, height, density) {
            if (!density || density <= 0) return;
            ctx.save();
            ctx.globalAlpha = density * 0.1;
            ctx.fillStyle = this.state.darkMode ? '#333' : '#ddd';

            // Draw noise pattern
            for (let i = 0; i < width * height * 0.001 * density; i++) {
                 const x = Math.random() * width;
                 const y = Math.random() * height;
                 // Avoid the synaptic cleft area approximately
                 if (y > height/2 - 30 && y < height/2 + 30) continue;

                 ctx.beginPath();
                 ctx.arc(x, y, 1, 0, Math.PI * 2);
                 ctx.fill();
            }
            ctx.restore();
        },

        _renderMembraneChannels(ctx, channels, w, h, terminalWidth) {
            if (!channels) return;
            const preSynapticY = h / 2 - 40;
            // Draw on Pre-synaptic membrane line (roughly)

            ctx.save();
            channels.forEach(channel => {
                const x = w / 2 + channel.x;
                // Determine Y based on channel type or id if needed, but here we place them on the membrane
                const y = preSynapticY;

                ctx.fillStyle = channel.state === 'open' ? '#4CAF50' : '#F44336';
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 1;

                // Draw a small gate/tunnel
                ctx.beginPath();
                ctx.rect(x - 5, y - 5, 10, 10);
                ctx.fill();
                ctx.stroke();

                if (channel.state === 'open') {
                    // Draw flow
                    ctx.beginPath();
                    ctx.moveTo(x, y - 5);
                    ctx.lineTo(x, y + 5);
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                    ctx.stroke();
                }
            });
            ctx.restore();
        },

        _renderKinases(ctx, kinases, w, h) {
             if (!kinases) return;
             const postSynapticY = h / 2 + 50; // Below synapse

             ctx.save();
             kinases.forEach(k => {
                 const cx = w / 2 + k.x;
                 const cy = postSynapticY + k.y; // Relative to post-synaptic area start

                 ctx.fillStyle = k.active ? '#FFeb3b' : '#9c27b0';
                 ctx.beginPath();
                 // Pac-man shape
                 ctx.arc(cx, cy, 5, 0.2 * Math.PI, 1.8 * Math.PI);
                 ctx.lineTo(cx, cy);
                 ctx.fill();

                 // Movement logic (velocity based if available, otherwise jitter)
                 if (k.vx !== undefined && k.vy !== undefined) {
                     k.x += k.vx;
                     k.y += k.vy;
                     // Bounce within bounds (approximate)
                     if (Math.abs(k.x) > 100) k.vx *= -1;
                     if (k.y < 20 || k.y > 100) k.vy *= -1;
                 } else {
                     k.x += (Math.random() - 0.5) * 0.5;
                     k.y += (Math.random() - 0.5) * 0.5;
                 }
             });
             ctx.restore();
        },

        _renderRNA(ctx, rnaList, w, h) {
            if (!rnaList) return;
            const postSynapticY = h / 2 + 80;

            ctx.save();
            ctx.strokeStyle = this.state.darkMode ? '#00bcd4' : '#0097a7';
            ctx.lineWidth = 2;

            rnaList.forEach(rna => {
                const cx = w / 2 + rna.x;
                const cy = postSynapticY + rna.y;

                // Draw a small squiggly line
                ctx.beginPath();
                ctx.moveTo(cx - 5, cy);
                for(let i=0; i<10; i++) {
                    ctx.lineTo(cx - 5 + i, cy + Math.sin(i + rna.phase + Date.now()/200) * 2);
                }
                ctx.stroke();
            });
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

            // Phase 2: Render Cytoplasm
            this._renderCytoplasm(ctx, width, height, this.state.synaptic.cytoplasmDensity);

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

            // Phase 2: Render Membrane Channels
            this._renderMembraneChannels(ctx, this.state.synaptic.ionChannels, width, height, terminalWidth);
            // Label for Ion Channels
            if (this.state.synaptic.ionChannels && this.state.synaptic.ionChannels.length > 0) {
                 ctx.fillStyle = this.state.darkMode ? '#aaa' : '#555';
                 ctx.font = '10px Arial';
                 ctx.textAlign = 'right';
                 ctx.fillText(this.util.t('label_ion_channel'), width/2 - terminalWidth/2 - 10, preSynapticY);
            }

            // Phase 2: Render Kinases
            this._renderKinases(ctx, this.state.synaptic.proteinKinases, width, height);
             // Label for Kinases
            if (this.state.synaptic.proteinKinases && this.state.synaptic.proteinKinases.length > 0) {
                 ctx.fillStyle = this.state.darkMode ? '#aaa' : '#555';
                 ctx.font = '10px Arial';
                 ctx.textAlign = 'left';
                 ctx.fillText(this.util.t('label_kinase'), width/2 + 50, height/2 + 50);
            }

            // Phase 2: Render RNA
            this._renderRNA(ctx, this.state.synaptic.rna, width, height);
             // Label for RNA
            if (this.state.synaptic.rna && this.state.synaptic.rna.length > 0) {
                 ctx.fillStyle = this.state.darkMode ? '#aaa' : '#555';
                 ctx.font = '10px Arial';
                 ctx.textAlign = 'right';
                 ctx.fillText(this.util.t('label_rna'), width/2 - 50, height/2 + 80);
            }

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
            // Label for Vesicles
            ctx.fillStyle = this.state.darkMode ? '#aaa' : '#555';
            ctx.font = '10px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(this.util.t('label_vesicle'), width/2 + terminalWidth/2 + 10, preSynapticY - 40);

            const postSynapticY = height / 2 + 40;
            // Receptors
            this.state.synaptic.receptors.forEach((receptor, i) => {
                const x = width / 2 + (i - this.state.synaptic.receptors.length / 2) * (terminalWidth * 1.2 / this.state.synaptic.receptors.length);
                const y = postSynapticY - 75;
                ctx.fillStyle = receptor.isBound ? 'rgba(255, 255, 100, 0.9)' : 'rgba(70, 150, 255, 0.9)';
                ctx.fillRect(x, y, 5, 10);
            });
            // Label for Receptors
            ctx.fillStyle = this.state.darkMode ? '#aaa' : '#555';
            ctx.font = '10px Arial';
            ctx.textAlign = 'right';
            ctx.fillText(this.util.t('label_receptor'), width/2 - terminalWidth/2 - 10, postSynapticY - 70);

            // Label for Neurotransmitters (if running)
            if (this.state.synaptic.isRunning) {
                 ctx.textAlign = 'left';
                 ctx.fillText(this.util.t('label_neurotransmitter'), width/2 + 20, height/2);
            }

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

                    // Enhancement #7: Neurotransmitter Shapes
                    // Render distinct shapes to mimic different molecular structures
                    ctx.beginPath();
                    if (p.shape === 'square') {
                        // Represents larger peptide chains
                        ctx.fillRect(p.x - p.radius, p.y - p.radius, p.radius * 2, p.radius * 2);
                    } else if (p.shape === 'triangle') {
                        // Represents complex monoamines
                        ctx.moveTo(p.x, p.y - p.radius);
                        ctx.lineTo(p.x + p.radius, p.y + p.radius);
                        ctx.lineTo(p.x - p.radius, p.y + p.radius);
                        ctx.closePath();
                        ctx.fill();
                    } else {
                        // Default 'circle' represents small molecule neurotransmitters (e.g. Glutamate, GABA)
                        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                        ctx.fill();
                    }
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
                    // Enhancement #7: Neurotransmitter Shapes
                    // Randomly assign shapes to represent different neurotransmitter types
                    // 'circle' = Small molecule (e.g., Glutamate)
                    // 'square' = Peptide (larger)
                    // 'triangle' = Monoamine (e.g., Dopamine)
                    const shapes = ['circle', 'square', 'triangle'];
                    this.state.synaptic.particles.push({
                        x: width / 2 + (Math.random() - 0.5) * terminalWidth,
                        y: releaseZoneY + (Math.random() * 20),
                        vx: (Math.random() - 0.5) * 0.5,
                        vy: 0.8 + Math.random() * 0.5,
                        radius: 2 + Math.random() * 1,
                        opacity: 0.8 + Math.random() * 0.2,
                        shape: shapes[Math.floor(Math.random() * shapes.length)]
                    });
                }
            }
        }
    };

    window.GreenhouseModelsUISynapse = GreenhouseModelsUISynapse;
})();
