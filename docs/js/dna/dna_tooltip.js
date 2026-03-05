(function () {
    'use strict';

    const GreenhouseDNATooltip = {
        tooltipElement: null,

        initialize() {
            if (this.tooltipElement) return;

            // Create Tooltip DOM Element
            this.tooltipElement = document.createElement('div');
            this.tooltipElement.id = 'dna-tooltip';
            this.tooltipElement.style.position = 'absolute';
            this.tooltipElement.style.display = 'none';
            this.tooltipElement.style.pointerEvents = 'auto'; // Allow clicking links
            this.tooltipElement.style.backgroundColor = 'rgba(20, 20, 30, 0.9)';
            this.tooltipElement.style.border = '1px solid #667eea';
            this.tooltipElement.style.padding = '10px 15px';
            this.tooltipElement.style.borderRadius = '8px';
            this.tooltipElement.style.color = '#fff';
            this.tooltipElement.style.fontFamily = 'Arial, sans-serif';
            this.tooltipElement.style.zIndex = '1000';
            this.tooltipElement.style.boxShadow = '0 4px 6px rgba(0,0,0,0.3)';
            this.tooltipElement.style.maxWidth = '250px';
            this.tooltipElement.style.transition = 'opacity 0.2s';

            document.body.appendChild(this.tooltipElement);

            window.addEventListener('greenhouseLanguageChanged', () => {
                this.hide();
            });
        },

        // Show Tooltip at specific screen coordinates
        show(x, y, key) {
            if (!this.tooltipElement) this.initialize();
            const t = (k) => window.GreenhouseModelsUtil ? window.GreenhouseModelsUtil.t(k) : k;

            const keyMap = {
                'A': 'dna_base_a',
                'T': 'dna_base_t',
                'C': 'dna_base_c',
                'G': 'dna_base_g',
                'Backbone': 'dna_backbone',
                'BER': 'dna_ber',
                'MMR': 'dna_mmr',
                'DSB': 'dna_dsb',
                'Helicase': 'dna_helicase',
                'Polymerase': 'dna_polymerase',
                'Okazaki': 'dna_okazaki'
            };

            const baseKey = keyMap[key] || key;
            const title = t(baseKey + '_title');
            const desc = t(baseKey + '_desc');

            if (title === baseKey + '_title') return;

            const wikipediaBase = 'https://en.wikipedia.org/wiki/';
            const links = {
                'dna_base_a': 'Adenine',
                'dna_base_t': 'Thymine',
                'dna_base_c': 'Cytosine',
                'dna_base_g': 'Guanine',
                'dna_backbone': 'Phosphodiester_bond',
                'dna_ber': 'Base_excision_repair',
                'dna_mmr': 'DNA_mismatch_repair',
                'dna_dsb': 'Double-strand_break',
                'dna_helicase': 'Helicase',
                'dna_polymerase': 'DNA_polymerase',
                'dna_okazaki': 'Okazaki_fragments'
            };

            const linkText = t('dna_wiki_link');
            const link = links[baseKey] ? `<div style="margin-top: 8px; border-top: 1px solid #4a5568; padding-top: 5px;">
                <a href="${wikipediaBase}${links[baseKey]}" target="_blank" style="color: #63b3ed; text-decoration: none; font-size: 0.8em;">${linkText}</a>
            </div>` : '';

            this.tooltipElement.innerHTML = `
                <div style="font-weight: bold; color: #a3bffa; margin-bottom: 4px;">${title}</div>
                <div style="font-size: 0.9em; line-height: 1.4;">${desc}</div>
                ${link}
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

    window.GreenhouseDNATooltip = GreenhouseDNATooltip;

})();
