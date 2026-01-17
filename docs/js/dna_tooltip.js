(function () {
    'use strict';

    const GreenhouseDNATooltip = {
        tooltipElement: null,

        // Dictionary for Internationalization (i18n)
        i18n: {
            'en': {
                'A': { title: 'Adenine (A)', desc: 'A purine base that pairs with Thymine (T) in DNA.' },
                'T': { title: 'Thymine (T)', desc: 'A pyrimidine base that pairs with Adenine (A) in DNA.' },
                'C': { title: 'Cytosine (C)', desc: 'A pyrimidine base that pairs with Guanine (G) in DNA.' },
                'G': { title: 'Guanine (G)', desc: 'A purine base that pairs with Cytosine (C) in DNA.' },
                'Backbone': { title: 'Sugar-Phosphate Backbone', desc: 'The structural framework of nucleic acids, composed of alternating sugar and phosphate groups.' },
                'BER': { title: 'Base Excision Repair', desc: 'A cellular mechanism that repairs damaged DNA throughout the cell cycle.' },
                'MMR': { title: 'Mismatch Repair', desc: 'A system for recognizing and repairing erroneous insertion, deletion, and mis-incorporation of bases.' },
                'DSB': { title: 'Double-Strand Break Repair', desc: 'A mechanism to repair breaks that occur in both strands of the DNA double helix.' }
            },
            'es': {
                'A': { title: 'Adenina (A)', desc: 'Una base de purina que se empareja con Timina (T) en el ADN.' },
                'T': { title: 'Timina (T)', desc: 'Una base de pirimidina que se empareja con Adenina (A) en el ADN.' },
                'C': { title: 'Citosina (C)', desc: 'Una base de pirimidina que se empareja con Guanina (G) en el ADN.' },
                'G': { title: 'Guanina (G)', desc: 'Una base de purina que se empareja con Citosina (C) en el ADN.' }
            }
            // Add other languages here
        },

        currentLang: 'en',

        initialize() {
            if (this.tooltipElement) return;

            // Create Tooltip DOM Element
            this.tooltipElement = document.createElement('div');
            this.tooltipElement.id = 'dna-tooltip';
            this.tooltipElement.style.position = 'absolute';
            this.tooltipElement.style.display = 'none';
            this.tooltipElement.style.pointerEvents = 'none'; // Don't block mouse
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
        },

        // Show Tooltip at specific screen coordinates
        show(x, y, key) {
            if (!this.tooltipElement) this.initialize();

            const data = this.i18n[this.currentLang][key];
            if (!data) return;

            this.tooltipElement.innerHTML = `
                <div style="font-weight: bold; color: #a3bffa; margin-bottom: 4px;">${data.title}</div>
                <div style="font-size: 0.9em; line-height: 1.4;">${data.desc}</div>
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

    window.GreenhouseDNATooltip = GreenhouseDNATooltip;

})();
