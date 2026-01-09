// docs/js/pathway.js
// Entry point and dependency loader for the Pathway Viewer application.

(function() {
    'use strict';

    const GreenhousePathwayApp = {

        loadScript(url) {
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = url;
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        },

        async init(containerSelector) {
            try {
                // Define the correct loading order for the native 3D engine and our application
                const scriptsToLoad = [
                    'js/models_util.js',
                    'js/models_3d_math.js',
                    'js/brain_mesh_realistic.js',
                    'js/neuro_ui_3d_geometry.js',
                    'js/neuro_camera_controls.js',
                    'js/neuro_ui_3d_brain.js',
                    'js/pathway_viewer.js'
                ];

                for (const script of scriptsToLoad) {
                    await this.loadScript(script);
                }

                // All scripts are loaded, now initialize the main viewer
                if (window.GreenhousePathwayViewer) {
                    window.GreenhousePathwayViewer.init(containerSelector);
                } else {
                    console.error('Pathway App: GreenhousePathwayViewer failed to load.');
                }

            } catch (error) {
                console.error('Pathway App: Failed to load critical dependencies.', error);
            }
        }
    };

    window.GreenhousePathwayApp = GreenhousePathwayApp;

})();
