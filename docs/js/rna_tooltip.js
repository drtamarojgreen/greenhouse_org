(function () {
    'use strict';

    const GreenhouseRNATooltip = {
        tooltipElement: null,

        // Dictionary for Internationalization (i18n)
        i18n: {
            'en': {
                'A': { title: 'Adenine (A)', desc: 'A purine base found in RNA that pairs with Uracil (U).' },
                'U': { title: 'Uracil (U)', desc: 'A pyrimidine base found in RNA that pairs with Adenine (A). It replaces Thymine found in DNA.' },
                'C': { title: 'Cytosine (C)', desc: 'A pyrimidine base found in RNA that pairs with Guanine (G).' },
                'G': { title: 'Guanine (G)', desc: 'A purine base found in RNA that pairs with Cytosine (C).' },
                'Ligase': { title: 'RNA Ligase', desc: 'An enzyme that repairs breaks in the RNA backbone by joining strand ends.' },
                'Demethylase': { title: 'Demethylase (AlkB)', desc: 'An enzyme that removes methyl groups from damaged RNA bases via oxidative demethylation.' },
                'Methylation': { title: 'Methylation Damage', desc: 'Addition of a methyl group to a base, which can interfere with RNA function and translation.' },
                'Break': { title: 'Strand Break', desc: 'A physical cleavage of the RNA phosphodiester backbone.' }
            },
            'es': {
                'A': { title: 'Adenina (A)', desc: 'Una base de purina en el ARN que se empareja con Uracilo (U).' },
                'U': { title: 'Uracilo (U)', desc: 'Una base de pirimidina en el ARN que se empareja con Adenina (A).' },
                'C': { title: 'Citosina (C)', desc: 'Una base de pirimidina en el ARN que se empareja con Guanina (G).' },
                'G': { title: 'Guanina (G)', desc: 'Una base de purina en el ARN que se empareja con Citosina (C).' }
            }
        },

        currentLang: 'en',

        initialize() {
            if (this.tooltipElement) return;

            // Create Tooltip DOM Element
            this.tooltipElement = document.createElement('div');
            this.tooltipElement.id = 'rna-tooltip';
            this.tooltipElement.style.position = 'absolute';
            this.tooltipElement.style.display = 'none';
            this.tooltipElement.style.pointerEvents = 'none'; // Don't block mouse
            this.tooltipElement.style.backgroundColor = 'rgba(20, 30, 40, 0.95)'; // Darker blue-ish for RNA theme
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
        },

        // Show Tooltip at specific screen coordinates
        show(x, y, key) {
            if (!this.tooltipElement) this.initialize();

            // Handle damage/enzyme keys that might be distinct
            let lookupKey = key;
            if (key && key.includes('Methylation')) lookupKey = 'Methylation';

            const data = this.i18n[this.currentLang][lookupKey] || this.i18n[this.currentLang][key];
            if (!data) return;

            this.tooltipElement.innerHTML = `
                <div style="font-weight: bold; color: #4ECDC4; margin-bottom: 5px; border-bottom: 1px solid #4ECDC4; padding-bottom: 3px;">${data.title}</div>
                <div style="font-size: 0.9em; line-height: 1.4; color: #e0e0e0;">${data.desc}</div>
            `;

            this.tooltipElement.style.display = 'block';
            this.tooltipElement.style.left = (x + 15) + 'px';
            this.tooltipElement.style.top = (y + 15) + 'px';
        },

        hide() {
            if (this.tooltipElement) {
                this.tooltipElement.style.display = 'none';
            }
        },

        setLanguage(lang) {
            if (this.i18n[lang]) {
                this.currentLang = lang;
            }
        }
    };

    window.GreenhouseRNATooltip = GreenhouseRNATooltip;

})();
