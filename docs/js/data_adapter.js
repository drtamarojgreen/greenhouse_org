(function () {
    'use strict';

    const GreenhouseDataAdapter = {
        store: {
            health: {},
            genomics: {}
        },

        init() {
            // In a real app, this would call APIs.
            // Here we simulate fetching data.
            console.log('GreenhouseDataAdapter: Initializing and fetching data...');
            return this._fetchData().then(() => {
                console.log('GreenhouseDataAdapter: Data fetched successfully.', this.store);
            });
        },

        _fetchData() {
            return fetch('endpoints/models_environment_api.json')
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.health) this.store.health = data.health;
                    if (data.genomics) this.store.genomics = data.genomics;
                })
                .catch(error => {
                    console.error('GreenhouseDataAdapter: Fetch failed', error);
                    // Fallback or error handling could go here
                });
        },

        getValue(path) {
            // path example: 'health.active_medications'
            if (!path) return null;
            return path.split('.').reduce((obj, key) => obj && obj[key], this.store);
        }
    };

    window.GreenhouseDataAdapter = GreenhouseDataAdapter;
})();
