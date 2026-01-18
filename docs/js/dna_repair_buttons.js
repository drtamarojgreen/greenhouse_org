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
            { id: 'replicate', label: 'Replication' },
            { id: 'sandbox', label: 'Sandbox Mode' },
            { id: 'photo', label: 'Photolyase (Direct)' },
            { id: 'mgmt', label: 'MGMT Repair' },
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

        // Antioxidant Slider
        const aoContainer = document.createElement('div');
        aoContainer.style.display = 'flex';
        aoContainer.style.alignItems = 'center';
        aoContainer.style.gap = '5px';
        aoContainer.style.marginLeft = '10px';
        aoContainer.style.color = '#48bb78';
        aoContainer.style.fontSize = '10px';

        const aoLabel = document.createElement('label');
        aoLabel.innerText = 'Antioxidants:';

        const aoSlider = document.createElement('input');
        aoSlider.type = 'range';
        aoSlider.min = '0';
        aoSlider.max = '100';
        aoSlider.value = this.state.antioxidantLevel || 0;
        aoSlider.style.width = '60px';
        aoSlider.oninput = (e) => {
            this.state.antioxidantLevel = parseInt(e.target.value);
        };

        aoContainer.appendChild(aoLabel);
        aoContainer.appendChild(aoSlider);
        controls.appendChild(aoContainer);

        // Cell Cycle Phase Selector
        const phaseContainer = document.createElement('div');
        phaseContainer.style.display = 'flex';
        phaseContainer.style.gap = '5px';
        phaseContainer.style.marginLeft = '15px';

        ['G1', 'S', 'G2'].forEach(phase => {
            const pBtn = document.createElement('button');
            pBtn.className = 'dna-control-btn' + (this.state.cellCyclePhase === phase ? ' active' : '');
            pBtn.innerText = phase;
            pBtn.style.padding = '4px 8px';
            pBtn.onclick = () => {
                this.state.cellCyclePhase = phase;
                phaseContainer.querySelectorAll('.dna-control-btn').forEach(b => b.classList.remove('active'));
                pBtn.classList.add('active');
                this.updateInfoOverlay();
            };
            phaseContainer.appendChild(pBtn);
        });
        controls.appendChild(phaseContainer);

        // p53 Toggle
        const p53Btn = document.createElement('button');
        p53Btn.className = 'dna-control-btn' + (this.state.p53Functional ? ' active' : '');
        p53Btn.innerText = 'p53: OK';
        p53Btn.style.marginLeft = '15px';
        p53Btn.style.borderColor = '#48bb78';
        p53Btn.onclick = () => {
            this.state.p53Functional = !this.state.p53Functional;
            p53Btn.innerText = this.state.p53Functional ? 'p53: OK' : 'p53: MUTATED';
            p53Btn.style.borderColor = this.state.p53Functional ? '#48bb78' : '#f56565';
            p53Btn.classList.toggle('active', this.state.p53Functional);
            this.updateInfoOverlay();
        };
        controls.appendChild(p53Btn);

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

        // Export Button
        const exportBtn = document.createElement('button');
        exportBtn.className = 'dna-control-btn';
        exportBtn.innerText = 'Export Stats';
        exportBtn.style.marginLeft = '10px';
        exportBtn.onclick = () => {
            const data = {
                timestamp: new Date().toISOString(),
                stats: {
                    atpConsumed: this.state.atpConsumed,
                    genomicIntegrity: this.state.genomicIntegrity,
                    mutationCount: this.state.mutationCount,
                    successfulRepairs: this.state.successfulRepairs,
                    mutatedRepairs: this.state.mutatedRepairs
                },
                config: this.config
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `dna_repair_stats_${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
        };
        controls.appendChild(exportBtn);

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

        const sos = document.createElement('div');
        sos.id = 'dna-sos-indicator';
        sos.style.color = '#ff0000';
        sos.style.fontSize = '14px';
        sos.style.fontWeight = 'bold';
        sos.style.display = 'none';
        sos.innerText = '⚠ SOS RESPONSE ACTIVE';
        stats.appendChild(sos);
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

        const cycle = document.createElement('div');
        cycle.id = 'dna-cycle-info';
        cycle.style.color = '#ecc94b';
        cycle.style.fontSize = '12px';
        cycle.innerText = 'Cell Cycle: G1';

        stats.appendChild(atp);
        stats.appendChild(integrity);
        stats.appendChild(analytics);
        stats.appendChild(cycle);

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
            'mgmt': "<strong>MGMT (Direct Repair)</strong><br>Repairs O6-methylguanine by direct methyl group transfer to a cysteine residue in the protein, which is then degraded.",
            'replicate': "<strong>DNA Replication</strong><br>The process of producing two identical replicas from one original DNA molecule. Demonstration includes Helicase (unwinding), DNA Polymerase (synthesis), and Leading/Lagging strands.",
            'sandbox': "<strong>Sandbox Mode</strong><br>Manual interference mode. Click on any DNA base to induce or remove damage. Use this to test specific scenarios.",
            'dsb': "<strong>Double-Strand Break (DSB)</strong><br>A dangerous break where both strands of the helix are severed. Repaired by re-joining the ends.",
            'nhej': "<strong>Non-Homologous End Joining (NHEJ)</strong><br>A fast, error-prone pathway for DSBs that ligates ends directly, often causing small deletions.",
            'hr': "<strong>Homologous Recombination (HR)</strong><br>High-fidelity DSB repair that uses a sister chromatid as a template to ensure accurate restoration. Only available in S and G2 phases when a sister chromatid is present."
        };

        content.innerHTML = descriptions[this.state.repairMode] || '';
        this.updateStats();
    };
})();
