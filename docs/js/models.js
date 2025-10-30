// docs/js/models.js

(function() {
    'use strict';

    const GreenhouseModels = {
        init(targetSelector) {
            this.targetElement = document.querySelector(targetSelector);
            if (!this.targetElement) {
                console.error('Models App: Target element not found');
                return;
            }

            this.renderConsentScreen();
        },

        renderConsentScreen() {
            const container = this.createElement('div', { className: 'greenhouse-landing-container' });

            const title = this.createElement('h1', { className: 'greenhouse-simulation-title' }, 'Neural Plasticity & CBT/DBT');
            const intro = this.createElement('p', {}, 'This is a browser-based educational simulation that visually demonstrates how CBT and DBT practice can conceptually drive neural plasticity. It is an educational simulation only, not clinical treatment.');

            const disclaimer = this.createElement('div', { className: 'greenhouse-disclaimer-banner' }, 'Simulation — Educational model only. Not a substitute for clinical care.');

            const consentLabel = this.createElement('label', { className: 'greenhouse-consent-label' });
            const consentCheckbox = this.createElement('input', { type: 'checkbox', id: 'consent-checkbox', className: 'greenhouse-consent-checkbox' });
            consentLabel.appendChild(consentCheckbox);
            consentLabel.appendChild(document.createTextNode('I understand this simulation is educational only and not a substitute for clinical care.'));

            const startButton = this.createElement('button', { id: 'start-simulation-btn', className: 'greenhouse-btn-primary' }, 'Start Simulation');
            startButton.disabled = true;

            container.appendChild(title);
            container.appendChild(intro);
            container.appendChild(disclaimer);
            container.appendChild(consentLabel);
            container.appendChild(startButton);

            this.targetElement.appendChild(container);

            this.addEventListeners();
        },

        renderSimulationInterface() {
            this.targetElement.innerHTML = ''; // Clear the consent screen

            const mainContainer = this.createElement('div', { className: 'simulation-main-container' });

            // Top Banner
            const topBanner = this.createElement('div', { className: 'greenhouse-disclaimer-banner' }, 'Simulation — not clinical therapy.');

            // Main Content Area (using a flexbox or grid layout)
            const contentArea = this.createElement('div', { style: 'display: flex; gap: 20px; margin-top: 20px;' });

            // Left column for canvas and metrics
            const leftColumn = this.createElement('div', { style: 'flex: 3;' });

            // Canvas
            const canvas = this.createElement('canvas', { id: 'simulation-canvas', style: 'width: 100%; height: 400px; background: #f0f0f0; border-radius: 12px;' });

            // Metrics Panel
            const metricsPanel = this.createElement('div', { className: 'greenhouse-metrics-panel' });
            const metricsTitle = this.createElement('h3', { className: 'greenhouse-panel-title' }, 'Metrics');
            const synapticWeight = this.createElement('p', {}, 'Synaptic Weight: 0.5');
            const neurotransmitters = this.createElement('p', {}, 'Neurotransmitters Released: 0');
            const ionsCrossed = this.createElement('p', {}, 'Ions Crossed: 0');
            const learningMetric = this.createElement('p', {}, 'Learning Metric: 0');
            metricsPanel.append(metricsTitle, synapticWeight, neurotransmitters, ionsCrossed, learningMetric);

            leftColumn.append(canvas, metricsPanel);

            // Right column for controls and instructions
            const rightColumn = this.createElement('div', { style: 'flex: 1;' });

            // Controls Panel
            const controlsPanel = this.createElement('div', { className: 'greenhouse-controls-panel' });
            const controlsTitle = this.createElement('h3', { className: 'greenhouse-panel-title' }, 'Controls');

            const intensityLabel = this.createElement('label', {}, 'Practice Intensity');
            const intensitySlider = this.createElement('input', { type: 'range', min: '0', max: '100', value: '50', className: 'greenhouse-slider' });

            const speedLabel = this.createElement('label', {}, 'Simulation Speed');
            const speedSelect = this.createElement('select', { className: 'greenhouse-select' });
            ['Slow', 'Normal', 'Fast'].forEach(speed => {
                const option = this.createElement('option', {}, speed);
                speedSelect.appendChild(option);
            });

            const playPauseBtn = this.createElement('button', { className: 'greenhouse-btn-secondary' }, 'Play/Pause');
            const resetBtn = this.createElement('button', { className: 'greenhouse-btn-secondary' }, 'Reset Plasticity');

            controlsPanel.append(controlsTitle, intensityLabel, intensitySlider, speedLabel, speedSelect, playPauseBtn, resetBtn);

            // Instructions Panel
            const instructionsPanel = this.createElement('div', { className: 'greenhouse-controls-panel' });
            const instructionsTitle = this.createElement('h3', { className: 'greenhouse-panel-title' }, 'Instructions');
            const instructionsText = this.createElement('p', {}, 'Adjust the "Practice Intensity" to see how it affects the neural connections.');
            instructionsPanel.append(instructionsTitle, instructionsText);

            rightColumn.append(controlsPanel, instructionsPanel);

            contentArea.append(leftColumn, rightColumn);

            // Footer
            const footer = this.createElement('div', { style: 'text-align: center; margin-top: 20px; font-size: 0.8em; color: #888;' }, 'Prompt version: 1.0.0');

            mainContainer.append(topBanner, contentArea, footer);
            this.targetElement.appendChild(mainContainer);
        },


        addEventListeners() {
            const consentCheckbox = document.getElementById('consent-checkbox');
            const startButton = document.getElementById('start-simulation-btn');

            consentCheckbox.addEventListener('change', () => {
                startButton.disabled = !consentCheckbox.checked;
            });

            startButton.addEventListener('click', () => {
                this.renderSimulationInterface();
            });
        },

        createElement(tag, attributes = {}, ...children) {
            const element = document.createElement(tag);
            for (const key in attributes) {
                element[key] = attributes[key];
            }
            children.forEach(child => {
                if (typeof child === 'string') {
                    element.appendChild(document.createTextNode(child));
                } else {
                    element.appendChild(child);
                }
            });
            return element;
        }
    };

    // Expose to global scope for the main loader
    window.GreenhouseModels = GreenhouseModels;

})();
