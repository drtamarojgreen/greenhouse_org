(function () {
    'use strict';

    const GreenhouseRNATooltip = {
        tooltipElement: null,

        initialize() {
            if (this.tooltipElement) return;

            // Create Tooltip DOM Element
            this.tooltipElement = document.createElement('div');
            this.tooltipElement.id = 'rna-tooltip';
            this.tooltipElement.style.position = 'absolute';
            this.tooltipElement.style.display = 'none';
            this.tooltipElement.style.pointerEvents = 'none'; 
            this.tooltipElement.style.backgroundColor = 'rgba(20, 30, 40, 0.95)'; 
            this.tooltipElement.style.border = '1px solid #4ECDC4';
            this.tooltipElement.style.padding = '10px 15px';
            this.tooltipElement.style.borderRadius = '8px';
            this.tooltipElement.style.color = '#fff';
            this.tooltipElement.style.fontFamily = 'Helvetica Neue, Arial, sans-serif';
            this.tooltipElement.style.zIndex = '1000';
            this.tooltipElement.style.boxShadow = '0 4px 10px rgba(0,0,0,0.4)';
            this.tooltipElement.style.maxWidth = '260px';
            this.tooltipElement.style.transition = 'opacity 0.2s';

            document.body.appendChild(this.tooltipElement);

            // Listen for language changes
            window.addEventListener('greenhouseLanguageChanged', () => {
                this.hide(); // Hide tooltip on language change to avoid inconsistencies
            });
        },

        // Show Tooltip at specific screen coordinates
        show(x, y, key) {
            if (!this.tooltipElement) this.initialize();
            const t = (k) => window.GreenhouseModelsUtil ? window.GreenhouseModelsUtil.t(k) : k;

            // Map keys to translation keys
            const keyMap = {
                'A': 'rna_base_a',
                'U': 'rna_base_u',
                'C': 'rna_base_c',
                'G': 'rna_base_g',
                'Ligase': 'rna_ligase',
                'RtcB': 'rna_ligase',
                'Demethylase': 'rna_demethylase',
                'AlkB': 'rna_demethylase',
                'Methylation': 'rna_methylation',
                'Break': 'rna_break',
                'Ribosome': 'rna_ribosome',
                'Ribosome (Stalled)': 'rna_ribosome_stalled',
                'Pus1': 'rna_base_u', // Placeholder or add specific
                'Dcp2': 'rna_break'    // Placeholder or add specific
            };

            const baseKey = keyMap[key] || key;
            const title = t(baseKey + '_title');
            const desc = t(baseKey + '_desc');

            if (title === baseKey + '_title') return; // Key not found

            this.tooltipElement.innerHTML = `
                <div style="font-weight: bold; color: #4ECDC4; margin-bottom: 5px; border-bottom: 1px solid #4ECDC4; padding-bottom: 3px;">${title}</div>
                <div style="font-size: 0.9em; line-height: 1.4; color: #e0e0e0;">${desc}</div>
            `;

            this.tooltipElement.style.display = 'block';
            this.tooltipElement.style.left = (x + 15) + 'px';
            this.tooltipElement.style.top = (y + 15) + 'px';
        },

        hide() {
            if (this.tooltipElement) {
                this.tooltipElement.style.display = 'none';
            }
        }
    };

    window.GreenhouseRNATooltip = GreenhouseRNATooltip;

})();
