
(function() {
    'use strict';

    const GreenhouseUtil = {
        // Shared utility functions can be added here.

        /**
         * Wraps text to fit within a specified width.
         * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
         * @param {string} text - The text to wrap.
         * @param {number} x - The x-coordinate where the text starts.
         * @param {number} y - The y-coordinate where the text starts.
         * @param {number} maxWidth - The maximum width of a line.
         * @param {number} lineHeight - The height of a line.
         */
        wrapText(ctx, text, x, y, maxWidth, lineHeight) {
            const words = text.split(' ');
            let line = '';
            let currentY = y;

            for (let n = 0; n < words.length; n++) {
                const testLine = line + words[n] + ' ';
                const metrics = ctx.measureText(testLine);
                const testWidth = metrics.width;
                if (testWidth > maxWidth && n > 0) {
                    ctx.fillText(line, x, currentY);
                    line = words[n] + ' ';
                    currentY += lineHeight;
                } else {
                    line = testLine;
                }
            }
            ctx.fillText(line, x, currentY);
        },

        /**
         * Returns a contrasting text color based on the background color.
         * @param {string} backgroundColor - The background color in rgba format.
         * @returns {string} - The contrasting text color ('#FFFFFF' or '#000000').
         */
        getContrastingTextColor(backgroundColor) {
            const rgb = backgroundColor.match(/\d+/g);
            if (!rgb) return '#000000'; // Default to black if parsing fails

            const r = parseInt(rgb[0]);
            const g = parseInt(rgb[1]);
            const b = parseInt(rgb[2]);

            // Calculate luminance
            const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

            return luminance > 0.5 ? '#000000' : '#FFFFFF';
        }
    };

    // Attach the utility object to the main application object
    // Assuming 'Greenhouse' is your main namespace.
    if (window.Greenhouse) {
        window.Greenhouse.Util = GreenhouseUtil;
    } else {
        window.GreenhouseUtil = GreenhouseUtil; // Fallback for standalone use
    }

})();
