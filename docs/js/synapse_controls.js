// docs/js/synapse_controls.js

(function () {
    'use strict';

    const G = window.GreenhouseSynapseApp || {};
    window.GreenhouseSynapseApp = G;

    G.Controls = {
        render(container, config, callbacks) {
            const { onToggleBurst, onUpdateSensitivity } = callbacks;

            let html = `
                <div style="margin-top: 20px; padding: 20px; background: rgba(255,255,255,0.03); border-radius: 15px; border: 1px solid rgba(255,255,255,0.05);">
                    <h3 style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #357438; margin-bottom: 15px; font-weight: 700;">Research Controls</h3>

                    <div style="margin-bottom: 15px;">
                        <button id="burst-btn" style="width: 100%; background: #357438; color: #fff; border: none; padding: 10px; border-radius: 8px; cursor: pointer; font-weight: 600; transition: background 0.3s;">Trigger Vesicle Burst</button>
                    </div>

                    <div>
                        <label style="display: block; font-size: 10px; color: #aaa; margin-bottom: 5px;">Receptor Sensitivity</label>
                        <input type="range" id="sensitivity-range" min="0.1" max="2.0" step="0.1" value="1.0" style="width: 100%; accent-color: #357438;">
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', html);

            container.querySelector('#burst-btn').addEventListener('click', () => {
                if (onToggleBurst) onToggleBurst();
            });

            container.querySelector('#sensitivity-range').addEventListener('input', (e) => {
                if (onUpdateSensitivity) onUpdateSensitivity(parseFloat(e.target.value));
            });
        }
    };
})();
