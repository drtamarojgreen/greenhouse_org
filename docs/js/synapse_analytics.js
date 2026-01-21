// docs/js/synapse_analytics.js

(function () {
    'use strict';

    const G = window.GreenhouseSynapseApp || {};
    window.GreenhouseSynapseApp = G;

    G.Analytics = {
        state: {
            calcium: 0.1, // uM
            atp: 100.0,    // %
            health: 100.0
        },

        calculateHealthScore(config, particleCount) {
            const optimalCount = 50;
            const variance = Math.abs(particleCount - optimalCount);
            const score = Math.max(0, 100 - (variance * 2));
            return score;
        },

        renderDashboard(container) {
            let html = `
                <div id="analytics-panel" style="margin-top: 20px; padding: 20px; background: rgba(0,242,255,0.05); border-radius: 15px; border: 1px solid rgba(0,242,255,0.1);">
                    <h3 style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #00F2FF; margin-bottom: 10px; font-weight: 700;">Live Telemetry</h3>

                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="font-size: 11px; color: #aaa;">[Ca2+]i (Intracellular)</span>
                        <span id="calcium-level" style="font-family: monospace; font-size: 14px; color: #fff;">0.10 μM</span>
                    </div>

                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <span style="font-size: 11px; color: #aaa;">Mitochondrial ATP</span>
                        <div style="width: 100px; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden;">
                            <div id="atp-bar" style="width: 100%; height: 100%; background: #FFD700;"></div>
                        </div>
                    </div>

                    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.05); pt: 10px;">
                        <span style="font-size: 12px; color: #ccc;">Synaptic Health Score</span>
                        <span id="health-score" style="font-family: monospace; font-size: 18px; color: #00F2FF; font-weight: bold;">--</span>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', html);
        },

        update(particleCount, ionCount) {
            // Update Calcium based on ion activity (simplified)
            this.state.calcium = 0.1 + (ionCount * 0.05);
            if (this.state.calcium > 2.0) this.state.calcium = 2.0;

            // ATP consumption simulation
            if (particleCount > 60) {
                this.state.atp -= 0.05;
            } else {
                this.state.atp += 0.02;
            }
            this.state.atp = Math.min(100, Math.max(0, this.state.atp));

            this.state.health = this.calculateHealthScore({}, particleCount);

            // Update UI
            const scoreElem = document.getElementById('health-score');
            if (scoreElem) scoreElem.innerText = this.state.health.toFixed(1);

            const caElem = document.getElementById('calcium-level');
            if (caElem) caElem.innerText = `${this.state.calcium.toFixed(2)} μM`;

            const atpBar = document.getElementById('atp-bar');
            if (atpBar) {
                atpBar.style.width = `${this.state.atp}%`;
                atpBar.style.background = this.state.atp < 20 ? '#ff4444' : '#FFD700';
            }
        }
    };
})();
