// docs/js/dna_repair_global.js
// DNA Repair Simulation Module - Core Engine
// Handles 3D rendering of DNA helix and coordination of repair modules

(async function () {
    'use strict';

    let GreenhouseUtils;
    let resilienceObserver = null;

    // Ensure GreenhouseUtils is loaded before proceeding
    const loadDependencies = async () => {
        await new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 240; // 12 seconds
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

    // Use existing object if defined (by mechanisms, mutations, or buttons scripts)
    const G = window.GreenhouseDNARepair || {};
    window.GreenhouseDNARepair = G;

    // Define Core Properties and Methods
    Object.assign(G, {
        canvas: null,
        ctx: null,
        isRunning: false,
        width: 800,
        height: 600,

        state: {
            camera: { x: 0, y: 0, z: -250, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 500, zoom: 1.0 },
            basePairs: [],
            particles: [],
            repairMode: 'ber',
            atpConsumed: 0,
            timer: 0,
            simulating: false,
            genomicIntegrity: 100,
            mutationCount: 0,
            globalHelixUnwind: 0,
            radiationLevel: 10,
            successfulRepairs: 0,
            mutatedRepairs: 0,
            cellCyclePhase: 'G1' // G1, S, G2
        },

        config: {
            helixLength: 60,
            radius: 40,
            rise: 14,
            rotationPerPair: 0.5,
            colors: {
                A: '#00D9FF', T: '#FF0055', C: '#FFD500', G: '#00FF66',
                backbone: '#EEEEEE', enzyme: '#9d00ff', damage: '#FF0000'
            }
        },

        initializeDNARepairSimulation(container) {
            if (!container) return;
            container.innerHTML = '';
            this.injectStyles();
            const wrapper = document.createElement('div');
            wrapper.className = 'dna-simulation-container';
            wrapper.style.width = '100%'; wrapper.style.height = '100%';
            wrapper.style.position = 'relative'; wrapper.style.backgroundColor = '#101015';
            container.appendChild(wrapper);

            if (this.createUI) this.createUI(wrapper);

            this.canvas = document.createElement('canvas');
            this.ctx = this.canvas.getContext('2d');
            this.canvas.width = container.offsetWidth || 800;
            this.canvas.height = 600;
            wrapper.appendChild(this.canvas);
            this.width = this.canvas.width; this.height = this.canvas.height;

            this.setupInteraction();
            this.generateDNA();
            if (window.GreenhouseDNATooltip) window.GreenhouseDNATooltip.initialize();

            this.isRunning = true;
            this.startSimulation('ber');
            this.animate();
            this.observeAndReinitializeApp(container);
        },

        injectStyles() {
            if (document.getElementById('dna-sim-styles')) return;
            const style = document.createElement('style');
            style.id = 'dna-sim-styles';
            style.innerHTML = `
                .dna-controls-bar { display: flex; justify-content: center; gap: 10px; padding: 10px; background: rgba(26, 32, 44, 0.8); position: absolute; top: 0; left: 0; right: 0; z-index: 10; flex-wrap: wrap; }
                .dna-control-btn { background: #2d3748; color: #e2e8f0; border: 1px solid #4a5568; padding: 6px 12px; border-radius: 4px; cursor: pointer; transition: all 0.3s ease; font-size: 12px; font-weight: 500; }
                .dna-control-btn:hover { background: #667eea; color: white; }
                .dna-control-btn.active { background: #667eea; border-color: #5a67d8; color: white; }
                .dna-info-overlay { position: absolute; bottom: 20px; left: 20px; background: rgba(0, 0, 0, 0.7); padding: 15px; border-radius: 8px; color: #fff; max-width: 300px; font-size: 13px; pointer-events: none; border-left: 4px solid #667eea; display: flex; flex-direction: column; gap: 10px; }
                .dna-atp-counter { font-weight: bold; color: #48bb78; font-size: 14px; }
            `;
            document.head.appendChild(style);
        },

        consumeATP(amount, x, y, z) {
            this.state.atpConsumed += amount;
            if (x !== undefined && amount > 0) this.spawnParticles(x, y || 0, z || 0, Math.min(amount * 2, 20), '#48bb78');
        },

        updateStats() {
            const counter = document.getElementById('dna-atp-counter');
            if (counter) counter.innerText = `ATP Consumed: ${Math.floor(this.state.atpConsumed)}`;
            const integrity = document.getElementById('dna-integrity-stat');
            if (integrity) {
                integrity.innerText = `Genomic Integrity: ${Math.round(this.state.genomicIntegrity)}% | Mutations: ${this.state.mutationCount}`;
                integrity.style.color = this.state.genomicIntegrity < 100 ? '#f56565' : '#a0aec0';
            }
            const analytics = document.getElementById('dna-analytics-stat');
            if (analytics) analytics.innerText = `Successful Repairs: ${this.state.successfulRepairs} | Error-Prone: ${this.state.mutatedRepairs}`;
        },

        observeAndReinitializeApp(container) {
            if (!container) return;
            if (resilienceObserver) resilienceObserver.disconnect();
            const observerCallback = (mutations) => {
                const wasRemoved = mutations.some(m => Array.from(m.removedNodes).some(n => n.nodeType === 1 && n.classList.contains('dna-simulation-container')));
                if (wasRemoved) {
                    this.isRunning = false;
                    if (resilienceObserver) resilienceObserver.disconnect();
                    setTimeout(() => this.initializeDNARepairSimulation(container), 1000);
                }
            };
            resilienceObserver = new MutationObserver(observerCallback);
            resilienceObserver.observe(container, { childList: true });
        },

        startSimulation(mode) {
            this.state.repairMode = mode;
            this.state.timer = 0; this.state.atpConsumed = 0;
            this.state.simulating = true; this.state.particles = [];
            this.state.globalHelixUnwind = 0;
            if (this.state.genomicIntegrity < 100 && mode === 'ber') { this.state.genomicIntegrity = 100; this.state.mutationCount = 0; }
            this.generateDNA();
            if (this.updateInfoOverlay) this.updateInfoOverlay();
            const titles = {
                'ber': "Base Excision Repair",
                'mmr': "Mismatch Repair",
                'dsb': "Double-Strand Break Repair",
                'nhej': "Non-Homologous End Joining",
                'ner': "Nucleotide Excision Repair",
                'hr': "Homologous Recombination",
                'photo': "Direct Reversal (Photolyase)",
                'mgmt': "MGMT Repair",
                'replicate': "DNA Replication"
            };
            this.currentModeText = titles[mode];
        },

        generateDNA() {
            this.state.basePairs = [];
            for (let i = 0; i < this.config.helixLength; i++) {
                const x = (i - this.config.helixLength / 2) * this.config.rise;
                const angle = i * this.config.rotationPerPair;
                const type = Math.floor(Math.random() * 4);
                let b1, b2;
                switch (type) { case 0: b1 = 'A'; b2 = 'T'; break; case 1: b1 = 'T'; b2 = 'A'; break; case 2: b1 = 'C'; b2 = 'G'; break; case 3: b1 = 'G'; b2 = 'C'; break; }
                this.state.basePairs.push({ index: i, x: x, angle: angle, base1: b1, base2: b2, isDamaged: false, isBroken: false, offsetY: 0 });
            }
        },

        setupInteraction() {
            let isDragging = false; let lastX = 0; let lastY = 0;
            this.canvas.addEventListener('mousedown', (e) => { isDragging = true; lastX = e.clientX; lastY = e.clientY; });
            window.addEventListener('mousemove', (e) => {
                if (isDragging) { const dx = e.clientX - lastX; const dy = e.clientY - lastY; this.state.camera.rotationX += dy * 0.005; this.state.camera.x -= dx * 2; lastX = e.clientX; lastY = e.clientY; return; }
                if (window.GreenhouseDNATooltip) {
                    const rect = this.canvas.getBoundingClientRect();
                    const mx = e.clientX - rect.left; const my = e.clientY - rect.top;
                    let hit = null; const cam = this.state.camera;
                    const project = window.GreenhouseModels3DMath.project3DTo2D.bind(window.GreenhouseModels3DMath);
                    for (let i = 0; i < this.state.basePairs.length; i++) {
                        const pair = this.state.basePairs[i]; if (pair.isBroken) continue;
                        const s1Y = Math.cos(pair.angle) * this.config.radius + pair.offsetY; const s1Z = Math.sin(pair.angle) * this.config.radius;
                        const p1 = project(pair.x, s1Y, s1Z, cam, { width: this.width, height: this.height, near: 10, far: 5000 });
                        const s2Y = Math.cos(pair.angle + Math.PI) * this.config.radius + pair.offsetY; const s2Z = Math.sin(pair.angle + Math.PI) * this.config.radius;
                        const p2 = project(pair.x, s2Y, s2Z, cam, { width: this.width, height: this.height, near: 10, far: 5000 });
                        if (Math.hypot(p1.x - mx, p1.y - my) < 10 * p1.scale) { hit = { key: pair.base1, x: e.clientX, y: e.clientY }; break; }
                        if (Math.hypot(p2.x - mx, p2.y - my) < 10 * p2.scale) { hit = { key: pair.base2, x: e.clientX, y: e.clientY }; break; }
                    }
                    if (hit) GreenhouseDNATooltip.show(hit.x, hit.y, hit.key); else GreenhouseDNATooltip.hide();
                }
            });
            window.addEventListener('mouseup', () => { isDragging = false; });
            this.canvas.addEventListener('wheel', (e) => { e.preventDefault(); this.state.camera.z += e.deltaY * 0.5; this.state.camera.z = Math.min(-100, Math.max(-1500, this.state.camera.z)); });
        },

        animate() { if (!this.isRunning) return; this.update(); this.render(); requestAnimationFrame(() => this.animate()); },

        update() {
            const st = this.state; st.camera.rotationX += 0.005;
            if (st.simulating) {
                st.timer++;
                if (this.induceSpontaneousDamage) this.induceSpontaneousDamage();
                const m = st.repairMode;
                if (m === 'ber' && this.handleBER) this.handleBER(st.timer);
                else if (m === 'mmr' && this.handleMMR) this.handleMMR(st.timer);
                else if (m === 'dsb' && this.handleDSB) this.handleDSB(st.timer);
                else if (m === 'nhej' && this.handleNHEJ) this.handleNHEJ(st.timer);
                else if (m === 'ner' && this.handleNER) this.handleNER(st.timer);
                else if (m === 'hr' && this.handleHR) {
                    if (st.cellCyclePhase === 'S' || st.cellCyclePhase === 'G2') {
                        this.handleHR(st.timer);
                    } else {
                        // Biological constraint: HR requires a sister chromatid, only available in S/G2
                        this.currentModeText = "HR Blocked (Requires S or G2)";
                    }
                }
                else if (m === 'photo' && this.handlePhotolyase) this.handlePhotolyase(st.timer);
                else if (m === 'mgmt' && this.handleMGMT) this.handleMGMT(st.timer);
                else if (m === 'replicate' && this.handleReplication) this.handleReplication(st.timer);
                this.updateStats();
                if (st.timer > 600) { st.timer = 0; this.generateDNA(); }
            }
            st.particles.forEach((p, i) => { p.x += (p.targetX - p.x) * 0.1; p.y += (p.targetY - p.y) * 0.1; p.z += (p.targetZ - p.z) * 0.1; p.life--; if (p.life <= 0) st.particles.splice(i, 1); });
        },

        spawnParticles(x, y, z, count, color) { for (let i = 0; i < count; i++) this.state.particles.push({ x: x + (Math.random() - 0.5) * 100, y: y + (Math.random() - 0.5) * 100, z: z + (Math.random() - 0.5) * 100, targetX: x, targetY: y, targetZ: z, life: 60, color: color }); },

        render() {
            const ctx = this.ctx; const w = this.width; const h = this.height; const cam = this.state.camera;
            ctx.clearRect(0, 0, w, h); ctx.fillStyle = '#101015'; ctx.fillRect(0, 0, w, h);
            const project = window.GreenhouseModels3DMath.project3DTo2D.bind(window.GreenhouseModels3DMath);
            const radius = this.config.radius * (1 + (this.state.globalHelixUnwind || 0) * 1.5);
            const rotS = 1 - (this.state.globalHelixUnwind || 0) * 0.8;
            for (let i = 0; i < this.state.basePairs.length; i++) {
                const p = this.state.basePairs[i]; if (p.isBroken) continue;
                const dAngle = p.angle * rotS;

                const s1O = p.s1Offset || {y:0, z:0};
                const s2O = p.s2Offset || {y:0, z:0};

                const s1Y = Math.cos(dAngle) * radius + p.offsetY + s1O.y;
                const s1Z = Math.sin(dAngle) * radius + s1O.z;
                const s2Y = Math.cos(dAngle + Math.PI) * radius + p.offsetY + s2O.y;
                const s2Z = Math.sin(dAngle + Math.PI) * radius + s2O.z;

                const p1 = project(p.x, s1Y, s1Z, cam, { width: w, height: h, near: 10, far: 5000 });
                const p2 = project(p.x, s2Y, s2Z, cam, { width: w, height: h, near: 10, far: 5000 });
                if (p1.scale <= 0 || p2.scale <= 0) continue;
                const midX = (p1.x + p2.x) / 2; const midY = (p1.y + p2.y) / 2;
                const drawB = (sp, ep, type, dam) => { if (!type) return; ctx.strokeStyle = dam ? '#ff0000' : (this.config.colors[type] || '#fff'); ctx.lineWidth = 5 * p1.scale; if (dam) { ctx.shadowBlur = 15; ctx.shadowColor = '#ff0000'; } ctx.beginPath(); ctx.moveTo(sp.x, sp.y); ctx.lineTo(ep.x, ep.y); ctx.stroke(); ctx.shadowBlur = 0; };

                if (!p.isReplicating) {
                    drawB(p1, { x: midX, y: midY }, p.base1, p.isDamaged);
                    drawB({ x: midX, y: midY }, p2, p.base2, p.isDamaged);
                } else {
                    const drawT = (sp, ep, type) => { ctx.strokeStyle = (this.config.colors[type] || '#fff'); ctx.lineWidth = 5 * p1.scale; ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.moveTo(sp.x, sp.y); ctx.lineTo(ep.x, ep.y); ctx.stroke(); ctx.globalAlpha = 1.0; };
                    drawT(p1, {x: p1.x + (midX-p1.x)*0.4, y: p1.y + (midY-p1.y)*0.4}, p.base1);
                    drawT(p2, {x: p2.x + (midX-p2.x)*0.4, y: p2.y + (midY-p2.y)*0.4}, p.base2);
                    if (p.newBase1) {
                         const np1 = project(p.x, s1Y - s1O.y*0.3, s1Z - s1O.z*0.3, cam, { width: w, height: h, near: 10, far: 5000 });
                         drawB(np1, {x: np1.x + (midX-np1.x)*0.2, y: np1.y + (midY-np1.y)*0.2}, p.newBase1, false);
                    }
                    if (p.newBase2) {
                         const np2 = project(p.x, s2Y - s2O.y*0.3, s2Z - s2O.z*0.3, cam, { width: w, height: h, near: 10, far: 5000 });
                         drawB(np2, {x: np2.x + (midX-np2.x)*0.2, y: np2.y + (midY-np2.y)*0.2}, p.newBase2, false);
                    }
                }

                const drawP = (x, y, r) => { ctx.fillStyle = '#e2e8f0'; ctx.beginPath(); for (let j = 0; j < 5; j++) { const a = (j * 2 * Math.PI / 5) - Math.PI / 2; ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } ctx.closePath(); ctx.fill(); };
                if (p1.scale > 0.3) drawP(p1.x, p1.y, 6 * p1.scale); if (p2.scale > 0.3) drawP(p2.x, p2.y, 6 * p2.scale);
                if (p1.scale > 0.4 && p.base1) { ctx.fillStyle = "#000"; ctx.font = `bold ${8 * p1.scale}px Arial`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(p.base1, (p1.x + midX) / 2, (p1.y + midY) / 2); }
                if (p2.scale > 0.4 && p.base2) { ctx.fillStyle = "#000"; ctx.font = `bold ${8 * p2.scale}px Arial`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(p.base2, (p2.x + midX) / 2, (p2.y + midY) / 2); }
                if (i > 0 && !this.state.basePairs[i - 1].isBroken) {
                    const prev = this.state.basePairs[i - 1]; const pdAngle = prev.angle * rotS;
                    const ps1O = prev.s1Offset || {y:0,z:0}; const ps2O = prev.s2Offset || {y:0,z:0};
                    const pp1 = project(prev.x, Math.cos(pdAngle) * radius + prev.offsetY + ps1O.y, Math.sin(pdAngle) * radius + ps1O.z, cam, { width: w, height: h, near: 10, far: 5000 });
                    const pp2 = project(prev.x, Math.cos(pdAngle + Math.PI) * radius + prev.offsetY + ps2O.y, Math.sin(pdAngle + Math.PI) * radius + ps2O.z, cam, { width: w, height: h, near: 10, far: 5000 });
                    ctx.strokeStyle = this.config.colors.backbone; ctx.lineWidth = 2 * p1.scale;
                    ctx.beginPath(); ctx.moveTo(pp1.x, pp1.y); ctx.lineTo(p1.x, p1.y); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(pp2.x, pp2.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();

                    if (p.isReplicating && prev.isReplicating) {
                        ctx.strokeStyle = '#00fbff';
                        if (p.newBase1 && prev.newBase1) {
                            const npp1 = project(prev.x, Math.cos(pdAngle) * radius + prev.offsetY + ps1O.y - ps1O.y*0.3, Math.sin(pdAngle) * radius + ps1O.z - ps1O.z*0.3, cam, { width: w, height: h, near: 10, far: 5000 });
                            const np1 = project(p.x, s1Y - s1O.y*0.3, s1Z - s1O.z*0.3, cam, { width: w, height: h, near: 10, far: 5000 });
                            ctx.beginPath(); ctx.moveTo(npp1.x, npp1.y); ctx.lineTo(np1.x, np1.y); ctx.stroke();
                        }
                        if (p.newBase2 && prev.newBase2) {
                            const npp2 = project(prev.x, Math.cos(pdAngle + Math.PI) * radius + prev.offsetY + ps2O.y - ps2O.y*0.3, Math.sin(pdAngle + Math.PI) * radius + ps2O.z - ps2O.z*0.3, cam, { width: w, height: h, near: 10, far: 5000 });
                            const np2 = project(p.x, s2Y - s2O.y*0.3, s2Z - s2O.z*0.3, cam, { width: w, height: h, near: 10, far: 5000 });
                            ctx.beginPath(); ctx.moveTo(npp2.x, npp2.y); ctx.lineTo(np2.x, np2.y); ctx.stroke();
                        }
                    }
                }
            }
            this.state.particles.forEach(p => { const proj = project(p.x, p.y, p.z, cam, { width: w, height: h, near: 10, far: 5000 }); if (proj.scale > 0) { ctx.shadowBlur = 10; ctx.shadowColor = p.color; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(proj.x, proj.y, 4 * proj.scale, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0; } });
            ctx.fillStyle = '#fff'; ctx.font = 'bold 16px Arial'; ctx.textAlign = 'right'; ctx.fillText(this.currentModeText || '', w - 20, 30);
        }
    });

    window.Greenhouse = window.Greenhouse || {};
    window.Greenhouse.initializeDNARepairSimulation = function (selector) { const container = document.querySelector(selector); if (container) G.initializeDNARepairSimulation(container); };
    window.Greenhouse.setDNASimulationMode = function (mode) { G.startSimulation(mode); };

    function captureAttributes() {
        if (window._greenhouseScriptAttributes) return { targetSelector: window._greenhouseScriptAttributes['target-selector-left'], baseUrl: window._greenhouseScriptAttributes['base-url'] };
        const script = document.currentScript;
        if (script) return { targetSelector: script.getAttribute('data-target-selector-left'), baseUrl: script.getAttribute('data-base-url') };
        return { targetSelector: null, baseUrl: null };
    }

    async function main() {
        try {
            await loadDependencies();
            const { targetSelector, baseUrl } = captureAttributes();
            if (baseUrl !== null) {
                // Load modular simulation components
                await GreenhouseUtils.loadScript('dna_repair_mechanisms.js', baseUrl);
                await GreenhouseUtils.loadScript('dna_repair_mutations.js', baseUrl);
                await GreenhouseUtils.loadScript('dna_repair_buttons.js', baseUrl);
                await GreenhouseUtils.loadScript('dna_replication.js', baseUrl);

                // Load core dependencies
                await GreenhouseUtils.loadScript('models_3d_math.js', baseUrl);
                await GreenhouseUtils.loadScript('dna_tooltip.js', baseUrl);
            }
            if (targetSelector) {
                const container = await GreenhouseUtils.waitForElement(targetSelector);
                setTimeout(() => G.initializeDNARepairSimulation(container), 2000);
            }
        } catch (error) { console.error('DNA Repair App: Initialization failed', error); }
    }
    main();
})();
