
(function() {
    'use strict';

    const GreenhouseModelsUtil = {
        createElement(tag, attributes = {}, ...children) {
            const el = document.createElement(tag);
            Object.entries(attributes).forEach(([key, value]) => {
                if (key === 'className') {
                    el.setAttribute('class', value);
                } else {
                    el.setAttribute(key, value);
                }
            });
            children.forEach(child => {
                if (typeof child === 'string') {
                    el.appendChild(document.createTextNode(child));
                } else {
                    el.appendChild(child);
                }
            });
            return el;
        }
    };

    window.GreenhouseModelsUtil = GreenhouseModelsUtil;
})();
