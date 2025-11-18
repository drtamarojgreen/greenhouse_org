// docs/js/models_util.js

(function() {
    'use strict';

    const GreenhouseModelsUtil = {
        createElement(tag, attributes, ...children) {
            const element = document.createElement(tag);
            for (const key in attributes) {
                if (key === 'className') {
                    element.className = attributes[key];
                } else {
                    element.setAttribute(key, attributes[key]);
                }
            }
            children.forEach(child => {
                if (typeof child === 'string') {
                    element.appendChild(document.createTextNode(child));
                } else {
                    element.appendChild(child);
                }
            });
            return element;
        },

        parseDynamicPath(pathString, context) {
            return pathString.replace(/\b(w|h|tw|psy)\b/g, match => context[match]);
        },

        getRegionDescription(regionKey) {
            const descriptions = {
                pfc: 'The Prefrontal Cortex is crucial for executive functions like planning, decision-making, and regulating social behavior.',
                amygdala: 'The Amygdala is central to processing emotions, particularly fear, and is a key part of the brain’s threat-detection system.',
                hippocampus: 'The Hippocampus plays a major role in learning and memory, converting short-term memories into more permanent ones.'
            };
            return descriptions[regionKey] || 'No information available for this region.';
        },

        wrapText(context, text, x, y, maxWidth, lineHeight) {
            const words = text.split(' ');
            let line = '';

            for (let n = 0; n < words.length; n++) {
                const testLine = line + words[n] + ' ';
                const metrics = context.measureText(testLine);
                const testWidth = metrics.width;
                if (testWidth > maxWidth && n > 0) {
                    context.fillText(line, x, y);
                    line = words[n] + ' ';
                    y += lineHeight;
                } else {
                    line = testLine;
                }
            }
            context.fillText(line, x, y);
        }
    };

    window.GreenhouseModelsUtil = GreenhouseModelsUtil;
})();
