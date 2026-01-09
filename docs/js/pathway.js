// docs/js/pathway.js
// Entry point and dependency loader for the Pathway Viewer application.

(function() {
    'use strict';

    const GreenhousePathwayApp = {

        async init(containerSelector) {

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

            // This is a simplified loader for the test harness.
            // In a real environment, greenhouse.js would handle this.
            for (const script of scriptsToLoad) {
                const scriptTag = document.createElement('script');
                scriptTag.src = script;
                document.head.appendChild(scriptTag);
            }

            // The scripts are loaded asynchronously, so we need to wait for the viewer to be ready.
            const interval = setInterval(() => {
                if (window.GreenhousePathwayViewer && window.GreenhousePathwayViewer.init) {
                    clearInterval(interval);
                    window.GreenhousePathwayViewer.init(containerSelector);
                }
            }, 100);
        }
    };

    window.GreenhousePathwayApp = GreenhousePathwayApp;

})();
