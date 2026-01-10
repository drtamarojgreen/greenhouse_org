// docs/js/synapse_app.js
// Main application logic for the Synapse Visualization

(function () {
    'use strict';

    console.log("Synapse App: Module loaded.");

    const GreenhouseSynapseApp = {
        canvas: null,
        ctx: null,
        container: null,
        cameraController: null,
        mockConnection: {
            weight: 1,
            synapseDetails: { // Initialize to activate the 3D particle simulation
                vesicles: [],
                mitochondria: [],
                particles: []
            }
        },

        init(targetSelector, baseUrl) {
            console.log(`Synapse App: Initializing in container: ${targetSelector}`);
            this.baseUrl = baseUrl || '';
            this.container = document.querySelector(targetSelector);
            if (!this.container) {
                console.error(`Synapse App: Target container not found.`);
                return;
            }
            this.setupDOM();
            this.cameraController = new window.NeuroSynapseCameraController();
            this.animate();
        },

        setupDOM() {
            this.container.innerHTML = '';
            this.container.style.cssText = 'display: flex; flex-direction: row; gap: 20px; padding: 20px; background-color: #F8F9FA; border-radius: 12px;';

            const sidebar = document.createElement('div');
            sidebar.style.cssText = 'flex: 1; max-width: 30%; color: #212529; font-family: "Helvetica Neue", Arial, sans-serif;';
            sidebar.innerHTML = `
                <h1 style="font-size: 28px; margin-bottom: 15px;">Synaptic Cleft</h1>
                <p style="font-size: 16px; line-height: 1.6;">
                    This 3D model shows neurotransmission. Use your mouse to rotate, pan (Shift + Drag), and zoom.
                </p>
                <div id="legend-container"></div>
            `;
            this.container.appendChild(sidebar);

            const canvasWrapper = document.createElement('div');
            canvasWrapper.style.cssText = 'flex: 2; height: 500px; position: relative; border: 1px solid #DEE2E6; border-radius: 8px; overflow: hidden;';
            this.canvas = document.createElement('canvas');
            this.canvas.style.cssText = 'width: 100%; height: 100%;';
            this.ctx = this.canvas.getContext('2d');
            canvasWrapper.appendChild(this.canvas);
            this.container.appendChild(canvasWrapper);

            this.canvas.addEventListener('mousedown', (e) => this.cameraController.handleMouseDown(e, this.canvas, { x: 0, y: 0, w: this.canvas.width, h: this.canvas.height }));
            window.addEventListener('mousemove', (e) => this.cameraController.handleMouseMove(e, this.canvas));
            window.addEventListener('mouseup', (e) => this.cameraController.handleMouseUp(e));
            this.canvas.addEventListener('wheel', (e) => this.cameraController.handleWheel(e, this.canvas, { x: 0, y: 0, w: this.canvas.width, h: this.canvas.height }));
            this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

            window.addEventListener('resize', () => this.resize());
            this.resize();
        },

        resize() {
            if (!this.canvas) return;
            this.canvas.width = this.canvas.offsetWidth;
            this.canvas.height = this.canvas.offsetHeight;
        },

        animate() {
            requestAnimationFrame(() => this.animate());
            this.render();
        },

        render() {
            if (!this.ctx || !this.cameraController || !window.GreenhouseNeuroSynapse || !window.GreenhouseData || !window.SynapseElements) return;

            this.drawLegend();

            const ctx = this.ctx;
            const w = this.canvas.width;
            const h = this.canvas.height;

            ctx.fillStyle = '#F8F9FA';
            ctx.fillRect(0, 0, w, h);

            this.cameraController.update();
            const camera = this.cameraController.getCamera();

            window.GreenhouseNeuroSynapse.drawSynapsePiP(ctx, 0, 0, w, h, this.mockConnection, window.GreenhouseData.synapseMeshes, true, camera);
        }
    };

    window.GreenhouseSynapseApp = GreenhouseSynapseApp;

    GreenhouseSynapseApp.drawLegend = function() {
        const legendContainer = document.getElementById('legend-container');
        if (!legendContainer) return;

        const config = window.SynapseElements.config;
        const lang = this.currentLanguage || 'en';

        const legendItems = [
            { label: config.translations.preSynapticTerminal[lang], color: config.preSynapticColor },
            { label: config.translations.postSynapticTerminal[lang], color: config.postSynapticColor },
            { label: config.translations.vesicle[lang], color: config.vesicleColor },
            { label: config.translations.ionChannel[lang], color: config.ionChannelColor },
            { label: config.translations.gpcr[lang], color: config.gpcrColor },
            { label: config.translations.calciumBlocker[lang], color: config.blockerColor },
        ];

        let html = `<h3 style="font-size: 20px; margin-bottom: 10px;">${config.translations.legendTitle[lang]}</h3><ul style="list-style: none; padding: 0; margin: 0;">`;
        legendItems.forEach(item => {
            html += `<li style="display: flex; align-items: center; margin-bottom: 8px;">
                <span style="width: 20px; height: 20px; background-color: ${item.color}; border-radius: 4px; margin-right: 10px; border: 1px solid #CCC;"></span>
                <span>${item.label}</span>
            </li>`;
        });
        html += `</ul>`;

        legendContainer.innerHTML = html;
    };
})();
