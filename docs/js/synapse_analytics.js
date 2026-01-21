// docs/js/synapse_analytics.js

(function () {
    'use strict';

    const G = window.GreenhouseSynapseApp || {};
    window.GreenhouseSynapseApp = G;

    G.Analytics = {
        state: {
            calcium: 0.1, // uM
            atp: 100.0,    // %
            health: 100.0,
            membraneCurrent: 0.0, // pA
            doseResponse: [],
            sensitivity: 1.0
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

                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="font-size: 11px; color: #aaa;">Membrane Current</span>
                        <span id="membrane-current" style="font-family: monospace; font-size: 14px; color: #FFD700;">0.0 pA</span>
                    </div>

                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <span style="font-size: 11px; color: #aaa;">Simulation Sensitivity</span>
                        <span id="sensitivity-index" style="font-family: monospace; font-size: 14px; color: #00F2FF;">1.00</span>
                    </div>

                    <div style="margin-bottom: 12px;">
                        <label style="display: block; font-size: 10px; color: #aaa; margin-bottom: 5px;">Mitochondrial ATP</label>
                        <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden;">
                            <div id="atp-bar" style="width: 100%; height: 100%; background: #FFD700;"></div>
                        </div>
                    </div>

                    <div style="border-top: 1px solid rgba(255,255,255,0.05); padding-top: 10px;">
                        <canvas id="dose-response-chart" width="260" height="80" style="width: 100%; height: 40px; margin-bottom: 10px;"></canvas>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 12px; color: #ccc;">Synaptic Health Score</span>
                            <span id="health-score" style="font-family: monospace; font-size: 18px; color: #00F2FF; font-weight: bold;">--</span>
                        </div>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', html);
        },

        update(particleCount, ionCount, activeReceptors) {
            this.state.calcium = 0.1 + (ionCount * 0.05);
            if (this.state.calcium > 2.0) this.state.calcium = 2.0;

            this.state.membraneCurrent = (activeReceptors * 1.5) + (ionCount * 0.8);

            // Sensitivity Analysis (Enhancement #98)
            this.state.sensitivity = G.Particles.plasticityFactor;

            if (particleCount > 60) {
                this.state.atp -= 0.05;
            } else {
                this.state.atp += 0.02;
            }
            this.state.atp = Math.min(100, Math.max(0, this.state.atp));

            this.state.health = this.calculateHealthScore({}, particleCount);

            if (G.frame % 30 === 0) {
                this.state.doseResponse.push(this.state.membraneCurrent);
                if (this.state.doseResponse.length > 20) this.state.doseResponse.shift();
                this.drawChart();
            }

            const scoreElem = document.getElementById('health-score');
            if (scoreElem) scoreElem.innerText = this.state.health.toFixed(1);

            const caElem = document.getElementById('calcium-level');
            if (caElem) caElem.innerText = `${this.state.calcium.toFixed(2)} μM`;

            const currentElem = document.getElementById('membrane-current');
            if (currentElem) currentElem.innerText = `${this.state.membraneCurrent.toFixed(1)} pA`;

            const sensElem = document.getElementById('sensitivity-index');
            if (sensElem) sensElem.innerText = this.state.sensitivity.toFixed(2);

            const atpBar = document.getElementById('atp-bar');
            if (atpBar) {
                atpBar.style.width = `${this.state.atp}%`;
                atpBar.style.background = this.state.atp < 20 ? '#ff4444' : '#FFD700';
            }
        },

        drawChart() {
            const canvas = document.getElementById('dose-response-chart');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            const w = canvas.width;
            const h = canvas.height;

            ctx.clearRect(0, 0, w, h);
            ctx.strokeStyle = '#00F2FF';
            ctx.lineWidth = 2;
            ctx.beginPath();

            const step = w / 20;
            this.state.doseResponse.forEach((val, i) => {
                const x = i * step;
                const y = h - (val * 1.5);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.stroke();

            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.font = '8px Arial';
            ctx.fillText('DOSE-RESPONSE', 5, 10);
        }
    };
})();
