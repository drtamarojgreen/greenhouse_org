import { fetch } from 'wix-fetch';

$w.onReady(function () {
    // The base URL for fetching application assets from the GitHub Pages site.
    const dataBaseUrl = 'https://drtamarojgreen.github.io/greenhouse_org/endpoints/';
    const pathwayDataUrl = `${dataBaseUrl}kegg_dopaminergic_raw.xml`;

    console.log('Pathway: Fetching data from', pathwayDataUrl);

    fetch(pathwayDataUrl, { method: 'get' })
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.text();
        })
        .then(pathwayData => {
            const dataElement = $w('#pathwayDataElement');
            if (dataElement) {
                // Use the textbox as a data bridge to pass data to the browser script
                dataElement.text = pathwayData;
                dataElement.hide(); // Ensure the element is not visible to the user
                console.log('Pathway: visualization data loaded and passed to #pathwayDataElement.');
            } else {
                console.error('Pathway: Critical error - #pathwayDataElement not found on the page.');
            }
        })
        .catch(err => {
            console.error("Pathway: Error fetching or parsing visualization data:", err);
        });
});
