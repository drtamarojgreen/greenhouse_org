// docs/js/synapse_analytics.js

(function () {
    'use strict';

    const G = window.GreenhouseSynapseApp || {};
    window.GreenhouseSynapseApp = G;

    G.Analytics = {
        metrics: {
            calciumConcentration: 0,
            receptorActivationRate: 0,
            synapticHealthScore: 100
        },
        history: [],

        update(particles, receptors) {
            const calciumParticles = particles.filter(p => p.chemistry && p.chemistry.id === 'calcium');
            this.metrics.calciumConcentration = calciumParticles.length * 0.1;
            this.calculateHealthScore(receptors);
            this.history.push({ ...this.metrics, timestamp: Date.now() });
            if (this.history.length > 100) this.history.shift();
        },

        calculateHealthScore(receptors) {
            const activeReceptors = receptors.filter(r => r.state === 'active' || r.state === 'open').length;
            const blockedReceptors = receptors.filter(r => r.state === 'blocked').length;
            let score = 100 - (blockedReceptors * 10);
            if (activeReceptors > 0) score += 5;
            this.metrics.synapticHealthScore = Math.min(100, Math.max(0, score));
        }
    };
})();
