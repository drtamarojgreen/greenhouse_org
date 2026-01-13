// docs/js/pathway_geometry.js
// Dedicated geometry generator for the Pathway visualization.

(function() {
    'use strict';

    const GreenhousePathwayGeometry = {
        /**
         * Initializes the brain shell geometry for the pathway viewer.
         * This version is decoupled from the Neuro-specific enhancements
         * and uses the realistic brain mesh if available.
         *
         * @param {object} brainShell - The object to populate with vertices and faces.
         */
        initializeBrainShell(brainShell) {
            // Prioritize the realistic brain mesh if the script is loaded
            if (window.GreenhouseBrainMeshRealistic) {
                const realisticBrain = window.GreenhouseBrainMeshRealistic.generateRealisticBrain();
                brainShell.vertices = realisticBrain.vertices;
                brainShell.faces = realisticBrain.faces.map(face => ({ indices: face, region: null }));
                brainShell.regions = realisticBrain.regions;
                console.log('Pathway Geometry: Loaded realistic brain mesh.');
                return;
            }

            // Fallback to a basic sphere if the realistic mesh is not available
            console.warn('Pathway Geometry: GreenhouseBrainMeshRealistic not found. Falling back to basic sphere.');
            this.generateFallbackSphere(brainShell);
        },

        /**
         * Generates a basic sphere as a fallback representation of the brain.
         *
         * @param {object} brainShell - The object to populate with vertices and faces.
         */
        generateFallbackSphere(brainShell) {
            const radius = 200;
            const latitudeBands = 30;
            const longitudeBands = 30;

            brainShell.vertices = [];
            brainShell.faces = [];

            for (let lat = 0; lat <= latitudeBands; lat++) {
                const theta = (lat * Math.PI) / latitudeBands;
                const sinTheta = Math.sin(theta);
                const cosTheta = Math.cos(theta);

                for (let lon = 0; lon <= longitudeBands; lon++) {
                    const phi = (lon * 2 * Math.PI) / longitudeBands;
                    const sinPhi = Math.sin(phi);
                    const cosPhi = Math.cos(phi);

                    const x = radius * cosPhi * sinTheta;
                    const y = radius * cosTheta;
                    const z = radius * sinPhi * sinTheta;

                    brainShell.vertices.push({ x, y, z });
                }
            }

            for (let lat = 0; lat < latitudeBands; lat++) {
                for (let lon = 0; lon < longitudeBands; lon++) {
                    const first = lat * (longitudeBands + 1) + lon;
                    const second = first + longitudeBands + 1;

                    const face1 = { indices: [first, second, first + 1], region: null };
                    const face2 = { indices: [second, second + 1, first + 1], region: null };

                    brainShell.faces.push(face1);
                    brainShell.faces.push(face2);
                }
            }
        }
    };

    window.GreenhousePathwayGeometry = GreenhousePathwayGeometry;

})();
