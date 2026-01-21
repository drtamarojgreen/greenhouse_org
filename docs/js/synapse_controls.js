// docs/js/synapse_controls.js

(function () {
    'use strict';

    const G = window.GreenhouseSynapseApp || {};
    window.GreenhouseSynapseApp = G;

    G.Controls = {
        render(container, config, callbacks) {
            const { onToggleBurst, onUpdateSensitivity, onToggleDrug, onToggleHighContrast, onGenerateFigure, onUpdateParam } = callbacks;

            G.config.pharmacology = G.config.pharmacology || {
                ssriActive: false,
                antagonistActive: false,
                ttxActive: false,
                benzodiazepineActive: false
            };
            G.config.kinetics = G.config.kinetics || {
                enzymaticRate: 0.002,
                diffusionCoefficient: 1.0,
                pH: 7.4
            };
            G.config.visuals = G.config.visuals || {
                showIsoforms: false,
                showElectrostatic: false
            };

            let html = `
                <div style="margin-top: 20px; padding: 20px; background: rgba(255,255,255,0.03); border-radius: 15px; border: 1px solid rgba(255,255,255,0.05);">
                    <h3 style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #357438; margin-bottom: 15px; font-weight: 700;">Research Controls</h3>

                    <div style="margin-bottom: 15px;">
                        <button id="burst-btn" aria-label="Trigger Synaptic Vesicle Burst" style="width: 100%; background: #357438; color: #fff; border: none; padding: 10px; border-radius: 8px; cursor: pointer; font-weight: 600; transition: background 0.3s;">Trigger Vesicle Burst</button>
                    </div>

                    <div style="margin-bottom: 20px;">
                        <label style="display: block; font-size: 10px; color: #aaa; margin-bottom: 8px;">Pharmacological Panel</label>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;" role="group" aria-label="Pharmacology Toggles">
                            <label style="font-size: 11px; color: #ddd; display: flex; align-items: center; cursor: pointer;">
                                <input type="checkbox" id="ssri-toggle" ${G.config.pharmacology.ssriActive ? 'checked' : ''} style="margin-right: 5px;"> SSRI
                            </label>
                            <label style="font-size: 11px; color: #ddd; display: flex; align-items: center; cursor: pointer;">
                                <input type="checkbox" id="antagonist-toggle" ${G.config.pharmacology.antagonistActive ? 'checked' : ''} style="margin-right: 5px;"> Antagonist
                            </label>
                            <label style="font-size: 11px; color: #ddd; display: flex; align-items: center; cursor: pointer;">
                                <input type="checkbox" id="ttx-toggle" ${G.config.pharmacology.ttxActive ? 'checked' : ''} style="margin-right: 5px;"> Tetrodotoxin
                            </label>
                            <label style="font-size: 11px; color: #ddd; display: flex; align-items: center; cursor: pointer;">
                                <input type="checkbox" id="benzo-toggle" ${G.config.pharmacology.benzodiazepineActive ? 'checked' : ''} style="margin-right: 5px;"> Benzo
                            </label>
                        </div>
                    </div>

                    <div style="margin-bottom: 15px;">
                        <label for="diffusion-range" style="display: block; font-size: 10px; color: #aaa; margin-bottom: 5px;">Diffusion Coefficient (D)</label>
                        <input type="range" id="diffusion-range" min="0.1" max="5.0" step="0.1" value="${G.config.kinetics.diffusionCoefficient}" style="width: 100%; accent-color: #00F2FF;">
                    </div>

                    <div style="margin-bottom: 20px;">
                        <label for="ph-range" style="display: block; font-size: 10px; color: #aaa; margin-bottom: 5px;">pH Level</label>
                        <input type="range" id="ph-range" min="6.0" max="8.0" step="0.1" value="${G.config.kinetics.pH}" style="width: 100%; accent-color: #FF1493;">
                    </div>

                    <div style="margin-bottom: 20px;">
                         <label style="display: block; font-size: 10px; color: #aaa; margin-bottom: 8px;">Analysis Layers</label>
                         <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                            <label style="font-size: 11px; color: #ddd; display: flex; align-items: center; cursor: pointer;">
                                <input type="checkbox" id="isoform-toggle" ${G.config.visuals.showIsoforms ? 'checked' : ''} style="margin-right: 5px;"> Proteomics
                            </label>
                            <label style="font-size: 11px; color: #ddd; display: flex; align-items: center; cursor: pointer;">
                                <input type="checkbox" id="electro-toggle" ${G.config.visuals.showElectrostatic ? 'checked' : ''} style="margin-right: 5px;"> Electrostatic
                            </label>
                         </div>
                    </div>

                    <div style="display: flex; flex-direction: column; gap: 10px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 15px;">
                        <label style="font-size: 11px; color: #ddd; display: flex; align-items: center; cursor: pointer;">
                            <input type="checkbox" id="contrast-toggle" ${G.config.highContrast ? 'checked' : ''} style="margin-right: 5px;" aria-label="Toggle High Contrast Mode"> High Contrast Mode
                        </label>
                        <button id="export-btn" style="width: 100%; background: transparent; color: #00F2FF; border: 1px solid #00F2FF; padding: 8px; border-radius: 8px; cursor: pointer; font-size: 11px; font-weight: 600; text-transform: uppercase;">Generate Research Figure</button>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', html);

            container.querySelector('#burst-btn').addEventListener('click', () => {
                if (onToggleBurst) onToggleBurst();
            });

            container.querySelector('#diffusion-range').addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                G.config.kinetics.diffusionCoefficient = val;
                if (onUpdateParam) onUpdateParam('diffusion', val);
            });

            container.querySelector('#ph-range').addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                G.config.kinetics.pH = val;
                if (onUpdateParam) onUpdateParam('pH', val);
            });

            container.querySelector('#isoform-toggle').addEventListener('change', (e) => {
                G.config.visuals.showIsoforms = e.target.checked;
            });

            container.querySelector('#electro-toggle').addEventListener('change', (e) => {
                G.config.visuals.showElectrostatic = e.target.checked;
            });

            container.querySelector('#ssri-toggle').addEventListener('change', (e) => {
                G.config.pharmacology.ssriActive = e.target.checked;
                if (onToggleDrug) onToggleDrug('ssri', e.target.checked);
            });

            container.querySelector('#antagonist-toggle').addEventListener('change', (e) => {
                G.config.pharmacology.antagonistActive = e.target.checked;
                if (onToggleDrug) onToggleDrug('antagonist', e.target.checked);
            });

            container.querySelector('#ttx-toggle').addEventListener('change', (e) => {
                G.config.pharmacology.ttxActive = e.target.checked;
                if (onToggleDrug) onToggleDrug('ttx', e.target.checked);
            });

            container.querySelector('#benzo-toggle').addEventListener('change', (e) => {
                G.config.pharmacology.benzodiazepineActive = e.target.checked;
                if (onToggleDrug) onToggleDrug('benzodiazepine', e.target.checked);
            });

            container.querySelector('#contrast-toggle').addEventListener('change', (e) => {
                G.config.highContrast = e.target.checked;
                if (onToggleHighContrast) onToggleHighContrast(e.target.checked);
            });

            container.querySelector('#export-btn').addEventListener('click', () => {
                if (onGenerateFigure) onGenerateFigure();
            });
        }
    };
})();
