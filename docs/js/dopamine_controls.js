/**
 * @file dopamine_controls.js
 * @description UI controls for Dopamine Simulation.
 */

(function () {
    'use strict';
    const G = window.GreenhouseDopamine || {};
    window.GreenhouseDopamine = G;

    G.applyPalette = function (palette) {
        console.log(`Applying ${palette} palette`);
        if (!G.state.receptors) return;

        const schemes = {
            default: ['#ff4d4d', '#4d79ff', '#4dff4d', '#ffff4d', '#ff4dff'],
            deuteranopia: ['#e69f00', '#56b4e9', '#009e73', '#f0e442', '#0072b2'],
            protanopia: ['#882255', '#4477aa', '#117733', '#ddcc77', '#cc6677'],
            tritanopia: ['#000000', '#e69f00', '#56b4e9', '#009e73', '#f0e442']
        };
        const colors = schemes[palette] || schemes.default;
        G.state.receptors.forEach((r, i) => {
            r.color = colors[i % colors.length];
        });
    };

    G.updateLanguage = function () {
        const translations = {
            en: { title: "Dopamine Signaling", select: "Select a mode to visualize pathway." },
            es: { title: "Señalización de Dopamina", select: "Seleccione un modo para visualizar la vía." }
        };
        const t = translations[G.uxState.language];
        const info = document.getElementById('dopamine-info-display');
        if (info) {
            info.innerHTML = `<strong>${t.title}</strong><br>${t.select}`;
        }
    };

    G.createUI = function (container) {
        const t = (k) => window.GreenhouseModelsUtil ? window.GreenhouseModelsUtil.t(k) : k;
        const isMobile = window.GreenhouseUtils && window.GreenhouseUtils.isMobileUser();
        const controls = document.createElement('div');
        controls.className = 'dopamine-controls';
        if (isMobile) controls.style.display = 'none';
        controls.style.display = 'flex';
        controls.style.gap = '10px';
        controls.style.padding = '10px';
        controls.style.backgroundColor = 'rgba(0,0,0,0.8)';
        controls.style.borderRadius = '0 0 10px 10px';
        controls.style.backdropFilter = 'blur(5px)';
        controls.setAttribute('role', 'group');
        controls.setAttribute('aria-label', 'Dopamine Simulation Controls');

        const createDropdown = (label, options) => {
            const dropdown = document.createElement('div');
            dropdown.className = 'dopamine-dropdown';
            dropdown.style.position = 'relative';

            const btn = document.createElement('button');
            btn.className = 'dopamine-btn';
            btn.innerText = label;
            btn.onclick = (e) => {
                e.stopPropagation();
                const content = dropdown.querySelector('.dropdown-content');
                const isOpen = content.style.display === 'block';
                document.querySelectorAll('.dropdown-content').forEach(c => c.style.display = 'none');
                content.style.display = isOpen ? 'none' : 'block';
            };
            dropdown.appendChild(btn);

            const content = document.createElement('div');
            content.className = 'dropdown-content';
            content.style.display = 'none';
            content.style.position = 'absolute';
            content.style.top = '100%';
            content.style.left = '0';
            content.style.backgroundColor = '#1a202c';
            content.style.border = '1px solid #4a5568';
            content.style.borderRadius = '4px';
            content.style.zIndex = '100';
            content.style.minWidth = '200px';
            content.style.maxHeight = '400px';
            content.style.overflowY = 'auto';
            content.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';

            options.forEach(opt => {
                const item = document.createElement('div');
                item.style.padding = '8px 12px';
                item.style.cursor = 'pointer';
                item.style.color = '#fff';
                item.style.display = 'flex';
                item.style.alignItems = 'center';
                item.style.gap = '10px';
                item.style.borderBottom = '1px solid #2d3748';

                if (opt.type === 'checkbox') {
                    const cb = document.createElement('input');
                    cb.type = 'checkbox';
                    cb.checked = opt.checked();
                    cb.onchange = (e) => opt.action(e.target.checked);
                    item.appendChild(cb);
                    const lbl = document.createElement('span');
                    lbl.innerText = opt.label;
                    item.appendChild(lbl);
                    item.onclick = (e) => {
                        if (e.target !== cb) {
                            cb.checked = !cb.checked;
                            opt.action(cb.checked);
                        }
                    };
                } else {
                    item.innerText = opt.label;
                    item.onclick = () => {
                        opt.action();
                        content.style.display = 'none';
                    };
                }

                item.onmouseover = () => item.style.backgroundColor = '#2d3748';
                item.onmouseout = () => item.style.backgroundColor = 'transparent';
                content.appendChild(item);
            });

            dropdown.appendChild(content);
            return dropdown;
        };

        // Groups
        const signalingOptions = [
            { label: 'D1R Signaling', action: () => setMode('D1R Signaling') },
            { label: 'D2R Signaling', action: () => setMode('D2R Signaling') },
            { label: 'Heteromer', action: () => setMode('Heteromer') },
            { label: 'Phasic Burst', action: () => setMode('Phasic Burst') },
            { label: 'Tonic Release', action: () => setMode('Tonic Release') }
        ];

        const scenarioOptions = [
            { type: 'checkbox', label: 'Cocaine', checked: () => G.state.scenarios.cocaine, action: (val) => G.state.scenarios.cocaine = val },
            { type: 'checkbox', label: 'Amphetamine', checked: () => G.state.scenarios.amphetamine, action: (val) => G.state.scenarios.amphetamine = val },
            { type: 'checkbox', label: 'ADHD', checked: () => G.state.scenarios.adhd, action: (val) => G.state.scenarios.adhd = val },
            { type: 'checkbox', label: 'Parkinsonian', checked: () => G.state.scenarios.parkinsonian, action: (val) => { G.state.scenarios.parkinsonian = val; if (G.synapseState) G.synapseState.pathologicalState = val ? 'Parkinsonian' : 'Baseline'; } },
            { type: 'checkbox', label: 'Schizophrenia', checked: () => G.state.scenarios.schizophrenia, action: (val) => G.state.scenarios.schizophrenia = val },
            { type: 'checkbox', label: 'Alpha-Synuclein', checked: () => G.state.scenarios.alphaSynuclein, action: (val) => G.state.scenarios.alphaSynuclein = val },
            { label: 'L-DOPA Pulse', action: () => setMode('L-DOPA Pulse') },
            { type: 'checkbox', label: 'Neuroinflammation', checked: () => G.state.scenarios.neuroinflammation, action: (val) => G.state.scenarios.neuroinflammation = val },
            { type: 'checkbox', label: 'High Stress', checked: () => G.state.scenarios.highStress, action: (val) => G.state.scenarios.highStress = val },
            { type: 'checkbox', label: 'D1-D2 Heteromer', checked: () => G.state.scenarios.heteromer, action: (val) => G.state.scenarios.heteromer = val },
            { label: 'Region: Ventral Striatum', action: () => setMode('Ventral Striatum') },
            { label: 'Region: PFC', action: () => setMode('PFC Signaling') }
        ];

        const pharmacologyOptions = [
            { type: 'checkbox', label: 'MAOI Inhibitor', checked: () => G.state.scenarios.maoi, action: (val) => G.state.scenarios.maoi = val },
            { label: 'MAOI (Mode Only)', action: () => setMode('MAOI') },
            { label: 'Antipsychotic (Fast-off)', action: () => setMode('Antipsychotic (Fast-off)') },
            { label: 'Antipsychotic (Slow-off)', action: () => setMode('Antipsychotic (Slow-off)') },
            { label: 'Antipsychotic (Partial)', action: () => setMode('Antipsychotic (Partial)') },
            { label: 'PAM', action: () => setMode('PAM') },
            { label: 'Competitive', action: () => setMode('Competitive') }
        ];

        // Drug Library for Pharmacology dropdown
        if (G.molecularState && G.molecularState.drugLibrary) {
            const lib = G.molecularState.drugLibrary;
            const allDrugs = [...lib.d1Agonists, ...lib.d1Antagonists, ...lib.d2Agonists, ...lib.d2Antagonists, ...lib.pams];
            allDrugs.forEach(d => {
                pharmacologyOptions.push({ label: `Drug: ${d.name}`, action: () => selectDrug(d.name) });
            });
        }

        const settingsOptions = [
            { label: 'Language: English', action: () => setLanguage('en') },
            { label: 'Language: Español', action: () => setLanguage('es') },
            { type: 'checkbox', label: 'High Contrast', checked: () => G.uxState.highContrast, action: (val) => toggleHighContrast(val) },
            { type: 'checkbox', label: 'Large Scale UI', checked: () => G.uxState.largeScale, action: (val) => toggleLargeScale(val) },
            { type: 'checkbox', label: 'Reduced Motion', checked: () => G.uxState.reducedMotion, action: (val) => G.uxState.reducedMotion = val },
            { type: 'checkbox', label: 'Show Performance', checked: () => G.uxState.showPerf, action: (val) => G.uxState.showPerf = val },
            { label: 'Palette: Default', action: () => applyPalette('default') },
            { label: 'Palette: Deuteranopia', action: () => applyPalette('deuteranopia') },
            { label: 'Palette: Protanopia', action: () => applyPalette('protanopia') },
            { label: 'Palette: Tritanopia', action: () => applyPalette('tritanopia') }
        ];

        const setMode = (mode) => {
            console.log(`Switching to ${mode}`);
            G.state.mode = mode;
            G.state.signalingActive = true;
        };

        const selectDrug = (drugName) => {
             if (G.selectDrug) {
                G.selectDrug(drugName);
            }
        };

        const applyPalette = (p) => {
            G.uxState.palette = p;
            G.applyPalette(p);
        };

        const setLanguage = (l) => {
            G.uxState.language = l;
            G.updateLanguage();
        };

        const toggleHighContrast = (val) => {
            G.uxState.highContrast = val;
            if (val) {
                document.body.style.filter = 'contrast(1.5) brightness(1.2)';
            } else {
                document.body.style.filter = 'none';
            }
        };

        const toggleLargeScale = (val) => {
            G.uxState.largeScale = val;
            const root = document.documentElement;
            if (val) {
                root.style.fontSize = '20px';
                container.style.transform = 'scale(1.1)';
                container.style.transformOrigin = 'top left';
            } else {
                root.style.fontSize = '16px';
                container.style.transform = 'none';
            }
        };

        controls.appendChild(createDropdown('Signaling', signalingOptions));
        controls.appendChild(createDropdown('Scenarios', scenarioOptions));
        controls.appendChild(createDropdown('Pharmacology', pharmacologyOptions));
        controls.appendChild(createDropdown('Settings', settingsOptions));

        const scientificBtn = document.createElement('button');
        scientificBtn.className = 'dopamine-btn';
        scientificBtn.innerText = 'Scientific Report';
        scientificBtn.style.borderColor = '#4fd1c5';
        scientificBtn.onclick = () => G.showScientificDashboard();
        controls.appendChild(scientificBtn);

        const resetBtn = document.createElement('button');
        resetBtn.className = 'dopamine-btn';
        resetBtn.innerText = 'Reset (R)';
        resetBtn.style.borderColor = '#f56565';
        resetBtn.onclick = () => G.resetToDefault();
        controls.appendChild(resetBtn);

        container.appendChild(controls);

        // Global click listener to close dropdowns
        window.addEventListener('click', () => {
            document.querySelectorAll('.dropdown-content').forEach(c => c.style.display = 'none');
        });

        const info = document.createElement('div');
        info.className = 'dopamine-info';
        info.id = 'dopamine-info-display';
        info.innerHTML = `<strong>${t('Dopamine Signaling Model')}</strong><br>${t('Select a mode to visualize pathway.')}`;
        if (isMobile) info.style.display = 'none';

        if (G.leftPanel) {
            G.leftPanel.prepend(info);
        } else {
            container.appendChild(info);
        }
    };

    G.refreshUIText = function() {
        const t = (k) => window.GreenhouseModelsUtil ? window.GreenhouseModelsUtil.t(k) : k;
        const info = document.getElementById('dopamine-info-display');
        if (info) {
            info.innerHTML = `<strong>${t('Dopamine Signaling Model')}</strong><br>${t('Select a mode to visualize pathway.')}`;
        }
        // Update dropdown buttons
        const btns = document.querySelectorAll('.dopamine-btn');
        if (btns.length >= 6) {
            btns[0].innerText = t('Signaling');
            btns[1].innerText = t('Scenarios');
            btns[2].innerText = t('Pharmacology');
            btns[3].innerText = t('Settings');
            btns[4].innerText = t('Scientific Report');
            btns[5].innerText = t('Reset (R)');
        }
    };
})();
