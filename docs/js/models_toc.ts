/// <reference path="types/globals.d.ts" />

interface TOCConfig {
    xmlPath: string;
    target: string;
    baseUrl?: string;
}

interface TOCState {
    isInitialized: boolean;
}

interface TOCOptions {
    baseUrl?: string;
    target?: string | HTMLElement;
}

const GreenhouseModelsTOC = {
    config: {
        xmlPath: 'endpoints/model_descriptions.xml',
        target: '#models-toc-container'
    } as TOCConfig,
    state: {
        isInitialized: false
    } as TOCState,
    container: null as HTMLElement | null,
    lastOptions: null as TOCOptions | null,
    resilienceObserver: null as MutationObserver | null,

    init(options: TOCOptions = {}): void {
        this.lastOptions = options;
        this.config.baseUrl = options.baseUrl;
        const target = options.target || this.config.target;
        let container: HTMLElement | null = null;

        if (typeof target === 'string') {
            container = document.querySelector(target) as HTMLElement | null;
        } else if (target instanceof HTMLElement || (target && typeof target === 'object' && 'classList' in target)) {
            container = target as HTMLElement;
        }

        if (!container) {
            console.error('AGENT_DEBUG: TOC target container could not be found in the DOM.');
            return;
        }

        // Automatic Class Attachment: Ensure the styles in models_toc.css are applied regardless of the ID.
        container.classList.add('models-toc-container');

        // Clear container for a clean render and store the reference.
        container.innerHTML = '';
        this.container = container;

        console.log('AGENT_DEBUG: TOC init() started.');
        this.fetchDataAndRender();
        this.state.isInitialized = true;

        this.observeAndReinitializeApp(container);
    },

    observeAndReinitializeApp(container: HTMLElement | null): void {
        if (!container) return;
        if (this.resilienceObserver) this.resilienceObserver.disconnect();
        const observerCallback = (mutations: MutationRecord[]) => {
            const wasRemoved = mutations.some(m => Array.from(m.removedNodes).some(n => n.nodeType === 1 && (n as HTMLElement).classList.contains('models-toc-grid')));
            if (wasRemoved) {
                console.log('AGENT_DEBUG: TOC removed, re-initializing...');
                if (this.resilienceObserver) this.resilienceObserver.disconnect();
                this.init(this.lastOptions || {});
            }
        };
        this.resilienceObserver = new MutationObserver(observerCallback);
        this.resilienceObserver.observe(container, { childList: true });
    },

    async fetchDataAndRender(): Promise<void> {
        try {
            // Adjust the base URL based on the main app's state if available
            const baseUrl = this.config.baseUrl || ((window as any).GreenhouseModelsUX ? (window as any).GreenhouseModelsUX.state.baseUrl : './');

            const response = await fetch(`${baseUrl}${this.config.xmlPath}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const xmlText = await response.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, "application/xml");
            console.log('AGENT_DEBUG: Successfully fetched and parsed model_descriptions.xml.');

            this.renderComponent(xmlDoc);
        } catch (error: any) {
            console.error('AGENT_DEBUG: Error fetching or parsing XML for TOC:', error);
            const t = (k: string) => (window as any).GreenhouseModelsUtil ? (window as any).GreenhouseModelsUtil.t(k) : k;
            if (this.container) {
                this.container.innerHTML = `<p>${t('err_loading_models')}</p>`;
            }
        }
    },

    renderComponent(xmlDoc: Document): void {
        const container = this.container;
        if (!container) return;

        // Render Intro
        const intro = xmlDoc.querySelector('intro');
        if (intro) {
            const introDiv = document.createElement('div');
            introDiv.className = 'models-toc-intro';

            Array.from(intro.getElementsByTagName('paragraph')).forEach(p => {
                const pElem = document.createElement('p');
                pElem.textContent = p.textContent;
                introDiv.appendChild(pElem);
            });
            container.appendChild(introDiv);
        }

        // Create Grid for Models
        const grid = document.createElement('div');
        grid.className = 'models-toc-grid';
        container.appendChild(grid);

        const models = xmlDoc.getElementsByTagName('model');
        for (let i = 0; i < models.length; i++) {
            const model = models[i];
            const modelId = model.getAttribute('id') || 'unknown';

            const titleElem = model.getElementsByTagName('title')[0];
            const title = titleElem ? (titleElem.textContent || '').trim() : 'Unknown Model';

            const urlElem = model.getElementsByTagName('url')[0];
            const rawPath = (urlElem && urlElem.textContent) ? urlElem.textContent.trim() : `/${modelId}`;

            // Ensure path starts with /
            const finalPath = rawPath.startsWith('/') ? rawPath : '/' + rawPath;

            // Create Card
            const card = document.createElement('div');
            card.className = 'model-toc-card';

            // Title Section
            const cardTitleElem = document.createElement('h3');
            cardTitleElem.textContent = title;
            card.appendChild(cardTitleElem);

            // Description Container
            const descContainer = document.createElement('div');
            descContainer.className = 'description-container';
            descContainer.style.flex = '1';

            const description = model.querySelector('description');
            if (description) {
                const firstPara = description.getElementsByTagName('paragraph')[0];
                if (firstPara) {
                    const pElem = document.createElement('p');
                    pElem.textContent = firstPara.textContent;
                    descContainer.appendChild(pElem);
                }
            }
            card.appendChild(descContainer);

            // Actions Section (Buttons)
            const actionGroup = document.createElement('div');
            actionGroup.className = 'button-group';

            // Launch Button
            const launchLink = document.createElement('a');

            // Absolute URL Construction for Production
            const canonicalDomain = 'https://www.greenhousemd.org';
            launchLink.href = canonicalDomain + finalPath;

            const t = (k: string) => (window as any).GreenhouseModelsUtil ? (window as any).GreenhouseModelsUtil.t(k) : k;
            launchLink.className = 'greenhouse-btn greenhouse-btn-primary';
            launchLink.textContent = t('launch_btn');

            actionGroup.appendChild(launchLink);
            card.appendChild(actionGroup);

            grid.appendChild(card);
        }
        console.log('AGENT_DEBUG: TOC rendered with card layout and class-based fix.');
        this.addEventListeners();
    },

    addEventListeners(): void {
        // Placeholder for future interactions
        console.log('AGENT_DEBUG: TOC dynamic interactions ready.');
    }
};

(window as any).GreenhouseModelsTOC = GreenhouseModelsTOC;
