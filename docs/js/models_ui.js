// docs/js/models_ui.js

(function () {
    'use strict';

    const GreenhouseModelsUI = {
        canvases: {},
        contexts: {},
        state: {}, // This will be a reference to the main app state

        init(state, GreenhouseModelsUtil) {
            this.state = state;
            this.util = GreenhouseModelsUtil;
            Object.assign(this, GreenhouseModelsUISynapse);
            Object.assign(this, GreenhouseModelsUIBrain);
            Object.assign(this, GreenhouseModelsUIEnvironment);

            // Initialize 3D module if available
            if (window.GreenhouseModelsUI3D) {
                Object.assign(this, GreenhouseModelsUI3D);
            }
        },

        async loadCSS(baseUrl) {
            const cssUrl = `${baseUrl}css/model.css`;
            if (!document.querySelector(`link[href="${cssUrl}"]`)) {
                const link = GreenhouseModelsUtil.createElement('link', { rel: 'stylesheet', href: cssUrl });
                document.head.appendChild(link);
                await new Promise((resolve, reject) => {
                    link.onload = resolve;
                    link.onerror = reject;
                });
            }
        },

        renderConsentScreen(targetElement) {
            targetElement.innerHTML = '';
            const t = (k) => this.util.t(k);

            const container = GreenhouseModelsUtil.createElement('div', { className: 'greenhouse-landing-container' });
            const isMobile = window.GreenhouseUtils && window.GreenhouseUtils.isMobileUser();
            container.innerHTML = `
                ${isMobile ? `
                <div style="position: absolute; top: 10px; right: 10px;">
                    <button id="lang-toggle-consent" class="greenhouse-btn greenhouse-btn-secondary" style="padding: 5px 10px; font-size: 16px; width: auto !important; max-width: fit-content;">
                        ${t('btn_language')}
                    </button>
                </div>
                ` : ''}
                <h1 class="greenhouse-simulation-title">${t('consent_title')}</h1>
                <p>${t('consent_desc')}</p>
                <div class="greenhouse-disclaimer-banner">${t('disclaimer')}</div>
                <label class="greenhouse-consent-label">
                    <input type="checkbox" id="consent-checkbox" class="greenhouse-consent-checkbox" data-testid="consent-checkbox">
                    ${t('consent_check')}
                </label>
                <button id="start-simulation-btn" class="greenhouse-btn greenhouse-btn-primary" disabled data-testid="start-simulation-btn">${t('launch_btn')}</button>
            `;
            targetElement.appendChild(container);

            // Re-attach listeners for the new button
            const langBtn = document.getElementById('lang-toggle-consent');
            if (langBtn) {
                langBtn.addEventListener('click', () => {
                    this.util.toggleLanguage();
                    this.renderConsentScreen(targetElement);
                    // We need to re-bind consent listeners because we wiped the HTML
                    // Note: 'addConsentListeners' in models_ux.js is responsible for binding consent logic.
                    // Since we are inside UI rendering, we should probably trigger a re-bind event or handle it.
                    // However, models_ux calls renderConsentScreen once.
                    // A better approach is to let UX handle re-binding if we re-render.
                    // Or, we can trigger a custom event.
                    // Ideally, we should notify UX to re-bind.
                    // But since I can't easily modify UX to listen to this without complex changes,
                    // I will assume UX needs to be updated to handle dynamic re-rendering or I handle it here.

                    // Actually, models_ux.js calls addConsentListeners right after renderConsentScreen.
                    // If I re-render here, those listeners are lost.
                    // I should trigger the UX to re-bind.
                    if (window.GreenhouseModelsUX && window.GreenhouseModelsUX.addConsentListeners) {
                        window.GreenhouseModelsUX.addConsentListeners();
                    }
                });
            }
            this.renderTOC(container);
        },

        renderSimulationInterface(targetElement) {
            targetElement.innerHTML = '';
            const t = (k) => this.util.t(k);

            const mainContainer = GreenhouseModelsUtil.createElement('div', { className: 'simulation-main-container' });
            const topBanner = GreenhouseModelsUtil.createElement('div', { className: 'greenhouse-disclaimer-banner' }, t('edu_banner'));

            const contentArea = GreenhouseModelsUtil.createElement('div', { className: 'simulation-content-area' });
            const leftColumn = GreenhouseModelsUtil.createElement('div', { className: 'simulation-left-column' });
            const rightColumn = GreenhouseModelsUtil.createElement('div', { className: 'simulation-right-column' });

            const canvasSynaptic = GreenhouseModelsUtil.createElement('canvas', { id: 'canvas-synaptic', style: 'width: 100%; height: 250px; background: #f0f0f0; border-radius: 12px; margin-bottom: 15px;' });
            const canvasNetwork = GreenhouseModelsUtil.createElement('canvas', { id: 'canvas-network', style: 'width: 100%; height: 250px; background: #f0f0f0; border-radius: 12px; margin-bottom: 15px;' });
            const canvasEnvironment = GreenhouseModelsUtil.createElement('canvas', { id: 'canvas-environment', style: 'width: 100%; height: 250px; background: #e9e9e9; border-radius: 12px;' });

            const synapticControls = GreenhouseModelsUtil.createElement('div', { id: 'controls-synaptic' });
            const networkControls = GreenhouseModelsUtil.createElement('div', { id: 'controls-network' });
            const environmentControls = GreenhouseModelsUtil.createElement('div', { id: 'controls-environment' });

            const generalControls = GreenhouseModelsUtil.createElement('div', { id: 'controls-general' });

            // The third canvas (Environment) goes on the left.
            leftColumn.append(canvasEnvironment, environmentControls, generalControls);

            // The first two canvases (Synaptic, Network) and their controls go on the right.
            rightColumn.append(canvasSynaptic, synapticControls, canvasNetwork, networkControls);

            const synapticMetrics = GreenhouseModelsUtil.createElement('div', { id: 'metrics-synaptic' });
            const networkMetrics = GreenhouseModelsUtil.createElement('div', { id: 'metrics-network' });

            // The metrics also go on the right.
            rightColumn.append(synapticMetrics, networkMetrics);

            contentArea.append(leftColumn, rightColumn);
            mainContainer.append(topBanner, contentArea);

            this.replaceMainContainer(targetElement, mainContainer);

            this.populateControlsPanel(synapticControls, 'synaptic');
            this.populateControlsPanel(networkControls, 'network');
            this.populateControlsPanel(document.getElementById('controls-environment'), 'environment');
            this.populateControlsPanel(document.getElementById('controls-general'), 'general');
            this.populateMetricsPanel(synapticMetrics, 'synaptic');
            this.populateMetricsPanel(networkMetrics, 'network');

            this.canvases = {
                synaptic: document.getElementById('canvas-synaptic'),
                network: document.getElementById('canvas-network'),
                environment: document.getElementById('canvas-environment')
            };
            this.contexts = {
                synaptic: this.canvases.synaptic.getContext('2d'),
                network: this.canvases.network.getContext('2d'),
                environment: this.canvases.environment.getContext('2d')
            };

            // Fix for Spanish button/Language Toggle:
            // Force the environment system to re-initialize with the new canvas element.
            this.environmentSystem = null;

            this.resizeAllCanvases();
            this._drawLoadingState(this.contexts.environment, this.canvases.environment);

            // Initialize 3D canvas if module is available
            if (window.GreenhouseModelsUI3D && this.init3DCanvas) {
                this.init3DCanvas();
            }

            // Re-bind controls since we replaced the DOM
            if (window.GreenhouseModelsUX && window.GreenhouseModelsUX.bindSimulationControls) {
                window.GreenhouseModelsUX.bindSimulationControls();
                window.GreenhouseModelsUX.addEnvironmentListeners();
            }

            // Re-bind language toggle in general controls (handled in populateControlsPanel)
            //this.renderTOC(targetElement);
        },

        _drawLoadingState(ctx, canvas) {
            if (!ctx) return;
            const t = (k) => this.util.t(k);
            const { width, height } = canvas;
            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = this.state.darkMode ? '#1A1A1A' : '#E9E9E9';
            ctx.fillRect(0, 0, width, height);
            ctx.fillStyle = this.state.darkMode ? '#FFFFFF' : '#000000';
            ctx.font = '20px "Helvetica Neue", Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(t('loading'), width / 2, height / 2);
        },

        replaceMainContainer(targetElement, newContainer) {
            if (this.state.mainAppContainer && this.state.mainAppContainer.parentNode) {
                this.state.mainAppContainer.remove();
            }
            targetElement.appendChild(newContainer);
            this.state.mainAppContainer = newContainer;
        },

        populateMetricsPanel(panel, type) {
            const t = (k) => this.util.t(k);
            const title = type === 'synaptic' ? t('metrics_title_synaptic') : t('metrics_title_network');

            panel.innerHTML = `
                <h3 class="greenhouse-panel-title">${title}</h3>
                <p>${t('metric_weight')}: <span id="metric-weight-${type}">0.50</span></p>
                <p>${t('metric_neuro')}: <span id="metric-neuro-${type}">0</span></p>
                <p>${t('metric_ions')}: <span id="metric-ions-${type}">0</span></p>
                <p>${t('metric_learning')}: <span id="metric-learning-${type}">0.0</span></p>
            `;
        },

        populateControlsPanel(container, type) {
            const t = (k) => this.util.t(k);
            const controlsPanel = GreenhouseModelsUtil.createElement('div', { className: 'greenhouse-controls-panel' });
            let title = '';
            if (type === 'synaptic') title = t('controls_title_synaptic');
            else if (type === 'network') title = t('controls_title_network');
            else if (type === 'environment') title = t('controls_title_environment');
            else if (type === 'general') title = t('controls_title_general');

            let controlsHtml = `<h3 class="greenhouse-panel-title">${title}</h3>`;

            if (type === 'synaptic' || type === 'network') {
                const isRunning = this.state[type].isRunning;
                const playText = isRunning ? t('btn_pause') : t('btn_play');

                controlsHtml += `
                    <div class="control-group">
                        <label>${t('label_intensity')}</label>
                        <input type="range" min="0" max="100" value="${this.state[type].intensity || 50}" class="greenhouse-slider" id="intensity-slider-${type}">
                    </div>
                    <div class="control-group">
                        <label>${t('label_speed')}</label>
                        <select class="greenhouse-select" id="speed-select-${type}">
                            <option>${t('option_slow')}</option>
                            <option selected>${t('option_normal')}</option>
                            <option>${t('option_fast')}</option>
                        </select>
                    </div>
                    <div class="button-group">
                        <button class="greenhouse-btn greenhouse-btn-secondary" id="play-pause-btn-${type}">${playText}</button>
                        <button class="greenhouse-btn greenhouse-btn-secondary" id="reset-btn-${type}">${t('btn_reset_plasticity')}</button>
                    </div>
                `;
            } else if (type === 'environment') {
                controlsHtml += `
                    <div class="control-group">
                        <label>${t('label_stress')}</label>
                        <input type="range" min="0" max="1" step="0.01" value="${this.state.environment.stress || 0.5}" class="greenhouse-slider" id="stress-slider">
                    </div>
                    <div class="control-group">
                        <label>${t('label_support')}</label>
                        <input type="range" min="0" max="1" step="0.01" value="${this.state.environment.support || 0.5}" class="greenhouse-slider" id="support-slider">
                    </div>
                    <div class="control-group">
                        <label>${t('label_community')}</label>
                        <input type="range" min="0" max="1" step="0.01" value="${this.state.environment.community || 0.5}" class="greenhouse-slider" id="community-slider">
                    </div>
                    <div class="control-group">
                        <label>${t('label_society')}</label>
                        <input type="range" min="0" max="1" step="0.01" value="${this.state.environment.society || 0.5}" class="greenhouse-slider" id="society-slider">
                    </div>
                    <div class="control-group">
                        <label>${t('label_genetic')} (<span id="genetics-value-display">${(this.state.environment.genetics || 0.5).toFixed(2)}</span>)</label>
                        <div class="button-group">
                            <button class="greenhouse-btn greenhouse-btn-secondary" id="gene-btn-1">${t('btn_gene_a')}</button>
                            <button class="greenhouse-btn greenhouse-btn-secondary" id="gene-btn-2">${t('btn_gene_b')}</button>
                        </div>
                        <p class="greenhouse-microcopy" style="font-size: 0.85em; margin-top: 5px; color: #666;">${t('genetics_explain')}</p>
                    </div>
                    <div class="button-group" style="margin-top: 15px;">
                        <button class="greenhouse-btn greenhouse-btn-secondary" id="play-pause-btn-environment">${t('btn_play')}</button>
                        <button class="greenhouse-btn greenhouse-btn-primary" id="toggle-3d-btn">${t('launch_3d')}</button>
                    </div>
                `;
            } else if (type === 'general') {
                controlsHtml += `
                    <div class="button-group">
                        <button class="greenhouse-btn greenhouse-btn-secondary" id="reset-btn-general">${t('btn_reset_sim')}</button>
                        <button class="greenhouse-btn greenhouse-btn-secondary" id="share-btn-general">${t('btn_share')}</button>
                        <button class="greenhouse-btn greenhouse-btn-secondary" id="download-btn-general">${t('btn_download')}</button>
                        <button class="greenhouse-btn greenhouse-btn-secondary" id="dark-mode-toggle">${t('btn_dark_mode')}</button>
                        <button class="greenhouse-btn greenhouse-btn-secondary" id="fullscreen-btn-general">${t('btn_fullscreen')}</button>
                        ${window.GreenhouseUtils && window.GreenhouseUtils.isMobileUser() ? `<button class="greenhouse-btn greenhouse-btn-primary" id="language-btn-general" style="width: auto !important; max-width: fit-content;">${t('btn_language')}</button>` : ''}
                    </div>
                `;
            }

            controlsPanel.innerHTML = controlsHtml;
            container.appendChild(controlsPanel);

            if (type === 'general') {
                const langBtn = controlsPanel.querySelector('#language-btn-general');
                if (langBtn) {
                    langBtn.addEventListener('click', () => {
                        this.util.toggleLanguage();
                        // Re-render the entire interface
                        this.renderSimulationInterface(this.state.targetElement);
                        // Update metrics to restore values
                        this.updateMetrics();
                    });
                }
            }

            if (type === 'synaptic' || type === 'network') {
                const instructionsPanel = GreenhouseModelsUtil.createElement('div', { className: 'greenhouse-controls-panel' });
                const instructionKey = type === 'synaptic' ? 'how_to_synaptic' : 'how_to_network';
                instructionsPanel.innerHTML = `
                    <h3 class="greenhouse-panel-title">${t('how_to_title')}</h3>
                    <p>${t(instructionKey)}</p>
                `;
                container.appendChild(instructionsPanel);
            } else if (type === 'environment') {
                const instructionsPanel = GreenhouseModelsUtil.createElement('div', { className: 'greenhouse-controls-panel' });
                instructionsPanel.innerHTML = `
                    <h3 class="greenhouse-panel-title">${t('how_to_title')}</h3>
                    <p>${t('how_to_env')}</p>
                `;
                container.appendChild(instructionsPanel);
            }
        },

        updateMetrics() {
            document.getElementById('metric-weight-synaptic').textContent = this.state.synaptic.synapticWeight.toFixed(2);
            document.getElementById('metric-neuro-synaptic').textContent = this.state.synaptic.neurotransmitters;
            document.getElementById('metric-ions-synaptic').textContent = this.state.synaptic.ionsCrossed;
            document.getElementById('metric-learning-synaptic').textContent = this.state.synaptic.learningMetric.toFixed(2);
            document.getElementById('metric-weight-network').textContent = this.state.network.synapticWeight.toFixed(4);
        },

        resizeAllCanvases() {
            for (const key in this.canvases) {
                const canvas = this.canvases[key];
                if (canvas) {
                    canvas.width = canvas.offsetWidth;
                    canvas.height = canvas.offsetHeight;
                }
            }
            this.drawSynapticView();
            this.drawNetworkView();
            this.drawEnvironmentView();

            // Resize 3D canvas if active
            if (this.resize3DCanvas && this.isActive) {
                this.resize3DCanvas();
            }
        },

        async renderTOC(tocTargetElement) {
            try {
                console.log('AGENT_DEBUG: UI.renderTOC() called.');
                if (!tocTargetElement) {
                    console.error('AGENT_DEBUG: Target element was not provided to renderTOC.');
                    return;
                }

                // Create a container for the TOC and append it to the provided target.
                const tocContainer = document.createElement('div');
                tocTargetElement.appendChild(tocContainer);

                console.log('AGENT_DEBUG: Loading models_toc.js...');
                const utils = window.GreenhouseUtils || this.util;
                await utils.loadScript('models_toc.js', this.state.baseUrl);

                if (window.GreenhouseModelsTOC && typeof window.GreenhouseModelsTOC.init === 'function') {
                    console.log('AGENT_DEBUG: GreenhouseModelsTOC object found. Calling init().');
                    // Pass the specific container element to init.
                    window.GreenhouseModelsTOC.init({ target: tocContainer });
                } else {
                    console.error('AGENT_DEBUG: GreenhouseModelsTOC.init is not available after loading the script.');
                }
            } catch (error) {
                console.error('AGENT_DEBUG: Failed to render Table of Contents:', error);
            }
        }
    };

    window.GreenhouseModelsUI = GreenhouseModelsUI;
})();
