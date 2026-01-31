/**
 * @file serotonin_controls.js
 * @description UI controls for Serotonin Simulation.
 */

(function () {
    'use strict';
    const G = window.GreenhouseSerotonin || {};
    window.GreenhouseSerotonin = G;

    G.createUI = function (container) {
        const isMobile = window.GreenhouseUtils && window.GreenhouseUtils.isMobileUser();
        this.injectStyles();
        const controls = document.createElement('div');
        controls.className = 'serotonin-controls-modular';
        if (isMobile) controls.style.display = 'none';

        const categories = [
            {
                name: 'Accessibility',
                options: [
                    { name: 'High-Contrast Mode', toggle: () => { G.highContrast = !G.highContrast; } },
                    { name: 'Large-Scale UI', toggle: () => { G.largeUI = !G.largeUI; this.updateUIScale(); } },
                    { name: 'Reduced Motion', toggle: () => { G.reducedMotion = !G.reducedMotion; } },
                    { name: 'Subtype Glyphs', toggle: () => { G.showGlyphs = !G.showGlyphs; } },
                    { name: 'Stereoscopic Mode (VR)', toggle: () => { G.vrMode = !G.vrMode; } },
                    { name: 'Deuteranopia', toggle: () => { this.toggleColorBlind('deuteranopia'); } },
                    { name: 'Protanopia', toggle: () => { this.toggleColorBlind('protanopia'); } },
                    { name: 'Tritanopia', toggle: () => { this.toggleColorBlind('tritanopia'); } }
                ]
            },
            {
                name: 'Aesthetics',
                options: [
                    { name: 'Cinematic FX', toggle: () => { G.cinematicFX = !G.cinematicFX; } },
                    { name: 'Bloom Effect', toggle: () => { G.bloomEffect = !G.bloomEffect; } },
                    { name: 'Volumetric Light', toggle: () => { G.volumetricLight = !G.volumetricLight; } },
                    { name: 'PBR Materials', toggle: () => { G.pbrEnabled = !G.pbrEnabled; } },
                    { name: 'Dynamic Lighting', toggle: () => { G.dynamicLighting = !G.dynamicLighting; } }
                ]
            },
            {
                name: 'Feedback/HUD',
                options: [
                    { name: 'Performance Gauge', toggle: () => { G.showFPS = !G.showFPS; } },
                    { name: 'Status Bar', toggle: () => { G.showStatusBar = !G.showStatusBar; } },
                    { name: 'Occupancy Panel', toggle: () => { G.showOccupancyPanel = !G.showOccupancyPanel; } },
                    { name: 'Metabolic Gauges', toggle: () => { G.showMetabolicGauges = !G.showMetabolicGauges; } },
                    { name: 'Heatmap Overlay', toggle: () => { G.showHeatmap = !G.showHeatmap; } },
                    { name: 'Comparison View', toggle: () => { G.comparisonMode = !G.comparisonMode; } },
                    { name: 'Interactive Legend', toggle: () => { G.showInteractiveLegend = !G.showInteractiveLegend; } },
                    { name: 'Anatomical Environment', toggle: () => { this.cycleEnvironment(); } }
                ]
            },
            {
                name: 'Temporal',
                options: [
                    { name: 'Pause Simulation (P)', toggle: () => { G.paused = !G.paused; } },
                    { name: 'Fast Forward 2x', toggle: () => { G.playbackSpeed = G.playbackSpeed === 2 ? 1 : 2; } },
                    { name: 'Fast Forward 4x', toggle: () => { G.playbackSpeed = G.playbackSpeed === 4 ? 1 : 4; } },
                    { name: 'Time-lapse Mode', toggle: () => { G.timeLapse = !G.timeLapse; } },
                    { name: 'Stochasticity', toggle: () => { G.stochastic = !G.stochastic; } }
                ]
            },
            {
                name: 'Scenarios',
                options: [
                    { name: 'Depression', toggle: () => { G.Transport.tphActivity = G.Transport.tphActivity === 1.0 ? 0.3 : 1.0; } },
                    { name: 'Serotonin Syndrome', toggle: () => {
                        G.ssActive = !G.ssActive;
                        if (G.ssActive) {
                            G.Transport.sertActivity = 0;
                            G.Transport.maoActivity = 0;
                        } else {
                            G.Transport.sertActivity = 1.0;
                            G.Transport.maoActivity = 1.0;
                        }
                    }},
                    { name: 'MDMA Scenario', toggle: () => {
                        G.mdmaActive = !G.mdmaActive;
                        if (G.mdmaActive) {
                            G.Transport.reuptakeRate = -0.5;
                            G.Transport.vesicle5HT = 0;
                            for(let i=0; i<50; i++) G.Kinetics.spawnLigand('Serotonin');
                        } else {
                            G.Transport.reuptakeRate = 0.05;
                        }
                    }},
                    { name: 'SSRI blockade', toggle: () => {
                        G.ssriMode = !G.ssriMode;
                        G.Transport.sertActivity = G.ssriMode ? 0.1 : 1.0;
                    }},
                    { name: 'Cocaine', toggle: () => {
                        G.cocaineMode = !G.cocaineMode;
                        G.Transport.sertActivity = G.cocaineMode ? 0.05 : 1.0;
                    }},
                    { name: 'Methamphetamine', toggle: () => {
                        G.methMode = !G.methMode;
                        if (G.methMode) {
                            G.Transport.reuptakeRate = -0.8; // Strong reversal
                            for(let i=0; i<30; i++) G.Kinetics.spawnLigand('Serotonin');
                        } else {
                            G.Transport.reuptakeRate = 0.05;
                        }
                    }},
                    { name: 'Schizophrenia', toggle: () => {
                        G.schizMode = !G.schizMode;
                        G.state.receptors.forEach(r => {
                            if (r.type === '5-HT2A') r.pathwayBias = G.schizMode ? 2.5 : 1.0;
                        });
                    }},
                    { name: 'ADHD', toggle: () => {
                        G.adhdMode = !G.adhdMode;
                        G.Transport.tphActivity = G.adhdMode ? 0.5 : 1.0;
                    }},
                    { name: 'Migraine / Triptans', toggle: () => {
                        G.migraineMode = !G.migraineMode;
                        if (G.migraineMode) {
                            // Triptans are selective 5-HT1B/1D agonists
                            G.state.receptors.forEach(r => {
                                if (r.type === '5-HT1B' || r.type === '5-HT1D') {
                                    r.state = 'Active';
                                    r.biasedLigand = 'G-Biased';
                                }
                            });
                            for(let i=0; i<20; i++) G.Kinetics.spawnLigand('Sumatriptan');
                        }
                    }}
                ]
            }
        ];

        categories.forEach(cat => {
            const dropdown = document.createElement('div');
            dropdown.className = 'serotonin-dropdown';

            const btn = document.createElement('button');
            btn.className = 'serotonin-btn dropdown-toggle';
            btn.innerText = cat.name;
            btn.setAttribute('aria-label', `Toggle ${cat.name} menu`);
            btn.setAttribute('aria-haspopup', 'true');

            // UI Micro-interactions (#36)
            btn.onmouseenter = () => { btn.style.background = '#2d3748'; btn.style.boxShadow = '0 0 10px #00ffcc'; };
            btn.onmouseleave = () => { btn.style.background = '#1a202c'; btn.style.boxShadow = 'none'; };

            const modal = document.createElement('div');
            modal.className = 'serotonin-checkbox-modal';
            modal.style.display = 'none';

            cat.options.forEach(opt => {
                const label = document.createElement('label');
                label.className = 'serotonin-checkbox-item';
                const cb = document.createElement('input');
                cb.type = 'checkbox';
                cb.setAttribute('aria-label', opt.name);
                if (opt.checked) cb.checked = true;
                cb.onchange = (e) => {
                    opt.toggle();
                    // Visual confirmation ping (Category III, #46)
                    G.lastInteraction = { type: 'parameter', name: opt.name, time: G.state.timer };
                };
                label.appendChild(cb);
                label.appendChild(document.createTextNode(' ' + opt.name));
                modal.appendChild(label);
            });

            btn.onclick = (e) => {
                e.stopPropagation();
                const isVisible = modal.style.display === 'block';
                document.querySelectorAll('.serotonin-checkbox-modal').forEach(m => m.style.display = 'none');
                modal.style.display = isVisible ? 'none' : 'block';
            };

            dropdown.appendChild(btn);
            dropdown.appendChild(modal);
            controls.appendChild(dropdown);
        });

        window.addEventListener('click', () => {
            document.querySelectorAll('.serotonin-checkbox-modal').forEach(m => m.style.display = 'none');
        });

        // Language Selection (#8)
        const langDropdown = document.createElement('div');
        langDropdown.className = 'serotonin-dropdown';
        const langBtn = document.createElement('button');
        langBtn.className = 'serotonin-btn';
        langBtn.innerText = 'Language: EN';
        langDropdown.appendChild(langBtn);
        controls.appendChild(langDropdown);

        container.appendChild(controls);

        this.setupKeyboardShortcuts();

        this.updateUIScale = () => {
            const scale = G.largeUI ? '1.5' : '1.0';
            controls.style.transform = `scale(${scale})`;
            controls.style.transformOrigin = 'top left';
        };

        const t = (k) => window.GreenhouseModelsUtil ? window.GreenhouseModelsUtil.t(k) : k;
        const info = document.createElement('div');
        info.className = 'serotonin-info';
        info.innerHTML = `<strong>${t('Serotonin Structural Model')}</strong><br>${t('Visualization of 5-HT1A in complex with Gi.')}`;
        if (isMobile) info.style.display = 'none';
        container.appendChild(info);

        // Zoom Control (Category 10, #90)
        const zoomControl = document.createElement('div');
        if (isMobile) zoomControl.style.display = 'none';
        zoomControl.style.position = 'absolute';
        zoomControl.style.top = '10px';
        zoomControl.style.right = '10px';
        zoomControl.style.display = 'flex';
        zoomControl.style.flexDirection = 'column';
        zoomControl.style.gap = '5px';

        const zoomIn = document.createElement('button');
        zoomIn.className = 'serotonin-btn';
        zoomIn.innerText = 'Zoom In (+)';
        zoomIn.onclick = () => { G.state.camera.zoom *= 1.1; };

        const zoomOut = document.createElement('button');
        zoomOut.className = 'serotonin-btn';
        zoomOut.innerText = 'Zoom Out (-)';
        zoomOut.onclick = () => { G.state.camera.zoom *= 0.9; };

        zoomControl.appendChild(zoomIn);
        zoomControl.appendChild(zoomOut);
        container.appendChild(zoomControl);

        // Cholesterol Level Control (Category 2, #16)
        const cholesterolControl = document.createElement('div');
        if (isMobile) cholesterolControl.style.display = 'none';
        cholesterolControl.style.position = 'absolute';
        cholesterolControl.style.bottom = '50px';
        cholesterolControl.style.right = '10px';
        cholesterolControl.style.background = 'rgba(0,0,0,0.5)';
        cholesterolControl.style.padding = '5px';
        cholesterolControl.style.borderRadius = '4px';
        cholesterolControl.innerHTML = '<label style="font-size:10px; color:#fff;">Cholesterol Level</label>';
        const cholesterolSlider = document.createElement('input');
        cholesterolSlider.type = 'range';
        cholesterolSlider.min = '0.5';
        cholesterolSlider.max = '2.0';
        cholesterolSlider.step = '0.1';
        cholesterolSlider.value = '1.0';
        cholesterolSlider.oninput = (e) => { G.cholesterolLevel = parseFloat(e.target.value); };
        cholesterolControl.appendChild(cholesterolSlider);
        container.appendChild(cholesterolControl);

        this.cycleEnvironment = () => {
            const envs = ['PFC (High 5-HT2A)', 'Hippocampus (High 5-HT1A)', 'Raphe (Autoreceptors)'];
            G.currentEnvIndex = ((G.currentEnvIndex || 0) + 1) % envs.length;
            const env = envs[G.currentEnvIndex];
            G.currentEnvLabel = env;

            // Adjust receptor densities/types (Category 1, #1)
            if (G.Receptors && G.Receptors.setupReceptorModel) {
                G.Receptors.setupReceptorModel();
                if (env.includes('PFC')) {
                    G.state.receptors = G.state.receptors.filter(r => ['5-HT2A', '5-HT2C', '5-HT1A'].includes(r.type));
                    for(let k=0; k<5; k++) G.state.receptors.push({...G.Receptors.subtypes['5-HT2A'], type: '5-HT2A', state: 'Inactive', x: Math.random()*200-100, y: 0, z: Math.random()*200-100});
                } else if (env.includes('Hippocampus')) {
                    G.state.receptors = G.state.receptors.filter(r => ['5-HT1A', '5-HT7'].includes(r.type));
                    for(let k=0; k<8; k++) G.state.receptors.push({...G.Receptors.subtypes['5-HT1A'], type: '5-HT1A', state: 'Inactive', x: Math.random()*200-100, y: 0, z: Math.random()*200-100});
                }
            }
            G.lastInteraction = { type: 'environment', name: env, time: G.state.timer };
        };

        // Portal Link (Category 10, #100)
        const portalLink = document.createElement('a');
        if (isMobile) portalLink.style.display = 'none';
        portalLink.href = '#';
        portalLink.innerText = 'CITIZEN SCIENCE PORTAL';
        portalLink.style.position = 'absolute';
        portalLink.style.bottom = '10px';
        portalLink.style.right = '10px';
        portalLink.style.color = '#00ffcc';
        portalLink.style.fontSize = '10px';
        container.appendChild(portalLink);

        // Subcellular Markers (Category 10, #93)
        G.renderSubcellularMarkers = (ctx, project, cam, w, h) => {
            if (G.viewMode === '2D-Closeup') return;

            // Cytoskeleton visualization (Category 10, #93)
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.lineWidth = 1;
            for (let i = -400; i <= 400; i += 80) {
                const start = project(-400, i, -100, cam, { width: w, height: h, near: 10, far: 5000 });
                const end = project(400, i, -100, cam, { width: w, height: h, near: 10, far: 5000 });
                if (start.scale > 0 && end.scale > 0) {
                    ctx.beginPath();
                    ctx.moveTo(start.x, start.y);
                    ctx.lineTo(end.x, end.y);
                    ctx.stroke();
                }
                const vStart = project(i, -400, -100, cam, { width: w, height: h, near: 10, far: 5000 });
                const vEnd = project(i, 400, -100, cam, { width: w, height: h, near: 10, far: 5000 });
                if (vStart.scale > 0 && vEnd.scale > 0) {
                    ctx.beginPath();
                    ctx.moveTo(vStart.x, vStart.y);
                    ctx.lineTo(vEnd.x, vEnd.y);
                    ctx.stroke();
                }
            }

            // Golgi Apparatus - 3D Structural Representation
            const golgiPos = project(-250, -300, -150, cam, { width: w, height: h, near: 10, far: 5000 });
            if (golgiPos.scale > 0) {
                ctx.strokeStyle = 'rgba(255, 150, 255, 0.5)';
                ctx.lineWidth = 8 * golgiPos.scale;
                for (let k = 0; k < 4; k++) {
                    ctx.beginPath();
                    ctx.moveTo(golgiPos.x - 40 * golgiPos.scale, golgiPos.y + k * 10 * golgiPos.scale);
                    ctx.bezierCurveTo(
                        golgiPos.x - 20 * golgiPos.scale, golgiPos.y + k * 10 * golgiPos.scale - 20 * golgiPos.scale,
                        golgiPos.x + 20 * golgiPos.scale, golgiPos.y + k * 10 * golgiPos.scale + 20 * golgiPos.scale,
                        golgiPos.x + 40 * golgiPos.scale, golgiPos.y + k * 10 * golgiPos.scale
                    );
                    ctx.stroke();
                }
                ctx.fillStyle = '#fff';
                ctx.font = `bold ${10 * golgiPos.scale}px Arial`;
                ctx.fillText('GOLGI COMPLEX', golgiPos.x, golgiPos.y - 30 * golgiPos.scale);
            }

            // Endoplasmic Reticulum (ER) - Tubular Network
            const erPos = project(-300, 100, 200, cam, { width: w, height: h, near: 10, far: 5000 });
            if (erPos.scale > 0) {
                ctx.fillStyle = 'rgba(100, 150, 255, 0.3)';
                for (let k = 0; k < 5; k++) {
                    const ang = k * (Math.PI * 0.4);
                    ctx.beginPath();
                    ctx.arc(erPos.x + Math.cos(ang) * 40 * erPos.scale, erPos.y + Math.sin(ang) * 20 * erPos.scale, 25 * erPos.scale, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.fillStyle = '#fff';
                ctx.font = `bold ${10 * erPos.scale}px Arial`;
                ctx.fillText('ROUGH ER', erPos.x, erPos.y);
            }
        };

G.refreshUIText = function() {
    const t = (k) => window.GreenhouseModelsUtil ? window.GreenhouseModelsUtil.t(k) : k;
    const info = document.querySelector('.serotonin-info');
    if (info) {
        info.innerHTML = `<strong>${t('Serotonin Structural Model')}</strong><br>${t('Visualization of 5-HT1A in complex with Gi.')}`;
    }
    const btns = document.querySelectorAll('.serotonin-btn.dropdown-toggle');
    if (btns.length >= 5) {
        btns[0].innerText = t('Accessibility');
        btns[1].innerText = t('Aesthetics');
        btns[2].innerText = t('Feedback/HUD');
        btns[3].innerText = t('Temporal');
        btns[4].innerText = t('Scenarios');
    }
};
    };

    // Keyboard Shortcuts (Accessibility #11)
    G.setupKeyboardShortcuts = function() {
        window.addEventListener('keydown', (e) => {
            const key = e.key.toUpperCase();
            if (key === 'P') G.paused = !G.paused;
            if (key === 'R') location.reload(); // Release/Reset
            if (key === 'M') {
                // Cycle through some modes or just log for now
                console.log('Mode Switch triggered');
            }
            if (key === 'S') {
                if (G.Analytics) G.Analytics.exportData();
            }
        });
    };

    G.toggleColorBlind = function(type) {
        const filterMap = {
            'deuteranopia': 'url("#deuteranopia-filter")',
            'protanopia': 'url("#protanopia-filter")',
            'tritanopia': 'url("#tritanopia-filter")'
        };
        const canvas = G.canvas;
        if (!canvas) return;

        if (canvas.style.filter.includes(type)) {
            canvas.style.filter = 'none';
        } else {
            canvas.style.filter = filterMap[type] || 'none';
            // Inject SVG filters if not present (simplified for now as standard CSS filter)
            if (type === 'deuteranopia') canvas.style.filter = 'grayscale(50%) sepia(50%)'; // Placeholder
        }
    };

    const oldRender = G.render;
    G.render = function() {
        if (oldRender) oldRender.call(G);

        const ctx = G.ctx;

        // OCD Pathway schematic (Category 8, #73)
        if (G.currentView === 'OCD Pathway') {
            ctx.strokeStyle = '#666';
            ctx.lineWidth = 1;
            ctx.strokeRect(G.width/2 - 100, G.height/2 - 100, 200, 200);
            ctx.fillStyle = '#fff';
            ctx.fillText('CSTC Loop Schematic', G.width/2, G.height/2 - 110);
            ctx.fillText('OFC -> Striatum -> Thalamus -> OFC', G.width/2, G.height/2);
        }

        // Amygdala feedback loop (Category 8, #72)
        if (G.currentView === 'Amygdala Loop') {
            ctx.strokeStyle = '#ff4d4d';
            ctx.beginPath();
            ctx.arc(G.width/2, G.height/2, 80, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = '#fff';
            ctx.fillText('Amygdala Feedback (Anxiety modeling)', G.width/2, G.height/2 - 95);
            ctx.fillText('5-HT1A Autoreceptor Control', G.width/2, G.height/2);
        }

        // Serotonin Syndrome visuals (Category 7, #69)
        if (G.ssActive) {
            ctx.fillStyle = `rgba(255, 0, 0, ${0.1 + Math.sin(Date.now() * 0.01) * 0.05})`;
            ctx.fillRect(0, 0, G.width, G.height);
        }

        // Comparison View logic (Category 10, #97)
        if (G.comparisonMode) {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(G.width/2, 0);
            ctx.lineTo(G.width/2, G.height);
            ctx.stroke();
        }
        const w = G.width;
        const h = G.height;
        const cam = G.state.camera;
        if (!window.GreenhouseModels3DMath) return;
        const project = window.GreenhouseModels3DMath.project3DTo2D.bind(window.GreenhouseModels3DMath);

        if (G.renderSubcellularMarkers) G.renderSubcellularMarkers(ctx, project, cam, w, h);
    };
})();
