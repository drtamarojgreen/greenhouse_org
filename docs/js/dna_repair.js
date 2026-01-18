// docs/js/dna_repair.js
// DNA Repair Simulation Module
// Handles 3D rendering of DNA helix and repair animations

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

    const GreenhouseDNARepair = {
        canvas: null,
        ctx: null,
        isRunning: false,
        width: 800,
        height: 600,

        // Simulation State
        // Initialize the simulation with horizontal orientation
        state: {
            camera: {
                x: 0,
                y: 0,
                z: -250,
                rotationX: 0,
                rotationY: 0,
                rotationZ: 0,
                fov: 500,
                zoom: 1.0
            },
            basePairs: [],
            particles: [],
            repairMode: 'ber', // ber, mmr, dsb
            timer: 0,
            simulating: false // Control when animation runs
        },

        // Configuration
        config: {
            helixLength: 60, // Longer for horizontal view
            radius: 40,      // Larger radius
            rise: 14,        // Distance between base pairs
            rotationPerPair: 0.5, // Radians
            colors: {
                A: '#00D9FF', // Cyan
                T: '#FF0055', // Red
                C: '#FFD500', // Yellow
                G: '#00FF66', // Green
                backbone: '#EEEEEE',
                enzyme: '#9d00ff',
                damage: '#FF0000'
            }
        },

        // Initialize the simulation
        initializeDNARepairSimulation(container) {
            if (!container) {
                console.error('GreenhouseDNARepair: Container provided is null.');
                return;
            }

            // Clear container safely
            container.innerHTML = '';
            
            // Create wrapper for resilience
            const wrapper = document.createElement('div');
            wrapper.className = 'dna-simulation-container';
            wrapper.style.width = '100%';
            wrapper.style.height = '100%';
            container.appendChild(wrapper);

            // Setup Canvas
            this.canvas = document.createElement('canvas');
            this.ctx = this.canvas.getContext('2d');
            this.canvas.style.width = '100%';
            this.canvas.width = container.offsetWidth || 800;
            this.canvas.height = 600;
            wrapper.appendChild(this.canvas);

            this.width = this.canvas.width;
            this.height = this.canvas.height;

            // Initialize Interaction
            this.setupInteraction();

            // Initialize DNA Data
            this.generateDNA();

            // Initialize Tooltips
            if (window.GreenhouseDNATooltip) {
                window.GreenhouseDNATooltip.initialize();
            }

            // Start Loop
            this.isRunning = true;
            this.startSimulation('ber'); // Default start
            this.animate();

            console.log('GreenhouseDNARepair: Initialized');
            
            // Start observing for DOM removal
            this.observeAndReinitializeApp(container);
        },

        observeAndReinitializeApp(container) {
            if (!container) return;
            
            if (resilienceObserver) {
                resilienceObserver.disconnect();
            }

            const observerCallback = (mutations) => {
                const wasRemoved = mutations.some(m => 
                    Array.from(m.removedNodes).some(n => 
                        n.nodeType === 1 && n.classList.contains('dna-simulation-container')
                    )
                );

                if (wasRemoved) {
                    console.log('GreenhouseDNARepair: Simulation container removed. Re-initializing...');
                    this.isRunning = false;
                    if (resilienceObserver) resilienceObserver.disconnect();
                    
                    setTimeout(() => {
                        this.initializeDNARepairSimulation(container);
                    }, 1000);
                }
            };

            resilienceObserver = new MutationObserver(observerCallback);
            resilienceObserver.observe(container, { childList: true });
        },

        startSimulation(mode) {
            this.state.repairMode = mode;
            this.state.timer = 0;
            this.state.simulating = true;
            this.state.particles = [];
            this.generateDNA(); // Reset structure

            const titles = {
                'ber': "Base Excision Repair",
                'mmr': "Mismatch Repair",
                'dsb': "Double-Strand Break Repair"
            };
            this.currentModeText = titles[mode];
        },

        generateDNA() {
            this.state.basePairs = [];
            for (let i = 0; i < this.config.helixLength; i++) {
                // Horizontal Layout: X is the long axis
                const x = (i - this.config.helixLength / 2) * this.config.rise;
                const angle = i * this.config.rotationPerPair;

                const type = Math.floor(Math.random() * 4);
                let base1, base2;
                switch (type) {
                    case 0: base1 = 'A'; base2 = 'T'; break;
                    case 1: base1 = 'T'; base2 = 'A'; break;
                    case 2: base1 = 'C'; base2 = 'G'; break;
                    case 3: base1 = 'G'; base2 = 'C'; break;
                }

                this.state.basePairs.push({
                    index: i,
                    x: x, // Primary position is X now
                    angle: angle,
                    base1: base1,
                    base2: base2,
                    isDamaged: false,
                    isBroken: false,
                    offsetY: 0 // For DSB drift
                });
            }
        },

        setupInteraction() {
            let isDragging = false;
            let lastX = 0;
            let lastY = 0;

            this.canvas.addEventListener('mousedown', (e) => {
                isDragging = true;
                lastX = e.clientX;
                lastY = e.clientY;
            });

            window.addEventListener('mousemove', (e) => {
                // Dragging Logic
                if (isDragging) {
                    const dx = e.clientX - lastX;
                    const dy = e.clientY - lastY;
                    this.state.camera.rotationX += dy * 0.005;
                    this.state.camera.x -= dx * 2;
                    lastX = e.clientX;
                    lastY = e.clientY;
                    return;
                }

                // Hover / Tooltip Logic
                if (window.GreenhouseDNATooltip) {
                    const rect = this.canvas.getBoundingClientRect();
                    const mx = e.clientX - rect.left;
                    const my = e.clientY - rect.top;

                    // Simple Hit Test
                    let hit = null;
                    const cam = this.state.camera;
                    const project = window.GreenhouseModels3DMath.project3DTo2D.bind(window.GreenhouseModels3DMath);
                    const radius = this.config.radius;

                    for (let i = 0; i < this.state.basePairs.length; i++) {
                        const pair = this.state.basePairs[i];
                        if (pair.isBroken) continue;

                        // Approx hit positions (Strand 1 & 2)
                        const s1Y = Math.cos(pair.angle) * radius + (pair.offsetY || 0);
                        const s1Z = Math.sin(pair.angle) * radius;
                        const p1 = project(pair.x, s1Y, s1Z, cam, { width: this.width, height: this.height, near: 10, far: 5000 });

                        const s2Y = Math.cos(pair.angle + Math.PI) * radius + (pair.offsetY || 0);
                        const s2Z = Math.sin(pair.angle + Math.PI) * radius;
                        const p2 = project(pair.x, s2Y, s2Z, cam, { width: this.width, height: this.height, near: 10, far: 5000 });

                        // Check dist
                        const dist1 = Math.hypot(p1.x - mx, p1.y - my);
                        if (dist1 < 10 * p1.scale) { hit = { key: pair.base1, x: e.clientX, y: e.clientY }; break; }

                        const dist2 = Math.hypot(p2.x - mx, p2.y - my);
                        if (dist2 < 10 * p2.scale) { hit = { key: pair.base2, x: e.clientX, y: e.clientY }; break; }
                    }

                    if (hit) GreenhouseDNATooltip.show(hit.x, hit.y, hit.key);
                    else GreenhouseDNATooltip.hide();
                }
            });

            window.addEventListener('mouseup', () => { isDragging = false; });

            this.canvas.addEventListener('wheel', (e) => {
                e.preventDefault();
                this.state.camera.z += e.deltaY * 0.5;
                this.state.camera.z = Math.min(-100, Math.max(-1500, this.state.camera.z));
            });
        },

        animate() {
            if (!this.isRunning) return;

            this.update();
            this.render();

            requestAnimationFrame(() => this.animate());
        },

        update() {
            const st = this.state;

            // Auto-spin logic (can be toggled)
            st.camera.rotationX += 0.005;

            if (st.simulating) {
                st.timer++;
                // Delegate to specific repair logic based on mode selector
                if (st.repairMode === 'ber') this.handleBER(st.timer);
                else if (st.repairMode === 'mmr') this.handleMMR(st.timer);
                else if (st.repairMode === 'dsb') this.handleDSB(st.timer);

                // Stop active animation after cycle completes
                if (st.timer > 600) {
                    st.timer = 0;
                    this.generateDNA(); // Reset for next loop
                }
            }

            // Update Particles
            st.particles.forEach((p, i) => {
                p.x += (p.targetX - p.x) * 0.1;
                p.y += (p.targetY - p.y) * 0.1;
                p.z += (p.targetZ - p.z) * 0.1;
                p.life--;
                if (p.life <= 0) st.particles.splice(i, 1);
            });
        },

        handleBER(t) {
            const targetIdx = Math.floor(this.config.helixLength / 2);
            const pair = this.state.basePairs[targetIdx];

            if (t === 10) {
                pair.isDamaged = true; // Sim damage
            }
            if (t === 100) {
                this.spawnParticles(pair.x, 0, 0, 20, '#ff00ff');
            }
            if (t > 150 && t < 300) {
                pair.base1 = '';
            }
            if (t === 300) {
                this.spawnParticles(pair.x, 0, 0, 10, this.config.colors.A);
            }
            if (t === 350) {
                pair.base1 = 'A';
                pair.isDamaged = false;
            }
        },

        handleMMR(t) {
            const targetIdx = Math.floor(this.config.helixLength / 2) + 5;
            const pair = this.state.basePairs[targetIdx];

            if (t === 10) { pair.base1 = 'C'; pair.base2 = 'C'; pair.isDamaged = true; }
            if (t > 150 && t < 400) {
                for (let i = -2; i <= 2; i++) {
                    if (this.state.basePairs[targetIdx + i])
                        this.state.basePairs[targetIdx + i].base1 = '';
                }
            }
            if (t === 450) {
                for (let i = -2; i <= 2; i++) {
                    const p = this.state.basePairs[targetIdx + i];
                    if (p) { p.base1 = 'G'; p.base2 = 'C'; p.isDamaged = false; }
                }
            }
        },

        handleDSB(t) {
            const targetIdx = Math.floor(this.config.helixLength / 2);

            if (t === 50) this.state.basePairs[targetIdx].isBroken = true;

            if (t > 50 && t < 300) {
                // Horizontal drift: Left side goes left/up, Right side goes right/down
                this.state.basePairs.forEach(p => {
                    if (p.index < targetIdx) { p.x -= 0.2; p.offsetY -= 0.1; }
                    if (p.index > targetIdx) { p.x += 0.2; p.offsetY += 0.1; }
                });
            }

            if (t === 350) this.spawnParticles(this.state.basePairs[targetIdx].x, 0, 0, 50, '#ffff00');

            if (t > 400) {
                // Rejoin
                this.state.basePairs.forEach((p, i) => {
                    const targetX = (i - this.config.helixLength / 2) * this.config.rise;
                    p.x += (targetX - p.x) * 0.05;
                    p.offsetY += (0 - p.offsetY) * 0.05;
                });
                if (Math.abs(this.state.basePairs[targetIdx].x - ((targetIdx - this.config.helixLength / 2) * this.config.rise)) < 1) {
                    this.state.basePairs[targetIdx].isBroken = false;
                }
            }
        },


        spawnParticles(x, y, z, count, color) {
            for (let i = 0; i < count; i++) {
                this.state.particles.push({
                    x: x + (Math.random() - 0.5) * 100,
                    y: y + (Math.random() - 0.5) * 100,
                    z: z + (Math.random() - 0.5) * 100,
                    targetX: x,
                    targetY: y,
                    targetZ: z,
                    life: 60,
                    color: color
                });
            }
        },

        render() {
            const ctx = this.ctx;
            const w = this.width;
            const h = this.height;
            const cam = this.state.camera;

            // Clear
            ctx.clearRect(0, 0, w, h);
            ctx.fillStyle = '#101015'; // Slightly lighter black
            ctx.fillRect(0, 0, w, h);

            // Helpers from common math
            const project = window.GreenhouseModels3DMath.project3DTo2D.bind(window.GreenhouseModels3DMath);
            const radius = this.config.radius;

            // Draw DNA
            for (let i = 0; i < this.state.basePairs.length; i++) {
                const pair = this.state.basePairs[i];
                if (pair.isBroken) continue;

                // Horizontal Helix: Angle determines Y/Z position
                const yOff = pair.offsetY || 0;

                // Strand A
                const s1Y = Math.cos(pair.angle) * radius + yOff;
                const s1Z = Math.sin(pair.angle) * radius;

                // Strand B
                const s2Y = Math.cos(pair.angle + Math.PI) * radius + yOff;
                const s2Z = Math.sin(pair.angle + Math.PI) * radius;

                const p1 = project(pair.x, s1Y, s1Z, cam, { width: w, height: h, near: 10, far: 5000 });
                const p2 = project(pair.x, s2Y, s2Z, cam, { width: w, height: h, near: 10, far: 5000 });

                if (p1.scale <= 0 || p2.scale <= 0) continue;

                const midX = (p1.x + p2.x) / 2;
                const midY = (p1.y + p2.y) / 2;
                const thickness = 5 * p1.scale;

                // Draw Rung
                const drawBase = (startP, endP, baseType, damaged) => {
                    if (!baseType) return;
                    ctx.strokeStyle = damaged ? '#ff0000' : (this.config.colors[baseType] || '#fff');
                    ctx.lineWidth = thickness;
                    ctx.beginPath();
                    ctx.moveTo(startP.x, startP.y);
                    ctx.lineTo(endP.x, endP.y);
                    ctx.stroke();
                };

                drawBase(p1, { x: midX, y: midY }, pair.base1, pair.isDamaged);
                drawBase({ x: midX, y: midY }, p2, pair.base2, pair.isDamaged);

                // Draw Pentagons for Sugars (Deoxyribose)
                const drawPentagon = (x, y, radius) => {
                    ctx.fillStyle = '#e2e8f0'; // Sugar color
                    ctx.beginPath();
                    for (let j = 0; j < 5; j++) {
                        const angle = (j * 2 * Math.PI / 5) - Math.PI / 2;
                        const px = x + Math.cos(angle) * radius;
                        const py = y + Math.sin(angle) * radius;
                        if (j === 0) ctx.moveTo(px, py);
                        else ctx.lineTo(px, py);
                    }
                    ctx.closePath();
                    ctx.fill();
                };

                if (p1.scale > 0.3) drawPentagon(p1.x, p1.y, 6 * p1.scale);
                if (p2.scale > 0.3) drawPentagon(p2.x, p2.y, 6 * p2.scale);

                // Draw Text Labels (Centered on the Base Rung)
                if (p1.scale > 0.4) {
                    ctx.fillStyle = "#000"; // Black text for contrast on color rungs
                    ctx.font = `bold ${8 * p1.scale}px Arial`;
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";

                    const tx = (p1.x + midX) / 2;
                    const ty = (p1.y + midY) / 2;
                    if (pair.base1) ctx.fillText(pair.base1, tx, ty);
                }
                if (p2.scale > 0.4) {
                    ctx.fillStyle = "#000";
                    ctx.font = `bold ${8 * p2.scale}px Arial`;
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";

                    const tx = (p2.x + midX) / 2;
                    const ty = (p2.y + midY) / 2;
                    if (pair.base2) ctx.fillText(pair.base2, tx, ty);
                }

                // Phosphodiester Backbone
                if (i > 0 && !this.state.basePairs[i - 1].isBroken) {
                    const prev = this.state.basePairs[i - 1];
                    const prevYOff = prev.offsetY || 0;

                    const ps1Y = Math.cos(prev.angle) * radius + prevYOff;
                    const ps1Z = Math.sin(prev.angle) * radius;
                    const ps2Y = Math.cos(prev.angle + Math.PI) * radius + prevYOff;
                    const ps2Z = Math.sin(prev.angle + Math.PI) * radius;

                    const pp1 = project(prev.x, ps1Y, ps1Z, cam, { width: w, height: h, near: 10, far: 5000 });
                    const pp2 = project(prev.x, ps2Y, ps2Z, cam, { width: w, height: h, near: 10, far: 5000 });

                    const drawBone = (pStart, pEnd) => {
                        ctx.strokeStyle = this.config.colors.backbone;
                        ctx.lineWidth = 2 * pStart.scale; // Thinner backbone line
                        ctx.beginPath();
                        ctx.moveTo(pStart.x, pStart.y);
                        // Connect centers of pentagons
                        ctx.lineTo(pEnd.x, pEnd.y);
                        ctx.stroke();
                    };
                    drawBone(pp1, p1);
                    drawBone(pp2, p2);
                }
            }

            // Draw Particles
            this.state.particles.forEach(p => {
                const proj = project(p.x, p.y, p.z, cam, { width: w, height: h, near: 10, far: 5000 });
                if (proj.scale > 0) {
                    ctx.fillStyle = p.color;
                    ctx.beginPath();
                    ctx.arc(proj.x, proj.y, 4 * proj.scale, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
        }
    };

    // Expose to global scope
    window.Greenhouse = window.Greenhouse || {};
    window.Greenhouse.initializeDNARepairSimulation = function (selector) {
        // Backward compatibility wrapper
        const container = document.querySelector(selector);
        if (container) GreenhouseDNARepair.initializeDNARepairSimulation(container);
    };

    window.Greenhouse.setDNASimulationMode = function (mode) {
        GreenhouseDNARepair.startSimulation(mode);
    };

    // --- Auto-Initialization Logic ---
    function captureAttributes() {
        if (window._greenhouseScriptAttributes) {
            return {
                targetSelector: window._greenhouseScriptAttributes['target-selector-left'],
                baseUrl: window._greenhouseScriptAttributes['base-url']
            };
        }
        const script = document.currentScript;
        if (script) {
            return {
                targetSelector: script.getAttribute('data-target-selector-left'),
                baseUrl: script.getAttribute('data-base-url')
            };
        }
        return { targetSelector: null, baseUrl: null };
    }

    async function main() {
        try {
            await loadDependencies();
            const { targetSelector, baseUrl } = captureAttributes();
            
            if (baseUrl) {
                await GreenhouseUtils.loadScript('models_3d_math.js', baseUrl);
                await GreenhouseUtils.loadScript('dna_tooltip.js', baseUrl);
            }
            
            if (targetSelector) {
                console.log('DNA Repair App: Waiting for container:', targetSelector);
                const container = await GreenhouseUtils.waitForElement(targetSelector);
                setTimeout(() => {
                    console.log('DNA Repair App: Auto-initializing...');
                    GreenhouseDNARepair.initializeDNARepairSimulation(container);
                }, 5000);
            }
        } catch (error) {
            console.error('DNA Repair App: Initialization failed', error);
        }
    }

    // Execute main function
    main();
})();
