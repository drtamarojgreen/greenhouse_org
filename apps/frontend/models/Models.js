import { fetch } from 'wix-fetch';

$w.onReady(function () {
const dataBaseUrl = 'https://drtamarojgreen.github.io/greenhouse_org/endpoints/';
const urls = {
brain: `${dataBaseUrl}models_brain.json`,
synapse: `${dataBaseUrl}models_synapses.json`,
environment: `${dataBaseUrl}models_environment.json`
};

Promise.all([
fetch(urls.brain, { method: 'get' }).then(res => res.json()),
fetch(urls.synapse, { method: 'get' }).then(res => res.json()),
fetch(urls.environment, { method: 'get' }).then(res => res.json())
])
.then(([brainData, synapseData, environmentData]) => {
const visualizationData = {
brain: brainData,
synapse: synapseData,
environment: environmentData
};
// Expose the data on the window object for the static script to access
window._greenhouseModelsData = visualizationData;
console.log('Models visualization data loaded and exposed.');
})
.catch(err => {
console.error("Error fetching or parsing models visualization data:", err);
});
});
