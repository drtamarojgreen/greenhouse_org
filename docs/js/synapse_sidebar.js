// docs/js/synapse_sidebar.js

(function () {
    'use strict';

    const GreenhouseSynapseSidebar = {
        render(container, config, currentLanguage, callbacks) {
            const { onHover, onNTChange } = callbacks;
            const lang = currentLanguage || 'en';
            const chem = window.GreenhouseSynapseChemistry;

            const categories = [
                { id: 'preSynapticTerminal', label: config.translations.preSynapticTerminal[lang], color: '#707870' },
                { id: 'postSynapticTerminal', label: config.translations.postSynapticTerminal[lang], color: '#2c3e50' },
                { id: 'vesicle', label: config.translations.vesicle[lang], color: config.accentGold },
                { id: 'neurotransmitter', label: config.translations.neurotransmitter[lang], color: config.accentCyan },
            ];

            const ntOptions = Object.values(chem.neurotransmitters).map(nt => `
                <option value="${nt.id}" ${config.activeNT === nt.id ? 'selected' : ''}>
                    ${nt.name[lang]} (${nt.type})
                </option>
            `).join('');

            let html = `
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 30px;">
                    <div style="width: 12px; height: 12px; border-radius: 50%; background: #357438; box-shadow: 0 0 15px #357438;"></div>
                    <h2 style="font-family: 'Quicksand', sans-serif; font-size: 28px; margin: 0; color: #fff;">Synaptic Bridge</h2>
                </div>
                
                <div style="margin-bottom: 35px; padding: 20px; background: rgba(255,255,255,0.03); border-radius: 15px; border: 1px solid rgba(255,255,255,0.05);">
                    <label style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #357438; margin-bottom: 12px; font-weight: 700;">Select Neurotransmitter</label>
                    <select id="nt-selector" style="width: 100%; background: #1a1c1e; color: #fff; border: 1px solid rgba(255,255,255,0.1); padding: 10px; border-radius: 8px; font-family: inherit; font-size: 14px; cursor: pointer;">
                        ${ntOptions}
                    </select>
                </div>

                <h3 style="font-size: 12px; text-transform: uppercase; letter-spacing: 2px; opacity: 0.5; margin-bottom: 25px;">Neural Anatomy</h3>
                <div id="sidebar-list">
            `;

            categories.forEach(item => {
                html += `
                <div class="sidebar-item" data-id="${item.id}" style="display: flex; align-items: center; margin-bottom: 15px; padding: 12px 15px; background: rgba(255,255,255,0.02); border-radius: 12px; border: 1px solid rgba(255,255,255,0.03); transition: all 0.3s ease; cursor: pointer;">
                    <div class="color-dot" style="width: 10px; height: 10px; background: ${item.color}; border-radius: 50%; margin-right: 15px; box-shadow: 0 0 10px ${item.color}cc; transition: all 0.3s ease;"></div>
                    <span style="font-size: 14px; font-weight: 500; color: #ddd;">${item.label}</span>
                </div>`;
            });

            html += `
                </div>
                <div style="margin-top: 40px; padding: 20px; background: rgba(53, 116, 56, 0.1); border-radius: 15px; border: 1px solid rgba(53, 116, 56, 0.2);">
                    <p style="font-size: 12px; color: #357438; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; font-weight: 700;">Mechanics</p>
                    <p id="nt-description" style="font-size: 13px; color: #ccc; line-height: 1.5; margin: 0;">
                        ${chem.neurotransmitters[config.activeNT || 'serotonin'].type === 'excitatory' ? 'Triggers Sodium inflow to excite the neuron.' : 'Modulates signal response via GPCR signaling.'}
                    </p>
                </div>
            `;
            container.innerHTML = html;

            const selector = container.querySelector('#nt-selector');
            selector.addEventListener('change', (e) => {
                if (onNTChange) onNTChange(e.target.value);
            });

            const items = container.querySelectorAll('.sidebar-item');
            items.forEach(item => {
                const id = item.getAttribute('data-id');
                const dot = item.querySelector('.color-dot');

                item.addEventListener('mouseenter', () => {
                    item.style.background = 'rgba(53, 116, 56, 0.15)';
                    item.style.borderColor = 'rgba(53, 116, 56, 0.3)';
                    dot.style.transform = 'scale(1.4)';
                    dot.style.boxShadow = `0 0 20px ${dot.style.backgroundColor}`;
                    if (onHover) onHover(id);
                });

                item.addEventListener('mouseleave', () => {
                    item.style.background = 'rgba(255,255,255,0.02)';
                    item.style.borderColor = 'rgba(255,255,255,0.03)';
                    dot.style.transform = 'scale(1)';
                    dot.style.boxShadow = `0 0 10px ${dot.style.backgroundColor}cc`;
                    if (onHover) onHover(null);
                });
            });
        }
    };

    window.GreenhouseSynapseSidebar = GreenhouseSynapseSidebar;
})();
