import { fetch } from 'wix-fetch';

$w.onReady(function () {
    // The base URL for fetching application assets from the GitHub Pages site.
    const dataBaseUrl = 'https://drtamarojgreen.github.io/greenhouse_org/endpoints/';
    const synapseDataUrl = `${dataBaseUrl}models_synapses.json`;

    console.log('Synapse: Fetching data from', synapseDataUrl);

    fetch(synapseDataUrl, { method: 'get' })
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
        })
        .then(synapseData => {
            const dataElement = $w('#synapseDataElement');
            if (dataElement) {
                // Use the textbox as a data bridge to pass data to the browser script
                dataElement.text = JSON.stringify(synapseData);
                dataElement.hide(); // Ensure the element is not visible to the user
                console.log('Synapse: visualization data loaded and passed to #synapseDataElement.');
            } else {
                console.error('Synapse: Critical error - #synapseDataElement not found on the page.');
            }
        })
        .catch(err => {
            console.error("Synapse: Error fetching or parsing visualization data:", err);
        });
});
