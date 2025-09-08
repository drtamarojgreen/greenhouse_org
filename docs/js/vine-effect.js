(function() {
    'use strict';

    const config = {
        elementWaitTimeout: 10000,
        targetSelector: "#SITE_PAGES_TRANSITION_GROUP div section.wixui-section:nth-child(1) div section div > div > div.wixui-rich-text h2", // New config for selector
        idToApply: "greenhouse-title-for-vine-effect"
    };

    function waitForElementBySelector(selector, timeout = config.elementWaitTimeout) {
        return new Promise((resolve, reject) => {
            const findElement = () => {
                return document.querySelector(selector);
            };

            let element = findElement();
            if (element) {
                console.log(`Vine Effect: Element found with selector: ${selector}`); // Added log
                resolve(element);
                return;
            }

            const observer = new MutationObserver(() => {
                element = findElement();
                if (element) {
                    observer.disconnect();
                    resolve(element);
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Element with selector "${selector}" not found.`));
            }, timeout);
        });
    }

    async function activateVineEffect() {
        try {
            const heading = await waitForElementBySelector(config.targetSelector);
            if (!heading || heading.dataset.vineInitialized === 'true') return;

            heading.id = config.idToApply;
            heading.dataset.originalText = heading.textContent;
            heading.dataset.vineInitialized = 'true';
            heading.classList.add('vine-effect-active');

            heading.innerHTML = heading.dataset.originalText.split('').map(char => {
                return `<span>${char === ' ' ? '&nbsp;' : char}</span>`;
            }).join('');

            const svgNS = "http://www.w3.org/2000/svg";
            const svg = document.createElementNS(svgNS, "svg");
            svg.setAttribute("class", "vine-svg");
            svg.setAttribute("viewBox", "0 0 800 120");

            const path = document.createElementNS(svgNS, "path");
            path.setAttribute("class", "vine-path");
            path.setAttribute("d", "M10,110 C150,-30 250,150 400,60 S550,-30 700,60 S790,100 790,100");

            svg.appendChild(path);
            heading.appendChild(svg);

            const pathLength = path.getTotalLength();
            path.style.strokeDasharray = pathLength;
            path.style.strokeDashoffset = pathLength;

            setTimeout(() => {
                heading.classList.add('animation-running');
            }, 100);

        } catch (error) {
            console.error('Vine Effect Error:', error);
        }
    }

    function initialize() {
        activateVineEffect();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        // Give Wix a moment to finish rendering
        setTimeout(initialize, 500);
    }

})();