// docs/js/dna_repair_buttons.js
// DNA Repair Simulation Module - UI and Buttons
// Handles creation of control bars and info overlays

(function () {
    'use strict';

    window.GreenhouseDNARepair = window.GreenhouseDNARepair || {};
    const G = window.GreenhouseDNARepair;

    G.createUI = function(wrapper) {
        const controls = document.createElement('div');
        controls.className = 'dna-controls-bar';

        const modes = [
            { id: 'ber', label: 'Base Excision' },
            { id: 'mmr', label: 'Mismatch Repair' },
            { id: 'ner', label: 'Nucleotide Excision' },
            { id: 'photo', label: 'Photolyase (Direct)' },
            { id: 'dsb', label: 'Double-Strand Break' },
            { id: 'nhej', label: 'NHEJ (Error Prone)' },
            { id: 'hr', label: 'Homologous Recomb' }
        ];

        modes.forEach(mode => {
            const btn = document.createElement('button');
            btn.className = 'dna-control-btn' + (this.state.repairMode === mode.id ? ' active' : '');
            btn.innerText = mode.label;
            btn.onclick = () => {
                document.querySelectorAll('.dna-control-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.startSimulation(mode.id);
            };
            controls.appendChild(btn);
        });

        // Radiation Slider
        const sliderContainer = document.createElement('div');
        sliderContainer.style.display = 'flex';
        sliderContainer.style.alignItems = 'center';
        sliderContainer.style.gap = '10px';
        sliderContainer.style.marginLeft = '15px';
        sliderContainer.style.color = '#e2e8f0';
        sliderContainer.style.fontSize = '11px';
        sliderContainer.style.background = 'rgba(0,0,0,0.3)';
        sliderContainer.style.padding = '4px 8px';
        sliderContainer.style.borderRadius = '4px';

        const label = document.createElement('label');
        label.innerText = 'Radiation:';

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = '0';
        slider.max = '100';
        slider.value = this.state.radiationLevel;
        slider.style.width = '80px';
        slider.style.cursor = 'pointer';
        slider.oninput = (e) => {
            this.state.radiationLevel = parseInt(e.target.value);
        };

        sliderContainer.appendChild(label);
        sliderContainer.appendChild(slider);
        controls.appendChild(sliderContainer);

        // Reset Button
        const resetBtn = document.createElement('button');
        resetBtn.className = 'dna-control-btn';
        resetBtn.innerText = 'Reset Stats';
        resetBtn.style.marginLeft = '10px';
        resetBtn.onclick = () => {
            this.state.atpConsumed = 0;
            this.state.genomicIntegrity = 100;
            this.state.mutationCount = 0;
            this.state.successfulRepairs = 0;
            this.state.mutatedRepairs = 0;
            this.updateStats();
        };
        controls.appendChild(resetBtn);

        wrapper.appendChild(controls);

        // Info Overlay
        const info = document.createElement('div');
        info.className = 'dna-info-overlay';
        info.id = 'dna-info-overlay';

        const content = document.createElement('div');
        content.id = 'dna-info-content';
        content.innerHTML = '<strong>DNA Repair Simulation</strong><br>Select a mode above to observe molecular repair pathways.';

        const stats = document.createElement('div');
        stats.id = 'dna-stats-container';
        stats.style.display = 'flex';
        stats.style.flexDirection = 'column';
        stats.style.gap = '5px';

        const atp = document.createElement('div');
        atp.className = 'dna-atp-counter';
        atp.id = 'dna-atp-counter';
        atp.innerText = 'ATP Consumed: 0';

        const integrity = document.createElement('div');
        integrity.id = 'dna-integrity-stat';
        integrity.style.color = '#a0aec0';
        integrity.style.fontSize = '12px';
        integrity.innerText = 'Genomic Integrity: 100%';

        const analytics = document.createElement('div');
        analytics.id = 'dna-analytics-stat';
        analytics.style.color = '#63b3ed';
        analytics.style.fontSize = '11px';
        analytics.innerText = 'Successes: 0 | Mutations: 0';

        stats.appendChild(atp);
        stats.appendChild(integrity);
        stats.appendChild(analytics);

        info.appendChild(content);
        info.appendChild(stats);
        wrapper.appendChild(info);
    };

    G.updateInfoOverlay = function() {
        const content = document.getElementById('dna-info-content');
        if (!content) return;

        const descriptions = {
            'ber': "<strong>Base Excision Repair (BER)</strong><br>Corrects small, non-helix-distorting base lesions. A single damaged base is removed and replaced.",
            'mmr': "<strong>Mismatch Repair (MMR)</strong><br>Corrects errors that escape proofreading during replication, such as mispaired bases.",
            'ner': "<strong>Nucleotide Excision Repair (NER)</strong><br>Repairs bulky, helix-distorting lesions (e.g. UV dimers) by removing a short single-stranded DNA segment.",
            'photo': "<strong>Photolyase (Direct Reversal)</strong><br>A light-dependent enzyme that directly breaks the bonds of UV-induced thymine dimers without removing any DNA bases.",
            'dsb': "<strong>Double-Strand Break (DSB)</strong><br>A dangerous break where both strands of the helix are severed. Repaired by re-joining the ends.",
            'nhej': "<strong>Non-Homologous End Joining (NHEJ)</strong><br>A fast, error-prone pathway for DSBs that ligates ends directly, often causing small deletions.",
            'hr': "<strong>Homologous Recombination (HR)</strong><br>High-fidelity DSB repair that uses a sister chromatid as a template to ensure accurate restoration."
        };

        content.innerHTML = descriptions[this.state.repairMode] || '';
        this.updateStats();
    };
})();
