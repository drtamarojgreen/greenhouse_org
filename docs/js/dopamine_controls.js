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
        const controls = document.createElement('div');
        controls.className = 'dopamine-controls';
        controls.style.flexWrap = 'wrap';
        controls.style.maxWidth = '600px';
        // 93. Screen Reader Support
        controls.setAttribute('role', 'group');
        controls.setAttribute('aria-label', 'Dopamine Simulation Controls');

        const modes = [
            'D1R Signaling', 'D2R Signaling', 'Heteromer',
            'Parkinsonian', 'L-DOPA Pulse',
            'Cocaine', 'Amphetamine', 'Phasic Burst',
            'Schizophrenia', 'ADHD', 'Drug Combo',
            'Alpha-Synuclein', 'Neuroinflammation', 'MAOI',
            'Antipsychotic (Fast-off)', 'Antipsychotic (Slow-off)',
            'Antipsychotic (Partial)', 'High Stress', 'PAM', 'Competitive'
        ];
        modes.forEach(mode => {
            const btn = document.createElement('button');
            btn.className = 'dopamine-btn';
            btn.innerText = mode;
            btn.setAttribute('aria-pressed', 'false');
            btn.onclick = () => {
                console.log(`Switching to ${mode}`);
                G.state.mode = mode;
                G.state.signalingActive = true;

                // Update ARIA pressed state
                Array.from(controls.querySelectorAll('.dopamine-btn')).forEach(b => b.setAttribute('aria-pressed', 'false'));
                btn.setAttribute('aria-pressed', 'true');

                // Special handlers
                if (mode === 'Parkinsonian') {
                    if (G.synapseState) G.synapseState.pathologicalState = 'Parkinsonian';
                } else if (mode === 'D1R Signaling' || mode === 'D2R Signaling') {
                    if (G.synapseState) G.synapseState.pathologicalState = 'Healthy';
                }
            };
            controls.appendChild(btn);
        });

        // 91. Drug Library Selector
        const drugSelect = document.createElement('select');
        drugSelect.className = 'dopamine-btn';
        drugSelect.innerHTML = '<option value="">Select Drug (Library)</option>';
        if (G.molecularState && G.molecularState.drugLibrary) {
            const lib = G.molecularState.drugLibrary;
            const allDrugs = [...lib.d1Agonists, ...lib.d1Antagonists, ...lib.d2Agonists, ...lib.d2Antagonists, ...lib.pams];
            allDrugs.forEach(d => {
                const opt = document.createElement('option');
                opt.value = d;
                opt.innerText = d;
                drugSelect.appendChild(opt);
            });
        }
        drugSelect.onchange = (e) => {
            const drug = e.target.value;
            if (G.pharmacologyState) {
                G.pharmacologyState.selectedDrug = { name: drug };
                console.log(`Selected drug: ${drug}`);
                // Implement kinetics based on drug name
                if (drug === 'Haloperidol') {
                    G.pharmacologyState.antipsychoticType = 'Slow-off';
                    G.pharmacologyState.antipsychoticOffRate = 0.05;
                } else if (drug === 'Clozapine' || drug === 'Risperidone') {
                    G.pharmacologyState.antipsychoticType = 'Fast-off';
                    G.pharmacologyState.antipsychoticOffRate = 0.5;
                } else if (drug === 'Aripiprazole (Partial)') {
                    G.state.mode = 'Antipsychotic (Partial)';
                }
            }
        };
        controls.appendChild(drugSelect);

        // 100. Reset to Default Safety
        const resetBtn = document.createElement('button');
        resetBtn.className = 'dopamine-btn';
        resetBtn.innerText = 'Reset (R)';
        resetBtn.style.borderColor = '#f56565';
        resetBtn.onclick = () => G.resetToDefault();
        controls.appendChild(resetBtn);

        // 92. Color-Blind Accessible Palettes
        const paletteSelect = document.createElement('select');
        paletteSelect.className = 'dopamine-btn';
        paletteSelect.innerHTML = `
            <option value="default">Default Palette</option>
            <option value="deuteranopia">Deuteranopia</option>
            <option value="protanopia">Protanopia</option>
            <option value="tritanopia">Tritanopia</option>
        `;
        paletteSelect.onchange = (e) => {
            G.uxState.palette = e.target.value;
            this.applyPalette(e.target.value);
        };
        controls.appendChild(paletteSelect);

        // 91. Multi-Language Support
        const langBtn = document.createElement('button');
        langBtn.className = 'dopamine-btn';
        langBtn.innerText = 'Language (EN)';
        langBtn.onclick = () => {
            G.uxState.language = G.uxState.language === 'en' ? 'es' : 'en';
            langBtn.innerText = `Language (${G.uxState.language.toUpperCase()})`;
            this.updateLanguage();
        };
        controls.appendChild(langBtn);

        // 96. In-App Feedback Tool
        const feedbackBtn = document.createElement('button');
        feedbackBtn.className = 'dopamine-btn';
        feedbackBtn.innerText = 'Feedback';
        feedbackBtn.onclick = () => {
            const msg = prompt("Enter your feedback or bug report:");
            if (msg) console.log("User Feedback:", msg);
        };
        controls.appendChild(feedbackBtn);

        container.appendChild(controls);

        const info = document.createElement('div');
        info.className = 'dopamine-info';
        info.id = 'dopamine-info-display';
        info.innerHTML = '<strong>Dopamine Signaling</strong><br>Select a mode to visualize pathway.';
        container.appendChild(info);
    };
})();
