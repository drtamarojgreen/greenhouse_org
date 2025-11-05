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
        }
    };

    window.GreenhouseModelsUtil = GreenhouseModelsUtil;
})();
