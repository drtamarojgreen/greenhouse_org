import { GreenhouseUtils } from './GreenhouseUtils.js';
import { GreenhouseDataAdapter } from './data_adapter.js';
import { GreenhouseModelsGraph } from './models_graph.js';
import { GreenhouseModelGraphViewer } from './model_graph_viewer.js';
import { GreenhouseGraphParser } from './graph_parser.js';
import { GreenhouseModelsUX } from './models_ux.js';

console.log('Models App: Explicit module dependencies loaded.');

const entryScript = document.querySelector('script[data-greenhouse-models-entry]');
const targetSelector = entryScript?.getAttribute('data-target-selector-left') || '#models-app-container';
const baseUrl = new URL(entryScript?.getAttribute('data-base-url') || '/', document.baseURI).href;

GreenhouseModelsUX.configure({ baseUrl, targetSelector });

async function initializeModelsApp() {
    try {
        await GreenhouseDataAdapter.init(baseUrl);
        GreenhouseModelsUX.init();
        await GreenhouseUtils.renderModelsTOC(targetSelector);
    } catch (error) {
        console.error('Models App: Initialization failed:', error);
        GreenhouseUtils.displayError(`Failed to load simulation components: ${error.message}`);
    }
}

initializeModelsApp();
