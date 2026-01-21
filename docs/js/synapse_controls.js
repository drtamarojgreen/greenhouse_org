// docs/js/synapse_controls.js

(function () {
    'use strict';

    const G = window.GreenhouseSynapseApp || {};
    window.GreenhouseSynapseApp = G;

    G.Controls = {
        settings: {
            drugMode: 'none',
            lipidComposition: 0.5,
            activeZoneDensity: 0.5
        },

        init(config) {
            console.log("Synapse Controls: Initialized.");
        },

        applyToSimulation(particles, receptors) {
            if (this.settings.drugMode === 'antagonist') {
                receptors.forEach(r => {
                    if (Math.random() < 0.3) r.state = 'blocked';
                });
            }
        }
    };
})();
