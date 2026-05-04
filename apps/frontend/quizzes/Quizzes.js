/**
 * @file Quizzes.js
 * @description Wix Velo frontend code for the Quizzes page.
 * This script fetches quiz data and populates a hidden text element for the embedded app.
 */

import { fetch } from 'wix-fetch';

$w.onReady(function () {
    // Configuration
    const config = {
        jsonUrl: 'https://drtamarojgreen.github.io/greenhouse_org/endpoints/quizzes.json',
        targetElementId: '#hiddenQuizzesData' // ID of the hidden text element within the target div
    };

    const hiddenElement = $w(config.targetElementId);

    // Ensure the data element is hidden and collapsed immediately
    if (hiddenElement) {
        hiddenElement.hide();
        hiddenElement.collapse();
    }

    /**
     * @function loadQuizzes
     * @description Fetches quizzes and populates the hidden bridge element.
     */
    async function loadQuizzes() {
        console.log('Quizzes: Fetching data from ' + config.jsonUrl);
        try {
            const response = await fetch(config.jsonUrl, { method: 'get' });
            if (!response.ok) {
                throw new Error('HTTP error! status: ' + response.status);
            }
            const data = await response.json();
            
            if (hiddenElement) {
                hiddenElement.text = JSON.stringify(data);
                console.log('Quizzes: Successfully populated ' + config.targetElementId);
            } else {
                console.warn('Quizzes: Target element ' + config.targetElementId + ' not found.');
            }
        } catch (error) {
            console.error('Quizzes: Failed to load quizzes', error);
        }
    }

    // Start the loading process
    loadQuizzes();
});
