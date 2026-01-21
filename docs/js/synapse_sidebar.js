// docs/js/synapse_sidebar.js

(function () {
    'use strict';

    const G = window.GreenhouseSynapseApp || {};
    window.GreenhouseSynapseApp = G;

    G.Sidebar = {
        render(container, config, lang, hooks) {
            if (!container) return;
            container.innerHTML = '';

            const title = document.createElement('h2');
            title.textContent = 'Synaptic Bridge';
            title.style.cssText = 'font-size: 32px; margin-bottom: 30px; color: #fff; font-weight: 700;';
            container.appendChild(title);

            const ntSelect = document.createElement('select');
            ntSelect.style.cssText = 'width: 100%; padding: 12px; background: #1a1c1e; color: #fff; border: 1px solid #357438; border-radius: 8px; margin-bottom: 20px;';
            const chem = G.Chemistry;
            if (chem) {
                Object.keys(chem.neurotransmitters).forEach(ntId => {
                    const nt = chem.neurotransmitters[ntId];
                    const opt = document.createElement('option');
                    opt.value = ntId;
                    opt.textContent = `${nt.name[lang]} (${nt.type})`;
                    if (ntId === config.activeNT) opt.selected = true;
                    ntSelect.appendChild(opt);
                });
            }
            ntSelect.onchange = (e) => hooks.onNTChange(e.target.value);
            container.appendChild(ntSelect);

            const legend = document.createElement('div');
            Object.keys(config.translations).forEach(key => {
                const item = document.createElement('div');
                item.style.cssText = 'padding: 10px; margin-bottom: 8px; background: rgba(255,255,255,0.05); border-radius: 6px; cursor: pointer; transition: 0.2s;';
                item.textContent = config.translations[key][lang];
                item.onmouseenter = () => {
                    item.style.background = 'rgba(255,255,255,0.1)';
                    hooks.onHover(key);
                };
                item.onmouseleave = () => {
                    item.style.background = 'rgba(255,255,255,0.05)';
                    hooks.onHover(null);
                };
                legend.appendChild(item);
            });
            container.appendChild(legend);
        }
    };
})();
