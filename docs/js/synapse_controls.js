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
                benzodiazepineActive: false,
                bbbActive: false,
                metabolizer: 'normal'
            };
            G.config.kinetics = G.config.kinetics || {
                enzymaticRate: 0.002,
                diffusionCoefficient: 1.0,
                pH: 7.4,
                cleftWidth: 1.0,
                cholesterol: 1.0
            };
            G.config.visuals = G.config.visuals || {
                showIsoforms: false,
                showElectrostatic: false,
                isNight: false,
                showLiterature: false,
                patchClampActive: false
            };

            let html = `
                <div style="margin-top: 20px; padding: 20px; background: rgba(255,255,255,0.03); border-radius: 15px; border: 1px solid rgba(255,255,255,0.05);">
                    <h3 style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #357438; margin-bottom: 15px; font-weight: 700;">Research Controls</h3>

                    <div style="margin-bottom: 15px; display: flex; gap: 8px;">
                        <button id="burst-btn" aria-label="Trigger Synaptic Vesicle Burst" style="flex: 1; background: #357438; color: #fff; border: none; padding: 8px; border-radius: 8px; cursor: pointer; font-size: 11px; font-weight: 600; transition: background 0.3s;">Burst</button>
                        <button id="patch-btn" style="flex: 1; background: ${G.config.visuals.patchClampActive ? '#00F2FF' : '#1a1c1e'}; color: ${G.config.visuals.patchClampActive ? '#000' : '#fff'}; border: 1px solid #00F2FF; padding: 8px; border-radius: 8px; cursor: pointer; font-size: 11px; font-weight: 600;">Patch Tool</button>
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
                                <input type="checkbox" id="bbb-toggle" ${G.config.pharmacology.bbbActive ? 'checked' : ''} style="margin-right: 5px;"> BBB Shield
                            </label>
                            <label style="font-size: 11px; color: #ddd; display: flex; align-items: center; cursor: pointer;">
                                <input type="checkbox" id="night-toggle" ${G.config.visuals.isNight ? 'checked' : ''} style="margin-right: 5px;"> Night Cycle
                            </label>
                        </div>
                    </div>

                    <div style="margin-bottom: 12px;">
                        <label for="cholesterol-range" style="display: block; font-size: 10px; color: #aaa; margin-bottom: 5px;">Membrane Cholesterol</label>
                        <input type="range" id="cholesterol-range" min="0.1" max="2.0" step="0.1" value="${G.config.kinetics.cholesterol}" style="width: 100%; accent-color: #707870;">
                    </div>

                    <div style="margin-bottom: 12px;">
                        <label for="cleft-range" style="display: block; font-size: 10px; color: #aaa; margin-bottom: 5px;">Synaptic Cleft Width</label>
                        <input type="range" id="cleft-range" min="0.5" max="2.0" step="0.1" value="${G.config.kinetics.cleftWidth}" style="width: 100%; accent-color: #FFD700;">
                    </div>

                    <div style="margin-bottom: 20px;">
                         <label style="display: block; font-size: 10px; color: #aaa; margin-bottom: 8px;">Analysis Layers</label>
                         <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                            <label style="font-size: 11px; color: #ddd; display: flex; align-items: center; cursor: pointer;">
                                <input type="checkbox" id="isoform-toggle" ${G.config.visuals.showIsoforms ? 'checked' : ''} style="margin-right: 5px;"> Proteomics
                            </label>
                            <label style="font-size: 11px; color: #ddd; display: flex; align-items: center; cursor: pointer;">
                                <input type="checkbox" id="literature-toggle" ${G.config.visuals.showLiterature ? 'checked' : ''} style="margin-right: 5px;"> Literature
                            </label>
                         </div>
                    </div>

                    <div style="display: flex; flex-direction: column; gap: 10px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 15px;">
                        <button id="export-btn" style="width: 100%; background: transparent; color: #00F2FF; border: 1px solid #00F2FF; padding: 8px; border-radius: 8px; cursor: pointer; font-size: 11px; font-weight: 600; text-transform: uppercase;">Generate Research Figure</button>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', html);

            container.querySelector('#burst-btn').addEventListener('click', () => {
                if (onToggleBurst) onToggleBurst();
            });

            container.querySelector('#patch-btn').addEventListener('click', () => {
                G.config.visuals.patchClampActive = !G.config.visuals.patchClampActive;
                if (onUpdateParam) onUpdateParam('patchClamp', G.config.visuals.patchClampActive);
                this.render(container, config, callbacks); // Re-render to update button color
            });

            container.querySelector('#cholesterol-range').addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                G.config.kinetics.cholesterol = val;
                if (onUpdateParam) onUpdateParam('cholesterol', val);
            });

            container.querySelector('#cleft-range').addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                G.config.kinetics.cleftWidth = val;
                if (onUpdateParam) onUpdateParam('cleft', val);
            });

            container.querySelector('#isoform-toggle').addEventListener('change', (e) => {
                G.config.visuals.showIsoforms = e.target.checked;
            });

            container.querySelector('#literature-toggle').addEventListener('change', (e) => {
                G.config.visuals.showLiterature = e.target.checked;
            });

            container.querySelector('#ssri-toggle').addEventListener('change', (e) => {
                G.config.pharmacology.ssriActive = e.target.checked;
                if (onToggleDrug) onToggleDrug('ssri', e.target.checked);
            });

            container.querySelector('#antagonist-toggle').addEventListener('change', (e) => {
                G.config.pharmacology.antagonistActive = e.target.checked;
                if (onToggleDrug) onToggleDrug('antagonist', e.target.checked);
            });

            container.querySelector('#bbb-toggle').addEventListener('change', (e) => {
                G.config.pharmacology.bbbActive = e.target.checked;
            });

            container.querySelector('#night-toggle').addEventListener('change', (e) => {
                G.config.visuals.isNight = e.target.checked;
            });

            container.querySelector('#export-btn').addEventListener('click', () => {
                if (onGenerateFigure) onGenerateFigure();
            });
        }
    };
})();
