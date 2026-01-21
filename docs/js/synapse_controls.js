// docs/js/synapse_controls.js

(function () {
    'use strict';

    const GreenhouseSynapseControls = {
        settings: {
            drugMode: 'none', // 'none', 'agonist', 'antagonist'
            lipidComposition: 0.5, // 0 to 1
            activeZoneDensity: 0.5 // 0 to 1
        },

        init(config) {
            this.config = config;
            console.log("Synapse Controls: Initialized.");
        },

        setDrugMode(mode) {
            this.settings.drugMode = mode;
            console.log(`Drug Mode set to: ${mode}`);
        },

        setLipidComposition(value) {
            this.settings.lipidComposition = value;
            console.log(`Lipid Composition set to: ${value}`);
        },

        setActiveZoneDensity(value) {
            this.settings.activeZoneDensity = value;
            console.log(`Active Zone Density set to: ${value}`);
        },

        applyToSimulation(particles, receptors) {
            // Logic to modify simulation based on settings
            if (this.settings.drugMode === 'antagonist') {
                receptors.forEach(r => {
                    if (Math.random() < 0.3) r.state = 'blocked';
                });
            }
        }
    };

    window.GreenhouseSynapseControls = GreenhouseSynapseControls;
})();
