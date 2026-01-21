// docs/js/synapse_controls.js

(function () {
    'use strict';

    const G = window.GreenhouseSynapseApp || {};
    window.GreenhouseSynapseApp = G;

    G.Controls = {
        render(container, config, callbacks) {
            const { onToggleBurst, onUpdateSensitivity, onToggleDrug, onToggleHighContrast } = callbacks;

            G.config.pharmacology = G.config.pharmacology || { ssriActive: false, antagonistActive: false };
            G.config.kinetics = G.config.kinetics || { enzymaticRate: 0.002 };

            let html = `
                <div style="margin-top: 20px; padding: 20px; background: rgba(255,255,255,0.03); border-radius: 15px; border: 1px solid rgba(255,255,255,0.05);">
                    <h3 style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #357438; margin-bottom: 15px; font-weight: 700;">Research Controls</h3>

                    <div style="margin-bottom: 15px;">
                        <button id="burst-btn" aria-label="Trigger Synaptic Vesicle Burst" style="width: 100%; background: #357438; color: #fff; border: none; padding: 10px; border-radius: 8px; cursor: pointer; font-weight: 600; transition: background 0.3s;">Trigger Vesicle Burst</button>
                    </div>

                    <div style="margin-bottom: 20px;">
                        <label style="display: block; font-size: 10px; color: #aaa; margin-bottom: 8px;">Pharmacological Agents</label>
                        <div style="display: flex; gap: 10px; flex-wrap: wrap;" role="group" aria-label="Pharmacology Toggles">
                            <label style="font-size: 11px; color: #ddd; display: flex; align-items: center; cursor: pointer;">
                                <input type="checkbox" id="ssri-toggle" ${G.config.pharmacology.ssriActive ? 'checked' : ''} style="margin-right: 5px;" aria-label="Toggle SSRI"> SSRI
                            </label>
                            <label style="font-size: 11px; color: #ddd; display: flex; align-items: center; cursor: pointer;">
                                <input type="checkbox" id="antagonist-toggle" ${G.config.pharmacology.antagonistActive ? 'checked' : ''} style="margin-right: 5px;" aria-label="Toggle Antagonist"> Antagonist
                            </label>
                        </div>
                    </div>

                    <div style="margin-bottom: 20px;">
                        <label for="sensitivity-range" style="display: block; font-size: 10px; color: #aaa; margin-bottom: 5px;">Receptor Sensitivity</label>
                        <input type="range" id="sensitivity-range" min="0.1" max="2.0" step="0.1" value="1.0" style="width: 100%; accent-color: #357438;" aria-label="Adjust Receptor Sensitivity">
                    </div>

                    <div style="border-top: 1px solid rgba(255,255,255,0.05); padding-top: 15px;">
                        <label style="font-size: 11px; color: #ddd; display: flex; align-items: center; cursor: pointer;">
                            <input type="checkbox" id="contrast-toggle" ${G.config.highContrast ? 'checked' : ''} style="margin-right: 5px;" aria-label="Toggle High Contrast Mode"> High Contrast Mode
                        </label>
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

            container.querySelector('#ssri-toggle').addEventListener('change', (e) => {
                G.config.pharmacology.ssriActive = e.target.checked;
                if (onToggleDrug) onToggleDrug('ssri', e.target.checked);
            });

            container.querySelector('#antagonist-toggle').addEventListener('change', (e) => {
                G.config.pharmacology.antagonistActive = e.target.checked;
                if (onToggleDrug) onToggleDrug('antagonist', e.target.checked);
            });

            container.querySelector('#contrast-toggle').addEventListener('change', (e) => {
                G.config.highContrast = e.target.checked;
                if (onToggleHighContrast) onToggleHighContrast(e.target.checked);
            });
        }
    };
})();
