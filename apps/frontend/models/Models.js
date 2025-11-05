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
// Use the textbox as a data bridge to pass data to the browser script
const dataElement = $w('#dataTextElement');
dataElement.text = JSON.stringify(visualizationData);
dataElement.hide(); // Ensure the element is not visible to the user
console.log('Models visualization data loaded and passed to #dataTextElement.');
})
.catch(err => {
console.error("Error fetching or parsing models visualization data:", err);
});
});
