/**
 * @file dopamine_legend.js
 * @description Legend for Dopamine Simulation with detailed visual mapping.
 */

(function () {
    'use strict';
    const G = window.GreenhouseDopamine || {};
    window.GreenhouseDopamine = G;

    G.initLegend = function (container) {
        const legend = document.createElement('div');
        legend.className = 'dopamine-legend';
        legend.style.position = 'absolute';
        legend.style.bottom = '10px';
        legend.style.right = '10px';
        legend.style.background = 'rgba(0, 0, 0, 0.85)';
        legend.style.padding = '12px';
        legend.style.borderRadius = '8px';
        legend.style.color = '#fff';
        legend.style.fontSize = '11px';
        legend.style.pointerEvents = 'none';
        legend.style.zIndex = '100';
        legend.style.border = '1px solid #4fd1c5';
        legend.style.boxShadow = '0 0 10px rgba(79, 209, 197, 0.2)';
        legend.style.maxHeight = '90vh';
        legend.style.overflowY = 'auto';

        legend.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 8px; color: #4fd1c5; text-transform: uppercase; letter-spacing: 1px;">Visual Mapping Guide</div>

            <div style="margin-bottom: 8px; padding-bottom: 5px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <div style="font-weight: bold; margin-bottom: 3px; color: #aaa;">Receptors & G-Proteins</div>
                <div style="display: flex; align-items: center; margin-bottom: 2px;">
                    <div style="width: 10px; height: 10px; background: #ff4d4d; border-radius: 50%; margin-right: 6px;"></div> D1-like Receptor (Red)
                </div>
                <div style="display: flex; align-items: center; margin-bottom: 2px;">
                    <div style="width: 10px; height: 10px; background: #4d79ff; border-radius: 50%; margin-right: 6px;"></div> D2-like Receptor (Blue)
                </div>
                <div style="display: flex; align-items: center; margin-bottom: 2px;">
                    <div style="width: 10px; height: 10px; background: #ff9999; border-radius: 50%; margin-right: 6px;"></div> Gs Protein (alpha/beta-gamma)
                </div>
                <div style="display: flex; align-items: center; margin-bottom: 2px;">
                    <div style="width: 10px; height: 10px; background: #9999ff; border-radius: 50%; margin-right: 6px;"></div> Gi Protein (alpha/beta-gamma)
                </div>
                <div style="display: flex; align-items: center; margin-bottom: 2px;">
                    <div style="width: 10px; height: 10px; background: #99ff99; border-radius: 50%; margin-right: 6px;"></div> Gq Protein (Green - Heteromers)
                </div>
            </div>

            <div style="margin-bottom: 8px; padding-bottom: 5px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <div style="font-weight: bold; margin-bottom: 3px; color: #aaa;">Dopamine & Dynamics</div>
                <div style="display: flex; align-items: center; margin-bottom: 2px;">
                    <div style="width: 10px; height: 10px; background: #00ff00; border-radius: 50%; margin-right: 6px;"></div> Dopamine Particle
                </div>
                <div style="display: flex; align-items: center; margin-bottom: 2px;">
                    <div style="width: 10px; height: 10px; border: 2px solid #00ff00; border-radius: 50%; margin-right: 6px; box-sizing: border-box;"></div> Phasic Burst (Volume Transmission)
                </div>
                <div style="display: flex; align-items: center; margin-bottom: 2px;">
                    <div style="width: 10px; height: 10px; background: #ffff00; border-radius: 2px; margin-right: 6px;"></div> Vesicle (RRP / Reserve Pools)
                </div>
            </div>

            <div style="margin-bottom: 8px; padding-bottom: 5px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <div style="font-weight: bold; margin-bottom: 3px; color: #aaa;">Striatal Anatomy</div>
                <div style="display: flex; align-items: center; margin-bottom: 2px;">
                    <div style="width: 10px; height: 10px; background: #5c4033; border-radius: 50%; margin-right: 6px;"></div> Striosome Compartment (Patch)
                </div>
                <div style="display: flex; align-items: center; margin-bottom: 2px;">
                    <div style="width: 10px; height: 10px; background: rgba(0, 100, 100, 0.3); border-radius: 2px; margin-right: 6px;"></div> Striatal Matrix
                </div>
                <div style="display: flex; align-items: center; margin-bottom: 2px;">
                    <div style="width: 10px; height: 10px; border: 1px solid #6666ff; margin-right: 6px;"></div> 3D Brain Atlas (Regions Highlighted)
                </div>
            </div>

            <div style="margin-bottom: 8px;">
                <div style="font-weight: bold; margin-bottom: 3px; color: #aaa;">Cellular Interactions</div>
                <div style="display: flex; align-items: center; margin-bottom: 2px;">
                    <div style="width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-bottom: 10px solid #ff00ff; margin-right: 6px;"></div> PV+ Interneuron (Fast-Spiking)
                </div>
                <div style="display: flex; align-items: center; margin-bottom: 2px;">
                    <div style="width: 12px; height: 12px; border: 1px solid rgba(0, 255, 255, 0.4); border-radius: 50%; margin-right: 6px;"></div> Astrocyte (Tripartite Synapse)
                </div>
                <div style="display: flex; align-items: center; margin-bottom: 2px;">
                    <div style="width: 10px; height: 10px; border: 1px solid #ffff00; border-radius: 50%; margin-right: 6px;"></div> AP Back-propagation (Yellow Rings)
                </div>
            </div>

            <div style="margin-top: 5px; font-size: 9px; color: #888; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 5px;">
                Detailed molecular structures: 7-Transmembrane helices, Intracellular Loop 3 (IL3), and C-terminal tail are dynamically modeled.
            </div>
        `;

        container.appendChild(legend);
    };

    G.renderLegend = function (ctx) {
        // Static UI legend managed via DOM
    };
})();
