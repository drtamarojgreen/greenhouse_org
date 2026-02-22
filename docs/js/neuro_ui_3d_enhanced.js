// docs/js/neuro_ui_3d_enhanced.js
// Enhanced 3D Visualization for Neuro GA - Integrated Primary/PiP Views

(function () {
    'use strict';

    const GreenhouseNeuroUI3D = {
        canvas: null,
        ctx: null,
        camera: null,
        projection: null,
        config: null,
        cameraControls: null,
        lighting: null,
        isActive: false,
        neurons: [],
        connections: [],
        brainShell: null,
        selectedConnection: null,
        synapseMeshes: null,
        autoRotate: true,

        init(container) {
            if (!container) return;
            this.config = window.GreenhouseNeuroConfig;

            const camCfg = this.config.get('camera.initial');
            this.camera = { ...camCfg };
            this.projection = { ...this.config.get('projection') };

            this.canvas = document.createElement('canvas');
            this.canvas.width = container.offsetWidth || 1000;
            this.canvas.height = 600;
            this.canvas.style.width = '100%';
            this.canvas.style.display = 'block';
            container.appendChild(this.canvas);

            this.ctx = this.canvas.getContext('2d');
            this.projection.width = this.canvas.width;
            this.projection.height = this.canvas.height;

            if (window.GreenhouseNeuroCameraControls) {
                this.cameraControls = Object.create(window.GreenhouseNeuroCameraControls);
                this.cameraControls.init(this.canvas, this.camera, this.config);
            }

            this.synapseMeshes = this.generateSynapseMeshes();
            this.startAnimation();
        },

        generateSynapseMeshes() {
            if (!window.GreenhouseNeuroGeometry) return null;
            const pre = window.GreenhouseNeuroGeometry.createSynapseGeometry(80, 20, 'pre');
            const post = window.GreenhouseNeuroGeometry.createSynapseGeometry(80, 20, 'post');
            post.vertices.forEach(v => v.y *= -1);
            return { pre, post };
        },

        updateData(genome) {
            if (!this.brainShell) this.initializeBrainShell();

            // Map existing neurons to maintain positions if possible
            const oldMap = new Map(this.neurons.map(n => [n.id, n]));

            this.neurons = genome.neurons.map((n, i) => {
                const old = oldMap.get(n.id);
                if (old) return { ...n, x: old.x, y: old.y, z: old.z, region: old.region, radius: old.radius };

                const regions = ['pfc', 'parietalLobe', 'occipitalLobe', 'temporalLobe', 'cerebellum', 'brainstem', 'motorCortex'];
                const region = regions[i % regions.length];
                const vIdxs = window.GreenhouseNeuroGeometry.getRegionVertices(this.brainShell, region === 'motorCortex' ? 'parietalLobe' : region);
                const v = this.brainShell.vertices[vIdxs[Math.floor(Math.random() * vIdxs.length)]];
                return { ...n, x: v.x, y: v.y, z: v.z, region, radius: 6 + Math.random() * 4 };
            });

            const nMap = new Map(this.neurons.map(n => [n.id, n]));
            this.connections = genome.connections.map(c => {
                const from = nMap.get(c.from), to = nMap.get(c.to);
                if (!from || !to) return null;
                const cp = { x: (from.x + to.x) * 0.4, y: (from.y + to.y) * 0.4, z: (from.z + to.z) * 0.4 };
                return { ...c, from, to, controlPoint: cp, mesh: window.GreenhouseNeuroGeometry.generateTubeMesh(from, to, cp, Math.max(0.8, Math.abs(c.weight)*4), 8) };
            }).filter(c => c);

            if (this.connections.length > 0 && !this.selectedConnection) {
                this.selectedConnection = this.connections[0];
            }
        },

        initializeBrainShell() {
            this.brainShell = { vertices: [], faces: [] };
            if (window.GreenhouseNeuroGeometry) window.GreenhouseNeuroGeometry.initializeBrainShell(this.brainShell);
        },

        startAnimation() {
            const loop = () => {
                if (this.cameraControls) this.cameraControls.update();
                this.autoRotate = this.config.get('camera.controls.autoRotate');
                this.render();
                requestAnimationFrame(loop);
            };
            loop();
        },

        render() {
            if (!this.ctx) return;
            const ctx = this.ctx;
            const state = window.GreenhouseNeuroApp?.state || { viewMode: 0 };
            const t = (k) => window.GreenhouseModelsUtil ? window.GreenhouseModelsUtil.t(k) : k;

            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            ctx.fillStyle = '#050510';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            const isSynaptic = state.viewMode === 1;

            // 1. Draw Main View
            if (isSynaptic) {
                this._drawSynapseView(ctx, 0, 0, this.canvas.width, this.canvas.height, true);
                this._drawTitle(ctx, t('synapse_view_title'), 40, 40);
            } else {
                this._drawBrainView(ctx, 0, 0, this.canvas.width, this.canvas.height, true);
                const title = state.viewMode === 2 ? t('Burst') : t('whole_brain_title');
                this._drawTitle(ctx, title, 40, 40);
            }

            // 2. Draw PiP View
            const pip = this.config.get('pip');
            const px = this.canvas.width - pip.width - pip.padding;
            const py = this.canvas.height - pip.height - pip.padding;

            ctx.save();
            ctx.translate(px, py);
            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            ctx.strokeStyle = '#1a2a3a';
            ctx.fillRect(0, 0, pip.width, pip.height);
            ctx.strokeRect(0, 0, pip.width, pip.height);
            ctx.beginPath(); ctx.rect(0,0, pip.width, pip.height); ctx.clip();

            if (isSynaptic) {
                this._drawBrainView(ctx, 0, 0, pip.width, pip.height, false);
                this._drawTitle(ctx, t('whole_brain_title'), 10, 15, 9);
            } else if (this.selectedConnection) {
                this._drawSynapseView(ctx, 0, 0, pip.width, pip.height, false);
                this._drawTitle(ctx, t('synapse_view_title'), 10, 15, 9);
            }
            ctx.restore();

            // 3. UI Overlay
            if (window.GreenhouseNeuroApp?.drawUI) {
                window.GreenhouseNeuroApp.drawUI(ctx, this.canvas.width, this.canvas.height);
            }
        },

        _drawTitle(ctx, text, x, y, size = 10) {
            ctx.fillStyle = '#4ae';
            ctx.font = `bold ${size}px monospace`;
            ctx.textAlign = 'left';
            ctx.fillText(text.toUpperCase(), x, y);
        },

        _drawBrainView(ctx, x, y, w, h, isMain) {
            const origW = this.projection.width, origH = this.projection.height;
            this.projection.width = w; this.projection.height = h;

            ctx.save();
            ctx.translate(x, y);

            if (window.GreenhouseNeuroBrain && this.brainShell) {
                window.GreenhouseNeuroBrain.drawBrainShell(ctx, this.brainShell, this.camera, this.projection, w, h);
            }

            if (window.GreenhouseNeuroSynapse) {
                window.GreenhouseNeuroSynapse.drawConnections(ctx, this.connections, this.neurons, this.camera, this.projection, w, h);
            }

            const sorted = this.neurons.map(n => ({ n, p: window.GreenhouseModels3DMath.project3DTo2D(n.x, n.y, n.z, this.camera, this.projection) }))
                .filter(i => i.p.scale > 0).sort((a,b) => b.p.depth - a.p.depth);

            sorted.forEach(i => window.GreenhouseNeuroNeuron?.drawNeuron(ctx, i.n, this.camera, this.projection));

            if (isMain && window.GreenhouseNeuroStats) {
                window.GreenhouseNeuroStats.drawLabels(ctx, sorted.map(i => ({ ...i.n, x: i.p.x, y: i.p.y })));
            }

            ctx.restore();
            this.projection.width = origW; this.projection.height = origH;
        },

        _drawSynapseView(ctx, x, y, w, h, isMain) {
            if (window.GreenhouseNeuroSynapse && this.selectedConnection) {
                window.GreenhouseNeuroSynapse.drawSynapsePiP(ctx, x, y, w, h, this.selectedConnection, this.synapseMeshes, isMain, isMain ? null : this.camera);
            }
        },

        hitTest(mx, my) {
            const pip = this.config.get('pip');
            const px = this.canvas.width - pip.width - pip.padding;
            const py = this.canvas.height - pip.height - pip.padding;
            const isSynaptic = (window.GreenhouseNeuroApp?.state?.viewMode === 1);

            // 1. Check PiP
            if (mx >= px && mx <= px + pip.width && my >= py && my <= py + pip.height) {
                if (isSynaptic) return this._checkNetworkHit(mx - px, my - py, pip.width, pip.height);
                // Synapse PiP hover usually doesn't show tooltips to avoid clutter, or we could add it
                return null;
            }

            // 2. Check Main
            if (isSynaptic) {
                const active = window.GreenhouseNeuroApp?.ga?.adhdConfig?.activeEnhancements || new Set();
                return window.GreenhouseNeuroSynapse?.checkSynapseHover(mx, my, this.canvas.width, this.canvas.height, this.camera, active);
            } else {
                return this._checkNetworkHit(mx, my, this.canvas.width, this.canvas.height);
            }
        },

        _checkNetworkHit(lx, ly, w, h) {
            const origW = this.projection.width, origH = this.projection.height;
            this.projection.width = w; this.projection.height = h;
            const t = (k) => window.GreenhouseModelsUtil ? window.GreenhouseModelsUtil.t(k) : k;

            let hit = null;
            // Neurons
            for (const n of this.neurons) {
                const p = window.GreenhouseModels3DMath.project3DTo2D(n.x, n.y, n.z, this.camera, this.projection);
                if (p.scale > 0 && Math.sqrt((lx-p.x)**2 + (ly-p.y)**2) < 15 * p.scale) {
                    hit = { type: 'neuron', label: t('Neuron'), tooltip: t('neuron_tooltip'), detail: t(n.region) };
                    break;
                }
            }
            // Connections
            if (!hit) {
                for (const c of this.connections) {
                    if (!c.controlPoint) continue;
                    const p = window.GreenhouseModels3DMath.project3DTo2D(c.controlPoint.x, c.controlPoint.y, c.controlPoint.z, this.camera, this.projection);
                    if (p.scale > 0 && Math.sqrt((lx-p.x)**2 + (ly-p.y)**2) < 15) {
                        hit = { type: 'connection', data: c, label: t('Connection'), tooltip: t('connection_tooltip'), detail: t('synapse_strength') + ': ' + c.weight.toFixed(4) };
                        break;
                    }
                }
            }

            this.projection.width = origW; this.projection.height = origH;
            return hit;
        },

        resetCamera() { if (this.cameraControls) this.cameraControls.resetCamera(); },
        toggleAutoRotate() { if (this.cameraControls) this.cameraControls.toggleAutoRotate(); }
    };

    window.GreenhouseNeuroUI3D = GreenhouseNeuroUI3D;
})();
