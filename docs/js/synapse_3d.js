// docs/js/synapse_3d.js

(function () {
    'use strict';

    const G = window.GreenhouseSynapseApp || {};
    window.GreenhouseSynapseApp = G;

    G.Visuals3D = {
        applyDepth(ctx, w, h) {
            ctx.save();
            // Implement 3D depth using a slight perspective tilt
            // Note: This must be wrapped in save/restore to avoid persistent state leakage
            ctx.setTransform(1, 0.02, 0, 1, 0, 0);
        },

        drawShadows(ctx, particles) {
            // Note: This is called by the main render loop.
            // It sets the state for subsequent particle drawing.
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowOffsetX = 5;
            ctx.shadowOffsetY = 5;
        },

        restoreDepth(ctx) {
            ctx.restore();
        }
    };
})();
