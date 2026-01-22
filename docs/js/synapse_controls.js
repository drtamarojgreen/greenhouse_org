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
                metabolizer: 'normal',
                levodopaActive: false,
                offTargetActive: false
            };
            G.config.kinetics = G.config.kinetics || {
                enzymaticRate: 0.002,
                diffusionCoefficient: 1.0,
                pH: 7.4,
                cleftWidth: 1.0,
                cholesterol: 1.0,
                activeZoneDensity: 0.04
            };
            G.config.visuals = G.config.visuals || {
                showIsoforms: false,
                showElectrostatic: false,
                isNight: false,
                showLiterature: false,
                patchClampActive: false,
                annotationMode: false,
                rulerActive: false,
                fluorescenceActive: false
            };

            let html = `
                <div style="margin-top: 20px; padding: 20px; background: rgba(255,255,255,0.03); border-radius: 15px; border: 1px solid rgba(255,255,255,0.05);">
                    <h3 style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #357438; margin-bottom: 15px; font-weight: 700;">Research Controls</h3>

                    <div style="margin-bottom: 15px; display: flex; gap: 8px;">
                        <button id="burst-btn" aria-label="Trigger Synaptic Vesicle Burst" style="flex: 1; background: #357438; color: #fff; border: none; padding: 8px; border-radius: 8px; cursor: pointer; font-size: 11px; font-weight: 600; transition: background 0.3s;">Burst</button>
                        <button id="baseline-btn" style="flex: 1; background: transparent; color: #fff; border: 1px solid rgba(255,255,255,0.3); padding: 8px; border-radius: 8px; cursor: pointer; font-size: 11px; font-weight: 600;">Set Baseline</button>
                    </div>

                    <div style="margin-bottom: 20px;">
                        <label style="display: block; font-size: 10px; color: #aaa; margin-bottom: 8px;">Pharmacological Panel</label>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;" role="group" aria-label="Pharmacology Toggles">
                            <label style="font-size: 11px; color: #ddd; display: flex; align-items: center; cursor: pointer;">
                                <input type="checkbox" id="ssri-toggle" ${G.config.pharmacology.ssriActive ? 'checked' : ''} style="margin-right: 5px;"> SSRI
                            </label>
                            <label style="font-size: 11px; color: #ddd; display: flex; align-items: center; cursor: pointer;">
                                <input type="checkbox" id="offtarget-toggle" ${G.config.pharmacology.offTargetActive ? 'checked' : ''} style="margin-right: 5px;"> Off-target
                            </label>
                            <label style="font-size: 11px; color: #ddd; display: flex; align-items: center; cursor: pointer;">
                                <input type="checkbox" id="bbb-toggle" ${G.config.pharmacology.bbbActive ? 'checked' : ''} style="margin-right: 5px;"> BBB Shield
                            </label>
                            <label style="font-size: 11px; color: #ddd; display: flex; align-items: center; cursor: pointer;">
                                <input type="checkbox" id="levodopa-toggle" ${G.config.pharmacology.levodopaActive ? 'checked' : ''} style="margin-right: 5px;"> Prodrug
                            </label>
                        </div>
                    </div>

                    <div style="margin-bottom: 12px;">
                        <label for="az-range" style="display: block; font-size: 10px; color: #aaa; margin-bottom: 5px;">Active Zone Density</label>
                        <input type="range" id="az-range" min="0.01" max="0.15" step="0.01" value="${G.config.kinetics.activeZoneDensity}" style="width: 100%; accent-color: #357438;">
                    </div>

                    <div style="margin-bottom: 20px;">
                         <label style="display: block; font-size: 10px; color: #aaa; margin-bottom: 8px;">Research Tools</label>
                         <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                            <label style="font-size: 11px; color: #ddd; display: flex; align-items: center; cursor: pointer;">
                                <input type="checkbox" id="ruler-toggle" ${G.config.visuals.rulerActive ? 'checked' : ''} style="margin-right: 5px;"> Ruler
                            </label>
                            <label style="font-size: 11px; color: #ddd; display: flex; align-items: center; cursor: pointer;">
                                <input type="checkbox" id="annotate-toggle" ${G.config.visuals.annotationMode ? 'checked' : ''} style="margin-right: 5px;"> Annotate
                            </label>
                            <label style="font-size: 11px; color: #ddd; display: flex; align-items: center; cursor: pointer;">
                                <input type="checkbox" id="fluor-toggle" ${G.config.visuals.fluorescenceActive ? 'checked' : ''} style="margin-right: 5px;"> Calcium-FL
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

            container.querySelector('#baseline-btn').addEventListener('click', () => {
                if (G.Analytics) G.Analytics.setBaseline();
            });

            container.querySelector('#az-range').addEventListener('input', (e) => {
                G.config.kinetics.activeZoneDensity = parseFloat(e.target.value);
            });

            container.querySelector('#ruler-toggle').addEventListener('change', (e) => {
                G.config.visuals.rulerActive = e.target.checked;
                if (onUpdateParam) onUpdateParam('ruler', e.target.checked);
            });

            container.querySelector('#annotate-toggle').addEventListener('change', (e) => {
                G.config.visuals.annotationMode = e.target.checked;
            });

            container.querySelector('#fluor-toggle').addEventListener('change', (e) => {
                G.config.visuals.fluorescenceActive = e.target.checked;
            });

            container.querySelector('#offtarget-toggle').addEventListener('change', (e) => {
                G.config.pharmacology.offTargetActive = e.target.checked;
            });

            container.querySelector('#levodopa-toggle').addEventListener('change', (e) => {
                G.config.pharmacology.levodopaActive = e.target.checked;
            });

            container.querySelector('#literature-toggle').addEventListener('change', (e) => {
                G.config.visuals.showLiterature = e.target.checked;
            });

            container.querySelector('#ssri-toggle').addEventListener('change', (e) => {
                G.config.pharmacology.ssriActive = e.target.checked;
                if (onToggleDrug) onToggleDrug('ssri', e.target.checked);
            });

            container.querySelector('#bbb-toggle').addEventListener('change', (e) => {
                G.config.pharmacology.bbbActive = e.target.checked;
            });

            container.querySelector('#export-btn').addEventListener('click', () => {
                if (onGenerateFigure) onGenerateFigure();
            });
        }
    };
})();
