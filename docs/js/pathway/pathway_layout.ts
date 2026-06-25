// docs/js/pathway_layout.js
// Algorithm for generating a 3D layout from 2D KGML data.

(function() {
    'use strict';

    const PathwayLayout = {
        generate3DLayout(data, scaleFactor = 10, zLayerSeparation = 100) {
            if (!data || !data.nodes || data.nodes.length === 0) {
                return [];
            }

            // Find the center of the 2D diagram to normalize coordinates
            const xCoords = data.nodes.map(n => n.x);
            const yCoords = data.nodes.map(n => n.y);
            const xCenter = (Math.min(...xCoords) + Math.max(...xCoords)) / 2;
            const yCenter = (Math.min(...yCoords) + Math.max(...yCoords)) / 2;

            const layout = data.nodes.map(node => {
                const x_3d = (node.x - xCenter) / scaleFactor;
                const y_3d = (node.y - yCenter) / scaleFactor;

                let z_3d = 0;
                switch (node.type) {
                    case 'compound':
                        z_3d = zLayerSeparation;
                        break;
                    case 'gene':
                        z_3d = 0;
                        break;
                    case 'map':
                        z_3d = -zLayerSeparation;
                        break;
                    default:
                        z_3d = 0;
                }

                return {
                    ...node,
                    position3D: { x: x_3d, y: -y_3d, z: z_3d } // Invert Y-axis for typical 3D coordinate systems
                };
            });

            return layout;
        }
    };

    window.PathwayLayout = PathwayLayout;
    console.log('PathwayLayout loaded.');

})();
