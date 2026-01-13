// docs/js/synapse_app.js
// REFACTORED Main application logic for the Synapse Visualization

(function () {
    'use strict';

    // --- 4. Standardize Colour Palette (using placeholders for now) ---
    // In a real app, these would come from CSS variables.
    const palette = {
        background: '#1a1d2e', // Dark blue background
        cytoplasm: '#2a2f4c',
        membrane: '#7a82c2',
        vesicle: '#e58e57',
        receptor: '#57c7e5',
        neurotransmitter: '#f2cd61',
        kinase: '#e5576f',
        rna: '#79e557',
        ionChannel: '#8c57e5',
        text: '#ffffff',
        textMuted: '#a0a8d3',
        tooltipBg: 'rgba(0,0,0,0.8)',
    };

    // --- Application State ---
    // Centralized state makes rendering and updates predictable.
    const state = {
        ctx: null,
        canvas: null,
        mouse: { x: -1, y: -1 },
        hovered: null,
        animations: {
            vesicles: [],
            neurotransmitters: [],
        },
        elements: {
            cytoplasm: { id: 'cytoplasm', label: 'Cytoplasm', visible: true },
            membrane: { id: 'membrane', label: 'Membrane', visible: true },
            ionChannels: { id: 'ionChannels', label: 'Ion Channels', visible: true, items: [] },
            kinases: { id: 'kinases', label: 'Kinases', visible: true, items: [] },
            rna: { id: 'rna', label: 'RNA', visible: true, items: [] },
            vesicles: { id: 'vesicles', label: 'Vesicles', visible: true, items: [] },
            receptors: { id: 'receptors', label: 'Receptors', visible: true, items: [] },
        },
        lastTimestamp: 0,
    };

    const GreenhouseSynapseApp = {
        init(targetSelector) {
            const container = document.querySelector(targetSelector);
            if (!container) {
                console.error(`Synapse App: Target container "${targetSelector}" not found.`);
                return;
            }
            container.innerHTML = ''; // Clear existing content

            this.setupDOM(container);
            this.setupCanvas(container);
            this.populateState();
            this.setupEventListeners();

            // Start the animation loop
            requestAnimationFrame(this.gameLoop.bind(this));
        },

        setupDOM(container) {
            container.style.cssText = 'display: flex; gap: 20px; padding: 15px; background: #0e101c; border-radius: 8px;';
            const canvasContainer = document.createElement('div');
            canvasContainer.style.cssText = 'flex: 3; position: relative;';

            state.canvas = document.createElement('canvas');
            canvasContainer.appendChild(state.canvas);

            // --- 2. Add a legend component that toggles visibility ---
            const legendContainer = document.createElement('div');
            legendContainer.id = 'synapse-legend';
            legendContainer.style.cssText = 'flex: 1; color: ' + palette.text + '; font-family: sans-serif;';
            legendContainer.innerHTML = '<h3 style="margin-top:0;">Legend</h3>';

            Object.values(state.elements).forEach(el => {
                if (el.items) { // Only create toggles for element groups
                    const item = document.createElement('div');
                    item.innerHTML = `
                        <label style="cursor:pointer; display:flex; align-items:center; margin-bottom: 8px;">
                            <input type="checkbox" data-type="${el.id}" checked />
                            <span style="margin-left: 8px;">${el.label}</span>
                        </label>
                    `;
                    legendContainer.appendChild(item);
                }
            });

            container.appendChild(canvasContainer);
            container.appendChild(legendContainer);
        },

        setupCanvas(container) {
            const wrapper = state.canvas.parentElement;
            state.canvas.width = wrapper.offsetWidth;
            state.canvas.height = wrapper.offsetHeight || 600; // Default height
            state.ctx = state.canvas.getContext('2d');
        },

        populateState() {
            // Populate the state with initial element positions
            const w = state.canvas.width;
            const h = state.canvas.height;

            // Vesicles
            for (let i = 0; i < 5; i++) {
                state.elements.vesicles.items.push({
                    id: `vesicle_${i}`,
                    x: w * 0.3 + Math.random() * w * 0.4,
                    y: h * 0.15 + Math.random() * h * 0.15,
                    r: 15 + Math.random() * 5,
                });
            }
            // Receptors
            for (let i = 0; i < 8; i++) {
                state.elements.receptors.items.push({
                    id: `receptor_${i}`,
                    x: w * 0.2 + i * (w * 0.6 / 7),
                    y: h * 0.52,
                    w: 10, h: 20,
                });
            }
            // Other elements can be populated similarly...
        },

        setupEventListeners() {
            document.querySelectorAll('#synapse-legend input[type="checkbox"]').forEach(checkbox => {
                checkbox.addEventListener('change', (e) => {
                    const type = e.target.dataset.type;
                    if (state.elements[type]) {
                        state.elements[type].visible = e.target.checked;
                    }
                });
            });

            state.canvas.addEventListener('mousemove', (e) => {
                const rect = state.canvas.getBoundingClientRect();
                state.mouse.x = e.clientX - rect.left;
                state.mouse.y = e.clientY - rect.top;
            });
        },

        gameLoop(timestamp) {
            const deltaTime = timestamp - (state.lastTimestamp || timestamp);
            state.lastTimestamp = timestamp;

            this.update(deltaTime);
            this.render();

            requestAnimationFrame(this.gameLoop.bind(this));
        },

        update(deltaTime) {
            // --- 5. Add micro-animations ---
            // Animate vesicles fusing and releasing neurotransmitters
            if (Math.random() < 0.01 && state.elements.vesicles.items.length > 0) {
                const vesicle = state.elements.vesicles.items[0];
                state.animations.vesicles.push({
                    ...vesicle,
                    progress: 0,
                    duration: 1000,
                });
                state.elements.vesicles.items.shift();
            }

            // Update fusing vesicles
            state.animations.vesicles.forEach((v, i) => {
                v.progress += deltaTime;
                if (v.progress >= v.duration) {
                    // Release neurotransmitters
                    for (let j = 0; j < 10; j++) {
                        state.animations.neurotransmitters.push({
                            x: v.x, y: state.canvas.height * 0.5,
                            vx: (Math.random() - 0.5) * 0.1,
                            vy: Math.random() * 0.1,
                            life: 1500,
                        });
                    }
                    state.animations.vesicles.splice(i, 1);
                }
            });

            // Update neurotransmitters
            state.animations.neurotransmitters.forEach((p, i) => {
                p.x += p.vx * deltaTime;
                p.y += p.vy * deltaTime;
                p.life -= deltaTime;
                if (p.life <= 0) {
                    state.animations.neurotransmitters.splice(i, 1);
                }
            });
        },

        render() {
            const { ctx, canvas } = state;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // --- 1. Refactor rendering pipeline into distinct phases ---
            this.drawPhase1_BackgroundAndCytoplasm();
            this.drawPhase2_MembraneAndChannels();
            this.drawPhase3_PostSynapticInternals();
            this.drawPhase4_VesiclesAndReceptors();

            // Handle interactivity last
            this.updateHoverState();
            this.drawTooltipsAndLabels();
        },

        // --- PHASE 1 ---
        drawPhase1_BackgroundAndCytoplasm() {
            const { ctx, canvas } = state;
            ctx.fillStyle = palette.background;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            if (state.elements.cytoplasm.visible) {
                ctx.fillStyle = palette.cytoplasm;
                ctx.fillRect(0, 0, canvas.width, canvas.height * 0.5); // Pre-synaptic
                ctx.fillRect(0, canvas.height * 0.52, canvas.width, canvas.height * 0.48); // Post-synaptic
            }
        },

        // --- PHASE 2 ---
        drawPhase2_MembraneAndChannels() {
            if (!state.elements.membrane.visible) return;
            const { ctx, canvas } = state;
            ctx.fillStyle = palette.membrane;
            // Pre-synaptic membrane
            ctx.fillRect(0, canvas.height * 0.5 - 5, canvas.width, 10);
            // Post-synaptic membrane
            ctx.fillRect(0, canvas.height * 0.52, canvas.width, 10);

            // Draw Ion Channels here if they are part of the membrane
        },

        // --- PHASE 3 ---
        drawPhase3_PostSynapticInternals() {
            // Draw Kinases and RNA on the post-synaptic side
        },

        // --- PHASE 4 ---
        drawPhase4_VesiclesAndReceptors() {
            const { ctx } = state;

            // Vesicles
            if (state.elements.vesicles.visible) {
                ctx.fillStyle = palette.vesicle;
                state.elements.vesicles.items.forEach(v => {
                    ctx.beginPath();
                    ctx.arc(v.x, v.y, v.r, 0, Math.PI * 2);
                    ctx.fill();
                });
            }

            // Fusing vesicles (animation)
            state.animations.vesicles.forEach(v => {
                const p = v.progress / v.duration;
                const y = v.y + p * (state.canvas.height * 0.5 - v.y);
                const r = v.r * (1 - p * 0.5);
                ctx.beginPath();
                ctx.arc(v.x, y, r, 0, Math.PI * 2);
                ctx.fill();
            });

            // Neurotransmitters (animation)
            ctx.fillStyle = palette.neurotransmitter;
            state.animations.neurotransmitters.forEach(p => {
                ctx.globalAlpha = Math.max(0, p.life / 1000);
                ctx.beginPath();
                ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            });

            // Receptors
            if (state.elements.receptors.visible) {
                ctx.fillStyle = palette.receptor;
                state.elements.receptors.items.forEach(r => {
                    ctx.fillRect(r.x - r.w / 2, r.y, r.w, r.h);
                });
            }
        },

        updateHoverState() {
            state.hovered = null;
            const { x, y } = state.mouse;

            // Check vesicles
            state.elements.vesicles.items.forEach(v => {
                const dist = Math.hypot(x - v.x, y - v.y);
                if (dist < v.r) state.hovered = { type: 'Vesicle', element: v };
            });
            // Check receptors
            state.elements.receptors.items.forEach(r => {
                if (x > r.x - r.w / 2 && x < r.x + r.w / 2 && y > r.y && y < r.y + r.h) {
                    state.hovered = { type: 'Receptor', element: r };
                }
            });
        },

        // --- 3. Improve label placement ---
        drawTooltipsAndLabels() {
            if (!state.hovered) return;
            const { ctx } = state;
            const { x, y } = state.mouse;

            const text = state.hovered.type;
            ctx.font = '14px sans-serif';
            const textWidth = ctx.measureText(text).width;

            ctx.fillStyle = palette.tooltipBg;
            ctx.fillRect(x + 15, y + 15, textWidth + 10, 20);

            ctx.fillStyle = palette.text;
            ctx.fillText(text, x + 20, y + 30);
        }
    };

    window.GreenhouseSynapseApp = GreenhouseSynapseApp;

})();
